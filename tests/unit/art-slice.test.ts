import { describe, expect, it, vi } from 'vitest';
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import * as T from 'three';
import { createArtSlice, loadArtTextures } from '../../src/rendering/art-slice';

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
  it('distribuye el recorte de hoja con canal alpha PNG real para evitar tarjetas negras opacas', () => {
    const png = readFileSync(new URL('../../public/assets/environment-alpha3/leaf.png', import.meta.url));
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    // PNG IHDR colour type 6 = RGBA. RGB (2) ignores alphaTest completely.
    expect(png[25]).toBe(6);
  });
  it('espera las tres texturas licenciadas y propaga errores de carga sin presentar recursos incompletos', async () => {
    const load = vi.spyOn(T.TextureLoader.prototype, 'loadAsync').mockImplementation(async () => new T.Texture());
    const textures = await loadArtTextures('/ciclovia-bogota-xr/');
    expect(load).toHaveBeenCalledTimes(3);
    expect(load.mock.calls.map(call => call[0])).toEqual(expect.arrayContaining(['/ciclovia-bogota-xr/assets/environment-alpha3/brick-red.jpg', '/ciclovia-bogota-xr/assets/environment-alpha3/bark.jpg', '/ciclovia-bogota-xr/assets/environment-alpha3/leaf.png']));
    expect(textures.leaf.wrapS).toBe(T.ClampToEdgeWrapping);
    expect(textures.brick.colorSpace).toBe(T.SRGBColorSpace);
    load.mockRejectedValueOnce(new Error('missing licensed texture'));
    await expect(loadArtTextures('/')).rejects.toThrow('missing licensed texture');
    load.mockRestore();
  });

  it('reemplaza las copas sólidas por brotes unidos a los extremos reales de las ramas', () => {
    const slice = createArtSlice();
    const canopy = slice.group.getObjectByName('tree-canopy') as T.InstancedMesh;
    expect(canopy.geometry.type).not.toBe('SphereGeometry');
    expect((canopy.material as T.MeshLambertMaterial).alphaTest).toBeGreaterThan(.1);
    const endpoints = slice.metadata.branchEndpoints.map(point => new T.Vector3(...point));
    const matrix = new T.Matrix4();
    for (let i = 0; i < canopy.count; i++) {
      canopy.getMatrixAt(i, matrix);
      const base = new T.Vector3().setFromMatrixPosition(matrix);
      expect(Math.min(...endpoints.map(endpoint => endpoint.distanceTo(base)))).toBeLessThan(.001);
    }
    expect(slice.group.getObjectByName('leaf-sprays')).toBeUndefined();
  });

  it('funde solo la superficie entre 40 y 52 metros y conserva los mapas compartidos al liberar un LOD', () => {
    const textures = { brick: new T.Texture(), bark: new T.Texture(), leaf: new T.Texture() };
    const disposals = Object.values(textures).map(texture => vi.spyOn(texture, 'dispose'));
    const slice = createArtSlice({ textures });
    const transition = slice.group.getObjectByName('asphalt-transition') as T.Mesh;
    expect(slice.metadata.transitionEndDistance).toBe(52);
    const positions = transition.geometry.getAttribute('position');
    const colors = transition.geometry.getAttribute('color');
    let nearAlpha = -1, farAlpha = -1;
    for (let i = 0; i < positions.count; i++) {
      const worldZ = positions.getZ(i) + transition.position.z;
      if (worldZ === -40) nearAlpha = colors.getW(i);
      if (worldZ === -52) farAlpha = colors.getW(i);
    }
    expect(nearAlpha).toBe(1); expect(farAlpha).toBe(0);
    const material = transition.material as T.MeshLambertMaterial;
    expect(material.transparent).toBe(true);
    const dry = material.color.clone();
    slice.updateWeather('rain'); expect(material.color.equals(dry)).toBe(false);
    slice.updateWeather('sun'); expect(material.color.equals(dry)).toBe(true);
    slice.dispose();
    disposals.forEach(dispose => expect(dispose).not.toHaveBeenCalled());
  });
  it('declara el sector y reserva margen de escena para bicicleta, tráfico y sombras', () => {
    const slice = createArtSlice();
    const measured = inventory(slice.group);
    expect(slice.metadata.startDistance).toBe(0);
    expect(slice.metadata.endDistance).toBe(40);
    expect(measured.triangles).toBeLessThanOrEqual(35000);
    expect(measured.calls).toBeLessThanOrEqual(20);
    expect(slice.metadata.triangles).toBe(measured.triangles);
    expect(slice.metadata.drawCalls).toBe(measured.calls);
    const bounds = new T.Box3().setFromObject(slice.group);
    expect(bounds.max.z).toBeLessThanOrEqual(4.01);
    expect(bounds.min.z).toBeGreaterThanOrEqual(-52.01);
    console.info('Art slice geometry inventory', { triangles: slice.metadata.triangles, drawCalls: slice.metadata.drawCalls, textureBytes: slice.metadata.textureBytes });
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
    const firstBytes = texture(first.group).image.data!;
    const secondBytes = texture(second.group).image.data!;
    expect(Buffer.from(firstBytes.buffer, firstBytes.byteOffset, firstBytes.byteLength).equals(Buffer.from(secondBytes.buffer, secondBytes.byteOffset, secondBytes.byteLength))).toBe(true);
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
    expect(inventory(slice.group).calls).toBeLessThanOrEqual(20);
    expect(inventory(slice.group).triangles).toBeLessThanOrEqual(35000);
    for (const name of ['segmented-concrete-curbs', 'cycle-stencil-wheels', 'balcony-rails-and-grilles', 'tree-trunks', 'fallen-leaves']) expect(slice.group.getObjectByName(name), name).toBeDefined();
    const mesh = slice.group.getObjectByName('batch-urban-steel') as T.Mesh;
    expect(mesh.geometry.getAttribute('color').count).toBe(mesh.geometry.getAttribute('position').count);
    expect(mesh.userData.corridorBounds.length).toBeGreaterThan(10);
  });

  it('ofrece LOD bajo real sin desplazar árboles, fachadas ni superficies del recorrido', () => {
    const high = createArtSlice({ detail: 'high' });
    const low = createArtSlice({ detail: 'low' });
    expect(inventory(high.group).triangles).toBeLessThanOrEqual(35000);
    expect(inventory(high.group).calls).toBeLessThanOrEqual(20);
    expect(inventory(low.group).triangles).toBeLessThanOrEqual(13000);
    expect(inventory(low.group).calls).toBeLessThanOrEqual(14);
    expect(low.metadata.detail).toBe('low');
    expect(high.metadata.detail).toBe('high');
    expect(low.metadata.treeCount).toBe(14);
    expect(low.metadata.facadeCount).toBe(5);
    expect(low.metadata.treeTransforms).toEqual(high.metadata.treeTransforms);
    expect(low.metadata.facadeTransforms).toEqual(high.metadata.facadeTransforms);
    for (const name of ['asphalt', 'brick-sidewalks', 'park-lawn', 'brick-facades']) {
      const original = high.group.getObjectByName(name) as T.InstancedMesh;
      const simplified = low.group.getObjectByName(name) as T.InstancedMesh;
      expect(simplified.instanceMatrix.array).toEqual(original.instanceMatrix.array);
      const originalMap = (original.material as T.MeshStandardMaterial).map as T.DataTexture;
      const simplifiedMap = (simplified.material as T.MeshStandardMaterial).map as T.DataTexture;
      const originalBytes = originalMap.image.data!;
      const simplifiedBytes = simplifiedMap.image.data!;
      const originalBuffer = Buffer.from(originalBytes.buffer, originalBytes.byteOffset, originalBytes.byteLength);
      const simplifiedBuffer = Buffer.from(simplifiedBytes.buffer, simplifiedBytes.byteOffset, simplifiedBytes.byteLength);
      expect(simplifiedBuffer.equals(originalBuffer), `${name}: mismos bytes de textura`).toBe(true);
    }
    low.group.traverse(node => { if (node instanceof T.Mesh) { expect(node.castShadow).toBe(false); expect(node.receiveShadow).toBe(false); } });
    const asphalt = low.group.getObjectByName('asphalt') as T.Mesh;
    const material = asphalt.material as T.MeshStandardMaterial;
    const initialColor = material.color.clone();
    low.updateWeather('rain');
    expect(material.roughness).toBe(.34);
    low.updateWeather('sun');
    expect(material.roughness).toBe(.94);
    expect(material.color.equals(initialColor)).toBe(true);
    let materialDisposals = 0, textureDisposals = 0;
    material.addEventListener('dispose', () => materialDisposals++);
    material.map!.addEventListener('dispose', () => textureDisposals++);
    low.dispose();
    expect(materialDisposals).toBe(1);
    expect(textureDisposals).toBe(1);
    console.info('Low art slice inventory', low.metadata.triangles, low.metadata.drawCalls);
  });
});
