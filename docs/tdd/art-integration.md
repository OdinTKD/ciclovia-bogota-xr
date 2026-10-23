# Integración artística de la puerta A — 2026-10-23

## Rojo

Antes de integrar: las tres pruebas de `art-integration.test.ts` fallaron por no utilizar la bicicleta suministrada, no existir la muestra artística y no disponer de sombras acotadas. Las dos pruebas de navegador fallaron por no solicitar el GLB y no mostrar un error de carga. Posteriormente, la prueba de liberación de materiales y texturas falló con `world.dispose is not a function`.

## Verde

Se integró la carga obligatoria de GLB, la muestra de 40 m, iluminación y propiedad explícita de recursos. `npx vitest run tests/unit/art-integration.test.ts`: 4/4. `npx playwright test tests/e2e/art-slice.spec.ts --project=desktop`: 2/2. `npm run check`: correcto. Una ejecución intermedia de navegador fue interrumpida por HMR mientras los agentes actualizaban assets; se repitió con archivos congelados y no se cuenta como regresión funcional.

## Refactor

La liberación compartida se extrajo a `disposeSceneResources`, deduplicando geometrías, materiales y texturas. Repetición de las cuatro pruebas: 4/4 y comprobación TypeScript correcta. La liberación del mundo es idempotente.

## Validación visual y rendimiento

Las pruebas anteriores verifican integración, carga y recursos; no certifican calidad artística ni rendimiento físico. Las capturas reales, vídeo y mediciones completas se conservan por separado bajo `docs/screenshots/gate-a-art`, `docs/videos/gate-a-art` y `docs/performance/gate-a-art`. Prueba en teléfono aplazada por el usuario.

## Optimización y diagnóstico — ciclo adicional

- El benchmark existente, sin cambiar umbrales, falló inicialmente con 24,77 FPS en Chromium/SwiftShader, viewport Pixel 7 y CPU 4×. Se preservó el JSON en `docs/performance/gate-a-art/before-optimization-sun.json`. Iteraciones intermedias de agrupación, filtrado y compilación llegaron a 28–29,85 FPS: siguen siendo fallos, no se redondean a 30.
- Materiales: prueba primero, fallo por aplicar la textura de entorno a toda la escena. Verde al reservar ese muestreo para metal/vidrio; constantes de selección extraídas y pruebas repetidas.
- Calidad mínima: rojo por ausencia de `applyRenderQuality`; verde al reducir efectos. Una segunda prueba falló porque persistía `MeshStandardMaterial` en el modo mínimo: verde con variantes Lambert cacheadas, conservando colores compartidos, mapas y geometría. El modo alto restaura los materiales originales. No se bajó el ratio mínimo .375 ni el umbral de 30 FPS.
- Propiedad de recursos: rojo porque se liberaba una textura cuyo propietario era un render target; verde al excluir esas texturas de la liberación general. Ambos materiales de cada variante quedan incluidos en la liberación de la escena.
- Ventanas lejanas: rojo 12 triángulos en una caja frente a los 2 necesarios para una superficie plana; verde con planos orientados hacia la vía. No se sustituyen las fachadas detalladas de la muestra.
- Preparación de shaders: prueba primero con módulo todavía ausente; implementación asíncrona prepara variantes mínima/alta y el primer render antes de habilitar jugar. La prueba comprueba orden y espera de ambas compilaciones.
- Diagnóstico: E2E falló porque `render.shadows` era `undefined`; verde al publicar calidad material y sombras junto con resolución, y conservarlos también en el diagnóstico descargable.
- Regresión completa posterior: `npm test` dio 118/118 en 25 archivos; `npm run build` terminó correctamente. La prueba corta de presupuesto pasó después de incorporar materiales difusos de reserva. Los resultados finales de recorrido/CI se registran con sus JSON, sin sustituir la prueba física.

## Calibración previa al inicio — regresión detectada en CI

- Rojo real: ejecución GitHub Actions `40009323688`, recorrido de sol 29,0299 FPS; la prueba corta solo conservó 12 muestras tras una reducción tardía. Sus JSON se conservan como `ci-failed-40009323688-*`. El despliegue quedó bloqueado.
- Rojo unitario: `renderer-calibration.test.ts` falló por ausencia del módulo, antes de implementarlo. Especifica 24 renders y dos reducciones para un dispositivo lento; 12 renders sin reducción para uno rápido.
- Verde: calibración acotada de fotogramas reales mediante RAF antes de habilitar Iniciar. No se modifica el mínimo de resolución, los umbrales ni la medición de frames jugando. Las dos pruebas pasan.
- Refactor: constantes de ventana y ratio mínimo compartidas con el controlador; `setQuality` único para preparación y adaptación jugando. `npm test`: 120/120 en 26 archivos. `npm run build`: correcto, con aviso de tamaño del bundle.

