import { parseWeather, weatherProfile, type Weather } from "../weather";
import { PASEO_RULES } from "../levels";
import { TRADITIONAL_BIKE } from "../vehicles/catalog";
import { advanceBicycle, freshBicycle, type BicycleState } from "../vehicles/bicycle-controller";
import { createFixedLoop } from "./game-loop";
import type { BicycleContact, PhysicsActorMotion, PhysicsWorld } from "../physics/world";
export type { Weather } from "../weather";
export interface SimulationConfig {
  routeLength: number;
  maxSpeed: number;
  acceleration: number;
  steering: number; // legacy v1 lateral m/s, never interpreted as angle
  stability: number;
}
export interface InputState { throttle: number; steer: number; brake: boolean }
export interface GameState extends BicycleState {
  phase: "ready" | "playing" | "paused" | "finished";
  distance: number;
  health: number;
  score: number;
  weather: Weather;
  elapsed: number;
  collisions: number;
  finished: boolean;
  tick: number;
  lastContact: BicycleContact | null;
}
export interface TrafficTickAdapter {
  step(dt: number, state: Readonly<GameState>): PhysicsActorMotion[];
  reset(): void;
}
const defaults: SimulationConfig = {
  routeLength: 1200,
  maxSpeed: TRADITIONAL_BIKE.maxSpeed,
  acceleration: TRADITIONAL_BIKE.acceleration,
  steering: TRADITIONAL_BIKE.turnRate,
  stability: TRADITIONAL_BIKE.stability,
};
const freshState = (weather: Weather): GameState => ({
  ...freshBicycle(), phase: "ready", distance: 0, health: 100, score: 0, weather,
  elapsed: 0, collisions: 0, finished: false, tick: 0, lastContact: null,
});
const boundaryActors = (z: number): PhysicsActorMotion[] => [-1, 1].map((side) => ({
  id: side < 0 ? "road-left" : "road-right", kind: "boundary",
  from: { x: side * 2.95, z, yaw: 0 }, to: { x: side * 2.95, z, yaw: 0 }, halfX: 0.2, halfZ: 20,
}));
export class GameSimulation {
  readonly state: GameState = freshState("sun");
  readonly config: SimulationConfig;
  private readonly loop = createFixedLoop();
  private hitCooldown = 0;
  private physics?: PhysicsWorld;
  private traffic?: TrafficTickAdapter;
  constructor(config: Partial<SimulationConfig> = {}) { this.config = { ...defaults, ...config }; }
  get interpolationAlpha() { return this.loop.alpha; }
  setWorld(physics: PhysicsWorld, traffic: TrafficTickAdapter) { this.physics = physics; this.traffic = traffic; }
  start() { if (this.state.phase === "ready") this.state.phase = "playing"; }
  pause() { if (this.state.phase === "playing") { this.state.phase = "paused"; this.loop.reset(); } }
  resume() { if (this.state.phase === "paused") this.state.phase = "playing"; }
  restart() {
    Object.assign(this.state, freshState(this.state.weather), { phase: "playing" });
    this.loop.reset(); this.hitCooldown = 0; this.physics?.reset(); this.traffic?.reset();
  }
  setWeather(weather: Weather) { this.state.weather = parseWeather(weather); }
  hit(contact?: BicycleContact) {
    if (this.state.phase !== "playing" || this.hitCooldown > 0) return;
    if (contact && contact.normalSpeed < 0.35) return;
    const frontal = !contact || contact.kind === "frontal";
    const severity = contact ? Math.min(1, contact.normalSpeed / 8) : 1;
    const damage = contact ? Math.round((frontal ? 8 : 2) + (frontal ? 27 : 10) * severity) : 25;
    this.state.health = Math.max(0, this.state.health - damage);
    this.state.speed *= frontal ? 0.35 : 0.85;
    if (contact) {
      const rightX = Math.cos(this.state.yaw), rightZ = Math.sin(this.state.yaw);
      this.state.lateralVelocity = -(contact.normal.x * rightX + contact.normal.z * rightZ) * Math.min(1.5, contact.normalSpeed * 0.15);
      this.state.lastContact = { ...contact, normal: { ...contact.normal } };
    }
    this.state.collisions++; this.hitCooldown = 1.5;
    if (this.state.health === 0) { this.state.phase = "finished"; this.state.finished = true; }
  }
  update(dt: number, input: InputState) {
    if (this.state.phase !== "playing") return;
    this.loop.advance(dt, (fixedDt) => {
      this.step(fixedDt, input);
      return this.state.phase === "playing";
    });
  }
  private step(dt: number, input: InputState) {
    const s = this.state;
    const actors = this.traffic?.step(dt, s) ?? [];
    const proposed = advanceBicycle(s, input, { ...TRADITIONAL_BIKE, maxSpeed: this.config.maxSpeed, acceleration: this.config.acceleration, stability: this.config.stability }, weatherProfile(s.weather), dt);
    const contacts: BicycleContact[] = [];
    if (this.physics) {
      const resolved = this.physics.moveBicycle({ x: s.x, z: s.worldZ, yaw: s.yaw }, { x: proposed.x, z: proposed.worldZ, yaw: proposed.yaw }, [...actors, ...boundaryActors(s.worldZ)], dt);
      proposed.x = resolved.pose.x; proposed.worldZ = resolved.pose.z; proposed.yaw = resolved.pose.yaw;
      // A blocked wheel cannot accumulate invisible forward speed during damage cooldown.
      if (resolved.contacts.length) proposed.speed = Math.min(proposed.speed, Math.max(0, resolved.velocity.x * Math.sin(proposed.yaw) - resolved.velocity.z * Math.cos(proposed.yaw)));
      contacts.push(...resolved.contacts);
      this.physics.stepFixed();
    } else {
      const halfWidth = Math.abs(Math.cos(proposed.yaw)) * 0.35 + Math.abs(Math.sin(proposed.yaw)) * 0.7;
      const centerBound = Math.min(2.4, 2.75 - halfWidth);
      proposed.x = Math.max(-centerBound, Math.min(centerBound, proposed.x));
    }
    Object.assign(s, proposed);
    this.hitCooldown = Math.max(0, this.hitCooldown - dt);
    for (const contact of contacts) {
      if (contact.actorId.startsWith("road-")) {
        // Curbs oppose inward motion, without steering the bicycle automatically.
        s.lateralVelocity = 0;
        if (contact.kind === "frontal") s.speed *= 0.9;
      } else this.hit(contact);
    }
    s.distance = Math.min(this.config.routeLength, Math.max(s.distance, -s.worldZ));
    s.elapsed += dt; s.tick++;
    s.score = Math.max(0, Math.floor(s.distance * PASEO_RULES.pointsPerMeter) - s.collisions * PASEO_RULES.collisionPenalty);
    if (s.distance >= this.config.routeLength) { s.phase = "finished"; s.finished = true; }
  }
}
export const createSimulation = (config: Partial<SimulationConfig> = {}) => new GameSimulation(config);
