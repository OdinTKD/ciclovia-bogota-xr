# Preparación del entorno web

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

El flujo `.github/workflows/pages.yml` verifica pruebas y build en pushes a `main` o por ejecución manual, antes de publicar `dist`. Configurar Pages para usar GitHub Actions. Un flujo creado localmente no acredita un despliegue: comprobar la URL antes de anunciar una demo.

WebXR requiere HTTPS o localhost durante desarrollo, navegador y dispositivo compatibles y permisos del usuario. AR necesita sesión `immersive-ar` y hit-test. Sin soporte, debe poder continuarse en web 3D. Las pruebas de fallback o mocks no certifican funcionamiento en un teléfono o visor real.

En este MVP solo se detecta la capacidad AR; no se implementan sesión inmersiva, hit-test ni colocación en una superficie. El juego funciona en pantalla normal.

## Licencias y recursos

El MVP utiliza geometrías originales procedurales; no incorpora modelos, texturas, música ni código de los repositorios de referencia. Las licencias consultadas y los avisos de paquetes instalados están en [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Las licencias runtime de [Three.js](public/licenses/three-MIT.txt) y [Rapier](public/licenses/rapier-Apache-2.0.txt) se incluyen en `public/licenses/` para copiarse al build y distribuirse junto con el juego.

Los objetivos de rendimiento y controles están en [README.md](README.md). Medir FPS en hardware real sigue pendiente antes de afirmar rendimiento en celular de gama media.
