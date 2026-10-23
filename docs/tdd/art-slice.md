# Muestra artística A: entorno de 40 metros

Fecha: 2026-10-23, Bogotá. Área: entorno 3D / render. Archivos propios: `src/rendering/art-slice.ts`, `tests/unit/art-slice.test.ts`, este registro. Integración, luz, cámara y métricas del navegador: orquestador.

## Contrato y alcance

`createArtSlice()` devuelve `group`, `metadata`, `updateWeather('sun' | 'rain')` y `dispose()`. El grupo se llama `art-slice`. Muestra principal: distancia 0–40 m; margen construido de transición contenido en Z +4 a -44 m. El mundo avanza hacia -Z. El corredor físico ±2,75 m queda libre de mobiliario, fachadas y vegetación baja; las copas pueden proyectarse por encima de él.

Parque a izquierda y fachadas de ladrillo a derecha. Se incluyen asfalto con grano y reparaciones, marcas y esténciles originales, bordillos segmentados, andenes de ladrillo, ventanas con profundidad, marcos, balcones, rejas, persianas, toldos, árboles ramificados con racimos irregulares y hojas, arbustos, hojarasca, bolardos, bancos y postes. Son diseños originales inspirados en materiales urbanos; no acreditan trazado ni edificios reales de El Virrey. No se añaden actores reactivos, audio ni rediseño de UI.

## Rojo

1. `npx vitest run tests/unit/art-slice.test.ts` — 13:34 Bogotá: importación fallida porque el módulo aún no existía. Este fallo solo acredita la ausencia inicial del contrato.
2. Con geometría implementada y `updateWeather` todavía sin comportamiento: mismo comando, 13:36. Resultado **1 fallida / 3 correctas**. Fallo preciso: lluvia no alteraba la rugosidad; `expected 0.94 to be less than 0.94`.
3. Validación geométrica del margen: límite Z máximo 4,10 frente a 4,01 permitido; luego mínimo -44,221 frente a -44,01. Se ajustaron posición inicial de fachada y separación de arbustos, sin cambiar escala o presupuesto.

## Verde

Se implementó humedad: asfalto pasa de rugosidad 0,94 a 0,34 y factor de color 0,71; andén de 0,88 a 0,54 y factor 0,81; reparaciones de 0,90 a 0,24. El sol restaura exactamente el estado inicial. Los cambios reutilizan materiales y geometrías. Las pruebas alternan clima veinte veces y comprueban ausencia de crecimiento geométrico.

`npx vitest run tests/unit/art-slice.test.ts --reporter=verbose`, 13:38:54: **4/4 correctas**. La validación mide realmente índices, instancias, buffers y matrices: **32.360 triángulos / 28 llamadas de geometría**. Texturas: **1.769.472 bytes estimados incluyendo cadena completa de mipmaps**; el tamaño de CPU es inferior. La cifra de triángulos no incluye la segunda pasada de sombras ni el resto de la escena; los contadores GPU de la integración prevalecen.

## Refactor

Se eliminó un arreglo sin uso, se ajustó la construcción del material para omitir advertencias de mapas `undefined`, se especificaron tipos DataTexture, se redondeó la cuenta de memoria y se evitó actualizar materiales cuando el clima no cambió. Se conserva la misma salida y no se crean recursos por frame. `npx vitest run tests/unit/art-slice.test.ts --reporter=verbose`, 13:39:43: **4/4 correctas**, 975 ms, con el mismo inventario. `git diff --check` sobre los tres archivos propios terminó con código 0.

## Validación del arte estático

No aplica prueba ejecutable de comportamiento al diseño estático. Validación alternativa determinista: geometría finita; inventario real dentro de 60.000 triángulos y 45 llamadas reservadas; margen Z acotado; muebles fuera del corredor; texturas idénticas entre ejecuciones; mipmaps y presupuesto de memoria. Esta validación no certifica calidad artística: se requieren capturas y vídeo reales integrados por el orquestador.

