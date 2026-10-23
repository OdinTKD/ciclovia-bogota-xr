# Ampliación visual de A — candidato 0.3.0-alpha.2

Fecha: 2026-10-23 (Bogotá). Estado actual: runtime `72c1075`, test-only `14579b1`, CI40018717275 con verify/deploy correctos: 124 unitarias en 27 archivos, build y 18 E2E aprobadas/2 omitidas en 3,5 minutos. Smoke público correcto el 2026-10-23 a las 20:27:20 UTC: alpha.2, modelo/hash, diagnóstico, galería/vídeo/imágenes y cero errores. A sigue abierta; teléfono expresamente aplazado y OK artístico pendientes.

## Alcance realizado

Muestra visual de 40 m dentro del fragmento técnico de 200 m; recorrido final previsto de 1.200 m. Bicicleta/manos originales trabajadas en Blender y entorno original de parque a izquierda y fachadas a derecha, materiales, iluminación y sombras. El corredor está inspirado en El Virrey, sin trazado geográfico verificado. No se añadieron actores reactivos de B, audio ni rediseño de UI. Se conservan controles, seguridad, conducción y contactos de A.

Blender MCP permaneció desconectado. Se utilizó Blender 5.1.2 por CLI background aislada, sin manipular la sesión interactiva del usuario. El [script](../../tools/assets/build-bicycle.py) conserva el comando de reproducción; Blender es una herramienta de producción, no parte del runtime público.

## Assets y procedencia comprobados

| Elemento | Evidencia | Estado |
| --- | --- | --- |
| Fuente editable y generación | [.blend](../../assets/source/bicycle/bicycle-rider.blend), [script](../../tools/assets/build-bicycle.py) | Archivos presentes |
| Modelo de bicicleta/manos | [GLB](../../public/assets/models/bicycle-rider.glb), [manifest](../../public/assets/models/bicycle-rider.manifest.json) | Tamaño y SHA-256 comprobados |
| Jerarquía/animación | [TDD modelo](../tdd/blender-bicycle.md), captura y vídeo de giro/freno | Integración local comprobada; aprobación visual pendiente |
| Procedencia | [Avisos](../../THIRD_PARTY_NOTICES.md) y manifest original-project | Originales del proyecto, sin assets externos descargados |
| Inventario geométrico | Manifest de bicicleta y [TDD entorno](../tdd/art-slice.md) | Medido; no confundir inventario con pasadas GPU |
| Render integrado | [Métricas detalladas](../performance/gate-a-art/README.md) | Laboratorio y escritorio local medidos; teléfono no probado |

Bicicleta/manos: 187.596 bytes, SHA-256 `6676817a5e6a9302625a84b3f3ff3b2d489d6404c3ee8966f927356b92f92d76`, 7.120 triángulos, 9 llamadas de geometría y 2 materiales. Se conservan pivotes de dirección, ruedas y pedales y anclajes del modelo. No se asignó una licencia nueva a originales del proyecto.

Entorno: siete texturas deterministas originales —asfalto, ladrillo, concreto, adoquín, corteza, hoja y césped—; inventario del módulo final 27.500 triángulos, 17 llamadas de geometría, 5 materiales PBR y 2.118.998 bytes estimados con mipmaps. Excluye resto de escena y pasadas de sombras. La evidencia conserva versiones previas, ajuste de humedad y batching rojo → verde → refactor; las cifras anteriores no se presentan como actuales.

## Validación y calidad

El estado final es 124 unitarias, build y 18 E2E correctas/2 omitidas en CI; publicación y smoke públicos comprobados. La corrección de prueba usa comparación exacta Buffer.equals sin ampliar timeout. La revisión de arquitectura no encontró bloqueos en exclusión high/low, clima, materiales o disposal; física, controles, tráfico y umbrales no cambiaron.

Calidad high: PBR selectivo, sombras Basic1024 cacheadas y filtros originales. Low: diffuse cacheado, sin sombras/reflejos, anisotropía1/bilinear, MSAA desactivado con DPR>1; DPR1 conserva MSAA. Calibración12–25 RAF reales antes de Iniciar. Diagnóstico registra materialQuality/shadows/antialias/artDetail. Entorno high27.500tri/17calls; low11.856/11, conserva14árboles y5fachadas/posiciones. Ambas versiones residen en memoria (~4,2MB texturas), solo una es visible.

Benchmark final quieto6s dentro40m: software low60,0017/60,0037FPS,30/31calls23.834/25.754tri,154×314; GPU high~60/60FPS,36/37calls39.478/41.398tri,1280×720. [Informe único de rendimiento e históricos](../performance/gate-a-art/README.md). No atribuir toda diferencia a una corrección ni acreditar teléfono. La [captura low](../screenshots/gate-a-art/low-emulated.png) evidencia pixelado, copas simplificadas y recorte exterior de manos/controles; no es aprobación de acabado.

## Evidencia visual

[Vídeo](../../public/review/art/driving.webm), [sol](../../public/review/art/sun.png) y [lluvia](../../public/review/art/rain.png) reales: 15,68 s, 1280×720, 25 FPS VP9, 5.771.488 bytes de vídeo. El [registro](../videos/gate-a-art/events.json) identifica Intel Arc 140T D3D11, ratio 1, PBR/sombras, giro/contragiro y frenado en ambos climas, sin errores de página. Captura del arte de `ee3bb45`; el cambio posterior solo ajusta preparación inicial, no esos assets. Los 25 FPS son codificación, no rendimiento. La publicación y reproducción de los archivos se comprobaron en el smoke público final.

La revisión aprecia mayor detalle/legibilidad, pero sigue siendo un prototipo estilizado: copas facetadas/hojas aisladas, transición brusca tras 40 m, guantes oscuros con lluvia, reflejos discretos y extremos de manos recortados en portrait emulado. Sin bloqueo observado en esa revisión; no es aprobación artística ni prueba física.

## Pendientes reales y documentación

- CI y verificación pública final comprobadas; conservar evidencia enlazada.
- Revisión visual del usuario y OK de A. La prueba física sigue aplazada, sin usar plantillas o emulación como resultado.
- A permanece abierta; B no autorizada, audio/rediseño UI/AR jugable no entregados.

Documentación / Versionado conserva alpha.1 intacta. Se añadió alpha.2 al único changelog append-only con evidencia final, con fecha Bogotá, validaciones, áreas, compatibilidad y pendientes. Los documentos de estado se actualizan para reflejar el resultado actual; las mediciones anteriores quedan identificadas como históricas.
