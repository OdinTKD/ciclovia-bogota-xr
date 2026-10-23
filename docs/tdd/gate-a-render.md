# Puerta A — render y bicicleta procedural — 2026-10-23

## Alcance y contrato

Implementación original, sin descargas, modelos, texturas, fuentes ni audio externos. Se conserva `createWorld()` / `buildScene(canvas)`. `RenderSnapshot` admite opcionales `worldZ`, `yaw`, `steeringAngle`, `roll` y `pedalEffort`, conservando compatibilidad con snapshots anteriores. Coordenadas visuales: avance hacia -Z; `worldZ` ya está en ese sistema; `yaw`/`steeringAngle` de dominio positivos hacia la derecha se representan con rotación Y negativa. El progreso `distance` no cambia geometría del mundo.

La cámara usa `worldZ ?? -distance`, altura de ojos 1.65 m y roll explícito. El entorno permanece fijo: se eliminó el reciclado por módulo 14. La geometría original cubre el fragmento de 200 m y continúa hasta aproximadamente 350 m; no representa una ampliación artística de los 1200 m. Carros y peatones mantienen z de dominio positiva y se representan en worldZ=-z, sin restar distancia por segunda vez.

`createProceduralBicycle()` devuelve `{group,update}`. Jerarquía con pivote de dirección, puños, manos con guantes, mangas/cuffs, frenos, cables curvos, timbre, cuadro, horquilla, ruedas con radios y pivote de pedales. Los elementos de agarre y manos comparten la autoridad del pivote de dirección. La rueda gira por velocidad real integrada con elapsed; pedalear exige esfuerzo y desplazamiento. Pausa no avanza elapsed y reinicio de elapsed limpia fases. No hay movimiento animado por mero incremento del progreso.

`assetGeometryStats(root)` exporta inventario conservador calculado desde geometría/materiales reales: meshes, geometrías únicas, materiales únicos, triángulos con multiplicidad de instancias y llamadas estructurales. No equivale a contador WebGL tras culling; `renderer.info` sigue siendo autoridad para calls/triangles del frame.

## Rojo

- Se sustituyó la localización frágil `children[1]` por nodos nombrados y se añadieron pruebas de cámara/mundo y bicicleta ANTES de implementación.
- `npm test -- tests/unit/first-person.test.ts tests/unit/procedural-bicycle.test.ts`: cuatro fallos de nodo/entorno inexistentes y suite de bicicleta fallida por módulo ausente.
- Regresión adicional velocidad real: cambiar progreso con speed=0 producía -5.882 rad de rueda. La prueba nueva falló y exigió integrar velocidad/elapsed en vez de derivar giro del progreso.

## Verde y refactor

- Primera implementación: 14/14 pruebas render/UI/actores verdes.
- Batching de las piezas estáticas del pivote por material mantiene los anclajes nombrados y excluye ruedas/pedales móviles. Bicicleta pasó de 22 a 12 meshes/calls estructurales, sin cambiar los 3276 triángulos ni sus 6 materiales.
- Bounds de instancias estáticas calculados al crear; bounds de actores móviles recalculados al actualizar matrices. Se conservan los pools invisibles sin actores activos. Lluvia se ubica alrededor de la cámara.
- Tras ajustar velocidad real y refactor: `npm test -- tests/unit/first-person.test.ts tests/unit/procedural-bicycle.test.ts tests/unit/actor-rendering.test.ts tests/unit/ui.test.ts`: 15/15 verdes (4+5+2+4).
- `npm run check`: exit 0 al cierre de esta área. Durante integración temporalmente falló por módulos de otras áreas todavía en rojo; no se alteraron esos archivos.

## Inventario y smoke de navegador

`npm test -- tests/unit/procedural-bicycle.test.ts --silent=false` mostró:

- Bicicleta: 3276 triángulos, 12 meshes/calls estructurales, 6 materiales, 12 geometrías.
- Mundo completo, incluyendo pools/lluvia inactivos: 21590 triángulos, 33 meshes/calls estructurales, 27 materiales, 16 geometrías.

Smoke Chromium local a 393×851, escena quieta tras inicio con confirmación de seguridad: cero errores pageerror; `renderer.info` expuesto en __game registró 22 calls, 17390 triángulos y pixelRatio 1. Captura local `test-results/gate-a-render-mobile.png` inspeccionada: manillar, guantes, mangas, cables y vía visibles.

Ese smoke no mide ni certifica FPS. Presupuesto sin cambios: 100 calls, 100000 triángulos, 30 FPS. El Orquestador debe ejecutar benchmark integrado y registrar drawing buffer/resolución. Este trabajo es prototipo de Puerta A; no acredita arte final, IA reactiva, audio ni hardware físico.

## Ajuste final de dimensiones y recursos por actor

