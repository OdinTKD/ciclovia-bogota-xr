# Puerta A: acabado, recorrido y mínimo visual — 0.3.0-alpha.3

Fecha: 2026-10-23. No acredita teléfono físico ni aprobación artística.

## Rojo real

- `npx vitest run tests/unit/quality-polish.test.ts tests/unit/gate-route.test.ts`: cuatro fallos. El mínimo aún era .375 frente a .75 requerido; no existía recuperación a .875 después de ocho segundos rápidos; el primer peatón estaba fuera de los 200 m.
- `polish-ui.spec.ts` contra snapshot compilado de alpha.2: fallo por fondo claro `rgba(252,250,241,.93)` frente al carbón requerido. La prueba también exige HUD en tercio superior y controles táctiles de al menos44px en franja inferior.
- `polish-scene.test.ts`: asfalto base tenía diferencia verde-rojo .3645 (límite neutro .03). La misma prueba exige relleno hemisférico≥1.7 y sol≤2 para preservar lectura de sombras.
- `renderer-warmup.test.ts`: .375 recibido al preparar shaders frente al nuevo mínimo .75 requerido.

## Verde

- Mínimo .75: viewport412×839 conserva309×629 internos. Reducción por ventana de12frames; recuperación+.125 tras8s con media≤18ms, reinicio de estabilidad si no cumple; espera20s después de sobrecarga. Máximo limitado al techo del dispositivo. No se modifica la medición de FPS ni el objetivo30.
- Peatón01 movido de220a160m; carro01 permanece110m. No cambia el comportamiento de tráfico ni se incorporan actores reactivos de B.
- HUD carbón/blanco/amarillo compacto arriba; controles abajo. Dos E2E de layout desktop/mobile verdes.
- Asfalto base neutro, relleno1.8 y sol2. La geometría física permanece igual. Prueba estructural verde.
- Warmup utiliza MIN_RATIO compartido y prepara ambos perfiles antes de jugar. Prueba verde.
- `polish-journey.spec.ts` escritorio: partida real con controles, ambos tipos activos antes de200m y llegada con salud positiva, sin inyección de estado. Verde en31.7s.

## Refactor y validación

- Umbrales nombrados/compartidos; separación entre mínimo .75 y detalle completo≥1. CSS reformateado en reglas legibles sin duplicar la hoja anterior; controles y IDs conservados.
- Regresión relevante inicial16/16 unitarias y build correctos. Benchmark preliminar con bicicleta nueva, antes de integrar texturas externas, prueba corta sol/lluvia verde; sol60.002FPS a309×629. No es la medición final.
- Antes visual: snapshot de153b739 aislado. `tools/qa/compare-polish.mjs` captura cuatro imágenes de juego parado, sin alterar estado: cámara mundo(0,1.65,1.3),yaw0/roll0,FOV65,ratio1;1280×720 y412×839. Captura y resolución comprobadas por aserciones. No es un benchmark.
- La comparación final, benchmarks finales, CI y publicación se consignan en el informe de rendimiento de esta versión.

## Integración final y regresiones adicionales

- DPR reducido por zoom: prueba unitaria roja porque faltaba `initialPixelRatio`; se extrajo el clamp inicial compartido y pasó. El E2E crea contexto DPR0.5 y exige ratio≥.75 y ancho interno≥600 para viewport800; verde.
- Textura de referencia ausente: `polish-assets.spec.ts` falló porque el juego iniciaba sin solicitar leaf.png. Se integró `loadArtTextures` en la carga inicial y se compartieron mapas entre los dos niveles de detalle. Verde en escritorio y móvil: error visible, inicio desactivado, ready=false.
- Integración inicial: `npm test` 137/137 en30archivos; `npm run build` correcto. E2E focal5pasan/1omitido (zoom repetido en móvil). Un primer intento apuntó a preview detenido y dio ERR_CONNECTION_REFUSED; se inició preview y se repitió. Ese fallo de infraestructura no se cuenta como rojo TDD.
- La inspección de las capturas integradas detectó hojas rectangulares negras. Se devolvió al área de entorno: PNG sin alpha, tratado con regresión de formato y corrección del generador antes de aceptar las capturas finales.

## Validación integrada local

- Después de corregir el alpha: `npm test` → 138/138 en30archivos; `npm run build` → correcto. Build conserva aviso por bundle JS de5,02MB (1,85MBgzip), sin error.
- Suite E2E completa previa a la corrección del PNG:25pasan/3omitidas; CI debe repetirla contra el artefacto final. Las omisiones son presupuestos duplicados de escritorio y zoom duplicado de móvil, no requisitos fallidos.
- Comparación after: cuatro capturas con cámara/resolución internas verificadas. Vídeo real30,4s: giro, contragiro, frenada, carro, peatón y200m con salud65 y1colisión. Vídeo vertical8,92s: giro/frenada con lluvia. No se inyectó estado ni se alteró el reloj.
- `benchmark-art.mjs`, muestra dentro del arte a14m: software Pixel7viewport/CPU4x42,384FPS sol y39,891lluvia, ratio.75/309×629; ChromeD3D11 60FPS ambos, ratio1/1280×720. Máximo observado de muestra:40calls/50.658tri; comparación portraithigh42calls/51.338tri. Son mediciones de laboratorio, no teléfono.
- `capture-polish-floor.mjs`: mínimos verificados en sol/lluvia,309×629internos, capturas CSS412×839. Vía, puños y controles legibles; follaje disperso y detalle fino limitado, documentados.
- `verify-polish.mjs` local: versiónalpha.3, SHA256delGLB, inicio/conducción/pausa/informe, ocho imágenes y reproducción de ambos vídeos correctos; cero errores de página. Publicación y CI se registran en el informe de rendimiento final.
