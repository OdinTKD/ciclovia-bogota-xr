// Reproduce the three runtime maps from the licensed originals in source/.
// Usage: node assets/environment-alpha3/prepare-textures.mjs [absolute sharp module path]
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const sharp = require(process.argv[2] ?? 'sharp');
const input = fileURLToPath(new URL('./source/', import.meta.url));
const output = fileURLToPath(new URL('../../public/assets/environment-alpha3/', import.meta.url));
await sharp(input + 'brick-red-source.jpg').resize(512, 512).jpeg({ quality: 86 }).toFile(output + 'brick-red.jpg');
await sharp(input + 'bark-source.jpg').resize(512, 512).jpeg({ quality: 86 }).toFile(output + 'bark.jpg');
const crop = { left: 557, top: 431, width: 158, height: 111 };
const alpha = await sharp(input + 'leaves-alpha-source.png').extract(crop).resize(128, 96).extractChannel(0).raw().toBuffer();
// Keep the main connected silhouette; crop corners also contained neighbouring atlas stems.
const visited = new Uint8Array(alpha.length);
let largest = [];
for (let start = 0; start < alpha.length; start++) {
  if (visited[start] || alpha[start] < 32) continue;
  const component = [start]; visited[start] = 1;
  for (let cursor = 0; cursor < component.length; cursor++) {
    const point = component[cursor], x = point % 128, y = Math.floor(point / 128);
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < 0 || nx >= 128 || ny < 0 || ny >= 96) continue;
      const next = ny * 128 + nx;
      if (!visited[next] && alpha[next] >= 32) { visited[next] = 1; component.push(next); }
    }
  }
  if (component.length > largest.length) largest = component;
}
const silhouette = new Set(largest);
for (let i = 0; i < alpha.length; i++) {
  const x = (i % 128 - 65) / 58, y = (Math.floor(i / 128) - 45) / 35;
  // Atlas stems may touch the leaf silhouette; retain the oval leaf, not those attached neighbours.
  if (!silhouette.has(i) || x * x + y * y > 1) alpha[i] = 0;
}
// Separate pipelines: removeAlpha in the same pipeline would remove the newly joined alpha too.
const rgb = await sharp(input + 'leaves-source.png').extract(crop).resize(128, 96).removeAlpha().raw().toBuffer();
const cutout = await sharp(rgb, { raw: { width: 128, height: 96, channels: 3 } })
  .joinChannel(alpha, { raw: { width: 128, height: 96, channels: 1 } }).png().toBuffer();

// Original seven-leaf twig layout from the same licensed photograph. Same 128×96 texture budget.
// Each leaf occupies at most 32/128 of a 0.70 m card: <20 cm at the largest instance scale.
const layout = [
  { x: 25, y: 30, angle: -33 }, { x: 40, y: 66, angle: 31 },
  { x: 56, y: 24, angle: -40 }, { x: 71, y: 66, angle: 37 },
  { x: 86, y: 25, angle: -32 }, { x: 99, y: 61, angle: 25 },
  { x: 112, y: 39, angle: -10 },
];
const stem = Buffer.alloc(128 * 96 * 4);
function line(x0, y0, x1, y1) {
  const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(x0 + (x1 - x0) * i / steps), y = Math.round(y0 + (y1 - y0) * i / steps);
    if (x >= 0 && x < 128 && y >= 0 && y < 96) stem.set([93, 99, 51, 255], (y * 128 + x) * 4);
  }
}
// The support geometry samples the atlas centre, so its connected stem must pass through it.
line(0, 48, 119, 48);
const layers = [];
for (const [index, leaf] of layout.entries()) {
  line(Math.max(0, leaf.x - 12), 48, leaf.x, leaf.y);
  const { data, info } = await sharp(cutout).resize(index === 6 ? 28 : 32, 20).rotate(leaf.angle, { background: '#00000000' }).png().toBuffer({ resolveWithObject: true });
  layers.push({ input: data, left: Math.min(128 - info.width, Math.round(leaf.x - info.width / 2)), top: Math.round(leaf.y - info.height / 2) });
}
await sharp(stem, { raw: { width: 128, height: 96, channels: 4 } }).composite(layers).png().toFile(output + 'leaf.png');
