# Pulido de A — candidato publicado 0.3.0-alpha.3

Cierre técnico de iteración: 2026-10-26 (Bogotá). Runtime d247ee8575ae56924c29a5b5b8245c023622b98d, CI 40357178802 verify/deploy correctos: 167 pruebas unitarias y de integración en 35 archivos, build y 25 E2E aprobadas / 3 omitidas en 4,8 minutos. Smoke público 16:22:13.192 UTC correcto con JS exacto. A permanece abierta por OK artístico; teléfono aplazado y B/C sujetos a aprobación. No se anuncia 0.3.0 completa.

## Alcance entregado como candidato

Pulido de 40 m dentro de 200 m: manos/materiales de Blender, cámara horizontal/portrait, vegetación/fachadas, transición superficial 40–52 m, UI carbón/blanco/amarillo y recuperación de calidad. Carro 110 m y peatón 160 m antes de meta; vídeo y prueba funcional por controles normales llegan a 200 m sin inyectar estado. El resto mantiene arte básico; no se certifica trazado real ni acabado homogéneo de 1.200 m.

Bicicleta/manos originales: 10.516 triángulos, 11 llamadas, 4 materiales y 274.308 bytes; SHA-256 da687736d4eb1ca22124a2242a20af6c1623f92c62da30006c710ff83a35cc85. Fuente editable/script conservados. Entorno high 33.364/18 y low 12.994/12: low añade 840 triángulos para recuperar grupos de hojas, sin llamadas nuevas. Mapas CC0: 173.971 bytes, atlas 9.843 bytes y memoria compartida de mipmaps 65.532 bytes. [Manifest](../../assets/environment-alpha3/manifest.json), [avisos](../../THIRD_PARTY_NOTICES.md). Siete originales/derivados y GLB verificados por tamaño y SHA; ladrillo con repetición actual 8×9.

## Calidad y arranque

Mínimo ratio 0,75 (antes 0,375), high desde 1. Recuperación de +0,125 tras 8 s con medias ≤18 ms, espera 20 s tras sobrecarga. Objetivo 30 FPS y máximos 100 calls/100.000 triángulos intactos. Ciudad 9→2 calls con los mismos 6.196 triángulos, pools compactos y Lambert low por vértice preservando mapas/alpha/fog/luces/clima; high restaura shader completo. Prioridad de sólidos antes de alphaTest mantiene assets/geometría.

Preparar 12 frames del perfil gráfico antes de ready y física en mundo desechable con bordes/actor cercano/movimiento/un paso/liberación en finally; jugador nuevo pose inicial/pasos 0. Filtro conservador evita consultas innecesarias; oráculo 600 casos sin positivos descartados y 160 ticks equivalentes. No se adelanta la partida ni se excluyen frames del gate para aprobar. TDD [gráfico](../tdd/final-profile-calibration.md), [físico](../tdd/physics-preparation.md), [filtro](../tdd/physics-broadphase.md), [sesión completa](../tdd/full-session-performance.md), [shader](../tdd/vertex-diffuse.md) y [prioridad](../tdd/opaque-depth-order.md).

## Criterios y evidencia final

| Criterio | Resultado |
| --- | --- |
| Modelo/UI/cámara en dos formatos | Capturas y vídeos reales; no aprobación artística |
| Encuentros y meta | Carro 110 m/peatón 160 m y llegada 200 m por controles |
| Recuperación y suelo visual | Implementados; mínimo legible revisado como candidato |
| Pruebas y publicación | 167 pruebas unitarias y de integración, build, 25 E2E / 3 omitidas, deploy correctos |
| Sesión corta completa CI | Sol 41,193 FPS, máximo 99,9 ms; lluvia 55,034 FPS, máximo 66,7 ms |
| Recorrido 18 s CI | Sol 53,619 / lluvia 52,953 FPS; llega a unos 139 m, no equivale a meta 200 m |
| Smoke público | Nombre y SHA del JS iguales a dist, GLB/3 mapas, 10 imágenes y 2 vídeos, cero errores |
| Aceptación y teléfono | A pendiente de OK; teléfono aplazado hasta datos reales; B/C no entregadas |

[Informe único de métricas y cronología](../performance/gate-a-polish/README.md) y [smoke público](../performance/gate-a-polish/live-verification.json). Los benchmarks quietos y GPU de escritorio no certifican teléfono; promedio verde no garantiza cada frame ≤33 ms. Local final corto fue 33,314/30,000932 FPS con margen muy pequeño en lluvia y picos 216,7/133,3 ms, distintos del CI.

## Límites y compatibilidad

Copas ligeras, dedos sin articulación y detalle básico después del fundido superficial; tampoco se implementa AR jugable. Evaluación artística y técnica son independientes. La preparación de carga y el filtro preservan controles/física de los casos probados; las nuevas métricas y calidad no constituyen aprobación de A.

La entrada alpha.3 se añade al único CHANGELOG.md append-only con historia previa intacta. La fecha y resultados anteriores se preservan en TDD y archivos por revisión, no como estado actual. No hay commits desde este rol; la siguiente iteración necesita alcance autorizado.
