# Rendimiento y comparación — pulido de A / alpha.3

Fecha de actualización: 2026-10-26 (Bogotá). Alpha.3 continúa abierta, sin cierre ni publicación verificada. Evidencia local y medios del 2026-10-23 corresponden al runtime `7e6f68b`; las optimizaciones actuales no se declaran validadas con esos resultados. CI 40030195058 fallida: 23 E2E aprobadas, dos fallos FPS y tres omisiones. Diagnóstico 40031439886 finalizado, sin gate FPS; suite local posterior 146/146 en 33 archivos y build verdes. A requiere OK del usuario; teléfono aplazado, B/C sujetos a aprobación.

## Benchmark estándar final dentro de los 40 m

Estado local nuevo al 2026-10-26: 153/153 unitarias en 33 archivos y build correctos; benchmark estándar y medios en regeneración. La pasada intermedia del arte nuevo, 50,36/60,00 FPS, precede la densidad low final y no se presenta como resultado final. Low actual: 12.994 triángulos/12 calls, +840 triángulos frente a la etapa anterior por cuatro brotes en vez de dos; high intacto 33.364/18. Mínimo revisado como candidato local, no aprobado por el usuario. Atlas actual 9.843 bytes; mapas 173.971 bytes y cadena mipmap compartida 65.532 bytes en memoria, magnitudes distintas.

Los datos de esta sección corresponden al benchmark del 2026-10-23, anterior a la prioridad de profundidad y a los cambios artísticos que se están integrando el 2026-10-26. No son una validación del runtime nuevo.

El [diagnóstico CI 40031439886](../render-diagnostic-ci/report.json) terminó correctamente como captura de profiler, no como gate FPS: stationary 20,99 FPS y moving 30,17 FPS bajo instrumentación. ScriptDuration aproximado 0,57/0,65 s frente a TaskOther 4,50/4,34 s orienta la investigación hacia render más que JavaScript, sin atribución absoluta ni equivalencia con un benchmark sin profiler. Sus cpuprofiles se conservan junto al informe.

