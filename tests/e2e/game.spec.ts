import { test, expect } from "@playwright/test";

test("el inicio espera a que terminen de cargar los recursos", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/config/levels/virrey.json", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("./");
  await page.getByTestId("safety").check();
  await expect(page.getByTestId("start")).toBeDisabled();
  release();
  await page.waitForFunction(() => (window as any).__game?.ready);
  await expect(page.getByTestId("start")).toBeEnabled();
});

test("seguridad, paseo, pausa, lluvia, controles y reinicio", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await expect(page.getByTestId("start")).toBeDisabled();
  await page.getByTestId("safety").check();
  await page.waitForFunction(() => (window as any).__game?.ready);
  await page.getByTestId("start").click();
  if (testInfo.project.name === "mobile")
    await page
      .getByTestId("pedal")
      .dispatchEvent("pointerdown", { pointerId: 1 });
  else await page.keyboard.down("w");
  await expect
    .poll(() => page.evaluate(() => (window as any).__game.state.distance))
    .toBeGreaterThan(2);
  await page.keyboard.up("w");
  if (testInfo.project.name === "mobile")
    await page
      .getByTestId("pedal")
      .dispatchEvent("pointerup", { pointerId: 1 });
  await page.getByTestId("pause").click();
  const distance = await page.evaluate(
    () => (window as any).__game.state.distance,
  );
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => (window as any).__game.state.distance)).toBe(
    distance,
  );
  await page.getByTestId("weather").selectOption("rain");
  await page.getByTestId("humor").uncheck();
  await page.getByTestId("resume").click();
  await expect
    .poll(() => page.evaluate(() => (window as any).__game.state.weather))
    .toBe("rain");
  await page.getByTestId("pause").click();
  await page.getByTestId("restart").click();
  const state = await page.evaluate(() => (window as any).__game.state);
  expect(state.health).toBe(100);
  expect(state.collisions).toBe(0);
  expect(state.distance).toBe(0);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-paseo.png`,
  });
});
