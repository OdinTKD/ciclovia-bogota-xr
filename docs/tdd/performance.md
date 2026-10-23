# Presupuesto de rendimiento

- Rojo: `npx vitest run tests/unit/performance.test.ts` — exit 1, módulo `src/core/performance` todavía inexistente.
- Implementación: límites 100 draw calls, 100 000 triángulos y 30 fps; estadísticas de frames reales y percentil 95.
- Las pruebas de navegador medirán la escena real; no constituyen certificación de un teléfono físico.

- Verde: 3 pruebas de límites y estadísticas pasan. Refactor: formato y extracción de estadísticas reutilizables; suite final 54/54 verde.
- Navegador final: npm run test:e2e, 5 pasan y 1 omitida intencional (presupuesto solo móvil). Pixel 7 emulado, CPU 4x: sol 35.41 fps / 26 draw calls / 16518 triángulos; lluvia 35.64 fps / 27 / 18438. 180 muestras por clima, p95 33.4 ms. Resultados en docs/performance/local-*.json. No es prueba de teléfono físico.

