# Preparación del entorno web

Estado al 2026-10-26: candidato `0.3.0-alpha.3`, runtime `d247ee8575ae56924c29a5b5b8245c023622b98d`. CI 40357178802 verify/deploy correctos: 167 pruebas unitarias y de integración en 35 archivos, build y 25 E2E aprobadas / 3 omitidas en 4,8 minutos. Sesión corta completa 41,193/55,034 FPS sol/lluvia, sin excluir arranque; smoke público exacto correcto a las 16:22:13.192 UTC. A sigue abierta por OK visual; teléfono aplazado y B/C sujetos a aprobación.

Node.js 24 y npm, stack Vite/TypeScript/Three.js/Rapier/WebXR y lockfile existente. Node 24.18.0/npm 11.16.0 fueron comprobados el 23, sin afirmar nueva auditoría del entorno. Blender es herramienta de producción, no runtime.

## Instalación y ejecución

~~~sh
npm ci
npx playwright install chromium
npm run dev
~~~

~~~sh
npm test
npm run check
npm run build
npm run test:e2e
npm run preview
~~~

Son instrucciones reproducibles, no resultados afirmados. [Evidencia de pruebas](docs/performance/gate-a-polish/README.md) y cierre en [CHANGELOG.md](CHANGELOG.md). Bundle aproximado 5,02 MB/1,85 MB gzip con advertencia, no explicación causal única de FPS.

## Publicación y arranque

.github/workflows/deploy.yml verifica pruebas/build/E2E antes de dist. [Demo](https://odintkd.github.io/ciclovia-bogota-xr/) y [galería](https://odintkd.github.io/ciclovia-bogota-xr/review/polish/) existentes no prueban nuevas optimizaciones sin smoke de su revisión. PLAYWRIGHT_BASE_URL apunta a esa URL para repetir la suite.

La verificación final exige nombre/SHA del JS publicado iguales a dist local, hashes del GLB y tres mapas, diagnóstico, imágenes y reproducción de dos vídeos. Gate focal o profiler no equivale a full CI/publicación. No bajar 30 FPS, máximo 100 calls/100.000 triángulos ni mínimo 0,75.

Carga antes de ready: preparar 12 frames del perfil gráfico final; mundo físico desechable con movimiento/un paso/liberación en finally antes de crear jugador nuevo con pasos 0/pose 0. El E2E corto incluye todos los frames jugables de 5 s; no descarta el arranque ni reinicia métricas para aprobar.

## Recursos y aceptación

[Procedencia](THIRD_PARTY_NOTICES.md): GLB original Blender con fuente/script, tres mapas CC0 Poly Haven adaptados y demás superficies originales. [Alcance](docs/architecture/gate-a-polish.md). [Three.js](public/licenses/three-MIT.txt) y [Rapier](public/licenses/rapier-Apache-2.0.txt) se distribuyen con sus licencias en public/licenses y dist/licenses.

Teléfono aplazado hasta modelo, OS y navegador reales. [Protocolo](docs/architecture/gate-a-review.md): jugar quieto 10–15 minutos sin recargar y descargar JSON al primer minuto y al final; resúmenes acumulados, no ventanas independientes de FPS. Sensación/calor se informan aparte. A requiere OK; B/C sujetos a aprobación.

WebXR requiere HTTPS/localhost y dispositivo compatible. Solo existe detección de capacidad, no sesión ni hit-test; mocks no certifican AR ni teléfono.
