import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { summarizeFrames } from '../../src/core/performance';

test.use({ trace: 'off' });
test('recorrido y encuentro: presupuesto completo y resolución efectiva', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Una sola comparación móvil, CPU 4×');
  test.setTimeout(90_000);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto('./');
  await page.waitForFunction(() => (window as any).__game?.ready);
  await page.getByTestId('safety').check();
  for (const weather of ['sun', 'rain']) {
    if (weather === 'rain') {
      await page.getByTestId('pause').click();
      await page.getByTestId('weather').selectOption(weather);
      await page.getByTestId('restart').click();
    } else await page.getByTestId('start').click();
    await page.waitForTimeout(1000);
    await page.getByTestId('pedal').dispatchEvent('pointerdown', { pointerId: 1 });
    const measured = await page.evaluate(async () => {
      const samples: number[] = [];
      const resolutions: any[] = [];
      let maxDrawCalls = 0, maxTriangles = 0, previousKey = '';
      let started = 0;
      let previous = 0;
      await new Promise<void>((resolve) => {
        function sample(now: number) {
          if (!started) { started = now; previous = now; }
          const game = (window as any).__game;
          if (game.state.phase === 'playing') {
            if (now > previous) samples.push(now - previous);
            const canvas = document.querySelector('canvas')!;
            const render = game.render;
            maxDrawCalls = Math.max(maxDrawCalls, render.drawCalls);
            maxTriangles = Math.max(maxTriangles, render.triangles);
            const key = `${canvas.width}:${canvas.height}`;
            if (key !== previousKey) {
              resolutions.push({ elapsedMs: now - started, width: canvas.width, height: canvas.height,
                cssWidth: canvas.clientWidth, cssHeight: canvas.clientHeight,
                devicePixelRatio, pixelRatio: render.pixelRatio });
              previousKey = key;
            }
          }
          previous = now;
          if (now - started >= 18_000) resolve();
          else requestAnimationFrame(sample);
        }
        requestAnimationFrame(sample);
      });
      return { samples, resolutions, maxDrawCalls, maxTriangles, state: (window as any).__game.state,
        assets: (window as any).__game.assets ?? null, userAgent: navigator.userAgent };
    });
    await page.getByTestId('pedal').dispatchEvent('pointerup', { pointerId: 1 });
    const report = { ...measured, frames: summarizeFrames(measured.samples), environment: 'Chromium viewport Pixel 7; CPU 4x; 18s jugando; muestra por RAF; sin vídeo ni capturas durante medición' };
    const path = testInfo.outputPath(`route-performance-${weather}.json`);
    await writeFile(path, JSON.stringify(report, null, 2));
    await testInfo.attach(`route-performance-${weather}`, { path, contentType: 'application/json' });
    await page.screenshot({ path: testInfo.outputPath(`route-${weather}.png`) });
    expect(report.frames.samples).toBeGreaterThan(300);
    expect(report.frames.fps).toBeGreaterThanOrEqual(30);
    expect(report.maxDrawCalls).toBeLessThanOrEqual(100);
    expect(report.maxTriangles).toBeLessThanOrEqual(100_000);
    expect(report.state.distance).toBeGreaterThan(90);
    expect(report.resolutions.every(r => r.width > 0 && r.height > 0 && r.pixelRatio >= .75)).toBe(true);
  }
});
