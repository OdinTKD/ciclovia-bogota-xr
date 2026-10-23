import { describe, expect, it } from "vitest";
import { createTraffic, parseTrafficConfig } from "../../src/traffic";
import trafficJson from "../../public/config/traffic.json";

const config = {
  hazards: [
    {
      id: "car-1",
      kind: "car",
      z: 100,
      triggerDistance: 40,
      speed: 3,
      startX: 8,
      endX: -8,
      halfX: 2,
      halfZ: 1,
    },
    {
      id: "person-1",
      kind: "pedestrian",
      z: 200,
      triggerDistance: 30,
      speed: 1.5,
      startX: -6,
      endX: 6,
      halfX: 0.35,
      halfZ: 0.35,
    },
  ],
};

describe("tráfico configurable de Paseo", () => {
  it("valida el JSON editable y contiene ambos retos espaciados hasta la meta", () => {
    const parsed = parseTrafficConfig(trafficJson);
    expect(new Set(parsed.hazards.map((h) => h.kind))).toEqual(
      new Set(["car", "pedestrian"]),
    );
    expect(parsed.hazards.length).toBeGreaterThanOrEqual(8);
    expect(Math.max(...parsed.hazards.map((h) => h.z))).toBeLessThanOrEqual(
      1200,
    );
  });
  it("activa por proximidad con margen visible y cruza en direcciones opuestas", () => {
    const traffic = createTraffic(parseTrafficConfig(config));
    expect(traffic.update(0, 1).every((h) => !h.active)).toBe(true);
    const [car] = traffic.update(60, 0.1);
    expect(car.active).toBe(true);
    expect(car.x).toBeGreaterThan(7);
    expect(car.z).toBe(100);
    const person = traffic.update(170, 0.1)[1];
    expect(person.active).toBe(true);
    expect(person.x).toBeGreaterThan(-6);
  });
  it("integra por dt, congela pausa y no devuelve estado mutable", () => {
    const traffic = createTraffic(parseTrafficConfig(config));
    const first = traffic.update(60, 1);
    const x = first[0].x;
    expect(traffic.update(60, 0)[0].x).toBe(x);
    const next = traffic.update(60, 0.5)[0];
    expect(x - next.x).toBeCloseTo((8 - x) / 2);
    next.x = 99;
    expect(traffic.update(60, 0)[0].x).not.toBe(99);
    expect(traffic.update(170, 0)[1].active).toBe(false);
  });
  it("reproduce semilla y restablece retos; desactiva obstáculos cruzados o superados", () => {
    const a = createTraffic(parseTrafficConfig(config), 42);
    const b = createTraffic(parseTrafficConfig(config), 42);
    expect(a.update(60, 1)).toEqual(b.update(60, 1));
    a.reset();
    b.reset();
    expect(a.update(60, 1)).toEqual(b.update(60, 1));
    expect(a.update(60, 100)[0]).toMatchObject({
      x: -8,
      active: false,
      passed: true,
    });
    expect(a.update(210, 1)[1]).toMatchObject({ active: false, passed: true });
    a.reset();
    expect(a.update(0, 0)[0]).toMatchObject({
      x: 8,
      active: false,
      passed: false,
    });
  });
  it("rechaza valores desconocidos, IDs repetidos, dimensiones inválidas y tiempos inválidos", () => {
    for (const raw of [
      null,
      {},
      { hazards: [] },
      { hazards: [null] },
      { hazards: [{ ...config.hazards[0], kind: "bus" }] },
      { hazards: [config.hazards[0], config.hazards[0]] },
      { hazards: [{ ...config.hazards[0], speed: 0 }] },
      { hazards: [{ ...config.hazards[0], halfX: -1 }] },
      { hazards: [{ ...config.hazards[0], z: NaN }] },
      { hazards: [{ ...config.hazards[0], triggerDistance: 0 }] },
      { hazards: [{ ...config.hazards[0], endX: 8 }] },
    ])
      expect(() => parseTrafficConfig(raw)).toThrow();
    const traffic = createTraffic(parseTrafficConfig(config));
    expect(() => traffic.update(0, -1)).toThrow();
    expect(() => traffic.update(NaN, 1)).toThrow();
  });
});
