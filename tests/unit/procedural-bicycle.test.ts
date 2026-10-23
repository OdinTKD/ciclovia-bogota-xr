import { describe, it, expect } from 'vitest';
import { Vector3, Mesh, MeshLambertMaterial, Color } from 'three';
import { createProceduralBicycle } from '../../src/rendering/bicycle';
import { assetGeometryStats, SCENE_BUDGET, createWorld } from '../../src/rendering/scene';
const base={distance:0,speed:0,elapsed:0,pedalEffort:0,steeringAngle:0,roll:0};
describe('bicicleta procedural original puerta A',()=>{
 it('incluye jerarquía mecánica nombrada, manos, mangas, frenos y cables',()=>{
  const bike=createProceduralBicycle();
  for(const name of ['bicycle','steering-pivot','handlebar','left-grip','right-grip','left-hand','right-hand','left-sleeve','right-sleeve','brake-cables','front-wheel','rear-wheel','pedal-pivot'])expect(bike.group.getObjectByName(name),name).toBeDefined();
 });
 it('gira manillar y mantiene manos sobre sus puños',()=>{
  const bike=createProceduralBicycle();
  const gaps=()=>['left','right'].map(side=>bike.group.getObjectByName(`${side}-hand`)!.getWorldPosition(new Vector3()).distanceTo(bike.group.getObjectByName(`${side}-grip`)!.getWorldPosition(new Vector3())));
  bike.group.updateMatrixWorld(true);const before=gaps();bike.update({...base,steeringAngle:.3,roll:.1});bike.group.updateMatrixWorld(true);
  expect(bike.group.getObjectByName('steering-pivot')!.rotation.y).toBeCloseTo(-.3);
  gaps().forEach((gap,i)=>{expect(gap).toBeLessThan(.09);expect(gap).toBeCloseTo(before[i]);});
 });
 it('ruedas responden al desplazamiento y pedales solo al esfuerzo mientras avanza',()=>{
  const bike=createProceduralBicycle();bike.update(base);
  const front=bike.group.getObjectByName('front-wheel')!;const pedals=bike.group.getObjectByName('pedal-pivot')!;
  bike.update({...base,distance:1,speed:4,elapsed:1,pedalEffort:0});expect(Math.abs(front.rotation.x)).toBeGreaterThan(.1);expect(pedals.rotation.x).toBe(0);
  const first=front.rotation.x;bike.update({...base,distance:1,speed:0,elapsed:2,pedalEffort:1});expect(front.rotation.x).toBe(first);expect(pedals.rotation.x).toBe(0);
  bike.update({...base,distance:2,speed:4,elapsed:3,pedalEffort:1});expect(Math.abs(pedals.rotation.x)).toBeGreaterThan(.1);
 });
 it('no inventa rodadura por cambiar progreso sin velocidad real',()=>{const bike=createProceduralBicycle();bike.update(base);bike.update({...base,distance:2,speed:0,elapsed:1});expect(bike.group.getObjectByName('front-wheel')!.rotation.x).toBe(0);});
 it('usa el radio efectivo escalado para mantener rodadura coherente',()=>{
  const bike=createProceduralBicycle();bike.update(base);bike.update({...base,speed:1,distance:1,elapsed:1});
  const angle=Math.abs(bike.group.getObjectByName('front-wheel')!.rotation.x);
  expect(angle*(.34*bike.group.scale.x)).toBeCloseTo(1);
 });
 it('conserva los seis colores originales por vértice con un material compartido',()=>{
  const bike=createProceduralBicycle();const materials=new Set();const colors:Color[]=[];
  bike.group.traverse(node=>{if(node instanceof Mesh){materials.add(node.material);expect(node.material).toBeInstanceOf(MeshLambertMaterial);expect((node.material as MeshLambertMaterial).vertexColors).toBe(true);const attribute=node.geometry.getAttribute('color');expect(attribute).toBeDefined();expect(attribute.count).toBe(node.geometry.getAttribute('position').count);for(let i=0;i<attribute.count;i++)colors.push(new Color(attribute.getX(i),attribute.getY(i),attribute.getZ(i)));}});
  expect(materials.size).toBe(1);
  for(const hex of [0xb0b8b5,0x276463,0x20292b,0x3a4240,0x8e493b,0xcda348]){const expected=new Color(hex);expect(colors.some(color=>Math.abs(color.r-expected.r)<1e-6&&Math.abs(color.g-expected.g)<1e-6&&Math.abs(color.b-expected.b)<1e-6)).toBe(true);}
 });
 it('inventario real de geometría/materiales cumple presupuesto sin estimar archivos',()=>{
  const bike=createProceduralBicycle();const stats=assetGeometryStats(bike.group);
  expect(stats.triangles).toBe(3276);expect(stats.materials).toBe(1);expect(stats.meshes).toBeLessThanOrEqual(5);expect(stats.drawCalls).toBeLessThanOrEqual(5);
  console.info('Procedural bicycle inventory',stats);const total=assetGeometryStats(createWorld().scene);console.info('World inventory',total);expect(total.drawCalls).toBeLessThanOrEqual(SCENE_BUDGET.drawCalls);expect(total.triangles).toBeLessThanOrEqual(SCENE_BUDGET.triangles);
 });
});
