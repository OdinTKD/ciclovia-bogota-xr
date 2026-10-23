import { expect, it, vi } from 'vitest';
import { Color, InstancedMesh, Matrix4, Mesh, MeshLambertMaterial, Vector3 } from 'three';
import { assetGeometryStats, createWorld, type RenderTraffic } from '../../src/rendering/scene';

const snapshot = { x: 0, distance: 0, speed: 0, elapsed: 0, weather: 'sun' };
const poolNames = ['car-bodies', 'car-tops', 'car-wheels', 'pedestrian-bodies', 'pedestrian-heads', 'pedestrian-legs'];
const actors: RenderTraffic[] = [
  { id: 'inactive', kind: 'car', x: 4, z: 20, active: false },
  { id: 'ped-a', kind: 'pedestrian', x: -1, z: 32, active: true },
  { id: 'car-a', kind: 'car', x: 1, z: 40, active: true },
  { id: 'car-b', kind: 'car', x: -2, z: 55, active: true },
];

it('compacta los actores visibles sin enviar los huecos del pool al renderer', () => {
  const world = createWorld();
  world.update(snapshot, actors);
  const pools = poolNames.map(name => world.scene.getObjectByName(name) as InstancedMesh);
  expect(pools.map(mesh => mesh.count)).toEqual([2, 2, 4, 1, 1, 2]);
  const matrix = new Matrix4();
  for (const [index, x, z] of [[0, 1, -40], [1, -2, -55]]) {
    pools[0].getMatrixAt(index, matrix);
    const position = new Vector3().setFromMatrixPosition(matrix);
    expect(position.x).toBe(x); expect(position.y).toBeCloseTo(.55); expect(position.z).toBe(z);
  }
  world.update(snapshot, [actors[3], actors[1]]);
  expect(pools[0].count).toBe(1);
  pools[0].getMatrixAt(0, matrix);
  expect(new Vector3().setFromMatrixPosition(matrix).x).toBe(-2);
  expect(new Vector3().setFromMatrixPosition(matrix).z).toBe(-55);
  world.update(snapshot, []);
  expect(pools.every(mesh => mesh.count === 0 && !mesh.visible)).toBe(true);
  world.dispose();
});

it('no reescribe matrices ni bounds de actores quietos o pools vacíos', () => {
  const world = createWorld();
  const pools = poolNames.map(name => world.scene.getObjectByName(name) as InstancedMesh);
  const writes = pools.map(mesh => vi.spyOn(mesh, 'setMatrixAt'));
  const boxes = pools.map(mesh => vi.spyOn(mesh, 'computeBoundingBox'));
  const spheres = pools.map(mesh => vi.spyOn(mesh, 'computeBoundingSphere'));
  world.update(snapshot, []);
  expect(writes.every(spy => spy.mock.calls.length === 0)).toBe(true);
  world.update(snapshot, actors);
  [...writes, ...boxes, ...spheres].forEach(spy => spy.mockClear());
  const versions = pools.map(mesh => mesh.instanceMatrix.version);
  world.update({ ...snapshot, elapsed: 1, distance: 1 }, actors.map(actor => ({ ...actor })));
  expect([...writes, ...boxes, ...spheres].every(spy => spy.mock.calls.length === 0)).toBe(true);
  expect(pools.map(mesh => mesh.instanceMatrix.version)).toEqual(versions);
  world.update(snapshot, actors.map(actor => actor.id === 'car-b' ? { ...actor, x: -.5 } : actor));
  expect(writes.slice(0, 3).map(spy => spy.mock.calls.length)).toEqual([1, 1, 2]);
  expect(writes.slice(3).every(spy => spy.mock.calls.length === 0)).toBe(true);
  expect(boxes.slice(0, 3).every(spy => spy.mock.calls.length === 1)).toBe(true);
  expect(spheres.slice(0, 3).every(spy => spy.mock.calls.length === 1)).toBe(true);
  for (const mesh of pools) expect(Number.isFinite(mesh.boundingSphere!.radius)).toBe(true);
  world.dispose();
});

it('agrupa ciudad estática por color sin quitar geometría ni ventanas planas', () => {
  const world = createWorld();
  const city = world.scene.getObjectByName('environment')!;
  const stats = assetGeometryStats(city);
  expect(stats.drawCalls).toBe(2);
  expect(stats.triangles).toBe(6196);
  const batch = city.getObjectByName('city-static-color-batch') as Mesh;
  expect(batch).toBeInstanceOf(Mesh);
  const material = batch.material as MeshLambertMaterial;
  expect(material.vertexColors).toBe(true); expect(material.color.getHex()).toBe(0xffffff);
  expect(material.map).toBeNull(); expect(material.transparent).toBe(false);
  const colors = batch.geometry.getAttribute('color');
  const palette = new Set<string>();
  for (let i = 0; i < colors.count; i++) palette.add(`${colors.getX(i).toFixed(5)}:${colors.getY(i).toFixed(5)}:${colors.getZ(i).toFixed(5)}`);
  const originalPalette = [0xab6451, 0x755840, 0x397d68, 0x425e60, 0xf9e6b6, 0xf3edb8, 0xf9f3dc, 0xc7b26e];
  expect(palette).toEqual(new Set(originalPalette.map(hex => new Color(hex).toArray().map(value => value.toFixed(5)).join(':'))));
  expect(batch.geometry.boundingBox!.min.toArray()).toEqual([-23.5, 0, -355.5]);
  expect(batch.geometry.boundingBox!.max.toArray()).toEqual([23.5, 14, -50.5]);
  const normals = batch.geometry.getAttribute('normal');
  for (let i = 0; i < normals.count; i++) expect(new Vector3().fromBufferAttribute(normals, i).length()).toBeCloseTo(1, 5);
  const windows = city.children.find(node => node instanceof InstancedMesh) as InstancedMesh;
  expect(windows.geometry.index!.count / 3).toBe(2);
  expect(world.scene.getObjectByName('base-cycleway')).toBeInstanceOf(InstancedMesh);
  expect(world.scene.getObjectByName('boundary-cue')).toBeInstanceOf(InstancedMesh);
  world.dispose();
});
