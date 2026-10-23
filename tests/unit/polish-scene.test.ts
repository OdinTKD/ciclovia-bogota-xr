import {expect,it} from 'vitest';
import {HemisphereLight,DirectionalLight,Mesh,MeshLambertMaterial,InstancedMesh} from 'three';
import {createWorld} from '../../src/rendering/scene';
it('continúa asfalto neutro fuera de la muestra y conserva relleno legible en sombras',()=>{
 const world=createWorld();
 const road=world.scene.children.find(o=>o instanceof InstancedMesh&&o.count===1&&o.instanceMatrix.array[0]===6) as Mesh;
 expect(road).toBeDefined();
 const color=(road.material as MeshLambertMaterial).color;
 expect(Math.abs(color.g-color.r)).toBeLessThan(.03);
 expect(Math.abs(color.b-color.r)).toBeLessThan(.05);
 const fill=world.scene.children.find(o=>o instanceof HemisphereLight) as HemisphereLight;
 const sun=world.scene.children.find(o=>o instanceof DirectionalLight) as DirectionalLight;
 expect(fill.intensity).toBeGreaterThanOrEqual(1.7);
 world.update({x:0,distance:0,speed:0,weather:'sun',elapsed:0},[]);
 expect(sun.intensity).toBeLessThanOrEqual(2);
 world.dispose();
});
