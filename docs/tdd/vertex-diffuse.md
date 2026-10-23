# Iluminación del perfil mínimo — TDD

2026-10-23, Bogotá. Área: render y QA. El objetivo es reducir trabajo de
fragmentos sin bajar el suelo de resolución 0,75 ni el presupuesto de 30 FPS.

## Rojo

Se añadieron primero las dos pruebas de `tests/unit/vertex-diffuse.test.ts`.
Con el adaptador aún vacío fallaron por ausencia de iluminación en vértices
y por no cambiar la clave de caché al activar el perfil. No fallaron por
importación, dependencias ni errores de sintaxis.

## Verde

`setVertexDiffuse` mueve la iluminación Lambert de las luces hemisférica y
direccional a vértices, conservando mapas, transparencia, niebla y tonemapping.
El perfil completo restaura el shader original exacto. El estado se conserva
en WeakMap y solo invalida el programa cuando cambia el perfil.

Las dos pruebas nuevas y las tres de materiales pasaron: **5/5**.

## Refactor y validación integrada

La iluminación y el varying de la cara trasera solo existen con `DOUBLE_SIDED`.
La selección focal volvió a pasar **5/5**. La captura en navegador compiló los
shaders sin errores de consola ni de página, en sol y lluvia.

Después de integrar la agrupación de ciudad y los pools de actores:
`npm test` a las 16:52 devolvió **143/143, 32 archivos**; `npm run build` pasó.

Los dos intentos iniciales de CI y el primer benchmark intermedio fallido se
conservan en `../performance/gate-a-polish/`. Las comparaciones CPU 4× del
snapshot anterior y del optimizado quedaron limitadas por vsync alrededor de
60 FPS: no demuestran una ganancia causal de FPS. Sí se verificó la reducción
de 35/36 a 28/29 llamadas de dibujo y la conservación de geometría/resolución.
El ensayo adicional CPU 8× registró 48,40/48,03 FPS en sol/lluvia; es laboratorio,
no una prueba en teléfono físico. El informe de rendimiento contiene las
mediciones finales y el estado de CI/despliegue.

Limitación explícita: el adaptador está diseñado para las luces actuales,
sin normal maps ni sombras en el perfil mínimo. Añadir otros tipos de luz a
ese perfil requiere ampliar pruebas y shader.
