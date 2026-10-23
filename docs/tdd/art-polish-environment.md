# Entorno alpha.3 — árbol, fachada y transición

Fecha Bogotá: 2026-10-23. Área: arte de entorno de puerta A. Sin actores reactivos nuevos, física, audio ni cambios de UI.

## Cambio comprobable

- Geometría original de árboles: desaparecen las copas esféricas y los planos de hojas flotantes. Cada brote nace exactamente en un extremo de rama; sus hojas están conectadas a un tallo. Las ramas presentan un codo intermedio. Alpha-test, sin sombra de follaje costosa.
- Ladrillo rojo y corteza fotográficos CC0, con mipmaps; hojas recortadas de un atlas CC0. Marcos menos claros, bajantes y dinteles aportan contraste y escala a las cinco fachadas.
- Parches de asfalto redondeados y de menor contraste. Fundido de superficie desde 40 hasta 52 m, sobre la carretera base gris integrada por el orquestador. No se prolonga el detalle completo de edificios/parque.
- Se conservan 14 árboles, cinco fachadas, sus transformaciones principales, corredor físico libre y API de clima. El sector es una interpretación artística; no se afirma trazado real de El Virrey.

## TDD y comprobaciones

1. Rojo, 15:54:36: `npx vitest run tests/unit/art-slice.test.ts --reporter=verbose`: 2 fallos y 7 verdes. Fallos exactos: `loadArtTextures is not a function`; copa todavía `SphereGeometry`. Las pruebas precedieron a la implementación.
2. Verde, 16:00:30: mismo comando, 9/9 verdes. Loader de tres mapas con errores explícitos; brotes unidos a extremos de ramas. Presupuesto y corredor comprobados.
3. Refactor: se extrae el cálculo de memoria para soportar tanto DataTexture como HTMLImage, se eliminan controles de densidad ya obsoletos y se compara el mapa procedural mediante `Buffer.equals` exacto, evitando el coste del deepEqual. `npm run check`: correcto. La primera ejecución de TypeScript había detectado `Texture.image` como `{}`; resuelto con tipo local de imagen, sin cambiar el render.
4. Refactor y comprobaciones complementarias, 16:01:28: 10/10 verdes. Además se valida el fundido alpha 1 en 40 m y 0 en 52 m, su clima y que liberar un LOD no libere mapas prestados compartidos.

Las antiguas aserciones de 27.500 triángulos/17 llamadas representaban la geometría alpha.2 exacta; se sustituyeron por el nuevo presupuesto aprobado de 35.000/20. Se mantiene medición real de atributos/index/instancias, no una constante declarada.

| Módulo aislado | Alpha.2 | Alpha.3 | Límite aprobado |
| --- | --- | --- | --- |
| High: triángulos | 27.500 | 33.364 | 35.000 |
| High: draw calls | 17 | 18 | 20 |
| Low: triángulos | 11.856 | 12.154 | 13.000 |
| Low: draw calls | 11 | 12 | 14 |

No son cifras de FPS ni el total del juego/sombras. Las capturas y el benchmark integrado corresponden al orquestador. La prueba de teléfono físico sigue pendiente; no hay resultados reales de teléfono en este documento.

## Recursos y licencias leídas antes de descargar

Se consultaron las páginas oficiales https://polyhaven.com/license y https://docs.ambientcg.com/license/ el 2026-10-23. Poly Haven publica sus assets bajo CC0 1.0; la página distingue los assets de otros contenidos del sitio. No se redistribuyen imágenes de presentación del sitio. No se ha usado ningún recurso de ambientCG ni geometría de Quaternius en esta iteración.

Recursos seleccionados, atribución voluntaria:

