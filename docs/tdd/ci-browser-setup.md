# Preparación del navegador en CI

Fecha: 2026-10-23, Bogotá. Área: Integración / DevOps.

## Motivo comprobado

El [run 40012579137](https://github.com/OdinTKD/ciclovia-bogota-xr/actions/runs/40012579137) dedicó **11 min 48 s** al paso `npx playwright install --with-deps chromium`: comenzó a las 19:37:07 UTC y terminó a las 19:48:55 UTC, según los timestamps de su API de jobs. La instalación terminó correctamente; el fallo posterior del run correspondió a una prueba de rendimiento, no a dependencias ausentes.

El registro de instalación revisado por el orquestador mostró que la descarga del navegador tomó aproximadamente 10 s y que apt dominó el tiempo restante. La estrategia siguiente evita repetir esa instalación apt cuando las bibliotecas ya están presentes en la imagen. No se afirma que el cambio de instalación resuelva el fallo de FPS.

## Cambio acotado

- Los jobs `verify` y `deploy` usan `ubuntu-24.04` explícitamente.
- Se descarga el Chromium correspondiente al Playwright fijado por `package-lock.json` mediante `npx playwright install chromium`.
- Se conservan `npm ci`, todas las pruebas unitarias, build, toda la suite E2E, artefactos y la dependencia `deploy → verify`.
- No se configura `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS`, `continue-on-error`, un navegador de sistema alternativo ni excepciones a los umbrales.

## Fundamento y límites

La [imagen oficial Ubuntu 24.04](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md) incluye Chrome y Chromium. Su [script de construcción](https://github.com/actions/runner-images/blob/main/images/ubuntu/scripts/build/install-google-chrome.sh) instala Chrome mediante apt, resolviendo sus dependencias. El [toolset oficial](https://github.com/actions/runner-images/blob/main/images/ubuntu/toolsets/toolset-2404.json) incluye `xvfb` y fuentes Noto emoji. Esto sustenta reutilizar las bibliotecas existentes; no constituye una garantía de compatibilidad de cualquier revisión futura.

Playwright documenta por separado [instalación del navegador y de dependencias del sistema](https://playwright.dev/docs/browsers#install-system-dependencies). `--with-deps` combina ambas operaciones. Fijar Ubuntu 24.04 evita además la migración anunciada de `ubuntu-latest` a Ubuntu 26.04 en noviembre de 2026; la imagen 24.04 continúa recibiendo actualizaciones.

La validación de dependencias propia de Playwright permanece activa y las pruebas deben fallar si Chromium no puede iniciar. Si el siguiente run informa bibliotecas ausentes, se revisará ese diagnóstico antes de instalar lo necesario. Ningún fallo se convertirá en éxito por omisión.

## Validación

**No aplica prueba ejecutable de comportamiento del juego:** solo cambian tres líneas de configuración del entorno de CI. Se realiza comparación estructural exacta contra la versión previa y comprobación de whitespace. Deben permanecer intactos todos los comandos y las condiciones del pipeline salvo los dos nombres de imagen y el comando de instalación indicado.

Validación local ejecutada:

- `node --input-type=module`: script con `node:assert/strict` que leyó `git show HEAD:.github/workflows/deploy.yml`, aplicó únicamente las tres sustituciones autorizadas y comparó el resultado completo con el archivo actual. Además verificó los cuatro comandos de validación, la subida de artefactos, `needs: verify` y la ausencia de excepciones de error o validación de dependencias. Resultado: **PASS**.
- `git diff --check -- .github/workflows/deploy.yml docs/tdd/ci-browser-setup.md`: correcto, sin errores de whitespace. Git solo advirtió de normalización LF/CRLF.
- `git diff -- .github/workflows/deploy.yml`: exactamente tres líneas modificadas, correspondientes a las dos imágenes y al comando de descarga.

La ejecución Linux de esta configuración y su desempeño siguen **pendientes del próximo run de CI**; este documento no los declara aprobados. No se hizo commit, push ni cancelación de workflows desde este subagente.
