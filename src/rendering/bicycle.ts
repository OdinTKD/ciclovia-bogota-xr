import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export interface BicyclePresentation {
  distance:number;
  speed:number;
  elapsed:number;
  steeringAngle?:number;
  roll?:number;
  pedalEffort?:number;
}
const WHEEL_RADIUS=.34;
type Point=[number,number,number];
/** Original, low-poly mechanical model; no external model, texture or rig. */
export function createProceduralBicycle() {
 const group=new T.Group();group.name='bicycle';group.position.set(0,-.42,-1.3);group.scale.setScalar(.72);
 const steel=new T.MeshLambertMaterial({color:0xb0b8b5});
 const paint=new T.MeshLambertMaterial({color:0x276463});
 const rubber=new T.MeshLambertMaterial({color:0x20292b});
 const glove=new T.MeshLambertMaterial({color:0x3a4240});
 const cloth=new T.MeshLambertMaterial({color:0x8e493b});
 const accent=new T.MeshLambertMaterial({color:0xcda348});
 const upright=new T.Vector3(0,1,0);
 const vector=(p:Point)=>new T.Vector3(...p);
 function tube(start:Point,end:Point,radius:number,sides=8) {
  const a=vector(start),b=vector(end),direction=b.clone().sub(a);
  const geometry=new T.CylinderGeometry(radius,radius,direction.length(),sides);
  const transform=new T.Matrix4().compose(a.clone().add(b).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(upright,direction.normalize()),new T.Vector3(1,1,1));
  return geometry.applyMatrix4(transform);
 }
 function ellipsoid(at:Point,scale:Point) {return new T.SphereGeometry(1,10,6).scale(...scale).translate(...at);}
 function mesh(name:string,geometries:T.BufferGeometry[],material:T.Material,parent:T.Object3D=group){
  const geometry=geometries.length===1?geometries[0]:mergeGeometries(geometries)!;
  if(geometries.length>1)geometries.forEach(g=>g.dispose());
  const object=new T.Mesh(geometry,material);object.name=name;parent.add(object);return object;
 }
 const steering=new T.Group();steering.name='steering-pivot';group.add(steering);
 mesh('stem',[tube([0,-.28,.22],[0,.015,.015],.035),tube([0,.015,.015],[0,.015,-.08],.028)],steel,steering);
 // Bar bends toward rider at the ends; hands, grips and levers share this pivot.
 mesh('handlebar',[tube([-.36,.03,0],[.36,.03,0],.023),tube([-.36,.03,0],[-.55,.055,.09],.023),tube([.36,.03,0],[.55,.055,.09],.023)],steel,steering);
 for(const side of [-1,1]){
  const label=side<0?'left':'right';
  const grip=new T.Group();grip.name=`${label}-grip`;grip.position.set(side*.475,.05,.055);steering.add(grip);
  mesh(`${label}-grip-rubber`,[tube([-side*.09,0,-.02],[side*.09,0,.02],.037,10)],rubber,grip);
  const hand=new T.Group();hand.name=`${label}-hand`;hand.position.copy(grip.position);hand.position.y+=.035;steering.add(hand);
  const fingers:T.BufferGeometry[]=[ellipsoid([0,.015,.018],[.095,.047,.07]),ellipsoid([-side*.065,-.015,-.04],[.032,.045,.055])];
  for(let finger=0;finger<4;finger++) fingers.push(tube([-.06+finger*.04,-.025,-.035],[-.06+finger*.04,-.04,.055],.014,6));
  mesh(`${label}-glove`,fingers,glove,hand);
  const sleeveEnd:Point=[side*.8,-.5,1.1];
  mesh(`${label}-sleeve`,[tube([side*.47,.045,.16],sleeveEnd,.073,10)],cloth,steering);
  const sleeveCap=new T.Group();sleeveCap.name=`${label}-sleeve-cap`;sleeveCap.position.set(...sleeveEnd);steering.add(sleeveCap);
  mesh(`${label}-cuff`,[tube([side*.47,.045,.12],[side*.48,.035,.21],.066,8)],rubber,steering);
  mesh(`${label}-brake-lever`,[tube([side*.34,.005,-.025],[side*.48,-.035,-.095],.012,6),tube([side*.34,.005,-.025],[side*.33,.03,.015],.02,6)],steel,steering);
 }
 const cableGeometries:T.BufferGeometry[]=[];
 for(const side of [-1,1]) {
  const path=new T.CatmullRomCurve3([new T.Vector3(side*.33,-.015,-.03),new T.Vector3(side*.21,-.15,-.2),new T.Vector3(-side*.08,-.32,-.09),new T.Vector3(side*.07,-.69,-.56)]);
  cableGeometries.push(new T.TubeGeometry(path,12,.006,4,false));
 }
 mesh('brake-cables',cableGeometries,rubber,steering);
 mesh('bell',[ellipsoid([-.16,.075,.015],[.048,.027,.048])],accent,steering);
 mesh('frame',[tube([0,-.25,.17],[0,-.75,.55],.035),tube([0,-.75,.55],[0,-.28,.92],.035),tube([0,-.28,.92],[0,-.25,.17],.028),tube([0,-.75,.55],[0,-.82,1.05],.023),tube([0,-.28,.92],[0,-.82,1.05],.023)],paint);
 mesh('fork',[tube([-.065,-.28,.17],[-.065,-.82,-.57],.025),tube([.065,-.28,.17],[.065,-.82,-.57],.025)],steel,steering);
 const wheels:T.Group[]=[];
 for(const [name,z,parent] of [['front-wheel',-.57,steering],['rear-wheel',1.05,group]] as const){
  const wheel=new T.Group();wheel.name=name;wheel.position.set(0,-.82,z);parent.add(wheel);wheels.push(wheel);
  mesh(`${name}-tire`,[new T.TorusGeometry(WHEEL_RADIUS,.027,6,32).rotateY(Math.PI/2)],rubber,wheel);
  const spokes:T.BufferGeometry[]=[new T.TorusGeometry(WHEEL_RADIUS-.027,.011,4,24).rotateY(Math.PI/2),tube([-.065,0,0],[.065,0,0],.025)];
  for(let i=0;i<12;i++) {const angle=i*Math.PI/6;spokes.push(tube([i%2?.025:-.025,0,0],[0,Math.cos(angle)*.31,Math.sin(angle)*.31],.003,4));}
  mesh(`${name}-spokes`,spokes,steel,wheel);
 }
 const pedals=new T.Group();pedals.name='pedal-pivot';pedals.position.set(0,-.75,.55);group.add(pedals);
 mesh('cranks',[tube([-.09,0,0],[-.09,.15,0],.013),tube([.09,0,0],[.09,-.15,0],.013)],steel,pedals);
 mesh('pedals',[new T.BoxGeometry(.15,.04,.09).translate(-.15,.15,0),new T.BoxGeometry(.15,.04,.09).translate(.15,-.15,0)],rubber,pedals);
 // Only the steering assembly's static parts are baked together. Named anchors
 // survive for grip tests; wheels and the pedal pivot keep their own movement.
 steering.updateWorldMatrix(true,true);
 const steeringInverse=steering.matrixWorld.clone().invert();
 const batches=new Map<T.Material,T.BufferGeometry[]>();
 const staticMeshes:T.Mesh[]=[];
 function collectStatic(node:T.Object3D) {
  if(wheels.includes(node as T.Group))return;
  if(node instanceof T.Mesh)staticMeshes.push(node);
  node.children.forEach(collectStatic);
 }
 collectStatic(steering);
 for(const part of staticMeshes) {
  const material=part.material as T.Material;
  const transformed=part.geometry.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(steeringInverse,part.matrixWorld));
  if(!batches.has(material))batches.set(material,[]);
  batches.get(material)!.push(transformed);
  const anchor=new T.Group();anchor.name=part.name;
  anchor.position.copy(part.position);anchor.quaternion.copy(part.quaternion);anchor.scale.copy(part.scale);
  const parent=part.parent!;parent.remove(part);parent.add(anchor);part.geometry.dispose();
 }
 let batchIndex=0;
 for(const [material,geometries] of batches)mesh(`steering-visual-${batchIndex++}`,geometries,material,steering);
 let previousElapsed:number|undefined;
 let wheelTravel=0;
 let pedalPhase=0;
 function update(state:BicyclePresentation){
  const dt=previousElapsed===undefined?0:state.elapsed-previousElapsed;
  if(dt<0){wheelTravel=0;pedalPhase=0;}
  else {
   const travelled=Math.max(0,state.speed)*dt;
   wheelTravel+=travelled;
   pedalPhase+=travelled*Math.min(1,Math.max(0,state.pedalEffort??0))*2.2;
  }
  previousElapsed=state.elapsed;
  const effectiveWheelRadius=WHEEL_RADIUS*group.scale.x;
  for(const wheel of wheels)wheel.rotation.x=wheelTravel===0?0:-wheelTravel/effectiveWheelRadius;
  pedals.rotation.x=pedalPhase===0?0:-pedalPhase;
  steering.rotation.y=-(state.steeringAngle??0);
  group.rotation.z=-(state.roll??0)*.6;
 }
 return {group,update};
}
