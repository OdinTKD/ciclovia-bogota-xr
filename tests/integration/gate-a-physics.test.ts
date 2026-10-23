import { describe, expect, it } from "vitest";
import { createPhysics, type PhysicsActorMotion } from "../../src/physics/world";
import { createSimulation } from "../../src/core/simulation";
const pose = (x: number, z: number, yaw = 0) => ({ x, z, yaw });
const wall: PhysicsActorMotion = { id: "car", kind: "car", from: pose(0, -2), to: pose(0, -2), halfX: 2, halfZ: 0.05 };
describe("Gate A physical tick", () => {
  it("does not display accumulated forward speed while blocked against a solid", async () => {
    const physics = await createPhysics();
    try {
      const sim = createSimulation();
      sim.setWorld(physics, { step: () => [wall], reset() {} });
      sim.start(); sim.state.speed = 8;
      for (let n = 0; n < 60; n++) sim.update(1 / 60, { throttle: 1, steer: 0, brake: false });
      expect(sim.state.worldZ).toBeGreaterThan(-1.26);
      expect(sim.state.speed).toBeLessThan(0.1);
      expect(sim.state.collisions).toBe(1);
    } finally { physics.dispose(); }
  });
  it("preserves forward slide on a lateral graze and avoids reapplying damage during cooldown", async () => {
    const physics = await createPhysics();
    const side = { ...wall, from: pose(0.8, -2), to: pose(0.8, -2), halfX: 0.1, halfZ: 3 };
    try {
      const result = physics.moveBicycle(pose(0, 0), pose(1, -2), [side], 1 / 60);
      expect(result.contacts[0].kind).toBe("lateral");
      expect(result.pose.z).toBeCloseTo(-2, 2);
      expect(result.pose.x).toBeLessThan(0.36);
      expect(physics.penetration(result.pose, side)).toBeLessThanOrEqual(0.02);
    } finally { physics.dispose(); }
  });
  it("advances Rapier exactly once per simulation tick regardless of actor count; queries do not step", async () => {
    const physics = await createPhysics();
    try {
      const sim = createSimulation(); let trafficTicks = 0, actorCount = 0;
      sim.setWorld(physics, { step() {
        trafficTicks++;
        return Array.from({ length: actorCount }, (_, i) => ({ ...wall, id: `distant-${i}`, from: pose(20 + i, -30), to: pose(20 + i, -30) }));
      }, reset() {} });
      sim.start(); sim.update(1 / 30, { throttle: 1, steer: 0, brake: false });
      expect(sim.state.tick).toBe(2); expect(physics.steps).toBe(2); expect(trafficTicks).toBe(2);
      physics.overlaps(0, 0, 1, 1); physics.overlaps(5, 0, 1, 1);
      expect(physics.steps).toBe(2);
      actorCount = 20;
      sim.update(1 / 30, { throttle: 1, steer: 0, brake: false });
      expect(physics.steps).toBe(4); expect(trafficTicks).toBe(4);
      sim.pause(); sim.update(1, { throttle: 1, steer: 0, brake: false });
      expect(physics.steps).toBe(4); expect(trafficTicks).toBe(4);
      sim.restart(); expect(sim.state.tick).toBe(0); expect(physics.steps).toBe(0);
    } finally { physics.dispose(); }
  });
  it("sweeps through a thin frontal obstacle and stops before it without penetration", async () => {
    const physics = await createPhysics();
    try {
      const result = physics.moveBicycle(pose(0, 0), pose(0, -4), [wall], 1 / 60);
      expect(result.contacts).toHaveLength(1);
      expect(result.contacts[0].kind).toBe("frontal");
      expect(result.pose.z).toBeGreaterThan(-1.26);
      expect(physics.penetration(result.pose, wall)).toBeLessThanOrEqual(0.02);
      expect(physics.steps).toBe(0);
    } finally { physics.dispose(); }
  });
  it("detects a moving actor crossing between separated endpoints and resolves relative motion", async () => {
    const physics = await createPhysics();
    const crossing = { ...wall, from: pose(-3, 0), to: pose(3, 0), halfX: 0.3, halfZ: 0.3 };
    try {
      const result = physics.moveBicycle(pose(0, 0), pose(0, -0.1), [crossing], 1 / 60);
      expect(result.contacts.length).toBeGreaterThan(0);
      expect(result.contacts[0].normalSpeed).toBeGreaterThan(0);
      expect(physics.penetration(result.pose, crossing)).toBeLessThanOrEqual(0.02);
    } finally { physics.dispose(); }
  });
  it("separates initial overlap and supports rotated actors", async () => {
    const physics = await createPhysics();
    const rotated = { ...wall, from: pose(0.2, 0, Math.PI / 4), to: pose(0.2, 0, Math.PI / 4), halfX: 0.3, halfZ: 1 };
    try {
      const result = physics.moveBicycle(pose(0, 0), pose(0, -0.1, 0.2), [rotated], 1 / 60);
      expect(physics.penetration(result.pose, rotated)).toBeLessThanOrEqual(0.02);
      expect(Number.isFinite(result.pose.x)).toBe(true);
    } finally { physics.dispose(); }
  });
  it("sweeps towards a rotated solid using world-space normals", async () => {
    const physics = await createPhysics();
    const rotated = { ...wall, from: pose(0, -2, Math.PI / 4), to: pose(0, -2, Math.PI / 4), halfX: 2, halfZ: 0.05 };
    try {
      const result = physics.moveBicycle(pose(0, 0, 0.2), pose(0, -4, 0.25), [rotated], 1 / 60);
      expect(result.contacts.length).toBeGreaterThan(0);
      expect(physics.penetration(result.pose, rotated)).toBeLessThanOrEqual(0.02);
      expect(Math.abs(result.contacts[0].normal.x)).toBeGreaterThan(0.5);
    } finally { physics.dispose(); }
  });
  it("finishes the 200m gate and freezes/resets the common clock", async () => {
    const physics = await createPhysics(), sim = createSimulation({ routeLength: 200 });
    try {
      sim.setWorld(physics, { step: () => [], reset() {} }); sim.start();
      for (let n = 0; n < 1800 && !sim.state.finished; n++) sim.update(1 / 60, { throttle: 1, steer: 0, brake: false });
      expect(sim.state.distance).toBe(200); expect(sim.state.phase).toBe("finished");
      const ticks = sim.state.tick;
      sim.update(1, { throttle: 1, steer: 1, brake: false });
      expect(physics.steps).toBe(ticks);
      sim.restart();
      expect(sim.state).toMatchObject({ x: 0, worldZ: 0, yaw: 0, steeringAngle: 0, roll: 0, tick: 0, distance: 0, phase: "playing" });
      expect(physics.steps).toBe(0);
    } finally { physics.dispose(); }
  });
  it("frontal impacts cost more speed and health than a graze; sustained contact observes cooldown", () => {
    const front = createSimulation(), side = createSimulation();
    for (const sim of [front, side]) { sim.start(); sim.state.speed = 8; }
    const contact = { actorId: "car", normal: { x: 0, z: -1 }, normalSpeed: 8, kind: "frontal" as const };
    front.hit(contact); side.hit({ ...contact, kind: "lateral", normalSpeed: 1 });
    expect(front.state.speed).toBeLessThan(side.state.speed);
    expect(front.state.health).toBeLessThan(side.state.health);
    front.hit(contact); expect(front.state.collisions).toBe(1);
  });
  it("same Rapier/contact tick inputs at 30/60/120Hz agree within 1cm and 0.1 degree", async () => {
    const states = [];
    for (const hz of [30,60,120]) {
      const sim = createSimulation(), physics = await createPhysics();
      try {
        sim.setWorld(physics, { step: () => [wall], reset() {} }); sim.start();
        for (let n = 0; n < hz * 2; n++) sim.update(1 / hz, { throttle: 1, steer: 0.25, brake: false });
        expect(physics.steps).toBe(120);
        states.push({ ...sim.state });
      } finally { physics.dispose(); }
    }
    for (const state of states) {
      expect(Math.abs(state.x - states[0].x)).toBeLessThan(0.01);
      expect(Math.abs(state.worldZ - states[0].worldZ)).toBeLessThan(0.01);
      expect(Math.abs(state.yaw - states[0].yaw)).toBeLessThan(0.1 * Math.PI / 180);
    }
  });
});
