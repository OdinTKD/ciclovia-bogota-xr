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

Consulta [SETUP.md](SETUP.md) para preparar las pruebas de navegador, compilar y configurar GitHub Pages. No hay una URL de demo pública verificada registrada aquí.

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

Vitest verifica la lógica y Playwright los flujos del navegador. GitHub Actions ejecuta pruebas, compilación y E2E antes de desplegar `dist` a Pages, y conserva reportes. La evidencia de TDD está en `docs/tdd/`; cada cierre se registra en [CHANGELOG.md](CHANGELOG.md). Un workflow local no acredita una ejecución satisfactoria en GitHub.

Para verificar una URL desplegada con la misma suite, definir `PLAYWRIGHT_BASE_URL` con la URL completa, incluyendo el subdirectorio y la barra final. Ejemplo en PowerShell:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://odintkd.github.io/ciclovia-bogota-xr/'
npm run test:e2e
Remove-Item Env:PLAYWRIGHT_BASE_URL
```

Este comando prueba el destino indicado sin iniciar el servidor local. La dirección del ejemplo debe estar desplegada antes de ejecutarlo; no acredita por sí sola una demo verificada.

## Rendimiento y límites

Objetivo: al menos 30 fps en celular de gama media, máximo 100 draw calls y 100.000 triángulos por frame. Los contadores del renderizador comprueban el presupuesto geométrico; una medición en Chromium de escritorio no demuestra los FPS de un teléfono.

La validación local utiliza viewport móvil y limitación de CPU 4× en Chromium para sol y lluvia. El bundle principal de producción pesa aproximadamente 4,89 MB sin comprimir / 1,81 MB gzip e incluye Rapier compat; el build advierte sobre ese tamaño. La primera carga depende de la red y del dispositivo.

Última medición local: [sol](docs/performance/local-sun.json), 35,41 fps, 26 draw calls y 16.518 triángulos; [lluvia](docs/performance/local-rain.json), 35,64 fps, 27 draw calls y 18.438 triángulos. Cada registro contiene 180 muestras; p95 de frame: 33,4 ms. Son resultados de laboratorio en navegador con CPU limitada 4×, pendientes de validación en teléfono real.

WebXR/AR requiere HTTPS, navegador, permisos y hardware compatibles. Las pruebas de capacidades o fallback no sustituyen una prueba real de AR y hit-test en dispositivo. No se declara rendimiento móvil ni funcionamiento XR en hardware sin esa evidencia.

## Recursos y licencias

La escena utiliza geometrías originales procedurales. Los repositorios de referencia se consultaron como inspiración; no se copió su código. Commits y textos MIT leídos, y licencias de dependencias instaladas: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
