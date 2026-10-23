# Rendimiento de la muestra visual A — alpha.2

Fecha: 2026-10-23. Estado: runtime `72c1075`, corrección exclusiva de prueba `14579b1`; CI final 40018717275 con verify/deploy correctos: 124 unitarias en 27 archivos, build y 18 E2E aprobadas/2 omitidas en 3,5 minutos. Smoke público correcto el 2026-10-23 a las 20:27:20 UTC: alpha.2, modelo/hash, diagnóstico, galería/vídeo/imágenes y cero errores. A permanece abierta; teléfono físico expresamente aplazado y aprobación artística pendiente. Umbrales intactos: 30 FPS, 100 draw calls, 100.000 triángulos y ratio mínimo 0,375.

## Configuración actual

Calibración de 12–25 RAF realmente renderizados antes de habilitar Iniciar: el último grado cambiado se renderiza también. Calidad mínima: ratio 0,375, diffuse/Lambert cacheados, sombras/reflejos desactivados, anisotropía 1, bilinear en un mip y LOD low. Calidad alta: filtros originales, PBR selectivo y sombras Basic cacheadas de 1024, LOD high. MSAA desactivado con DPR mayor que 1 y conservado con DPR 1. El diagnóstico registra `materialQuality`, `shadows`, `antialias` y `artDetail`; no confundirlos con resolución.

LOD de entorno high: 27.500 triángulos/17 llamadas geométricas. Low: 11.856/11, conserva 14 árboles, 5 fachadas, posiciones y superficies, simplificando vegetación, barrotes y juntas. Ambas versiones residen en memoria, solo una es visible; texturas estimadas totales ~4,2 MB. Inventario residente y contenido dibujado son métricas diferentes. No cambian física, controles, tráfico ni umbrales.

## Benchmark actual dentro de la muestra de 40 m

CI final [40018717275](https://github.com/OdinTKD/ciclovia-bogota-xr/actions/runs/40018717275), commit de prueba `14579b1` y runtime `72c1075`: verify/deploy correctos, 124 unitarias en 27 archivos, build y 18 E2E aprobadas/2 omitidas en 3,5 minutos. Las omisiones son presupuestos redundantes de escritorio. Recorrido CI de 18 s: [sol](ci-final-route-performance-sun.json) 56,67 FPS, 1.021 muestras, 30 calls/23.834 triángulos; [lluvia](ci-final-route-performance-rain.json) 56,01 FPS, 1.009 muestras, 31 calls/25.754 triángulos. Ambos buffer154×314/ratio0,375, CSS412×839/DPR2,625 y low; p95/p99≈33,3/33,4 ms.

Muestra corta CI: [sol](ci-final-performance-sun.json) 59,34 FPS dentro de la muestra artística; [lluvia](ci-final-performance-rain.json) 55,96 FPS con 23 calls/14.474 triángulos fuera del arte. Esa lluvia no sustituye el benchmark quieto dentro de los 40 m de la tabla siguiente.

El [smoke público final](live-verification.json), 20:27:20 UTC del 2026-10-23, comprobó juego alpha.2, GLB con SHA exacto y 7.120 triángulos, diagnóstico, galería, vídeo reproducido de 15,68 s/1280×720 e imágenes decodificadas, cero errores. Es comprobación de publicación/medios, no benchmark ni teléfono físico.

Pasadas de 6 s con bicicleta quieta a 14–15 m, sin vídeo durante la medición. No equivalen a conducción ni a sesión móvil física.

| Entorno / clima | FPS promedio | p95 ms | Máximo calls / triángulos | Resolución y calidad |
| --- | --- | --- | --- | --- |
| [Software sol](sample-software-mobile.json) | 60,0017 | 16,8 | 30 / 23.834 | 154×314; ratio 0,375; diffuse, sin sombras/MSAA, low |
| [Software lluvia](sample-software-mobile.json) | 60,0037 | 16,7 | 31 / 25.754 | 154×314; ratio 0,375; diffuse, sin sombras/MSAA, low |
| [GPU escritorio sol](sample-hardware-desktop.json) | 59,9997 | 16,8 | 36 / 39.478 | 1280×720; ratio 1; PBR, sombras/MSAA, high |
| [GPU escritorio lluvia](sample-hardware-desktop.json) | 60,0007 | 16,8 | 37 / 41.398 | 1280×720; ratio 1; PBR, sombras/MSAA, high |

Software: SwiftShader, viewport Pixel 7 emulado, CSS 412×839, DPR 2,625, CPU 4×. GPU: Chrome/Intel Arc 140T D3D11, CSS 1280×720, DPR 1. GPU real de escritorio no significa teléfono probado. Los promedios no garantizan ese ritmo cada frame. Las mejoras acumuladas y carga variable impiden atribuir toda diferencia a una única corrección.

## Histórico identificado, no estado actual

[alpha.1 sol](../gate-a/after-route-performance-sun.json) / [lluvia](../gate-a/after-route-performance-rain.json), recorrido 18 s CPU 4×: 38,97/40,46 FPS, 20/21 calls, 17.966/19.886 triángulos; ratio 0,75 sol y 0,75→0,375 lluvia. Antes de calibración/filtrado/MSAA/LOD, alpha.2 [sol](after-route-performance-sun.json) / [lluvia](after-route-performance-rain.json): 42,13/33,61 FPS, 36/37 calls, 39.478/41.398 triángulos, ratio 0,75→0,375 sol y 0,375 lluvia. Tras solo calibración, [sol](calibrated-route-performance-sun.json) / [lluvia](calibrated-route-performance-rain.json): 57,95/57,34 FPS a 154×314. No se presenta ninguna de estas etapas como medición final de low ni como mejora causal directa a calidad fija.

Se conservan JSON por etapa: `pre-filtering-*`, `pre-raster-*` y `ci-failed-*`. Fallaron los runs 40009323688 (muestra corta y recorrido), 40012579137, 40015453267 y 40016587178 (muestra corta), sin certificar publicación. 40011911370 se canceló por sustitución, no por regresión. 40018514417 falló en comparación profunda de texturas (123/124 unitarias); se reemplazó por Buffer.equals exacto con byteOffset/byteLength sin aumentar timeout. La CI sucesora 40018717275 comprueba esa prueba sin cambiar runtime.

TDD y correcciones: [integración](../../tdd/art-integration.md), [entorno/LOD](../../tdd/art-slice.md) y [preparación de CI](../../tdd/ci-browser-setup.md). Workflow Ubuntu 24.04 e instalación de Chromium sin apt redundante conservan todas las pruebas. Bundle aproximado de 5,02 MB/1,85 MB gzip, advertencia de tamaño conservada.

## Evidencia visual separada

La [galería](../../../public/review/art/index.html), [vídeo](../../../public/review/art/driving.webm) y capturas high corresponden al arte de `ee3bb45`: 15,68 s, 1280×720, 25 FPS VP9, 5.771.488 bytes, PBR/sombras/MSAA, ratio 1, Intel Arc 140T. La apariencia high no cambió; los FPS del archivo son codificación, no benchmark.

La [captura low actual](../../screenshots/gate-a-art/low-emulated.png) y [diagnóstico](../../screenshots/gate-a-art/low-emulated.json) muestran pixelado evidente, copas simplificadas y recorte exterior de manos/controles. Es prototipo estilizado, no arte aprobado; no debe representarse la captura high como apariencia del modo mínimo. La prueba física y el OK de A siguen pendientes.
