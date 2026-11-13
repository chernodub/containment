import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {HudCombatFraming} from './HudCombatFraming';
import {RoomCombatFraming} from './RoomCombatFraming';

// Actual integrated c6-kiting-containment-annulus phase04 receipt: all ten live
// enemies were above the HUD despite the nearest selected contact only3.625m away.
const world=[1,0,0,0,0,.5900165893423099,-.807391122257898,0,0,.807391122257898,.5900165893423099,0,28.3556884948879,24.287016892935643,38.97306114734424,1];
const inverseProjection=[.34200285637611144,0,0,0,0,.19237660671156276,0,0,0,0,0,-4.996875,0,0,-1,5.003124999999999];
const boundary=[{x:80,y:40},{x:1120,y:40},{x:1160,y:80},{x:1160,y:800},{x:1120,y:840},{x:80,y:840},{x:40,y:800},{x:40,y:80}];
const marine={x:990/32,z:599.3999999999987/32,height:2.05,radius:.5};
const contact={id:4,x:1038.6833612652295,y:494.11407064369524,radius:17,health:100,windupMs:200};
function fixture(){
 const camera=new T.PerspectiveCamera(28,16/9,.1,160);camera.zoom=1.2960411720797593;
 camera.matrixWorld.fromArray(world);camera.matrixWorld.decompose(camera.position,camera.quaternion,camera.scale);
 camera.projectionMatrixInverse.fromArray(inverseProjection);camera.projectionMatrix.copy(camera.projectionMatrixInverse).invert();camera.updateMatrixWorld();
 const hud=new HudCombatFraming();hud.resize(1920,1080);hud.setInsets({top:182,right:292,bottom:120,left:0});
 const contacts=[
  {id:1,x:915.7550276188347,y:402.3607768174527,radius:28,health:100,height:3.2700587064027786},
  {...contact,height:1.2774049267172813},
  {id:5,x:870.0868237953739,y:483.1511033378302,radius:14,health:100,height:.8115968108177185},
  {id:6,x:917.5305998979428,y:336.3226800071922,radius:24,health:100,height:3.427784353494644},
  {id:10,x:1102.2105906155155,y:429.43007640929346,radius:17,health:100,height:1.2774049267172813},
  {id:11,x:871.6662087120272,y:431.70142536028453,radius:14,health:100,height:1.0388439148664474},
 ];
 hud.selectContacts(marine.x,marine.z,-Math.PI*.5,contacts,32,id=>contacts.find(c=>c.id===id)!.height);
 const focus=new T.Vector3(camera.position.x,0,camera.position.z-17.75),final=new RoomCombatFraming();
 return{camera,hud,focus,final};
}
describe('I10 final room and nearby engagement solve',()=>{
 it.each([false,true])('keeps the captured nearby urgent body in the usable viewport, reduced=%s',reduced=>{
  const {camera,hud,focus,final}=fixture();hud.refreshFit(camera,new T.Vector3());expect(hud.diagnostics.fit).toBe(false);
  final.apply(camera,focus,marine.x,marine.z,marine.radius,marine.height,37.5,27.5,hud.viewport,1080,1/60,reduced,boundary,hud);
  expect(hud.diagnostics.fit).toBe(true);expect(final.diagnostics.heroPixels).toBeGreaterThanOrEqual(99.5);
  expect(final.diagnostics.outside).toBeLessThanOrEqual(.18);
  const point=new T.Vector3();
  for(const [x,z,r,h]of [[marine.x,marine.z,marine.radius,marine.height],[contact.x/32,contact.y/32,contact.radius/32,1.2774049267172813]]){
   for(const dx of [-r,r])for(const dz of [-r,r])for(const y of [0,h]){
    point.set(x+dx,y,z+dz).project(camera);
    expect(point.x).toBeGreaterThanOrEqual(hud.viewport.left-1e-5);expect(point.x).toBeLessThanOrEqual(hud.viewport.right+1e-5);
    expect(point.y).toBeGreaterThanOrEqual(hud.viewport.bottom-1e-5);expect(point.y).toBeLessThanOrEqual(hud.viewport.top+1e-5);
   }
  }
 });
});

it('attempts the full Queen and retains an honest failed fit when fixed-tilt geometry cannot fit at100px',()=>{
 const {camera,hud,focus,final}=fixture();
 camera.zoom=1.3356644891918674;camera.projectionMatrixInverse.fromArray([.33185712910620674,0,0,0,0,.1866696351222413,0,0,0,0,0,-4.996875,0,0,-.9999999999999999,5.003125]);camera.projectionMatrix.copy(camera.projectionMatrixInverse).invert();
 camera.matrixWorld.fromArray([1,0,0,0,0,.5900165893423099,-.807391122257898,0,0,.807391122257898,.5900165893423099,0,26.04347643839551,24.287016892935643,35.33601175126292,1]);camera.matrixWorld.decompose(camera.position,camera.quaternion,camera.scale);camera.updateMatrixWorld();
 const px=620/32,pz=700/32,qx=720/32,qz=540/32,queenHeight=8.099328875541687;
 focus.set(camera.position.x,0,camera.position.z-17.75);hud.selectPrimaryContact(-1,qx,qz,3.4,queenHeight);
 final.apply(camera,focus,px,pz,.5,2.05,45,33.75,hud.viewport,1080,1/60,false,undefined,hud);
 expect(hud.diagnostics.contacts).toBe(1);expect(hud.diagnostics.focusedPair).toBe(true);expect(hud.diagnostics.fit).toBe(false);expect(final.diagnostics.heroPixels).toBeGreaterThanOrEqual(99.5);expect(final.diagnostics.outside).toBeLessThanOrEqual(.18);
});
