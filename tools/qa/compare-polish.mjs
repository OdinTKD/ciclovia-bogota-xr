// Fixed camera, stationary gameplay frames. Not a frame-rate benchmark.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const stage = process.env.COMPARE_STAGE || 'before';
const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4184/';
const folder = `docs/screenshots/gate-a-polish/${stage}`;
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=d3d11'] });
const reports = [];
try {
  for (const [orientation, viewport] of [['landscape', {width:1280,height:720}], ['portrait', {width:412,height:839}]]) {
    const context = await browser.newContext({viewport, deviceScaleFactor:1, isMobile:orientation==='portrait', hasTouch:orientation==='portrait'});
    const page = await context.newPage();
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    for (const weather of ['sun','rain']) {
      await page.goto(base);
      await page.waitForFunction(()=>window.__game?.ready);
      await page.getByTestId('weather').selectOption(weather);
      await page.getByTestId('safety').check();await page.getByTestId('start').click();
      await page.waitForTimeout(350);
      const game=await page.evaluate(()=>window.__game);
      assert.equal(game.state.distance,0);assert.equal(game.state.x,0);assert.equal(game.state.yaw,0);
      assert.equal(game.render.pixelRatio,1);assert.equal(game.render.width,viewport.width);assert.equal(game.render.height,viewport.height);
      assert.equal(game.state.weather,weather);assert.deepEqual(errors,[]);
      await page.screenshot({path:`${folder}/${orientation}-${weather}.png`,scale:'css'});
      reports.push({orientation,weather,viewport,game,errors:[...errors],note:'Camera world pose x=0,y=1.65,z=1.3, yaw=0, roll=0; FOV 65; ratio1. No input or state injection. Static gameplay comparison, not performance.'});
    }
    await context.close();
  }
  await writeFile(`${folder}/comparison.json`,JSON.stringify({stage,base,capturedAt:new Date().toISOString(),reports},null,2));
  console.log(`${stage}: four fixed-camera/fixed-resolution frames verified`);
} finally {await browser.close();}
