// Diagnostic only: CPU profiles and browser counters, never a passing FPS gate.
import {chromium,devices} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
const output='docs/performance/render-diagnostic';
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4190'],{stdio:'ignore'});
let browser;
try{
 for(let n=0;n<100;n++){try{if((await fetch('http://127.0.0.1:4190')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();
 const context=await browser.newContext({...devices['Pixel 7']});
 const page=await context.newPage(),cdp=await context.newCDPSession(page);
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await cdp.send('Performance.enable');await cdp.send('Profiler.enable');
 await page.goto('http://127.0.0.1:4190');await page.waitForFunction(()=>window.__game?.ready);
 await page.getByTestId('safety').check();await page.getByTestId('start').click();
 const results=[];
 for(const phase of ['stationary','moving']){
  if(phase==='moving')await page.getByTestId('pedal').dispatchEvent('pointerdown',{pointerId:2});
  const before=await cdp.send('Performance.getMetrics');
  await cdp.send('Profiler.start');await page.waitForTimeout(5000);
  const {profile}=await cdp.send('Profiler.stop');const after=await cdp.send('Performance.getMetrics');
  const game=await page.evaluate(()=>window.__game);
  const delta=Object.fromEntries(after.metrics.map(metric=>[metric.name,metric.value-(before.metrics.find(x=>x.name===metric.name)?.value??0)]));
  const counts=new Map();for(let i=0;i<profile.samples.length;i++){const id=profile.samples[i];counts.set(id,(counts.get(id)||0)+profile.timeDeltas[i]);}
  const top=profile.nodes.map(node=>({name:node.callFrame.functionName,url:node.callFrame.url,line:node.callFrame.lineNumber,selfMs:(counts.get(node.id)||0)/1000})).sort((a,b)=>b.selfMs-a.selfMs).slice(0,35);
  results.push({phase,game,delta,top});await writeFile(`${output}/${phase}.cpuprofile`,JSON.stringify(profile));
 }
 await writeFile(`${output}/report.json`,JSON.stringify({userAgent:await page.evaluate(()=>navigator.userAgent),results},null,2));
 console.log(JSON.stringify(results.map(({phase,game,delta,top})=>({phase,render:game.render,frames:game.performance,delta,top:top.slice(0,12)})),null,2));
}finally{await browser?.close();server.kill();}
