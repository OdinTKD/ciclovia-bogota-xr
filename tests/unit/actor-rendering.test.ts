import { describe, it, expect } from "vitest";
import { Mesh, Object3D, InstancedMesh, Matrix4, Vector3 } from "three";
import { createWorld, type RenderTraffic } from "../../src/rendering/scene";
const snapshot = { x: 0, distance: 0, speed: 0, weather: "sun", elapsed: 0 };
function visibleMeshes(node: Object3D): number {
  if (!node.visible) return 0;
  return (
    (node instanceof Mesh ? 1 : 0) +
    node.children.reduce((count, child) => count + visibleMeshes(child), 0)
  );
}
describe("pools de actores renderizan únicamente retos visibles", () => {
  it('carro visible ocupa los 4x2 metros del collider JSON',()=>{
    const world=createWorld();world.update(snapshot,[{id:'car',kind:'car',x:0,z:30,active:true}]);
    const body=world.scene.getObjectByName('car-bodies') as InstancedMesh;
    const transform=new Matrix4();body.getMatrixAt(0,transform);const scale=new Vector3().setFromMatrixScale(transform);
    body.geometry.computeBoundingBox();const dimensions=body.geometry.boundingBox!.getSize(new Vector3()).multiply(scale);
    expect(dimensions.x).toBe(4);expect(dimensions.z).toBe(2);
  });
  it('cuenta geometría real por actor y mantiene peatón dentro de collider',()=>{
    const world=createWorld();world.update(snapshot,[{id:'ped',kind:'pedestrian',x:0,z:30,active:true}]);
    const count=(names:string[])=>names.reduce((total,name)=>{const mesh=world.scene.getObjectByName(name) as InstancedMesh;return total+(mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3*(mesh.count/12);},0);
    expect(count(['car-bodies','car-tops','car-wheels'])).toBe(48);
    expect(count(['pedestrian-bodies','pedestrian-heads','pedestrian-legs'])).toBe(68);
    for(const name of ['pedestrian-bodies','pedestrian-heads','pedestrian-legs']){
      const mesh=world.scene.getObjectByName(name) as InstancedMesh;mesh.geometry.computeBoundingBox();
      for(let i=0;i<(name==='pedestrian-legs'?2:1);i++){
        const transform=new Matrix4();mesh.getMatrixAt(i,transform);const bounds=mesh.geometry.boundingBox!.clone().applyMatrix4(transform);
        expect(Math.max(Math.abs(bounds.min.x),Math.abs(bounds.max.x))).toBeLessThanOrEqual(.35);
        expect(Math.max(Math.abs(bounds.min.z+30),Math.abs(bounds.max.z+30))).toBeLessThanOrEqual(.35);
      }
    }
  });
  it("activa tres meshes del carro y vuelve a baseline al desactivarlo", () => {
    const world = createWorld();
    world.update(snapshot, []);
    const baseline = visibleMeshes(world.scene);
    const car: RenderTraffic = {
      id: "car-1",
      kind: "car",
      x: 0,
      z: 30,
      active: true,
    };
    world.update(snapshot, [car]);
    expect(visibleMeshes(world.scene)).toBe(baseline + 3);
    world.update(snapshot, [{ ...car, active: false }]);
    expect(visibleMeshes(world.scene)).toBe(baseline);
  });
  it("mantiene ambos tipos activos y omite actores fuera del alcance", () => {
    const world = createWorld();
    world.update(snapshot, []);
    const baseline = visibleMeshes(world.scene);
    const car: RenderTraffic = {
      id: "car-1",
      kind: "car",
      x: 0,
      z: 30,
      active: true,
    };
    const pedestrian: RenderTraffic = {
      id: "ped-1",
      kind: "pedestrian",
      x: 1,
      z: 40,
      active: true,
    };
    world.update(snapshot, [car, pedestrian]);
    expect(visibleMeshes(world.scene)).toBe(baseline + 6);
    world.update(snapshot, [
      { ...car, z: 220 },
      { ...pedestrian, z: -30 },
    ]);
    expect(visibleMeshes(world.scene)).toBe(baseline);
  });
});