Las seis familias de texturas (asfalto, ladrillo, concreto, adoquín, corteza, hoja) se generan por fórmulas originales deterministas, sin fotos, mapas externos ni imágenes de Def Jam. La referencia orienta el acabado y no aporta material reutilizado. Se comparten texturas y materiales, y el módulo dispone todos sus recursos. No se descargaron assets externos.

## Integración de iluminación propuesta

Hemisferio de aproximadamente 1,1 y sol cálido 2,6; ACES con exposición alrededor de 1,05. Una sombra direccional cacheada de 1024, sin SSAO ni SSR. Solo edificios, troncos, ramas y copas principales proyectan sombras; hojas pequeñas y arbustos no añaden segunda pasada. La decisión final, mediciones de draw calls/FPS y revisión visual corresponden a integración. La prueba física de teléfono sigue aplazada por instrucción del usuario; no registrar su plantilla como dispositivo o resultado.

## Optimización después de la primera captura integrada

La captura real `docs/screenshots/gate-a-art/preview.png` mostró masas de copas demasiado densas/oscuras y parque plano. Integración reportó aproximadamente 14 FPS incluso con buffer 480×270; no se considera aprobado y ese dato no corresponde a teléfono. Se redujo coste de sombreado, sin rebajar resolución mínima ni umbrales.

- Rojo 13:46:07: nueva prueba de asignación eficiente de shaders falló, `expected 15 to be less than or equal to 5`. Se habían aplicado PBR y recepción de sombra a todas las superficies, incluso materiales completamente mates.
- Verde 13:46:37: **5/5 correctas**. Materiales PBR 15→5 (asfalto, adoquín húmedo, acero, cristal, reparaciones). Ladrillo, concreto, madera, corteza, hojas y pintura usan Lambert texturado; el detalle y las texturas se conservan. Recepción PCF de 28→6 grupos significativos, evitando muestreo de sombras en cada hoja, copa o varilla.
- Arte: copas más pequeñas con huecos entre racimos, hojas más claras, menor multiplicación de tintas y textura original de césped. Vegetación baja reducida y más variada en altura.
- Inventario posterior medido: **27.500 triángulos / 28 llamadas / 2.118.998 bytes estimados con mipmaps**. La textura de césped aumenta memoria ~341 KiB, mientras la geometría se reduce 4.860 triángulos. Se mantienen márgenes Z y corredor libre. El coste de las sombras y resto de escena se registra por separado en integración.
- Los límites de shader se validan determinísticamente, pero no sustituyen una nueva medición de FPS del build completo. La captura posterior y benchmark son responsabilidad de integración; no declarar mejora de FPS a partir de esta prueba unitaria.

## Batching estático posterior

Integración comunicó que el primer ajuste de sombreado seguía por debajo de 30 FPS en SwiftShader. Se añadió agrupación real por material, proyección y recepción de sombras compatibles, conservando toda la geometría y apariencia.

- Rojo 13:50:03: prueba de agrupación falló con `expected 28 to be less than or equal to 17`.
- Verde 13:50:33: **6/6 correctas**; inventario **27.500 triángulos / 17 llamadas**. Texturas y memoria de imágenes sin cambios. `npx tsc --noEmit` terminó con código 0.
- Los grupos compatibles se convierten en geometría indexada unida, con transforms y colores por instancia conservados en los vértices. Se preservan nombres de inspección mediante marcadores, mapas compartidos y propiedades de sombra. Asfalto y copas conservan su malla individual. El corredor se verifica sobre los límites originales de cada instancia, porque una malla unida puede ocupar ambos costados sin tener geometría en el centro.
- Refactor: tabla compartida de receptores de sombra. `npx vitest run tests/unit/art-slice.test.ts tests/unit/art-integration.test.ts --reporter=verbose`, 13:50:58: **10/10 correctas**, incluyendo lifecycle de integración. No cambian resolución, umbrales, controles ni física.
- Estos resultados acreditan reducción de trabajo de envío y preservación estructural, no 30 FPS. Se requiere la nueva medición aislada del orquestador y una captura para comprobar que la agrupación conserva el resultado visual.

