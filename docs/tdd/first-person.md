# Regresión cámara primera persona

- Inspección de captura móvil reveló que el manillar quedaba fuera del encuadre.
- Rojo: `npx vitest run tests/unit/first-person.test.ts` — 1 falla, NDC Y -1.273 fuera del campo visible.
- Corrección: subir el grupo de bici y adelantarlo dentro del frustum; la misma prueba exige manillar visible también en formato vertical.

- Verde: misma prueba 1/1 aprobada. Refactor: formato de código uniforme conservando proyección. Suite final 54/54 y E2E 5 aprobados; capturas de escritorio/móvil revisadas y guardadas en docs/screenshots/.

