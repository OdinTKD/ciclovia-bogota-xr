import { it, expect } from "vitest";
import { Vector3 } from "three";
import { createWorld } from "../../src/rendering/scene";
it("mantiene el manillar visible en la cámara en primera persona", () => {
  const { scene, camera } = createWorld();
  camera.aspect = 393 / 851;
  camera.updateProjectionMatrix();
  scene.updateMatrixWorld(true);
  const bike = camera.children.find((child) => child.type === "Group")!;
  const handlebar = bike.children[1];
  const point = handlebar.getWorldPosition(new Vector3()).project(camera);
  expect(point.y).toBeGreaterThan(-0.85);
  expect(point.y).toBeLessThan(0.2);
  expect(Math.abs(point.x)).toBeLessThan(1);
});
