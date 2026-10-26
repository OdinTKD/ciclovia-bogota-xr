# Preparación del perfil final — 2026-10-26

Área: Orquestación / motor y QA. No cambia física, arte, umbrales ni muestreo jugando.

## Rojo

`npx vitest run tests/unit/renderer-calibration.test.ts`, 10:28 Bogotá: 2 pasan, 1 falla.
La prueba reproduce un equipo lento en ratio 1,5 que selecciona 0,75: solo se
renderizaba **un frame** en el perfil elegido antes de habilitar el inicio, frente
a la ventana completa de 12 exigida. Fallo: `expected [0.75] to have a length of
12 but got 1`.

## Verde

10:28 Bogotá, mismo comando: 3/3 pasan. El mínimo de resolución deja de terminar
prematuramente la preparación; se mantiene el límite de dos ventanas. Una máquina
que conserva calidad alta sigue usando 12 frames; una que baja al mínimo prepara
24 en total. Se actualiza la expectativa anterior de 13 a 24 para ese caso.

## Refactor y límites

Se elimina el import sin uso y se documenta la diferencia entre alcanzar el suelo
de resolución y preparar ese perfil. Esta preparación ocurre en la pantalla de
carga: no descarta, reinicia ni altera intervalos de la partida. Su coste adicional
es de 11 frames de carga en equipos que bajan de calidad. La prueba funcional
comprueba el contrato de arranque; no demuestra por sí misma una ganancia de FPS.
El resultado integrado y CI se registran en el informe de rendimiento.
