import { describe, expect, it } from "vitest";
import { parseWeather, weatherProfile } from "../../src/weather";

describe("MVP weather", () => {
  it("provides the agreed sun and rain driving and visibility profiles", () => {
    expect(weatherProfile("sun")).toEqual({
      grip: 1,
      braking: 7,
      visibility: 220,
      label: "Sol",
    });
    expect(weatherProfile("rain")).toEqual({
      grip: 0.6,
      braking: 4.8,
      visibility: 115,
      label: "Lluvia",
    });
  });

  it("reduces traction, braking and visibility in rain", () => {
    const sun = weatherProfile("sun");
    const rain = weatherProfile("rain");
    expect(rain.grip).toBeLessThan(sun.grip);
    expect(rain.braking).toBeLessThan(sun.braking);
    expect(rain.visibility).toBeLessThan(sun.visibility);
    for (const profile of [sun, rain]) {
      expect(profile.grip).toBeGreaterThan(0);
      expect(profile.grip).toBeLessThanOrEqual(1);
      expect(profile.braking).toBeGreaterThan(0);
      expect(profile.visibility).toBeGreaterThan(0);
    }
  });

  it("validates JSON inputs without silently accepting unsupported weather", () => {
    expect(parseWeather("sun")).toBe("sun");
    expect(parseWeather("rain")).toBe("rain");
    for (const invalid of [
      "snow",
      "fog",
      "",
      "SUN",
      null,
      undefined,
      0,
      {},
      [],
    ]) {
      expect(() => parseWeather(invalid)).toThrow("Clima no disponible");
    }
  });
});
