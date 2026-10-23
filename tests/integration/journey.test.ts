import { it, expect } from "vitest";
import { createSimulation } from "../../src/core/simulation";
import { createTraffic, parseTrafficConfig } from "../../src/traffic";
import { createPhysics } from "../../src/physics/world";
import config from "../../public/config/traffic.json";
it("el recorrido real activa ambos retos y Rapier detecta un carro invasor", async () => {
  const sim = createSimulation(),
    traffic = createTraffic(parseTrafficConfig(config), 2026),
    physics = await createPhysics();
  const seen = new Set<string>(),
    hits = new Set<string>();
  let obstacles = traffic.update(0, 0);
  sim.setWorld(physics, {
    step(dt, state) {
      const previous = obstacles;
      obstacles = traffic.update(state.distance, dt);
      return obstacles.flatMap((hazard, index) => {
        if (!hazard.active && !previous[index].active) return [];
        seen.add(hazard.kind);
        return [{ id: hazard.id, kind: hazard.kind, halfX: hazard.halfX, halfZ: hazard.halfZ,
          from: { x: previous[index].x, z: -previous[index].z, yaw: 0 },
          to: { x: hazard.x, z: -hazard.z, yaw: 0 } }];
      });
    },
    reset() { traffic.reset(); obstacles = traffic.update(0, 0); },
  });
  sim.start();
  for (let frame = 0; frame < 15000 && sim.state.phase === "playing"; frame++) {
    sim.update(1 / 60, { throttle: 1, steer: 0, brake: false });
    const contact = sim.state.lastContact;
    if (contact) hits.add(obstacles.find((actor) => actor.id === contact.actorId)!.kind);
  }
  expect([...seen].sort()).toEqual(["car", "pedestrian"]);
  expect(hits.has("car")).toBe(true);
  expect(sim.state.collisions).toBeGreaterThan(0);
  expect(sim.state.finished).toBe(true);
  expect(physics.steps).toBe(sim.state.tick);
  physics.dispose();
});
