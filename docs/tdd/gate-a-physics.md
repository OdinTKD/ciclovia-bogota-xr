# Puerta A — reloj único, conducción orientada y contactos

Fecha: 2026-10-23, Bogotá. Subagente: Motor / Física / Vehículos.
Trabajo iniciado a las 17:29 UTC y validación de este alcance a las 17:38 UTC, dentro del spike de 45 minutos acordado por el orquestador. Este documento acredita el motor; la aprobación visual/interactiva y el cierre de versión corresponden a la integración.

## Rojo

Se escribieron primero `game-loop.test.ts`, `bicycle-controller.test.ts` y `gate-a-physics.test.ts`.

Comando:

```sh
npx vitest run tests/unit/game-loop.test.ts tests/unit/bicycle-controller.test.ts tests/integration/gate-a-physics.test.ts
```

Resultado inicial: 3 archivos fallaron, 6 pruebas fallaron y las otras dos suites no pudieron importar los módulos nuevos aún inexistentes. Faltaban `setWorld`, `moveBicycle`, el reloj común y el controlador. El caso frontal/lateral mostró ambos resultados idénticos de 2,8 m/s; los campos de pose ausentes produjeron `NaN` en la comparación. Evidencia conservada: [gate-a-red.txt](gate-a-red.txt).

## Verde

Se implementó un único acumulador de 1/60 s, controlador cinemático orientado, stats con unidades explícitas, barridos de formas Rapier con movimiento relativo, resolución por deslizamiento/separación y un `world.step()` por tick. El tráfico se invoca por tick mediante un adaptador; las consultas legacy ya no avanzan el reloj.

Una regresión adicional detectó velocidad acumulada contra un sólido: la bici permanecía detenida físicamente pero informaba **4,94 m/s** tras pedalear contra la pared. Primero se añadió y ejecutó la prueba; falló al exigir menos de 0,1 m/s. Se corrigió proyectando la velocidad autorizada por contactos sobre la dirección de la bicicleta, también durante el cooldown de daño. Evidencia: [gate-a-blocked-speed-red.txt](gate-a-blocked-speed-red.txt).

El conjunto focal inicial pasó **22/22 en 6 archivos**, incluyendo las pruebas existentes de simulación, vehículo y física. Evidencia: [gate-a-green.txt](gate-a-green.txt).

## Refactor

Se extrajeron la conversión de normales locales y la clasificación de contacto a `src/physics/contacts.ts`, sin cambiar comportamiento. Después se amplió la cobertura de actor rotado, conteo de pasos con 20 actores, radio de giro, llegada a 200 m y recorrido original mediante la integración física real.

```sh
npx vitest run tests/unit/game-loop.test.ts tests/unit/bicycle-controller.test.ts tests/integration/gate-a-physics.test.ts tests/unit/simulation.test.ts tests/unit/vehicles.test.ts tests/integration/physics.test.ts tests/integration/journey.test.ts
npm run check
git diff --check -- src/core/simulation.ts src/core/game-loop.ts src/physics src/vehicles tests/unit/game-loop.test.ts tests/unit/bicycle-controller.test.ts tests/integration/gate-a-physics.test.ts tests/integration/journey.test.ts
```

Resultado final del alcance: **26/26 pruebas en 7 archivos**, TypeScript correcto y diff sin errores de whitespace. Evidencia de la suite: [gate-a-refactor.txt](gate-a-refactor.txt). Las advertencias de normalización LF/CRLF de Git no fueron errores.

## Criterios comprobados

- Un paso Rapier por tick con cero o veinte actores; consultas sin avance; pausa, meta y reinicio detienen/restablecen el reloj. Catch-up limitado a 15 ticks por frame.
- Teclado/demanda de dirección gira el manillar detenido sin trasladar ni girar el chasis. El movimiento en marcha produce arcos simétricos.
- Radio medido dentro de 5 % del modelo `wheelbase / tan(steeringAngle)` por debajo del límite de agarre.
- Desde 8 m/s, sin pedal, frenada en 4–5 m con sol y 6–7 m con lluvia; velocidad final inferior a 0,1 m/s.
- Replay con contactos Rapier a frames de 30, 60 y 120 Hz: posiciones difieren menos de 1 cm y yaw menos de 0,1 grado en el mismo runtime.
- Obstáculo delgado, actor que cruza entre endpoints separados y sólido rotado: contacto detectado; penetración final no mayor de 2 cm en los fixtures.
- Roce lateral mantiene avance tangencial; frontal causa mayor pérdida de velocidad y salud. Contacto repetido no repite daño antes del cooldown de 1,5 s.
- Estabilidad alta amortigua antes la velocidad lateral residual de impacto, sin modificar el yaw automáticamente.
- El modo de prueba de 200 m llega a meta y reinicia la pose completa. El recorrido original activa ambos tipos de reto y contabiliza una única llamada Rapier por tick.

## Contrato y límites del spike

`simulation.setWorld(physics, {step(dt, state), reset()})` es la entrada única de integración. `step` devuelve movimientos de actores con poses `from/to`, IDs y semiextensiones. `main` no llama adicionalmente a `world.step`, consultas para aplicar daño ni a la actualización de tráfico por frame.

Coordenadas: +X derecha, +Y arriba, avance inicial −Z; yaw positivo gira a la derecha, por lo que el quaternion Rapier y la rotación Y de Three usan −yaw. Metros, segundos y radianes. `turnRate=2.6` conserva exclusivamente su significado legacy, sin reutilizarlo como ángulo. Los campos nuevos declaran rueda/ángulo/respuesta/aceleración lateral por separado.

En el corredor recto actual, `x` sigue siendo desplazamiento lateral, `worldZ` es posición real y `distance` conserva el máximo progreso longitudinal alcanzado; retroceder no concede nuevos puntos. El trazado curvo completo y su proyección pertenecen a otra entrega. El tramo no se presenta como una calle medida.

La respuesta es arcade cinemática explícita; no son impulsos dinámicos automáticos de Rapier. Cuatro slices y margen angular conservador cubren el giro de la bicicleta y formas orientadas del spike. Los actores actuales mantienen orientación durante el cruce; no se certifica CCD angular general para carros girando violentamente ni resolución general de aplastamientos entre varios cinemáticos forzados. Las futuras trayectorias reactivas deberán impedir configuraciones sin espacio libre.

La validación aquí es automatizada y geométrica. No acredita conducción en un teléfono físico, aprobación artística, FPS del build integrado ni despliegue; esos resultados deben registrarse por el orquestador antes de cerrar la entrega.
