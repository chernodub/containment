import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {CameraRig} from './CameraRig';
import {COMBAT_VIEW_HEIGHT,protectPlayerFrame,combatFocusTarget} from './CombatFraming';
import {HudCombatFraming} from './HudCombatFraming';
import {DepthRenderer} from '../DepthRenderer';

const desktopSizes=[[1920,1080],[1280,720],[2560,1440],[900,900]];
function setup(width:number,height:number,perspective=true){
 const view=COMBAT_VIEW_HEIGHT,span=view*width/height,camera=perspective?new T.PerspectiveCamera(28,width/height,.1,160):new T.OrthographicCamera(-span/2,span/2,view/2,-view/2,.1,160),rig=new CameraRig(),framing=new HudCombatFraming();
 framing.resize(width,height);framing.setInsets({top:0,right:300*width/1920,bottom:160*height/1080,left:280*width/1920});
 rig.reset(15,14);rig.apply(camera,1,view,0);
 return {camera,rig,framing,point:new T.Vector3(),target:new T.Vector3()};
}
function bounds(camera:T.Camera,x:number,z:number,r:number,h:number){
 const out={left:Infinity,right:-Infinity,top:-Infinity,bottom:Infinity},p=new T.Vector3();
 for(const ix of [-1,1])for(const iz of [-1,1])for(const iy of [0,1]){p.set(x+ix*r,iy*h,z+iz*r).project(camera);out.left=Math.min(out.left,p.x);out.right=Math.max(out.right,p.x);out.top=Math.max(out.top,p.y);out.bottom=Math.min(out.bottom,p.y);}
 return out;
}

