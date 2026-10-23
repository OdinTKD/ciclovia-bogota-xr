# Clima — evidencia TDD (2026-10-23, Bogotá)

Área: Clima. Archivos: `src/weather/index.ts`, `tests/unit/weather.test.ts`.

## Rojo

Primero se escribió la prueba y se ejecutó `npm test -- tests/unit/weather.test.ts`.
Resultado real: exit 1, una suite fallida; `Cannot find module '../../src/weather'`.
Causa esperada: el módulo de perfiles climáticos aún no existía.

## Verde

Se implementaron `parseWeather` y `weatherProfile` para sol/lluvia exclusivamente.
Se ejecutó `npm test -- tests/unit/weather.test.ts`.
Resultado real: exit 0, 1 archivo y 3 pruebas pasando.

## Refactor

Se sustituyeron las ramas de perfiles por una tabla tipada; cada consulta devuelve
una copia para evitar que consumidores alteren los perfiles compartidos.
Se ejecutó nuevamente `npm test -- tests/unit/weather.test.ts`.
Resultado real: exit 0, 1 archivo y 3 pruebas pasando.

## Contrato de integración

`weatherProfile('sun' | 'rain')` devuelve `{ grip, braking, visibility, label }`.
Sol: `{ 1, 7, 220, 'Sol' }`; lluvia: `{ 0.6, 4.8, 115, 'Lluvia' }`.
`parseWeather(unknown)` acepta únicamente los dos valores; otros lanzan
`Clima no disponible`.
El orquestador integrará `grip` y `braking` en la simulación y `visibility` en
la distancia final de niebla del renderizador. No se editaron esos archivos.
