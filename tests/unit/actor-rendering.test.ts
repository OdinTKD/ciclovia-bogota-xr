import { describe, it, expect } from "vitest";
import { Mesh, Object3D } from "three";
import { createWorld, type RenderTraffic } from "../../src/rendering/scene";
const snapshot = { x: 0, distance: 0, speed: 0, weather: "sun", elapsed: 0 };
function visibleMeshes(node: Object3D): number {
  if (!node.visible) return 0;
  return (
    (node instanceof Mesh ? 1 : 0) +
    node.children.reduce((count, child) => count + visibleMeshes(child), 0)
  );
}
describe("pools de actores renderizan únicamente retos visibles", () => {
  it("activa tres meshes del carro y vuelve a baseline al desactivarlo", () => {
    const world = createWorld();
    world.update(snapshot, []);
    const baseline = visibleMeshes(world.scene);
    const car: RenderTraffic = {
      id: "car-1",
      kind: "car",
      x: 0,
      z: 30,
      active: true,
    };
    world.update(snapshot, [car]);
    expect(visibleMeshes(world.scene)).toBe(baseline + 3);
    world.update(snapshot, [{ ...car, active: false }]);
    expect(visibleMeshes(world.scene)).toBe(baseline);
  });
  it("mantiene ambos tipos activos y omite actores fuera del alcance", () => {
    const world = createWorld();
    world.update(snapshot, []);
    const baseline = visibleMeshes(world.scene);
    const car: RenderTraffic = {
      id: "car-1",
      kind: "car",
      x: 0,
      z: 30,
      active: true,
    };
    const pedestrian: RenderTraffic = {
      id: "ped-1",
      kind: "pedestrian",
      x: 1,
      z: 40,
      active: true,
    };
    world.update(snapshot, [car, pedestrian]);
    expect(visibleMeshes(world.scene)).toBe(baseline + 6);
    world.update(snapshot, [
      { ...car, z: 220 },
      { ...pedestrian, z: -30 },
    ]);
    expect(visibleMeshes(world.scene)).toBe(baseline);
  });
});
