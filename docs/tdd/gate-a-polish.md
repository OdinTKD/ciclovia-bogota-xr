# Puerta A: acabado, recorrido y mínimo visual — 0.3.0-alpha.3

Fecha: 2026-10-23. No acredita teléfono físico ni aprobación artística.

## Rojo real

- `npx vitest run tests/unit/quality-polish.test.ts tests/unit/gate-route.test.ts`: cuatro fallos. El mínimo aún era .375 frente a .75 requerido; no existía recuperación a .875 después de ocho segundos rápidos; el primer peatón estaba fuera de los 200 m.
- `polish-ui.spec.ts` contra snapshot compilado de alpha.2: fallo por fondo claro `rgba(252,250,241,.93)` frente al carbón requerido. La prueba también exige HUD en tercio superior y controles táctiles de al menos 44 px en franja inferior.
- `polish-scene.test.ts`: asfalto base tenía diferencia verde-rojo .3645 (límite neutro .03). La misma prueba exige relleno hemisférico ≥1.7 y sol ≤2 para preservar lectura de sombras.
- `renderer-warmup.test.ts`: .375 recibido al preparar shaders frente al nuevo mínimo .75 requerido.

## Verde

- Mínimo .75: viewport 412×839 conserva 309×629 internos. Reducción por ventana de 12 frames; recuperación +.125 tras 8 s con media ≤18 ms, reinicio de estabilidad si no cumple; espera 20 s después de sobrecarga. Máximo limitado al techo del dispositivo. No se modifica la medición de FPS ni el objetivo 30.
- Peatón 01 movido de 220 a 160 m; carro 01 permanece a 110 m. No cambia el comportamiento de tráfico ni se incorporan actores reactivos de B.
- HUD carbón/blanco/amarillo compacto arriba; controles abajo. Dos E2E de layout desktop/mobile verdes.
- Asfalto base neutro, relleno 1.8 y sol 2. La geometría física permanece igual. Prueba estructural verde.
- Warmup utiliza MIN_RATIO compartido y prepara ambos perfiles antes de jugar. Prueba verde.
- `polish-journey.spec.ts` escritorio: partida real con controles, ambos tipos activos antes de 200 m y llegada con salud positiva, sin inyección de estado. Verde en 31.7 s.

## Refactor y validación

- Umbrales nombrados/compartidos; separación entre mínimo .75 y detalle completo ≥1. CSS reformateado en reglas legibles sin duplicar la hoja anterior; controles y IDs conservados.
- Regresión relevante inicial 16/16 unitarias y build correctos. Benchmark preliminar con bicicleta nueva, antes de integrar texturas externas, prueba corta sol/lluvia verde; sol 60.002 FPS a 309×629. No es la medición final.
- Antes visual: snapshot de 153b739 aislado. `tools/qa/compare-polish.mjs` captura cuatro imágenes de juego parado, sin alterar estado: cámara mundo (0,1.65,1.3), yaw 0 / roll 0, FOV 65, ratio 1; 1280×720 y 412×839. Captura y resolución comprobadas por aserciones. No es un benchmark.
- La comparación final, benchmarks finales, CI y publicación se consignan en el informe de rendimiento de esta versión.

## Integración final y regresiones adicionales

- DPR reducido por zoom: prueba unitaria roja porque faltaba `initialPixelRatio`; se extrajo el clamp inicial compartido y pasó. El E2E crea contexto DPR 0.5 y exige ratio ≥.75 y ancho interno ≥600 para viewport 800; verde.
- Textura de referencia ausente: `polish-assets.spec.ts` falló porque el juego iniciaba sin solicitar leaf.png. Se integró `loadArtTextures` en la carga inicial y se compartieron mapas entre los dos niveles de detalle. Verde en escritorio y móvil: error visible, inicio desactivado, ready=false.
- Integración inicial: `npm test` 137/137 en 30 archivos; `npm run build` correcto. E2E focal: 5 pasan / 1 omitido (zoom repetido en móvil). Un primer intento apuntó a preview detenido y dio ERR_CONNECTION_REFUSED; se inició preview y se repitió. Ese fallo de infraestructura no se cuenta como rojo TDD.
- La inspección de las capturas integradas detectó hojas rectangulares negras. Se devolvió al área de entorno: PNG sin alpha, tratado con regresión de formato y corrección del generador antes de aceptar las capturas finales.

## Validación integrada local

- Después de corregir el alpha: `npm test` → 138/138 en 30 archivos; `npm run build` → correcto. Build conserva aviso por bundle JS de 5,02 MB (1,85 MB gzip), sin error.
- Suite E2E completa previa a la corrección del PNG: 25 pasan / 3 omitidas; CI debe repetirla contra el artefacto final. Las omisiones son presupuestos duplicados de escritorio y zoom duplicado de móvil, no requisitos fallidos.
- Comparación after: cuatro capturas con cámara/resolución internas verificadas. Vídeo real de 30,4 s: giro, contragiro, frenada, carro, peatón y 200 m con salud 65 y 1 colisión. Vídeo vertical de 8,92 s: giro/frenada con lluvia. No se inyectó estado ni se alteró el reloj.
- `benchmark-art.mjs`, muestra dentro del arte a 14 m: software Pixel 7 viewport / CPU 4×, 42,384 FPS sol y 39,891 lluvia, ratio .75/309×629; Chrome D3D11, 60 FPS ambos, ratio 1 / 1280×720. Máximo observado de muestra: 40 calls / 50.658 tri; comparación portrait high: 42 calls / 51.338 tri. Son mediciones de laboratorio, no teléfono.
- `capture-polish-floor.mjs`: mínimos verificados en sol/lluvia, 309×629 internos, capturas CSS 412×839. Vía, puños y controles legibles; follaje disperso y detalle fino limitado, documentados.
- `verify-polish.mjs` local: versión alpha.3, SHA-256 del GLB, inicio/conducción/pausa/informe, ocho imágenes y reproducción de ambos vídeos correctos; cero errores de página. Publicación y CI se registran en el informe de rendimiento final.
