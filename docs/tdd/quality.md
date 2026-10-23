# Calidad adaptativa — 2026-10-23

## Evidencia de regresión de rendimiento

La ejecución CI https://github.com/OdinTKD/ciclovia-bogota-xr/actions/runs/39984796789 informó 11.657 fps con viewport móvil y CPU 4×; los cuatro flujos funcionales pasaron y el presupuesto FPS falló. Es una medición de laboratorio independiente del controlador. No equivale a rendimiento medido en celular físico.

## TDD

1. Rojo: `npm test -- tests/unit/quality.test.ts` exit 1, no existía `src/rendering/quality`. Pruebas escritas antes de implementar.
2. Verde: mismo comando exit 0, cinco pruebas pasan. Cubren límites iniciales, reducción después de 12 frames lentos consecutivos, recuperación que reinicia racha, ignorar muestras inválidas, ausencia de mejoras durante gameplay y mínimo .5.
3. Refactor: extraer constantes para límites, objetivo y longitud de racha. Mismo comando: 5/5 verdes. `npm run check`: exit 0.

## Contrato e integración

`createQualityController(initialRatio=1.5)` expone getters `ratio`, `revision` y `sample(ms)`. Devuelve true únicamente si cambia el ratio. Reduce a la mitad, mínimo .5; no mejora automáticamente para evitar oscilaciones. El controlador no modifica muestras temporales ni FPS. El integrador aplica `renderer.setPixelRatio(quality.ratio)` al cambiar y reinicia la ventana de medición del nuevo régimen de resolución; debe volver a medir >=60 muestras reales y comprobar >=30 FPS sin aflojar presupuesto.

La validación E2E posterior a integración queda a cargo del Orquestador; estas pruebas no certifican por sí solas el presupuesto de rendimiento.

## Regresión de adaptación con frames intercalados — 2026-10-23

- Tras integrar la primera versión, `npx playwright test --project=mobile --grep presupuesto` falló: 26.307 fps y pixelRatio 1.5 según diagnóstico informado por el Orquestador. Las rachas de 12 frames lentos nunca se completaban aunque la media incumplía el presupuesto.
- Rojo: añadir regresión `[50, 50, 16]` repetida cuatro veces. `npm test -- tests/unit/quality.test.ts`: 1 fallo esperado, 6 pasan. El último sample devolvió false en vez de true con media 38.667 ms.
- Verde: ventanas no solapadas de 12 muestras válidas y decisión por media. Mismo comando 7/7 pasan; `npm run check` exit 0.
- Refactor: expresar el criterio con `missedFrameBudget` usando tamaño fijo de ventana; mismo comando 7/7 pasan. La ventana y suma se reinician al terminar cada bloque; frames inválidos no cuentan. Las pruebas verifican ventana completa, frames intercalados, media en objetivo, ausencia de upgrades, descarte de ventana anterior, inválidos y límite mínimo/revision.
- Sustituye el criterio de rachas documentado arriba. API no cambia. La prueba E2E de >=30 fps y >=60 muestras sigue intacta y pendiente de la siguiente medición integrada.

## Integración real
- CI inicial 39984796789: presupuesto falló a 11,657 fps; no se publicó el artefacto.
- Integración inicial por rachas falló también localmente a 26,307 fps y DPR 1,5. La media de ventanas corrige este caso sin cambiar el umbral de 30 fps.
- Se desactiva backdrop-filter en controles móviles para evitar recomponer desenfoque de pantalla completa.
- Cambio de DPR limpia la ventana de medición para separar regímenes de resolución; no se alteran los tiempos medidos. La prueba sigue exigiendo >60 muestras, >=30 fps, >10000 triángulos y >20 draw calls.
- Validación final local: npm test 61/61, build correcto, E2E 5 correctos/1 omitido (presupuesto redundante escritorio), 29,5 s. Sol 38,30 fps y lluvia 35,67 fps en esta pasada; datos completos en docs/performance/quality-local-*.json. Una pasada anterior sí adaptó a DPR 0,75 y pasó ambos climas (46,75/44,43 fps).
