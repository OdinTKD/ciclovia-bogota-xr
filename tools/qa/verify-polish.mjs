import {chromium} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4185/';
const manifest=JSON.parse(await readFile('public/assets/models/bicycle-rider.manifest.json','utf8'));
const version=JSON.parse(await readFile('package.json','utf8')).version;
const browser=await chromium.launch();const page=await browser.newPage();const errors=[];
page.on('pageerror',error=>errors.push(error.message));
try{
 assert.equal((await page.goto(base)).status(),200);
 await page.waitForFunction(()=>window.__game?.ready);
 const game=await page.evaluate(()=>window.__game);
 assert.equal(game.assets.triangles,manifest.triangles);assert.equal(game.assets.source,'blender-glb');
 const model=await page.request.get(new URL('assets/models/bicycle-rider.glb',base).href);
 assert.equal(createHash('sha256').update(await model.body()).digest('hex'),manifest.sha256);
 assert.ok(game.render.pixelRatio>=.75);assert.equal(game.routeLength,200);
 await page.getByTestId('safety').check();await page.getByTestId('start').click();
 await page.keyboard.down('w');await page.waitForFunction(()=>window.__game.state.speed>2);await page.keyboard.up('w');
 await page.getByTestId('pause').click();
 const downloading=page.waitForEvent('download');await page.getByTestId('download-report').click();
 const chunks=[];for await(const chunk of await (await downloading).createReadStream())chunks.push(chunk);
 const diagnostic=JSON.parse(Buffer.concat(chunks).toString());assert.equal(diagnostic.version,version);
 assert.equal((await page.goto(new URL('review/polish/',base).href)).status(),200);
 for(const view of ['landscape-sun','landscape-rain','portrait-sun','portrait-rain']){
  await page.locator('#view').selectOption(view);
  for(const id of ['before','after']){
   const image=page.locator('#'+id);await image.evaluate(image=>image.decode());
   const dimensions=await image.evaluate(image=>[image.naturalWidth,image.naturalHeight]);
   assert.deepEqual(dimensions,view.startsWith('landscape')?[1280,720]:[412,839]);
  }
 }
 const videos=[];
 for(const video of await page.locator('video').all()){
  await video.evaluate(video=>{video.muted=true;video.load();});
  await video.evaluate(video=>new Promise((resolve,reject)=>{if(video.readyState>=1)return resolve();video.onloadedmetadata=()=>resolve();video.onerror=()=>reject(Error('Video failed'));}));
  const metadata=await video.evaluate(async video=>{await video.play();return {duration:video.duration,width:video.videoWidth,height:video.videoHeight};});
  assert.ok(metadata.duration>5);await page.waitForTimeout(600);assert.ok(await video.evaluate(video=>video.currentTime>0));await video.evaluate(video=>video.pause());videos.push(metadata);
 }
 assert.ok(videos[0].duration>25);assert.deepEqual(errors,[]);
 await mkdir('docs/performance/gate-a-polish',{recursive:true});
 const report={verifiedAt:new Date().toISOString(),base,version,modelSha256:manifest.sha256,assets:game.assets,videos,comparisonImages:8,errors,note:'Publication/media smoke, not a phone test or FPS benchmark.'};
 await writeFile(`docs/performance/gate-a-polish/${base.startsWith('https:')?'live':'local'}-verification.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
