import { describe, expect, it, vi } from "vitest";
import { createFixedLoop } from "../../src/core/game-loop";

describe("single fixed clock", () => {
  it("runs the same ticks at 30, 60 and 120Hz and resets fractional time", () => {
    for (const hz of [30, 60, 120]) {
      const loop = createFixedLoop(), step = vi.fn();
      for (let i = 0; i < hz * 2; i++) loop.advance(1 / hz, step);
      expect(step).toHaveBeenCalledTimes(120);
      loop.advance(1 / 120, step);
      loop.reset();
      loop.advance(1 / 120, step);
      expect(step).toHaveBeenCalledTimes(120);
    }
  });
  it("caps catch-up and ignores invalid time", () => {
    const loop = createFixedLoop(), step = vi.fn();
    loop.advance(NaN, step); loop.advance(-1, step); loop.advance(5, step);
    expect(step).toHaveBeenCalledTimes(15);
  });
});
