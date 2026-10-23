# Ciclovía Bogotá XR — reglas de desarrollo

Stack exclusivo: Vite + TypeScript + Three.js + Rapier + WebXR. Despliegue: GitHub Pages.

## Orquestación
- Inspeccionar estado y definir criterios verificables antes de implementar.
- Delegar por área: motor/física, vehículos, tráfico, niveles/modos, clima, UI/UX y AR/WebXR. Trabajar por tandas según los cupos y evitar edición simultánea del mismo archivo.
- Mantener un rol fijo de Documentación / Versionado y coordinar integración y QA desde el agente principal.

## TDD obligatorio
- Primero escribir la prueba del comportamiento y ejecutarla: debe fallar por la causa esperada (rojo).
- Implementar el mínimo y verificar verde. Refactorizar y ejecutar de nuevo.
- Guardar evidencia de comandos y resultados en docs/tdd/. Ningún comportamiento nuevo sin prueba automatizada.
- Documentación/configuración sin comportamiento: validar estructura, enlaces, esquema, build o smoke test; explicar cuando no aplica prueba ejecutable.

## Documentación y versiones
- Un único CHANGELOG.md en raíz, append-only salvo corrección explícitamente solicitada por el usuario.
- Cada cierre registra fecha Bogotá, SemVer, cambios, comandos/resultados reales, áreas/agentes y compatibilidad.
- No declarar terminado con pruebas fallidas, requisitos pendientes o despliegue sin verificar.
- Registrar dependencias y recursos en THIRD_PARTY_NOTICES.md. Leer las licencias antes de reutilizar; no copiar código de licencia desconocida.
- Modelos externos solo CC0 o licencia permisiva, con atribución individual. Preferir geometría procedural original para el MVP.

## Producto y seguridad
- Textos de humor editables en public/config/humor/, sin discriminación y desactivables.
- Aviso inicial: jugar quieto, en un lugar seguro; nunca mientras se conduce, camina o pedalea realmente.
- AR requiere detección de capacidades, hit-test y fallback; nunca declarar probado en hardware a partir de mocks.
- Presupuesto por frame: máximo 100 draw calls y 100 000 triángulos; objetivo mínimo 30 fps en celular gama media. Verificar contadores reales y rendimiento en navegador; distinguir laboratorio de dispositivo real.
