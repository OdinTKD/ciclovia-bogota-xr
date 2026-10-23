# Trabajo de render evitado — pools y ciudad estática

2026-10-23, Bogotá. Área: motor de presentación / QA. No cambia el suelo visual
0.75, el objetivo de 30 FPS, los actores, el inventario geométrico ni la física.

## Rojo

`npm test -- tests/unit/render-work.test.ts`, 16:33:55: salida 1, 3 pruebas
fallidas por las causas esperadas:

```text
compacta actores: expected [12,12,24,12,12,24] to deeply equal [2,2,4,1,1,2]
no reescribe matrices: expected false to be true
agrupa ciudad: expected 9 to be 2
Tests 3 failed (3)
```

Las pruebas comprueban conteos reales de instancias, posiciones después de
compactar/reordenar, ausencia de escrituras/bounds repetidos y conservación del
inventario de ciudad (6 196 triángulos, incluyendo ventanas planas). Las bases
`base-cycleway` y `boundary-cue` conservan su geometría e inspección existentes.

## Verde y refactor

16:34:53: mismo comando, 3/3 verdes. Los seis pools pasan de 96 matrices
reescritas por frame a escribir únicamente las del actor que cambió; los
actores quietos no actualizan matrices, buffers ni bounds. `mesh.count` contiene
solo los actores visibles, sin slots enviados a Y=-1000. Al reordenar actores
se mantienen identidad/posición y al desactivarlos no quedan copias visibles.

La ciudad pasa de nueve llamadas a dos: ocho grupos Lambert opacos sin mapa
se hornean con colores lineales de vértice; las ventanas planas se conservan
aparte. No se elimina ningún triángulo (6 196 antes y después), y se comprueban
paleta, bounds y normales. El resto de la escena mantiene sus materiales y
geometría. No se cambian shaders, actores, física o presupuestos.

Refactor: reutilización de arrays de actores visibles y filtro explícito para
agrupar únicamente materiales compatibles. La prueba antigua de geometría por
actor se adapta a una instancia real de cada tipo en vez de dividir doce slots
fijos: mantiene las cantidades 48 y 68 triángulos y los límites del collider.

16:35:40: `npm test -- tests/unit/render-work.test.ts
tests/unit/actor-rendering.test.ts tests/unit/first-person.test.ts
tests/unit/art-integration.test.ts tests/unit/polish-scene.test.ts`: **23/23
verdes**. `npm run check`: correcto.
16:36:35: misma selección, **23/23 verdes** después del filtro final de
materiales y las comprobaciones de paleta/bounds/normales; `git diff --check`
de los archivos de esta tarea no reporta errores.

La reducción de trabajo no demuestra por sí sola una mejora de FPS: el perfil
y la medición comparativa los coordina el orquestador sobre el mismo recorrido
y la misma resolución. No se ejecuta benchmark concurrente con su perfil.
