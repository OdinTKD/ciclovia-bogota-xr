# Ampliación visual de A — candidato 0.3.0-alpha.2

Fecha: 2026-10-23 (Bogotá). Rama de trabajo: `codex/gate-a-art`. Estado: trabajo autorizado, pendiente de producción, integración, mediciones y revisión. La numeración 0.3.0-alpha.2 es propuesta; este documento no certifica una versión entregada ni aceptación de A.

## Alcance

- Muestra visual de 40 m dentro del fragmento técnico de 200 m de A; el recorrido final previsto continúa siendo de 1.200 m.
- Bicicleta y manos originales trabajadas en Blender 5.1, con proporciones, materiales, pivotes y jerarquía adecuados a giro y frenada en primera persona.
- Entorno original con parque a la izquierda y fachadas a la derecha; materiales PBR, iluminación y sombras estáticas. La interpretación del corredor sigue inspirada en El Virrey, sin trazado geográfico verificado.
- Capturas reales y vídeo corto de giro/frenado sobre la escena integrada. La prueba visual se evalúa separadamente del rendimiento de laboratorio y del teléfono físico.
- Conservar stack, controles, seguridad, pausa/reinicio, humor y contratos técnicos verificados de A. No se autoriza B (actores reactivos), audio ni rediseño de UI mediante esta ampliación.

## Flujo Blender acordado

Blender MCP continúa desconectado en el servicio local; no se anuncia una conexión operativa. Se utilizará Blender 5.1 instalado mediante CLI en modo background aislado. La nueva solicitud de piezas trabajadas en Blender autoriza este flujo: no requiere manipular la sesión interactiva del usuario.

Conservar el archivo fuente editable `.blend`, el script de generación/exportación y las instrucciones de reproducción. El runtime del juego recibe GLB optimizados; Blender y sus herramientas de producción no pasan a ser dependencias públicas del juego. No se han descargado modelos, texturas, fuentes o audio de terceros para este alcance.

## Registro de assets por completar

Registrar datos reales únicamente después de recibir y comprobar los artefactos del responsable de producción.

| Campo | Evidencia requerida | Estado |
| --- | --- | --- |
| Autoría y origen | Manifest original del proyecto y script sin recursos externos | Comprobado para el artefacto actual |
| Fuente editable | `.blend` y script de generación/exportación conservados | Archivos presentes; enlaces abajo |
| Herramienta y reproducción | Blender 5.1.2 declarado en manifest; comando background en script | Comprobado documentalmente; no se reejecuta Blender para esta validación |
| GLB actual | Tamaño y SHA-256 contrastados contra bytes locales | Comprobado; aún puede cambiar antes del cierre |
| Inventario | Manifest de bicicleta y evidencia determinista del entorno | Registrado; GPU/FPS integrado pendiente |
| Jerarquía y animación | Pivotes de dirección/ruedas/pedales, agarres y movimiento de manos; contratos que utiliza el runtime | Pendiente |
| Licencia/procedencia | Recurso original o licencia leída/atribución de cada elemento externo; avisos actualizados solo con hechos | Pendiente |

Entrega actual de bicicleta/manos verificada: [fuente editable](../../assets/source/bicycle/bicycle-rider.blend), [script reproducible](../../tools/assets/build-bicycle.py), [GLB](../../public/assets/models/bicycle-rider.glb) y [manifest](../../public/assets/models/bicycle-rider.manifest.json). El manifest registra Blender 5.1.2 y autoría original del proyecto, sin modelos/texturas/fuentes/audio externos. GLB de 187.596 bytes, SHA-256 `6676817a5e6a9302625a84b3f3ff3b2d489d6404c3ee8966f927356b92f92d76`, 7.120 triángulos, 9 llamadas de geometría y 2 materiales. El hash se comprobó contra los bytes locales; los conteos corresponden al manifest, sin sustituir las métricas del render integrado. Estos datos identifican el artefacto actual, no una aprobación final ni garantía de FPS.

`THIRD_PARTY_NOTICES.md` se actualizará cuando se comprueben assets y licencias. No incorporar recursos por disponibilidad sin verificar términos ni registrar ejemplos como si fueran archivos producidos.

## Criterios de validación

Entrega parcial comprobada del entorno: `src/rendering/art-slice.ts`, sus pruebas y `docs/tdd/art-slice.md` describen geometría y siete texturas originales deterministas (asfalto, ladrillo, concreto, adoquín, corteza, hoja y césped). Tras revisar capturas se redujo masa oscura de árboles, se añadió césped y se aplicó batching: inventario final del módulo de 27.500 triángulos y 17 llamadas de geometría, 5 materiales PBR y 2.118.998 bytes estimados de texturas con mipmaps. La versión previa de 32.360 triángulos/28 llamadas/1.769.472 bytes permanece en la evidencia TDD. Excluye el resto de escena y pasadas de sombras, por lo que no acredita por sí solo el presupuesto GPU final. Evidencia del área: rojo inicial de humedad → verde/refactor, nueva regresión de 28 llamadas frente a máximo 17 → verde/refactor, 6/6 pruebas de entorno, 10/10 junto a integración y TypeScript correcto. Las capturas, integración, iluminación definitiva y mediciones reales permanecen a cargo de integración; esta entrega parcial no cierra alpha.2.

