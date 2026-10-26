import RAPIER from "@dimforge/rapier3d-compat";
import { FIXED_STEP } from "../core/game-loop";
import { classifyContact, normalToWorld, type BicycleContact } from "./contacts";
import { FLOAT32_MARGIN_FACTOR, mayOverlapSweptBoxes } from './broadphase';
export type { BicycleContact } from "./contacts";

export interface PhysicsPose { x: number; z: number; yaw: number }
export interface PhysicsActorMotion {
  id: string; kind: "car" | "pedestrian" | "boundary";
  from: PhysicsPose; to: PhysicsPose; halfX: number; halfZ: number;
}
export interface BicycleMotion { pose: PhysicsPose; velocity: { x: number; z: number }; contacts: BicycleContact[] }
export interface PhysicsWorld {
  readonly steps: number;
  player(x: number, z: number): void;
  overlaps(x: number, z: number, halfX: number, halfZ: number): boolean;
  moveBicycle(from: PhysicsPose, to: PhysicsPose, actors: PhysicsActorMotion[], dt: number): BicycleMotion;
  penetration(pose: PhysicsPose, actor: PhysicsActorMotion): number;
  stepFixed(): void;
  reset(): void;
  dispose(): void;
}
const SKIN = 0.008;
const HALF_X = 0.35, HALF_Z = 0.7;
const rotation = (yaw: number) => ({ x: 0, y: -Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) });
const position = (pose: PhysicsPose) => ({ x: pose.x, y: 0, z: pose.z });
const interpolate = (a: PhysicsPose, b: PhysicsPose, t: number): PhysicsPose => ({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, yaw: a.yaw + (b.yaw - a.yaw) * t });

