# Preparación física antes de comenzar

2026-10-26, Bogotá. Motor/física y QA; integración y documentación/versionado coordinadas por el orquestador.

## Defecto comprobado

El perfil local de inicio comenzó antes del click de comenzar. El primer
`FireAnimationFrame` dura 2532.876 ms; dentro de `physics.stepFixed -> Rapier.step`
la traza registra `wasm.CompileLazy` para la función 2664 (1852.162 ms) y 356
(325.964 ms). Hay 87 eventos de compilación perezosa, con 2409.874 ms acumulados.
Ver `docs/performance/start-diagnostic/analysis.json`, perfil y traza asociados.
La instrumentación añade sobrecoste: identifica la fase, no un benchmark aprobado.

La preparación gráfica no recorre estos kernels: la simulación retorna sin
avanzar mientras está en `ready`. La solución usa un mundo desechable con los
mismos dos bordes, `moveBicycle` y un `stepFixed`, lo libera y crea otro mundo
para el jugador. No se filtran frames de juego ni se altera la física normal.

## Rojo

`npm test -- tests/unit/physics-preparation.test.ts`, 10:44:37: falta el módulo.
Después de añadir una implementación equivalente al comportamiento anterior
(`return factory()`), ejecución real a las 10:44:49:

```text
Tests 4 failed | 1 passed (5)
El resultado es el primer mundo en lugar de un segundo mundo nuevo.
Los errores de moveBicycle/stepFixed no se producen porque nunca se preparan.
No se llega a la segunda creación ni a la liberación del mundo desechable.
```

Las pruebas verifican secuencia, parámetros idénticos de bordes/paso fijo,
liberación ante errores y un mundo Rapier real con un solo cuerpo/collider,
pose inicial, contador cero y exactamente un paso tras el primer tick normal.

## Instancia WebAssembly

Se leyó el sourcemap instalado de `@dimforge/rapier3d-compat` 0.21.0,
`dist/rapier.mjs.map`: `gen3d/init.ts` llama `wasmInit`, cuyo
`__wbg_init` retorna inmediatamente el `wasm` existente cuando ya está definido.
Crear otro `RAPIER.World` reutiliza esa instancia; el segundo `init()` puede
decodificar el base64, pero no instancia ni compila otra vez el módulo.

Además se verificó en un proceso Node nuevo interceptando
`WebAssembly.instantiate`, llamando y esperando `RAPIER.init()` dos veces:

```json
{"firstInitInstantiationCount":1,"afterSecondInit":1,"reused":true}
```

## Verde y refactor

A las 10:45:22, **5/5 verdes** y `npm run check` correcto. Implementación:
preparar dos bordes, barrido inmóvil y un paso fijo, liberar en `finally`, crear
el mundo nuevo. `main.ts` sustituye únicamente import/llamada de creación por
la preparación; la promesa sigue dentro del arranque previo a `ready`.

Refactor: extraer la construcción de los bordes a `preparationBoundaries` para
separar la configuración de la secuencia y documentar el contrato. A las
10:46:14:

```text
npm test -- tests/unit/physics-preparation.test.ts tests/unit/simulation.test.ts tests/unit/game-loop.test.ts tests/integration/physics.test.ts tests/integration/journey.test.ts
Test Files 5 passed (5)
Tests 14 passed (14)
npm run check
tsc --noEmit: correcto
git diff --check: correcto en los cuatro archivos de esta tarea
```

No se modifican `world.ts`, la simulación, el reloj, los tests E2E ni la
medición de frames jugando. La preparación puede aumentar el tiempo anterior
a `ready`; mueve trabajo de inicialización comprobado fuera de la interacción.
No garantiza la compilación anticipada de todos los posibles kernels de futuros
choques. Perfil posterior, benchmark completo y CI corresponden al orquestador;
esta subtarea no afirma aún una mejora medida ni ausencia definitiva del tirón.

## Conservación posterior ante filtro de consultas — 2026-10-26

El filtro conservador incorporado después descarta correctamente los bordes
lejanos de la preparación. Para seguir preparando los kernels de consultas,
el mundo desechable añade un actor a 0.005 m de la superficie de la bicicleta,
dentro de SKIN. Sigue haciendo un único paso y liberándose antes de crear el
mundo del jugador. Regresión roja y verde, conteos y validación completa en
[physics-broadphase.md](physics-broadphase.md). La prueba real mantiene un solo
cuerpo/collider, pasos cero y pose inicial en el mundo entregado a la partida.
