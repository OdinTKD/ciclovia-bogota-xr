import { describe, expect, it } from "vitest";
import { TRADITIONAL_BIKE, selectVehicle } from "../../src/vehicles/catalog";
import { createSimulation } from "../../src/core/simulation";

describe("MVP traditional bicycle", () => {
  it("has bounded, distinct driving statistics and is the only selectable MVP vehicle", () => {
    expect(TRADITIONAL_BIKE).toMatchObject({
      id: "traditional",
      maxSpeed: 11,
      acceleration: 2.8,
      stability: 0.85,
      turnRate: 2.6,
    });
    expect(selectVehicle("traditional")).toBe(TRADITIONAL_BIKE);
    expect(() => selectVehicle("electric")).toThrow("Vehículo no disponible");
    expect(() => selectVehicle("skates")).toThrow("Vehículo no disponible");
  });
  it("feeds the simulation defaults and coasts slower without pedaling", () => {
    const sim = createSimulation();
    expect(sim.config.maxSpeed).toBe(TRADITIONAL_BIKE.maxSpeed);
    expect(sim.config.acceleration).toBe(TRADITIONAL_BIKE.acceleration);
    expect(sim.config.steering).toBe(TRADITIONAL_BIKE.turnRate);
    sim.start();
    for (let i = 0; i < 180; i++)
      sim.update(1 / 60, { throttle: 1, steer: 0, brake: false });
    const speed = sim.state.speed;
    for (let i = 0; i < 60; i++)
      sim.update(1 / 60, { throttle: 0, steer: 0, brake: false });
    expect(sim.state.speed).toBeGreaterThan(0);
    expect(sim.state.speed).toBeLessThan(speed);
  });
});
