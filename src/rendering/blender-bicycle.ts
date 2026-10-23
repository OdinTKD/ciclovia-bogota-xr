import { Group } from 'three';
import type { BicyclePresentation } from './bicycle';
const PRESENTATION_SCALE=.72;
const PRESENTATION_Y=-.38;
const PRESENTATION_Z=-1.14;
const WHEEL_RADIUS=.34;
const PEDAL_PHASE_PER_METER=2.2;
const PORTRAIT_REFERENCE_ASPECT=1.15;
const MIN_PRESENTATION_FACTOR=.55;
/** Adapt original Blender/glTF hierarchy without changing the game's animation contract. */
export function prepareBlenderBicycle(root:Group) {
 const group=new Group();group.name='bicycle';group.position.set(0,PRESENTATION_Y,PRESENTATION_Z);group.scale.setScalar(PRESENTATION_SCALE);
 const authoredRoot=root.getObjectByName('bicycle');if(authoredRoot)authoredRoot.name='bicycle-authored';
 group.add(root);
 const required=(name:string)=>{const node=group.getObjectByName(name);if(!node)throw new Error(`Modelo de bicicleta inválido: falta ${name}`);return node;};
 const steering=required('steering-pivot');const wheels=[required('front-wheel'),required('rear-wheel')];const pedals=required('pedal-pivot');
 let previousElapsed:number|undefined;let wheelTravel=0;let pedalPhase=0;
 function resize(aspect:number){
  // Uniform scaling keeps hands, round tubes and wheels proportional in portrait.
  const factor=Math.min(1,Math.max(MIN_PRESENTATION_FACTOR,aspect/PORTRAIT_REFERENCE_ASPECT));
  group.scale.setScalar(PRESENTATION_SCALE*factor);
 }
 function update(state:BicyclePresentation){
  const dt=previousElapsed===undefined?0:state.elapsed-previousElapsed;
  if(dt<0){wheelTravel=0;pedalPhase=0;}
  else {const travelled=Math.max(0,state.speed)*dt;wheelTravel+=travelled;pedalPhase+=travelled*Math.min(1,Math.max(0,state.pedalEffort??0))*PEDAL_PHASE_PER_METER;}
  previousElapsed=state.elapsed;
  const effectiveRadius=WHEEL_RADIUS*group.scale.x;
  for(const wheel of wheels)wheel.rotation.x=wheelTravel===0?0:-wheelTravel/effectiveRadius;
  pedals.rotation.x=pedalPhase===0?0:-pedalPhase;
  steering.rotation.y=-(state.steeringAngle??0);group.rotation.z=-(state.roll??0)*.6;
 }
 return {group,update,resize};
}
