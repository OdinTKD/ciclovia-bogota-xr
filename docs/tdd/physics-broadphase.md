# Filtro conservador de consultas físicas

2026-10-26, Bogotá. Motor/física, QA y documentación coordinada por el orquestador.

## Evidencia y rojo

El perfil posterior a preparar Rapier conserva aproximadamente 79.7 ms en
`castShape` y 47.2 ms en `contactShape` (tiempos inclusivos, sin sumar wrappers
hijos). En el centro de la vía se consultan ambos bordes separados cuatro veces
por tick: ocho barridos y ocho contactos.

Pruebas escritas antes del filtro; stub conservador `return true` mantiene todas
las consultas. Primera ejecución 11:05:32 mostró además un fixture de tangencia
incorrecto, corregido comprobando directamente Rapier. Regresión válida a las
11:05:54, `npm test -- tests/unit/physics-broadphase.test.ts`:

```text
Tests 3 failed | 2 passed (5)
castShape esperado 0, observado 8
Separación inequívoca: esperado false, observado true
Oráculo: ningún candidato lejano se descarta todavía
```

El fixture float32 comprobado usa z=1200.00007 y otro centro z+1.00801.
Rapier redondea los centros a 1200.0001220703125 y 1201.008056640625,
y devuelve distancia 0.00793463, dentro de SKIN=0.008. Un filtro double sin
margen podría descartar ese contacto real.

## Diseño conservador

Intervalo de centros relativos durante todo el barrido; semiejes AABB obtenidos
de los cuboids rotados y ya inflados con el padding angular del controlador.
Solo se rechaza separación estricta en algún eje. El margen incluye SKIN,
redondeo float32 dependiente de coordenadas/tamaños y conversión de velocidades.
Valores no finitos o dimensiones inválidas conservan la consulta a Rapier.
Contactos estáticos de recuperación aplican la misma comprobación sin barrido.

## Preparación de kernels conservada

Tras el filtro, los bordes del mundo desechable también quedan descartados.
Regresión escrita antes de adaptar la preparación, ejecutada a las 11:08:27:

```text
npm test -- tests/unit/physics-preparation.test.ts
Tests 2 failed | 4 passed (6)
Falta el actor cercano en la preparación.
castShape se llamó 0 veces: ya no se preparaban consultas reales.
```

El actor adicional solo existe en el mundo desechable: centro x=0.555, semieje
x=0.2, dejando una separación de 0.005 respecto a la bicicleta, dentro de SKIN.
El mundo nuevo del jugador continúa con un único cuerpo/collider y pasos cero.

## Verde y refactor

Filtro verde a las 11:07:23: **5/5** pruebas. Preparación cercana añadida después
de su rojo: a las 11:09:04, **11/11** pruebas de filtro/preparación y TypeScript
correcto. El margen de velocidad incluye ambos valores antes de restarlos,
para conservar contactos incluso con una traslación común grande que se cancele
en aritmética double pero cambie ligeramente al cuantizar a float32.

Refactor: factor de margen compartido y documentado; yaw cero usa semiejes
directos, sin llamadas trigonométricas; el resto conserva senos/cosenos. El
helper no construye objetos ni arrays por consulta. A las 11:10:15:

```text
npm test -- tests/unit/physics-broadphase.test.ts tests/unit/physics-preparation.test.ts tests/unit/simulation.test.ts tests/unit/game-loop.test.ts tests/unit/bicycle-controller.test.ts tests/unit/vehicles.test.ts tests/integration
Test Files 9 passed (9)
Tests 37 passed (37)
npm run check
tsc --noEmit: correcto
git diff --check: correcto en los archivos de esta tarea
```

Conteos y comprobaciones:

- Tick central: **8 → 0 castShape** y **8 → 0 contactShape**, mismo movimiento,
  cero pasos durante consultas y un paso al llamar `stepFixed`.
- Oráculo de **600 escenarios con semilla fija**, posiciones cercanas y a
  z=-1200, rotaciones, padding angular, movimiento relativo y grandes velocidades
  comunes: todos los barridos/contactos positivos de Rapier siguen siendo
  candidatos. El test exige más de 100 barridos positivos, 40 contactos y 50
  descartes; no basta un filtro que conserve todo.
- **160 ticks por implementación** (frente, roce, cruce móvil y recuperación):
  poses, velocidades y contactos exactamente iguales con filtro y con el helper
  forzado a conservar todas las consultas. Ambas variantes usan Rapier real.
- Suite física existente conserva esquinas/rotaciones, impactos, recuperación,
  cooldown, llegada/reinicio y equivalencia a 30/60/120 Hz.
- Preparación desechable sigue ejecutando barridos y contactos reales; ningún
  actor ni paso de preparación aparece en el mundo del jugador.

Los escenarios deterministas complementan el argumento geométrico; no prueban
todos los números posibles de IEEE754. Valores dudosos mantienen Rapier, y el
margen deliberadamente amplio favorece falsos positivos frente a falsos negativos.
No hubo navegador, cambios de E2E, arte, resolución o umbrales. FPS integrado y
despliegue siguen pendientes del orquestador: reducción de consultas no demuestra
por sí sola 30 FPS.
