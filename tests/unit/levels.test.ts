import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseLevel, PASEO_RULES } from "../../src/levels";

const valid = {
  id: "virrey",
  name: "Paseo por El Virrey",
  mode: "paseo",
  length: 1200,
  seed: 2026,
  traffic: "config/traffic.json",
};

describe("configuración de niveles Paseo", () => {
  it("carga el nivel real y las reglas de puntuación", () => {
    const raw: unknown = JSON.parse(
      readFileSync(
        new URL("../../public/config/levels/virrey.json", import.meta.url),
        "utf8",
      ),
    );
    expect(parseLevel(raw)).toEqual(valid);
    expect(PASEO_RULES).toEqual({ pointsPerMeter: 10, collisionPenalty: 50 });
  });

  it.each([
    null,
    [],
    "virrey",
    {},
    { ...valid, id: "" },
    { ...valid, name: " " },
    { ...valid, mode: "carrera" },
    { ...valid, length: 199 },
    { ...valid, length: 3001 },
    { ...valid, length: NaN },
    { ...valid, seed: 1.5 },
    { ...valid, seed: Infinity },
  ])("rechaza contenido inválido: %j", (raw) => {
    expect(() => parseLevel(raw)).toThrow();
  });

  it.each([
    "../traffic.json",
    "/config/traffic.json",
    "https://example.com/a.json",
    "config/../traffic.json",
    "config\\traffic.json",
    "config/%2e%2e/traffic.json",
    "//example.com/a.json",
    "",
  ])("rechaza ruta insegura %s", (traffic) => {
    expect(() => parseLevel({ ...valid, traffic })).toThrow();
  });

  it("admite los extremos de longitud y devuelve una copia validada", () => {
    expect(parseLevel({ ...valid, length: 200 }).length).toBe(200);
    expect(parseLevel({ ...valid, length: 3000 }).length).toBe(3000);
    expect(parseLevel(valid)).not.toBe(valid);
  });
});
