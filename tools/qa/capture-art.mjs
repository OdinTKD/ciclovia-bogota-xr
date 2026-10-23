// Actual keyboard interaction; recording is evidence of appearance, never an FPS benchmark.
import { chromium, devices } from '@playwright/test';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const root = 'docs/screenshots/gate-a-art';
await mkdir(root, { recursive: true });
await mkdir('docs/videos/gate-a-art', { recursive: true });
await mkdir('public/review/art', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=d3d11'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1,
  recordVideo: { dir: 'docs/videos/gate-a-art', size: { width: 1280, height: 720 } } });
const page = await context.newPage();
const errors = [], events = [], held = new Set();
page.on('pageerror', error => errors.push(error.message));
const state = () => page.evaluate(() => window.__game.state);
async function key(k, active) {
  if (active && !held.has(k)) { await page.keyboard.down(k); held.add(k); }
  if (!active && held.has(k)) { await page.keyboard.up(k); held.delete(k); }
}
async function release() { for (const k of [...held]) await key(k, false); }
async function mark(label) {
  events.push({ label, capturedAt: Date.now(), game: await page.evaluate(() => window.__game) });
}
async function cruise(ms, x) {
  const end = Date.now() + ms;
  await key('w', true);
  while (Date.now() < end) {
    const s = await state();
    const targetYaw = Math.max(-.13, Math.min(.13, (x - s.x) * .3));
    const error = targetYaw - s.yaw - s.steeringAngle * .3;
    await key('d', error > .015); await key('a', error < -.015);
    await page.waitForTimeout(80);
  }
  await key('a', false); await key('d', false);
}
try {
  await page.goto(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4182/');
  await page.waitForFunction(() => window.__game?.ready);
  await page.getByTestId('safety').check(); await page.getByTestId('start').click();
  const gpu = await page.evaluate(() => {
    const gl = document.querySelector('canvas').getContext('webgl2');
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unavailable';
  });
  events.push({ label: 'Entorno de captura', gpu, note: 'Escritorio GPU real. No representa teléfono ni benchmark.' });
  for (const weather of ['sun', 'rain']) {
    if (weather === 'rain') {
      await page.getByTestId('pause').click(); await page.getByTestId('weather').selectOption(weather);
      await page.getByTestId('restart').click();
    }
    await page.locator('canvas').click({ position: { x: 640, y: 300 } });
    await mark(`${weather}: inicio`);
    await cruise(2400, .75); await mark(`${weather}: giro derecha`);
    await cruise(1300, -.65); await mark(`${weather}: contragiro`);
    await release(); await key(' ', true);
    await page.waitForFunction(() => window.__game.state.speed < .1);
    await release(); await mark(`${weather}: frenado completo`);
    assert.ok((await state()).distance < 40, 'La evidencia debe permanecer en la muestra artística');
    await page.waitForTimeout(200); // HUD refresh is deliberately limited to 10 Hz.
    await page.screenshot({ path: `${root}/${weather}-brake.png` });
    await page.waitForTimeout(1200);
  }
  assert.deepEqual(errors, []);
} finally {
  await writeFile('docs/videos/gate-a-art/events.json', JSON.stringify({ events, errors }, null, 2));
  const video = page.video(); await context.close();
  await video.saveAs('public/review/art/driving.webm'); await video.delete();
  await browser.close();
}
await copyFile(`${root}/sun-brake.png`, 'public/review/art/sun.png');
await copyFile(`${root}/rain-brake.png`, 'public/review/art/rain.png');
const mobileBrowser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=d3d11'] });
const mobile = await mobileBrowser.newPage({ ...devices['Pixel 7'] });
await mobile.goto(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4182/');
await mobile.waitForFunction(() => window.__game?.ready);
await mobile.getByTestId('safety').check(); await mobile.getByTestId('start').click();
await mobile.waitForTimeout(1000);
await mobile.screenshot({ path: `${root}/mobile-emulated.png` });
await writeFile(`${root}/mobile-emulated.json`, JSON.stringify(await mobile.evaluate(() => window.__game), null, 2));
await mobileBrowser.close();
