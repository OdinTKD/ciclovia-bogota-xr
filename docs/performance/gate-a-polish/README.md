# Rendimiento y comparación — pulido de A / alpha.3

Fecha: 2026-10-23. Estado: 143/143 unitarias en 32 archivos y build correctos tras optimización. Runtime congelado para capturas/vídeos finales y CI; publicación pendiente. Base `153b739`. A sigue abierta, aprobación artística pendiente y teléfono aplazado hasta modelo/OS/navegador reales.

## Benchmark estándar final dentro de los 40 m

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

Comparación visual antes/después: misma pose inicial, cámara mundo (0;1,65;1,3), FOV 65, DPR 1, ratio 1, high/PBR/sombras/MSAA; landscape 1280×720 y portrait 412×839. [Antes](../../screenshots/gate-a-polish/before/comparison.json) y [después](../../screenshots/gate-a-polish/after/comparison.json). Capturas y vídeos se regeneran ahora para el runtime final; no reutilizar los contadores anteriores a la optimización como resultado actual. Los FPS cortos guardados durante capturas no son benchmark.

## Mínimo visual y recuperación

Ratio mínimo elevado de 0,375 a 0,75. High desde 1; recuperación +0,125 tras 8 s con media ≤18 ms y espera 20 s tras sobrecarga. Mantener 30 FPS, máximos 100 calls/100.000 triángulos; no rebajar nitidez para pasar CI. [Captura del mínimo](../../screenshots/gate-a-polish/minimum/sun.png), [lluvia](../../screenshots/gate-a-polish/minimum/rain.png) y [reporte](../../screenshots/gate-a-polish/minimum/report.json) en regeneración final.

La revisión local del mínimo encontró vía, guantes y controles legibles, con copas dispersas/detalle fino limitado. Dedos sin articulación, copas ornamentales y resto de 200 m con arte básico tras fundido superficial 40–52 m: límites visibles, no aprobación del usuario.

## Medios, procedencia y publicación

Vídeos [landscape](../../../public/review/polish/landscape.webm) y [portrait](../../../public/review/polish/portrait.webm), y sus [eventos](../../videos/gate-a-polish/landscape-events.json), en regeneración. Recorrido real por teclado con carro 110 m y peatón 160 m antes de meta y llegada a 200 m sin inyectar estado. La codificación del vídeo no mide FPS del juego.

Modelo original Blender: 10.516 triángulos, 11 llamadas geométricas, 4 materiales, 274.308 bytes. Entorno high 33.364/18 y low 12.154/12, cifras de módulo. Mapas Poly Haven CC0: 185.009 bytes, leaf RGBA 20.881 bytes. [Manifest](../../../assets/environment-alpha3/manifest.json), [avisos](../../../THIRD_PARTY_NOTICES.md) y [alcance](../../architecture/gate-a-polish.md).

Fallos preservados: CI 40025326519 por leer diagnóstico antes del primer frame, corregido sincronizando con drawCalls>0/canvas real sin bajar aserciones; CI 40026175320 por presupuestos lentos en su host. [Primer log](ci-initial-failure.log) y [segundo log](ci-second-failure.log). No se anuncia publicación verde con esos runs. Datos previos están identificados como `pre-optimization-*`.

Pendientes: CI y smoke públicos finales de versión/GLB/mapas/galería/vídeos, revisión/OK del usuario. Teléfono aplazado; alpha.2 y CHANGELOG intactos hasta evidencia final.
