import { FIXED_STEP } from '../core/game-loop';
import { createPhysics, type PhysicsActorMotion, type PhysicsWorld } from './world';

// Match the first simulation tick's two road boundaries, without touching its state.
const preparationBoundaries = (): PhysicsActorMotion[] => [-1, 1].map(side => ({
  id: side < 0 ? 'road-left' : 'road-right', kind: 'boundary',
  from: { x: side * 2.95, z: 0, yaw: 0 }, to: { x: side * 2.95, z: 0, yaw: 0 },
  halfX: .2, halfZ: 20,
}));

/** Exercise lazy WASM kernels before ready, then return a completely new player world. */
export async function preparePhysics(factory: () => Promise<PhysicsWorld> = createPhysics): Promise<PhysicsWorld> {
  const preparation = await factory();
  try {
    const actors = preparationBoundaries();
    // Keep narrow-phase kernels exercised after distant boundaries are culled.
    actors.push({ id: 'preparation-query', kind: 'boundary',
      from: { x: .555, z: 0, yaw: 0 }, to: { x: .555, z: 0, yaw: 0 }, halfX: .2, halfZ: 1 });
    preparation.moveBicycle({ x: 0, z: 0, yaw: 0 }, { x: 0, z: 0, yaw: 0 }, actors, FIXED_STEP);
    preparation.stepFixed();
  } finally {
    preparation.dispose();
  }
  return factory();
}
