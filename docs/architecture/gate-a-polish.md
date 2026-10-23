# Pulido de A — candidato 0.3.0-alpha.3

Fecha: 2026-10-23 (Bogotá). Estado: implementación y medios locales producidos, benchmark local medido; CI, publicación y aceptación pendientes. Base de comparación `153b739`. A sigue abierta; teléfono aplazado hasta modelo, OS y navegador reales. B y AR jugable no autorizados por esta iteración.

## Alcance realizado

Pulido de los 40 m dentro del fragmento de 200 m: manos/materiales y cámara horizontal/portrait, vegetación, fachadas y transición; UI carbón/blanco/amarillo, ambos encuentros antes de meta, recuperación de calidad y mínimo visual más nítido. No se anuncia fidelidad geográfica de El Virrey ni extensión del acabado a todo el recorrido final de 1.200 m.

La bicicleta/manos originales de Blender tienen 10.516 triángulos, 11 llamadas geométricas, 4 materiales y 274.308 bytes; SHA-256 `da687736d4eb1ca22124a2242a20af6c1623f92c62da30006c710ff83a35cc85`. Guante dorsal más claro, mangas con pliegues y ajuste uniforme portrait; la anatomía final no está aprobada. Fuente y script se conservan, sin recursos externos en ese modelo.

Entorno high: 33.364 triángulos/18 llamadas; low: 12.154/12. Son cifras de módulo, no del juego completo. Brotes unidos a ramas, fachadas con contraste y transición de superficie entre 40 y 52 m. Tres mapas Poly Haven CC0 de ladrillo, corteza y hojas suman 185.009 bytes. Leaf PNG RGBA de 20.881 bytes fue corregido mediante regresión roja RGB frente a RGBA y 11 pruebas focales verdes. [Procedencia](../../THIRD_PARTY_NOTICES.md), [manifest](../../assets/environment-alpha3/manifest.json) y [TDD de entorno](../tdd/art-polish-environment.md), con tamaños y hashes contrastados.

UI: paleta carbón `#17191C`, blanco `#EEE8DC` y amarillo `#E3B23C`; HUD compacto arriba y controles táctiles de mínimo 44 px en el 15 % inferior. Conservar aviso de seguridad, HUD, humor y pausa/reinicio. La aceptación visual no se deduce de colores correctos en un test.

## Calidad y conducción

Mínimo visual elevado de ratio 0,375 a 0,75; high desde ratio 1. Recuperación de +0,125 tras 8 s con ventanas de media ≤18 ms; espera de 20 s después de sobrecarga. Mantener objetivo 30 FPS, máximo 100 draw calls y 100.000 triángulos, sin bajar el mínimo para pasar pruebas. Una imagen de high no representa low.

Carro a 110 m y peatón a 160 m aparecen antes de la meta de 200 m. El vídeo landscape llega con salud 65 y una colisión, usando teclado real sin inyectar estado; esto verifica el recorrido demostrado, no nuevas decisiones reactivas de B.

## Evidencia y criterios verificables

| Criterio | Evidencia local | Estado |
| --- | --- | --- |
| Cámara/manos y UI en ambos formatos | Cuatro pares antes/después a pose, FOV y calidad fijos; giro y frenada en vídeos | Producida; revisión humana pendiente |
| Vegetación, fachadas y transición | Capturas de materiales y paso por 40/52 m; geometría y alpha validados | Integrado; sin afirmar acabado final |
| Recuperación y mínimo visual | Rojo → verde → refactor de mínimo, recuperación, DPR y UI; captura del mínimo | Implementado; revisión del suelo visual en consolidación |
| Ambos encuentros y meta | Eventos reales landscape, ambos tipos y llegada a 200 m | Demostrado localmente |
| Pruebas | 138 unitarias en 30 archivos y build verdes después del arreglo PNG | Comprobado; CI final pendiente |
| E2E completos | 25 aprobadas/3 omisiones antes del último arreglo PNG | Histórico local; CI validará el conjunto final |
| Rendimiento | Muestra local dentro del arte y GPU de escritorio separadas | Comprobado en laboratorio, no teléfono |
| Publicación | CI, smoke, assets, medios y base path | Pendiente |
| Aceptación | OK del usuario y prueba física | No acreditada; teléfono aplazado |

La [comparación y rendimiento](../performance/gate-a-polish/README.md) concentra tablas y medios reales: software a ratio 0,75, 309×629, 42,384/39,891 FPS sol/lluvia; GPU a ratio 1, 1280×720, 60/60 FPS. La base `153b739` y el candidato se capturan a pose/cámara/FOV65/DPR1 y calidades fijas; los contadores durante la captura no se presentan como benchmark. No atribuir mejoras FPS a resolución distinta.

## Límites y cierre

Evaluar legibilidad de vía, actores y puños en lluvia y portrait; priorizar volumen y contraste sobre microdetalle o decoración. El promedio FPS no aprueba anatomía, materiales, clipping o composición. No se usan conceptos como capturas del juego ni emulación como teléfono real.

Los avisos incorporan solamente procedencia/licencias y artefactos comprobados. El único CHANGELOG.md permanece append-only: alpha.2 y anteriores intactos. Alpha.3 se añade solo después de CI y smoke finales, con fecha Bogotá, resultados, áreas, compatibilidad y limitaciones. No se hacen commits desde este rol.
