import { describe, expect, it, vi } from 'vitest';
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import * as T from 'three';
import { createArtSlice, loadArtTextures } from '../../src/rendering/art-slice';
import { buildFoliageMipmaps } from '../../src/rendering/foliage-mipmaps';

function loadedPixelTexture(data = new Uint8Array([90, 120, 50, 255]), width = 1, height = 1) {
  // CPU image fixture substitutes the DOM image while keeping TextureLoader's public return type.
  return new T.Texture({ data, width, height } as unknown as HTMLImageElement);
}

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

/** Decode the actual RGBA PNG bytes, including PNG row filters, without a browser or native test dependency. */
function pngPixels(png: Buffer) {
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  expect(png[24]).toBe(8); expect(png[25]).toBe(6); expect(png[28]).toBe(0);
  const chunks: Buffer[] = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    if (png.toString('ascii', offset + 4, offset + 8) === 'IDAT') chunks.push(png.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const raw = inflateSync(Buffer.concat(chunks)), stride = width * 4, pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const index = y * stride + x, a = x >= 4 ? pixels[index - 4] : 0, b = y ? pixels[index - stride] : 0, c = y && x >= 4 ? pixels[index - stride - 4] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const predicted = filter === 0 ? 0 : filter === 1 ? a : filter === 2 ? b : filter === 3 ? Math.floor((a + b) / 2) : pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      pixels[index] = (raw[y * (stride + 1) + x + 1] + predicted) & 255;
    }
  }
  return { pixels, width, height };
}

// Reproduce ordinary GPU box-filter alpha for the regression when the loader has no explicit mip chain.
function ordinaryMipAlpha(data: Uint8Array, width: number, height: number, levels: number) {
  let current = data;
  for (let level = 0; level < levels; level++) {
    const nextWidth = Math.max(1, Math.floor(width / 2)), nextHeight = Math.max(1, Math.floor(height / 2));
    const next = new Uint8Array(nextWidth * nextHeight * 4);
    for (let y = 0; y < nextHeight; y++) for (let x = 0; x < nextWidth; x++) {
      let alpha = 0;
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) alpha += current[(Math.min(height - 1, y * 2 + dy) * width + Math.min(width - 1, x * 2 + dx)) * 4 + 3];
      next[(y * nextWidth + x) * 4 + 3] = Math.round(alpha / 4);
    }
    current = next; width = nextWidth; height = nextHeight;
  }
  return { data: current, width, height };
}

function alphaCoverage(data: Uint8Array) {
  let count = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] >= 128) count++;
  return count / (data.length / 4);
}

