import type { VehicleStats } from "./catalog";
import type { WeatherProfile } from "../weather";
export interface BicycleState {
  x: number; worldZ: number; speed: number;
  yaw: number; // positive turns right; initial forward is -Z
  steeringAngle: number; roll: number; lateralVelocity: number;
}
export interface BicycleInput { throttle: number; steer: number; brake: boolean }
export const freshBicycle = (): BicycleState => ({ x: 0, worldZ: 0, speed: 0, yaw: 0, steeringAngle: 0, roll: 0, lateralVelocity: 0 });
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Number.isFinite(n) ? n : 0));
const approach = (value: number, target: number, rate: number, dt: number) => value + (target - value) * (1 - Math.exp(-rate * dt));
/** Pure oriented bicycle; collision response belongs to the physics adapter. */
export function advanceBicycle(state: BicycleState, input: BicycleInput, stats: Readonly<VehicleStats>, weather: WeatherProfile, dt: number): BicycleState {
  const brake = input.brake ? weather.braking : 0;
  const speed = clamp(state.speed + (clamp(input.throttle, 0, 1) * stats.acceleration - 0.4 - brake) * dt, 0, stats.maxSpeed);
  const steeringAngle = approach(state.steeringAngle, clamp(input.steer, -1, 1) * stats.maxSteeringAngle, stats.steeringResponse, dt);
  const rawYawRate = speed * Math.tan(steeringAngle) / stats.wheelbase;
  const yawRateLimit = stats.maximumLateralAcceleration * weather.grip / Math.max(speed, 0.1);
  const yawRate = speed < 0.01 ? 0 : clamp(rawYawRate, -yawRateLimit, yawRateLimit);
  const yaw = state.yaw + yawRate * dt, midYaw = (state.yaw + yaw) / 2;
  const lateralVelocity = state.lateralVelocity * Math.exp(-(1 + 7 * clamp(stats.stability, 0, 1)) * weather.grip * dt);
  const rollTarget = clamp(Math.atan2(speed * yawRate, 9.81), -0.3, 0.3);
  return {
    speed, yaw, steeringAngle, lateralVelocity,
    x: state.x + (Math.sin(midYaw) * speed + Math.cos(midYaw) * lateralVelocity) * dt,
    worldZ: state.worldZ + (-Math.cos(midYaw) * speed + Math.sin(midYaw) * lateralVelocity) * dt,
    roll: approach(state.roll, rollTarget, 4 + stats.stability * 6, dt),
  };
}
