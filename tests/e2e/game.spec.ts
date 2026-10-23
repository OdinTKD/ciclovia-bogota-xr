import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";

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

test("presupuesto real de escena y frames en sol y lluvia", async ({
  page,
  context,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "mobile",
    "Presupuesto medido en viewport móvil",
  );
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.goto("./");
  await page.waitForFunction(() => (window as any).__game?.ready);
  await page.getByTestId("safety").check();
  await page.getByTestId("start").click();
  await page
    .getByTestId("pedal")
    .dispatchEvent("pointerdown", { pointerId: 2 });
  for (const weather of ["sun", "rain"]) {
    if (weather === "rain") {
      await page.getByTestId("pause").click();
      await page.getByTestId("weather").selectOption("rain");
      await page.getByTestId("resume").click();
      await page
        .getByTestId("pedal")
        .dispatchEvent("pointerdown", { pointerId: 2 });
    }
    await page.waitForTimeout(5000);
    const metrics = await page.evaluate(() => ({
      ...(window as any).__game.render,
      ...(window as any).__game.performance,
    }));
    const report = testInfo.outputPath(`performance-${weather}.json`);
    await writeFile(report, JSON.stringify(metrics, null, 2));
    await testInfo.attach(`performance-${weather}`, {
      path: report,
      contentType: "application/json",
    });
    expect(metrics.samples).toBeGreaterThan(60);
    expect(metrics.drawCalls).toBeLessThanOrEqual(100);
    expect(metrics.drawCalls).toBeGreaterThan(20);
    expect(metrics.triangles).toBeLessThanOrEqual(100000);
    expect(metrics.triangles).toBeGreaterThan(10000);
    expect(metrics.pixelRatio).toBeGreaterThanOrEqual(0.5);
    expect(metrics.fps).toBeGreaterThanOrEqual(30);
  }
});
