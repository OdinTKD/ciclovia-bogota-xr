# Puerta A — conducción, contactos y primera persona

Fecha: 2026-10-23 (Bogotá). Estado: autorizada para ejecución; pendiente de validación y aceptación. Esta puerta no está completa y no constituye entrega de 0.3.0.

## Alcance autorizado

- Spike de controlador cinemático, conducción con orientación, contactos y bicicleta/manos procedurales en primera persona.
- Fragmento de calidad de 200 m dentro del recorrido final previsto de 1.200 m. La ruta sigue siendo inspirada en El Virrey; no se anuncia un levantamiento geográfico real.
- Preservar stack Vite/TypeScript/Three.js/Rapier, controles, aviso de seguridad, sol/lluvia, instrumentación y regresiones del MVP.
- B (actores reactivos) y C (arte, audio e interfaz) requieren aprobación posterior, salvo la ampliación visual expresamente añadida a A al final de este documento. No se implementan ni se descargan assets para las puertas no autorizadas.

## Decisiones y contratos

El spike cinemático tiene una ventana de 45 minutos desde las 17:28 UTC hasta las 18:13 UTC del 2026-10-23; equivalentes a 12:28–13:13 en Bogotá. La ventana limita la evaluación técnica; no certifica que el trabajo haya pasado sus criterios al terminar ese tiempo. Registrar el resultado y cualquier cambio de enfoque antes de ampliar alcance.

Conservar un único paso fijo de 1/60 s y autoridad de movimiento definida: input propone control, el controlador/física resuelve movimiento y contactos, y el render representa el estado. Las consultas no deben avanzar Rapier; pausa/reinicio deben limpiar acumuladores y estado de contacto. Introducir orientación y parámetros con unidades explícitas, sin reinterpretar el desplazamiento lateral anterior como velocidad angular.

Decisión de diseño ARCADE para la frenada: desde 8 m/s, detenerse en 4–5 m con sol y 6–7 m con lluvia. Son objetivos jugables acordados, no una afirmación de simulación física realista. Medir distancia y velocidad inicial con escenarios reproducibles. El contacto frontal debe distinguirse del roce lateral, permitir recuperación y evitar daño repetido por contacto persistente.

La bicicleta/manos de A se construyen proceduralmente. Revisar proporciones, pivotes, agarre, giro/freno, visibilidad de la vía y clipping; una prueba de proyección no sustituye la evaluación visual o en movimiento.

## Producción posterior y riesgos

El modelo final está planeado mediante Blender MCP. La herramienta está disponible, pero la conexión al servicio local en `localhost:9876` falló; disponibilidad de servicio, rig y materiales son riesgos abiertos. No afirmar que la integración Blender esté operativa. Un fallback con Blender scripting deberá acordarse posteriormente; no queda autorizado por esta nota.

Para B/C se reservan presupuestos orientativos de 4.000–5.000 triángulos por peatón y aproximadamente 6.000 por coche. Son objetivos de producción, no conteos medidos ni assets ya seleccionados. Registrar los conteos reales al integrarlos, dentro del presupuesto total de escena. No descargar esos recursos durante A.

Fuentes geográficas y licencia por verificar: [procedencia del tramo](../geodata/README.md).

## Evidencia y criterios de cierre

| Criterio | Evidencia requerida | Estado |
| --- | --- | --- |
| Reloj y autoridad de movimiento | [TDD motor/física](../tdd/gate-a-physics.md): paso único, consultas sin avance, replay 30/60/120 Hz | Verificado técnicamente en el mismo runtime |
| Orientación y ruta de 200 m | [TDD motor/física](../tdd/gate-a-physics.md): giro, llegada, reinicio y recorrido original | Verificado por pruebas |
| Frenada ARCADE | [Pruebas de controlador](../../tests/unit/bicycle-controller.test.ts): desde 8 m/s, 4–5 m sol, 6–7 m lluvia | Verificado automatizado; sensación física pendiente |
| Contactos | [TDD motor/física](../tdd/gate-a-physics.md): frontal/lateral, recuperación, cooldown y sólido delgado | Verificado en fixtures; aceptación pendiente |
| Bicicleta/manos | [Vídeo final](../../public/review/gate-a-driving.webm), [captura móvil](../screenshots/gate-a/after-mobile-bicycle.png), [TDD render](../tdd/gate-a-render.md) | Proxy procedural publicado; arte final no aprobado |
| Rendimiento antes/después | [Comparación local y CI](gate-a-review.md): series de 18 s, perfiles adaptativos y límites | Verificado en laboratorio; sin atribución causal aislada |
| Resolución efectiva | [JSON CI sol](../performance/gate-a/ci-40003117329-route-performance-sun.json) y [lluvia](../performance/gate-a/ci-40003117329-route-performance-rain.json) | Viewport/DPR/ratio/buffer registrados; mínimo 0,375 conservado |
| Regresiones e integración | [TDD integración](../tdd/gate-a-integration.md), [CI final](https://github.com/OdinTKD/ciclovia-bogota-xr/actions/runs/40003117329), [smoke público](../performance/gate-a/live-verification.json) | 100 unitarias; 14 E2E y 2 omitidas en CI; 10 funcionales públicas correctas |
| Teléfono físico | Modelo, OS y navegador reales; sesión de 10–15 minutos y dos diagnósticos | Expresamente aplazado por el usuario hasta disponer de datos reales; sin resultados de ejemplo |
| Aceptación | Revisión del resultado y autorización explícita antes de B/C o extensión del estándar | Pendiente |

Mantener los límites de 100 draw calls y 100.000 triángulos por frame y el objetivo de 30 fps en celular de gama media. No bajar silenciosamente resolución mínima ni relajar umbrales para pasar pruebas. Los resultados emulados no acreditan teléfono real; documentar claramente qué evidencia falta.

Guardar comandos, causas del rojo, resultados verdes y refactor en `docs/tdd/`, y mediciones/capturas/vídeo con revisión identificable, sin sobrescribir evidencia histórica. El responsable fijo de Documentación / Versionado consolida únicamente resultados comprobados. Al cerrar una tarea, añadir entrada SemVer al único `CHANGELOG.md`, con fecha Bogotá, cambios, validaciones, áreas y compatibilidad; no reescribir entradas anteriores ni anunciar la versión completa antes de cumplir el alcance aprobado.

## Continuación visual autorizada después de alpha.1

El usuario autorizó ampliar visualmente A con bicicleta/manos en Blender, materiales, vegetación, fachadas e iluminación, primero en una muestra de 25–50 m dentro de los 200 m. Requiere capturas reales y vídeo corto de giro/frenado, con validación visual separada del teléfono. Esta autorización no constituye aprobación del resultado, no abre B y no acredita arte producido. Las restricciones iniciales de C se mantienen para el alcance no incluido expresamente en esta ampliación. Registrar la mejora posterior en otra entrada de versión, solo con evidencia nueva.
