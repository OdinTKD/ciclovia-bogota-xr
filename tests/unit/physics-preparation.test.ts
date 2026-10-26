import { expect, it, vi } from 'vitest';
import RAPIER from '@dimforge/rapier3d-compat';
import { preparePhysics } from '../../src/physics/preparation';
import { createPhysics, type PhysicsWorld } from '../../src/physics/world';
import { createSimulation } from '../../src/core/simulation';
import { FIXED_STEP } from '../../src/core/game-loop';

function fakeWorld(events: string[], name: string): PhysicsWorld {
  return {
    steps: 0, player: vi.fn(), overlaps: vi.fn(() => false), penetration: vi.fn(() => 0), reset: vi.fn(),
    moveBicycle: vi.fn(from => { events.push(`${name}:move`); return { pose: from, velocity: { x: 0, z: 0 }, contacts: [] }; }),
    stepFixed: vi.fn(() => { events.push(`${name}:step`); }),
    dispose: vi.fn(() => { events.push(`${name}:dispose`); }),
  };
}

it('prepara bordes y un paso en un mundo desechable antes de crear el mundo del jugador', async () => {
  const events: string[] = [], warm = fakeWorld(events, 'warm'), player = fakeWorld(events, 'player');
  const factory = vi.fn(async () => { events.push('create'); return factory.mock.calls.length === 1 ? warm : player; });
  expect(await preparePhysics(factory)).toBe(player);
  expect(events).toEqual(['create', 'warm:move', 'warm:step', 'warm:dispose', 'create']);
  expect(warm.moveBicycle).toHaveBeenCalledWith({ x: 0, z: 0, yaw: 0 }, { x: 0, z: 0, yaw: 0 }, [
    { id: 'road-left', kind: 'boundary', from: { x: -2.95, z: 0, yaw: 0 }, to: { x: -2.95, z: 0, yaw: 0 }, halfX: .2, halfZ: 20 },
    { id: 'road-right', kind: 'boundary', from: { x: 2.95, z: 0, yaw: 0 }, to: { x: 2.95, z: 0, yaw: 0 }, halfX: .2, halfZ: 20 },
    { id: 'preparation-query', kind: 'boundary', from: { x: .555, z: 0, yaw: 0 }, to: { x: .555, z: 0, yaw: 0 }, halfX: .2, halfZ: 1 },
  ], FIXED_STEP);
  expect(warm.stepFixed).toHaveBeenCalledTimes(1);
  expect(player.moveBicycle).not.toHaveBeenCalled(); expect(player.stepFixed).not.toHaveBeenCalled();
  expect(player.reset).not.toHaveBeenCalled(); expect(player.dispose).not.toHaveBeenCalled();
});

it('prepara kernels de barrido y contacto reales aunque el filtro descarte los bordes lejanos', async () => {
  const cast = vi.spyOn(RAPIER.Cuboid.prototype, 'castShape');
  const contact = vi.spyOn(RAPIER.Cuboid.prototype, 'contactShape');
  let player: PhysicsWorld | undefined;
  try {
    player = await preparePhysics();
    expect(cast.mock.calls.length).toBeGreaterThan(0);
    expect(contact.mock.calls.length).toBeGreaterThan(0);
    expect(player.steps).toBe(0);
  } finally { player?.dispose(); cast.mockRestore(); contact.mockRestore(); }
});

it.each(['moveBicycle', 'stepFixed'] as const)('libera el mundo de preparación si falla %s y propaga el error', async method => {
  const events: string[] = [], warm = fakeWorld(events, 'warm'), error = new Error(`warm ${method}`);
  vi.mocked(warm[method]).mockImplementation(() => { throw error; });
  const factory = vi.fn(async () => warm);
  await expect(preparePhysics(factory)).rejects.toBe(error);
  expect(warm.dispose).toHaveBeenCalledTimes(1); expect(factory).toHaveBeenCalledTimes(1);
});

it('propaga fallo de creación del jugador tras haber liberado la preparación', async () => {
  const events: string[] = [], warm = fakeWorld(events, 'warm'), error = new Error('player creation');
  const factory = vi.fn<() => Promise<PhysicsWorld>>().mockResolvedValueOnce(warm).mockRejectedValueOnce(error);
  await expect(preparePhysics(factory)).rejects.toBe(error);
  expect(warm.dispose).toHaveBeenCalledTimes(1);
});

it('entrega Rapier real prístino, sin actores de preparación, y el primer tick normal cuenta exactamente una vez', async () => {
  let lastRawWorld: RAPIER.World | undefined;
  const original = RAPIER.World.prototype.createRigidBody;
  const bodySpy = vi.spyOn(RAPIER.World.prototype, 'createRigidBody').mockImplementation(function (this: RAPIER.World, descriptor) {
    lastRawWorld = this;
    return original.call(this, descriptor);
  });
  let player: PhysicsWorld | undefined;
  try {
    player = await preparePhysics(createPhysics);
    expect(player.steps).toBe(0);
    expect(lastRawWorld!.bodies.len()).toBe(1); expect(lastRawWorld!.colliders.len()).toBe(1);
    expect(player.overlaps(0, 0, .1, .1)).toBe(true);
    expect(player.overlaps(5, 5, .1, .1)).toBe(false);
    const sim = createSimulation();
    sim.setWorld(player, { step: () => [], reset() {} });
    expect(sim.state).toMatchObject({ tick: 0, elapsed: 0, x: 0, worldZ: 0, speed: 0, distance: 0, phase: 'ready' });
    sim.start(); sim.update(FIXED_STEP, { throttle: 1, steer: 0, brake: false });
    expect(player.steps).toBe(1); expect(sim.state.tick).toBe(1);
    expect(sim.state.elapsed).toBe(FIXED_STEP); expect(sim.state.worldZ).toBeLessThan(0);
  } finally { player?.dispose(); bodySpy.mockRestore(); }
});
