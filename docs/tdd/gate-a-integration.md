# Puerta A — integración, diagnóstico y tramo de prueba

Fecha: 2026-10-23. Responsable: Orquestación / Integración / QA.

## Rojo

- `npx vitest run tests/unit/performance.test.ts`: 1 fallo / 3 correctas. `summarizeFrames` carecía de p50, p99 y máximo; `[16 × 98, 50, 120]` debía conservar el pico de 120 ms.
- `npx vitest run tests/unit/session-report.test.ts`: fallo de importación esperado; no existía el registrador de sesión.
- `npx vitest run tests/unit/ui.test.ts`: progreso de 100/200 devolvía 8,333 % en lugar de 50 %.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4174/ npx playwright test tests/e2e/gate-a.spec.ts --project=mobile`: sobre copia congelada del commit `3a5d4c4`, fallo porque `state.yaw` era undefined. La copia usa únicamente un cacheDir Vite separado; no modifica el código de juego de referencia.

## Verde

- Se añadieron percentiles, máximos, registro de resoluciones reales y diagnóstico local descargable. El informe distingue observaciones del teléfono de datos medidos; no se envía a servicios externos.
- El tramo activo es de 200 m; `virrey.json` conserva la longitud maestra de 1.200 m. UI declara puerta A y geografía sin verificar.
- Main conecta el tráfico existente al tick fijo, sin pasos físicos ni consultas con efectos de tiempo fuera del controlador. No incorpora actores reactivos de la puerta B.
- `npx vitest run tests/unit/performance.test.ts tests/unit/session-report.test.ts tests/unit/ui.test.ts`: 10/10.
- `npm run check`: correcto.
- `npm run test:e2e -- tests/e2e/gate-a.spec.ts`: 2/2, escritorio y móvil. Verifica dirección, pausa, un paso Rapier por tick, longitud, resolución y contenido del JSON descargado.

## Refactor

- Función común de percentiles, conservando muestras lentas.
- El registrador limita almacenamiento a 120.000 muestras y declara truncación; resoluciones se registran solo cuando cambian. El HUD mantiene actualización limitada.
- Las validaciones finales y límites de la puerta se registran en el informe de cierre; este documento no certifica teléfono físico ni aprobación del usuario.

## Regresión adicional: frames sin tick físico

- Revisión detectó que muestrear solamente `dt > 0` omitía frames de render que no completaban 1/60 s.
- Rojo: `npm run test:e2e -- tests/e2e/gate-a.spec.ts --project=desktop -g 'cada frame'`. Reloj Playwright controlado: diez RAF de 16 ms generaban nueve ticks; el JSON contabilizaba **9 frames en vez de 10**.
- Verde: muestreo condicionado a la fase jugando anterior al update, independiente de si se completó un tick. La misma prueba pasó: **10 frames, 9 ticks**. No se modifican tiempos ni se descartan frames lentos.
- Refactor: separar visualmente el muestreo de frames del bloque de contactos físicos; verificar junto con la suite de puerta A.

## Regresión adicional: repetición de la tecla de pausa

- Revisión final del subagente de motor detectó que mantener P/Escape alternaba pausa/reanudación por el auto-repeat del teclado.
- Rojo: `npx playwright test tests/e2e/gate-a.spec.ts --project=desktop -g 'mantener'`: 1 fallo esperado; la segunda pulsación sin soltar devolvía `playing` en lugar de `paused`.
- Verde: ignorar `event.repeat` en el atajo de pausa; misma prueba 1/1 correcta.
- Refactor: identificar el atajo y retornar temprano, eliminando el bloque condicional anidado. `npx playwright test tests/e2e/gate-a.spec.ts`: 6/6 correctas en escritorio y móvil; `npm run build`: correcto.
- Esta corrección no modifica física, render ni presupuesto. Las capturas y mediciones previas conservan su alcance; la validación completa del commit queda a cargo de CI antes de publicar.

## Rendimiento en CI: bloqueo y optimización

- El run `40000545028` bloqueó la publicación: 12 pruebas funcionales correctas, pero dos presupuestos fallaron (29,72 FPS en el muestreo inicial de sol y 27,62 FPS en el recorrido de lluvia). JSON originales conservados como `docs/performance/gate-a/ci-failed-40000545028-*.json`.
- Se optimizó la bicicleta con un material y colores por vértice, conservando sus 3.276 triángulos, seis colores y movimientos. Evidencia TDD del render en `gate-a-render.md`.
- La comprobación antigua «más de 15 draw calls» servía para detectar una escena vacía. Se sustituye por llamadas positivas, más de 10.000 triángulos de escena y más de 1.000 triángulos de bicicleta: el batching permite exactamente 15 llamadas al inicio sin eliminar contenido. Se mantienen los máximos de 100 calls / 100.000 triángulos, mínimo de 30 FPS y ratio mínimo de 0,375.
- Las mediciones anteriores de este candidato se preservan con prefijo `pre-batching-`; los resultados finales y publicación se consolidan en la revisión de A después de comprobarlos.
