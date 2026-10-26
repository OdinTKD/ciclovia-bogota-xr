import { expect, it } from 'vitest';
import { BoxGeometry, Group, Mesh, MeshLambertMaterial, Texture } from 'three';
import { createWorld } from '../../src/rendering/scene';
import { applyRenderQuality } from '../../src/rendering/material-lighting';
import { readFileSync } from 'node:fs';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { assetGeometryStats } from '../../src/rendering/scene';
import { OPAQUE_DEPTH_ORDER, prioritizeOpaqueDepth } from '../../src/rendering/opaque-depth-order';

it('dibuja primero la bici y el suelo artístico para rechazar fragmentos ocultos de las bases', () => {
  const world = createWorld();
  const bicycle = world.scene.getObjectByName('bicycle')!;
  const base = world.scene.getObjectByName('base-cycleway') as Mesh;
  const bicycleMeshes: Mesh[] = [];
  bicycle.traverse(node => { if (node instanceof Mesh) bicycleMeshes.push(node); });
  expect(bicycleMeshes.length).toBeGreaterThan(0);
  for (const sliceName of ['art-slice', 'art-slice-low']) {
    const slice = world.scene.getObjectByName(sliceName)!;
    const road = slice.getObjectByName('asphalt') as Mesh;
    expect(road.renderOrder).toBeLessThan(base.renderOrder);
    for (const mesh of bicycleMeshes) expect(mesh.renderOrder).toBeLessThan(road.renderOrder);
    expect(slice.renderOrder).toBe(0);
    const transition = slice.getObjectByName('asphalt-transition') as Mesh;
    expect(transition.renderOrder).toBe(0);
    const material = transition.material as MeshLambertMaterial;
    expect(material.transparent).toBe(true); expect(material.depthWrite).toBe(false);
  }
  const before = bicycleMeshes.map(mesh => ({ geometry: mesh.geometry, order: mesh.renderOrder }));
  const reflection = new Texture();
  for (const ratio of [.75, 1]) {
    applyRenderQuality({ shadowMap: { enabled: true } }, world.scene, reflection, ratio);
    bicycleMeshes.forEach((mesh, index) => { expect(mesh.geometry).toBe(before[index].geometry); expect(mesh.renderOrder).toBe(before[index].order); });
  }
  world.dispose(); reflection.dispose();
});

it('la prioridad conserva blending, depth y grupos; excluye objetos sin oclusión opaca', async () => {
  const group = new Group(); group.renderOrder = 7;
  const variants = [
    new MeshLambertMaterial({ color: 0x813f39 }),
    new MeshLambertMaterial({ transparent: true, opacity: .5 }),
    new MeshLambertMaterial({ depthWrite: false }),
    new MeshLambertMaterial({ depthTest: false }),
  ];
  const meshes = variants.map(material => new Mesh(new BoxGeometry(), material));
  meshes.forEach(mesh => group.add(mesh));
  const mixed = new Mesh(new BoxGeometry(), [variants[0], variants[1]]); group.add(mixed);
  const original = variants.map(material => ({ color: material.color.getHex(), transparent: material.transparent, depthTest: material.depthTest, depthWrite: material.depthWrite, opacity: material.opacity }));
  prioritizeOpaqueDepth(group, -20);
  expect(meshes.map(mesh => mesh.renderOrder)).toEqual([-20, 0, 0, 0]);
  expect(mixed.renderOrder).toBe(0); expect(group.renderOrder).toBe(7);
  expect(variants.map(material => ({ color: material.color.getHex(), transparent: material.transparent, depthTest: material.depthTest, depthWrite: material.depthWrite, opacity: material.opacity }))).toEqual(original);
  meshes.forEach(mesh => mesh.geometry.dispose()); mixed.geometry.dispose(); variants.forEach(material => material.dispose());
});

it('dibuja follaje recortado después de los sólidos del mundo en ambos perfiles sin cambiar recursos', () => {
  const world = createWorld();
  const base = world.scene.getObjectByName('base-cycleway') as Mesh;
  const reflection = new Texture();
  const inventory = assetGeometryStats(world.scene);
  for (const ratio of [.75, 1]) {
    applyRenderQuality({ shadowMap: { enabled: true } }, world.scene, reflection, ratio);
    for (const sliceName of ['art-slice', 'art-slice-low']) {
      const slice = world.scene.getObjectByName(sliceName)!;
      const cutouts: Mesh[] = [];
      slice.traverse(node => {
        if (!(node instanceof Mesh)) return;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        if (materials.some(material => material.alphaTest > 0)) cutouts.push(node);
      });
      expect(cutouts.length).toBeGreaterThan(0);
      for (const cutout of cutouts) {
        expect(cutout.renderOrder).toBeGreaterThan(base.renderOrder);
        const material = cutout.material as MeshLambertMaterial;
        expect(material.transparent).toBe(false);
        expect(material.depthTest).toBe(true); expect(material.depthWrite).toBe(true);
      }
    }
    expect(assetGeometryStats(world.scene)).toEqual(inventory);
  }
  world.dispose(); reflection.dispose();
});

