# Bicicleta y manos originales trabajadas en Blender — 2026-10-23

## Archivos y procedencia

- Fuente editable: `assets/source/bicycle/bicycle-rider.blend` (179639 bytes al cierre del área).
- Artefacto runtime: `public/assets/models/bicycle-rider.glb`.
- Inventario: `public/assets/models/bicycle-rider.manifest.json`.
- Generador reproducible: `tools/assets/build-bicycle.py`.
- Adaptador Three.js: `src/rendering/blender-bicycle.ts`.
- Preview de estudio: `assets/source/bicycle/studio-preview.png`; inspeccionado localmente. Es render de Blender y NO captura del juego.

Todo el modelado, geometría, colores y materiales es original del proyecto. Sin modelos, texturas, fuentes ni audio descargados. No se usó la escena activa del usuario: Blender CLI inicia proceso aislado con `--background --factory-startup`. El MCP interactivo sigue fuera de este flujo.

## TDD

1. Rojo: `npm test -- tests/unit/blender-bicycle.test.ts` dio 2 fallos esperados antes de crear artefacto/adaptador: GLB ausente y módulo de adaptador ausente.
2. Verde: GLB generado por Blender 5.1.2 y cargado mediante GLTFLoader real en Node: 2/2 pruebas verdes.
3. Ampliación de validación: GLB PBR, ejes, escala única, manos/puños, dirección, cadencia, radio efectivo y proyección de extremos de mangas en móvil/escritorio a dirección -0.48/0/+0.48: 3/3 pruebas verdes.
4. El inventario se calcula desde los buffers reales del GLB y se compara con manifest, incluyendo bytes y SHA256.

## Construcción y decisiones de arte

Comando: `& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' --background --factory-startup --python tools/assets/build-bicycle.py`.

Agregar `-- --preview` genera un render de estudio sin guardarlo como escena activa ni cambiar la fuente editable con cámaras de QA.

Blender documenta el exportador local en `5.1/scripts/addons_core/io_scene_gltf2/__init__.py`; el script inspecciona las propiedades RNA y utiliza exportación GLB Y-up, selección explícita y colores de vértice.

- Palmas mediante secciones anatómicas, cuatro dedos curvados con articulaciones y pulgares envolviendo los puños; guantes carbón, refuerzo de nudillos y costuras discretas.
- Mangas burdeos de impermeable con perfil de muñeca/antebrazo, pliegues integrados en topología continua, costura exterior, puño elástico y tira reflectante original.
- Manillar curvo, abrazadera, tornillos, raspones localizados, levas de freno, pivotes, cables, goma estriada y timbre.
- Cuadro, horquilla, llantas, radios, bujes, pedales y bielas con jerarquía mecánica independiente.
- Fuente .blend conserva componentes individuales editables. GLB agrupa por autoridad de movimiento/material: dirección, cuadro, cada rueda y pedales. Dos materiales PBR compartidos: metal usado y textil/goma, con colores de vértice originales.

La primera revisión de estudio detectó artefactos por anillos de pliegue superpuestos; se sustituyeron por deformación integrada de la manga. Se inspeccionó el segundo render. La aceptación artística depende de la escena de juego que integra el Orquestador, no de esta preview.

## Resultado de inventario

- 7120 triángulos.
- 9 draw calls estructurales y 2 materiales PBR.
- 187168 bytes runtime.
- SHA256: `a249f276ecd72791c3d44ca5783ab341f1c4a9f00ce848d242191ba6dba6e3fd`.
- Sin imágenes externas ni decodificadores Draco/Meshopt requeridos.

Dentro de presupuesto asignado de 12000 triángulos y 12 calls; esto no sustituye mediciones WebGL ni FPS del juego completo.

## Contrato y límites

`prepareBlenderBicycle(gltf.scene)` devuelve `{group,update}`. El wrapper aplica posición `(0,-.42,-1.3)` y escala `.72` exactamente una vez; nombre público `bicycle`. Nodos fuente Y-up conservan nombres de pivotes y anclajes. `BicyclePresentation` mantiene velocidad/elapsed, esfuerzo de pedaleo, giro y roll; pausa/reinicio usan la misma cadencia del procedural y radio efectivo `.34 * escala`.

No se modificaron scene, main, UI, entorno ni física en esta área. El Orquestador integra loader, ambiente PBR, capturas y rendimiento. El modelo mantiene el encuadre/proxy de Puerta A; no declara rig corporal completo, IK de codos, arte final de ciudad ni prueba en teléfono.

## Refactor y verificación final del área

- Refactor del adaptador: constantes explícitas de escala, radio y cadencia; comportamiento y GLB sin cambios.
- `npm test -- tests/unit/blender-bicycle.test.ts tests/unit/procedural-bicycle.test.ts tests/unit/first-person.test.ts tests/unit/actor-rendering.test.ts`: **23/23 verdes** en cuatro archivos, incluidos los tres tests del GLB/adaptador.
- `npm run check` al cierre del área: bloqueado únicamente por dos referencias nuevas a `world.dispose` en `tests/unit/art-integration.test.ts`, método todavía pendiente en la integración del Orquestador. No se detectaron errores del adaptador/modelo; no se afirma check global verde hasta integrarlo.
- La segunda generación del mismo asset con preview conservó conteos/hash antes del ajuste de pliegues; el manifest final SHA256 se comprueba automáticamente contra el GLB. No se afirma que un render de estudio sustituya QA en el juego.

## Iteración de encuadre a partir de captura real

Se inspeccionó `docs/screenshots/gate-a-art/preview.png`: guantes/manillar tenían poca presencia y los brazos se leían demasiado finos y largos. El ajuste permanece dentro del área de bici/manos, sin cambios en escena, cámara, física, entorno ni UI.

- Rojo: `npm test -- tests/unit/blender-bicycle.test.ts` dio dos fallos esperados: posición z anterior -1.3 y anclajes de anchura de palma aún ausentes.
- Presentación ahora `(0,-.38,-1.14)`, escala .72. Acercar y elevar ligeramente mantiene la mano en el tercio inferior y aumenta legibilidad. El frente de la bici queda más atrás respecto al collider, conservando la cámara del juego.
- En Blender: manillar/puños más gruesos, palmas anatómicas y dedos aproximadamente 20–25% mayores, manguitos/antebrazos con volumen, pliegues integrados más legibles y muñecas diferenciadas. Cuffs se ensancharon para envolver la tela sin intersecciones visibles.
- Se añadieron anclajes de palma coincidentes con los extremos reales de su sección más ancha. Prueba de encuadre exige más de 60 píxeles de anchura de palma a 1280×720/FOV65 y mantiene centros de manos por debajo del horizonte sin ocupar la mitad superior. Persisten pruebas móvil/escritorio de mangas fuera de pantalla y agarre/cadencia/ejes.
- Verde/refactor: constantes de encuadre nombradas, sin cambios posteriores de geometría. `npm test -- tests/unit/blender-bicycle.test.ts tests/unit/art-integration.test.ts`: 8/8 verdes. `npm run check`: exit 0.
- Manifest final de esta iteración: **7120 triángulos, 9 calls, 2 materiales, 187596 bytes**; SHA256 `6676817a5e6a9302625a84b3f3ff3b2d489d6404c3ee8966f927356b92f92d76`.
- Source .blend, GLB, generador, manifest y preview de estudio actualizados. La última revisión de estudio confirma cuffs sin tela atravesada. La aceptación final de encuadre se realiza en capturas del juego a cargo del Orquestador.
