import { expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Vector3 } from 'three';
import { assetGeometryStats } from '../../src/rendering/scene';
const path='public/assets/models/bicycle-rider.glb';
const base={distance:0,speed:0,elapsed:0,pedalEffort:0,steeringAngle:0,roll:0};
async function load(){const bytes=readFileSync(path);return new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');}
it('GLB original Blender editable y manifest presentes con geometría dentro de presupuesto',async()=>{
 expect(existsSync(path)).toBe(true);expect(existsSync('assets/source/bicycle/bicycle-rider.blend')).toBe(true);
 const asset=await load();const stats=assetGeometryStats(asset.scene);expect(stats.triangles).toBeGreaterThan(3276);expect(stats.triangles).toBeLessThanOrEqual(12000);expect(stats.drawCalls).toBeLessThanOrEqual(12);
 const manifest=JSON.parse(readFileSync('public/assets/models/bicycle-rider.manifest.json','utf8'));expect(manifest.provenance).toBe('original-project');expect(manifest.sha256).toBe(createHash('sha256').update(readFileSync(path)).digest('hex'));expect(manifest.bytes).toBe(readFileSync(path).byteLength);expect(manifest.triangles).toBe(stats.triangles);expect(manifest.drawCalls).toBe(stats.drawCalls);
 for(const name of ['bicycle','steering-pivot','handlebar','left-grip','right-grip','left-hand','right-hand','left-sleeve-cap','right-sleeve-cap','front-wheel','rear-wheel','pedal-pivot'])expect(asset.scene.getObjectByName(name),name).toBeDefined();
});
it('adaptador Blender mantiene agarre, dirección, cadencia y radio efectivo',async()=>{
 const {prepareBlenderBicycle}=await import('../../src/rendering/blender-bicycle');const asset=await load();const bike=prepareBlenderBicycle(asset.scene);
 expect(bike.group.name).toBe('bicycle');expect(bike.group.position.z).toBe(-1.14);expect(bike.group.position.y).toBe(-.38);expect(bike.group.scale.x).toBe(.72);
 const gap=()=>bike.group.getObjectByName('left-hand')!.getWorldPosition(new Vector3()).distanceTo(bike.group.getObjectByName('left-grip')!.getWorldPosition(new Vector3()));
 bike.group.updateMatrixWorld(true);const first=gap();bike.update(base);bike.update({...base,distance:1,speed:1,elapsed:1,pedalEffort:1,steeringAngle:.3});bike.group.updateMatrixWorld(true);
 expect(bike.group.getObjectByName('steering-pivot')!.rotation.y).toBeCloseTo(-.3);expect(gap()).toBeCloseTo(first);expect(first).toBeLessThan(.09);
 expect(Math.abs(bike.group.getObjectByName('front-wheel')!.rotation.x)*.34*.72).toBeCloseTo(1);expect(Math.abs(bike.group.getObjectByName('pedal-pivot')!.rotation.x)).toBeGreaterThan(0);
});
it('GLB PBR conserva ejes, encuadre y extremos de mangas fuera de pantalla',async()=>{
 const {prepareBlenderBicycle}=await import('../../src/rendering/blender-bicycle');
 const {PerspectiveCamera,Mesh,MeshStandardMaterial}=await import('three');
 const bike=prepareBlenderBicycle((await load()).scene);const front=bike.group.getObjectByName('front-wheel')!;
 expect(front.position.y).toBeCloseTo(-.82);expect(front.position.z).toBeCloseTo(-.57);
 bike.group.traverse(node=>{if(node instanceof Mesh){expect(node.material).toBeInstanceOf(MeshStandardMaterial);expect(node.geometry.getAttribute('color')).toBeDefined();}});
 const camera=new PerspectiveCamera(65,393/851,.06,500);camera.add(bike.group);
 for(const [width,height] of [[393,851],[1280,720]]){
  camera.aspect=width/height;camera.updateProjectionMatrix();
  for(const steeringAngle of [-.48,0,.48]){
   bike.update({...base,steeringAngle,roll:.3});camera.updateMatrixWorld(true);
   for(const side of ['left','right']){
    const cap=bike.group.getObjectByName(`${side}-sleeve-cap`)!.getWorldPosition(new Vector3()).project(camera);expect(cap.y < -1 || Math.abs(cap.x)>1).toBe(true);
   }
  }
 }
});


it('encuadre primera persona da presencia a palmas sin tapar horizonte',async()=>{
 const {prepareBlenderBicycle}=await import('../../src/rendering/blender-bicycle');const {PerspectiveCamera}=await import('three');
 const bike=prepareBlenderBicycle((await load()).scene);const camera=new PerspectiveCamera(65,1280/720,.06,500);camera.add(bike.group);camera.updateMatrixWorld(true);
 for(const side of ['left','right']){
  const inner=bike.group.getObjectByName(`${side}-palm-inner`);const outer=bike.group.getObjectByName(`${side}-palm-outer`);expect(inner).toBeDefined();expect(outer).toBeDefined();
  const a=inner!.getWorldPosition(new Vector3()).project(camera);const b=outer!.getWorldPosition(new Vector3()).project(camera);
  expect(Math.abs(a.x-b.x)*640).toBeGreaterThan(60);
  const center=bike.group.getObjectByName(`${side}-hand`)!.getWorldPosition(new Vector3()).project(camera);expect(center.y).toBeLessThan(-.3);expect(center.y).toBeGreaterThan(-.75);
 }
});