it('solo cambia el orden de alphaTest opaco; conserva mapas, geometría, transforms y mezclas transparentes', () => {
  const root = new Group();
  const map = new Texture(), geometry = new BoxGeometry();
  const solid = new MeshLambertMaterial({ color: 0x813f39 });
  const cutout = new MeshLambertMaterial({ alphaTest: .5, map });
  const transparent = new MeshLambertMaterial({ alphaTest: .5, transparent: true, opacity: .6 });
  const noWrite = new MeshLambertMaterial({ alphaTest: .5, depthWrite: false });
  const noTest = new MeshLambertMaterial({ alphaTest: .5, depthTest: false });
  const materials = [solid, cutout, transparent, noWrite, noTest];
  const meshes = [solid, cutout, transparent, noWrite, noTest, [solid, cutout], [cutout, transparent]]
    .map(material => new Mesh(geometry, material));
  meshes.forEach(mesh => { mesh.position.set(1, 2, 3); root.add(mesh); });
  const snapshots = materials.map(material => material.toJSON());
  prioritizeOpaqueDepth(root, OPAQUE_DEPTH_ORDER.artSlice);
  expect(meshes[0].renderOrder).toBe(OPAQUE_DEPTH_ORDER.artSlice);
  expect(meshes[1].renderOrder).toBeGreaterThan(0);
  expect(meshes[5].renderOrder).toBe(meshes[1].renderOrder);
  for (const index of [2, 3, 4, 6]) expect(meshes[index].renderOrder).toBe(0);
  expect(materials.map(material => material.toJSON())).toEqual(snapshots);
  expect(cutout.map).toBe(map);
  for (const mesh of meshes) {
    expect(mesh.geometry).toBe(geometry);
    expect(mesh.position.toArray()).toEqual([1, 2, 3]);
  }
  geometry.dispose(); map.dispose(); materials.forEach(material => material.dispose());
});

it('el GLB real conserva materiales, buffers, transforms e inventario al adelantar su dibujo', async () => {
  const bytes = readFileSync('public/assets/models/bicycle-rider.glb');
  const asset = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const beforeStats = assetGeometryStats(asset.scene);
  const before: Array<{ mesh: Mesh; material: Mesh['material']; geometry: Mesh['geometry']; positionBuffer: unknown; colorsBuffer: unknown; transform: number[] }> = [];
  asset.scene.traverse(node => {
    if (node instanceof Mesh) before.push({ mesh: node, material: node.material, geometry: node.geometry,
      positionBuffer: node.geometry.getAttribute('position').array, colorsBuffer: node.geometry.getAttribute('color').array,
      transform: [...node.position.toArray(), ...node.quaternion.toArray(), ...node.scale.toArray()] });
  });
  expect(beforeStats.drawCalls).toBe(11); expect(beforeStats.triangles).toBe(10516);
  prioritizeOpaqueDepth(asset.scene, OPAQUE_DEPTH_ORDER.bicycle);
  expect(assetGeometryStats(asset.scene)).toEqual(beforeStats);
  for (const saved of before) {
    expect(saved.mesh.renderOrder).toBeLessThan(OPAQUE_DEPTH_ORDER.artSlice);
    expect(saved.mesh.material).toBe(saved.material); expect(saved.mesh.geometry).toBe(saved.geometry);
    expect(saved.mesh.geometry.getAttribute('position').array).toBe(saved.positionBuffer);
    expect(saved.mesh.geometry.getAttribute('color').array).toBe(saved.colorsBuffer);
    expect([...saved.mesh.position.toArray(), ...saved.mesh.quaternion.toArray(), ...saved.mesh.scale.toArray()]).toEqual(saved.transform);
  }
  const geometries = new Set(before.map(saved => saved.geometry));
  const materials = new Set(before.flatMap(saved => Array.isArray(saved.material) ? saved.material : [saved.material]));
  geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose());
});
