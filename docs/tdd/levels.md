# Niveles / modos — 2026-10-23

Alcance: configuración JSON de El Virrey, validación y reglas del modo Paseo. Sin modos de fases futuras.

1. Rojo: `npm test -- tests/unit/levels.test.ts`, salida 1: `Cannot find module '../../src/levels'`. La API solicitada todavía no existía; prueba escrita antes de implementación.
2. Verde: mismo comando, salida 0, 22 pruebas pasando tras crear `parseLevel`, `LevelConfig`, `PASEO_RULES` y el JSON real.
3. Refactor: extraídos predicado de texto y expresión de rutas seguras; mismo comando, salida 0, 22 pruebas pasando.

Cobertura: JSON real, campos requeridos, longitudes 200..3000, semilla entera finita, rechazo de modos futuros, rutas absolutas, esquemas, traversal literal/codificado y barras invertidas. La salida es una copia validada del nivel.

Área: Niveles / Modos. Integración del simulador y changelog central coordinados por el Orquestador.
