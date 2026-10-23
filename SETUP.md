# Preparación del entorno web

Estado: candidato publicado `0.3.0-alpha.2`, muestra visual original de 40 m dentro de 200 m de A, producida con Blender 5.1.2 CLI background y entorno procedural. A permanece abierta: revisión/OK pendientes y teléfono expresamente aplazado hasta modelo, OS y navegador reales. [Alcance y assets](docs/architecture/gate-a-art.md), [datos de rendimiento](docs/performance/gate-a-art/README.md) y [protocolo físico](docs/architecture/gate-a-review.md).

Estado actual: runtime `72c1075`, test-only `14579b1`, CI 40018717275 con verify y deploy correctos para `14579b1`: 124 unitarias en 27 archivos, build y 18 E2E aprobadas/2 omitidas en 3,5 minutos. Smoke público correcto el 2026-10-23 a las 20:27:20 UTC. La prueba de comparación de texturas usa Buffer.equals exacto sin ampliar timeout. Las cifras intermedias y fallos están identificados en el informe de rendimiento; no se confunden con resultados actuales.

Ciclovía Bogotá XR usa Vite, TypeScript, Three.js, Rapier y WebXR. `package-lock.json` fija las dependencias. Entorno comprobado el 2026-10-23: Node.js 24.18.0 y npm 11.16.0. CI utiliza Node.js 24.

## Instalación y ejecución

```sh
npm ci
npx playwright install chromium
npm run dev
```

Abrir la dirección impresa por Vite. Para comprobar producción localmente:

```sh
npm run build
npm run preview
```

## Validación

```sh
npm test
npm run check
npm run build
npm run test:e2e
```

Estos comandos son instrucciones reproducibles; sus resultados de cierre se registran en [CHANGELOG.md](CHANGELOG.md). La evidencia rojo → verde → refactor está en `docs/tdd/`.

## GitHub Pages y WebXR

El flujo `.github/workflows/deploy.yml` verifica pruebas y build en pushes a `main` o por ejecución manual, antes de publicar `dist`. Pages está configurado para GitHub Actions en el repositorio del proyecto.

La [URL del proyecto](https://odintkd.github.io/ciclovia-bogota-xr/) y su [galería visual](https://odintkd.github.io/ciclovia-bogota-xr/review/art/) fueron comprobadas para alpha.2 después del [flujo 40018717275](https://github.com/OdinTKD/ciclovia-bogota-xr/actions/runs/40018717275), commit de prueba `14579b1`, runtime `72c1075`. El [smoke final](docs/performance/gate-a-art/live-verification.json) verificó GLB/hash, diagnóstico, vídeo reproducido e imágenes decodificadas sin errores. Para repetir pruebas contra Pages usar PLAYWRIGHT_BASE_URL como en [README.md](README.md).

Los límites siguen en 30 FPS, 100 calls, 100.000 triángulos y ratio mínimo 0,375. El modo mínimo usa LOD low, diffuse, anisotropía 1/bilinear, sin sombras/reflejos y sin MSAA en DPR>1; high mantiene PBR/sombras/filtros originales y MSAA en DPR1. Calibración de 12–25 RAF renderizados antes de Iniciar. Workflow Ubuntu24.04/Chromium sin apt redundante conserva pruebas. Consultar [rendimiento actual y captura low](docs/performance/gate-a-art/README.md).

WebXR requiere HTTPS o localhost durante desarrollo, navegador y dispositivo compatibles y permisos del usuario. AR necesita sesión `immersive-ar` y hit-test. Sin soporte, debe poder continuarse en web 3D. Las pruebas de fallback o mocks no certifican funcionamiento en un teléfono o visor real.

En este MVP solo se detecta la capacidad AR; no se implementan sesión inmersiva, hit-test ni colocación en una superficie. El juego funciona en pantalla normal.

## Licencias y recursos

El candidato utiliza entorno/texturas originales procedurales y un GLB original de bicicleta/manos producido en Blender; no incorpora assets ni código de los repositorios de referencia. Las licencias consultadas y los avisos de paquetes instalados están en [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Las licencias runtime de [Three.js](public/licenses/three-MIT.txt) y [Rapier](public/licenses/rapier-Apache-2.0.txt) se incluyen en `public/licenses/` para copiarse al build y distribuirse junto con el juego.

Los objetivos de rendimiento y controles están en [README.md](README.md). Medir FPS en hardware real sigue pendiente antes de afirmar rendimiento en celular de gama media.
