# Prioridad de profundidad opaca

2026-10-23, Bogotá. Presentación / QA. Sin cambios en umbrales, resolución,
geometría, materiales, transparencias o física.

## Diagnóstico

Three.js instalado ordena opacos por `groupOrder`, `renderOrder`, identificador
del material y finalmente profundidad (`WebGLRenderLists.js`,
`painterSortStable`). Los Lambert existentes del mundo preceden a los reemplazos
diffuse creados al preparar la bicicleta. Por tanto, fragmentos de bases pueden
sombrearse antes de que bicicleta y superficies artísticas cercanas los tapen.

Datos CI 40030195058 por ventanas consecutivas de 3 segundos, sin excluir
frames: sol 22.42 / 25.81 / 32.82 / 34.86 / 34.14 / 34.86 FPS; lluvia 22.75 /
24.67 / 32.33 / 32.67 / 32.85 / 33.67 FPS. Ratio fijo 0.75. El coste mayor se
concentra en los primeros seis segundos de la muestra artística. Esto orienta
la investigación; no atribuye todo el coste a un único origen sin medirlo.

## Rojo comprobado

`npm test -- tests/unit/opaque-depth-order.test.ts`, 17:07:05, salida 1:

```text
expected 0 to be less than 0
Cannot find module '/src/rendering/opaque-depth-order'
Tests 2 failed (2)
```

Falta prioridad de oclusores cercanos y el helper todavía no existe. La prueba
incluye conservación de grupos, blending, depth flags, geometría y prioridad
al alternar los materiales high/low.

## Verde y refactor

El 2026-10-23 a las 17:07:24, el mismo comando dio **2/2 verdes** tras aplicar
prioridad a los meshes opacos de bicicleta y ambos niveles de detalle artístico.
La sesión se interrumpió antes de completar la revisión.

Retomado el 2026-10-26 con autorización del usuario. A las 09:20:01 se comprobó
de nuevo el estado existente: **2/2 verdes**. Refactor: prioridades con nombres
en `OPAQUE_DEPTH_ORDER`, sin cambiar sus valores ni el comportamiento.
Se amplió la regresión usando el GLB real: conserva materiales, referencias de
geometría/buffers, transforms e inventario de **10 516 triángulos / 11 calls**.

A las 09:20:49:

```text
npm test -- tests/unit/opaque-depth-order.test.ts tests/unit/render-work.test.ts tests/unit/actor-rendering.test.ts tests/unit/art-integration.test.ts tests/unit/blender-bicycle.test.ts tests/unit/material-lighting.test.ts tests/unit/first-person.test.ts
Test Files 7 passed (7)
Tests 35 passed (35)
npm run check
tsc --noEmit: correcto
git diff --check: sin errores en los archivos de esta tarea
```

No se han modificado materiales, colores, transparencias, depth flags, grupos,
resolución ni umbrales. Las pruebas cubren prioridad persistente al alternar
high/low y mantienen fuera de esta política los objetos transparentes o sin
escritura/prueba de profundidad. Las llamadas y triángulos no se reducen: se
busca ahorrar sombreado de fragmentos que acabarían ocultos.

La equivalencia visual mediante capturas y el beneficio real de rendimiento
siguen pendientes de la validación coordinada del orquestador. Conservar
recursos y estados no demuestra por sí solo igualdad de píxeles ni 30 FPS.

## Integración verificada posteriormente — 2026-10-26

El pendiente del apartado anterior corresponde al estado al terminar la subtarea. Integración completó la [comparación de píxeles](../screenshots/gate-a-polish/depth-order/pixel-diff.json): portrait sol idéntico; landscape sol con media por canal inferior a 0,001/255. Lluvia animada no es idéntica, con medias inferiores a 0,051/255. No se modificaron geometría ni materiales para obtener estas capturas; la comparación no se extiende a cambios artísticos posteriores.

El [workflow remoto 40339380259](https://github.com/OdinTKD/ciclovia-bogota-xr/actions/runs/40339380259), commit `cef53c6`, pasó los dos E2E focales de rendimiento con CPU 4× y umbrales existentes, sin bajar ratio mínimo 0,75 ni objetivo 30 FPS. [Corto sol](../performance/gate-a-polish/depth-order-ci/performance-sun.json): 40,60 FPS; [corto lluvia](../performance/gate-a-polish/depth-order-ci/performance-rain.json): 51,19 FPS, fuera de la zona artística. [Recorrido sol](../performance/gate-a-polish/depth-order-ci/route-performance-sun.json): 47,51 FPS; [recorrido lluvia](../performance/gate-a-polish/depth-order-ci/route-performance-rain.json): 46,40 FPS; máximos 28/29 calls y 28.208/30.128 triángulos.

Estos resultados validan la pasada focal y su artefacto en ese host, sin atribuir absolutamente la diferencia de FPS a la prioridad de profundidad. No constituyen full CI, despliegue ni validación de teléfono. La nueva regresión visual de cobertura alpha de follaje se investiga por separado y no se declara resuelta mediante esta evidencia.
No se ha abierto navegador, ejecutado benchmark ni creado commits en esta
subtarea.
