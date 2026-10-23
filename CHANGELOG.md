# Historial de cambios

Por solicitud explícita del usuario se sustituyó la entrada inicial para reflejar el entorno web del proyecto. Desde esta limpieza, el historial es append-only: agregar entradas al final sin modificar las anteriores.

## [0.1.0] - 2026-10-23

### Cambiado

- Preparación documental de Ciclovía Bogotá XR para Vite, TypeScript, Three.js, Rapier y WebXR, con GitHub Pages como destino previsto.
- Limpieza autorizada de las referencias al entorno anterior en la documentación del repositorio.

### Validación

- Pruebas o comandos ejecutados: lectura de `package.json`, `package-lock.json`, `AGENTS.md` y del flujo de GitHub Actions; `node --version` y `npm --version`.
- Resultado: manifiesto web versión 0.2.0 presente; Node.js 24.18.0 y npm 11.16.0 disponibles. Esta entrada no certifica pruebas, compilación ni despliegue del MVP.
- No aplica prueba ejecutable: esta entrada registra preparación documental; el comportamiento del juego requiere su propio ciclo TDD y entrada de versión.

Subagente(s) o área(s) involucrada(s): Orquestación, Documentación / Versionado  
Compatibilidad: Compatible — corrección documental autorizada; no se modifica código mediante esta entrada.

## [0.2.0] - 2026-10-23

### Agregado

- MVP web de Ciclovía Bogotá XR con Vite, TypeScript, Three.js y Rapier: paseo de 1.200 m, bicicleta tradicional, tráfico determinista, colisiones, puntuación, sol y lluvia.
- Interfaz adaptable con aviso de seguridad obligatorio, controles de teclado y táctiles, pausa, reinicio, HUD y humor editable y desactivable.
- Detección de capacidad AR con fallback informativo; el MVP se juega en pantalla normal. No incluye sesión inmersiva, hit-test ni colocación AR.
- Pruebas unitarias y E2E, evidencia TDD por área en `docs/tdd/`, métricas en `docs/performance/`, capturas en `docs/screenshots/` y flujo CI para verificar y desplegar a GitHub Pages.
- Geometrías procedurales originales; avisos, commits y copias MIT de tres referencias consultadas sin reutilizar su código; inventario de 51 paquetes npm y 55 copias LICENSE/NOTICE; licencias runtime distribuidas en `public/licenses/`.

### Corregido

- Posición del manillar para permanecer visible en cámara de primera persona en formato vertical, con prueba de regresión.
- Inicio bloqueado mientras se cargan los recursos JSON; estado de preparación explícito y prueba de regresión con carga retrasada.

### Validación

- Pruebas o comandos ejecutados: ciclos rojo → verde → refactor registrados en `docs/tdd/`; `npm test`, `npm run build`, `npm run test:e2e`; comprobación de enlaces y estructura Markdown, hashes Git de licencias de referencia y comparación byte a byte de copias npm; `git diff --check`.
- Resultado: 54/54 pruebas unitarias en 13 archivos; build correcto; 5 E2E correctos y 1 omitido en 34,7 s (el presupuesto se mide en móvil, omisión de la repetición de escritorio). Flujos de seguridad, carga, paseo, pausa, clima, humor y reinicio verificados en Chromium de escritorio y viewport móvil.
- Rendimiento local con CPU limitada 4× y 180 muestras por clima: sol 35,41 fps, 26 draw calls, 16.518 triángulos; lluvia 35,64 fps, 27 draw calls, 18.438 triángulos; p95 de frame 33,4 ms en ambos. Cumple el presupuesto en este entorno de laboratorio; no acredita rendimiento en teléfono ni AR en hardware real.
- Documentación: 3 licencias MIT de referencia verificadas con su Git blob SHA; 55 copias npm idénticas a las instaladas; enlaces locales válidos. Las licencias Three.js/Rapier están también en el build.
- Limitaciones: bundle principal aproximado de 4,89 MB / 1,81 MB gzip con advertencia de tamaño del compilador. Flujo de publicación preparado, sin demo pública verificada en este cierre. No aplica prueba ejecutable a los avisos y documentos; se validaron estructura, enlaces y contenido de licencias mediante comparación determinista.

