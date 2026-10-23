# Ciclovía Bogotá XR

Candidato actual: `0.3.0-alpha.2`, ampliación visual de Puerta A con bicicleta/manos originales de Blender y muestra de 40 m dentro del fragmento de 200 m. A sigue abierta: la revisión artística y el OK del usuario están pendientes; la prueba física fue aplazada hasta identificar modelo, OS y navegador reales. B, audio y rediseño de UI no están entregados. Véanse [alcance visual](docs/architecture/gate-a-art.md), [rendimiento](docs/performance/gate-a-art/README.md) y [protocolo físico](docs/architecture/gate-a-review.md).

Estado actual: CI 40018717275 y publicación correctas para `14579b1`, runtime `72c1075`: 124 unitarias en 27 archivos, build y 18 E2E aprobadas/2 omitidas en 3,5 minutos. Smoke público correcto el 2026-10-23 a las 20:27:20 UTC: alpha.2, modelo/hash, diagnóstico, galería/vídeo/imágenes y cero errores.

Juego web 3D de paseo en bicicleta inspirado en Bogotá, construido con Vite, TypeScript, Three.js y Rapier. La base del MVP conserva un recorrido previsto de 1.200 m; el candidato A valida 200 m con bicicleta tradicional, sol o lluvia, obstáculos, puntuación y estado del vehículo. Las ampliaciones XR requieren detección de capacidades y pruebas en dispositivos compatibles.

Código fuente: [OdinTKD/ciclovia-bogota-xr](https://github.com/OdinTKD/ciclovia-bogota-xr). El MVP incluye detección de capacidad AR; todavía no abre una sesión AR ni implementa hit-test o colocación del escenario.

Juega quieto y en un lugar seguro. Nunca mientras caminas, conduces o pedaleas realmente. La pantalla inicial requiere confirmar este aviso antes de comenzar.

## Ejecutar localmente

Requiere Node.js 24 y npm.

```sh
npm ci
npm run dev
```

Demo del proyecto: [Jugar Ciclovía Bogotá XR](https://odintkd.github.io/ciclovia-bogota-xr/). Candidato alpha.2 publicado y verificado; [galería visual](https://odintkd.github.io/ciclovia-bogota-xr/review/art/) y [evidencia del smoke](docs/performance/gate-a-art/live-verification.json). A sigue abierta.

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

Vitest verifica lógica y Playwright los flujos del navegador. El [flujo final 40018717275](https://github.com/OdinTKD/ciclovia-bogota-xr/actions/runs/40018717275) verifica la corrección de carga/clima del commit de prueba `14579b1`, runtime `72c1075`; verify/deploy correctos y smoke público comprobado. La primera CI visual falló en muestras/FPS; se corrigió con calibración de 12–25 RAF reales antes de Iniciar. La ejecución intermedia se canceló por sustitución, no por regresión. [Evidencia TDD](docs/tdd/art-integration.md) y [CHANGELOG.md](CHANGELOG.md).

Las pruebas funcionales conservan trazas ante fallos. La medición de rendimiento está separada en `tests/e2e/performance.spec.ts` y desactiva la captura de trazas durante el benchmark. Esto evita añadir ese trabajo al periodo medido, sin atribuirle toda la variación entre ejecuciones ni cambiar los umbrales exigidos.

Para verificar una URL desplegada con la misma suite, definir `PLAYWRIGHT_BASE_URL` con la URL completa, incluyendo el subdirectorio y la barra final. Ejemplo en PowerShell:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://odintkd.github.io/ciclovia-bogota-xr/'
npm run test:e2e
Remove-Item Env:PLAYWRIGHT_BASE_URL
```

Este comando prueba el destino indicado sin iniciar el servidor local. La suite se ejecutó correctamente contra esta URL el 2026-10-23; una futura actualización debe volver a verificarse.

## Rendimiento y límites

Objetivo: al menos 30 fps en celular de gama media, máximo 100 draw calls y 100.000 triángulos por frame. Los contadores del renderizador comprueban el presupuesto geométrico; una medición en Chromium de escritorio no demuestra los FPS de un teléfono.

La validación local utiliza viewport móvil y limitación de CPU 4× en Chromium para sol y lluvia. El bundle principal de producción pesa aproximadamente 5,02 MB sin comprimir / 1,85 MB gzip e incluye Rapier compat; el build advierte sobre ese tamaño. La primera carga depende de la red y del dispositivo.

La calidad se ajusta automáticamente reduciendo la resolución interna cuando el promedio de frames empeora; puede bajar hasta `pixelRatio` 0,375. En móvil se eliminó el desenfoque CSS para reducir coste de composición. El HUD se actualiza a 10 Hz, aplica cambios de fase de inmediato y evita mutaciones DOM cuando el estado no cambia. Los grupos de actores inactivos no generan draw calls. El ajuste prioriza fluidez y puede hacer menos nítida la imagen.

Benchmark actual quieto de 6 s dentro de los 40 m: software low 60,0017/60,0037 FPS sol/lluvia, 30/31 calls, 23.834/25.754 triángulos, 154×314, ratio 0,375, diffuse sin sombras/MSAA. GPU Intel Arc 140T high: ~60/60 FPS, 36/37 calls, 39.478/41.398 triángulos, 1280×720, ratio 1, PBR/sombras/MSAA. [Condiciones, históricos y límites](docs/performance/gate-a-art/README.md); no acredita teléfono ni garantiza FPS cada frame.

Entorno high: 27.500 triángulos/17 llamadas; low: 11.856/11, mismas 14 posiciones de árboles y 5 fachadas con menos detalles. Ambas versiones residen en memoria, solo una es visible. El modo mínimo también limita filtrado y usa menos definición; [captura low](docs/screenshots/gate-a-art/low-emulated.png) con pixelado y recorte de manos/controles visibles. La galería high mantiene su apariencia anterior y no representa el modo mínimo. A sigue pendiente de aprobación artística.

WebXR/AR requiere HTTPS, navegador, permisos y hardware compatibles. Las pruebas de capacidades o fallback no sustituyen una prueba real de AR y hit-test en dispositivo. No se declara rendimiento móvil ni funcionamiento XR en hardware sin esa evidencia.

## Recursos y licencias

La escena combina geometría/texturas procedurales originales y bicicleta/manos originales producidas en Blender. Los repositorios de referencia se consultaron como inspiración; no se copió su código. Commits y textos MIT leídos, y licencias de dependencias instaladas: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
