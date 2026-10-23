import { describe, expect, it } from "vitest";
import { createSimulation } from "../../src/core/simulation";

const pedal = { throttle: 1, steer: 0, brake: false };
const advance = (
  sim: ReturnType<typeof createSimulation>,
  seconds = 4,
  input = pedal,
) => {
  for (let t = 0; t < seconds * 60; t++) sim.update(1 / 60, input);
};

describe("Paseo bicycle simulation", () => {
  it("only advances after safety start and freezes while paused", () => {
    const sim = createSimulation();
    advance(sim);
    expect(sim.state.distance).toBe(0);
    sim.start();
    advance(sim);
    expect(sim.state.speed).toBeGreaterThan(0);
    expect(sim.state.distance).toBeGreaterThan(0);
    sim.pause();
    const distance = sim.state.distance;
    advance(sim);
    expect(sim.state.distance).toBe(distance);
    sim.resume();
    advance(sim);
    expect(sim.state.distance).toBeGreaterThan(distance);
  });
  it("brakes, bounds steering and reduces lateral grip in rain", () => {
    const dry = createSimulation();
    const wet = createSimulation();
    dry.start();
    wet.start();
    wet.setWeather("rain");
    advance(dry, 1, { ...pedal, steer: 1 });
    advance(wet, 1, { ...pedal, steer: 1 });
    expect(wet.state.x).toBeLessThan(dry.state.x);
    advance(dry, 20, { ...pedal, steer: 1 });
    expect(dry.state.x).toBeLessThanOrEqual(2.4);
    const speed = dry.state.speed;
    advance(dry, 1, { throttle: 0, steer: 0, brake: true });
    expect(dry.state.speed).toBeLessThan(speed);
  });
  it("registers collisions with invulnerability, and resets every session field", () => {
    const sim = createSimulation();
    sim.start();
    advance(sim);
    sim.setWeather("rain");
    sim.hit();
    sim.hit();
    expect(sim.state.collisions).toBe(1);
    expect(sim.state.health).toBe(75);
    sim.restart();
    expect(sim.state).toMatchObject({
      phase: "playing",
      distance: 0,
      speed: 0,
      x: 0,
      health: 100,
      score: 0,
      elapsed: 0,
      collisions: 0,
      finished: false,
      weather: "rain",
    });
  });
  it("finishes the configured route and awards nonnegative score", () => {
    const sim = createSimulation({ routeLength: 5 });
    sim.start();
    advance(sim, 10);
    expect(sim.state.phase).toBe("finished");
    expect(sim.state.finished).toBe(true);
    expect(sim.state.distance).toBe(5);
    expect(sim.state.score).toBeGreaterThan(0);
  });
  it("is deterministic across frame sizes and ignores invalid time", () => {
    const a = createSimulation();
    const b = createSimulation();
    a.start();
    b.start();
    advance(a, 2);
    for (let i = 0; i < 40; i++) b.update(0.05, pedal);
    expect(a.state.distance).toBeCloseTo(b.state.distance, 8);
    b.update(Number.NaN, pedal);
    expect(Number.isFinite(b.state.distance)).toBe(true);
  });
});
