# Revisión del candidato 0.3.0-alpha.1 — Puerta A abierta

Fecha: 2026-10-23 (Bogotá). Estado: candidato técnico de A, sin aceptación final ni cierre de puerta. No representa la entrega completa de 0.3.0. B (actores reactivos) y las ampliaciones de C no incluidas en la autorización visual posterior de A siguen pendientes de autorización. La muestra visual autorizada aún no está entregada.

Consultar las [decisiones de A](gate-a.md). El fragmento de validación es de 200 m; el recorrido final previsto conserva 1.200 m. El escenario sigue inspirado en El Virrey, sin trazado geográfico verificado.

## Resultado técnico local comprobado

El candidato incorpora conducción con orientación, contactos diferenciados y bicicleta/manos procedurales. La frenada sigue la decisión ARCADE: desde 8 m/s, objetivo de 4–5 m en sol y 6–7 m en lluvia. El spike técnico se resolvió dentro de la ventana de 45 minutos; esto no certifica la sensación de conducción en un teléfono.

Validación local tras batching: `npm test`, 100/100 pruebas en 20 archivos; `npm run build`, correcto; las dos pruebas de presupuesto pasaron en 58,3 s con archivos estables. La regresión de repetición de P/Escape tuvo rojo real, verde y refactor con 6/6 E2E de A. Validación final en CI 40003117329: 100/100 unitarias, build y 14 E2E aprobadas/2 omitidas en 1,7 minutos, con verify y deploy correctos. Las omisiones son duplicados de presupuesto de escritorio.

La CI 40000545028 no publicó el candidato: 12 pruebas funcionales pasaron, pero los presupuestos fallaron con 29,72 fps en sol inicial y 27,62 fps en lluvia a 18 s. Se optimizó el modelo con batching y colores de vértice, conservando 3.276 triángulos, geometría, colores y pivotes; la [evidencia TDD de render](../tdd/gate-a-render.md) registra la regresión y corrección. No se relajó el umbral de 30 fps ni la resolución mínima. La CI sucesora 40002460207 completó verify y deploy para `e8e892e`; la última 40003117329 publicó también el vídeo actualizado, commit `ed9639de4c8120d7926d988775665e029f202a75`, sin cambios de runtime entre ambos.

