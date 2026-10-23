import { test, expect } from '@playwright/test';

test('mantener P o Escape no reanuda accidentalmente la pausa', async ({ page }) => {
  await page.goto('./');
  await page.waitForFunction(() => (window as any).__game?.ready);
  await page.getByTestId('safety').check();
  await page.getByTestId('start').click();
  for (const key of ['p', 'Escape']) {
    await page.keyboard.down(key);
    expect(await page.evaluate(() => (window as any).__game.state.phase)).toBe('paused');
    await page.keyboard.down(key); // Browser generates repeat=true while held.
    expect(await page.evaluate(() => (window as any).__game.state.phase)).toBe('paused');
    await page.keyboard.up(key);
    await page.keyboard.press(key);
    expect(await page.evaluate(() => (window as any).__game.state.phase)).toBe('playing');
  }
});

test('el informe cuenta cada frame jugando aunque ese frame no complete un tick físico', async ({ page }) => {
  await page.clock.install();
  await page.goto('./');
  await page.waitForFunction(() => (window as any).__game?.ready);
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.getByTestId('safety').check();
  await page.getByTestId('start').click();
  await page.clock.runFor(160); // Playwright RAF: ten frames of 16ms; fixed physics: nine ticks.
  await page.getByTestId('pause').click();
  await page.clock.runFor(16);
  const downloading = page.waitForEvent('download');
  await page.getByTestId('download-report').click();
  const stream = await (await downloading).createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const report = JSON.parse(Buffer.concat(chunks).toString());
  expect(report.session.frames.samples).toBe(10);
  expect(report.state.tick).toBeLessThan(report.session.frames.samples);
});

test('puerta A: ruta de 200 m, orientación, un tick físico y diagnóstico descargable', async ({ page }) => {
  await page.goto('./');
  await page.waitForFunction(() => (window as any).__game?.ready);
  await page.getByTestId('safety').check();
  await page.getByTestId('start').click();
  await page.getByTestId('pedal').dispatchEvent('pointerdown', { pointerId: 1 });
  await expect.poll(() => page.evaluate(() => (window as any).__game.state.speed)).toBeGreaterThan(2);
  await page.getByTestId('right').dispatchEvent('pointerdown', { pointerId: 2 });
  await expect.poll(() => page.evaluate(() => (window as any).__game.state.yaw)).toBeGreaterThan(.03);
  await page.getByTestId('right').dispatchEvent('pointerup', { pointerId: 2 });
  await page.getByTestId('pause').click();
  const game = await page.evaluate(() => (window as any).__game);
  expect(game.gate).toBe('A');
  expect(game.routeLength).toBe(200);
  expect(game.physicsSteps).toBe(game.state.tick);
  expect(game.render.width).toBeGreaterThan(0);
  expect(game.render.height).toBeGreaterThan(0);
  await expect(page.locator('#progress-text')).toContainText('/ 200 m');
  const download = page.waitForEvent('download');
  await page.getByTestId('download-report').click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('ciclovia-gate-a-report.json');
  const stream = await file.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const report = JSON.parse(Buffer.concat(chunks).toString());
  expect(report.gate).toBe('A');
  expect(report.session.frames.samples).toBeGreaterThan(0);
  expect(report.session.resolutions[0].width).toBeGreaterThan(0);
  expect(report.userAgent).toBeTruthy();
  const tick = game.state.tick;
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => (window as any).__game.state.tick)).toBe(tick);
});
