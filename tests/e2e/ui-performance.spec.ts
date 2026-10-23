import { test, expect } from "@playwright/test";
test("HUD estacionario no genera mutaciones DOM innecesarias", async ({
  page,
}) => {
  await page.goto("./");
  await page.waitForFunction(() => (window as any).__game?.ready);
  await page.getByTestId("safety").check();
  await page.getByTestId("start").click();
  const mutations = await page.evaluate(async () => {
    let count = 0;
    const observer = new MutationObserver(
      (records) => (count += records.length),
    );
    observer.observe(document.querySelector("#hud")!, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    await new Promise((resolve) => setTimeout(resolve, 350));
    observer.disconnect();
    return count;
  });
  expect(mutations).toBe(0);
});
