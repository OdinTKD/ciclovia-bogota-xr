import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

type Placement = { position: T.Vector3; scale: T.Vector3; rotation?: T.Quaternion; color?: number };
type Surface = 'asphalt' | 'brick' | 'concrete' | 'paving' | 'bark' | 'leaf' | 'grass';
const SECTOR_LENGTH = 40;
const UP = new T.Vector3(0, 1, 0);
const SHADOW_RECEIVERS = new Set(['asphalt', 'brick-sidewalks', 'park-lawn', 'segmented-concrete-curbs', 'brick-facades', 'facade-concrete']);

export interface ArtTextures { brick: T.Texture; bark: T.Texture; leaf: T.Texture }

/** Shared, caller-owned CC0 maps. Failure is explicit; boot must not silently downgrade assets. */
export async function loadArtTextures(baseUrl: string): Promise<ArtTextures> {
  const loader = new T.TextureLoader();
  const base = `${baseUrl.replace(/\/$/, '')}/assets/environment-alpha3/`;
  const results = await Promise.allSettled(['brick-red.jpg', 'bark.jpg', 'leaf.png'].map(file => loader.loadAsync(base + file)));
  const failed = results.find(result => result.status === 'rejected');
  if (failed?.status === 'rejected') {
    results.forEach(result => { if (result.status === 'fulfilled') result.value.dispose(); });
    throw failed.reason;
  }
  const [brick, bark, leaf] = results.map(result => (result as PromiseFulfilledResult<T.Texture>).value);
  for (const texture of [brick, bark, leaf]) {
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
  }
  brick.name = 'polyhaven-brick-wall-001'; brick.repeat.set(3, 3);
  bark.name = 'polyhaven-bark-brown-02'; bark.repeat.set(1, 3);
  leaf.name = 'polyhaven-tree-small-02-leaf'; leaf.wrapS = leaf.wrapT = T.ClampToEdgeWrapping;
  return { brick, bark, leaf };
}

/** Each leaf grows from a visible stem; there are no disconnected floating leaf planes. */
function makeLeafSprig(low: boolean) {
  const parts: T.BufferGeometry[] = [];
  const stem = new T.PlaneGeometry(.018, 1.2).translate(0, .6, 0);
  const uv = stem.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) uv.setXY(i, .5, .5);
  parts.push(stem);
  for (let i = 0; i < (low ? 4 : 8); i++) {
    const side = i % 2 ? 1 : -1;
    const leaf = new T.PlaneGeometry(.70, .36, low ? 1 : 2, 1).translate(.35, 0, 0);
    const positions = leaf.getAttribute('position');
    for (let v = 0; v < positions.count; v++) positions.setZ(v, Math.sin(positions.getX(v) * Math.PI / .70) * .07);
    leaf.rotateZ(side > 0 ? .35 : Math.PI - .35).rotateY(side * .28).translate(0, .18 + Math.floor(i / 2) * (low ? .42 : .24), 0);
    leaf.computeVertexNormals(); parts.push(leaf);
  }
  const geometry = mergeGeometries(parts, false)!;
  parts.forEach(part => part.dispose());
  return geometry;
}

function estimatedTextureBytes(texture: T.Texture) {
  const image = texture.image as { data?: ArrayBufferView; width?: number; height?: number } | undefined;
  return (image?.data?.byteLength ?? (image?.width ?? 0) * (image?.height ?? 0) * 4) * 4 / 3;
}