1. Validar estructura GLB, escala/unidades/ejes, jerarquías, pivotes, materiales y rutas de carga. Los cambios ejecutables siguen rojo → verde → refactor, con evidencia en `docs/tdd/`; para arte y metadatos usar validación determinista apropiada.
2. Comparar capturas de cámara y escenario fijados, en sol y lluvia, y vídeo corto real de giro/frenado. Revisar manos sobre puños, proporciones, clipping, rueda/manillar, legibilidad de vía y coherencia de parque/fachadas. Un render o concepto de Blender no sustituye la captura del juego integrado.
3. Medir rendimiento sin grabación de vídeo/capturas durante el benchmark, con semilla/recorrido/clima y condiciones declarados. Conservar objetivo de 30 FPS, máximo 100 draw calls y 100.000 triángulos, sin relajar mínimos de resolución. Registrar resolución efectiva, viewport/DPR/ratio/buffer, tiempos de frame y recursos transferidos.
4. Ejecutar regresiones pertinentes de carga/error, controles, orientación, contactos, pausa/reinicio y diagnóstico; build y CI. Comprobar GLB y rutas bajo el base path real de Pages cuando se publique.
5. Separar evidencias: revisión visual humana; medición de laboratorio; prueba física. El usuario aplazó esta última hasta aportar modelo, OS y navegador reales. No declarar validación móvil física a partir de emulación o plantillas.
6. Mantener A abierta hasta el OK del usuario y sus pendientes de aceptación; producir arte no abre B ni acredita el rediseño completo del juego.

La pasada preliminar por software de 28–29 FPS no cumplió el objetivo y se conservó como diagnóstico. Después de optimizar, la validación local final comunicada por integración obtuvo 118/118 unitarias en 25 archivos, build correcto y 18 E2E aprobadas/2 omitidas en 3,1 minutos; las omisiones son presupuestos duplicados de escritorio. El build mantiene advertencia de bundle aproximado de 5,02 MB/1,85 MB gzip. CI, despliegue y revisión del usuario siguen pendientes para este candidato.

La integración añade materiales Lambert cacheados al nivel mínimo 0,375, conservando geometría, mapas y colores; ambos modos se precompilan antes de ready. En el nivel bajo se desactivan sombras/reflejos; el alto conserva sombras Basic de 1024 cacheadas y PBR selectivo en metal/vidrio. Los diagnósticos de render y descarga JSON incluyen `shadows` y `materialQuality` para distinguirlos. Las ventanas lejanas pasan de 12 a 2 triángulos. El mínimo de resolución y los umbrales no se redujeron.

### Mediciones locales finales, separadas por condición

| Escenario | FPS promedio sol / lluvia | Llamadas / triángulos máximos sol; lluvia | Resolución / calidad |
| --- | --- | --- | --- |
| Recorrido emulado de 18 s, CPU 4× ([sol](../performance/gate-a-art/after-route-performance-sun.json), [lluvia](../performance/gate-a-art/after-route-performance-rain.json)) | 42,13 / 33,61 | 36 / 39.478; 37 / 41.398 | Sol ratio 0,75 → 0,375; buffer 309×629 → 154×314. Lluvia ratio 0,375, buffer 154×314, diffuse |
| Muestra quieta de 6 s dentro de los 40 m, posición 14–15 m, CPU 4× SwiftShader ([JSON](../performance/gate-a-art/sample-software-mobile.json)) | 41,72 / 41,11 | 36 / 39.478; 37 / 41.398 | Ratio 0,375, 154×314, diffuse, sombras desactivadas |

Viewport emulado Pixel 7: CSS 412×839, DPR 2,625. El recorrido de 18 s atraviesa distintos sectores; la segunda medición aísla la zona artística pero con bicicleta quieta, sin medir conducción. No se mezclan las dos tablas ni se presentan sus promedios como garantía de cada frame o rendimiento en teléfono. En el recorrido, p95/p99 son 49,9/66,7 ms sol y 50/66,7 ms lluvia; los picos son visibles en los JSON. El benchmark de software se realiza sin vídeo ni capturas durante la muestra.

### Evidencia visual local

El [vídeo final](../../public/review/art/driving.webm) de giro, contragiro y frenada en ambos climas dura 15,68 s, 1280×720, 25 FPS VP9 y 5.771.488 bytes. Las [capturas de sol](../../public/review/art/sun.png) y [lluvia](../../public/review/art/rain.png) son del juego integrado. El [registro de captura](../videos/gate-a-art/events.json) identifica GPU real Intel Arc 140T mediante D3D11, render 1280×720 con ratio 1, PBR y sombras, sin errores de página. Los 25 FPS del archivo son codificación, no rendimiento del juego; el material visual no sustituye el benchmark por software ni la prueba física aplazada. La publicación de estos archivos todavía debe verificarse.

## Revisión visual y límites observados

La revisión de los agentes aprecia mayor detalle y legibilidad, pero el resultado sigue siendo un prototipo estilizado y no el acabado fotorealista de un concepto. Persisten copas facetadas y hojas aisladas, transición de verde brusca después de los 40 m, guantes más oscuros con lluvia y reflejos discretos. El formato portrait emulado recorta los extremos exteriores de las manos. No se observó bloqueo de la conducción en esa revisión, lo que no equivale a aprobación artística ni prueba física. Conservar estos puntos para la valoración del usuario y las siguientes iteraciones.

## Documentación y versión

Documentación / Versionado mantiene el registro de fuentes, hashes, conteos y resultados comprobados. No se modifica la entrada histórica 0.3.0-alpha.1 ni se agrega 0.3.0-alpha.2 al changelog antes de recibir la evidencia final. El cierre posterior usa una entrada append-only con fecha Bogotá, cambios, comandos/resultados reales, áreas involucradas, compatibilidad y pendientes explícitos.
