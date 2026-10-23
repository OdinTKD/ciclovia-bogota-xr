import * as T from "three";
import { createProceduralBicycle } from "./bicycle";
import type { BicyclePresentation } from "./bicycle";
import { createArtSlice } from "./art-slice";
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { applyMaterialLighting, applyRenderQuality, materialAlternative } from './material-lighting';
import { weatherProfile, parseWeather } from "../weather";
export const SCENE_BUDGET = {
  drawCalls: 100,
  triangles: 100000,
  minimumFps: 30,
};
export interface RenderSnapshot {
  x: number;
  distance: number;
  speed: number;
  weather: string;
  elapsed: number;
  worldZ?: number;
  yaw?: number;
  steeringAngle?: number;
  roll?: number;
  pedalEffort?: number;
}
export interface RenderTraffic {
  id: string;
  kind: "car" | "pedestrian";
  x: number;
  z: number;
  active: boolean;
}
const CAMERA_ROLL_FACTOR=.15;
const CAMERA_ROLL_LIMIT=.052;
const CAMERA_FOLLOW_DISTANCE=1.3;
const color = {
  green: 0x58b5a0,
  asphalt: 0x354d55,
  brick: 0xab6451,
  cream: 0xf3d8b0,
  tree: 0x397d68,
};
interface WorldOptions {
  bicycle?: { group: T.Group; update(state: BicyclePresentation): void };
}
/** Shared geometry, material and texture ownership is deduplicated at scene shutdown. */
function disposeSceneResources(scene: T.Scene) {
  const geometries = new Set<T.BufferGeometry>();
  const materials = new Set<T.Material>();
  const textures = new Set<T.Texture>();
  scene.traverse(object => {
    if (!(object instanceof T.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      const alternative = materialAlternative(material);
      if (alternative) materials.add(alternative);
      for (const value of Object.values(material)) {
        if (value instanceof T.Texture && !value.isRenderTargetTexture) textures.add(value);
      }
    }
  });
  textures.forEach(texture => texture.dispose());
  materials.forEach(material => material.dispose());
  geometries.forEach(geometry => geometry.dispose());
}
export function createWorld(options: WorldOptions = {}) {
  const scene = new T.Scene();
  scene.background = new T.Color(0xb8dce3);
  scene.fog = new T.Fog(0xb8dce3, 65, 220);
  const camera = new T.PerspectiveCamera(65, 1, 0.06, 500);
  camera.position.set(0, 1.65, 0);
  camera.rotation.order="YXZ";
  scene.add(camera);
  scene.add(new T.HemisphereLight(0xe6eef0, 0x655c48, 1.15));
  const sun = new T.DirectionalLight(0xffe1b1, 2.6);
  sun.position.set(-25, 38, 16);
  sun.target.position.set(0, 0, -20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 120 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -.0005;
  sun.shadow.normalBias = .035;
  // Only fixed buildings/trees cast. Cache their map while the cyclist moves.
  sun.shadow.autoUpdate = false;
  sun.shadow.needsUpdate = true;
  scene.add(sun.target);
  scene.add(sun);
  const materials = new Map<number, T.MeshLambertMaterial>();
  const material = (c: number) => {
    if (!materials.has(c))
      materials.set(c, new T.MeshLambertMaterial({ color: c }));
    return materials.get(c)!;
  };
  const box = new T.BoxGeometry(1, 1, 1);
  const cylinder = new T.CylinderGeometry(1, 1, 1, 6);
  const crown = new T.IcosahedronGeometry(1, 0);
  const dummy = new T.Object3D();
  function instances(
    geometry: T.BufferGeometry,
    c: number,
    transforms: number[][],
    parent: T.Object3D = scene,
  ) {
    const mesh = new T.InstancedMesh(geometry, material(c), transforms.length);
    mesh.frustumCulled = true;
    transforms.forEach((v, i) => {
      dummy.position.set(v[0], v[1], v[2]);
      dummy.rotation.set(0, v[6] || 0, 0);
      dummy.scale.set(v[3], v[4], v[5]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
    parent.add(mesh);
    return mesh;
  }
  instances(box, color.asphalt, [[0, -0.15, -100, 34, 0.2, 440]]);
  instances(box, color.green, [[0, -0.025, -100, 6, 0.1, 440]]);
  instances(box, 0xe5d5b7, [
    [-11, -0.01, -100, 8, 0.2, 440],
    [11, -0.01, -100, 8, 0.2, 440],
  ]);
  const boundaryCue=instances(box, 0xf4e6be, [
    [-2.95, 0.08, -100, 0.4, 0.16, 440],
    [2.95, 0.08, -100, 0.4, 0.16, 440],
  ]);
  boundaryCue.name='boundary-cue';
  const city = new T.Group();
  city.name="environment";
  scene.add(city);
  const buildings: number[][] = [];
  const windows: number[][] = [];
  const trees: number[][] = [];
  const crowns: number[][] = [];
  const lamps: number[][] = [];
  const caps: number[][] = [];
  const lines: number[][] = [];
  const stripes: number[][] = [];
  const parked: number[][] = [];
  for (let i = 4; i < 26; i++) {
    const z = -i * 14;
    const h = 6 + ((i * 7) % 9);
    for (const side of [-1, 1]) {
      buildings.push([side * 20, h / 2, z, 7, h, 11]);
      for (let floor = 0; floor < Math.floor(h / 2); floor++)
        for (let col = 0; col < 3; col++)
          windows.push([
            side * 16.45,
            1.3 + floor * 2,
            z - 3 + col * 3,
            1.35,
            0.9,
            1,
            -side * Math.PI / 2,
          ]);
      trees.push([side * 8.1, 1.3, z - 3, 0.18, 2.6, 0.18]);
      crowns.push([side * 8.1, 3.4, z - 3, 1.6, 2, 1.6]);
      lamps.push([side * 5.9, 2.4, z + 3, 0.075, 4.8, 0.075]);
      caps.push([side * 5.6, 4.8, z + 3, 0.9, 0.1, 0.3]);
      if (i % 3 === 0) parked.push([side * 5, 0.55, z, 1.4, 1.05, 3]);
    }
    lines.push([0, 0.04, z, 0.09, 0.015, 4]);
    if (i % 7 === 2)
      for (let j = 0; j < 12; j++)
        stripes.push([-8 + j * 1.5, 0.09, z, 1, 0.025, 3]);
  }
  instances(box, color.brick, buildings, city);
  instances(new T.PlaneGeometry(1, 1), 0x91bcc4, windows, city);
  instances(cylinder, 0x755840, trees, city);
  instances(crown, color.tree, crowns, city);
  instances(cylinder, 0x425e60, lamps, city);
  instances(box, 0xf9e6b6, caps, city);
  instances(box, 0xf3edb8, lines, city);
  instances(box, 0xf9f3dc, stripes, city);
  instances(box, 0xc7b26e, parked, city);
  const artSlice = createArtSlice();
  artSlice.group.userData.extent = { start: artSlice.metadata.startDistance, end: artSlice.metadata.endDistance };
  scene.add(artSlice.group);
  const mountain = new T.ConeGeometry(1, 1, 7);
  instances(mountain, 0x6e9990, [
    [75, 17, -155, 54, 68, 42],
    [125, 22, -240, 70, 90, 65],
    [-90, 8, -270, 100, 70, 60],
  ]);

  const trafficGroup = new T.Group();
  scene.add(trafficGroup);
  const carBodies = instances(
    box,
    0xec765c,
    Array.from({ length: 12 }, () => [0, -1000, 0, 1, 1, 1]),
    trafficGroup,
  );
  const carTops = instances(
    box,
    0x345b65,
    Array.from({ length: 12 }, () => [0, -1000, 0, 1, 1, 1]),
    trafficGroup,
  );
  const carWheels = instances(
    box,
    0x273a3d,
    Array.from({ length: 24 }, () => [0, -1000, 0, 1, 1, 1]),
    trafficGroup,
  );
  const pedBodies = instances(
    cylinder,
    0xe7b845,
    Array.from({ length: 12 }, () => [0, -1000, 0, 1, 1, 1]),
    trafficGroup,
  );
  const pedHeads = instances(
    crown,
    0xd29572,
    Array.from({ length: 12 }, () => [0, -1000, 0, 1, 1, 1]),
    trafficGroup,
  );
  const pedLegs = instances(
    box,
    0x2c4d61,
    Array.from({ length: 24 }, () => [0, -1000, 0, 1, 1, 1]),
    trafficGroup,
  );
  const bicycle=options.bicycle ?? createProceduralBicycle();
  camera.add(bicycle.group);
  // Thin instanced rain streaks share one draw call.
  const rain = instances(
    box,
    0xc8e8eb,
    Array.from({ length: 160 }, (_, i) => [
      ((i * 13) % 37) - 18,
      (i * 7) % 14,
      -((i * 19) % 55),
      0.012,
      0.22,
      0.012,
    ]),
  );
  rain.visible = false;
  function matrix(
    mesh: T.InstancedMesh,
    index: number,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) {
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }
  carBodies.name="car-bodies";carTops.name="car-tops";carWheels.name="car-wheels";
  pedBodies.name="pedestrian-bodies";pedHeads.name="pedestrian-heads";pedLegs.name="pedestrian-legs";
  const carPool = [carBodies, carTops, carWheels];
  const pedestrianPool = [pedBodies, pedHeads, pedLegs];
  const sunSky = new T.Color(0xc6d5d7);
  const rainSky = new T.Color(0x839398);
  let lastWeather = '';
  function update(snapshot: RenderSnapshot, traffic: RenderTraffic[]) {
    const raining = snapshot.weather === "rain";
    scene.background = raining ? rainSky : sunSky;
    (scene.fog as T.Fog).color.copy(scene.background);
    (scene.fog as T.Fog).far = weatherProfile(
      parseWeather(snapshot.weather),
    ).visibility;
    sun.intensity = raining ? .7 : 2.6;
    if (snapshot.weather !== lastWeather) {
      artSlice.updateWeather(parseWeather(snapshot.weather));
      lastWeather = snapshot.weather;
    }
    const yaw=snapshot.yaw??0;
    camera.position.set(snapshot.x-Math.sin(yaw)*CAMERA_FOLLOW_DISTANCE,1.65,(snapshot.worldZ??-snapshot.distance)+Math.cos(yaw)*CAMERA_FOLLOW_DISTANCE);
    camera.rotation.set(0,-yaw,Math.max(-CAMERA_ROLL_LIMIT,Math.min(CAMERA_ROLL_LIMIT,(snapshot.roll??0)*CAMERA_ROLL_FACTOR)));
    bicycle.update(snapshot);
    rain.visible = raining;
    rain.position.set(camera.position.x,-((snapshot.elapsed*8)%7),camera.position.z);
    let hasCar = false;
    let hasPedestrian = false;
    for (let i = 0; i < 12; i++) {
      const obstacle = traffic[i];
      const visible =
        obstacle?.active &&
        obstacle.z - snapshot.distance > -15 &&
        obstacle.z - snapshot.distance < 200;
      const x = obstacle?.x || 0;
      const z = visible ? -obstacle.z : -1000;
      const car = visible && obstacle.kind === "car";
      const pedestrian = visible && obstacle.kind === "pedestrian";
      hasCar ||= Boolean(car);
      hasPedestrian ||= Boolean(pedestrian);
      matrix(carBodies, i, x, car ? 0.55 : -1000, z, 4, 0.85, 2);
      matrix(carTops, i, x, car ? 1.15 : -1000, z - 0.15, 1.9, 0.6, 1.5);
      for (let k = 0; k < 2; k++)
        matrix(
          carWheels,
          i * 2 + k,
          x + (k ? 1.1 : -1.1),
          car ? 0.3 : -1000,
          z,
          0.45,
          0.45,
          2,
        );
      matrix(pedBodies, i, x, pedestrian ? 1 : -1000, z, 0.23, 0.7, 0.23);
      matrix(pedHeads, i, x, pedestrian ? 1.6 : -1000, z, 0.22, 0.25, 0.22);
      for (let k = 0; k < 2; k++)
        matrix(
          pedLegs,
          i * 2 + k,
          x + (k ? 0.13 : -0.13),
          pedestrian ? 0.35 : -1000,
          z,
          0.13,
          0.7,
          0.15,
        );
    }
    carPool.forEach((mesh) => {
      mesh.visible = hasCar;
      if (hasCar) { mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere(); }
    });
    pedestrianPool.forEach((mesh) => {
      mesh.visible = hasPedestrian;
      if (hasPedestrian) { mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere(); }
    });

  }
  let disposed = false;
  function dispose() {
    if (disposed) return;
    disposed = true;
    disposeSceneResources(scene);
    sun.shadow.dispose();
  }
  return { scene, camera, update, dispose, artSlice: artSlice.metadata };
}
export function buildScene(canvas: HTMLCanvasElement, options: WorldOptions = {}) {
  const world = createWorld(options);
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  // Sharp sunlight uses one shadow lookup rather than the mobile cost of PCF filtering.
  renderer.shadowMap.type = T.BasicShadowMap;
  const environment = new RoomEnvironment();
  const pmrem = new T.PMREMGenerator(renderer);
  const environmentTarget = pmrem.fromScene(environment, .04);
  applyMaterialLighting(world.scene, environmentTarget.texture);
  environment.dispose();
  pmrem.dispose();
  renderer.setClearColor(0xb8dce3);
  renderer.xr.enabled = true;
  const resize = () => {
    const w = canvas.clientWidth || innerWidth;
    const h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    world.camera.aspect = w / h;
    world.camera.updateProjectionMatrix();
  };
  resize();
  return {
    ...world,
    renderer,
    resize,
    setQuality: (ratio: number) => applyRenderQuality(renderer, world.scene, environmentTarget.texture, ratio),
    render: () => renderer.render(world.scene, world.camera),
    dispose: () => {
      environmentTarget.dispose();
      world.dispose();
      renderer.dispose();
    },
  };
}


/** Conservative static inventory of real geometries; runtime WebGL counters remain authoritative. */
export function assetGeometryStats(root:T.Object3D) {
 const materials=new Set<T.Material>();const geometries=new Set<T.BufferGeometry>();
 let triangles=0,drawCalls=0,meshes=0;
 root.traverse(object=>{
  if(!(object instanceof T.Mesh))return;
  meshes++;const geometry=object.geometry;geometries.add(geometry);
  const assigned=Array.isArray(object.material)?object.material:[object.material];assigned.forEach(m=>materials.add(m));
  const count=geometry.index?.count??geometry.attributes.position.count;
  const submitted=Math.min(count-geometry.drawRange.start,geometry.drawRange.count);
  triangles+=Math.max(0,submitted)/3*(object instanceof T.InstancedMesh?object.count:1);
  drawCalls+=Array.isArray(object.material)?geometry.groups.length:1;
 });
 return {triangles,drawCalls,meshes,materials:materials.size,geometries:geometries.size};
}
