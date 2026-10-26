# Presupuesto de rendimiento desde el primer frame jugable

2026-10-26, Bogotá. Orquestador / QA.

## Regresión de la medición

La prueba corta leía el HUD diagnóstico, que resume una ventana móvil de
180 frames. Una pausa larga al arrancar podía salir de esa ventana antes de la
aserción. El objetivo sigue siendo 30 FPS de media, con máximo 100 llamadas,
100.000 triángulos y ratio interno mínimo 0,75; no se cambia CPU 4×, viewport
Pixel 7, duración de 5 segundos ni configuración de Chromium.

Ahora la prueba pausa y descarga el informe de sesión. Usa todos los frames
jugables del clima, verifica que el registro no esté truncado y comprueba el
mínimo de todas las resoluciones registradas. Los máximos de geometría y llamadas
también proceden del registro completo. La medición no excluye frames iniciales.

## Rojo

Con el build publicado `cf13553`, el contrato reforzado falla en sol:
17,792901 FPS, 137 muestras y frame máximo 2116,6 ms. La traza del arranque
identifica compilación diferida de WebAssembly durante el primer paso de Rapier.

- Comando: `npx playwright test tests/e2e/performance.spec.ts tests/e2e/route-performance.spec.ts --project=mobile`, con `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4185/`.
- [Resultado preservado](../performance/gate-a-polish/cold-start-red/performance-sun.json).
- [Perfil del defecto](../performance/start-diagnostic/analysis.json).
- [Preparación física y su ciclo TDD](physics-preparation.md).

## Resultado intermedio, todavía rojo

Preparar un mundo físico desechable antes de crear el mundo de la partida
elimina la pausa de varios segundos: la misma prueba da 29,910087 FPS,
164 muestras y máximo 183,3 ms. **Sigue fallando el objetivo de 30 FPS**.
La prueba larga pasó en ambos climas. No se redondea ni se descarta esta muestra.

- [Corto sol](../performance/gate-a-polish/cold-start-prepared-only/performance-sun.json).
- [Recorrido sol](../performance/gate-a-polish/cold-start-prepared-only/route-performance-sun.json).
- [Recorrido lluvia](../performance/gate-a-polish/cold-start-prepared-only/route-performance-rain.json).

## Verde y refactor integrados

El [filtro conservador](physics-broadphase.md) elimina consultas claramente
separadas y conserva las consultas cercanas de la preparación desechable. No
cambia los umbrales ni el detalle visual. A las 11:11:34 Bogotá:

```text
npm test
Test Files 35 passed (35)
Tests 167 passed (167)
npm run build
tsc --noEmit y Vite correctos; index-B8FhDTAS.js
```

Después, el mismo comando E2E reforzado pasó **2/2** en 1,2 minutos, sin otro
navegador de pruebas concurrente. Resultados conservados en
[cold-start-final-local](../performance/gate-a-polish/cold-start-final-local/):

| Prueba local, CPU 4× | Sol | Lluvia |
| --- | ---: | ---: |
| Sesión inicial completa por clima, 5 s | 33,314314 FPS | 30,000932 FPS |
| Tramo medido en movimiento, 18 s | 39,650411 FPS | 38,576821 FPS |
| Calls máximas | 28 | 29 |
| Triángulos máximos | 29.048 | 30.968 |

Buffer 309×629, CSS 412×839, ratio 0,75 en todas las muestras. La lluvia corta
pasa por un margen muy pequeño; no se presenta como holgura ni se repite para
escoger un resultado más alto. El tramo de 18 s alcanza aproximadamente 139 m;
la llegada a 200 m y el segundo encuentro se verifican por separado en el vídeo
y en las pruebas funcionales. Promedios no garantizan 30 FPS en cada frame ni
certifican teléfono físico.

El refactor del filtro conserva sus pruebas, los 167 tests integrados y los
dos presupuestos E2E. La prueba de medición se reorganizó para compartir pausa
y exportación por clima; las aserciones conservan todos los frames. CI y smoke
público finales se registran en el informe de rendimiento.

## Verificación independiente y publicación

La [CI 40357178802](https://github.com/OdinTKD/ciclovia-bogota-xr/actions/runs/40357178802)
del commit `d247ee8` pasó 167 pruebas de Vitest, build y 25 E2E (3 omisiones
de variantes redundantes). Despliegue correcto. El corto completo dio
41,193289 FPS en sol y 55,034301 en lluvia; el tramo de 18 s, 53,619005 y
52,952931. Contadores y resolución conservan los mismos límites.

El smoke público de 16:22:13 UTC comprobó versión, nombre y SHA-256 del bundle
idénticos al build local, GLB y mapas, imágenes y vídeos, sin errores. Ver
[resultados CI](../performance/gate-a-polish/ci-physics-final/),
[estado](../performance/gate-a-polish/ci-physics-final-status.json) y
[publicación](../performance/gate-a-polish/live-verification.json).

El éxito remoto no sustituye ni oculta el estrecho margen de lluvia local.
Son dos entornos de laboratorio; la prueba en teléfono continúa aplazada.
