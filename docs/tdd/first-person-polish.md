# Primera persona — pulido de anatomía y materiales

Fecha: 2026-10-23 (Bogotá). Área: Primera persona / Blender.

## Rojo comprobado

`npm test -- tests/unit/blender-bicycle.test.ts` — 15:46:55, salida 1.

```text
Tests 2 failed | 4 passed (6)
FAIL separa respuesta PBR de metal, goma, guantes y tela en el GLB real
AssertionError: grip-rubber-pbr: expected false to be true
FAIL ocho dedos abrazan el puño con geometría junto al anclaje y agarre estable al girar
AssertionError: expected undefined to be defined
```

El GLB anterior agrupaba guantes, goma y tela bajo un mismo material; tampoco
tenía un contrato de contacto para dedos alrededor del puño. Las pruebas nuevas
leen el GLB exportado, su material PBR y vértices reales junto a cada contacto.
Los anclajes sirven para verificar la colocación, no sustituyen la inspección
visual de anatomía, transición de muñecas, agarre y telas dentro del juego.

## Alcance y presupuesto

Segundo rojo: `npm test -- tests/unit/blender-bicycle.test.ts`, 15:48:22,
salida 1: `TypeError: bike.resize is not a function`, 1 fallida / 6 verdes.
El nuevo contrato solicitado es `resize(aspect)` con escala uniforme del modelo,
sin cambiar el FOV o la posición de la cámara del mundo.

Arte original elaborado en Blender, sin modelos, texturas ni tipografías de
terceros. Fuente editable, script, pivotes y SHA-256 del GLB conservados.
Presupuesto autorizado para este modelo: hasta 14 draw calls y 14 000 triángulos.
La dirección artística sigue la guía del usuario: guantes urbanos, mangas con
volumen y materiales diferenciados. No se modifican física, conducción o cámara
del mundo.

## Verde y refactor comprobados

- 15:48:09: `npm test -- tests/unit/blender-bicycle.test.ts`, 6/6 verdes tras
  reconstruir el agarre y separar materiales en el GLB.
- 15:48:32: mismo comando, 7/7 verdes al añadir `resize(aspect)`.
- Refactor: constantes explícitas para aspect y escala mínima; tabla común de
  materiales para batching. Radio efectivo de rueda y jerarquía conservados.
- 15:51:11: mismo comando, 7/7 verdes después del refactor y del refinamiento
  visual de costuras, muñecas y almohadillas de nudillos.
- Comando de arte ejecutado correctamente con Blender 5.1.2:
  `blender.exe --background --factory-startup --python tools/assets/build-bicycle.py -- --preview`.

Resultado del GLB: **8 884 triángulos, 11 draw calls, 4 materiales, 235 132 bytes**.
No fue necesario ampliar los límites previos de prueba de 12 000 triángulos y
12 draw calls. Frente al modelo anterior se añaden dos batches de material
únicamente al manillar; ruedas, cuadro y pedales conservan sus agrupaciones.
SHA-256: `43e1ac8a1dba766d6da4b3fd0d5b04e3127a39df711969b54ce97c1c76171c6e`.

## Inspección y límites

Vista de estudio inspeccionada y capturas reales generadas desde
`http://127.0.0.1:4182/?gate=a`: escritorio 1280×720 y portrait 393×851, sol y
lluvia, más giro a la derecha mediante teclado. Evidencia en
`assets/source/bicycle/in-game-*.png` y métricas correspondientes en
`assets/source/bicycle/in-game-review.json`.

Se conservan ambas manos en pantalla y los extremos abiertos de las mangas
fuera del encuadre, también al girar. La vista no oculta el horizonte. El
agarre mantiene la relación de dedos y goma porque pertenecen al mismo pivote.
La calidad adaptativa capturada es diffuse/low a ratio 0.75; la separación PBR
se valida en el GLB y requiere revisión en el perfil alto integrado. Este
modelo sigue siendo estilizado; no se afirma acabado fotorealista. Las capturas
estáticas no acreditan FPS ni pruebas en teléfono físico. La integración, el
recorrido y la comparación de calidad final corresponden al orquestador.

## Último pase limitado de arte — congelación definitiva

Tras la revisión de las capturas se aclaró el panel dorsal del guante mediante
colores de vértice sobre la superficie existente. La goma sigue oscura. La
manga incorpora ahora crestas y valles diagonales concentrados en muñeca y
codo, con mayor densidad longitudinal de vértices, costura adherida a esa
superficie y sombreado de compresión suave. No hay anillos flotantes ni cambios
de lógica del juego, pivotes o `resize`.

Validación determinista de arte: exportación Blender 5.1.2 correcta, límites y
hash del GLB comprobados por la suite existente. `npm test --
tests/unit/blender-bicycle.test.ts` a las 15:56:09: **7/7 verdes**.
No aplica prueba ejecutable nueva: este pase modifica exclusivamente la forma
y el color del recurso artístico; conserva los contratos ya probados.

Resultado definitivo: **10 516 triángulos, 11 draw calls, 4 materiales,
274 308 bytes**, dentro de 12 000 / 12.
SHA-256: `da687736d4eb1ca22124a2242a20af6c1623f92c62da30006c710ff83a35cc85`.
`studio-preview.png` regenerado e inspeccionado: dorsal más legible y pliegues
localizados visibles. No se declara anatomía final aprobada ni fotorealismo.

Las cinco capturas `in-game-*.png` se regeneraron tras restaurar el boot local:
documentan este GLB definitivo, cuyo hash figura en `in-game-review.json`.
Se revisaron escritorio y portrait girando: el dorsal es más distinguible y
los pliegues se ven en la silueta, con agarre y encuadre conservados. Sigue
siendo anatomía estilizada: estas comprobaciones no constituyen aprobación
artística final. La comparación con los nuevos materiales del entorno, la
calidad alta y el vídeo de conducción corresponden al orquestador.
