# Vehículos — 2026-10-23

Responsable: subagente Vehículos (segunda tanda del agente Motor/Física).

## Rojo

Se escribieron primero pruebas de estadísticas de la bici tradicional, selección exclusiva del MVP, rechazo de vehículos futuros y desaceleración al dejar de pedalear.

`npm test -- tests/unit/vehicles.test.ts`, 10:48:54 Bogotá: 1 suite fallida, salida 1, módulo `../../src/vehicles/catalog` ausente. Causa esperada.

## Verde

Catálogo original mínimo y selección estricta de bici tradicional. Simulación consume sus valores de velocidad, aceleración y giro sin alterar API. Estabilidad queda documentada como estadística de balance; no se atribuye física adicional inexistente.

`npm test -- tests/unit/vehicles.test.ts tests/unit/simulation.test.ts tests/integration/physics.test.ts`, 10:49:05 Bogotá: **3 archivos, 8 pruebas aprobadas**, salida 0.

## Refactor

Se documentaron unidades y se extrajo constante de resistencia de rodadura. Se repitió el comando completo: **3 archivos, 8 pruebas aprobadas**, salida 0. El test demuestra desaceleración con throttle cero sin aplicar freno.

No se implementaron vehículos de fases posteriores. Se mantienen los límites del MVP.