Validación remota focal posterior: [workflow 40339380259](https://github.com/OdinTKD/ciclovia-bogota-xr/actions/runs/40339380259), commit `cef53c6`, dos E2E de rendimiento CPU 4× correctos con los mismos umbrales. Muestra corta sol 40,60 FPS; lluvia 51,19 FPS fuera de la zona artística. Recorrido sol 47,51 FPS y lluvia 46,40 FPS, máximos 28/29 calls y 28.208/30.128 triángulos, ratio mínimo 0,75. JSON en `depth-order-ci/`; esta pasada no es full CI ni publicación ni validación del arte nuevo todavía pendiente.

La prioridad de profundidad opaca tiene [TDD](../../tdd/opaque-depth-order.md) y [comparación de píxeles](../../screenshots/gate-a-polish/depth-order/pixel-diff.json): portrait sol idéntico, landscape sol media RGB inferior a 0,001/255; lluvia animada no exacta, inferior a 0,051/255. La comparación no acredita por sí misma 30 FPS ni cubre cambios artísticos posteriores. Suite local posterior: 146/146 unitarias en 33 archivos y build correcto; rendimiento final aún pendiente.

Muestra quieta de 6 s a unos 14 m, sin vídeo durante la medición; no equivale al recorrido completo ni a teléfono.

| Entorno / clima | FPS promedio | Máximo calls / triángulos | Render |
| --- | --- | --- | --- |
| [Software sol](sample-software-mobile.json) | 53,520 | 28 / 28.208 | 309×629; ratio 0,75; low/diffuse, sin sombras/MSAA |
| [Software lluvia](sample-software-mobile.json) | 52,689 | 29 / 30.128 | 309×629; ratio 0,75; low/diffuse, sin sombras/MSAA |
| [GPU sol](sample-hardware-desktop.json) | 60,00 | 32 / 48.738 | 1280×720; ratio 1; high/PBR, sombras/MSAA |
| [GPU lluvia](sample-hardware-desktop.json) | 60,00 | 33 / 50.658 | 1280×720; ratio 1; high/PBR, sombras/MSAA |

Software: SwiftShader, CPU 4×, CSS 412×839 y DPR emulado 2,625. GPU: Intel Arc 140T D3D11 en Chrome. No garantiza 30 FPS por frame ni compatibilidad de teléfono. Alto y mínimo tienen calidad y resolución distintas; no mezclarlos como si fueran equivalentes.

[Estrés adicional CPU 8×](stress-final/sample-software-mobile.json): sol 48,400 FPS, 28 calls/28.208 triángulos; lluvia 48,035 FPS, 29 calls/30.128 triángulos, mismo 309×629/ratio 0,75. Complementa sin sustituir la prueba CI CPU 4×/30 FPS.

## Comparación y optimizaciones

Ciudad estática: 9 → 2 calls con 6.196 triángulos intactos; pools compactos y actualización solo al cambiar. Low usa iluminación Lambert interpolada por vértice conservando mapas/alpha/fog/luces/clima, sin cálculo trasero innecesario; high restaura shader original. [TDD](../../tdd/vertex-diffuse.md) y [render/pools](../../tdd/render-work.md).

A/B posterior a 309×629 y CPU 4×: [base aislada](recheck-before/sample-software-mobile.json) 60,00/59,84 FPS; [candidato](recheck-vertex/sample-software-mobile.json) 60,00/59,50 FPS, sol/lluvia. Calls 35/36 → 28/29 con mismos 28.208/30.128 triángulos. Ambos saturan ~60 y cambia carga de entorno: no atribuir ganancia causal de FPS. Primera optimización intermedia falló a 25,43 FPS y se conserva en `first-optimization-failed.json`.

Comparación visual antes/después: misma pose inicial, cámara mundo (0;1,65;1,3), FOV 65, DPR 1, ratio 1, high/PBR/sombras/MSAA; landscape 1280×720 y portrait 412×839. [Antes](../../screenshots/gate-a-polish/before/comparison.json) y [después](../../screenshots/gate-a-polish/after/comparison.json). Capturas y vídeos ya regenerados para el runtime final; no reutilizar los contadores anteriores a la optimización como resultado actual. Los FPS cortos guardados durante capturas no son benchmark.

## Mínimo visual y recuperación

Comparación final de contadores a la misma pose, ratio 1 y calidad high:

| Formato/clima | Calls antes → después | Triángulos antes → después |
| --- | --- | --- |
| Landscape sol | 36 → 32 | 39.478 → 48.738 |
| Landscape lluvia | 37 → 33 | 41.398 → 50.658 |
| Portrait sol | 36 → 34 | 39.478 → 49.418 |
| Portrait lluvia | 37 → 35 | 41.398 → 51.338 |

No equivale a comparar FPS de benchmarks: el candidato contiene más detalle y las capturas se toman con composición/calidad fijadas.

Ratio mínimo elevado de 0,375 a 0,75. High desde 1; recuperación +0,125 tras 8 s con media ≤18 ms y espera 20 s tras sobrecarga. Mantener 30 FPS, máximos 100 calls/100.000 triángulos; no rebajar nitidez para pasar CI. [Captura del mínimo](../../screenshots/gate-a-polish/minimum/sun.png), [lluvia](../../screenshots/gate-a-polish/minimum/rain.png) y [reporte](../../screenshots/gate-a-polish/minimum/report.json) del runtime final.

La revisión local del mínimo encontró vía, guantes y controles legibles, con copas dispersas/detalle fino limitado. Dedos sin articulación, copas ornamentales y resto de 200 m con arte básico tras fundido superficial 40–52 m: límites visibles, no aprobación del usuario.

## Medios, procedencia y publicación

Vídeos [landscape](../../../public/review/polish/landscape.webm) y [portrait](../../../public/review/polish/portrait.webm), y sus [eventos](../../videos/gate-a-polish/landscape-events.json), del runtime final. Recorrido real por teclado con carro 110 m y peatón 160 m antes de meta y llegada a 200 m sin inyectar estado. La codificación del vídeo no mide FPS del juego.

Modelo original Blender: 10.516 triángulos, 11 llamadas geométricas, 4 materiales, 274.308 bytes. Entorno high 33.364/18 y low 12.154/12, cifras de módulo. Mapas Poly Haven CC0: 185.009 bytes, leaf RGBA 20.881 bytes. [Manifest](../../../assets/environment-alpha3/manifest.json), [avisos](../../../THIRD_PARTY_NOTICES.md) y [alcance](../../architecture/gate-a-polish.md).

Medios finales: landscape 30,32 s a 1280×720, 8.556.328 bytes; portrait 8,64 s a 412×838, 1.056.118 bytes, alto redondeado a par por el codificador. El [smoke local](local-verification.json) verifica versión alpha.3, SHA del modelo y tres mapas, ocho imágenes decodificadas y ambos vídeos reproducidos, cero errores. La llegada real se mantiene en 200 m, salud 65 y una colisión, con ambos encuentros visibles. Los FPS del vídeo no miden el juego. Publicación todavía pendiente.

Fallos preservados: CI 40025326519 por leer diagnóstico antes del primer frame, corregido sincronizando con drawCalls>0/canvas real sin bajar aserciones; CI 40026175320 por presupuestos lentos en su host. [Primer log](ci-initial-failure.log) y [segundo log](ci-second-failure.log). Tercer fallo: [CI 40030195058](ci-third-failure.log), sol corto 20,7567 FPS y lluvia de recorrido 29,8068 FPS, 23 aprobadas/2 fallidas/3 omitidas. El sol del recorrido sí pasó. No se anuncia publicación verde con esos runs. Datos previos están identificados como `pre-optimization-*`.

Pendientes: CI y smoke públicos finales de versión/GLB/mapas/galería/vídeos, revisión/OK del usuario. Teléfono aplazado; alpha.2 y CHANGELOG intactos hasta evidencia final.
