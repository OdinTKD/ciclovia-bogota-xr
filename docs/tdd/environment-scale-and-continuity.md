# Entorno: escala y continuidad — 2026-10-26

Ámbito autorizado: tres mejoras dentro de la muestra de 40 m, sin extender el detalle al resto del recorrido. No se modificaron cámara, física, UI, scene.ts, iluminación, presets ni dist. No se abrió navegador durante la medición paralela del orquestador.

## Evidencia de rojo → verde → refactor

Comando inicial: `npx vitest run tests/unit/art-slice.test.ts -t 'masa opaca|fase UV|escala urbana' --reporter=verbose`.

Rojo, 09:24:55 Bogotá: tres fallos por las causas solicitadas:

- La hoja única ocupaba el 45,7438 % del PNG. La nueva distribución exige huecos entre hojas pequeñas y cobertura entre 15 y 42 % con las mismas dimensiones.
- En el extremo de transición z=-52, UV.y era 1; la prolongación de la superficie requería 1,272727. La transición reiniciaba el mapa y comprimía 19 repeticiones en 12 m frente a 44 m de la superficie principal.
- Cinco ladrillos por fila × repetición 3 en 9,4 m daban piezas de 0,6267 m de ancho, fuera del intervalo de diseño de 0,18–0,28 m.

Verde, 09:26:27: suite del entorno 14/14 correcta tras las tres modificaciones.

Durante inspección del nuevo atlas se detectó un defecto adicional: el tallo de soporte muestreaba el centro del mapa, que se había vuelto transparente. Regresión `mantiene visible el tallo` roja a las 09:27:56 (alpha 0 en vez de >128); corrección del tallo dibujado para pasar por el centro, verde a las 09:28:28. Se mantiene conexión real de los brotes con los extremos de rama.

Refactor: constantes compartidas del tramo superficial y centro de transición sustituyen números repetidos; el test decodifica los bytes RGBA reales del PNG con zlib y filtros PNG, sin navegador ni dependencia nativa. Los límites de inventario se endurecieron al presupuesto anterior exacto. Suite completa del entorno 15/15 verde a las 09:28:56. `npm run check` correcto tras ajustar acceso UV del test para admitir BufferAttribute/InterleavedBufferAttribute.

## Resultado verificable

- Atlas de ramilla original con siete recortes de la hoja CC0 existente y tallos conectados. Mismo mapa RGBA 128×96 y misma geometría. Las hojas individuales de 32×20 px ocupan aproximadamente 0,16–0,20 m en las tarjetas e instancias actuales, frente a la hoja única anterior de unos 0,77 m.
- Orientación determinista de brotes más abierta, escala de instancias ligeramente menor y bifurcaciones más cercanas al follaje. Se mantiene el número de árboles y de ramas, sin animación nueva ni sombreado adicional.
- Repetición del ladrillo fotográfico 8×9: aproximadamente 0,235 m de ancho por pieza y 0,067–0,105 m por hilada según altura de edificio. Marcos y alféizares menos profundos con las mismas instancias.
- UV del fundido 40–52 m continúa escala y fase del asfalto. Se retiró la grieta sinusoidal repetida del mapa; se conserva grano, desgaste y parches colocados en geometría.

| Inventario real del módulo | Antes | Después |
| --- | --- | --- |
| High: triángulos / llamadas | 33.364 / 18 | 33.364 / 18 |
| Low: triángulos / llamadas | 12.154 / 12 | 12.154 / 12 |
| Mapas runtime, bytes | 185.009 | 173.971 |

## Procedencia y reproducción

Se reutilizan exclusivamente los mismos originales CC0 de Poly Haven ya verificados el 2026-10-23. No se añaden fuentes externas ni modelos. `assets/environment-alpha3/prepare-textures.mjs` registra recorte, alpha, siete posiciones/rotaciones y tallos originales. `assets/environment-alpha3/manifest.json` conserva autores, fuentes y licencia; registra adaptación del 2026-10-26 y hashes actuales. Siete fingerprints de originales/derivados comprobados correctamente.

El PNG anterior se preserva exactamente desde Git en `assets/environment-alpha3/leaf-before-2026-10-26.png`, 20.881 bytes, SHA-256 `7c60d50feb37695c482d3b5ac1c4f08e19600ad07cb5886b9276f6a2bb1e916c`. La vista ampliada sobre fondo claro del atlas nuevo está en `assets/environment-alpha3/leaf-twig-check-2026-10-26.png`; es QA del recurso, no una captura del juego.

## Límites y aceptación pendiente

La prueba de cobertura alpha verifica huecos y evita el regreso de una tarjeta opaca; no demuestra por sí misma una copa bonita, ausencia de overdraw o FPS. Los conteos sin cambios tampoco acreditan el rendimiento. El orquestador debe revisar el nuevo atlas dentro del juego, capturar el cruce de 40–52 m con cámara/calidad fijadas y repetir las métricas integradas antes de aceptar. No se afirma fotorealismo, reproducción de un árbol identificado ni validación en teléfono físico.

