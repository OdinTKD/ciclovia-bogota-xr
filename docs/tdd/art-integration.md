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
