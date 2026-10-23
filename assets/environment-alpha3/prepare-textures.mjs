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
await sharp(rgb, { raw: { width: 128, height: 96, channels: 3 } })
  .joinChannel(alpha, { raw: { width: 128, height: 96, channels: 1 } }).png().toFile(output + 'leaf.png');
