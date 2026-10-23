// Capture real keyboard interaction. Video runs separately from FPS benchmarks.
import { chromium, devices } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const output = 'docs/videos/gate-a';
await mkdir(output, { recursive: true });
await mkdir('public/review', { recursive: true });
await mkdir('docs/screenshots/gate-a', { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1,
  recordVideo: { dir: output, size: { width: 1280, height: 720 } } });
const page = await context.newPage();
const errors = [], events = [];
page.on('pageerror', e => errors.push(e.message));
const state = () => page.evaluate(() => window.__game.state);
const mark = async label => { const s = await state(); events.push({ label, capturedAt: Date.now(), state: s }); console.log(label, JSON.stringify({ distance:s.distance,speed:s.speed,yaw:s.yaw,x:s.x,collisions:s.collisions,contact:s.lastContact })); };
const held = new Set();
async function key(key, active) {
  if (active && !held.has(key)) { await page.keyboard.down(key); held.add(key); }
  if (!active && held.has(key)) { await page.keyboard.up(key); held.delete(key); }
}
async function release() { for (const k of [...held]) await key(k, false); }
async function cruise(ms, targetX = 0) {
  const until = Date.now() + ms;
  await key('w', true);
  while (Date.now() < until) {
    const s = await state();
    if (s.phase !== 'playing') break;
    const targetYaw = Math.max(-.13, Math.min(.13, (targetX - s.x) * .3));
    const error = targetYaw - s.yaw - s.steeringAngle * .3;
    await key('d', error > .015); await key('a', error < -.015);
    await page.waitForTimeout(80);
  }
  await key('d', false); await key('a', false);
}
async function restart(weather) {
  await release();
  if ((await state()).phase === 'playing') await page.getByTestId('pause').click();
  await page.getByTestId('weather').selectOption(weather);
  await page.getByTestId('restart').click();
  await page.locator('canvas').click({ position: { x:640,y:300 } });
}
try {
  await page.goto(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4181/');
  await page.waitForFunction(() => window.__game?.ready);
  await page.getByTestId('safety').check(); await page.getByTestId('start').click();
  await page.locator('canvas').click({ position: { x:640,y:300 } });
  await mark('Sol: inicio');
  await cruise(3000, .7); await mark('Dirección derecha');
  await cruise(2000, -.7); await mark('Contradirección izquierda');
  await release(); await key(' ', true);
  await page.waitForFunction(() => window.__game.state.speed < .1);
  await key(' ', false); await mark('Frenado hasta detenerse');
  await page.screenshot({ path:'docs/screenshots/gate-a/after-desktop-bicycle.png' });
  await restart('sun'); await mark('Sol: aproximación frontal');
  await key('w', true);
  await page.waitForFunction(() => window.__game.state.collisions > 0, null, { timeout:30_000 });
  await mark('Contacto frontal');
  assert.equal((await state()).lastContact.kind, 'frontal');
  await page.screenshot({ path:'docs/screenshots/gate-a/after-contact.png' });
  await cruise(4500, 0); await mark('Recuperación después del contacto');
  assert.ok((await state()).distance > 115);
  await restart('rain'); await mark('Lluvia: dirección y roce de bordillo');
  await cruise(6500, 3.1); await mark('Roce lateral de bordillo');
  const graze = await state();
  assert.ok(graze.x < 2.5 && graze.x > 1.5);
  assert.ok(graze.speed > 1);
  await cruise(3500, 0); await mark('Recuperación de trayectoria');
  assert.ok((await state()).x < graze.x);
  await page.screenshot({ path:'docs/screenshots/gate-a/after-rain.png' });
  await release(); await key(' ', true);
  await page.waitForFunction(() => window.__game.state.speed < .1);
  await release(); await page.getByTestId('pause').click();
  const downloading = page.waitForEvent('download'); await page.getByTestId('download-report').click();
  await (await downloading).saveAs('docs/performance/gate-a/video-session.json');
  await page.waitForTimeout(1000);
  assert.deepEqual(errors, []);
} finally {
  await writeFile(`${output}/events.json`, JSON.stringify({ events, errors, note:'Interacción real por teclado, sin modificar estado ni velocidad del juego. Grabación no usada como benchmark FPS.' }, null, 2));
  const video = page.video();
  await context.close();
  await video.saveAs('public/review/gate-a-driving.webm');
  await video.delete();
  await browser.close();
}

const mobileBrowser = await chromium.launch();
const mobileContext = await mobileBrowser.newContext({ ...devices['Pixel 7'] });
const mobile = await mobileContext.newPage();
await mobile.goto(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4181/');
await mobile.waitForFunction(() => window.__game?.ready);
await mobile.getByTestId('safety').check(); await mobile.getByTestId('start').click();
await mobile.waitForTimeout(500);
await mobile.screenshot({ path:'docs/screenshots/gate-a/after-mobile-bicycle.png' });
await mobileBrowser.close();
