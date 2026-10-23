# Pulido de A — candidato 0.3.0-alpha.3

Fecha: 2026-10-23 (Bogotá). Estado: runtime local congelado tras optimización; 143/143 unitarias en 32 archivos y build correctos. Capturas/vídeos finales en regeneración, CI y publicación pendientes. Base visual `153b739`. A sigue abierta por revisión/OK del usuario; teléfono aplazado hasta modelo, OS y navegador reales. B y AR jugable no autorizados.

## Alcance implementado

Acabado de los 40 m dentro del fragmento de 200 m: manos/materiales y cámara horizontal/portrait, vegetación/fachadas/transición, UI carbón/blanco/amarillo, ambos encuentros antes de meta y recuperación de calidad. No se anuncia trazado real de El Virrey ni acabado homogéneo del recorrido final de 1.200 m.

Bicicleta/manos originales de Blender: 10.516 triángulos, 11 llamadas geométricas, 4 materiales, 274.308 bytes; SHA-256 `da687736d4eb1ca22124a2242a20af6c1623f92c62da30006c710ff83a35cc85`. Guante dorsal aclarado, mangas con pliegues y ajuste uniforme portrait; dedos sin articulación y anatomía final no aprobada. Fuente editable y script conservados.

Entorno high: 33.364 triángulos/18 llamadas; low: 12.154/12, cifras de módulo. Brotes unidos a ramas, fachadas con contraste, transición superficial de 40 a 52 m. Ladrillo, corteza y hojas derivadas de Poly Haven CC0: tres mapas de 185.009 bytes; leaf RGBA de 20.881 bytes, corregido con regresión real de alpha. [Avisos](../../THIRD_PARTY_NOTICES.md), [manifest](../../assets/environment-alpha3/manifest.json) y [TDD](../tdd/art-polish-environment.md).

UI: carbón `#17191C`, blanco `#EEE8DC`, amarillo `#E3B23C`; HUD compacto superior y controles táctiles de mínimo 44 px en franja inferior. Se conservan seguridad, humor y controles. Carro a 110 m y peatón a 160 m aparecen antes de meta; el recorrido por teclado llega a 200 m con salud positiva, sin inyectar estado ni añadir actores reactivos de B.

## Calidad y optimización

Mínimo visual elevado de ratio 0,375 a 0,75; high desde 1. Recuperación +0,125 tras 8 s con medias de ventana ≤18 ms; espera de 20 s después de sobrecarga. Objetivos intactos: 30 FPS, máximo 100 draw calls y 100.000 triángulos. No reducir suelo visual para pasar CI.

Ciudad estática de 9 a 2 llamadas con mismos 6.196 triángulos; pools compactos y actualización solo al cambiar. Low interpola iluminación Lambert por vértice conservando mapas, alpha, fog, luces y clima; high restaura el shader completo original. [TDD del shader](../tdd/vertex-diffuse.md) y [render/pools](../tdd/render-work.md). No cambian física, controles ni tráfico.

## Evidencia local y aceptación

| Criterio | Evidencia | Estado |
| --- | --- | --- |
| Cámara, manos y UI en horizontal/portrait | Pares fijos y vídeos reales de giro/freno | Regeneración final en curso; aceptación humana pendiente |
| Vegetación/fachadas/transición | Geometría, alpha y prueba de transición 40–52 m | Integrado, sin afirmar acabado final |
| Calidad adaptativa y mínimo | TDD de mínimo, recuperación, DPR y UI | Implementado; mínimo revisado localmente legible |
| Encuentros y llegada | Carro 110 m, peatón 160 m y recorrido de 200 m por controles | Demostrado localmente |
| Pruebas | 143/143 unitarias en 32 archivos y build correcto | Comprobado; CI final pendiente |
| Rendimiento | Software CPU 4× y GPU separados; estrés adicional CPU 8× | Medido; no teléfono |
| Publicación | CI y smoke de versión, GLB, mapas y medios | Pendiente |
| Aceptación de A | Revisión/OK del usuario y teléfono | No acreditada; prueba física aplazada |

[Informe detallado](../performance/gate-a-polish/README.md): benchmark estándar dentro de la muestra, software 53,520/52,689 FPS sol/lluvia, 28/29 calls y 28.208/30.128 triángulos, ratio 0,75 y 309×629; GPU 60/60 FPS, 32/33 calls, 48.738/50.658 triángulos, ratio 1 y 1280×720. Estrés CPU 8× adicional 48,400/48,035 FPS. A/B CPU 4× base y candidato saturaron ~60: no atribuir ganancia causal de FPS; sí se registra reducción de llamadas con geometría intacta.

## Límites y documentación

Mínimo revisado: vía, guantes y controles legibles, copas dispersas y detalle fino limitado. Las copas siguen ornamentales, los dedos no articulan y el resto de los 200 m conserva arte básico tras la transición superficial. La revisión no equivale a aprobación artística. High no representa low; emulación y GPU de escritorio no son teléfono físico.

La comparación fija pose/cámara, FOV 65, DPR 1, ratio y calidad para cada par. Los FPS de captura o codificación no son benchmark. El único CHANGELOG.md sigue append-only, alpha.2 intacta; alpha.3 solo se registra tras CI/smoke finales, con fecha, pruebas, áreas, compatibilidad y límites reales. No commits desde este rol.
