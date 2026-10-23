import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4182/';
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = []; page.on('pageerror', error => errors.push(error.message));
try {
  const response = await page.goto(base);
  assert.equal(response.status(), 200);
  await page.waitForFunction(() => window.__game?.ready);
  const game = await page.evaluate(() => window.__game);
  assert.equal(game.assets.source, 'blender-glb'); assert.equal(game.assets.triangles, 7120);
  assert.equal(game.artSlice.end, 40); assert.equal(game.routeLength, 200);
  const model = await page.request.get(new URL('assets/models/bicycle-rider.glb', base).href);
  const manifest = JSON.parse(await readFile('public/assets/models/bicycle-rider.manifest.json', 'utf8'));
  assert.equal(createHash('sha256').update(await model.body()).digest('hex'), manifest.sha256);
  await page.getByTestId('safety').check(); await page.getByTestId('start').click();
  await page.locator('canvas').click({ position: { x: 500, y: 300 } });
  await page.keyboard.down('w'); await page.waitForFunction(() => window.__game.state.speed > 2); await page.keyboard.up('w');
  await page.getByTestId('pause').click();
  const downloading = page.waitForEvent('download'); await page.getByTestId('download-report').click();
  const chunks = []; for await (const chunk of await (await downloading).createReadStream()) chunks.push(chunk);
  const diagnostic = JSON.parse(Buffer.concat(chunks).toString());
  assert.equal(diagnostic.version, '0.3.0-alpha.2');
  assert.ok(['pbr', 'diffuse'].includes(diagnostic.render.materialQuality));
  const gallery = await page.goto(new URL('review/art/index.html', base).href); assert.equal(gallery.status(), 200);
  await page.locator('video').evaluate(video => { video.preload = 'metadata'; video.load(); });
  await page.waitForFunction(() => document.querySelector('video').readyState >= 1);
  const metadata = await page.locator('video').evaluate(async video => {
    video.muted = true; await video.play();
    return { duration: video.duration, width: video.videoWidth, height: video.videoHeight };
  });
  assert.ok(metadata.duration > 10); assert.equal(metadata.width, 1280); assert.equal(metadata.height, 720);
  await page.waitForFunction(() => document.querySelector('video').currentTime > .5);
  for (const image of await page.locator('img').all()) {
    await image.scrollIntoViewIfNeeded(); await image.evaluate(image => image.decode());
    assert.equal(await image.evaluate(image => image.naturalWidth), 1280);
  }
  assert.deepEqual(errors, []);
  const output = { verifiedAt: new Date().toISOString(), base, version: diagnostic.version,
    modelSha256: manifest.sha256, video: metadata, assets: game.assets, artSlice: game.artSlice, errors,
    note: 'Smoke de despliegue y medios, no benchmark ni validación de teléfono.' };
  await writeFile(`docs/performance/gate-a-art/${base.startsWith('http://127.') ? 'local' : 'live'}-verification.json`, JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output));
} finally { await browser.close(); }
