import { describe, it, expect } from 'vitest';
import { Vector3, InstancedMesh, Matrix4, Mesh } from 'three';
import { createWorld } from '../../src/rendering/scene';
const base={x:0,distance:0,speed:0,weather:'sun',elapsed:0};
describe('cámara y mundo puerta A',()=>{
 it.each([[393,851],[1280,720]])('manillar y manos visibles por nombres en viewport %sx%s',(width,height)=>{
  const {scene,camera}=createWorld();camera.aspect=width/height;camera.updateProjectionMatrix();scene.updateMatrixWorld(true);
  for(const name of ['handlebar','left-hand','right-hand']){
   const node=camera.getObjectByName(name);expect(node,`${name} existe`).toBeDefined();
   const point=node!.getWorldPosition(new Vector3()).project(camera);
   expect(point.y).toBeGreaterThan(-.92);expect(point.y).toBeLessThan(.2);expect(Math.abs(point.x)).toBeLessThan(1);
  }
 });
 it('mueve cámara en mundo fijo sin reciclar ciudad cada 14 metros',()=>{
  const world=createWorld();const city=world.scene.getObjectByName('environment')!;expect(city).toBeDefined();
  const before=city.position.clone();world.update({...base,distance:29,worldZ:-26,yaw:.2,roll:.04},[]);
  expect(world.camera.position.z).toBeCloseTo(-26+Math.cos(.2)*1.3);expect(world.camera.position.x).toBeCloseTo(-Math.sin(.2)*1.3);expect(world.camera.rotation.y).toBeCloseTo(-.2);expect(world.camera.rotation.z).toBeCloseTo(.006);
  expect(city.position.equals(before)).toBe(true);
  world.update({...base,distance:30},[]);expect(world.camera.position.z).toBeCloseTo(-28.7);expect(city.position.equals(before)).toBe(true);
 });
 it.each([[393,851],[1280,720]])('extremos de mangas fuera del encuadre %sx%s incluso al girar',(width,height)=>{
  const world=createWorld();world.camera.aspect=width/height;world.camera.updateProjectionMatrix();
  for(const steeringAngle of [-.48,0,.48]){
   world.update({...base,steeringAngle,roll:.3},[]);world.scene.updateMatrixWorld(true);
   for(const side of ['left','right']){
    const cap=world.scene.getObjectByName(`${side}-sleeve-cap`);expect(cap).toBeDefined();
    const projected=cap!.getWorldPosition(new Vector3()).project(world.camera);
    expect(projected.y < -1 || Math.abs(projected.x)>1).toBe(true);
   }
  }
 });
 it('pone neumático frontal detrás de la cara frontal del collider',()=>{
  const world=createWorld();world.update(base,[]);world.scene.updateMatrixWorld(true);
  const tire=world.scene.getObjectByName('front-wheel-tire') as Mesh;tire.geometry.computeBoundingBox();
  const bounds=tire.geometry.boundingBox!.clone().applyMatrix4(tire.matrixWorld);
  expect(bounds.min.z).toBeGreaterThanOrEqual(-.7);
  expect(world.camera.position.z).toBe(1.3);
 });
 it('bordillos visibles coinciden con cara interior física a 2.75 metros',()=>{
  const world=createWorld();const curbs=world.scene.getObjectByName('boundary-cue') as InstancedMesh;expect(curbs).toBeDefined();curbs.geometry.computeBoundingBox();
  for(let i=0;i<2;i++){
   const transform=new Matrix4();curbs.getMatrixAt(i,transform);const bounds=curbs.geometry.boundingBox!.clone().applyMatrix4(transform);
   const inner=i===0?-bounds.max.x:bounds.min.x;expect(inner).toBeCloseTo(2.75);
   expect(bounds.max.y).toBeGreaterThanOrEqual(.15);
  }
 });
 it('reduce y limita roll de cámara sin cancelar inclinación de bicicleta',()=>{
  const world=createWorld();world.update({...base,roll:.3},[]);
  expect(world.camera.rotation.z).toBeCloseTo(.045);
  expect(world.scene.getObjectByName('bicycle')!.rotation.z).toBeCloseTo(-.18);
  world.update({...base,roll:2},[]);expect(Math.abs(world.camera.rotation.z)).toBeLessThanOrEqual(.052);
 });
 it('mantiene ubicación absoluta de actores y bounds válidos',()=>{
  const world=createWorld();world.update({...base,distance:20},[{id:'car',kind:'car',x:1,z:30,active:true}]);
  const bodies=world.scene.getObjectByName('car-bodies') as InstancedMesh;expect(bodies).toBeDefined();
  const m=new Matrix4();bodies.getMatrixAt(0,m);expect(new Vector3().setFromMatrixPosition(m).z).toBe(-30);
  world.scene.traverse(node=>{if(node instanceof InstancedMesh && node.visible && node.frustumCulled){expect(node.boundingSphere).not.toBeNull();expect(Number.isFinite(node.boundingSphere!.radius)).toBe(true);}});
 });
});