El [vídeo de conducción corregido](../../public/review/gate-a-driving.webm), recapturado mediante teclado sobre el modelo optimizado de `e8e892e`, dura 43,60 s y tiene resolución 1280×720, 25 FPS y códec VP9. Registra giro/contragiro, frenada, contacto frontal y recuperación, lluvia y roce lateral; el [registro de eventos](../videos/gate-a/events.json) contiene cero errores. El [smoke final público](../performance/gate-a/live-verification.json) confirma juego, página de revisión y vídeo HTTP 200, reproducción con currentTime mayor que cero, 10.597.611 bytes iguales al archivo local y cero errores. La [revisión pública](https://odintkd.github.io/ciclovia-bogota-xr/review/) permite verlo. Los 25 FPS de codificación no miden rendimiento del juego. Esta evidencia no acredita arte definitivo, teléfono físico ni aprobación del usuario.

## Medición antes/después

Condiciones declaradas en los JSON: Chromium con viewport Pixel 7, CPU limitada 4×, 18 s jugando y muestras por requestAnimationFrame; sin vídeo ni capturas durante el periodo medido. El user-agent emulado no identifica un teléfono real.

| Revisión / clima | FPS promedio | p95 / p99 ms | Máximo draw calls / triángulos | Ratio aplicado / drawing buffer |
| --- | --- | --- | --- | --- |
| [Antes, sol](../performance/gate-a/before-route-performance-sun.json) | 51,73 | 33,4 / 33,4 | 23 / 15.702 | 0,75 → 0,375; 309×629 → 154×314 |
| [Antes, lluvia](../performance/gate-a/before-route-performance-rain.json) | 59,67 | 16,8 / 16,8 | 24 / 17.622 | 0,375; 154×314 |
| [Después, sol](../performance/gate-a/after-route-performance-sun.json) | 38,97 | 33,4 / 33,5 | 20 / 17.966 | 0,75; 309×629 |
| [Después, lluvia](../performance/gate-a/after-route-performance-rain.json) | 40,46 | 33,4 / 50,1 | 21 / 19.886 | 0,75 → 0,375; 309×629 → 154×314 |

Viewport CSS: 412×839; DPR emulado de dispositivo: 2,625. El ratio aplicado por Three.js es distinto del DPR del dispositivo. En el antes-sol la resolución cambia aproximadamente a los 12,33 s; en el después-lluvia, a los 9,78 s. Muestras: 932/1.075 antes y 702/729 después, sol/lluvia respectivamente. Los ficheros contienen la serie de frames y resoluciones; las mediciones iniciales de 5 s y las anteriores al batching se conservan pero no se mezclan con esta tabla de recorrido de 18 s.

Son condiciones de recorrido comparables, con resolución adaptativa diferente. Los FPS después son inferiores en esta pasada y se dibuja a mayor resolución durante parte del recorrido; no declarar una mejora ni atribuir toda la diferencia al código. Haría falta repetir a calidad fija para aislar el coste y considerar variación del entorno. Los FPS son promedios; no garantizan 30 fps en cada frame ni en un teléfono real. Se conservan los límites de 100 draw calls y 100.000 triángulos por frame y el objetivo móvil de 30 fps.

## Medición CI final separada

La ejecución [40003117329](https://github.com/OdinTKD/ciclovia-bogota-xr/actions/runs/40003117329) verificó y publicó `ed9639de4c8120d7926d988775665e029f202a75`. Mediciones de 18 s en Linux/Chromium, viewport Pixel 7, CPU 4×:

| Clima | FPS promedio | p95 / p99 ms | Máximo draw calls / triángulos | Resolución efectiva | Muestras |
| --- | --- | --- | --- | --- | --- |
| [Sol final CI](../performance/gate-a/ci-40003117329-route-performance-sun.json) | 36,36 | 33,4 / 33,4 | 20 / 17.966 | Ratio 0,75; 309×629 | 655 |
| [Lluvia final CI](../performance/gate-a/ci-40003117329-route-performance-rain.json) | 34,97 | 33,4 / 33,4 | 21 / 19.886 | Ratio 0,75; 309×629 | 630 |

Máximo de frame 50 ms en ambos; CSS 412×839 y DPR emulado 2,625. Contra Pages pasaron 10/10 pruebas funcionales en 38,3 s, con el mismo JS `index-DJfD5Eas.js` del build. No fue una repetición del benchmark en teléfono.

### CI anterior conservada como histórico

La ejecución [40002460207](https://github.com/OdinTKD/ciclovia-bogota-xr/actions/runs/40002460207), commit `e8e892e`, obtuvo verify correcto tras batching. Mediciones de 18 s en Linux/Chromium, viewport Pixel 7 y CPU limitada 4×:

| Clima | FPS promedio | p95 / p99 ms | Máximo draw calls / triángulos | Resolución efectiva | Muestras |
| --- | --- | --- | --- | --- | --- |
| [Sol CI](../performance/gate-a/ci-40002460207-route-performance-sun.json) | 45,85 | 33,4 / 33,4 | 20 / 17.966 | Ratio 0,75; 309×629 | 826 |
| [Lluvia CI](../performance/gate-a/ci-40002460207-route-performance-rain.json) | 43,70 | 33,4 / 33,4 | 21 / 19.886 | Ratio 0,75; 309×629 | 788 |

Viewport CSS 412×839 y DPR emulado 2,625. La diferencia entre esta ejecución y la final refleja variabilidad del runner sin cambios de runtime, no una regresión demostrada del código. Las tablas CI no sustituyen la comparación local antes/después ni la prueba física.

## Assets y procedencia

Conteo del modelo procedural actual de bicicleta/manos: 3.276 triángulos, 5 meshes y 1 material tras batching por assembly con colores de vértice. El inventario ahorra 7 meshes/calls respecto a los 12 anteriores; la reducción observada en las llamadas máximas WebGL del recorrido es de 5 por efecto del culling, y no debe confundirse con el inventario. Coche actual: 48 triángulos; peatón actual: 68. Estos últimos son placeholders, sin implicar actores finales o reactivos de B.

Presupuestos futuros de B/C: peatón de 4.000–5.000 triángulos y coche de aproximadamente 6.000; contar valores reales al integrarlos. No son modelos descargados o aprobados.

Blender MCP está disponible como herramienta, pero el servicio `localhost:9876` está desconectado. La producción final mediante ese flujo conserva riesgos de servicio, rig y materiales. Un fallback con Blender scripting necesita acuerdo posterior. La ficha [IDU y las condiciones geográficas](../geodata/README.md) están registradas; no se descargaron datos ni se verificó el trazado.

## Prueba en teléfono físico — pendiente

El usuario aplazó expresamente la prueba hasta aportar modelo, OS y navegador reales. La respuesta anterior contenía la plantilla, sin modelo real identificado; no se usa como resultado. No hay evidencia física validada. Al disponer del dispositivo:

1. Registrar modelo exacto, sistema operativo/versión y navegador/versión reales. Indicar fecha, resolución y orientación; no copiar el Pixel 7 emulado como modelo probado.
2. Jugar quieto y en lugar seguro, con Wi-Fi estable y ahorro de batería desactivado. Registrar carga inicial, temperatura percibida/medida y configuración; no conducir, caminar ni pedalear realmente.
3. En sol, acelerar y usar pulsos A/D o controles táctiles para girar; contragirar para comprobar recuperación. Separar observaciones de sensibilidad/estabilidad de las métricas del diagnóstico.
4. Para frenar, soltar primero el pedaleo y mantener el freno. Cuando se compruebe la meta de distancia, registrar velocidad inicial de 8 m/s y distancia de parada; no estimar metros por sensación visual.
5. Chocar frontalmente con el carro aproximadamente a los 110 m. Comprobar detención/respuesta, daño sin repetición espuria y posibilidad de recuperar el recorrido. Registrar lo ocurrido y su diagnóstico.
6. Rozar suavemente un bordillo y comprobar que la respuesta se distingue del impacto frontal, sin quedar atrapado ni atravesar el entorno.
7. Repetir conducción y frenado en lluvia; registrar diferencias observadas y métricas separadamente.
8. Comprobar pausa, continuación y reinicio. Descargar un JSON con «Descargar diagnóstico de esta prueba» desde la pausa al primer minuto y guardar otro al final, sin recargar la página entre ambos.
9. Mantener una sesión total de 10–15 minutos, repitiendo paseos mediante reinicio sin recargar la página. Conservar ambos JSON, incluidos sus registros de reinicios y cambios de resolución; el diagnóstico contiene resúmenes acumulados, no una serie temporal completa de FPS ni segmentos independientes de comienzo/final. Comparar los resúmenes con esa limitación y registrar aparte calor, respuesta táctil y errores al comienzo y al final. Registrar interrupciones, cambios de ajustes o conectividad.
10. Entregar diagnóstico y observaciones por separado: el JSON contiene mediciones; comodidad, legibilidad y sensación de conducción son valoración humana. No dar por cumplidos los metros de frenada ni los FPS a partir de opiniones.

## Pendientes para aceptar A

- Obtener revisión del usuario del vídeo y capturas finales de bicicleta/manos; no confundir geometría procedural de prueba con arte final.
- Completar la sesión física identificada y revisar sus diagnósticos, sin sustituirla por emulación.
- Recibir el OK explícito del usuario a A. La extensión del estándar y B/C requieren autorización posterior.
- La ampliación visual de A está autorizada como trabajo posterior: muestra de 25–50 m dentro de 200 m, bicicleta/manos en Blender, materiales, vegetación, fachadas e iluminación, con capturas y vídeo corto reales de giro/frenado. Su validación visual es independiente del teléfono aplazado; aún no representa un resultado aprobado ni autorización de B.
- Registrar alpha.1 como candidato técnico publicado y mantener A abierta; la siguiente mejora tendrá otra entrada con evidencia nueva. No anunciar 0.3.0 completa mientras falten las aceptaciones.
