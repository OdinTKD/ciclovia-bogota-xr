# Preparación del entorno web

Estado revisado el 2026-10-26: candidato `0.3.0-alpha.3` sin cierre ni publicación verificada; runtime medido `7e6f68b`, nuevas optimizaciones en curso. [Alcance](docs/architecture/gate-a-polish.md) y [comparación/rendimiento](docs/performance/gate-a-polish/README.md). A sigue abierta; teléfono aplazado hasta datos reales, revisión/OK del usuario pendientes.

La revisión local del 2026-10-23 obtuvo 143 unitarias en 32 archivos, build y smoke de GLB/3 mapas/8 imágenes/2 vídeos correctos. CI 40030195058 falló: 23 E2E correctas, 2 fallos FPS y 3 omisiones; no desplegó una entrega aprobada. Los medios corresponden al runtime medido de esa revisión. El diagnóstico contiene resúmenes acumulados y cambios de resolución; para la futura prueba física se descarga al primer minuto y al final sin recargar.

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

La [URL del proyecto](https://odintkd.github.io/ciclovia-bogota-xr/) y [galería de pulido](https://odintkd.github.io/ciclovia-bogota-xr/review/polish/) esperan CI y smoke públicos finales para alpha.3. La [ejecución 40030195058](https://github.com/OdinTKD/ciclovia-bogota-xr/actions/runs/40030195058) falló en FPS; evidencia en [log](docs/performance/gate-a-polish/ci-third-failure.log). El diagnóstico 40031439886 terminó correctamente, sin validar un gate FPS; nuevos cambios requieren pruebas y rendimiento propios. Repetir con PLAYWRIGHT_BASE_URL como en [README.md](README.md); no asumir publicación por existir la URL.

Límites: 30 FPS, 100 calls y 100.000 triángulos; mínimo visual elevado a ratio 0,75, high desde 1. Recuperación +0,125 tras 8 s con medias ≤18 ms y espera 20 s tras sobrecarga. Low conserva mapas/alpha/fog/luces con Lambert interpolado por vértice; high restaura shader original. Ciudad estática y pools optimizados sin cambiar geometría, física o controles. [Métricas y límites visuales](docs/performance/gate-a-polish/README.md).

WebXR requiere HTTPS o localhost durante desarrollo, navegador y dispositivo compatibles y permisos del usuario. AR necesita sesión `immersive-ar` y hit-test. Sin soporte, debe poder continuarse en web 3D. Las pruebas de fallback o mocks no certifican funcionamiento en un teléfono o visor real.

En este MVP solo se detecta la capacidad AR; no se implementan sesión inmersiva, hit-test ni colocación en una superficie. El juego funciona en pantalla normal.

## Licencias y recursos

El candidato utiliza entorno/texturas originales procedurales y un GLB original de bicicleta/manos producido en Blender; incorpora únicamente tres mapas externos CC0 de Poly Haven documentados en los avisos; no reutiliza código o modelos de los repositorios de referencia. Las licencias consultadas y los avisos de paquetes instalados están en [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Las licencias runtime de [Three.js](public/licenses/three-MIT.txt) y [Rapier](public/licenses/rapier-Apache-2.0.txt) se incluyen en `public/licenses/` para copiarse al build y distribuirse junto con el juego.

Los objetivos de rendimiento y controles están en [README.md](README.md). Medir FPS en hardware real sigue pendiente antes de afirmar rendimiento en celular de gama media.
