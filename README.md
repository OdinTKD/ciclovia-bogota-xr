# Ciclovía Bogotá XR

Candidato técnico publicado: `0.3.0-alpha.1`, exclusivamente Puerta A: conducción con orientación, contactos y bicicleta/manos procedurales en un fragmento de 200 m. A sigue abierta. La prueba física fue expresamente aplazada por el usuario hasta aportar modelo, OS y navegador reales; el OK de A sigue pendiente. La ampliación visual de A con Blender y una muestra de 25–50 m está autorizada para trabajo posterior, sin abrir B. Véanse la [revisión y protocolo físico](docs/architecture/gate-a-review.md) y las [decisiones de A](docs/architecture/gate-a.md).

Validación final: 100/100 unitarias en 20 archivos, build correcto, 14 E2E aprobadas y 2 omitidas en CI; 10/10 funcionales contra Pages. El [vídeo público de revisión](https://odintkd.github.io/ciclovia-bogota-xr/review/) muestra giro, frenada y contactos sobre el proxy procedural; no acredita arte final, teléfono ni aprobación del usuario.

Juego web 3D de paseo en bicicleta inspirado en Bogotá, construido con Vite, TypeScript, Three.js y Rapier. La base del MVP conserva un recorrido previsto de 1.200 m; el candidato A valida 200 m con bicicleta tradicional, sol o lluvia, obstáculos, puntuación y estado del vehículo. Las ampliaciones XR requieren detección de capacidades y pruebas en dispositivos compatibles.

Código fuente: [OdinTKD/ciclovia-bogota-xr](https://github.com/OdinTKD/ciclovia-bogota-xr). El MVP incluye detección de capacidad AR; todavía no abre una sesión AR ni implementa hit-test o colocación del escenario.

Juega quieto y en un lugar seguro. Nunca mientras caminas, conduces o pedaleas realmente. La pantalla inicial requiere confirmar este aviso antes de comenzar.

## Ejecutar localmente

Requiere Node.js 24 y npm.

```sh
npm ci
npm run dev
```

Demo: [Jugar Ciclovía Bogotá XR](https://odintkd.github.io/ciclovia-bogota-xr/). Candidato 0.3.0-alpha.1 publicado el 2026-10-23, commit `ed9639de4c8120d7926d988775665e029f202a75`. Juego, revisión y vídeo HTTP 200; vídeo reproducido y contenido igual al local. A permanece abierta.

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

Vitest verifica la lógica y Playwright los flujos del navegador. El [flujo 40003117329](https://github.com/OdinTKD/ciclovia-bogota-xr/actions/runs/40003117329) terminó verify y deploy correctamente: 100/100 unitarias, build y 14 E2E aprobadas/2 omitidas en 1,7 minutos. Son omisiones de presupuesto duplicado en escritorio. Contra la URL pública pasaron 10/10 funcionales en 38,3 s. Evidencia: [smoke final](docs/performance/gate-a/live-verification.json), `docs/tdd/` y [CHANGELOG.md](CHANGELOG.md).

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

La validación local utiliza viewport móvil y limitación de CPU 4× en Chromium para sol y lluvia. El bundle principal de producción pesa aproximadamente 4,89 MB sin comprimir / 1,81 MB gzip e incluye Rapier compat; el build advierte sobre ese tamaño. La primera carga depende de la red y del dispositivo.

La calidad se ajusta automáticamente reduciendo la resolución interna cuando el promedio de frames empeora; puede bajar hasta `pixelRatio` 0,375. En móvil se eliminó el desenfoque CSS para reducir coste de composición. El HUD se actualiza a 10 Hz, aplica cambios de fase de inmediato y evita mutaciones DOM cuando el estado no cambia. Los grupos de actores inactivos no generan draw calls. El ajuste prioriza fluidez y puede hacer menos nítida la imagen.

Medición CI final Linux/Chromium, viewport Pixel 7 y CPU limitada 4×, 18 s: [sol](docs/performance/gate-a/ci-40003117329-route-performance-sun.json), 36,36 fps promedio, 20 draw calls y 17.966 triángulos; [lluvia](docs/performance/gate-a/ci-40003117329-route-performance-rain.json), 34,97 fps, 21 draw calls y 19.886 triángulos. Ambos ratio 0,75, drawing buffer 309×629, CSS 412×839 y DPR emulado 2,625; p95/p99 aproximadamente 33,4 ms, máximo 50 ms. Son promedios de laboratorio, no 30 fps garantizados por frame ni resultados de teléfono físico. La [revisión de A](docs/architecture/gate-a-review.md) conserva comparación local antes/después, resoluciones e histórico sin atribuir diferencias de FPS solamente al código.

La bicicleta/manos procedural tiene 3.276 triángulos, 5 meshes y 1 material. Coche y peatón siguen siendo placeholders de 48 y 68 triángulos; actores reactivos de B y arte final no están entregados.

WebXR/AR requiere HTTPS, navegador, permisos y hardware compatibles. Las pruebas de capacidades o fallback no sustituyen una prueba real de AR y hit-test en dispositivo. No se declara rendimiento móvil ni funcionamiento XR en hardware sin esa evidencia.

## Recursos y licencias

La escena utiliza geometrías originales procedurales. Los repositorios de referencia se consultaron como inspiración; no se copió su código. Commits y textos MIT leídos, y licencias de dependencias instaladas: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
