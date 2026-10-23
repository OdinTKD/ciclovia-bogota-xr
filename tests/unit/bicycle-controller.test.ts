import { describe, expect, it } from "vitest";
import { advanceBicycle, freshBicycle } from "../../src/vehicles/bicycle-controller";
import { TRADITIONAL_BIKE } from "../../src/vehicles/catalog";
import { weatherProfile } from "../../src/weather";
const dt = 1 / 60;
const neutral = { throttle: 0, steer: 0, brake: false };
describe("oriented arcade bicycle", () => {
  it("turns the handlebar at rest without translating or rotating the chassis", () => {
    let state = freshBicycle();
    for (let n = 0; n < 60; n++) state = advanceBicycle(state, { ...neutral, steer: 1 }, TRADITIONAL_BIKE, weatherProfile("sun"), dt);
    expect(state.x).toBe(0); expect(state.worldZ).toBe(0); expect(state.yaw).toBe(0);
    expect(state.steeringAngle).toBeGreaterThan(0);
  });
  it("follows an arc, rather than lateral translation, and mirrors steering", () => {
    const run = (steer: number) => {
      let state = { ...freshBicycle(), speed: 3 };
      for (let n = 0; n < 60; n++) state = advanceBicycle(state, { ...neutral, throttle: 0.4 / 2.8, steer }, TRADITIONAL_BIKE, weatherProfile("sun"), dt);
      return state;
    };
    const right = run(0.3), left = run(-0.3);
    expect(right.x).toBeGreaterThan(0.1); expect(right.yaw).toBeGreaterThan(0.1);
    expect(right.worldZ).toBeLessThan(-2); expect(right.x).toBeCloseTo(-left.x, 8);
    expect(right.yaw).toBeCloseTo(-left.yaw, 8);
  });
  it("stops from 8m/s in 4–5m dry and 6–7m wet", () => {
    for (const weather of ["sun", "rain"] as const) {
      let state = { ...freshBicycle(), speed: 8 };
      for (let n = 0; n < 240 && state.speed > 0.01; n++) state = advanceBicycle(state, { ...neutral, brake: true }, TRADITIONAL_BIKE, weatherProfile(weather), dt);
      expect(state.speed).toBeLessThan(0.1);
      expect(-state.worldZ).toBeGreaterThan(weather === "sun" ? 4 : 6);
      expect(-state.worldZ).toBeLessThan(weather === "sun" ? 5 : 7);
    }
  });
  it("matches the bicycle turning radius within 5% below the grip limit", () => {
    const steeringAngle = TRADITIONAL_BIKE.maxSteeringAngle * 0.3;
    let state = { ...freshBicycle(), speed: 3, steeringAngle };
    for (let n = 0; n < 120; n++) state = advanceBicycle(state, { ...neutral, throttle: 0.4 / 2.8, steer: 0.3 }, TRADITIONAL_BIKE, weatherProfile("sun"), dt);
    const measured = (state.x ** 2 + state.worldZ ** 2) / (2 * state.x);
    const expected = TRADITIONAL_BIKE.wheelbase / Math.tan(steeringAngle);
    expect(Math.abs(measured - expected) / expected).toBeLessThan(0.05);
  });
  it("stability damps impact slip without autonomous yaw changes", () => {
    const initial = { ...freshBicycle(), speed: 4, lateralVelocity: 2, yaw: 0.2 };
    const run = (stability: number) => {
      let state = { ...initial };
      for (let n = 0; n < 60; n++) state = advanceBicycle(state, neutral, { ...TRADITIONAL_BIKE, stability }, weatherProfile("sun"), dt);
      return state;
    };
    expect(run(0.9).lateralVelocity).toBeLessThan(run(0.2).lateralVelocity);
    expect(run(0.9).yaw).toBe(initial.yaw);
  });
});
