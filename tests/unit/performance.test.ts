import { describe, it, expect } from "vitest";
import {
  PERFORMANCE_BUDGET,
  evaluatePerformance,
  summarizeFrames,
} from "../../src/core/performance";

describe("presupuesto de celular gama media", () => {
  it("rechaza una escena con exceso de draw calls, triángulos o menos de 30 fps", () => {
    expect(
      evaluatePerformance({ drawCalls: 101, triangles: 100001, fps: 29 }),
    ).toEqual(["drawCalls", "triangles", "fps"]);
  });
  it("acepta exactamente los límites y detecta mediciones inválidas", () => {
    expect(
      evaluatePerformance({ drawCalls: 100, triangles: 100000, fps: 30 }),
    ).toEqual([]);
    expect(
      evaluatePerformance({ drawCalls: NaN, triangles: 0, fps: Infinity })
        .length,
    ).toBeGreaterThan(0);
    expect(PERFORMANCE_BUDGET.minimumFps).toBe(30);
  });
  it("resume tiempos de frames reales con percentil 95, sin ocultar frames lentos", () => {
    const stats = summarizeFrames([10, 10, 10, 10, 60]);
    expect(stats.p95Ms).toBe(60);
    expect(stats.fps).toBe(50);
    expect(summarizeFrames([]).fps).toBe(0);
  });
});
