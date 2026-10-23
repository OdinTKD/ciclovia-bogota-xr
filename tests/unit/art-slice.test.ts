import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { createArtSlice } from '../../src/rendering/art-slice';

function inventory(group: T.Object3D) {
  let triangles = 0;
  let calls = 0;
  group.traverse(node => {
    if (!(node instanceof T.Mesh)) return;
    triangles += (node.geometry.index?.count ?? node.geometry.attributes.position.count) / 3 * (node instanceof T.InstancedMesh ? node.count : 1);
    calls += Array.isArray(node.material) ? node.geometry.groups.length : 1;
  });
  return { triangles, calls };
}

describe('muestra artística original, primeros 40 m', () => {
  it('declara el sector y reserva margen de escena para bicicleta, tráfico y sombras', () => {
    const slice = createArtSlice();
    const measured = inventory(slice.group);
    expect(slice.metadata.startDistance).toBe(0);
    expect(slice.metadata.endDistance).toBe(40);
    expect(measured.triangles).toBeLessThanOrEqual(60000);
    expect(measured.calls).toBeLessThanOrEqual(45);
    expect(slice.metadata.triangles).toBe(measured.triangles);
    expect(slice.metadata.drawCalls).toBe(measured.calls);
    const bounds = new T.Box3().setFromObject(slice.group);
    expect(bounds.max.z).toBeLessThanOrEqual(4.01);
    expect(bounds.min.z).toBeGreaterThanOrEqual(-44.01);
    console.info('Art slice geometry inventory', slice.metadata);
  });

  it('cambia humedad y reflejo del asfalto sin multiplicar geometría ni materiales', () => {
    const slice = createArtSlice();
    const asphalt = slice.group.getObjectByName('asphalt') as T.Mesh;
    const material = asphalt.material as T.MeshStandardMaterial;
    const dry = { roughness: material.roughness, color: material.color.clone() };
    const before = inventory(slice.group);
    for (let i = 0; i < 20; i++) slice.updateWeather(i % 2 ? 'sun' : 'rain');
    slice.updateWeather('rain');
    expect(material.roughness).toBeLessThan(dry.roughness);
    expect(material.color.getHSL({ h: 0, s: 0, l: 0 }).l).toBeLessThan(dry.color.getHSL({ h: 0, s: 0, l: 0 }).l);
    expect(inventory(slice.group)).toEqual(before);
    expect(asphalt.material).toBe(material);
    slice.updateWeather('sun');
    expect(material.roughness).toBe(dry.roughness);
    expect(material.color.equals(dry.color)).toBe(true);
  });

  it('mantiene muebles y fachadas fuera del corredor físico y geometrías finitas', () => {
    const slice = createArtSlice();
    slice.group.updateMatrixWorld(true);
    slice.group.traverse(node => {
      if (!(node instanceof T.Mesh)) return;
      const positions = node.geometry.getAttribute('position');
      expect(Array.from(positions.array).every(Number.isFinite), node.name).toBe(true);
      for (const bounds of node.userData.corridorBounds ?? []) {
        expect(bounds.maxX <= -2.75 || bounds.minX >= 2.75, `${node.name} merged source`).toBe(true);
      }
      if (!node.userData.corridorClear) return;
      const local = new T.Box3().setFromBufferAttribute(positions);
      const matrix = new T.Matrix4();
      for (let i = 0; i < (node instanceof T.InstancedMesh ? node.count : 1); i++) {
        if (node instanceof T.InstancedMesh) node.getMatrixAt(i, matrix);
        else matrix.copy(node.matrixWorld);
        const bounds = local.clone().applyMatrix4(matrix);
        expect(bounds.max.x <= -2.75 || bounds.min.x >= 2.75, `${node.name}, instance ${i}`).toBe(true);
      }
    });
  });

  it('produce texturas propias reproducibles, con mipmaps y presupuesto de memoria acotado', () => {
    const first = createArtSlice();
    const second = createArtSlice();
    const texture = (group: T.Group) => ((group.getObjectByName('asphalt') as T.Mesh).material as T.MeshStandardMaterial).map! as T.DataTexture;
    expect(texture(first.group).image.data).toEqual(texture(second.group).image.data);
    expect(texture(first.group).generateMipmaps).toBe(true);
    expect(first.metadata.textureBytes).toBeLessThanOrEqual(8 * 1024 * 1024);
    expect(first.group.getObjectByName('tree-canopy')).toBeDefined();
    expect(first.group.getObjectByName('brick-facades')).toBeDefined();
  });

  it('reserva PBR y filtrado de sombras para las superficies que necesitan reflejo y apoyo', () => {
    const slice = createArtSlice();
    const pbrMaterials = new Set<T.Material>();
    let shadowReceivers = 0;
    slice.group.traverse(node => {
      if (!(node instanceof T.Mesh)) return;
      if (node.material instanceof T.MeshStandardMaterial) pbrMaterials.add(node.material);
      if (node.receiveShadow) shadowReceivers++;
    });
    expect(pbrMaterials.size).toBeLessThanOrEqual(5);
    expect(shadowReceivers).toBeLessThanOrEqual(7);
    const canopy = slice.group.getObjectByName('tree-canopy') as T.Mesh;
    expect(canopy.material).toBeInstanceOf(T.MeshLambertMaterial);
    expect(canopy.receiveShadow).toBe(false);
    expect((slice.group.getObjectByName('asphalt') as T.Mesh).receiveShadow).toBe(true);
  });

  it('agrupa el arte estático sin perder geometría, mapas ni nombres de inspección', () => {
    const slice = createArtSlice();
    expect(inventory(slice.group).calls).toBeLessThanOrEqual(17);
    expect(inventory(slice.group).triangles).toBe(27500);
    for (const name of ['segmented-concrete-curbs', 'cycle-stencil-wheels', 'balcony-rails-and-grilles', 'tree-trunks', 'fallen-leaves']) expect(slice.group.getObjectByName(name), name).toBeDefined();
    const mesh = slice.group.getObjectByName('batch-urban-steel') as T.Mesh;
    expect(mesh.geometry.getAttribute('color').count).toBe(mesh.geometry.getAttribute('position').count);
    expect(mesh.userData.corridorBounds.length).toBeGreaterThan(10);
  });
});