export async function createPhysics(): Promise<PhysicsWorld> {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
  world.timestep = FIXED_STEP;
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased());
  const bicycleShape = new RAPIER.Cuboid(HALF_X, 0.8, HALF_Z);
  world.createCollider(RAPIER.ColliderDesc.cuboid(HALF_X, 0.8, HALF_Z), body);
  const actorBodies = new Map<string, { body: RAPIER.RigidBody; collider: RAPIER.Collider; halfX: number; halfZ: number }>();
  let steps = 0;
  let queryPose: PhysicsPose = { x: 0, z: 0, yaw: 0 };
  const shapeFor = (actor: PhysicsActorMotion, padding = 0) => new RAPIER.Cuboid(actor.halfX + padding, 1, actor.halfZ + padding);
  const contact = (pose: PhysicsPose, actor: PhysicsActorMotion, at = actor.to) =>
    mayOverlapSweptBoxes(pose, HALF_X, HALF_Z, at, actor.halfX, actor.halfZ, 0, 0, SKIN)
      ? bicycleShape.contactShape(position(pose), rotation(pose.yaw), shapeFor(actor), position(at), rotation(at.yaw), SKIN)
      : null;
  const syncActors = (actors: PhysicsActorMotion[]) => {
    const ids = new Set(actors.map((actor) => actor.id));
    for (const [id, entry] of actorBodies) if (!ids.has(id)) { world.removeRigidBody(entry.body); actorBodies.delete(id); }
    for (const actor of actors) {
      let entry = actorBodies.get(actor.id);
      if (!entry) {
        const actorBody = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(actor.from.x, 0, actor.from.z));
        entry = { body: actorBody, collider: world.createCollider(RAPIER.ColliderDesc.cuboid(actor.halfX, 1, actor.halfZ), actorBody), halfX: actor.halfX, halfZ: actor.halfZ };
        actorBodies.set(actor.id, entry);
      }
      if (entry.halfX !== actor.halfX || entry.halfZ !== actor.halfZ) {
        entry.collider.setShape(shapeFor(actor)); entry.halfX = actor.halfX; entry.halfZ = actor.halfZ;
      }
      entry.body.setTranslation(position(actor.from), true);
      entry.body.setRotation(rotation(actor.from.yaw), true);
      entry.body.setNextKinematicTranslation(position(actor.to));
      entry.body.setNextKinematicRotation(rotation(actor.to.yaw));
    }
  };
  return {
    get steps() { return steps; },
    player(x, z) { queryPose = { x, z, yaw: 0 }; body.setTranslation(position(queryPose), true); },
    overlaps(x, z, halfX, halfZ) {
      return bicycleShape.intersectsShape(position(queryPose), rotation(queryPose.yaw), new RAPIER.Cuboid(halfX, 1, halfZ), { x, y: 0, z }, rotation(0));
    },
    penetration(pose, actor) { return Math.max(0, -(contact(pose, actor)?.distance ?? 0)); },
    moveBicycle(from, to, actors, dt) {
      if (!Number.isFinite(dt) || dt <= 0) throw new Error("Invalid physics timestep");
      syncActors(actors);
      const contacts = new Map<string, BicycleContact>();
      let pose = { ...from };
      const velocity = { x: (to.x - from.x) / dt, z: (to.z - from.z) / dt };
      const record = (actor: PhysicsActorMotion, normal: { x: number; z: number }, vx: number, vz: number) => {
        const value = classifyContact(actor.id, normal, { x: vx, z: vz }, pose.yaw);
        if (value.normalSpeed > (contacts.get(actor.id)?.normalSpeed ?? -1)) contacts.set(actor.id, value);
      };
      // Rotation is bounded by conservative angular padding within four sweep slices.
      const slices = 4;
      for (let slice = 0; slice < slices; slice++) {
        const t0 = slice / slices, t1 = (slice + 1) / slices, sliceDt = dt / slices;
        const startYaw = from.yaw + (to.yaw - from.yaw) * t0;
        const endYaw = from.yaw + (to.yaw - from.yaw) * t1;
        pose.yaw = startYaw;
        const angularPadding = Math.hypot(HALF_X, HALF_Z) * Math.abs(endYaw - startYaw);
        const sweepShape = new RAPIER.Cuboid(HALF_X + angularPadding, 0.8, HALF_Z + angularPadding);
        let time = 0;
        // Bounded contact loop supports sliding along corners and moving actors.
        for (let iteration = 0; iteration < 5 && time < sliceDt - 1e-8; iteration++) {
          let nearest: { actor: PhysicsActorMotion; toi: number; normal: { x: number; z: number }; avx: number; avz: number } | undefined;
          for (const actor of actors) {
            const at = interpolate(actor.from, actor.to, t0 + time / dt);
            const avx = (actor.to.x - actor.from.x) / dt, avz = (actor.to.z - actor.from.z) / dt;
            const actorPadding = Math.hypot(actor.halfX, actor.halfZ) * Math.abs(actor.to.yaw - actor.from.yaw) / slices;
            const remaining = sliceDt - time;
            // Quantize both velocities conservatively, even when their large common part cancels.
            const velocityRounding = FLOAT32_MARGIN_FACTOR * remaining * (Math.abs(velocity.x) + Math.abs(velocity.z) + Math.abs(avx) + Math.abs(avz));
            if (!mayOverlapSweptBoxes(pose, HALF_X + angularPadding, HALF_Z + angularPadding,
              at, actor.halfX + actorPadding, actor.halfZ + actorPadding,
              (avx - velocity.x) * remaining, (avz - velocity.z) * remaining, SKIN + velocityRounding)) continue;
            const hit = sweepShape.castShape(position(pose), rotation(pose.yaw), { ...velocity, y: 0 }, shapeFor(actor, actorPadding), position(at), rotation(at.yaw), { x: avx, y: 0, z: avz }, SKIN, sliceDt - time, false);
            if (!hit) continue;
            const normal = normalToWorld(hit.normal1, pose.yaw);
            const closing = (velocity.x - avx) * normal.x + (velocity.z - avz) * normal.z;
            if (closing <= 1e-6) continue;
            if (!nearest || hit.time_of_impact < nearest.toi) nearest = { actor, toi: hit.time_of_impact, normal, avx, avz };
          }
          if (!nearest) { pose.x += velocity.x * (sliceDt - time); pose.z += velocity.z * (sliceDt - time); time = sliceDt; break; }
          const { actor, toi, normal, avx, avz } = nearest;
          pose.x += velocity.x * toi; pose.z += velocity.z * toi; time += toi;
          record(actor, normal, velocity.x - avx, velocity.z - avz);
          const closing = (velocity.x - avx) * normal.x + (velocity.z - avz) * normal.z;
          velocity.x -= closing * normal.x; velocity.z -= closing * normal.z;
          pose.x -= normal.x * 0.0001; pose.z -= normal.z * 0.0001;
        }
        pose.yaw = endYaw;
        // Positional recovery handles initial overlap and rotated endpoint.
        for (let iteration = 0; iteration < 4; iteration++) {
          let resolved = false;
          for (const actor of actors) {
            const at = interpolate(actor.from, actor.to, t1), c = contact(pose, actor, at);
            if (!c || c.distance >= 0) continue;
            const avx = (actor.to.x - actor.from.x) / dt, avz = (actor.to.z - actor.from.z) / dt;
            record(actor, c.normal1, velocity.x - avx, velocity.z - avz);
            pose.x -= c.normal1.x * (-c.distance + SKIN); pose.z -= c.normal1.z * (-c.distance + SKIN);
            resolved = true;
          }
          if (!resolved) break;
        }
      }
      queryPose = { ...pose };
      body.setTranslation(position(from), true); body.setRotation(rotation(from.yaw), true);
      body.setNextKinematicTranslation(position(pose)); body.setNextKinematicRotation(rotation(pose.yaw));
      return { pose, velocity, contacts: [...contacts.values()] };
    },
    stepFixed() { world.step(); steps++; },
    reset() {
      steps = 0; queryPose = { x: 0, z: 0, yaw: 0 };
      body.setTranslation(position(queryPose), true); body.setRotation(rotation(0), true);
      body.setNextKinematicTranslation(position(queryPose)); body.setNextKinematicRotation(rotation(0));
      for (const entry of actorBodies.values()) world.removeRigidBody(entry.body);
      actorBodies.clear();
    },
    dispose() { world.free(); },
  };
}