## LOD geométrico para el perfil mínimo

El orquestador reportó una CI posterior con 17 pruebas funcionales correctas y el presupuesto corto fallando a 21,97 FPS. Se añadió un LOD real del entorno, sin tocar resolución, umbral, física, renderer ni workflow desde este módulo.

Contrato: `createArtSlice({ detail: 'low' | 'high' })`, con `high` por defecto. Metadata registra detalle, conteos geométricos reales y posiciones/escalas de los 14 árboles y 5 fachadas.

- **Rojo**, 15:15:44 Bogotá: `npx vitest run tests/unit/art-slice.test.ts --reporter=verbose`; 1 fallida y 6 correctas. La petición low todavía devolvía high: `expected 27500 to be less than or equal to 13000`.
- **Verde**, 15:16:30: 7/7 correctas. Low medido **11.856 triángulos / 11 draw calls**; high permanece exactamente **27.500 / 17**. Texturas en ambos: **2.118.998 bytes estimados con mipmaps**.
- Low: esfera de copa 5×3 frente a 8×5; 3 ramas frente a 5; 4 hojas de detalle por rama frente a 14; 32 arbustos frente a 65; 50 hojas en suelo frente a 200; cilindros de 5 segmentos frente a 8. Se simplifican barrotes, subdivisiones de persianas/marcos, anillos de esténcil y juntas de bordillo. Se conservan todos los troncos y fachadas, las matrices de posición/escala, el corredor y las superficies principales.
- Todas las sombras de low quedan desactivadas. Se agrupan materiales Lambert de superficie equivalente, preservando mapas y horneando la tinta del material en colores por vértice; no se sustituyen texturas. PBR de asfalto y respuesta al clima permanecen. Los nombres de piezas agrupadas son marcadores de inspección, igual que en el batching previo.
- **Refactor**, 15:17:20: densidades centralizadas en una configuración, 7/7 pruebas propias verdes; se comprueban cambio/restauración del clima y liberación de textura/material en low. La ejecución conjunta tuvo 12 correctas y un rojo ajeno en `art-integration.test.ts` porque el orquestador acababa de añadir `setArtQuality/getArtDetail` antes de implementarlos; no se atribuye esa suite conjunta como aprobada. TypeScript en esa ejecución señaló únicamente esos contratos de integración pendientes.
- Prueba estructural: los 14 transforms de árbol y los 5 de fachada coinciden entre high/low, las matrices y mapas de asfalto/andén/parque/fachada son idénticos, y todas las mallas low carecen de sombras. El conteo viene de los buffers reales, no de estimar densidades.

Este cambio conserva el perfil high que produjo las capturas artísticas. La selección del perfil mínimo, su comunicación en diagnósticos y los FPS de CI corresponden al orquestador. El LOD por sí solo no acredita 30 FPS ni sustituye la prueba física aplazada.

## Comparación nativa de bytes en la prueba LOD

El orquestador informó que la CI `40018514417` falló por timeout de la prueba low: 5.030 ms al comparar cuatro buffers de textura con igualdad profunda; las otras 123 pruebas pasaron. Se refactorizó únicamente esa comparación en la prueba, usando `Buffer.from(data.buffer, data.byteOffset, data.byteLength).equals(...)`. Se comprueban exactamente todos los mismos bytes, incluyendo la longitud y respetando offset, sin muestreo, sin elevar el timeout y sin tocar runtime.

Validación local posterior: `npx vitest run tests/unit/art-slice.test.ts --reporter=verbose`, 15:22:04 Bogotá: **7/7 correctas**, suite 1,24 s; prueba LOD **125 ms**. El fallo de CI se atribuye al informe del orquestador; el pase local no confirma por sí solo una nueva CI. No aplica prueba ejecutable de producto: cambió el mecanismo de una aserción, no su criterio ni el comportamiento del juego.
