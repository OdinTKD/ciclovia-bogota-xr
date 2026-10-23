// Visual review of the minimum profile, separate from timing measurements.
import {chromium,devices} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4185/';
const folder='docs/screenshots/gate-a-polish/minimum';
await mkdir(folder,{recursive:true});
const browser=await chromium.launch();
const context=await browser.newContext({...devices['Pixel 7']});
const page=await context.newPage(),reports=[];
await (await context.newCDPSession(page)).send('Emulation.setCPUThrottlingRate',{rate:4});
try {
 for(const weather of ['sun','rain']){
  await page.goto(base);await page.waitForFunction(()=>window.__game?.ready);
  await page.getByTestId('weather').selectOption(weather);
  await page.getByTestId('safety').check();await page.getByTestId('start').click();
  await page.waitForTimeout(500);
  const game=await page.evaluate(()=>window.__game);
  assert.equal(game.render.pixelRatio,.75);assert.equal(game.render.width,309);assert.equal(game.render.height,629);
  assert.equal(game.state.distance,0);assert.equal(game.state.yaw,0);
  await page.screenshot({path:`${folder}/${weather}.png`,scale:'css'});
  reports.push({weather,render:game.render,state:game.state});
 }
 await writeFile(`${folder}/report.json`,JSON.stringify({base,reports,note:'Minimum-profile visual review; Pixel7 viewport on desktop Chromium with CPU4x. No physical phone. Screenshot is CSS412x839, internal render309x629.'},null,2));
 console.log('Minimum profile: sun/rain, 309x629 internal, verified.');
}finally{await browser.close();}
