
## UI/UX y escena — 2026-10-23

- Rojo: `npm test -- tests/unit/ui.test.ts` terminó exit 1: no existía `src/ui/model`, el contrato de formato/seguridad y escena estaba ausente.
- Verde: tras implementar helpers puros y geometría original, el mismo comando pasó 4 pruebas. Incluye conversión de velocidad, distancia/progreso, confirmación de seguridad y recorrido de las geometrías reales/instancias para verificar máximo 100 draw calls estimadas y 100 000 triángulos.
- Refactor: cachear colores/clima y concentrar la escritura de matrices de tráfico en un helper evita asignaciones visuales por frame; se repiten pruebas y TypeScript.
- `npm run check`: exit 0 antes del refactor. Se reportan comandos finales al coordinador.
- La prueba estructural no demuestra FPS del dispositivo real; los contadores WebGL y rendimiento medidos en navegador se verifican en integración por el Orquestador.
- Resultado final del refactor: `npm test -- tests/unit/ui.test.ts` 4/4 verdes; `npm run check` exit 0. data-testid incorporados al contrato de integración UI.

## Regresión: ajustes accesibles en pausa — 2026-10-23

- Rojo registrado por el Orquestador: `npx playwright test --project desktop --grep seguridad` falló por timeout al seleccionar `weather`, oculto dentro del menú inicial.
- Verde: conservar un único nodo `.settings`, moverlo al panel de pausa/fin y devolverlo delante del aviso de seguridad al volver al menú. Mismo comando E2E: 1/1 pasó, 7.5 s.
- Refactor: se conserva la identidad de los controles y sus listeners; no hay IDs duplicados. Colores de cielo cacheados y helper de matrices permanecen.
- Revalidación: `npm test -- tests/unit/ui.test.ts` 4/4 verdes; `npm run check` exit 0.
- Se elimina importación remota de fuentes; el diseño usa fallbacks instalados. Menú informa AR próxima fase. Fin con salud 0 explica la colisión. Geometría del carro se orienta transversal al carril para coincidir con el volumen físico.
