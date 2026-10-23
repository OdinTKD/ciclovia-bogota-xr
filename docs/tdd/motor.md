# Motor / Física — 2026-10-23

Responsable: subagente Motor / Física. Alcance: simulación determinista de bici tradicional / Paseo y sensores Rapier reales.

## Rojo

Antes de crear implementación se escribieron `tests/unit/simulation.test.ts` y `tests/integration/physics.test.ts`.

Comando: `npm test -- tests/unit/simulation.test.ts tests/integration/physics.test.ts`.

Resultado inicial, 10:47:26 Bogotá: 2 suites fallidas, por módulos ausentes `../../src/core/simulation` y `../../src/physics/world`. Código de salida 1. Causa esperada: comportamiento inexistente.

## Verde

Se implementó paso fijo 1/60s, inicio, pausa, reinicio, ruta 1200m configurable, aceleración, freno, límites de carretera, salud, invulnerabilidad temporal, puntuación y agarre reducido en lluvia. Los sensores utilizan colliders y `world.intersectionPair` de Rapier WASM.

La primera ejecución de integración (10:47:56) detectó correctamente que Rapier excluye por defecto intersecciones kinematic/fixed: 5 pruebas verdes y 1 roja. Se habilitó explícitamente `ActiveCollisionTypes.ALL` en el sensor.

Mismo comando, 10:48:03 Bogotá: **2 archivos, 6 pruebas aprobadas**, salida 0.

## Refactor

Se extrajeron constantes de paso fijo/ancho de carretera y descripción de sensor con explicación del filtro Rapier. Sin cambio de comportamiento.

Mismo comando, 10:48:15 Bogotá: **2 archivos, 6 pruebas aprobadas**, salida 0.

Cobertura conductual: inicio seguro, pausa/reanudación, aceleración/frenado, límites de giro, lluvia, colisión e invulnerabilidad, reinicio completo, final del recorrido, puntuación, reproducibilidad entre tamaños de frame, rechazo de tiempo no finito, intersecciones Rapier cercanas/lejos y actualización de posición.

Validación adicional `npm run check`: impedida inicialmente por configuración externa al alcance del subagente (`types: ['@webxr/types']`, TS2688). Se comunicó al Orquestador para su corrección y validación global.
