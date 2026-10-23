import { describe, expect, it } from "vitest";
import { createPhysics } from "../../src/physics/world";

describe("Rapier bicycle collision sensors", () => {
  it("detects obstacles near the player, rejects distant objects and follows player motion", async () => {
    const physics = await createPhysics();
    try {
      physics.player(0, 12);
      expect(physics.overlaps(0, 12, 1, 1)).toBe(true);
      expect(physics.overlaps(5, 12, 1, 1)).toBe(false);
      expect(physics.overlaps(0, 30, 1, 1)).toBe(false);
      physics.player(5, 12);
      expect(physics.overlaps(5, 12, 1, 1)).toBe(true);
      expect(physics.overlaps(0, 12, 1, 1)).toBe(false);
    } finally {
      physics.dispose();
    }
  });
});
