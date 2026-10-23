# Pools de actores visibles — 2026-10-23

## Regresión y rojo

Un benchmark local sin trazas seguía alrededor de 29 FPS con DPR .375 según el Orquestador. Se identificaron seis draw calls de pools de carro/peatón que permanecían visibles aunque todas sus instancias estaban desactivadas y situadas a y=-1000.

Prueba nueva de escena real recorre meshes respetando visibilidad de todos sus padres: vacío → carro activo a z30 → inactivo; segunda prueba añade ambos tipos y los saca de alcance. `npm test -- tests/unit/actor-rendering.test.ts`: dos fallos esperados. Conteo seguía 26 tanto vacío como activo (se esperaba aumento de tres/seis respectivamente).

## Verde

Se conserva el mismo criterio de alcance del render de obstáculos. Los tres meshes de cada tipo de actor se renderizan únicamente cuando hay al menos un actor activo de ese tipo dentro de alcance. Ciudad y actores activos conservan geometría y volumen.

`npm test -- tests/unit/actor-rendering.test.ts tests/unit/ui.test.ts tests/unit/first-person.test.ts`: tres archivos, siete pruebas verdes. Sin actores quedan 20 meshes visibles; carro añade tres y peatón añade otros tres.

## Refactor

Agrupar pools una vez evita arrays nuevos por frame y marca matrices actualizadas únicamente si ese pool está visible.

Mismo comando: siete pruebas verdes. `npm run check`: exit 0. El presupuesto 100 draw calls, 100 000 triángulos y 30 FPS permanece intacto. La nueva medición real de frames tras integrar corresponde al Orquestador; los tests estructurales no certifican FPS.