- Regresión primero: `npm test -- tests/unit/actor-rendering.test.ts` falló con ancho visual 3.5 m frente a 4 m del collider JSON. Verde: cuerpo visual ocupa 4×2 m. Cubierta y ruedas permanecen dentro de ese contorno. No cambió el presupuesto geométrico.
- Se añadieron nombres a cada submalla/pool para medir recursos y probar bounds sin índices frágiles. La prueba calcula geometría desde los buffers reales y verifica que todos los componentes del peatón activo quedan dentro de halfX=.35 / halfZ=.35. La geometría actual no excede esos límites y no se necesitó ampliarla.
- Carro por entidad: cuerpo 12 + cubierta 12 + dos ruedas de 12 = **48 triángulos**, cuatro instancias geométricas, tres materiales/submallas. El pool compartido de capacidad 12 puede enviar **576 triángulos y 3 draw calls** aunque solo un carro esté activo.
- Peatón por entidad: cuerpo cilindro 24 + cabeza icosaedro 20 + dos piernas de 12 = **68 triángulos**, cuatro instancias geométricas, tres materiales/submallas. Pool compartido capacidad 12: **816 triángulos y 3 draw calls** si está activo.
- Son placeholders procedurales originales, sin recursos Quaternius incorporados y sin animaciones/IA de Puerta B. Contar geometría individual y geometría enviada por pool evita confundir el coste real con el modelo unitario.
- Se eliminó un marcado de actualización de matrices redundante que permanecía tras el bucle de pools. Se conserva marcado y cálculo de bounds únicamente para pools visibles.
- Cierre: `npm test -- tests/unit/actor-rendering.test.ts tests/unit/first-person.test.ts tests/unit/procedural-bicycle.test.ts tests/unit/ui.test.ts`: **17/17 verdes**. `npm run check`: exit 0.

## Revisión de comodidad y radio efectivo

- Rojo primero: `npm test -- tests/unit/first-person.test.ts tests/unit/procedural-bicycle.test.ts`: tres regresiones fallaron (roll .04 en vez de .006; roll .3 en vez de .045; avance representado por rueda .72 m en vez de 1 m debido a escala .72).
- Verde: cámara usa 15% de la inclinación del dominio y límite absoluto .052 rad (~3°). La inclinación local de la bicicleta conserva autoridad separada; con roll de dominio .3, cámara .045 y bici -.18.
- La rueda divide recorrido por radio efectivo `.34 * group.scale.x`, conservando rodadura coherente tras escala de presentación. El modelo es viewmodel de prototipo; su posición relativa a cámara y wheelbase visual no certifican un rig final apoyado en el suelo.
- Refactor: constantes de comodidad nombradas y radio efectivo local explícito. Mismo conjunto relevante: 19/19 pruebas verdes (cámara5 + bicicleta6 + actores4 + UI4). `npm run check`: exit 0.
- No se movió el peatón del JSON: el primero permanece en z220 fuera de la meta de 200 m; la Puerta A se centra en contactos del carro y bordes. IA/animación/encuentros de peatón pertenecen a la siguiente puerta.

## QA visual — mangas, cámara y bordillo

El Orquestador detectó extremos de mangas visibles como brazos flotantes y atravesamiento del viewmodel en choque frontal en `docs/screenshots/gate-a/after-desktop-bicycle.png` y `after-contact.png`. Se inspeccionaron ambas capturas antes de corregir.

- Rojo: nuevas pruebas de anclajes de extremos de mangas fuera del viewport móvil/escritorio a dirección -0.48/0/+0.48, seguimiento relativo al cuerpo, envolvente completa del neumático frontal y bordillo visual. `npm test -- tests/unit/first-person.test.ts`: 5 fallos esperados, 4 pasan. La rueda frontal llegaba a z=-1.97464 respecto al centro del collider; no existían anclajes de cap ni señal visual nombrada.
- Verde: mangas prolongadas abajo/laterales fuera del encuadre, conservando manos/puños. Cámara sigue 1.3 m detrás del centro físico usando vector `(-sin(yaw), cos(yaw))`, altura 1.65 m, yaw igual al del cuerpo y comodidad de roll anterior. A diferencia de 1.1 m, el offset 1.3 también encierra el borde del neumático frontal, no solo su centro: tip z≈-.67464 queda detrás de la cara frontal física z=-.7.
- Bordillo `boundary-cue`: centros ±2.95 m, ancho .4 m y altura .16 m, cara interior a ±2.75 m coincidente con el límite físico. Es una señal de colisión arcade del prototipo, no cartografía/arte final.
- Refactor: distancia de seguimiento nombrada y yaw calculado una vez para posición/rotación. `npm test -- tests/unit/first-person.test.ts tests/unit/procedural-bicycle.test.ts tests/unit/actor-rendering.test.ts tests/unit/ui.test.ts`: **23/23 verdes** (cámara9, bici6, actores4, UI4). `npm run check`: exit 0.
- Solo cambió presentación. No se modificó física, posición de peatones, main ni UI; no se ejecutaron navegadores/benchmarks durante esta corrección para evitar interferir con QA del Orquestador.
- Límites: es viewmodel/proxy A. La prueba de envolvente valida el frente visible en reposo y las proyecciones FOV actuales; no certifica contacto de todas las superficies de un modelo final. La rueda trasera y longitud total visual no son el collider, y la cámara retrasada puede aproximarse al borde en giros fuertes. El modelo final y su ajuste completo se revisarán en Puerta C.
