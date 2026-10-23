# Preparación del entorno web

Estado: candidato técnico publicado `0.3.0-alpha.1`, solo Puerta A, pendiente del OK. La prueba física fue aplazada expresamente por el usuario hasta identificar modelo, OS y navegador reales; ningún ejemplo se registra como resultado. La [revisión de A](docs/architecture/gate-a-review.md) separa medición emulada, validación visual y protocolo físico. La ampliación visual de A con Blender en 25–50 m está autorizada como trabajo posterior y tendrá evidencia y versión propias.

Validación final CI: 100/100 unitarias en 20 archivos, build correcto y 14 E2E aprobadas/2 omitidas en 1,7 minutos. Las omisiones son presupuestos duplicados de escritorio. Contra Pages: 10/10 funcionales en 38,3 s. La primera CI falló en FPS; el batching corrigió el coste sin bajar 30 fps ni ratio mínimo 0,375. El diagnóstico se descarga en pausa al primer minuto y al final de la futura sesión física; son resúmenes acumulados, no segmentos independientes de FPS.

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

Demo del candidato publicada el 2026-10-23: [Ciclovía Bogotá XR](https://odintkd.github.io/ciclovia-bogota-xr/). El [flujo 40003117329](https://github.com/OdinTKD/ciclovia-bogota-xr/actions/runs/40003117329) completó verify y deploy del commit `ed9639de4c8120d7926d988775665e029f202a75`. El [smoke final](docs/performance/gate-a/live-verification.json) confirma juego, [revisión pública](https://odintkd.github.io/ciclovia-bogota-xr/review/) y vídeo HTTP 200, reproducción, 10.597.611 bytes de vídeo iguales al local y cero errores. Para repetir pruebas contra Pages usar `PLAYWRIGHT_BASE_URL` como en [README.md](README.md). Publicar el candidato no cierra A.

Los umbrales de rendimiento no se redujeron: el ajuste automático baja resolución interna hasta `pixelRatio` 0,375; el HUD se actualiza a 10 Hz sin repetir mutaciones DOM, los grupos de actores inactivos no se dibujan y la interfaz móvil evita desenfoque CSS. El benchmark de `tests/e2e/performance.spec.ts` no captura trazas; las pruebas funcionales sí las conservan ante fallos. Los resultados Linux/Chromium/CPU 4× son promedios de laboratorio; no sustituyen mediciones en dispositivo físico.

WebXR requiere HTTPS o localhost durante desarrollo, navegador y dispositivo compatibles y permisos del usuario. AR necesita sesión `immersive-ar` y hit-test. Sin soporte, debe poder continuarse en web 3D. Las pruebas de fallback o mocks no certifican funcionamiento en un teléfono o visor real.

En este MVP solo se detecta la capacidad AR; no se implementan sesión inmersiva, hit-test ni colocación en una superficie. El juego funciona en pantalla normal.

## Licencias y recursos

El MVP utiliza geometrías originales procedurales; no incorpora modelos, texturas, música ni código de los repositorios de referencia. Las licencias consultadas y los avisos de paquetes instalados están en [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Las licencias runtime de [Three.js](public/licenses/three-MIT.txt) y [Rapier](public/licenses/rapier-Apache-2.0.txt) se incluyen en `public/licenses/` para copiarse al build y distribuirse junto con el juego.

Los objetivos de rendimiento y controles están en [README.md](README.md). Medir FPS en hardware real sigue pendiente antes de afirmar rendimiento en celular de gama media.
