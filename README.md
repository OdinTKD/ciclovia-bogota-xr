# Ciclovía Bogotá XR

Candidato actual: `0.3.0-alpha.3`, pulido de A: manos/materiales y cámara horizontal/portrait, entorno de 40 m y transición superficial hasta 52 m, UI carbón/blanco/amarillo, ambos encuentros dentro de 200 m y recuperación de calidad. A sigue abierta: revisión y OK del usuario pendientes; teléfono aplazado hasta modelo, OS y navegador reales. B y AR jugable no están entregados. [Alcance](docs/architecture/gate-a-polish.md), [comparación/rendimiento](docs/performance/gate-a-polish/README.md) y [protocolo físico](docs/architecture/gate-a-review.md).

Estado revisado el 2026-10-26: alpha.3 no está cerrada ni publicada como entrega verificada. La [CI 40030195058](https://github.com/OdinTKD/ciclovia-bogota-xr/actions/runs/40030195058), runtime `7e6f68b`, falló con 23 E2E aprobadas, 2 fallos de FPS y 3 omisiones. Las 143 unitarias, build y medios locales del 2026-10-23 son evidencia de esa revisión, no validación de las optimizaciones ahora en curso. El diagnóstico 40031439886 terminó correctamente, pero no es una puerta de FPS; la integración del 2026-10-26 obtuvo 146 unitarias en 33 archivos y build verdes, con evaluación de rendimiento pendiente.

Juego web 3D de paseo en bicicleta inspirado en Bogotá, construido con Vite, TypeScript, Three.js y Rapier. La base del MVP conserva un recorrido previsto de 1.200 m; el candidato A valida 200 m con bicicleta tradicional, sol o lluvia, obstáculos, puntuación y estado del vehículo. Las ampliaciones XR requieren detección de capacidades y pruebas en dispositivos compatibles.

Código fuente: [OdinTKD/ciclovia-bogota-xr](https://github.com/OdinTKD/ciclovia-bogota-xr). El MVP incluye detección de capacidad AR; todavía no abre una sesión AR ni implementa hit-test o colocación del escenario.

Juega quieto y en un lugar seguro. Nunca mientras caminas, conduces o pedaleas realmente. La pantalla inicial requiere confirmar este aviso antes de comenzar.

## Ejecutar localmente

Requiere Node.js 24 y npm.

```sh
npm ci
npm run dev
```

Demo del proyecto: [Jugar](https://odintkd.github.io/ciclovia-bogota-xr/). El candidato alpha.3 y su [galería](https://odintkd.github.io/ciclovia-bogota-xr/review/polish/) se verificarán después de CI; la existencia de la URL no certifica el nuevo despliegue.

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

Vitest y Playwright verifican lógica y flujos. CI 40030195058 falló para runtime `7e6f68b`: sol corto 20,7567 FPS y lluvia de recorrido 29,8068 FPS; 23 E2E pasaron y 3 se omitieron. Los fallos previos por sincronización y presupuestos también se conservan. El [tercer log](docs/performance/gate-a-polish/ci-third-failure.log) no acredita publicación. [TDD](docs/tdd/gate-a-polish.md), [shader](docs/tdd/vertex-diffuse.md) y [CHANGELOG.md](CHANGELOG.md).

Las pruebas funcionales conservan trazas ante fallos. La medición de rendimiento está separada en `tests/e2e/performance.spec.ts` y desactiva la captura de trazas durante el benchmark. Esto evita añadir ese trabajo al periodo medido, sin atribuirle toda la variación entre ejecuciones ni cambiar los umbrales exigidos.

Para verificar una URL desplegada con la misma suite, definir `PLAYWRIGHT_BASE_URL` con la URL completa, incluyendo el subdirectorio y la barra final. Ejemplo en PowerShell:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://odintkd.github.io/ciclovia-bogota-xr/'
npm run test:e2e
Remove-Item Env:PLAYWRIGHT_BASE_URL
```

Este comando prueba el destino indicado sin iniciar el servidor local. Las comprobaciones públicas anteriores pertenecen a sus versiones documentadas; alpha.3 requiere una nueva verificación tras CI verde.

## Rendimiento y límites

Objetivo: al menos 30 fps en celular de gama media, máximo 100 draw calls y 100.000 triángulos por frame. Los contadores del renderizador comprueban el presupuesto geométrico; una medición en Chromium de escritorio no demuestra los FPS de un teléfono.

La validación local utiliza viewport móvil y limitación de CPU 4× en Chromium para sol y lluvia. El bundle principal de producción pesa aproximadamente 5,02 MB sin comprimir / 1,85 MB gzip e incluye Rapier compat; el build advierte sobre ese tamaño. La primera carga depende de la red y del dispositivo.

La calidad se ajusta automáticamente reduciendo la resolución interna cuando el promedio de frames empeora; tiene un mínimo visual elevado a `pixelRatio` 0,75 y recupera calidad tras periodos estables. En móvil se eliminó el desenfoque CSS para reducir coste de composición. El HUD se actualiza a 10 Hz, aplica cambios de fase de inmediato y evita mutaciones DOM cuando el estado no cambia. Los grupos de actores inactivos no generan draw calls. El ajuste prioriza fluidez y puede hacer menos nítida la imagen.

Benchmark local quieto dentro del arte, CPU 4× SwiftShader: 53,520/52,689 FPS sol/lluvia, 28/29 calls, 28.208/30.128 triángulos, 309×629 ratio 0,75. GPU Intel Arc 140T D3D11: 60/60 FPS, 32/33 calls, 48.738/50.658 triángulos, 1280×720 ratio 1. [Condiciones y comparación fija](docs/performance/gate-a-polish/README.md). No equivale a teléfono ni garantiza FPS por frame.

El mínimo usa low/diffuse sin sombras/MSAA; high conserva PBR y sombras. Recuperación +0,125 tras 8 s estables y espera 20 s tras sobrecarga. Modelo original Blender: 10.516 triángulos, 11 llamadas y 4 materiales; tres mapas CC0 de Poly Haven suman 185.009 bytes. Copas ornamentales/dispersas, dedos sin articulación y resto de los 200 m con arte básico después del fundido 40–52 m: no acabado final aprobado.

WebXR/AR requiere HTTPS, navegador, permisos y hardware compatibles. Las pruebas de capacidades o fallback no sustituyen una prueba real de AR y hit-test en dispositivo. No se declara rendimiento móvil ni funcionamiento XR en hardware sin esa evidencia.

## Recursos y licencias

La escena combina geometría/texturas procedurales originales y bicicleta/manos originales producidas en Blender. Los repositorios de referencia se consultaron como inspiración; no se copió su código. Commits y textos MIT leídos, y licencias de dependencias instaladas: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
