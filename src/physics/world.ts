import RAPIER from "@dimforge/rapier3d-compat";

export interface PhysicsWorld {
  player(x: number, z: number): void;
  overlaps(x: number, z: number, halfX: number, halfZ: number): boolean;
  dispose(): void;
}

export async function createPhysics(): Promise<PhysicsWorld> {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.kinematicPositionBased(),
  );
  const bicycle = world.createCollider(
    RAPIER.ColliderDesc.cuboid(0.35, 0.8, 0.7),
    body,
  );
  // Rapier excludes kinematic/fixed pairs by default: bicycle sensors require them.
  const sensorDescription = RAPIER.ColliderDesc.cuboid(1, 1, 1)
    .setSensor(true)
    .setActiveCollisionTypes(RAPIER.ActiveCollisionTypes.ALL);
  const sensor = world.createCollider(sensorDescription);
  return {
    player(x, z) {
      body.setTranslation({ x, y: 0, z }, true);
    },
    overlaps(x, z, halfX, halfZ) {
      sensor.setShape(new RAPIER.Cuboid(halfX, 1, halfZ));
      sensor.setTranslation({ x, y: 0, z });
      world.step();
      return world.intersectionPair(bicycle, sensor);
    },
    dispose() {
      world.free();
    },
  };
}
