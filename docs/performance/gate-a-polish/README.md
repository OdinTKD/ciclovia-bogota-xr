# Rendimiento y evidencia final — pulido de A / alpha.3

Actualizado: 2026-10-26. Runtime d247ee8575ae56924c29a5b5b8245c023622b98d; [CI 40357178802](https://github.com/OdinTKD/ciclovia-bogota-xr/actions/runs/40357178802) con verify/deploy correctos: 167 pruebas unitarias y de integración en 35 archivos, build y 25 E2E aprobadas/3 omisiones redundantes en 4,8 minutos. Smoke público exacto correcto a las 16:22:13.192 UTC. A permanece abierta por OK visual; teléfono aplazado hasta modelo, OS y navegador reales. B/C requieren aprobación.

## Gate final con sesión completa

Linux/Chromium, viewport Pixel 7 emulado, CPU 4×, CSS 412×839, DPR 2,625, buffer 309×629, ratio 0,75, low/diffuse sin sombras/MSAA. Mismo objetivo 30 FPS, máximo 100 calls/100.000 triángulos. La prueba corta cuenta todos los frames jugables desde inicio/reanudación hasta pausa durante los mismos 5 s por clima; no usa ventana final de 180 ni descarta tirones iniciales.

| Muestra CI | FPS promedio | Máximo de frame | Calls / triángulos | Frames |
| --- | --- | --- | --- | --- |
| [Corta completa, sol](ci-physics-final/performance-sun.json) | 41,193 | 99,9 ms | 28 / 29.048 | 219 |
| [Corta completa, lluvia](ci-physics-final/performance-rain.json) | 55,034 | 66,7 ms | 29 / 30.968 | 288 |
| [Recorrido 18 s, sol](ci-physics-final/route-performance-sun.json) | 53,619 | 66,7 ms | 28 / 29.048 | 966 |
| [Recorrido 18 s, lluvia](ci-physics-final/route-performance-rain.json) | 52,953 | 33,4 ms | 29 / 30.968 | 954 |

El recorrido de 18 s alcanza unos 139 m: no equivale al vídeo/prueba funcional hasta 200 m. Las cortas contienen todos los frames de cada clima; FPS promedio verde no garantiza cada frame ≤33 ms. Persisten picos, aunque la compilación inicial de unos 2,1 s dejó de aparecer en la pasada final.

Local previo al CI final: 33,314314 FPS sol y 30,000932 lluvia, margen mínimo de lluvia que se conserva. Máximos 216,7/133,3 ms; esos picos son locales, distintos de los CI 99,9/66,7 ms. 183,3 ms fue una etapa intermedia de preparación sin filtro. [TDD de sesión completa](../../tdd/full-session-performance.md), [estado CI](ci-physics-final-status.json), [log](ci-physics-final.log).

## Arranque y filtro físico

Perfil gráfico final renderiza 12 frames antes de ready. Preparación física recorre bordes, movimiento y un actor cercano en un mundo desechable, da un paso y lo libera en finally; después crea jugador nuevo con pose/pasos 0. Primer tick normal registra un paso. No adelanta partida ni reinicia métricas para pasar pruebas. [TDD gráfico](../../tdd/final-profile-calibration.md), [preparación física](../../tdd/physics-preparation.md).

Filtro conservador: 8→0 barridos y 8→0 contactos del tick central; oráculo Rapier, con 600 casos sin positivos descartados y 160 ticks por variante exactamente iguales. Preparación conserva los kernels necesarios. [TDD broadphase](../../tdd/physics-broadphase.md): rojos propios, verdes y refactor 37/37 relevantes, TypeScript/diffcheck. Conteos y equivalencia no se sustituyen por una promesa causal de FPS.

## Antes/después visual fijo y coste por recurso

[Antes](../../screenshots/gate-a-polish/before/comparison.json), base 153b739, y [después](../../screenshots/gate-a-polish/after/comparison.json): pose/cámara fija, FOV 65, DPR 1, ratio 1, high/PBR/sombras/MSAA; landscape 1280×720 y portrait 412×839. Contadores de capturas, no benchmark FPS.

| Formato/clima | Calls antes → después | Triángulos antes → después |
| --- | --- | --- |
| Landscape sol | 36 → 32 | 39.478 → 48.738 |
| Landscape lluvia | 37 → 33 | 41.398 → 50.658 |
| Portrait sol | 36 → 34 | 39.478 → 49.418 |
| Portrait lluvia | 37 → 35 | 41.398 → 51.338 |

Más triángulos por detalle, menos llamadas tras optimización; no inventar FPS antes/después. Modelo original Blender: 10.516 triángulos, 11 llamadas, 4 materiales y 274.308 bytes. Entorno high 33.364/18, low 12.994/12; low añade 840 triángulos para recuperar grupos de hojas, sin llamadas nuevas. Tres mapas CC0: 173.971 bytes; atlas 9.843 bytes y cadena mipmap compartida de 65.532 bytes de memoria, no transferencia. [Manifest](../../../assets/environment-alpha3/manifest.json), [avisos](../../../THIRD_PARTY_NOTICES.md). Siete originales/derivados y GLB contrastados con tamaños/SHA.

Ciudad 9→2 calls con 6.196 triángulos intactos, pools compactos y actualizaciones solo al cambiar. Lambert low interpola iluminación por vértice conservando mapas/alpha/fog/luces/clima; high restaura shader original. Sólidos antes de alphaTest mantienen assets y geometría. [TDD shader](../../tdd/vertex-diffuse.md), [render](../../tdd/render-work.md), [prioridad](../../tdd/opaque-depth-order.md). A/B local limitado a unos 60 FPS no prueba ganancia causal; evidencia visual y benchmarks son independientes.

## Suelo visual, medios y límites

Mínimo ratio 0,75, high desde 1; recuperación de +0,125 tras 8 s con medias ≤18 ms y espera 20 s tras sobrecarga. [Mínimo sol](../../screenshots/gate-a-polish/minimum/sun.png), [lluvia](../../screenshots/gate-a-polish/minimum/rain.png) y [reporte](../../screenshots/gate-a-polish/minimum/report.json): vía/guantes/controles legibles y follaje recuperado, todavía copas ligeras/detalle reducido. [Mínimo rechazado](../../screenshots/gate-a-polish/rejected-minimum-2026-10-26/) conservado aparte. No es OK del usuario.

[Landscape](../../../public/review/polish/landscape.webm): 30,72 s, 1280×720 y 9.101.412 bytes. [Portrait](../../../public/review/polish/portrait.webm): 8,96 s, 412×838 y 1.053.979 bytes. Vídeos reales: giro/contragiro/freno, carro 110 m/peatón 160 m, meta 200 m con salud 65 y una colisión; [eventos](../../videos/gate-a-polish/landscape-events.json). FPS codificados no miden rendimiento. Capturas/vídeos conservan fecha propia de producción, aunque la preparación de carga posterior no cambia ese arte.

Benchmark artístico quieto durante 6 s, capturado el 26, anterior al filtro físico: [software](final-2026-10-26/sample-software-mobile.json), 54,684/51,193 FPS a 309×629; [GPU](final-2026-10-26/sample-hardware-desktop.json), 59,164/59,829 FPS a 1280×720. No sustituye movimiento/arranque del gate final ni teléfono real. [Smoke local actual](local-verification.json), 16:15:06 UTC: filename y SHA del JS iguales a dist, GLB y tres mapas, ocho comparativas más dos revisiones y dos vídeos reproducidos, cero errores. Smoke público exacto correcto a las 16:22:13.192 UTC.

Copas ligeras, dedos sin articulación y resto de 200 m básico después de transición superficial 40–52 m. No se anuncia geografía real ni acabado homogéneo de 1.200 m. La aceptación artística y teléfono están separados del gate técnico.

## Cronología preservada, no estado actual

- CI 40025326519: lectura antes del primer frame; sincronización corregida sin rebajar aserciones. CI 40026175320/40030195058 y 40342975441/40346005979: presupuestos fallidos, logs conservados.
- Profiler 40031439886 y GPU 40348159842: diagnóstico, no gate FPS. Readbacks nativos de composición, no JS del juego; cambio de pipeline 40348853201 adverso: 21,879→9,918 FPS, rechazado sin flags nuevas en Playwright.
- Focales 40339380259/40345111695 y prioridad/pixel-diff conservan su alcance, no full CI del arte posterior.
- CI 40349775065 cf13553 aprobó el contrato rolling de 180 frames y publicó; smoke 15:36:27 UTC correcto. Fortalecer a sesión completa detectó 17,7929 FPS/máximo 2116,6 ms. Preparación física sola quedó 29,910 FPS; filtro posterior produjo los resultados finales arriba. [TDD](../../tdd/full-session-performance.md).

Alpha.3 queda registrada como candidato técnico publicado con smoke final correcto; A continúa abierta por revisión/OK y teléfono aplazado.
