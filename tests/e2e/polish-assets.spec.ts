import {test,expect} from '@playwright/test';
test('una textura de referencia ausente impide iniciar y explica el error',async({page})=>{
 await page.route('**/environment-alpha3/leaf.png',route=>route.abort());
 await page.goto('./');
 await expect(page.locator('#error')).toBeVisible();
 await expect(page.locator('#error')).toContainText('No se pudo iniciar');
 await expect(page.getByTestId('start')).toBeDisabled();
 expect(await page.evaluate(()=>(window as any).__game.ready)).toBe(false);
});
