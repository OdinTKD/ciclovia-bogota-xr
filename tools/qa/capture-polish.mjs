import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4182/';
const output='public/review/polish';
await mkdir(output,{recursive:true});await mkdir('docs/videos/gate-a-polish',{recursive:true});
const browser=await chromium.launch({channel:'chrome',args:['--use-angle=d3d11']});
try {
 for(const orientation of ['landscape','portrait']){
  const viewport=orientation==='landscape'?{width:1280,height:720}:{width:412,height:839};
  const context=await browser.newContext({viewport,deviceScaleFactor:1,hasTouch:orientation==='portrait',isMobile:orientation==='portrait',
   recordVideo:{dir:'docs/videos/gate-a-polish',size:viewport}});
  const page=await context.newPage(),events=[],errors=[],held=new Set(),seen=new Set(),landmarks=new Set();
  page.on('pageerror',error=>errors.push(error.message));
  const key=async(k,on)=>{if(on&&!held.has(k)){await page.keyboard.down(k);held.add(k);}if(!on&&held.has(k)){await page.keyboard.up(k);held.delete(k);}};
  const release=async()=>{for(const k of [...held])await key(k,false);};
  const game=()=>page.evaluate(()=>window.__game);
  const mark=async(label)=>events.push({label,time:Date.now(),game:await game()});
  const shot=async(label)=>page.screenshot({path:`docs/videos/gate-a-polish/${orientation}-${label}.png`,scale:'css'});
  async function drive(ms,targetX=0){
   const until=Date.now()+ms;await key('w',true);
   while(Date.now()<until){
    const g=await game(),s=g.state;
    for(const a of g.traffic)if(a.active&&a.z<200&&!seen.has(a.kind)){seen.add(a.kind);await mark(`${a.kind} visible`);}
    for(const distance of [40,52,100,150])if(s.distance>=distance&&!landmarks.has(distance)){
     landmarks.add(distance);await mark(`metro ${distance}`);await shot(`meter-${distance}`);
    }
    if(s.phase==='finished')break;
    const wanted=Math.max(-.12,Math.min(.12,(targetX-s.x)*.3));
    const error=wanted-s.yaw-s.steeringAngle*.3;
    await key('d',error>.015);await key('a',error<-.015);await page.waitForTimeout(80);
   }
   await key('a',false);await key('d',false);
  }
  await page.goto(base);await page.waitForFunction(()=>window.__game?.ready);
  if(orientation==='portrait')await page.getByTestId('weather').selectOption('rain');
  await page.getByTestId('safety').check();await page.getByTestId('start').click();
  await page.locator('canvas').click({position:{x:viewport.width/2,y:viewport.height*.4}});
  await mark('inicio');await drive(2100,.6);await mark('giro');await shot('steering');await drive(1600,-.4);await mark('contragiro');
  await release();await key(' ',true);await page.waitForFunction(()=>window.__game.state.speed<.05);await release();await mark('frenada');
  await page.screenshot({path:`docs/videos/gate-a-polish/${orientation}-brake.png`,scale:'css'});
  if(orientation==='landscape'){
   await drive(45000,0);await release();const last=await game();
   assert.equal(last.state.phase,'finished');assert.equal(last.state.distance,200);assert.ok(last.state.health>0);
   assert.deepEqual([...seen].sort(),['car','pedestrian']);await mark('meta');await shot('finish');await page.waitForTimeout(1200);
  }else await page.waitForTimeout(1000);
  assert.deepEqual(errors,[]);
  const video=page.video();await context.close();await video.saveAs(`${output}/${orientation}.webm`);await video.delete();
  await writeFile(`docs/videos/gate-a-polish/${orientation}-events.json`,JSON.stringify({base,orientation,viewport,events,errors,seen:[...seen],note:'Real keyboard input; no state injection. Video timing is not an FPS measurement.'},null,2));
  console.log(orientation,'captured',events.map(e=>e.label));
 }
} finally {await browser.close();}
