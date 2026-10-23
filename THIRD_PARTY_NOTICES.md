# Avisos de terceros

Revisión: 2026-10-23. Las referencias aportan ideas generales; no se copió código, escenas ni recursos de esos repositorios. Los assets del MVP son geometrías originales procedurales; no se incorporaron modelos, texturas, audio ni fuentes externas.

## Referencias consultadas

Se leyeron los textos LICENSE reales y se conservaron en copias locales. Los enlaces fijan el commit consultado.

| Repositorio | Commit SHA | Licencia y copia local |
| --- | --- | --- |
| [CollinEMac/open-runner](https://github.com/CollinEMac/open-runner/blob/6585be5664bf8008871c9a53cc4b05b80ae645c6/LICENSE) | `6585be5664bf8008871c9a53cc4b05b80ae645c6` | MIT; copyright 2023–2024 Open Runner Contributors; [LICENSE](docs/licenses/open-runner-LICENSE.txt) |
| [smarlify/traffic-run-game](https://github.com/smarlify/traffic-run-game/blob/971445e4fc2c9e1c294658128e026f527046b7f5/LICENSE.txt) | `971445e4fc2c9e1c294658128e026f527046b7f5` | MIT; copyright 2025 David Nekovář; [LICENSE](docs/licenses/traffic-run-game-LICENSE.txt) |
| [meta-quest/webxr-first-steps](https://github.com/meta-quest/webxr-first-steps/blob/49ecf80116d6eaf0f3722d8001f3e29ffe81cbae/LICENSE) | `49ecf80116d6eaf0f3722d8001f3e29ffe81cbae` | MIT; copyright Meta Platforms, Inc. and affiliates; [LICENSE](docs/licenses/webxr-first-steps-LICENSE.txt) |

Conservar estas licencias identifica la referencia consultada; no implica colaboración ni respaldo de sus autores.

## Dependencias npm

Versiones procedentes de `package-lock.json` y de los paquetes físicamente instalados. Se conservaron completos los archivos LICENSE/NOTICE disponibles, incluidos avisos de código integrado por sus proveedores.

| Dependencia directa | Versión instalada | Licencia declarada |
| --- | --- | --- |
| Three.js | 0.186.1 | MIT |
| @dimforge/rapier3d-compat | 0.21.0 | Apache-2.0 |
| Vite | 8.3.5 | MIT |
| TypeScript | 7.0.2 | Apache-2.0 |
| Vitest | 5.0.5 | MIT |
| @playwright/test | 1.64.1 | Apache-2.0 |
| @types/node | 26.6.5 | MIT |
| @types/three | 0.186.0 | MIT |
| @types/webxr | 0.5.24 | MIT |

El [inventario completo](docs/licenses/npm-inventory.md) incluye dependencias transitivas y herramientas de desarrollo, con copias locales de licencias; también hay [inventario JSON](docs/licenses/npm-inventory.json). Lightning CSS, herramienta transitiva de compilación, declara MPL-2.0; no se modificó su código. `@rolldown/binding-win32-x64-msvc` declara MIT en su manifiesto pero no incluye LICENSE propio; se conserva la [licencia de Rolldown](docs/licenses/npm/rolldown/LICENSE) del mismo proyecto y versión.

Conservar estos avisos y las licencias aplicables al distribuir artefactos. Antes de incorporar nuevos assets o código, revisar y registrar su origen y licencia individualmente.

Las copias runtime [Three.js MIT](public/licenses/three-MIT.txt) y [Rapier Apache-2.0](public/licenses/rapier-Apache-2.0.txt) están en `public/licenses/`; Vite las conserva en `dist/licenses/` para la distribución web.