- [Brick Wall 001](https://polyhaven.com/a/brick_wall_001), Dimitrios Savva y Rob Tuytel. CC0 1.0. Mapa de color de 1K reducido a JPEG 512², calidad 86; repetición 3×3 en fachadas.
- [Bark Brown 02](https://polyhaven.com/a/bark_brown_02), Rob Tuytel. CC0 1.0. Mapa de color de 1K reducido a JPEG 512², calidad 86; repetición 1×3.
- [Tree Small 02](https://polyhaven.com/a/tree_small_02), Rico Cilliers. CC0 1.0. Solo mapas `leaves_diff` y `leaves_alpha`: recorte x557/y431/158×111, reducido a 128×96, composición RGBA PNG. No se incorpora el modelo de árbol completo.

`assets/environment-alpha3/manifest.json` contiene URL exacta de cada descarga, autor, licencia, transformación, bytes y SHA-256 de originales y derivados. Los originales seleccionados permanecen en `assets/environment-alpha3/source/`; las únicas descargas del juego son tres archivos en `public/assets/environment-alpha3/`, **179.516 bytes en total**. Los originales no se empaquetan en dist. Se inspeccionaron las texturas locales con view_image antes de usarlas.

Herramienta de adaptación: Sharp del runtime local, redimensionado/crop y composición de canal alpha. No es generación de imágenes ni copia de código de terceros. Toda la geometría de ramas/brotes/fachadas es original del proyecto.

## Contrato de integración y limitaciones

`loadArtTextures(baseUrl): Promise<ArtTextures>` exporta `{brick, bark, leaf}`. Debe esperarse durante boot. Un fallo de carga se propaga; no hay sustitución silenciosa en este loader. La opción `createArtSlice({detail, textures})` recibe los mismos mapas para ambos LOD. El consumidor es propietario de esos mapas: `slice.dispose()` no los libera. La ruta sin mapas sigue disponible para pruebas unitarias y generación procedural explícita.

`metadata.transitionEndDistance = 52`; `branchEndpoints` permite comprobar la unión de brotes; el resto de metadata conserva inventario y transforms. La muestra sigue requiriendo inspección visual integrada: no equivale al concepto fotorealista. Low reduce hojas/ramas y puede verse más ligero que High; se debe juzgar en conducción y con captura de cada calidad.

## Validación de artefactos

- SHA-256 y tamaño verificados para los cuatro originales seleccionados y los tres derivados: **7/7 correctos** contra `assets/environment-alpha3/manifest.json`.
- `node --check assets/environment-alpha3/prepare-textures.mjs`: correcto. El script deja explícitos recorte, canal alpha, resolución y calidad JPEG; admite la ruta del módulo Sharp como argumento. No añade una dependencia al runtime web.
- Se eliminaron dos descargas de investigación no utilizadas antes de entregar; el directorio source conserva únicamente los originales que constan en el manifiesto.

## Corrección tras captura integrada: transparencia de hoja

La revisión de `docs/screenshots/gate-a-polish/after/landscape-sun.png` y `portrait-rain.png` detectó tarjetas negras geométricas. Inspección binaria y Sharp reprodujeron la causa: el derivado leaf.png inicial era **RGB sin alpha**. En Sharp, `removeAlpha()` aplicado en el mismo pipeline que `joinChannel()` eliminó el canal añadido al finalizar. La descripción inicial RGBA en esta nota expresaba la intención; la inspección real demostró el defecto y se corrigió.

- Rojo 16:06:44: `npx vitest run tests/unit/art-slice.test.ts -t 'canal alpha PNG'` falla exactamente con tipo de color PNG 2 (RGB) frente al esperado 6 (RGBA).
- Verde 16:07:13: pipeline separado RGB → nueva instancia Sharp → alpha, 11/11 pruebas verdes.
- Refactor: máscara de componente conectado y óvalo para retirar los fragmentos de tallos vecinos del atlas que se tocaban. No se alteran geometría, presupuesto, API, escala ni colocación.
- Verde tras refactor 16:08:08: `npx vitest run tests/unit/art-slice.test.ts --reporter=dot`, 11/11; `npm run check`, correcto.
- Se inspeccionó la transparencia real mediante aplanado sobre gris claro: `assets/environment-alpha3/leaf-check.png`, solo evidencia de QA, fuera de public. La hoja aparece recortada, con venas y sin tarjeta negra.
- Inventarios permanecen 33.364/18 high y 12.154/12 low. Mapas finales de runtime: **185.009 bytes** en total; leaf.png **20.881 bytes**, SHA-256 `7c60d50feb37695c482d3b5ac1c4f08e19600ad07cb5886b9276f6a2bb1e916c`. El manifiesto contiene los valores actuales y reemplaza el tamaño preliminar 179.516 bytes citado arriba.

Se solicita recaptura integrada con textura recargada. La corrección elimina la causa concreta de los bloques negros; el acabado visual requiere revisión de esa captura nueva, sin asumir que un test unitario demuestra calidad artística.

## Revisión visual integrada tras corregir alpha (solo lectura del juego)

Se inspeccionaron las capturas actualizadas `docs/screenshots/gate-a-polish/after/landscape-sun.png` (1280×720) y `portrait-rain.png` (412×869). No se ejecutó navegador ni se modificaron runtime/assets durante la grabación y medición del orquestador.

Resultados visibles:

- Los rectángulos negros desaparecieron. Se distinguen contornos de hojas, huecos entre brotes y unión con ramas; no se aprecia el fallo de transparencia previo.
- Bordes, línea amarilla, iconos de bicicleta y corredor de conducción se leen en ambos formatos. La lluvia oscurece el pavimento sin ocultar su trazado.
- La fachada cercana muestra ladrillo fotográfico, balcones y rejas con profundidad. Es un avance de materiales frente a bloques planos, aunque persiste la repetición del patrón arquitectónico.

Límites honestos del acabado:

- Las hojas grandes y agrupadas en brotes verticales producen una silueta ornamental/estilizada; todavía no representan una copa urbana orgánica convincente. Se ven demasiadas ramas largas desnudas y coronas pequeñas en sus extremos. Los árboles mantienen ritmos muy regulares de altura, poda y distribución.
- El verde permanece muy oscuro en varias caras interiores, especialmente con lluvia; el recorte correcto resuelve las tarjetas negras, pero no equivale a iluminación/translucencia vegetal realista.
- La plantación baja repite el mismo brote escalado y el parque conserva un plano de césped con poco relieve, variación o profundidad de fondo.
- La textura de ladrillo aporta desgaste, pero los marcos, ventanas oscuras y módulos repetidos siguen siendo sencillos. No se afirma fachada final ni reproducción de un edificio identificado.
- Las grietas procedurales de asfalto repiten un ritmo visible; la transición de color del pavimento es más coherente, pero el salto de estilo hacia los árboles geométricos del recorrido lejano sigue siendo perceptible.
- Estas capturas desde el inicio demuestran legibilidad y corrección del alpha; no prueban por sí solas la transición vista al cruzar 40–52 m, calidad de conducción, FPS sostenidos o teléfono físico.

Conclusión de revisión: mejora visible y defecto de transparencia resuelto; muestra todavía estilizada, sin equivalencia con el concepto fotorealista. No se detectó un nuevo defecto bloqueante que justificara interrumpir la captura/grabación actual. Los puntos anteriores quedan registrados para la siguiente iteración aprobada.
