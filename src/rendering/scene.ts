import * as T from "three";
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
}
export interface RenderTraffic {
  id: string;
  kind: "car" | "pedestrian";
  x: number;
  z: number;
  active: boolean;
}
const color = {
  green: 0x58b5a0,
  asphalt: 0x354d55,
  brick: 0xab6451,
  cream: 0xf3d8b0,
  tree: 0x397d68,
};
export function createWorld() {
  const scene = new T.Scene();
  scene.background = new T.Color(0xb8dce3);
  scene.fog = new T.Fog(0xb8dce3, 65, 220);
  const camera = new T.PerspectiveCamera(65, 1, 0.06, 500);
  camera.position.set(0, 1.65, 0);
  scene.add(camera);
  scene.add(new T.HemisphereLight(0xf5f7df, 0x677d77, 2.6));
  const sun = new T.DirectionalLight(0xffe6b5, 2.1);
  sun.position.set(-20, 60, 20);
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
    mesh.frustumCulled = false;
    transforms.forEach((v, i) => {
      dummy.position.set(v[0], v[1], v[2]);
      dummy.rotation.set(0, v[6] || 0, 0);
      dummy.scale.set(v[3], v[4], v[5]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    parent.add(mesh);
    return mesh;
  }
  instances(box, color.asphalt, [[0, -0.15, -100, 34, 0.2, 440]]);
  instances(box, color.green, [[0, -0.025, -100, 6, 0.1, 440]]);
  instances(box, 0xe5d5b7, [
    [-11, -0.01, -100, 8, 0.2, 440],
    [11, -0.01, -100, 8, 0.2, 440],
  ]);
  instances(box, 0xf4e6be, [
    [-3.1, 0.04, -100, 0.15, 0.08, 440],
    [3.1, 0.04, -100, 0.15, 0.08, 440],
  ]);
  const city = new T.Group();
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
  for (let i = 0; i < 26; i++) {
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
            0.06,
            0.9,
            1.35,
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
  instances(box, 0x91bcc4, windows, city);
  instances(cylinder, 0x755840, trees, city);
  instances(crown, color.tree, crowns, city);
  instances(cylinder, 0x425e60, lamps, city);
  instances(box, 0xf9e6b6, caps, city);
  instances(box, 0xf3edb8, lines, city);
  instances(box, 0xf9f3dc, stripes, city);
  instances(box, 0xc7b26e, parked, city);
  const mountain = new T.ConeGeometry(1, 1, 7);
  instances(mountain, 0x6e9990, [
    [75, 17, -155, 54, 68, 42],
    [125, 22, -240, 70, 90, 65],
    [-90, 8, -270, 100, 70, 60],
  ]);
  const wheelGeo = new T.TorusGeometry(1, 0.15, 4, 8);
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
  const bike = new T.Group();
  camera.add(bike);
  bike.position.set(0, -0.42, -1.1);
  function bikePart(
    geometry: T.BufferGeometry,
    c: number,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    rz = 0,
  ) {
    const m = new T.Mesh(geometry, material(c));
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.rotation.z = rz;
    bike.add(m);
    return m;
  }
  bikePart(box, 0x214c53, 0, -0.12, 0.2, 0.06, 0.4, 0.06);
  bikePart(box, 0x9eaeaa, 0, 0.04, 0, 0.9, 0.045, 0.055);
  bikePart(box, 0x233f44, -0.51, 0.075, 0.07, 0.21, 0.07, 0.075, -0.24);
  bikePart(box, 0x233f44, 0.51, 0.075, 0.07, 0.21, 0.07, 0.075, 0.24);
  bikePart(box, 0xe9b648, 0, -0.03, -0.03, 0.13, 0.15, 0.07);
  bikePart(wheelGeo, 0x273e42, 0, -0.48, -0.65, 0.29, 0.29, 0.29);
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
  const sunSky = new T.Color(0xb8dce3);
  const rainSky = new T.Color(0x869ea5);
  function update(snapshot: RenderSnapshot, traffic: RenderTraffic[]) {
    const raining = snapshot.weather === "rain";
    scene.background = raining ? rainSky : sunSky;
    (scene.fog as T.Fog).color.copy(scene.background);
    (scene.fog as T.Fog).far = weatherProfile(
      parseWeather(snapshot.weather),
    ).visibility;
    sun.intensity = raining ? 0.65 : 2.1;
    camera.position.x = snapshot.x;
    camera.position.y =
      1.65 +
      Math.sin(snapshot.elapsed * 6) * Math.min(snapshot.speed * 0.002, 0.025);
    camera.rotation.z = -snapshot.x * 0.009;
    city.position.z = (snapshot.distance % 14) + 14;
    bike.rotation.z =
      Math.sin(snapshot.elapsed * 2) * Math.min(snapshot.speed * 0.001, 0.015);
    rain.visible = raining;
    rain.position.z = snapshot.distance % 12;
    rain.position.y = -((snapshot.elapsed * 8) % 7);
    for (let i = 0; i < 12; i++) {
      const obstacle = traffic[i];
      const visible =
        obstacle?.active &&
        obstacle.z - snapshot.distance > -15 &&
        obstacle.z - snapshot.distance < 200;
      const x = obstacle?.x || 0;
      const z = visible ? -(obstacle.z - snapshot.distance) : -1000;
      const car = visible && obstacle.kind === "car";
      const pedestrian = visible && obstacle.kind === "pedestrian";
      matrix(carBodies, i, x, car ? 0.55 : -1000, z, 3.5, 0.85, 1.8);
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
    [carBodies, carTops, carWheels, pedBodies, pedHeads, pedLegs].forEach(
      (m) => (m.instanceMatrix.needsUpdate = true),
    );
  }
  return { scene, camera, update };
}
export function buildScene(canvas: HTMLCanvasElement) {
  const world = createWorld();
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = T.SRGBColorSpace;
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
    render: () => renderer.render(world.scene, world.camera),
    dispose: () => {
      world.scene.traverse((o) => {
        if (o instanceof T.Mesh) {
          o.geometry.dispose();
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
    },
  };
}