## Clima seleccionado durante la carga

- Rojo: la revisión detectó que cambiar el selector mientras cargaba el GLB no actualizaba la simulación. La prueba E2E retuvo la descarga, eligió lluvia y liberó el modelo: falló con `Expected rain, Received sun`.
- Verde: sincronización del valor actual del selector al terminar el arranque; la prueba pasa.
- Refactor: `syncWeather` compartido por arranque y evento de cambio. Las cuatro pruebas de carga/error en escritorio y móvil pasan; build correcto. Este ajuste conserva el clima seleccionado sin alterar las reglas de agarre o física.

## Filtrado de texturas en calidad mínima

- CI `40012579137`: 120 unitarias/build correctos, 17 E2E aprobadas, dos omisiones y un fallo. La prueba corta registró 20,8318 FPS dentro del arte; los recorridos largos sí pasaron (37,5779/36,6896 FPS). Se conservan sus JSON. La calibración corrigió el arranque, pero no bastó para el coste sostenido de la muestra.
- Rojo: prueba nueva esperaba anisotropía 1 en modo mínimo y obtuvo 4. También exige recuperar el filtrado original al volver a calidad alta.
- Verde: modo mínimo usa anisotropía 1 y filtrado bilineal sobre un nivel mip; calidad alta restaura la anisotropía y filtrado originales. Conserva mapas, geometría y mínimo de resolución; puede reducir la nitidez de superficies oblicuas y las transiciones mip en calidad mínima.
- Refactor: `applyTextureFiltering` comparte el ajuste, recuerda originales con WeakMap y evita invalidar texturas sin cambios. `npm test`: 121/121; build correcto con el aviso de tamaño existente. El siguiente CI conserva umbrales y toda la suite.
- La primera prueba local de este cambio dio 29,3928 FPS, con un frame inicial de 583,3 ms; se conserva `failed-local-filtering-sun.json`. La calidad final aún no se había renderizado durante preparación: la prueba de calibración se amplió primero y falló (24 renders frente a 25). Verde al renderizar y esperar un RAF adicional si el último frame cambió calidad; refactor con `renderFrame` compartido, cinco pruebas de calibración/materiales verdes. El equipo rápido conserva sus 12 renders. La prueba corta de sol y lluvia volvió a pasar, sin excluir frames de partida ni cambiar sus cinco segundos de medición.

## Multisampling en pantallas de alta densidad

- CI `40015453267`: 121 unitarias/build correctos; 17 E2E aprobadas, dos omisiones y un fallo corto de 24,3252 FPS. Sus métricas se conservan. El filtrado por sí solo todavía no cumplió.
- Rojo: módulo de política de rasterización ausente. La prueba E2E sobre contexto WebGL real también falló: en DPR 2,625 esperaba `antialias=false` y recibió `true`.
- Verde: desactivar el buffer multisample adicional en pantallas DPR mayor que 1, conservándolo a DPR 1 y manteniendo la resolución efectiva, geometría y límites. Es una política del dispositivo real, independiente de CI o del navegador de pruebas. Puede producir bordes más dentados en dispositivos de alta densidad cuando la resolución adaptativa baja.
- Refactor: umbral de densidad nombrado y política aislada en `renderer-options.ts`; valor real del contexto consultado una vez y expuesto como `render.antialias` en diagnóstico. `npm test`: 122/122 en 27 archivos; build correcto; tres E2E móviles de carga/error y presupuesto pasan. La suite remota completa sigue siendo condición del despliegue.

## Nivel de detalle del entorno

- CI `40016587178`: 122 unitarias/build correctos, 17 E2E aprobadas, dos omisiones y fallo corto de 21,9655 FPS. Los JSON quedan preservados. Los ajustes anteriores no bastaron para el coste de la muestra.
- Rojo: nueva integración falló por `world.setArtQuality is not a function`; exige exclusión mutua de los dos entornos, recuperación de alta calidad y clima sincronizado. El subagente de arte registró por separado el rojo del presupuesto geométrico.
- Verde: calidad mínima selecciona el entorno de 11.856 triángulos/11 llamadas; alta conserva 27.500/17. Ambos mantienen posiciones, superficies y trazado; se sincroniza la lluvia incluso cuando un nivel está oculto. El diagnóstico publica `artDetail`.
- Refactor: umbral compartido `MIN_RATIO`; 13/13 pruebas relevantes verdes. Regresión completa: 124/124 unitarias; build correcto con aviso de tamaño existente. Las dos versiones residen en memoria, pero solo una se dibuja; el inventario conservador incluye ambas.
- Una ejecución E2E local se invalidó por editar el módulo de escena mientras Vite servía la prueba: la recarga dejó `assets=null`. Se repite con fuentes congeladas; no representa un resultado de FPS.