describe('HUD-aware combat viewport',()=>{
 it('defaults to the full frame and preserves requested CSS pixels across a later resize',()=>{
  const framing=new HudCombatFraming();framing.resize(1920,1080);expect(framing.insets).toEqual({top:0,right:0,bottom:0,left:0});expect(framing.viewport.halfX).toBe(1);
  framing.setInsets({top:0,right:300,bottom:160,left:280});expect(framing.insets).toEqual({top:0,right:300,bottom:160,left:280});
  framing.resize(600,400);expect(framing.insets.left+framing.insets.right).toBeCloseTo(390);expect(framing.viewport.halfX).toBeGreaterThanOrEqual(.35-1e-6);
  framing.resize(1920,1080);expect(framing.insets).toEqual({top:0,right:300,bottom:160,left:280});
  framing.setInsets({top:NaN,right:Infinity,bottom:-10,left:20});expect(framing.insets).toEqual({top:0,right:0,bottom:0,left:20});
 });
 it.each(desktopSizes)('places the optical center within CSS insets at %ix%i without accumulating spring drift',(width,height)=>{
  const {camera,rig,framing,point,target}=setup(width,height);
  const before=rig.focus.clone();
  for(let frame=0;frame<120;frame++){rig.apply(camera,1,COMBAT_VIEW_HEIGHT,0);framing.center(camera,rig.focus,point,target);point.copy(rig.focus).project(camera);expect(point.x).toBeCloseTo(framing.viewport.centerX,9);expect(point.y).toBeCloseTo(framing.viewport.centerY,9);expect(rig.focus.toArray()).toEqual(before.toArray());}
 });
 it.each([false,true])('keeps the marine and a fitting aimed engagement above the bottom dock with perspective=%s',perspective=>{
  for(const [width,height]of desktopSizes)for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2]){
   const {camera,rig,framing,point,target}=setup(width,height,perspective),x=15,z=14,ex=x+Math.cos(angle)*6,ez=z+Math.sin(angle)*6;
   const enemies=[{x:ex*32,y:ez*32,radius:24,health:100,windupMs:200}];
   framing.selectContacts(x,z,angle,enemies);combatFocusTarget(x,z,angle,0,0,false,false,point);framing.biasTarget(x,z,angle,false,false,point);rig.reset(point.x,point.z);rig.apply(camera,1,COMBAT_VIEW_HEIGHT,0);framing.center(camera,rig.focus,point,target);
   framing.protectEngagement(camera,rig.focus,x,z,.5,2.2,point,target);protectPlayerFrame(camera,rig.focus,x,z,.5,2.2,point,target,framing.viewport);
   const v=framing.viewport,a=bounds(camera,x,z,.5,2.2),b=bounds(camera,ex,ez,.75,2.65);
   expect(a.left).toBeGreaterThan(v.left);expect(a.right).toBeLessThan(v.right);expect(a.top).toBeLessThan(v.top);expect(a.bottom).toBeGreaterThan(v.bottom);
   expect(b.left,`${width}x${height},angle${angle}`).toBeGreaterThanOrEqual(v.left-1e-5);expect(b.right).toBeLessThanOrEqual(v.right+1e-5);expect(b.top).toBeLessThanOrEqual(v.top+1e-5);expect(b.bottom).toBeGreaterThanOrEqual(v.bottom-1e-5);
   expect(camera.zoom).toBeGreaterThanOrEqual(.85);expect(framing.diagnostics.fit).toBe(true);
  }
 });
 it('weights nearby attacking contacts and aimed targets while ignoring remote idle enemies',()=>{
  const f=new HudCombatFraming(),out=new T.Vector3();f.resize(1920,1080);
  f.selectContacts(0,0,0,[{x:32*5,y:0,radius:20},{x:-32*20,y:0,radius:20}]);f.biasTarget(0,0,0,false,false,out);expect(out.x).toBeGreaterThan(1.8);expect(out.x).toBeLessThan(2.8);expect(out.z).toBe(0);expect(f.diagnostics.contacts).toBe(1);
  f.selectContacts(0,0,0,[{x:-32*3,y:0,radius:20,windupMs:100}]);f.biasTarget(0,0,0,true,false,out);expect(out.x).toBeLessThan(0);expect(Math.abs(out.x)).toBeLessThanOrEqual(1.1);
  f.selectContacts(0,0,0,[{x:32*20,y:0,radius:20}]);expect(f.hasEngagement).toBe(false);
 });
 it('keeps a fitting six-contact engagement together instead of protecting only its centroid',()=>{
  const {camera,rig,framing,point,target}=setup(1920,1080),x=15,z=14;
  const enemies=Array.from({length:6},(_,i)=>({id:i+1,x:(x-2+i*.8)*32,y:(z+3.4+i*.3)*32,radius:20,health:100,windupMs:200}));
  framing.selectContacts(x,z,Math.PI/2,enemies);framing.center(camera,rig.focus,point,target);framing.protectEngagement(camera,rig.focus,x,z,.5,2.2,point,target);protectPlayerFrame(camera,rig.focus,x,z,.5,2.2,point,target,framing.viewport);
  expect(framing.diagnostics.contacts).toBe(6);expect(framing.diagnostics.focusedPair).toBe(false);expect(framing.diagnostics.fit).toBe(true);
  for(const e of enemies){const b=bounds(camera,e.x/32,e.y/32,e.radius/32,2.65);expect(b.bottom).toBeGreaterThanOrEqual(framing.viewport.bottom);expect(b.top).toBeLessThanOrEqual(framing.viewport.top);}
 });
 it('projects the actual cached height of a tall selected contact rather than truncating it to the family fallback',()=>{
  const {camera,rig,framing,point,target}=setup(1920,1080),x=15,z=14,ex=17,ez=18;
  framing.selectContacts(x,z,Math.PI/2,[{id:71,x:ex*32,y:ez*32,radius:25,health:100}],32,()=>4.2);
  framing.center(camera,rig.focus,point,target);framing.protectEngagement(camera,rig.focus,x,z,.5,2.2,point,target);protectPlayerFrame(camera,rig.focus,x,z,.5,2.2,point,target,framing.viewport);
  const b=bounds(camera,ex,ez,25/32,4.2);expect(b.bottom).toBeGreaterThanOrEqual(framing.viewport.bottom);expect(b.top).toBeLessThanOrEqual(framing.viewport.top);expect(framing.diagnostics.selectedIds[0]).toBe(71);
 });
 it('uses the rendered camera for native pointer/visibility and cached CSS player bounds after HUD framing',()=>{
  const {camera,rig,framing,point,target}=setup(1920,1080),root=new T.Group();root.position.set(15,0,14);
  framing.center(camera,rig.focus,point,target);protectPlayerFrame(camera,rig.focus,15,14,.5,2.2,point,target,framing.viewport);
  const rect={left:11,top:17,width:1920,height:1080},probe=Object.assign(Object.create(DepthRenderer.prototype),{camera,cameraRig:rig,hudFraming:framing,viewportSize:{width:1920,height:1080},canvasRect:rect,canvas:{getBoundingClientRect:()=>rect},player:{root,height:2.2},visiblePoint:new T.Vector3(),screenPoint:new T.Vector3(),screenTarget:new T.Vector3(),raycaster:new T.Raycaster(),ground:new T.Plane(new T.Vector3(0,1,0),0),actors:new Map()});
  const projected=new T.Vector3(16,0,13).project(camera),pointer=probe.pointer(rect.left+(projected.x+1)*960,rect.top+(1-projected.y)*540);expect(pointer.x).toBeCloseTo(16*32,8);expect(pointer.y).toBeCloseTo(13*32,8);
  expect(probe.visible(15*32,14*32)).toBe(true);expect(probe.hudInsets.bottom).toBe(160);expect(probe.viewportHeight).toBe(1080);
  const b=probe.playerScreenBounds(16);expect(b.left).toBeGreaterThanOrEqual(rect.left+280);expect(b.right).toBeLessThanOrEqual(rect.left+1920-300);expect(b.bottom).toBeLessThanOrEqual(rect.top+1080-160);
  const floorNdc=new T.Vector3(0,-.9,0).unproject(camera),origin=camera.position,direction=floorNdc.sub(origin);floorNdc.multiplyScalar(-origin.y/direction.y).add(origin);
  expect(probe.visible(floorNdc.x*32,floorNdc.z*32)).toBe(false);
 });
 it('projects tall enemy and Queen body corners into cached CSS coordinates without viewport reads or new bounds',()=>{
  for(const perspective of [false,true]){
   const {camera,rig,framing,point,target}=setup(1920,1080,perspective);
   framing.center(camera,rig.focus,point,target);
   const root=new T.Group();root.position.y=.18;
   const enemy={root,height:4.2},queen={root,height:6.1},rect={left:11,top:17,width:1920,height:1080};
   const probe=Object.assign(Object.create(DepthRenderer.prototype),{camera,canvasRect:rect,canvas:{width:960,height:540,getBoundingClientRect(){throw Error('Body projection measured the DOM');}},actors:new Map([[71,enemy]]),queen,screenPoint:new T.Vector3()});
   const output={left:0,right:0,top:0,bottom:0};
   for(const [id,radius,height]of [[71,25,4.2],[-1,92,6.1]]){
    expect(probe.actorScreenBounds(id,17*32,18*32,radius,output)).toBe(true);
    const expected={left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity};
    for(const x of [17-radius/32,17+radius/32])for(const z of [18-radius/32,18+radius/32])for(const y of [.18,.18+height]){
     const p=new T.Vector3(x,y,z).project(camera),px=rect.left+(p.x+1)*rect.width/2,py=rect.top+(1-p.y)*rect.height/2;
     expected.left=Math.min(expected.left,px);expected.right=Math.max(expected.right,px);expected.top=Math.min(expected.top,py);expected.bottom=Math.max(expected.bottom,py);
    }
    for(const edge of ['left','right','top','bottom'] as const)expect(output[edge]).toBeCloseTo(expected[edge],9);
    const center=new T.Vector3(17,.8,18).project(camera);
    expect(output.top).toBeLessThan(rect.top+(1-center.y)*rect.height/2-24);
   }
   const retained={...output};
   expect(probe.actorScreenBounds(999,17*32,18*32,25,output)).toBe(false);expect(output).toEqual(retained);
   expect(probe.actorScreenBounds(71,NaN,18*32,25,output)).toBe(false);expect(output).toEqual(retained);
  }
 });
});
