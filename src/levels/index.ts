export interface LevelConfig {
  id: string;
  name: string;
  mode: "paseo";
  length: number;
  seed: number;
  traffic: string;
}

export const PASEO_RULES = Object.freeze({
  pointsPerMeter: 10,
  collisionPenalty: 50,
});

const SAFE_CONFIG_PATH = /^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\.json$/;
const isNonemptyText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export function parseLevel(raw: unknown): LevelConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new Error("Nivel inválido");
  const level = raw as Record<string, unknown>;
  if (!isNonemptyText(level.id) || !isNonemptyText(level.name))
    throw new Error("El nivel requiere id y nombre");
  if (level.mode !== "paseo") throw new Error("El MVP admite modo Paseo");
  if (
    typeof level.length !== "number" ||
    !Number.isFinite(level.length) ||
    level.length < 200 ||
    level.length > 3000
  )
    throw new Error("Longitud fuera de rango");
  if (typeof level.seed !== "number" || !Number.isSafeInteger(level.seed))
    throw new Error("Semilla inválida");
  if (
    typeof level.traffic !== "string" ||
    !SAFE_CONFIG_PATH.test(level.traffic)
  )
    throw new Error("Ruta de tráfico insegura");
  return {
    id: level.id,
    name: level.name,
    mode: level.mode,
    length: level.length,
    seed: level.seed,
    traffic: level.traffic,
  };
}
