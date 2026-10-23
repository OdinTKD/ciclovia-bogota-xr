# Rendimiento y comparación — pulido de A / alpha.3

Fecha: 2026-10-23. Estado: evidencias locales de modelo, entorno, UI y captura producidas; CI y publicación alpha.3 pendientes. Base visual `153b739` aislada. La suite completa previa al último arreglo PNG pasó 25 E2E/3 omisiones; después del arreglo, 138 unitarias en 30 archivos y build correctos. CI final validará el conjunto. A sigue abierta, teléfono aplazado hasta modelo/OS/navegador reales.

## Comparación visual controlada

[Antes](../../screenshots/gate-a-polish/before/comparison.json) y [después](../../screenshots/gate-a-polish/after/comparison.json): pose inicial x/z/yaw=0, cámara mundo (0;1,65;1,3), FOV65, DPR1, ratio 1, PBR, sombras, MSAA y high. Landscape: buffer y CSS1280×720; portrait:412×839. Las muestras cortas de FPS dentro de estos JSON incluyen captura/calentamiento y no se usan como benchmark.

| Pose/clima | Calls antes → después | Triángulos antes → después | Capturas reales |
| --- | --- | --- | --- |
| Landscape sol | 36 → 39 | 39.478 → 48.738 | [Antes](../../screenshots/gate-a-polish/before/landscape-sun.png) · [Después](../../screenshots/gate-a-polish/after/landscape-sun.png) |
| Landscape lluvia | 37 → 40 | 41.398 → 50.658 | [Antes](../../screenshots/gate-a-polish/before/landscape-rain.png) · [Después](../../screenshots/gate-a-polish/after/landscape-rain.png) |
| Portrait sol | 36 → 41 | 39.478 → 49.418 | [Antes](../../screenshots/gate-a-polish/before/portrait-sun.png) · [Después](../../screenshots/gate-a-polish/after/portrait-sun.png) |
| Portrait lluvia | 37 → 42 | 41.398 → 51.338 | [Antes](../../screenshots/gate-a-polish/before/portrait-rain.png) · [Después](../../screenshots/gate-a-polish/after/portrait-rain.png) |

Se compara aspecto/coste a parámetros fijos, no solo FPS. El formato portrait reescala uniformemente el viewmodel; el mundo y calidad están fijados para cada comparación. No constituye aprobación visual del usuario.

## Benchmark local final dentro de los 40 m

Muestra de 6 s quieta a aproximadamente 14 m, sin vídeo durante medición. Son condiciones diferentes y no se mezclan como si tuvieran calidad/resolución idénticas.

| Entorno / clima | FPS promedio | p95 ms | Máximo calls / triángulos | Render |
| --- | --- | --- | --- | --- |
| [Software sol](sample-software-mobile.json) | 42,384 | 33,4 | 35 / 28.208 | 309×629, ratio 0,75, low/diffuse, sin sombras ni MSAA |
| [Software lluvia](sample-software-mobile.json) | 39,891 | 33,4 | 36 / 30.128 | 309×629, ratio 0,75, low/diffuse, sin sombras ni MSAA |
| [GPU sol](sample-hardware-desktop.json) | 60,00 | 16,8 | 39 / 48.738 | 1280×720, ratio 1, high/PBR, sombras/MSAA |
| [GPU lluvia](sample-hardware-desktop.json) | 60,00 | 16,8 | 40 / 50.658 | 1280×720, ratio 1, high/PBR, sombras/MSAA |

Software: SwiftShader, CPU 4×, CSS 412×839 y DPR emulado 2,625. GPU: Intel Arc 140T D3D11 en Chrome de escritorio. Ninguno acredita teléfono. No garantiza 30 FPS en cada frame ni atribuye diferencias exclusivamente al código. Mantener máximos 100 calls / 100.000 triángulos y objetivo 30 FPS; el mínimo visual se elevó de 0,375 a 0,75. High comienza desde 1; recuperación +0,125 tras 8 s de medias ≤18 ms y espera 20 s tras sobrecarga, con TDD separado del benchmark.

## Suelo visual y medios

[Sol mínimo](../../screenshots/gate-a-polish/minimum/sun.png), [lluvia mínimo](../../screenshots/gate-a-polish/minimum/rain.png) y [diagnóstico](../../screenshots/gate-a-polish/minimum/report.json): CSS 412×839, buffer 309×629, ratio 0,75, diffuse/low sin sombras/MSAA. La revisión del mínimo sigue pendiente de consolidación; FPS verde no aprueba acabado, anatomía o encuadre.

Vídeos [landscape](../../../public/review/polish/landscape.webm), 8.882.920 bytes, y [portrait](../../../public/review/polish/portrait.webm), 1.084.103 bytes. Captura real por teclado con giro/contragiro/frenada; [eventos landscape](../../videos/gate-a-polish/landscape-events.json) y [portrait](../../videos/gate-a-polish/portrait-events.json). Landscape llega a 200 m con salud 65 y una colisión; ambos tipos de encuentro se ven antes de la meta, carro 110 m / peatón 160 m. El registro indica entrada real sin inyectar estado y cero errores. La codificación de vídeo no mide FPS del juego.

## Procedencia y cierre

Modelo original Blender: 10.516 triángulos, 11 llamadas, 4 materiales, 274.308 bytes. Entorno high 33.364/18 y low 12.154/12, cifras de módulo sin resto del juego. Tres mapas Poly Haven CC0 suman 185.009 bytes; leaf RGBA 20.881 bytes, corregido con regresión de canal alpha. [Manifest](../../../assets/environment-alpha3/manifest.json), [avisos](../../../THIRD_PARTY_NOTICES.md) y [alcance](../../architecture/gate-a-polish.md).

Pendientes reales: CI final completa, smoke de versión/GLB/texturas/galería/vídeos, consolidación de revisión mínima y OK artístico del usuario. Teléfono físico aplazado. No agregar alpha.3 al changelog antes de evidencia final; alpha.2 permanece intacta.
