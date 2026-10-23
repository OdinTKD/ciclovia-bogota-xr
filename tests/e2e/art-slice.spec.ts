import { test, expect } from '@playwright/test';

test('el inicio espera el modelo Blender imprescindible', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/assets/models/bicycle-rider.glb', async route => {
    await gate;
    await route.continue();
  });
  const requested = page.waitForRequest('**/assets/models/bicycle-rider.glb', { timeout: 4000 });
  await page.goto('./');
  await requested;
  await page.getByTestId('safety').check();
  await page.getByTestId('weather').selectOption('rain');
  await expect(page.getByTestId('start')).toBeDisabled();
  release();
  await page.waitForFunction(() => (window as any).__game?.ready);
  await expect(page.getByTestId('start')).toBeEnabled();
  const game = await page.evaluate(() => (window as any).__game);
  expect(game.assets.source).toBe('blender-glb');
  expect(game.state.weather).toBe('rain');
  expect(game.artSlice).toMatchObject({ start: 0, end: 40 });
  expect(game.render.pixelRatio).toBeGreaterThanOrEqual(.375);
  expect(game.render.shadows).toBe(game.render.pixelRatio > .375);
  expect(game.render.materialQuality).toBe(game.render.shadows ? 'pbr' : 'diffuse');
  const raster = await page.evaluate(() => ({ dpr: devicePixelRatio,
    antialias: document.querySelector('canvas')!.getContext('webgl2')!.getContextAttributes()!.antialias }));
  expect(raster.antialias).toBe(raster.dpr <= 1);
  expect(game.render.antialias).toBe(raster.antialias);
  expect(game.render.artDetail).toBe(game.render.pixelRatio > .375 ? 'high' : 'low');
});

test('un GLB ausente comunica el error y no inicia una sustitución silenciosa', async ({ page }) => {
  await page.route('**/assets/models/bicycle-rider.glb', route => route.fulfill({ status: 404, body: 'Missing model' }));
  await page.goto('./');
  await expect(page.getByText(/No se pudo cargar la bicicleta de Blender/)).toBeVisible();
  await expect(page.getByTestId('start')).toBeDisabled();
});