// Original deterministic surface recipes: no photos, downloaded maps or copied artwork.
function makeTexture(surface: Surface, repeatX = 1, repeatY = 1) {
  const size = surface === 'leaf' ? 64 : 256;
  const bytes = new Uint8Array(size * size * 4);
  const hash = (x: number, y: number) => {
    const value = Math.sin(x * 127.1 + y * 311.7 + 23.16) * 43758.5453;
    return value - Math.floor(value);
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const grain = (hash(x, y) - .5) * 30;
    let r = 130, g = 127, b = 115, alpha = 255;
    if (surface === 'asphalt') {
      const grain = (hash(x, y) - .5) * 38;
      const pebble = hash(x * 3, y * 7) > .965 ? 24 : 0;
      const worn = Math.sin(x * .028) * Math.cos(y * .051) * 8;
      r = 95 + grain + pebble + worn; g = r - 1; b = r - 5;
      const crack = Math.abs((x + 5 * Math.sin(y * .12) + 3 * Math.sin(y * .05)) % 124 - 62) < 1.25;
      if (crack) { r *= .48; g *= .48; b *= .48; }
    } else if (surface === 'brick' || surface === 'paving') {
      const rowSize = surface === 'brick' ? 12 : 32;
      const row = Math.floor(y / rowSize);
      const colWidth = rowSize * 3;
      const shiftedX = x + (row % 2) * colWidth / 2;
      const mortar = y % rowSize < 1.6 || shiftedX % colWidth < 1.8;
      const brickVariation = hash(Math.floor(shiftedX / colWidth), row) * 28;
      r = mortar ? 116 : 132 + brickVariation + grain;
      g = mortar ? 111 : 73 + brickVariation * .45 + grain * .6;
      b = mortar ? 96 : 48 + brickVariation * .4 + grain * .5;
      if (!mortar && y % rowSize > rowSize - 3) { r *= .77; g *= .77; b *= .77; }
    } else if (surface === 'grass') {
      const blade = Math.sin(x * 1.9 + Math.sin(y * .2)) * Math.sin(y * .9);
      const dryPatch = Math.sin(x * .031) * Math.cos(y * .039) * 18;
      r = 85 + grain + blade * 16 + dryPatch;
      g = 105 + grain + blade * 22 + dryPatch * .45;
      b = 54 + grain * .5 + blade * 9;
    } else if (surface === 'bark') {
      const furrow = Math.sin(x * .19 + Math.sin(y * .04)) * 22 + Math.sin(x * .59) * 11;
      r = 89 + furrow + grain; g = 75 + furrow * .8 + grain; b = 59 + furrow * .55 + grain;
    } else if (surface === 'leaf') {
      const nx = (x / (size - 1) - .5) * 2, ny = y / (size - 1);
      const width = Math.sin(ny * Math.PI) * .83;
      alpha = Math.abs(nx) < width ? 255 : 0;
      const vein = Math.abs(nx) < .035 || Math.abs((ny + Math.abs(nx) * .45) * 9 % 1 - .5) < .06;
      r = (vein ? 93 : 61) + grain * .25;
      g = (vein ? 120 : 88) + grain * .4;
      b = (vein ? 49 : 37) + grain * .15;
    } else {
      r += grain; g += grain; b += grain;
      const seam = x < 3 || y < 3;
      if (seam) { r *= .65; g *= .65; b *= .65; }
    }
    const offset = (y * size + x) * 4;
    bytes.set([r, g, b, alpha].map(value => Math.max(0, Math.min(255, value))), offset);
  }
  const texture = new T.DataTexture(bytes, size, size, T.RGBAFormat);
  texture.name = `original-${surface}`;
  texture.colorSpace = T.SRGBColorSpace;
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.magFilter = T.LinearFilter;
  texture.minFilter = T.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function placement(x: number, y: number, z: number, sx: number, sy: number, sz: number, yaw = 0, color?: number): Placement {
  return { position: new T.Vector3(x, y, z), scale: new T.Vector3(sx, sy, sz), rotation: new T.Quaternion().setFromAxisAngle(UP, yaw), color };
}

/** Merge only equal shading/shadow groups; preserve source names and per-instance corridor bounds. */
function batchStaticMeshes(group: T.Group, materials: Set<T.Material>, mergeDiffuse = false) {
  const buckets = new Map<string, T.InstancedMesh[]>();
  for (const child of group.children) {
    if (!(child instanceof T.InstancedMesh) || Array.isArray(child.material)) continue;
    const material = child.material;
    const surfaceKey = mergeDiffuse && material instanceof T.MeshLambertMaterial
      ? `lambert:${material.map?.uuid ?? 'none'}:${material.side}:${material.alphaTest}:${material.opacity}:${material.emissive.getHex()}`
      : material.uuid;
    const key = `${surfaceKey}:${child.castShadow}:${child.receiveShadow}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(child); buckets.set(key, bucket);
  }
  const matrix = new T.Matrix4();
  const tint = new T.Color();
  for (const sources of buckets.values()) {
    if (sources.length < 2) continue;
    const parts: T.BufferGeometry[] = [];
    const corridorBounds: { minX: number; maxX: number }[] = [];
    for (const source of sources) {
      for (let index = 0; index < source.count; index++) {
        source.getMatrixAt(index, matrix);
        const geometry = source.geometry.clone().applyMatrix4(matrix);
        geometry.clearGroups();
        const colors = new Float32Array(geometry.attributes.position.count * 3);
        tint.set(0xffffff);
        if (source.instanceColor) source.getColorAt(index, tint);
        if (mergeDiffuse && source.material instanceof T.MeshLambertMaterial) tint.multiply(source.material.color);
        for (let vertex = 0; vertex < geometry.attributes.position.count; vertex++) tint.toArray(colors, vertex * 3);
        geometry.setAttribute('color', new T.BufferAttribute(colors, 3));
        if (source.userData.corridorClear) {
          geometry.computeBoundingBox();
          corridorBounds.push({ minX: geometry.boundingBox!.min.x, maxX: geometry.boundingBox!.max.x });
        }
        parts.push(geometry);
      }
    }
    const combined = mergeGeometries(parts, false)!;
    parts.forEach(geometry => geometry.dispose());
    const material = (sources[0].material as T.MeshStandardMaterial | T.MeshLambertMaterial).clone();
    if (mergeDiffuse && material instanceof T.MeshLambertMaterial) material.color.set(0xffffff);
    material.vertexColors = true;
    materials.add(material);
    const mesh = new T.Mesh(combined, material);
    mesh.name = `batch-${material.name}`;
    mesh.castShadow = sources[0].castShadow;
    mesh.receiveShadow = sources[0].receiveShadow;
    mesh.userData.corridorBounds = corridorBounds;
    for (const source of sources) {
      const marker = new T.Group(); marker.name = source.name;
      marker.userData.batchedInto = mesh.name;
      mesh.add(marker);
      group.remove(source);
    }
    combined.computeBoundingBox(); combined.computeBoundingSphere();
    group.add(mesh);
  }
}

/** Art direction sample, not a surveyed or georeferenced depiction of El Virrey. */
export function createArtSlice(options: { detail?: 'low' | 'high'; textures?: ArtTextures } = {}) {
  const detail = options.detail ?? 'high';
  const low = detail === 'low';
  const density = low
    ? { cylinderSegments: 5, branches: 3, bushes: 32, litter: 50 }
    : { cylinderSegments: 8, branches: 5, bushes: 65, litter: 200 };
  const group = new T.Group();
  group.name = 'art-slice';
  const textures = {
    asphalt: makeTexture('asphalt', 2.5, 19),
    brick: options.textures?.brick ?? makeTexture('brick', 3, 5),
    concrete: makeTexture('concrete', 1, 12),
    paving: makeTexture('paving', 3, 24),
    bark: options.textures?.bark ?? makeTexture('bark', 2, 3),
    leaf: options.textures?.leaf ?? makeTexture('leaf'),
    grass: makeTexture('grass', 6, 16),
  };
  const materials = new Set<T.Material>();
  const surface = (name: string, color: number, map?: T.Texture, roughness = .88, metalness = 0) => {
    const material = new T.MeshStandardMaterial({ name, color, map: map ?? null, roughness, metalness });
    materials.add(material);
    return material;
  };
  const diffuse = (name: string, color: number, map?: T.Texture) => {
    const material = new T.MeshLambertMaterial({ name, color, map: map ?? null });
    materials.add(material);
    return material;
  };
  const asphalt = surface('asphalt-pbr', 0xe0ded8, textures.asphalt, .94);
  asphalt.bumpMap = textures.asphalt; asphalt.bumpScale = .035;
  const brick = diffuse('brick-diffuse', 0xffffff, textures.brick);
  const concrete = diffuse('aged-concrete', 0xe3ded0, textures.concrete);
  const paving = surface('sidewalk-brick', 0xc7b9aa, textures.paving);
  const steel = surface('urban-steel', 0x303b38, undefined, .58, .55);
  const wood = diffuse('bench-wood', 0xb6a58b, textures.bark);
  const trim = diffuse('worn-window-trim', 0x817b70);
  const glazing = surface('recessed-window', 0x263536, undefined, .31, .35);
  const yellow = diffuse('aged-yellow-paint', 0xc6a739);
  const white = diffuse('aged-white-paint', 0xc8c5b3);
  const bark = diffuse('tree-bark', 0xc1b29b, textures.bark);
  const foliage = diffuse('canopy-leaves', 0xa8b18e);
  const leaf = diffuse('leaf-detail', 0xffffff, textures.leaf);
  leaf.alphaTest = .5; leaf.side = T.DoubleSide;
  const canopyMaterial = leaf.clone(); canopyMaterial.name = 'connected-leaf-canopy'; materials.add(canopyMaterial);
  const soil = diffuse('park-ground', 0xb2b29c, textures.grass);
  const stains = surface('asphalt-repair', 0xb4b2a8, textures.asphalt, .9);
  const box = new T.BoxGeometry(1, 1, 1);
  const cylinder = new T.CylinderGeometry(1, 1, 1, density.cylinderSegments);
  const plane = new T.PlaneGeometry(1, 1);
  const matrix = new T.Matrix4();
  const identity = new T.Quaternion();
  const instances = (name: string, geometry: T.BufferGeometry, material: T.Material, placements: Placement[], corridorClear = false) => {
    const mesh = new T.InstancedMesh(geometry, material, placements.length);
    mesh.name = name;
    mesh.userData.corridorClear = corridorClear;
    placements.forEach((value, index) => {
      matrix.compose(value.position, value.rotation ?? identity, value.scale);
      mesh.setMatrixAt(index, matrix);
      if (value.color !== undefined) mesh.setColorAt(index, new T.Color(value.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.receiveShadow = SHADOW_RECEIVERS.has(name);
    mesh.castShadow = false;
    mesh.computeBoundingBox(); mesh.computeBoundingSphere();
    group.add(mesh);
    return mesh;
  };

  // Surface elevations clear the old base surface while leaving the physical track level unchanged.
  instances('asphalt', box, asphalt, [placement(0, .027, -18, 5.5, .08, 44)]);
  const transitionGeometry = new T.PlaneGeometry(5.5, 12, 1, 6).rotateX(-Math.PI / 2);
  const transitionColors = new Float32Array(transitionGeometry.attributes.position.count * 4);
  for (let i = 0; i < transitionGeometry.attributes.position.count; i++) {
    const alpha = (transitionGeometry.attributes.position.getZ(i) + 6) / 12;
    transitionColors.set([1, 1, 1, alpha], i * 4);
  }
  transitionGeometry.setAttribute('color', new T.BufferAttribute(transitionColors, 4));
  const transitionMaterial = new T.MeshLambertMaterial({ name: 'asphalt-transition', map: textures.asphalt, color: 0xe0ded8, vertexColors: true, transparent: true, depthWrite: false });
  materials.add(transitionMaterial);
  const transition = new T.Mesh(transitionGeometry, transitionMaterial);
  transition.name = 'asphalt-transition'; transition.position.set(0, .068, -46); group.add(transition);
  instances('brick-sidewalks', box, paving, [placement(5.1, .09, -20, 4.4, .18, 48), placement(-5, .09, -20, 4, .18, 48)], true);
  instances('park-lawn', box, soil, [placement(-13, .10, -20, 12, .08, 48)], true);
  const curbs: Placement[] = [];
  for (let z = low ? 3 : 3.5; z > -44; z -= low ? 2 : 1) for (const side of [-1, 1]) curbs.push(placement(side * 2.96, .13, z, .42, .26, low ? 1.97 : .97));
  instances('segmented-concrete-curbs', box, concrete, curbs, true);

  const paint: Placement[] = [], edgePaint: Placement[] = [], repairs: Placement[] = [];
  for (let z = 2; z > -44; z -= 3.7) paint.push(placement(0, .070, z, .09, .005, 2.4));
  for (const side of [-1, 1]) edgePaint.push(placement(side * 2.48, .070, -20, .055, .005, 48));
  for (let i = 0; i < 9; i++) repairs.push(placement((i % 3 - 1) * 1.65, .069, 1 - i * 5.1, .36 + i % 3 * .16, 1, .7 + i % 4 * .2, i * .63));
  instances('centerline-yellow', box, yellow, paint);
  instances('edge-lines-white', box, white, edgePaint);
  instances('road-repairs', new T.CircleGeometry(.5, 10).rotateX(-Math.PI / 2), stains, repairs);

  // An original bicycle stencil, made from rings and thin frame tubes rather than a downloaded logo.
  const markings: Placement[] = [];
  const stencilWheel = new T.TorusGeometry(.29, .025, 3, low ? 8 : 16);
  for (const z of [-7, -25]) for (const side of [-1, 1]) {
    const x = side * 1.25;
    for (const wheelZ of [-.5, .5]) {
      const wheel = placement(x, .074, z + wheelZ, 1, 1, 1);
      wheel.rotation = new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), -Math.PI / 2);
      markings.push(wheel);
    }
  }
  instances('cycle-stencil-wheels', stencilWheel, white, markings);
  const stencilFrame: Placement[] = [];
  for (const z of [-7, -25]) for (const side of [-1, 1]) {
    const x = side * 1.25;
    stencilFrame.push(placement(x, .075, z, .035, .004, 1));
    stencilFrame.push(placement(x + .14, .075, z - .1, .035, .004, .65, .46));
    stencilFrame.push(placement(x - .14, .075, z + .13, .035, .004, .66, .5));
    stencilFrame.push(placement(x, .075, z - .66, .5, .004, .035));
    stencilFrame.push(placement(x, .075, z + .08, .32, .004, .06));
  }
  instances('cycle-stencil-frame', box, white, stencilFrame);

  // Bogotano brick apartment/shop rhythm; geometry has real window recess and projecting sills.
  const walls: Placement[] = [], plinths: Placement[] = [], glass: Placement[] = [], frames: Placement[] = [];
  const rails: Placement[] = [], shutters: Placement[] = [], awnings: Placement[] = [], balconies: Placement[] = [];
  for (let building = 0; building < 5; building++) {
    const z = -.81 - building * 9.5;
    const height = [10.5, 13.2, 8.4, 11.8, 9.4][building];
    walls.push(placement(11.4, height / 2, z, 6.4, height, 9.4, 0, [0xffffff, 0xe4d1b4, 0xf2e5d2, 0xd0c3b4, 0xeecec0][building]));
    plinths.push(placement(8.12, .62, z, .18, 1.24, 9.5));
    plinths.push(placement(8.12, height + .04, z, .3, .16, 9.6));
    for (let floor = 0; floor < Math.floor(height / 2.65); floor++) for (let col = 0; col < 3; col++) {
      const y = 1.75 + floor * 2.6, wz = z - 3.05 + col * 3.05;
      glass.push(placement(8.17, y, wz, .06, 1.48, 1.65, 0, col === 1 && floor % 2 ? 0x8d8770 : 0xc0d0cd));
      frames.push(placement(8.05, y - .79, wz, .36, .12, 1.85));
      frames.push(placement(8.05, y + .78, wz, .26, .10, 1.85));
      for (const edge of low ? [-.86, .86] : [-.86, 0, .86]) frames.push(placement(8.05, y, wz + edge, .20, 1.56, .06));
      if (!low) frames.push(placement(8.03, y - .1, wz, .21, .04, 1.7));
      if (floor === 0) for (let bar = -3; bar <= 3; bar += low ? 3 : 1) rails.push(placement(7.88, y, wz + bar * .23, .04, 1.55, .025));
      if (floor > 0 && (col + floor + building) % 3 === 1) {
        balconies.push(placement(7.7, y - .84, wz, .9, .15, 2.15));
        rails.push(placement(7.28, y - .30, wz, .035, .035, 2.1));
        for (let bar = -4; bar <= 4; bar += low ? 2 : 1) rails.push(placement(7.28, y - .57, wz + bar * .25, .025, .51, .025));
      }
    }
    // Ground-floor security door and shutter, giving the street a human scale.
    shutters.push(placement(8.06, 1.26, z + 1.5, .16, 2.5, 1.32));
    for (let row = 0; row < 14; row += low ? 3 : 1) frames.push(placement(7.96, .1 + row * .17, z + 1.5, .08, .03, 1.29));
    awnings.push(placement(7.4, 2.75, z + 1.5, 1.8, .16, 2));
    rails.push(placement(7.91, 1.15, z + 1.9, .06, .25, .05));
    // Rainwater pipes, lintels and a recessed entrance break up the repeated apartment grid.
    rails.push(placement(7.99, height / 2, z - 4.45, .07, height, .07));
    plinths.push(placement(8.02, 2.53, z + 1.5, .32, .17, 1.65));
  }
  const facades = instances('brick-facades', box, brick, walls, true); facades.castShadow = true;
  instances('facade-concrete', box, concrete, [...plinths, ...balconies], true);
  instances('deep-window-glazing', box, glazing, glass, true);
  instances('window-frames', box, trim, frames, true);
  instances('balcony-rails-and-grilles', box, steel, rails, true);
  instances('security-shutters', box, steel, shutters, true);
  instances('shop-awnings', box, foliage, awnings, true);

  // Branched trees with varied broadleaf clusters, avoiding the MVP's conical/icosahedral crowns.
  const trunks: Placement[] = [], branches: Placement[] = [], crowns: Placement[] = [];
  const branchEndpoints: [number, number, number][] = [];
  const twigs: Placement[] = [];
  const addBranch = (from: T.Vector3, to: T.Vector3, radius: number) => {
    const delta = to.clone().sub(from);
    branches.push({ position: from.clone().add(to).multiplyScalar(.5), scale: new T.Vector3(radius, delta.length(), radius), rotation: new T.Quaternion().setFromUnitVectors(UP, delta.normalize()) });
  };
  for (let tree = 0; tree < 14; tree++) {
    const side = tree < 9 ? -1 : 1;
    const x = side * (tree < 9 ? 5.9 + tree % 2 * 2.8 : 4.65);
    const z = tree < 9 ? -tree * 4.8 : -(tree - 9) * 9.5;
    const h = 5.7 + tree % 3 * .7;
    trunks.push(placement(x, h * .4, z, .16 + tree % 3 * .025, h * .8, .16 + tree % 3 * .025));
    for (let branch = 0; branch < density.branches; branch++) {
      const angle = branch * 2.4 + tree;
      const bx = x + Math.sin(angle) * 1.55, bz = z + Math.cos(angle) * 1.55;
      const by = h - .7 + branch % 3 * .45;
      const endpoint = new T.Vector3(bx, by, bz);
      const elbow = new T.Vector3(x + (bx - x) * .38, h * .73, z + (bz - z) * .45);
      addBranch(new T.Vector3(x, h * .49, z), elbow, .075);
      addBranch(elbow, endpoint, .045);
      branchEndpoints.push(endpoint.toArray());
      for (let spray = 0; spray < (low ? 2 : 5); spray++) {
        const part = placement(bx, by, bz, 1.1, 1.1 + (tree + spray) % 3 * .13, 1.1, 0, [0xffffff, 0xcdd9ab, 0xb4c19b][spray % 3]);
        part.rotation = new T.Quaternion().setFromEuler(new T.Euler(.25 + spray * .19, angle + spray * 1.25, -.6 + spray * .3));
        crowns.push(part);
      }
    }
    // Exposed roots and litter are kept outside the traversable corridor.
    for (let root = 0; root < 3; root++) twigs.push(placement(x + Math.sin(root * 2) * .25, .18, z + Math.cos(root * 2) * .25, .08, .08, .8, root * 2));
  }
  const trunkMesh = instances('tree-trunks', cylinder, bark, trunks, true); trunkMesh.castShadow = true;
  const branchMesh = instances('tree-branches', cylinder, bark, branches); branchMesh.castShadow = true;
  instances('exposed-roots', cylinder, bark, twigs, true);
  const crownGeometry = makeLeafSprig(low);
  const canopies = instances('tree-canopy', crownGeometry, canopyMaterial, crowns);
  canopies.castShadow = false;

  const bushes: Placement[] = [], litter: Placement[] = [];
  for (let i = 0; i < density.bushes; i++) {
    const x = -3.5 - (i % 4) * .6, z = 3 - i * (low ? 1.4 : .70);
    bushes.push(placement(x, .28 + i % 3 * .1, z, .24 + i % 3 * .08, .25 + i % 3 * .12, .32, i, [0xb8c18d, 0x879665, 0x78926a][i % 3]));
  }
  for (let i = 0; i < density.litter; i++) {
    const x = Math.sin(i * 17) * 2.7, z = 3 - i * (low ? .94 : .235);
    const part = placement(x, .075, z, .05 + i % 3 * .025, .10 + i % 4 * .025, 1, i, [0xe3c784, 0xb5a05e, 0x87916c][i % 3]);
    part.rotation = new T.Quaternion().setFromEuler(new T.Euler(-Math.PI / 2, 0, i));
    litter.push(part);
  }
  instances('low-planting', crownGeometry, leaf, bushes, true);
  instances('fallen-leaves', plane, leaf, litter);

  const posts: Placement[] = [], yellowBands: Placement[] = [], benchLegs: Placement[] = [], benchSlats: Placement[] = [], lampHeads: Placement[] = [];
  for (let z = 0; z > -44; z -= 5) for (const side of [-1, 1]) {
    posts.push(placement(side * 3.28, .52, z, .07, 1.04, .07));
    yellowBands.push(placement(side * 3.28, .8, z, .073, .14, .073));
  }
  for (const z of [-4, -20, -35]) {
    posts.push(placement(6.35, 2.6, z, .055, 5.2, .055));
    lampHeads.push(placement(6.05, 5.13, z, .72, .12, .3));
    for (const pz of [-.8, .8]) benchLegs.push(placement(-4.6, .3, z + pz, .6, .6, .07));
    for (let slat = 0; slat < 4; slat++) {
      benchSlats.push(placement(-4.32 - slat * .17, .65, z, .13, .07, 2.1));
      benchSlats.push(placement(-4.9, .84 + slat * .14, z, .07, .10, 2.1));
    }
  }
  instances('bollards-and-lamp-posts', cylinder, steel, posts, true);
  instances('bollard-yellow-bands', cylinder, yellow, yellowBands, true);
  instances('street-bench-frames', box, steel, benchLegs, true);
  instances('street-bench-slats', box, wood, benchSlats, true);
  instances('street-lamp-heads', box, trim, lampHeads, true);

  if (low) group.traverse(node => { node.castShadow = false; node.receiveShadow = false; });
  batchStaticMeshes(group, materials, low);
  const metadata = { startDistance: 0, endDistance: SECTOR_LENGTH, transitionEndDistance: 52, branchEndpoints, detail, treeCount: trunks.length, facadeCount: walls.length,
    treeTransforms: trunks.map(value => [...value.position.toArray(), ...value.scale.toArray()]),
    facadeTransforms: walls.map(value => [...value.position.toArray(), ...value.scale.toArray()]),
    triangles: 0, drawCalls: 0, textureBytes: Math.ceil(Object.values(textures).reduce((total, texture) => total + estimatedTextureBytes(texture), 0)), source: options.textures ? 'original-geometry-and-polyhaven-cc0-textures' : 'original-procedural-art' };
  group.traverse(node => {
    if (!(node instanceof T.Mesh)) return;
    metadata.triangles += (node.geometry.index?.count ?? node.geometry.attributes.position.count) / 3 * (node instanceof T.InstancedMesh ? node.count : 1);
    metadata.drawCalls += 1;
  });
  const dryAsphalt = asphalt.color.clone();
  const dryPaving = paving.color.clone();
  let currentWeather: 'sun' | 'rain' = 'sun';
  function updateWeather(weather: 'sun' | 'rain') {
    if (weather === currentWeather) return;
    currentWeather = weather;
    const raining = weather === 'rain';
    asphalt.roughness = raining ? .34 : .94;
    asphalt.color.copy(dryAsphalt).multiplyScalar(raining ? .71 : 1);
    transitionMaterial.color.copy(asphalt.color);
    paving.roughness = raining ? .54 : .88;
    paving.color.copy(dryPaving).multiplyScalar(raining ? .81 : 1);
    stains.roughness = raining ? .24 : .9;
  }
  return {
    group, metadata, updateWeather,
    dispose() {
      const geometries = new Set<T.BufferGeometry>();
      group.traverse(node => { if (node instanceof T.Mesh) geometries.add(node.geometry); });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      const borrowed = new Set(Object.values(options.textures ?? {}));
      Object.values(textures).forEach(texture => { if (!borrowed.has(texture)) texture.dispose(); });
    },
  };
}
