import { expect, it, vi } from 'vitest';
import RAPIER from '@dimforge/rapier3d-compat';
import * as broadphase from '../../src/physics/broadphase';
import { createPhysics, type PhysicsActorMotion } from '../../src/physics/world';
import { FIXED_STEP } from '../../src/core/game-loop';

const pose = (x = 0, z = 0, yaw = 0) => ({ x, z, yaw });
const position = (p: ReturnType<typeof pose>) => ({ x: p.x, y: 0, z: p.z });
const rotation = (yaw: number) => ({ x: 0, y: -Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) });
const bounds: PhysicsActorMotion[] = [-1, 1].map(side => ({
  id: `road-${side}`, kind: 'boundary', from: pose(side * 2.95), to: pose(side * 2.95), halfX: .2, halfZ: 20,
}));

it('evita ocho barridos y ocho contactos lejanos por tick sin cambiar movimiento ni pasos', async () => {
  const physics = await createPhysics();
  const cast = vi.spyOn(RAPIER.Cuboid.prototype, 'castShape');
  const contact = vi.spyOn(RAPIER.Cuboid.prototype, 'contactShape');
  try {
    const result = physics.moveBicycle(pose(), pose(0, -.1), bounds, FIXED_STEP);
    expect(cast).toHaveBeenCalledTimes(0); expect(contact).toHaveBeenCalledTimes(0);
    expect(result.pose).toEqual(pose(0, -.1)); expect(result.contacts).toEqual([]);
    expect(physics.steps).toBe(0); physics.stepFixed(); expect(physics.steps).toBe(1);
  } finally { cast.mockRestore(); contact.mockRestore(); physics.dispose(); }
});

it('rechaza solo separación inequívoca y conserva cruces, rotaciones, SKIN y valores dudosos', () => {
  const test = broadphase.mayOverlapSweptBoxes;
  expect(test(pose(), .35, .7, pose(2.95), .2, 20)).toBe(false);
  expect(test(pose(), .35, .7, pose(-3), .3, .3, 6, 0, .008)).toBe(true);
  expect(test(pose(), .35, .7, pose(.558), .2, 20, 0, 0, .008)).toBe(true);
  expect(test(pose(0, 0, Math.PI / 2), .35, .7, pose(.8), .2, 20)).toBe(true);
  expect(test(pose(), .35, .7, pose(1, 1, Math.PI / 4), 1, .1)).toBe(true);
  expect(test(pose(), .35, .7, pose(NaN), .2, 20)).toBe(true);
  expect(test(pose(), .35, .7, pose(3), .2, 20, Infinity)).toBe(true);
  expect(test(pose(), -.35, .7, pose(3), .2, 20)).toBe(true);
});

it('retiene una tangencia que float32 aproxima dentro de SKIN cerca de z=1200', async () => {
  await RAPIER.init();
  const a = pose(0, 1200.00007), b = pose(0, a.z + .7 + .3 + .00801);
  expect(b.z - a.z).toBeGreaterThan(.7 + .3 + .008);
  const contact = new RAPIER.Cuboid(.35, .8, .7).contactShape(position(a), rotation(0),
    new RAPIER.Cuboid(.2, 1, .3), position(b), rotation(0), .008);
  expect(contact).not.toBeNull();
  expect(broadphase.mayOverlapSweptBoxes(a, .35, .7, b, .2, .3, 0, 0, .008)).toBe(true);
});

it('oráculo Rapier determinista: ningún contacto ni barrido positivo se descarta con rotación y padding', async () => {
  await RAPIER.init();
  let seed = 425916;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  let hits = 0, contacts = 0, rejected = 0;
  for (let index = 0; index < 600; index++) {
    const a = pose((random() - .5) * 20, index % 2 ? -1200 : 0, (random() - .5) * Math.PI * 2);
    const b = pose(a.x + (random() - .5) * 8, a.z + (random() - .5) * 8, (random() - .5) * Math.PI * 2);
    const paddingA = Math.hypot(.35, .7) * random() * .15;
    const halfAX = .35 + paddingA, halfAZ = .7 + paddingA;
    const halfBX = .1 + random() * 2, halfBZ = .1 + random() * 2;
    const paddingB = Math.hypot(halfBX, halfBZ) * random() * .15;
    const deltaX = (random() - .5) * 12, deltaZ = (random() - .5) * 12;
    const shapeA = new RAPIER.Cuboid(halfAX, .8, halfAZ);
    const shapeB = new RAPIER.Cuboid(halfBX + paddingB, 1, halfBZ + paddingB);
    const contact = shapeA.contactShape(position(a), rotation(a.yaw), shapeB, position(b), rotation(b.yaw), .008);
    const velocityX = index % 3 ? 37 : 1e6, velocityZ = index % 3 ? -11 : -1e6;
    const velocityRounding = 1e-6 * (Math.abs(velocityX) + Math.abs(velocityZ) + Math.abs(velocityX + deltaX) + Math.abs(velocityZ + deltaZ));
    const hit = shapeA.castShape(position(a), rotation(a.yaw), { x: velocityX, y: 0, z: velocityZ }, shapeB,
      position(b), rotation(b.yaw), { x: velocityX + deltaX, y: 0, z: velocityZ + deltaZ }, .008, 1, false);
    const candidate = broadphase.mayOverlapSweptBoxes(a, halfAX, halfAZ, b, halfBX + paddingB, halfBZ + paddingB, deltaX, deltaZ, .008 + velocityRounding);
    if (!candidate) rejected++;
    if (hit) { hits++; expect(candidate, `cast ${index}`).toBe(true); }
    if (contact) {
      contacts++;
      expect(broadphase.mayOverlapSweptBoxes(a, halfAX, halfAZ, b, halfBX + paddingB, halfBZ + paddingB, 0, 0, .008), `contact ${index}`).toBe(true);
    }
  }
  expect(hits).toBeGreaterThan(100); expect(contacts).toBeGreaterThan(40); expect(rejected).toBeGreaterThan(50);
});

it('trayectorias completas coinciden con las consultas Rapier sin filtro: frente, roce, cruce y recuperación', async () => {
  async function trace(filtered: boolean) {
    const bypass = filtered ? undefined : vi.spyOn(broadphase, 'mayOverlapSweptBoxes').mockReturnValue(true);
    const result = [];
    try {
      for (const kind of ['front', 'side', 'crossing', 'overlap'] as const) {
        const physics = await createPhysics();
        let current = kind === 'overlap' ? pose(.5, -1, .2) : pose();
        try {
          for (let tick = 0; tick < 40; tick++) {
            const actor: PhysicsActorMotion = kind === 'front'
              ? { id: kind, kind: 'car', from: pose(0, -2, .25), to: pose(0, -2, .25), halfX: 2, halfZ: .05 }
              : kind === 'crossing'
                ? { id: kind, kind: 'pedestrian', from: pose(-3 + tick * .3, -.5), to: pose(-2.7 + tick * .3, -.5), halfX: .3, halfZ: .3 }
                : { id: kind, kind: 'car', from: pose(.8, -2, .15), to: pose(.8, -2, .15), halfX: .1, halfZ: 3 };
            const next = physics.moveBicycle(current, pose(current.x + .025, current.z - .12, current.yaw + .002), [...bounds, actor], FIXED_STEP);
            physics.stepFixed(); current = next.pose; result.push(next);
          }
        } finally { physics.dispose(); }
      }
      return result;
    } finally { bypass?.mockRestore(); }
  }
  const baseline = await trace(false), filtered = await trace(true);
  expect(filtered).toEqual(baseline);
});
