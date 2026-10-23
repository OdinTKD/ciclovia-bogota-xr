import { describe, it, expect } from "vitest";
import {
  formatSpeed,
  formatDistance,
  canStart,
  routeProgress,
} from "../../src/ui/model";
import { createWorld, SCENE_BUDGET } from "../../src/rendering/scene";
import { InstancedMesh, Mesh } from "three";
describe("UI y seguridad", () => {
  it("convierte m/s a km/h y conserva cero", () => {
    expect(formatSpeed(5)).toBe("18");
    expect(formatSpeed(-2)).toBe("0");
  });
  it("muestra distancia y progreso acotado", () => {
    expect(formatDistance(123)).toBe("123 m");
    expect(routeProgress(600)).toBe(50);
    expect(routeProgress(1800)).toBe(100);
    expect(routeProgress(100, 200)).toBe(50);
  });
  it("exige confirmación para iniciar", () => {
    expect(canStart(false)).toBe(false);
    expect(canStart(true)).toBe(true);
  });
});
describe("presupuesto de geometría procedural", () => {
  it("incluye ciudad y mantiene cotas de llamadas y triángulos por frame", () => {
    const { scene } = createWorld();
    let calls = 0;
    let triangles = 0;
    scene.traverse((object) => {
      if (object instanceof Mesh) {
        calls++;
        const g = object.geometry;
        triangles +=
          ((g.index ? g.index.count : g.attributes.position.count) / 3) *
          (object instanceof InstancedMesh ? object.count : 1);
      }
    });
    expect(calls).toBeGreaterThan(15);
    expect(calls).toBeLessThanOrEqual(SCENE_BUDGET.drawCalls);
    expect(triangles).toBeLessThanOrEqual(SCENE_BUDGET.triangles);
  });
});
