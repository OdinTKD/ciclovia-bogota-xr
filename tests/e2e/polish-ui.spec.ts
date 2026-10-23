import {test,expect} from '@playwright/test';
test('HUD compacto carbón/amarillo deja libre el primer plano de manos',async({page},info)=>{
 await page.goto('./');await page.waitForFunction(()=>(window as any).__game?.ready);
 await page.getByTestId('safety').check();await page.getByTestId('start').click();
 const layout=await page.evaluate(()=>{
  const hud=document.querySelector('#hud')!;const box=hud.getBoundingClientRect();
  const buttons=[...document.querySelectorAll('#touch button')].map(e=>e.getBoundingClientRect().toJSON());
  return {hud:box.toJSON(),bg:getComputedStyle(hud).backgroundColor,accent:getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),w:innerWidth,h:innerHeight,buttons};
 });
 expect(layout.bg).toBe('rgb(23, 25, 28)');expect(layout.accent).toBe('#e3b23c');
 expect(layout.hud.bottom).toBeLessThan(layout.h*.35);expect(layout.hud.height).toBeLessThan(76);
 if(info.project.name==='mobile')for(const b of layout.buttons){expect(b.width).toBeGreaterThanOrEqual(44);expect(b.top).toBeGreaterThan(layout.h*.85);}
});
test('el arranque respeta el mínimo visual con DPR reducido por zoom',async({browser},info)=>{
 test.skip(info.project.name!=='desktop','Un contexto independiente de zoom es suficiente');
 const context=await browser.newContext({viewport:{width:800,height:600},deviceScaleFactor:.5});
 const page=await context.newPage();await page.goto(process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4173/');
 await page.waitForFunction(()=>(window as any).__game?.ready);
 const render=await page.evaluate(()=>(window as any).__game.render);
 expect(render.pixelRatio).toBeGreaterThanOrEqual(.75);expect(render.width).toBeGreaterThanOrEqual(600);
 await context.close();
});