Subagente(s) o área(s) involucrada(s): Orquestación / Integración / QA, Motor / Física, Vehículos, Tráfico / Niveles / Clima, Frontend / UI / Controles / Humor, AR / WebXR, Documentación / Versionado  
Compatibilidad: Compatible — primera funcionalidad web del proyecto; sin cambios incompatibles en una API previa. AR jugable y comprobaciones en hardware quedan fuera de este MVP.

## [0.2.1] - 2026-10-23

### Agregado

- Demo pública de [Ciclovía Bogotá XR](https://odintkd.github.io/ciclovia-bogota-xr/) publicada con GitHub Pages y verificada contra su URL real.
- Evidencia de rendimiento CI en `docs/performance/ci-performance-sun.json` y `docs/performance/ci-performance-rain.json`, conservando las mediciones históricas de 0.2.0.

### Corregido

- Rendimiento en el runner Linux con renderizado por software: controlador de calidad adaptativa reduce resolución interna hasta `pixelRatio` 0,5; eliminación del desenfoque CSS en móvil. Se conservaron los umbrales de 30 fps promedio, 100 draw calls y 100.000 triángulos.
- Documentación de la demo, comprobaciones reproducibles contra Pages, calidad adaptativa y límites de las mediciones.

### Validación

- Pruebas o comandos ejecutados: TDD rojo → verde → refactor del controlador adaptativo; `npm test`, `npm run build`, `npm run test:e2e`; ejecución de la misma suite con `PLAYWRIGHT_BASE_URL=https://odintkd.github.io/ciclovia-bogota-xr/`; comprobación HTTP y título; validación estructural de documentación, enlaces locales y hashes de licencias; `git diff --check`.
- Resultado: 61/61 pruebas unitarias y build correcto. El [flujo 39985901277](https://github.com/OdinTKD/ciclovia-bogota-xr/actions/runs/39985901277) completó los jobs verify y deploy correctamente para el commit `2eed72d`, versión 0.2.1. La URL pública respondió HTTP 200 con título correcto; la suite contra la publicación terminó con 5 correctas y 1 omitida en 35,5 s (presupuesto duplicado de escritorio).
- Rendimiento CI Linux, viewport móvil, renderizado por software y CPU limitada 4×: sol 33,06 fps promedio, 26 draw calls, 16.518 triángulos y 146 muestras; lluvia 31,22 fps promedio, 27 draw calls, 18.438 triángulos y 167 muestras. Ambos con `pixelRatio` 0,5; p95 de frame 33,4 ms y 49,9 ms respectivamente. No garantiza 30 fps en cada frame ni acredita rendimiento en teléfono físico.
- Documentación y licencias: enlaces locales y campos obligatorios verificados; licencias de referencia comprobadas con Git blob SHA y copias npm/runtime comparadas byte a byte. No aplica prueba ejecutable a los cambios documentales; validación alternativa determinista de estructura, enlaces y contenido.
- Compatibilidad de hardware: AR sigue siendo detección de capacidades; sesión inmersiva, hit-test y comprobaciones en dispositivos físicos continúan pendientes y no se anuncian como implementados.

Subagente(s) o área(s) involucrada(s): Orquestación / Integración / QA / Despliegue, Frontend / UI / Rendimiento, Documentación / Versionado

Compatibilidad: Compatible — corrección de rendimiento y publicación; la resolución interna puede disminuir para priorizar fluidez.

## [0.2.2] - 2026-10-23

### Corregido

- Variación de rendimiento detectada en runners Linux posteriores a la publicación anterior: menor resolución adaptativa mínima (`pixelRatio` 0,375), HUD a 10 Hz con cambios de fase inmediatos y sin mutaciones DOM repetidas para estados idénticos.
- Grupos de actores inactivos con cero draw calls: se eliminan hasta 6 llamadas redundantes sin ocultar actores activos.
- Benchmark separado en `tests/e2e/performance.spec.ts`, sin captura de trazas durante la medición; las pruebas funcionales conservan trazas ante fallos. No se atribuye toda la variación de rendimiento a las trazas. Se mantienen los umbrales de 30 fps promedio, 100 draw calls y 100.000 triángulos.
- README y preparación del entorno actualizados con el artefacto 0.2.2 realmente publicado y sus mediciones.

### Validación

- Pruebas o comandos ejecutados: ciclos TDD rojo → verde → refactor documentados en `docs/tdd/ui-performance.md`, `docs/tdd/actor-rendering.md` y `docs/tdd/quality.md`; `npm test`, `npm run build`, `npm run test:e2e`; suite contra la URL real con `PLAYWRIGHT_BASE_URL`; validación de estructura Markdown, enlaces locales y hashes/copias de licencias; `git diff --check`.
- Resultado: 63/63 pruebas unitarias en 15 archivos y build correcto. E2E local: 7 correctas y 1 omitida en 46,3 s. El [flujo 39988830105](https://github.com/OdinTKD/ciclovia-bogota-xr/actions/runs/39988830105) completó verify y deploy para el commit `fc9651f`, versión 0.2.2. Suite posterior contra [la demo real](https://odintkd.github.io/ciclovia-bogota-xr/): 7 correctas y 1 omitida en 52,8 s; omisión del presupuesto duplicado de escritorio. Verificado HUD sin mutaciones DOM repetidas en escritorio y viewport móvil.
- Rendimiento CI Linux con renderizado por software, viewport móvil y CPU limitada 4×: sol 37,14 fps promedio, 20 draw calls, 15.126 triángulos y 143 muestras; lluvia 34,31 fps promedio, 24 draw calls, 17.622 triángulos y 171 muestras. Ambos con `pixelRatio` 0,375 y p95 de frame de 33,4 ms. Evidencia: `docs/performance/022-ci-sun.json` y `022-ci-rain.json`.
- Rendimiento contra la publicación desde Chromium local con viewport móvil y CPU limitada 4×: sol 36,81 fps promedio y 154 muestras; lluvia 33,42 fps promedio y 171 muestras. Mismos draw calls/triángulos, `pixelRatio` 0,375 y p95 de 33,4 ms. Evidencia: `docs/performance/022-live-sun.json` y `022-live-rain.json`; capturas en `docs/screenshots/022-live-desktop.png` y `022-live-mobile.png`.
- Documentación y licencias: estructura y enlaces locales correctos; 3 licencias MIT de referencia con Git blob SHA exacto; 55 copias npm y 4 copias runtime en public/dist idénticas a los originales. No aplica prueba ejecutable a la documentación; validación alternativa determinista de estructura, enlaces y contenido.
- Límites: los FPS representan promedios de laboratorio, no una garantía por frame o en teléfonos reales; la resolución interna puede bajar. AR continúa limitada a detección de capacidades, sin sesión inmersiva ni hit-test implementados. Se conserva el historial de mediciones previas.

Subagente(s) o área(s) involucrada(s): Orquestación / Integración / QA / Despliegue, Frontend / UI / Rendimiento, Documentación / Versionado

Compatibilidad: Compatible — correcciones de rendimiento y documentación; sin cambiar controles ni umbrales de aceptación.

## [0.3.0-alpha.1] - 2026-10-23

### Agregado

- Candidato técnico de Puerta A: fragmento de 200 m dentro del recorrido previsto de 1.200 m, controlador cinemático con orientación, reloj Rapier único a 1/60 s, contactos frontal/lateral y recuperación; frenada ARCADE desde 8 m/s en 4–5 m con sol y 6–7 m con lluvia.
- Bicicleta/manos procedurales animadas y cámara en primera persona; diagnóstico descargable con reinicios, resúmenes acumulados y cambios de resolución, separado de las observaciones humanas.
- Revisión pública con vídeo real de teclado de 43,60 s, 1280×720, 25 FPS VP9, capturas y registro de eventos sin errores; tablas locales antes/después y CI con resolución efectiva.

### Corregido

- Consultas físicas sin pasos extra, contactos con daño limitado por cooldown, velocidad real contra sólidos, replay a distintas tasas de frame y muestreo de todos los RAF jugando, incluso sin tick físico.
- Repetición de P/Escape que alternaba pausa y reanudación: regresión roja reproducida, corrección y refactor comprobados.
- Coste de render tras fallo CI 40000545028: batching por assembly con colores de vértice conserva geometría, colores y pivotes de la bicicleta, 3.276 triángulos, ahora 5 meshes y 1 material. Sin relajar 30 FPS, máximo 100 draw calls/100.000 triángulos ni mínimo de ratio 0,375.

### Validación

- Pruebas o comandos ejecutados: ciclos rojo → verde → refactor en docs/tdd/gate-a-physics.md, gate-a-render.md y gate-a-integration.md; npm test, npm run build, presupuestos locales y E2E; suite funcional contra Pages con PLAYWRIGHT_BASE_URL; smoke de juego/review/vídeo; comprobación de estructura/enlaces/JSON y licencias, comparación byte a byte del prefijo previo de CHANGELOG.md y git diff --check.
- Resultado: 100/100 unitarias en 20 archivos y build correcto. CI final [40003117329](https://github.com/OdinTKD/ciclovia-bogota-xr/actions/runs/40003117329) con verify y deploy correctos para ed9639de4c8120d7926d988775665e029f202a75; 14 E2E aprobadas y 2 omitidas en 1,7 minutos (presupuestos duplicados en escritorio). Contra Pages, 10/10 funcionales en 38,3 s con el mismo JS index-DJfD5Eas.js del build.
- Publicación comprobada: [juego](https://odintkd.github.io/ciclovia-bogota-xr/), [review/vídeo](https://odintkd.github.io/ciclovia-bogota-xr/review/) HTTP 200; vídeo reproducido con currentTime mayor que cero, 10.597.611 bytes iguales al archivo local y cero errores. Evidencia en docs/performance/gate-a/live-verification.json.
- CI final de 18 s, Linux/Chromium, viewport Pixel 7 y CPU 4×: sol 36,36 FPS promedio, 20 calls, 17.966 triángulos, 655 muestras; lluvia 34,97 FPS, 21 calls, 19.886 triángulos, 630 muestras. Ratio 0,75, drawing buffer 309×629, CSS 412×839, DPR emulado 2,625; p95/p99≈33,4 ms, máximo 50 ms. CI anterior verde 40002460207 conservada; variabilidad del runner sin cambios de runtime, sin atribuir toda diferencia al código.
- Comparación local de recorrido 18 s preservada: antes 51,73/59,67 FPS sol/lluvia; después 38,97/40,46. Las resoluciones adaptativas difieren; no se anuncia mejora causal de FPS. Estas mediciones emuladas no acreditan teléfono físico ni garantizan 30 FPS cada frame; los FPS del vídeo tampoco miden el rendimiento del juego.
- Documentación validada con enlaces locales y métricas JSON; licencias originales conservadas. No aplica prueba ejecutable al cierre documental: validación alternativa determinista de estructura, enlaces y contenido. Historial previo preservado byte a byte.
- Estado de aceptación: Puerta A sigue ABIERTA. Prueba física expresamente aplazada por el usuario hasta disponer de modelo, OS y navegador reales; no se registran plantillas como resultados. El OK de A está pendiente. B no autorizada. La ampliación visual de A con Blender, materiales/vegetación/fachadas/iluminación en una muestra de 25–50 m y capturas/vídeo reales queda autorizada como trabajo posterior, con entrada y evidencia nuevas; no está entregada aquí. Geografía real, modelos finales y AR jugable no se certifican.

Subagente(s) o área(s) involucrada(s): Orquestación / Integración / QA / Despliegue, Motor / Física / Vehículos, Render / Cámara / Rendimiento, Documentación / Versionado

Compatibilidad: Compatible como candidato prerelease de A — conserva controles, stack, rutas de configuración y diagnóstico usados por E2E; añade orientación y campos de métricas, usa fragmento de prueba de 200 m y cambia deliberadamente conducción/contactos. No representa la aprobación de A ni la entrega completa de 0.3.0.

## [0.3.0-alpha.2] - 2026-10-23

### Agregado

- Muestra visual original de 40 m dentro de los 200 m de A: bicicleta/manos producidas en Blender 5.1.2 CLI background, parque a izquierda y fachadas a derecha, siete texturas originales, materiales e iluminación. Se conservan fuente .blend, script, GLB y manifest; sin descargas de assets de terceros.
- GLB de bicicleta/manos: 187.596 bytes, 7.120 triángulos, 9 llamadas geométricas y 2 materiales; SHA-256 6676817a5e6a9302625a84b3f3ff3b2d489d6404c3ee8966f927356b92f92d76. Galería real sol/lluvia y vídeo de giro/contragiro/frenada, 15,68 s, 1280×720, 25 FPS VP9.
- LOD de entorno high 27.500 triángulos/17 llamadas; low 11.856/11, conservando 14 árboles, 5 fachadas y posiciones. Ambas versiones residentes (~4,2 MB de texturas), solo una visible; diagnóstico registra materialQuality, shadows, antialias y artDetail.

### Corregido

- Rendimiento por software tras presupuestos CI fallidos: calibración de 12–25 RAF renderizados antes de Iniciar, material diffuse y filtrado reducido en mínimo, MSAA desactivado con DPR>1 y LOD low. High conserva apariencia, filtros, PBR/sombras y MSAA de escritorio 1x. Ratio mínimo0,375 y límites 30 FPS / 100 calls / 100.000 triángulos intactos.
- Selección de clima durante carga y último grado de calidad sin renderizar al final de preparación, con regresiones rojo → verde → refactor. Comparación exacta de texturas con Buffer.equals/byteOffset/byteLength en vez de comparación profunda, sin ampliar timeout.
- Preparación de CI con Ubuntu 24.04 e instalación de Chromium sin apt redundante, conservando todas las pruebas.

### Validación

- Pruebas o comandos ejecutados: TDD de modelo, entorno/LOD, carga/calibración/filtrado/MSAA e integración en docs/tdd/; npm test, npm run build, E2E; tools/qa/verify-art.mjs local y contra Pages; benchmarks separados dentro del arte por software y GPU; enlaces, JSON, hashes/licencias, prefijo histórico byte a byte y git diff --check.
- Resultado: CI [40018717275](https://github.com/OdinTKD/ciclovia-bogota-xr/actions/runs/40018717275) verify y deploy correctos, commit de prueba 14579b1 / runtime 72c1075; 124/124 unitarias en 27 archivos, build correcto y 18 E2E aprobadas / 2 omitidas en 3,5 minutos, omisiones de presupuesto redundante escritorio. Bundle ≈5,02 MB / 1,85 MB gzip con advertencia de tamaño.
- Publicación: [juego](https://odintkd.github.io/ciclovia-bogota-xr/) y [galería](https://odintkd.github.io/ciclovia-bogota-xr/review/art/) comprobados el 2026-10-23 a 20:27:20 UTC: alpha.2, GLB/hash exacto, diagnóstico, vídeo reproducido e imágenes decodificadas, cero errores; evidencia docs/performance/gate-a-art/live-verification.json.
- Recorrido CI 18 s: sol 56,67 FPS, 30 calls / 23.834 triángulos; lluvia 56,01 FPS, 31 calls / 25.754 triángulos. Ambos 154×314 / ratio 0,375 / low, p95/p99≈33,3/33,4 ms. Corto CI sol 59,34 FPS dentro del arte; lluvia 55,96 FPS fuera del arte, sin presentarlo como medición dentro de muestra.
- Benchmark quieto 6 s dentro de 40 m: SwiftShader / CPU 4× / low / diffuse / sin MSAA ni sombras, 60,0017/60,0037 FPS sol/lluvia,30/31 calls y 23.834/25.754 triángulos, 154×314. Intel Arc 140T D3D11 / high / PBR / sombras / MSAA, 59,9997/60,0007 FPS,36/37 calls y 39.478/41.398 triángulos, 1280×720. No son pruebas de teléfono ni garantía por frame; FPS de vídeo no miden rendimiento. Comparaciones históricas con calidad/resolución diferentes no acreditan mejora causal aislada.
- Documentación: enlaces y procedencia comprobados, hash GLB y licencias conservadas; historial previo idéntico byte a byte. No aplica prueba ejecutable al cierre documental; validación alternativa determinista de estructura, enlaces y contenido.
- Límites: prototipo estilizado, pixelado/copas simplificadas en low, transición brusca tras 40 m y recorte exterior de manos/controles; high no representa el modo mínimo. A sigue ABIERTA por revisión/OK del usuario. Teléfono expresamente aplazado hasta modelo/OS/navegador reales; B, audio y rediseño UI no autorizados ni entregados. No se certifica geografía real ni AR jugable.

Subagente(s) o área(s) involucrada(s): Orquestación / Integración / QA / Despliegue, Blender / Modelo original, Entorno / Arte / Render / Rendimiento, Arquitectura / CI, Documentación / Versionado

Compatibilidad: Compatible como candidato prerelease de A — conserva física, controles, tráfico, stack y umbrales; añade presentación y calidad adaptativa con degradación visible en el modo mínimo. No representa aprobación de A ni entrega completa de 0.3.0.
