# Bicicleta y primera persona originales

`bicycle-rider.blend` conserva piezas independientes y materiales editables antes
de agrupar el GLB para el navegador. Geometría, colores, materiales y vestuario
originales del proyecto; no contiene recursos externos. No se presenta como
fotogrametría ni como reproducción de modelos de Def Jam.

Regenerar desde la raíz del repositorio:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' --background --factory-startup --python tools/assets/build-bicycle.py -- --preview
npm test -- tests/unit/blender-bicycle.test.ts
```

Blender 5.1.2 exporta `public/assets/models/bicycle-rider.glb` y su manifiesto de
conteos y SHA-256. El script no requiere descargas. `--preview` añade una imagen
de estudio; el `.blend` se guarda antes de añadir esa cámara y sus luces.

## Contratos conservados

- Ejes de juego: +X derecha, +Y arriba, -Z avance. El script convierte a Z-up
  durante la autoría y el exportador glTF vuelve a Y-up.
- Pivotes independientes: manillar, rueda delantera, rueda trasera y pedales.
- Metal, goma, guantes y tela utilizan cuatro materiales PBR con color de
  vértice. Los materiales extra solo añaden dos batches al manillar.
- Ocho anclajes de contacto están en el centro de los extremos de los dedos;
  las pruebas comprueban también vértices reales cercanos y separación al eje
  del puño. No son sensores físicos.
- El adaptador ofrece `update(state)` y `resize(aspect)`. El segundo reduce la
  escala uniformemente en portrait, manteniendo posición y cámara del mundo.

## Evidencia visual

`studio-preview.png` es exclusivamente un render de estudio. Las imágenes
`in-game-*.png` son capturas reales del build local en sol, lluvia y giro.
`in-game-review.json` registra hash del modelo, estado, viewport y drawing buffer
efectivos. Son inspecciones estáticas de anatomía/encuadre; no acreditan FPS ni
pruebas en un teléfono físico. El informe de integración del proyecto contiene
las comparativas y validaciones finales de la versión.

Las capturas locales `in-game-*`, `studio-preview.png` y el `.blend` corresponden
al GLB definitivo con pliegues localizados y dorsal más claro; el JSON identifica
su hash. La comparación final con los nuevos materiales del entorno se guarda
por el orquestador en la evidencia global de la versión.
