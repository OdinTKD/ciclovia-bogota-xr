# Tráfico / IA — evidencia TDD

Fecha: 2026-10-23, Bogotá. Área: enemigos / IA de tráfico.

## Rojo

Primero se escribió `tests/unit/traffic.test.ts` con cinco pruebas y se ejecutó
`npm test -- tests/unit/traffic.test.ts`.

- 10:51:01: suite falló porque todavía no existía `src/traffic`.
- Se creó únicamente el contrato provisional con funciones que lanzaban
  `Tráfico pendiente de implementar` y se agregó el JSON de datos.
- 10:51:18: **5 pruebas fallidas**, todas por el comportamiento todavía pendiente.

## Verde

Se implementaron el parser de configuración, activación por proximidad,
movimiento transversal integrado por tiempo, desactivación al terminar el cruce
o quedar detrás del jugador, pausa con dt=0 y reinicio reproducible.

`npm test -- tests/unit/traffic.test.ts`, 10:51:44: **5 pruebas aprobadas**.

## Refactor

Se extrajo `markPassed` para centralizar la transición de estado final y evitar
duplicación en las dos causas de desactivación.

- `npm test -- tests/unit/traffic.test.ts`, 10:51:52: **5 pruebas aprobadas**.
- `npm run check`: **TypeScript sin errores**, código de salida 0.

## Cobertura y límites

Pruebas: lectura de JSON real con ambos retos; activación anticipada; dirección
de carro y peatón; integración proporcional a dt; congelación con dt=0;
snapshots sin mutación externa; reproducción de semilla y reset; finalización;
rechazo de JSON inválido y valores de actualización inválidos.

Diez retos desde 110 hasta 1170 m, separados al menos 110 m. El primer carro
activa a 40 m y parte a x=8: hay tiempo de reacción y espacio para frenar o
esquivar. La integración visual y física se valida adicionalmente por el
Orquestador; esta suite cubre reglas deterministas independientes de WebGL.
