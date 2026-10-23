export type ObstacleKind = "car" | "pedestrian";
export interface TrafficHazard {
  id: string;
  kind: ObstacleKind;
  z: number;
  triggerDistance: number;
  speed: number;
  startX: number;
  endX: number;
  halfX: number;
  halfZ: number;
}
export interface TrafficConfig {
  hazards: TrafficHazard[];
}
export interface Obstacle {
  id: string;
  kind: ObstacleKind;
  x: number;
  z: number;
  active: boolean;
  halfX: number;
  halfZ: number;
  passed?: boolean;
}

function markPassed(obstacle: Obstacle) {
  obstacle.passed = true;
  obstacle.active = false;
}

export function parseTrafficConfig(raw: unknown): TrafficConfig {
  if (
    !raw ||
    typeof raw !== "object" ||
    !("hazards" in raw) ||
    !Array.isArray(raw.hazards) ||
    !raw.hazards.length
  ) {
    throw new Error("Configuración de tráfico inválida: hazards");
  }
  const ids = new Set<string>();
  const hazards = raw.hazards.map((value: unknown) => {
    if (!value || typeof value !== "object")
      throw new Error("Reto de tráfico inválido");
    const h = value as Record<string, unknown>;
    if (
      typeof h.id !== "string" ||
      !h.id.trim() ||
      ids.has(h.id) ||
      (h.kind !== "car" && h.kind !== "pedestrian")
    ) {
      throw new Error("Identidad de reto inválida o repetida");
    }
    for (const key of [
      "z",
      "triggerDistance",
      "speed",
      "startX",
      "endX",
      "halfX",
      "halfZ",
    ]) {
      if (typeof h[key] !== "number" || !Number.isFinite(h[key]))
        throw new Error(`Valor de tráfico inválido: ${key}`);
    }
    const hazard = h as unknown as TrafficHazard;
    if (
      hazard.z < 0 ||
      hazard.triggerDistance <= 0 ||
      hazard.speed <= 0 ||
      hazard.halfX <= 0 ||
      hazard.halfZ <= 0 ||
      hazard.startX === hazard.endX
    ) {
      throw new Error("Dimensiones o movimiento de tráfico inválidos");
    }
    ids.add(hazard.id);
    return { ...hazard };
  });
  return { hazards };
}

export function createTraffic(config: TrafficConfig, seed = 1) {
  const validated = parseTrafficConfig(config);
  if (!Number.isFinite(seed)) throw new Error("Semilla inválida");
  let randomState = seed >>> 0;
  // A seeded, small speed variation makes repeated runs reproducible.
  const speeds = validated.hazards.map((h) => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return h.speed * (0.95 + (randomState / 4294967296) * 0.1);
  });
  const makeInitial = (): Obstacle[] =>
    validated.hazards.map((h) => ({
      id: h.id,
      kind: h.kind,
      x: h.startX,
      z: h.z,
      active: false,
      halfX: h.halfX,
      halfZ: h.halfZ,
      passed: false,
    }));
  let obstacles = makeInitial();
  return {
    update(distance: number, dt: number): Obstacle[] {
      if (
        !Number.isFinite(distance) ||
        distance < 0 ||
        !Number.isFinite(dt) ||
        dt < 0
      )
        throw new Error("Paso de tráfico inválido");
      if (dt > 0)
        obstacles.forEach((obstacle, i) => {
          const hazard = validated.hazards[i];
          if (obstacle.passed) return;
          if (distance > obstacle.z + obstacle.halfZ + 3) {
            markPassed(obstacle);
            return;
          }
          if (distance < hazard.z - hazard.triggerDistance) return;
          obstacle.active = true;
          const direction = Math.sign(hazard.endX - hazard.startX);
          const nextX = obstacle.x + direction * speeds[i] * dt;
          obstacle.x =
            direction > 0
              ? Math.min(nextX, hazard.endX)
              : Math.max(nextX, hazard.endX);
          if (obstacle.x === hazard.endX) {
            markPassed(obstacle);
          }
        });
      return obstacles.map((obstacle) => ({ ...obstacle }));
    },
    reset() {
      obstacles = makeInitial();
    },
  };
}
