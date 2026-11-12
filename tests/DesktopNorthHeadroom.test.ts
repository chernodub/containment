import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {roomFocus} from '../src/render/roomFraming';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {DepthRenderer} from '../src/render/DepthRenderer';
function forRoom(room:(typeof ROOM_TEMPLATES)[keyof typeof ROOM_TEMPLATES]){return function projection(width:number,height:number,x:number,z:number,focusZ?:number){
 const view=height>width?31:22,viewWidth=view*width/height;
 const focus=roomFocus(x,z,room.width/32,room.height/32,viewWidth,view,room.id);
 const camera=new T.OrthographicCamera(-viewWidth/2,viewWidth/2,view/2,-view/2,.1,120);
 camera.position.set(focus.x,26,(focusZ??focus.z)+19);camera.lookAt(focus.x,0,focusZ??focus.z);camera.updateMatrixWorld(true);
 const root=new T.Group();root.position.set(x,0,z);
 const renderer=Object.assign(Object.create(DepthRenderer.prototype),{camera,player:{root,height:2.2},canvas:{getBoundingClientRect:()=>({left:0,top:0,width,height})}}) as DepthRenderer;
 return {bounds:renderer.playerScreenBounds(16),camera,focus};
};}
describe.each(Object.values(ROOM_TEMPLATES))('$id desktop actor framing',(template)=>{
 const room=template,projection=forRoom(room);
 it.each([[1280,900],[1280,720],[960,540],[600,600],[800,1000]])('keeps legal north-edge body envelopes inside a %ix%i desktop window',(width,height)=>{
  // Includes both captured Room12/Armory failures and the radius16 room envelope.
  for(const [x,z] of [[199.38911325811296/32,34.4735147747494/32],[479.2437006170747/32,38.25797482541365/32],[16/32,16/32],[room.width/64,16/32],[(room.width-16)/32,16/32]]){
   const {bounds,camera}=projection(width,height,x,z);
   expect(bounds.top).toBeGreaterThanOrEqual(8);expect(bounds.left).toBeGreaterThanOrEqual(0);
   expect(bounds.right).toBeLessThanOrEqual(width);expect(bounds.bottom).toBeLessThanOrEqual(height);expect(camera.zoom).toBe(1);
  }
 });
 it('follows the actor at center and south without pushing it toward HUD edges',()=>{
  const center=roomFocus(room.width/64,room.height/64,room.width/32,room.height/32,22*1280/900,22,room.id);
  expect(center).toEqual({x:room.width/64,z:room.height/64});
  const south=roomFocus(room.width/64,room.height/32-.5,room.width/32,room.height/32,22*1280/900,22,room.id);
  expect(south.x).toBe(room.width/64);expect(south.z).toBeLessThan(room.height/32-.5);
 });
 it.each([1/60,.05,.1])('retains body visibility during native camera following at dt%s',dt=>{
  let z=room.height/64,focusZ=z,previous=focusZ;
  for(let i=0;i<600;i++){
   z=Math.max(.5,z-220/32*dt);
   const desired=projection(1280,900,266.751/32,z).focus.z;
   focusZ+=(desired-focusZ)*(1-Math.exp(-dt*7));
   const {bounds,camera}=projection(1280,900,266.751/32,z,focusZ);
   expect(bounds.top).toBeGreaterThanOrEqual(8);expect(Math.abs(focusZ-previous)).toBeLessThanOrEqual(220/32*dt+.0001);
   expect(camera.zoom).toBe(1);previous=focusZ;
  }
 });
});