## Regresión posterior: follaje perdido al reducir mipmaps (2026-10-26)

La captura real `docs/screenshots/gate-a-polish/minimum/sun.png` mostró árboles casi desnudos en calidad mínima. No se cambió su resolución, geometría ni tamaño de hojas para corregirlo.

Rojo: la prueba del loader utiliza los bytes RGBA del atlas real y reproduce el filtrado ordinario de mipmaps. A 8×6 la cobertura pasa de 20,8008 % a 16,6667 %, pérdida de 4,134 puntos. `npx vitest run tests/unit/art-slice.test.ts -t 'reducir su mipmap' --reporter=dot`, 09:35:53, falla por superar 4 puntos de diferencia. La primera ejecución de la prueba había estimado una pérdida mayor; se corrigió esa estimación al medir los píxeles, antes de implementar.

Verde: `src/rendering/foliage-mipmaps.ts` genera la cadena una sola vez durante carga. RGB se filtra ponderado por alpha para evitar que el fondo negro contamine los bordes; cada nivel ajusta alpha hacia la cobertura de la imagen original. El filtrado del siguiente nivel parte de datos sin corrección para evitar inflación acumulada. Los píxeles con alpha cero no se convierten en píxeles opacos.

El loader hace una única lectura canvas de 128×96, conserva orientación mediante inversión explícita de filas para DataTexture y desactiva la generación automática de mipmaps. No hay lectura de canvas ni preparación por frame. El PNG y sus hashes no cambian. Se libera la textura original reemplazada; la DataTexture final sigue compartida entre ambos LOD bajo el ciclo de vida existente.

Refactor y validación: helper puro separado de la lectura DOM, fixtures de carga CPU tipados y pruebas adicionales de RGB, orientación, inmutabilidad, imagen transparente y dimensiones inválidas. `npx vitest run tests/unit/art-slice.test.ts --reporter=dot`: 17/17 verdes (09:38:22). `npm run check`: correcto.

| Nivel | Cobertura alpha >= 0,5 |
| --- | --- |
| 128×96 | 20,8008 % |
| 64×48 | 19,7266 % |
| 32×24 | 20,7031 % |
| 16×12 | 20,8333 % |
| 8×6 | 20,8333 % |
| 4×3 | 16,6667 % |
| 2×1 y 1×1 | 0 % |

Cadena completa: 65.532 bytes RGBA, comparable a la memoria que ya requerían mipmaps automáticos. Preparación acotada a ocho niveles pequeños; no se ha presentado un tiempo de carga de teléfono como medido. En los niveles finales no es posible representar aproximadamente 21 % con uno o dos píxeles: se elige transparencia en lugar de un cuadrado opaco. La interpolación de GPU y la cuantización todavía requieren revisión visual integrada; conservar cobertura numérica no acredita por sí mismo copa legible. El orquestador valida de nuevo minimum/sun a 309×629 efectivos antes de aceptar esta corrección. Inventario geométrico y draw calls permanecen intactos.

## Ajuste final autorizado: densidad low de dos a cuatro brotes (2026-10-26)

La revisión del orquestador confirmó que preservar alpha en mipmaps no bastaba: mínimo seguía visualmente demasiado desnudo. Se autorizó aumentar únicamente la cantidad de brotes low, conservando tamaños de hojas, high, atlas, iluminación y límites globales de 30 FPS / 100 llamadas / 100.000 triángulos, con ratio mínimo 0,75.

- Rojo 09:41:56: `npx vitest run tests/unit/art-slice.test.ts -t 'cuatro brotes' --reporter=dot` midió dos brotes por rama en la geometría emitida, frente a los cuatro requeridos. El test cuenta triángulos reales del batch de follaje, descontando arbustos/hojarasca, y comprueba inventarios high/low.
- Verde 09:42:04: 18/18 pruebas del entorno correctas; `npm run check` correcto.
- Refactor: se centraliza `sprigsPerBranch` en el perfil de densidad. Pruebas de densidad y LOD verdes a las 09:42:21.

Coste exacto: **low 12.154 → 12.994 triángulos (+840, +6,91 %); 12 llamadas sin cambio**. Corresponde a 84 brotes adicionales de diez triángulos. High conserva exactamente 33.364 triángulos y 18 llamadas. Tamaño de mapas, mipmaps y descargas sin cambios. El aumento es deliberado y explícito para mejorar calidad mínima, dentro del presupuesto global; no se han relajado umbrales de rendimiento.

Quedan a cargo del orquestador la captura mínima y el benchmark integrado posterior. Esta medición geométrica no demuestra por sí misma una copa suficiente ni el cumplimiento de 30 FPS.
