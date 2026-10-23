import { parseWeather, weatherProfile, type Weather } from "../weather";
import { PASEO_RULES } from "../levels";
export type { Weather } from "../weather";
export interface SimulationConfig {
  routeLength: number;
  maxSpeed: number;
  acceleration: number;
  steering: number;
}
export interface InputState {
  throttle: number;
  steer: number;
  brake: boolean;
}
export interface GameState {
  phase: "ready" | "playing" | "paused" | "finished";
  x: number;
  distance: number;
  speed: number;
  health: number;
  score: number;
  weather: Weather;
  elapsed: number;
  collisions: number;
  finished: boolean;
}
const defaults: SimulationConfig = {
  routeLength: 1200,
  maxSpeed: TRADITIONAL_BIKE.maxSpeed,
  acceleration: TRADITIONAL_BIKE.acceleration,
  steering: TRADITIONAL_BIKE.turnRate,
};
const FIXED_STEP = 1 / 60;
const ROAD_HALF_WIDTH = 2.4;
const ROLLING_RESISTANCE = 0.4;
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Number.isFinite(n) ? n : 0));
const freshState = (weather: Weather): GameState => ({
  phase: "ready",
  x: 0,
  distance: 0,
  speed: 0,
  health: 100,
  score: 0,
  weather,
  elapsed: 0,
  collisions: 0,
  finished: false,
});

export class GameSimulation {
  readonly state: GameState = freshState("sun");
  readonly config: SimulationConfig;
  private accumulator = 0;
  private hitCooldown = 0;
  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = { ...defaults, ...config };
  }
  start() {
    if (this.state.phase === "ready") this.state.phase = "playing";
  }
  pause() {
    if (this.state.phase === "playing") {
      this.state.phase = "paused";
      this.accumulator = 0;
    }
  }
  resume() {
    if (this.state.phase === "paused") this.state.phase = "playing";
  }
  restart() {
    Object.assign(this.state, freshState(this.state.weather), {
      phase: "playing",
    });
    this.accumulator = 0;
    this.hitCooldown = 0;
  }
  setWeather(weather: Weather) {
    this.state.weather = parseWeather(weather);
  }
  hit() {
    if (this.state.phase !== "playing" || this.hitCooldown > 0) return;
    this.state.health = Math.max(0, this.state.health - 25);
    this.state.speed *= 0.35;
    this.state.collisions++;
    this.hitCooldown = 1.5;
    if (this.state.health === 0) {
      this.state.phase = "finished";
      this.state.finished = true;
    }
  }
  update(dt: number, input: InputState) {
    if (this.state.phase !== "playing" || !Number.isFinite(dt) || dt <= 0)
      return;
    this.accumulator += Math.min(dt, 0.25);
    while (
      this.accumulator + 1e-10 >= FIXED_STEP &&
      this.state.phase === "playing"
    ) {
      this.step(FIXED_STEP, input);
      this.accumulator -= FIXED_STEP;
    }
  }
  private step(dt: number, input: InputState) {
    const s = this.state;
    const profile = weatherProfile(s.weather);
    const brake = input.brake ? profile.braking : 0;
    s.speed = clamp(
      s.speed +
        (clamp(input.throttle, 0, 1) * this.config.acceleration -
          ROLLING_RESISTANCE -
          brake) *
          dt,
      0,
      this.config.maxSpeed,
    );
    s.x = clamp(
      s.x +
        clamp(input.steer, -1, 1) *
          this.config.steering *
          profile.grip *
          Math.min(1, s.speed / 3) *
          dt,
      -ROAD_HALF_WIDTH,
      ROAD_HALF_WIDTH,
    );
    s.distance = Math.min(this.config.routeLength, s.distance + s.speed * dt);
    s.elapsed += dt;
    s.score = Math.max(
      0,
      Math.floor(s.distance * PASEO_RULES.pointsPerMeter) -
        s.collisions * PASEO_RULES.collisionPenalty,
    );
    this.hitCooldown = Math.max(0, this.hitCooldown - dt);
    if (s.distance >= this.config.routeLength) {
      s.phase = "finished";
      s.finished = true;
    }
  }
}
export const createSimulation = (config: Partial<SimulationConfig> = {}) =>
  new GameSimulation(config);
import { TRADITIONAL_BIKE } from "../vehicles/catalog";
