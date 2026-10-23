# Ciclovía Bogotá XR

Juego web 3D de paseo en bicicleta inspirado en Bogotá, construido con Vite, TypeScript, Three.js y Rapier. El MVP recorre una ruta de 1.200 m con bicicleta tradicional, sol o lluvia, obstáculos, puntuación y estado del vehículo. Las ampliaciones XR requieren detección de capacidades y pruebas en dispositivos compatibles.

Código fuente: [OdinTKD/ciclovia-bogota-xr](https://github.com/OdinTKD/ciclovia-bogota-xr). El MVP incluye detección de capacidad AR; todavía no abre una sesión AR ni implementa hit-test o colocación del escenario.

Juega quieto y en un lugar seguro. Nunca mientras caminas, conduces o pedaleas realmente. La pantalla inicial requiere confirmar este aviso antes de comenzar.

## Ejecutar localmente

Requiere Node.js 24 y npm.

```sh
npm ci
npm run dev
```

Demo: [Jugar Ciclovía Bogotá XR](https://odintkd.github.io/ciclovia-bogota-xr/). Publicación verificada el 2026-10-23: HTTP 200, título correcto y 5 pruebas E2E satisfactorias contra la URL real; 1 prueba redundante de rendimiento en escritorio omitida.

Consulta [SETUP.md](SETUP.md) para preparar las pruebas de navegador, compilar y configurar GitHub Pages.

## Controles

| Acción | Teclado / interfaz |
| --- | --- |
| Pedalear | W o flecha arriba |
| Girar | A/D o flechas izquierda/derecha |
| Frenar | Espacio, S o flecha abajo |
| Pausar / continuar | Botones de pausa y «Seguir rodando»; P o Escape |
| Reiniciar | «Volver a empezar» en pausa o al terminar |
| Control táctil | Botones de giro, freno y pedaleo en pantalla |
| Clima | Selector Sol / Lluvia antes de empezar o durante la pausa |
| Humor | Interruptor de humor bogotano; puede desactivarse |

La lluvia reduce el agarre y la eficacia de frenado. El HUD muestra velocidad, distancia, puntos y estado. El paseo termina al completar la ruta o agotar el estado del vehículo.

El humor se edita en `public/config/humor/bogota.json`; los parámetros de tráfico están en `public/config/traffic.json`. Mantener las estructuras JSON válidas al modificar contenido.

## Validación y CI

```sh
npm test
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
```

Vitest verifica la lógica y Playwright los flujos del navegador. GitHub Actions ejecuta pruebas, compilación y E2E antes de desplegar `dist` a Pages, y conserva reportes. La evidencia de TDD está en `docs/tdd/`; cada cierre se registra en [CHANGELOG.md](CHANGELOG.md). El [flujo 39985901277](https://github.com/OdinTKD/ciclovia-bogota-xr/actions/runs/39985901277) completó correctamente verificación y publicación del commit `2eed72d`, versión 0.2.1. Suite unitaria: 61/61; build correcto; suite en la URL publicada: 5 correctas y 1 omitida en 35,5 s.

Para verificar una URL desplegada con la misma suite, definir `PLAYWRIGHT_BASE_URL` con la URL completa, incluyendo el subdirectorio y la barra final. Ejemplo en PowerShell:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://odintkd.github.io/ciclovia-bogota-xr/'
npm run test:e2e
Remove-Item Env:PLAYWRIGHT_BASE_URL
```

Este comando prueba el destino indicado sin iniciar el servidor local. La suite se ejecutó correctamente contra esta URL el 2026-10-23; una futura actualización debe volver a verificarse.

## Rendimiento y límites

Objetivo: al menos 30 fps en celular de gama media, máximo 100 draw calls y 100.000 triángulos por frame. Los contadores del renderizador comprueban el presupuesto geométrico; una medición en Chromium de escritorio no demuestra los FPS de un teléfono.

La validación local utiliza viewport móvil y limitación de CPU 4× en Chromium para sol y lluvia. El bundle principal de producción pesa aproximadamente 4,89 MB sin comprimir / 1,81 MB gzip e incluye Rapier compat; el build advierte sobre ese tamaño. La primera carga depende de la red y del dispositivo.

La calidad se ajusta automáticamente reduciendo la resolución interna cuando el promedio de frames empeora; puede bajar hasta `pixelRatio` 0,5. En móvil se eliminó el desenfoque CSS para reducir coste de composición. El ajuste prioriza fluidez y puede hacer menos nítida la imagen.

Medición CI Linux con renderizado por software, viewport móvil y CPU limitada 4×: [sol](docs/performance/ci-performance-sun.json), 33,06 fps, 26 draw calls y 16.518 triángulos; [lluvia](docs/performance/ci-performance-rain.json), 31,22 fps, 27 draw calls y 18.438 triángulos. Ambos usaron `pixelRatio` 0,5; p95 de frame: 33,4 ms en sol y 49,9 ms en lluvia. Los FPS son promedios, no una garantía de 30 fps en cada frame. La medición local inicial de 0.2.0 se conserva en [sol](docs/performance/local-sun.json) y [lluvia](docs/performance/local-rain.json).

Contra la demo publicada, Chromium local con viewport móvil y CPU limitada 4× registró [sol](docs/performance/live-sun.json), 36,61 fps, y [lluvia](docs/performance/live-rain.json), 35,29 fps, con `pixelRatio` 1,5 y 180 muestras por clima. Este resultado también corresponde a emulación de laboratorio.

WebXR/AR requiere HTTPS, navegador, permisos y hardware compatibles. Las pruebas de capacidades o fallback no sustituyen una prueba real de AR y hit-test en dispositivo. No se declara rendimiento móvil ni funcionamiento XR en hardware sin esa evidencia.

## Recursos y licencias

La escena utiliza geometrías originales procedurales. Los repositorios de referencia se consultaron como inspiración; no se copió su código. Commits y textos MIT leídos, y licencias de dependencias instaladas: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
