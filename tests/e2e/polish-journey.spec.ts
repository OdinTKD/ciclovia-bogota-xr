import {test,expect} from '@playwright/test';
test('partida real: carro, peatón y llegada sin inyectar estado',async({page},info)=>{
 test.setTimeout(70000);
 await page.goto('./');await page.waitForFunction(()=>(window as any).__game?.ready);
 await page.getByTestId('safety').check();await page.getByTestId('start').click();
 await page.getByTestId('pedal').dispatchEvent('pointerdown',{pointerId:1});
 const seen=new Set<string>();let last:any;
 const end=Date.now()+55000;
 while(Date.now()<end){
  last=await page.evaluate(()=>(window as any).__game);
  for(const actor of last.traffic)if(actor.active&&actor.z<200)seen.add(actor.kind);
  if(last.state.phase==='finished')break;
  await page.waitForTimeout(120);
 }
 await info.attach('journey',{body:JSON.stringify({seen:[...seen],game:last},null,2),contentType:'application/json'});
 expect([...seen].sort()).toEqual(['car','pedestrian']);
 expect(last.state.distance).toBe(200);expect(last.state.health).toBeGreaterThan(0);
 expect(last.state.phase).toBe('finished');expect(last.physicsSteps).toBe(last.state.tick);
 await expect(page.locator('#pause-title')).toHaveText('¡Qué buen paseo!');
});
