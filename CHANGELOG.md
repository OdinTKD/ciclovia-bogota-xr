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
