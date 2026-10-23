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
  sim.start();
  for (let frame = 0; frame < 15000 && sim.state.phase === "playing"; frame++) {
    sim.update(1 / 60, { throttle: 1, steer: 0, brake: false });
    const hazards = traffic.update(sim.state.distance, 1 / 60);
    physics.player(sim.state.x, sim.state.distance);
    for (const hazard of hazards)
      if (hazard.active) {
        seen.add(hazard.kind);
        if (
          Math.abs(hazard.z - sim.state.distance) < 5 &&
          physics.overlaps(hazard.x, hazard.z, hazard.halfX, hazard.halfZ)
        ) {
          const before = sim.state.collisions;
          sim.hit();
          if (sim.state.collisions > before) hits.add(hazard.kind);
        }
      }
  }
  expect([...seen].sort()).toEqual(["car", "pedestrian"]);
  expect(hits.has("car")).toBe(true);
  expect(sim.state.collisions).toBeGreaterThan(0);
  expect(sim.state.finished).toBe(true);
  physics.dispose();
});
