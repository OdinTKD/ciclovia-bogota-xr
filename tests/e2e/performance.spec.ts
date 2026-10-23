import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
// Screenshots/DOM tracing add readback work absent during normal play.
// Functional suites retain failure traces; the benchmark stores numeric samples.
test.use({ trace: "off" });
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
      bicycleTriangles: (window as any).__game.assets.triangles,
    }));
    const report = testInfo.outputPath(`performance-${weather}.json`);
    await writeFile(report, JSON.stringify(metrics, null, 2));
    await testInfo.attach(`performance-${weather}`, {
      path: report,
      contentType: "application/json",
    });
    expect(metrics.samples).toBeGreaterThan(60);
    expect(metrics.drawCalls).toBeLessThanOrEqual(100);
    expect(metrics.drawCalls).toBeGreaterThan(0);
    expect(metrics.bicycleTriangles).toBeGreaterThan(1000);
    expect(metrics.triangles).toBeLessThanOrEqual(100000);
    expect(metrics.triangles).toBeGreaterThan(10000);
    expect(metrics.pixelRatio).toBeGreaterThanOrEqual(0.375);
    expect(metrics.fps).toBeGreaterThanOrEqual(30);
  }
});
