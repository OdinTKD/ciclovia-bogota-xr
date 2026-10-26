# Avisos de terceros

Revisión actualizada: 2026-10-26. Las referencias iniciales aportan ideas generales; no se copió código, escenas ni recursos de esos repositorios. La geometría es original del proyecto. El candidato de pulido alpha.3 incorpora tres mapas derivados de recursos CC0 de Poly Haven, identificados abajo; no se incorporaron modelos de terceros, audio o fuentes externas.

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

## Base procedural original alpha.2 y modelo original actual

La base alpha.2 del entorno de 40 m usaba geometría y texturas originales generadas por fórmulas deterministas: asfalto, ladrillo, concreto, adoquín, corteza, hoja y césped. Su procedencia histórica está en [evidencia del entorno](docs/tdd/art-slice.md) y [alcance alpha.2](docs/architecture/gate-a-art.md). El pulido alpha.3 reemplaza tres mapas de ladrillo, corteza y hojas por los derivados CC0 de Poly Haven registrados abajo; no se copian imágenes o assets de Def Jam. La geometría y superficies restantes siguen siendo originales y no certifican geografía real de El Virrey.

La bicicleta/manos se produjo como geometría, colores y materiales originales del proyecto en Blender 5.1.2, sin modelos, texturas, fuentes o audio externos según su [manifest de procedencia](public/assets/models/bicycle-rider.manifest.json). Se conservan [fuente editable .blend](assets/source/bicycle/bicycle-rider.blend), [script](tools/assets/build-bicycle.py) y [GLB](public/assets/models/bicycle-rider.glb). Artefacto actual de pulido alpha.3 comprobado: 274.308 bytes, 10.516 triángulos, 11 llamadas geométricas y 4 materiales; SHA-256 `da687736d4eb1ca22124a2242a20af6c1623f92c62da30006c710ff83a35cc85`. Los datos alpha.2 permanecen en su entrada histórica; la aceptación artística del archivo actual sigue pendiente del usuario. El alcance visual mantiene los conteos y límites; comprobar integridad del artefacto no certifica por sí solo acabado o rendimiento.

Esta nota no asigna una licencia nueva a los originales del proyecto ni anuncia modelos externos licenciados o descargados. Blender se utiliza como herramienta de producción local; no se distribuye como runtime del juego.

## Mapas CC0 incorporados al candidato alpha.3

Licencia leída el 2026-10-23 en la [página oficial de Poly Haven](https://polyhaven.com/license): sus assets se ofrecen bajo CC0 1.0. Se usan únicamente los archivos seleccionados, no imágenes de presentación ni contenido ajeno a los assets. Crédito voluntario y trazabilidad:

| Recurso / autores | Uso y adaptación | Archivo del juego |
| --- | --- | --- |
| [Brick Wall 001](https://polyhaven.com/a/brick_wall_001), Dimitrios Savva y Rob Tuytel | Color 1K → JPEG 512×512, calidad 86, sRGB; repetición del runtime actual 8×9 en fachadas (revisión y manifest actualizados el 2026-10-26) | [brick-red.jpg](public/assets/environment-alpha3/brick-red.jpg), 69.809 bytes |
| [Bark Brown 02](https://polyhaven.com/a/bark_brown_02), Rob Tuytel | Color 1K → JPEG 512×512, calidad 86, sRGB, repetición 1×3 | [bark.jpg](public/assets/environment-alpha3/bark.jpg), 94.319 bytes |
| [Tree Small 02](https://polyhaven.com/a/tree_small_02), Rico Cilliers | Solo mapas de hojas color/alpha; recorte x557/y431 de 158×111, composición de siete hojas fotográficas rotadas y tallos originales en atlas RGBA 128×96 (adaptación 2026-10-26) | [leaf.png](public/assets/environment-alpha3/leaf.png), 9.843 bytes |

Total transferible de estos mapas: 173.971 bytes. No se incorpora geometría del modelo Tree Small 02: ramas, brotes, árboles y fachadas son originales. El [manifest](assets/environment-alpha3/manifest.json) conserva autores, URLs exactas, licencia, transformaciones, tamaños y SHA-256 de cuatro archivos originales y tres derivados. Los siete archivos se contrastaron con sus hashes y tamaños; originales en `assets/environment-alpha3/source/`, derivados en `public/assets/environment-alpha3/`. El [script de adaptación](assets/environment-alpha3/prepare-textures.mjs) conserva recorte, redimensionado y composición alpha. No se usaron recursos de ambientCG ni geometría de Quaternius en esta iteración. Esta procedencia no certifica calidad visual ni rendimiento integrado.

Adaptación del 2026-10-26: atlas de hojas actual de 9.843 bytes, SHA-256 `636928c8b1ccd004a112c401a3814d07d6730ee4ca88db7531ca0bd6e648f83f`. El manifest conserva previousOutput y el PNG previo fuera de public. La licencia CC0 y los originales descargados no cambian; geometría del árbol sigue original. Los mipmaps con cobertura alpha se comparten entre LOD; memoria de la cadena actual 65.532 bytes, distinta del tamaño comprimido transferido.
