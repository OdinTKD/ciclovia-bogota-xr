import { it, expect } from "vitest";
import { parseHumor, humorLine } from "../../src/config/humor";
it("lee textos editables y respeta el toggle sin inyectar HTML", () => {
  const lines = parseHumor({
    lines: ["¡Suave, vecino!", "Primero el timbre."],
  });
  expect(humorLine(lines, 1, true)).toBe("Primero el timbre.");
  expect(humorLine(lines, 1, false)).toBe("");
  expect(() => parseHumor({ lines: [] })).toThrow();
  expect(() => parseHumor({ lines: [3] })).toThrow();
});
