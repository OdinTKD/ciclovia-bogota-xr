# Rendimiento UI y resolución mínima — 2026-10-23

## Regresión observada

CI 39986520796, con código de juego sin cambios, falló a 26.2219 fps en sol incluso con DPR .5. El umbral mínimo de 30 FPS se mantiene; esta evidencia corresponde a laboratorio y no certifica dispositivos físicos.

## Rojo

- Prueba nueva `npx playwright test tests/e2e/ui-performance.spec.ts --project=desktop`: falló porque un HUD estacionario generó 48 mutaciones `childList/characterData/subtree` en 350 ms; se esperaba cero. El jugador inicia sin pedalear, observador sobre el DOM real.
- `npm test -- tests/unit/quality.test.ts`: 2 fallos esperados, ratio mínimo era .5 y se requirió .375 para equipos limitados; las otras 5 pruebas pasaron.

## Verde

- UI escribe `textContent`, `hidden` y ancho de progreso solo cuando cambia el valor. Actualizaciones estructurales, clase de juego y traslado del nodo de ajustes ocurren únicamente al cambiar de fase.
- Ratio mínimo real del renderer admitido por el controlador: .375. Se conserva la media de 12 muestras reales, sin upgrades y sin modificar FPS.
- E2E 1/1 pasó (6.5 s), HUD estacionario cero mutaciones.

## Refactor y verificación

- Cache de nodos por ID evita búsquedas repetidas del DOM y conserva los controles existentes.
- `npm test -- tests/unit/quality.test.ts`: 7/7 verdes.
- `npm run check`: exit 0.
- `npx playwright test tests/e2e/ui-performance.spec.ts --project=desktop`: 1/1 verde (6.9 s).
- Un intento intermedio se interrumpió por navegación/HMR durante `page.evaluate`; se repitió sin cambios de archivos y pasó.
- Las mediciones completas de FPS sol/lluvia quedan a cargo de integración; cero mutaciones del HUD comprueba la optimización y no sustituye el presupuesto real.

## Instrumentación del benchmark
- La prueba de FPS se separa en tests/e2e/performance.spec.ts, sin grabación de trazas/capturas que añaden trabajo de readback no presente durante el juego. Las pruebas funcionales siguen conservando trazas ante fallos.
- Este cambio no modifica el umbral de 30 fps, el límite de 100 draw calls ni los 100000 triángulos; se conservan contadores mínimos que comprueban escena no vacía.
- Una pasada local sin trazas todavía falló a 29,09 fps; no se atribuye toda la caída al trazado. Se continúa optimizando draw calls de pools inactivos.

## Integración final local
- Se eliminan seis draw calls de pools inactivos con regresión específica en docs/tdd/actor-rendering.md.
- npm test: 63/63 en 15 archivos; npm run build correcto; npm run test:e2e: 7 correctos y 1 omitido (presupuesto duplicado escritorio), 46,3 s.
- Benchmark real final: sol 37,95 fps, 20 draw calls, 15126 triángulos; lluvia 35,18 fps, 24 draw calls, 17622 triángulos; DPR .375. Datos completos docs/performance/022-local-*.json.
- Refactor de formato y suites mantienen TypeScript y pruebas verdes; la validación remota será registrada una vez completada.
