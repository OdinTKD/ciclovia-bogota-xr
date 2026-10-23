# Avisos de terceros

Revisión: 2026-10-23. Las referencias iniciales aportan ideas generales; no se copió código, escenas ni recursos de esos repositorios. La geometría es original del proyecto. El candidato de pulido alpha.3 incorpora tres mapas derivados de recursos CC0 de Poly Haven, identificados abajo; no se incorporaron modelos de terceros, audio o fuentes externas.

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

## Producción original — ampliación visual de A en curso

El entorno de 40 m de `src/rendering/art-slice.ts` utiliza geometría y texturas originales generadas por fórmulas deterministas: asfalto, ladrillo, concreto, adoquín, corteza, hoja y césped. La procedencia está documentada en [evidencia del entorno](docs/tdd/art-slice.md) y [alcance visual](docs/architecture/gate-a-art.md). No incorpora fotografías, mapas de textura descargados ni imágenes o assets de Def Jam; la referencia artística no es una fuente de material reutilizado. Representa una interpretación visual, sin certificar geografía real de El Virrey.

La bicicleta/manos se produjo como geometría, colores y materiales originales del proyecto en Blender 5.1.2, sin modelos, texturas, fuentes o audio externos según su [manifest de procedencia](public/assets/models/bicycle-rider.manifest.json). Se conservan [fuente editable .blend](assets/source/bicycle/bicycle-rider.blend), [script](tools/assets/build-bicycle.py) y [GLB](public/assets/models/bicycle-rider.glb). Artefacto actual de pulido alpha.3 comprobado: 274.308 bytes, 10.516 triángulos, 11 llamadas geométricas y 4 materiales; SHA-256 `da687736d4eb1ca22124a2242a20af6c1623f92c62da30006c710ff83a35cc85`. Los datos del modelo alpha.2 permanecen en su entrada histórica del changelog; el archivo actual es el candidato nuevo y todavía requiere QA y aceptación final. El alcance visual mantiene los conteos y límites de integración; la existencia del modelo no certifica calidad artística o rendimiento.

Esta nota no asigna una licencia nueva a los originales del proyecto ni anuncia modelos externos licenciados o descargados. Blender se utiliza como herramienta de producción local; no se distribuye como runtime del juego.

## Mapas CC0 incorporados al candidato alpha.3

Licencia leída el 2026-10-23 en la [página oficial de Poly Haven](https://polyhaven.com/license): sus assets se ofrecen bajo CC0 1.0. Se usan únicamente los archivos seleccionados, no imágenes de presentación ni contenido ajeno a los assets. Crédito voluntario y trazabilidad:

| Recurso / autores | Uso y adaptación | Archivo del juego |
| --- | --- | --- |
| [Brick Wall 001](https://polyhaven.com/a/brick_wall_001), Dimitrios Savva y Rob Tuytel | Color 1K → JPEG 512×512, calidad 86, sRGB, repetición 3×3 en fachadas | [brick-red.jpg](public/assets/environment-alpha3/brick-red.jpg), 69.809 bytes |
| [Bark Brown 02](https://polyhaven.com/a/bark_brown_02), Rob Tuytel | Color 1K → JPEG 512×512, calidad 86, sRGB, repetición 1×3 | [bark.jpg](public/assets/environment-alpha3/bark.jpg), 94.319 bytes |
| [Tree Small 02](https://polyhaven.com/a/tree_small_02), Rico Cilliers | Solo mapas de hojas color/alpha; recorte x557/y431 de 158×111 → RGBA 128×96 | [leaf.png](public/assets/environment-alpha3/leaf.png), 20.881 bytes |

Total transferible de estos mapas: 185.009 bytes. No se incorpora geometría del modelo Tree Small 02: ramas, brotes, árboles y fachadas son originales. El [manifest](assets/environment-alpha3/manifest.json) conserva autores, URLs exactas, licencia, transformaciones, tamaños y SHA-256 de cuatro archivos originales y tres derivados. Los siete archivos se contrastaron con sus hashes y tamaños; originales en `assets/environment-alpha3/source/`, derivados en `public/assets/environment-alpha3/`. El [script de adaptación](assets/environment-alpha3/prepare-textures.mjs) conserva recorte, redimensionado y composición alpha. No se usaron recursos de ambientCG ni geometría de Quaternius en esta iteración. Esta procedencia no certifica calidad visual ni rendimiento integrado.