describe('muestra artística original, primeros 40 m', () => {
  it('reserva cuatro brotes por rama en mínimo sin modificar la geometría high', () => {
    const low = createArtSlice({ detail: 'low' });
    const marker = low.group.getObjectByName('tree-canopy')!;
    const foliage = marker.parent as T.Mesh;
    // Low batches canopy + 32 shrubs + 50 litter cards. Each sprig has ten triangles.
    // Measure emitted geometry, rather than trusting a declared density constant.
    const emittedTriangles = foliage.geometry.index!.count / 3;
    const canopyTriangles = emittedTriangles - 32 * 10 - 50 * 2;
    expect(canopyTriangles / 10 / low.metadata.branchEndpoints.length).toBe(4);
    expect(inventory(low.group)).toEqual({ triangles: 12994, calls: 12 });
    expect(inventory(createArtSlice({ detail: 'high' }).group)).toEqual({ triangles: 33364, calls: 18 });
  });
  it('filtra RGB ponderado por alpha, conserva el original y no vuelve opacas áreas transparentes', () => {
    const source = new Uint8Array([240, 100, 20, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const before = source.slice();
    const levels = buildFoliageMipmaps({ data: source, width: 2, height: 2 });
    expect(Array.from(levels[1].data.subarray(0, 3))).toEqual([240, 100, 20]);
    expect(source).toEqual(before);
    const clear = buildFoliageMipmaps({ data: new Uint8Array(16), width: 2, height: 2 });
    expect(Array.from(clear[1].data)).toEqual([0, 0, 0, 0]);
    expect(() => buildFoliageMipmaps({ data: source, width: 3, height: 2 })).toThrow('Invalid foliage RGBA dimensions');
  });

  it('conserva cobertura de la ramilla real al reducir su mipmap a 8×6, sin cerrar los huecos', async () => {
    const { pixels, width, height } = pngPixels(readFileSync(new URL('../../public/assets/environment-alpha3/leaf.png', import.meta.url)));
    const load = vi.spyOn(T.TextureLoader.prototype, 'loadAsync').mockImplementation(async () => loadedPixelTexture(new Uint8Array(pixels), width, height));
    try {
      const original = alphaCoverage(pixels);
      const ordinary = ordinaryMipAlpha(pixels, width, height, 4);
      expect(alphaCoverage(ordinary.data)).toBeLessThan(original - .03);
      const textures = await loadArtTextures('/');
      expect(textures.leaf).toBeInstanceOf(T.DataTexture);
      expect(textures.leaf.generateMipmaps).toBe(false);
      expect(textures.leaf.flipY).toBe(false);
      expect(textures.leaf.mipmaps.reduce((bytes, level) => bytes + (level as { data: Uint8Array }).data.byteLength, 0)).toBeLessThanOrEqual(65536);
      const base = textures.leaf.mipmaps[0] as { data: Uint8Array };
      expect(Array.from(base.data.subarray(0, width * 4))).toEqual(Array.from(pixels.subarray((height - 1) * width * 4)));
      const explicit = textures.leaf.mipmaps[4] as { data: Uint8Array; width: number; height: number } | undefined;
      const mip = explicit ?? ordinary;
      expect([mip.width, mip.height]).toEqual([8, 6]);
      expect(Math.abs(alphaCoverage(mip.data) - original)).toBeLessThan(.04);
      expect(alphaCoverage(mip.data)).toBeLessThan(.30);
      console.info('Foliage alpha mip coverage', textures.leaf.mipmaps.map(level => {
        const rgba = level as { data: Uint8Array; width: number; height: number };
        return [rgba.width, rgba.height, alphaCoverage(rgba.data)];
      }));
    } finally { load.mockRestore(); }
  });
  it('reduce la masa opaca de cada tarjeta de follaje conservando un mapa RGBA de 128×96', () => {
    const png = readFileSync(new URL('../../public/assets/environment-alpha3/leaf.png', import.meta.url));
    const { pixels, width, height } = pngPixels(png);
    expect([width, height]).toEqual([128, 96]);
    let covered = 0;
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i] >= 128) covered++;
    // The old single enormous leaf covered 45.7%. Small separated leaves must leave visible air gaps.
    expect(covered / (width * height)).toBeLessThanOrEqual(.42);
    expect(covered / (width * height)).toBeGreaterThan(.15);
  });

  it('mantiene visible el tallo de los brotes al sustituir la hoja única por un atlas de ramilla', () => {
    const slice = createArtSlice();
    const canopy = slice.group.getObjectByName('tree-canopy') as T.InstancedMesh;
    const uv = canopy.geometry.getAttribute('uv');
    const { pixels, width, height } = pngPixels(readFileSync(new URL('../../public/assets/environment-alpha3/leaf.png', import.meta.url)));
    // First four vertices are the support stem, which samples one opaque texel from the atlas.
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(uv.getX(i) * width), y = Math.floor((1 - uv.getY(i)) * height);
      expect(pixels[(y * width + x) * 4 + 3]).toBeGreaterThan(128);
    }
  });

  it('conserva escala y fase UV del asfalto al cruzar de 40 a 52 metros', () => {
    const slice = createArtSlice();
    const road = slice.group.getObjectByName('asphalt') as T.InstancedMesh;
    const transition = slice.group.getObjectByName('asphalt-transition') as T.Mesh;
    const matrix = new T.Matrix4(); road.getMatrixAt(0, matrix);
    const roadPosition = road.geometry.getAttribute('position'), roadUV = road.geometry.getAttribute('uv'), normal = road.geometry.getAttribute('normal');
    const top = [];
    for (let i = 0; i < roadPosition.count; i++) if (normal.getY(i) > .9) top.push({ point: new T.Vector3().fromBufferAttribute(roadPosition, i).applyMatrix4(matrix), uv: new T.Vector2(roadUV.getX(i), roadUV.getY(i)) });
    const near = top.find(vertex => vertex.point.z > 0 && vertex.point.x < 0)!;
    const far = top.find(vertex => vertex.point.z < -39 && vertex.point.x < 0)!;
    const slope = (far.uv.y - near.uv.y) / (far.point.z - near.point.z);
    const position = transition.geometry.getAttribute('position'), uv = transition.geometry.getAttribute('uv');
    for (let i = 0; i < position.count; i++) {
      const point = new T.Vector3().fromBufferAttribute(position, i).add(transition.position);
      expect(uv.getY(i), `same texture density and phase at z=${point.z}`).toBeCloseTo(near.uv.y + (point.z - near.point.z) * slope, 5);
      expect(uv.getX(i)).toBeCloseTo((point.x + 2.75) / 5.5, 5);
    }
  });

  it('mantiene ladrillos a escala urbana en fachadas de alturas distintas sin texturas mayores', async () => {
    const load = vi.spyOn(T.TextureLoader.prototype, 'loadAsync').mockImplementation(async () => loadedPixelTexture());
    try {
      const textures = await loadArtTextures('/');
      const slice = createArtSlice({ textures });
      for (const transform of slice.metadata.facadeTransforms) {
        const width = transform[5], height = transform[4];
        const brickWidth = width / (5 * textures.brick.repeat.x);
        const courseHeight = height / (14 * textures.brick.repeat.y);
        expect(brickWidth).toBeGreaterThanOrEqual(.18); expect(brickWidth).toBeLessThanOrEqual(.28);
        expect(courseHeight).toBeGreaterThanOrEqual(.05); expect(courseHeight).toBeLessThanOrEqual(.11);
      }
    } finally { load.mockRestore(); }
  });
  it('distribuye el recorte de hoja con canal alpha PNG real para evitar tarjetas negras opacas', () => {
    const png = readFileSync(new URL('../../public/assets/environment-alpha3/leaf.png', import.meta.url));
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    // PNG IHDR colour type 6 = RGBA. RGB (2) ignores alphaTest completely.
    expect(png[25]).toBe(6);
  });
  it('espera las tres texturas licenciadas y propaga errores de carga sin presentar recursos incompletos', async () => {
    const load = vi.spyOn(T.TextureLoader.prototype, 'loadAsync').mockImplementation(async () => loadedPixelTexture());
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
    expect(measured.triangles).toBeLessThanOrEqual(33364);
    expect(measured.calls).toBeLessThanOrEqual(18);
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
    expect(inventory(slice.group).calls).toBeLessThanOrEqual(18);
    expect(inventory(slice.group).triangles).toBeLessThanOrEqual(33364);
    for (const name of ['segmented-concrete-curbs', 'cycle-stencil-wheels', 'balcony-rails-and-grilles', 'tree-trunks', 'fallen-leaves']) expect(slice.group.getObjectByName(name), name).toBeDefined();
    const mesh = slice.group.getObjectByName('batch-urban-steel') as T.Mesh;
    expect(mesh.geometry.getAttribute('color').count).toBe(mesh.geometry.getAttribute('position').count);
    expect(mesh.userData.corridorBounds.length).toBeGreaterThan(10);
  });

  it('ofrece LOD bajo real sin desplazar árboles, fachadas ni superficies del recorrido', () => {
    const high = createArtSlice({ detail: 'high' });
    const low = createArtSlice({ detail: 'low' });
    expect(inventory(high.group).triangles).toBeLessThanOrEqual(33364);
    expect(inventory(high.group).calls).toBeLessThanOrEqual(18);
    expect(inventory(low.group).triangles).toBeLessThanOrEqual(12994);
    expect(inventory(low.group).calls).toBeLessThanOrEqual(12);
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
