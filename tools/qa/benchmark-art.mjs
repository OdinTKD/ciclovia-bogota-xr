// Measure the art sample itself in both climates, without video or screenshots.
import { chromium, devices } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
for (const mode of (process.env.ART_BENCH_MODE ? [process.env.ART_BENCH_MODE] : ['software-mobile', 'hardware-desktop'])) {
  const browser = await chromium.launch(mode === 'hardware-desktop' ? { channel: 'chrome', args: ['--use-angle=d3d11'] } : {});
  const context = await browser.newContext(mode === 'software-mobile' ? { ...devices['Pixel 7'] } : { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  if (mode === 'software-mobile') await (await context.newCDPSession(page)).send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4182/');
  await page.waitForFunction(() => window.__game?.ready);
  await page.getByTestId('safety').check();
  const reports = [];
  try {
    for (const weather of ['sun', 'rain']) {
      if (weather === 'sun') await page.getByTestId('start').click();
      else { await page.getByTestId('pause').click(); await page.getByTestId('weather').selectOption(weather); await page.getByTestId('restart').click(); }
      await page.locator('canvas').click({ position: { x: 200, y: 300 } });
      await page.keyboard.down('w'); await page.waitForFunction(() => window.__game.state.distance > 10);
      await page.keyboard.up('w'); await page.keyboard.down(' '); await page.waitForFunction(() => window.__game.state.speed < .1); await page.keyboard.up(' ');
      const report = await page.evaluate(async () => {
        const samples = [], resolutions = []; let calls = 0, triangles = 0, started, previous, key = '';
        const gl = document.querySelector('canvas').getContext('webgl2'); const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unavailable';
        await new Promise(resolve => {
          function tick(now) {
            if (started === undefined) { started = now; previous = now; }
            if (now > previous) samples.push(now - previous);
            previous = now;
            const r = window.__game.render;
            calls = Math.max(calls, r.drawCalls); triangles = Math.max(triangles, r.triangles);
            const next = `${r.width}:${r.height}:${r.materialQuality}`;
            if (next !== key) { resolutions.push({ elapsedMs: now - started, ...r }); key = next; }
            if (now - started >= 6000) resolve(); else requestAnimationFrame(tick);
          } requestAnimationFrame(tick);
        });
        const sorted = [...samples].sort((a,b) => a-b);
        return { gpu, userAgent: navigator.userAgent, samples, maxDrawCalls: calls, maxTriangles: triangles,
          fps: samples.length * 1000 / samples.reduce((a,b) => a+b, 0), p95Ms: sorted[Math.ceil(sorted.length*.95)-1],
          resolutions, state: window.__game.state };
      });
      reports.push({ mode, weather, ...report });
      console.log(mode, weather, JSON.stringify({ fps: report.fps, calls: report.maxDrawCalls, triangles: report.maxTriangles, resolutions: report.resolutions }));
      assert.ok(report.state.distance < 40, 'Sample must remain inside the art slice');
      assert.ok(report.fps >= 30, 'FPS minimum 30');
      assert.ok(report.maxDrawCalls <= 100 && report.maxTriangles <= 100000);
    }
  } finally {
    await writeFile(`docs/performance/gate-a-art/sample-${mode}.json`, JSON.stringify(reports, null, 2));
    await browser.close();
  }
}
