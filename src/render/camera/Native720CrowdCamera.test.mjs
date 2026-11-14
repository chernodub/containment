import {test,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {HudCombatFraming} from './HudCombatFraming';
import {RoomCombatFraming} from './RoomCombatFraming';
const fixtures=JSON.parse(readFileSync(new URL('../../../tests/fixtures/native720-crowd-cameras.json',import.meta.url),'utf8'));
function box(camera,a,width,height){const p=new T.Vector3(),b={left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity};for(const ix of[-1,1])for(const iz of[-1,1])for(const y of[0,a.height]){p.set(a.x+ix*a.radius,y,a.z+iz*a.radius).project(camera);const x=(p.x+1)*width/2,sy=(1-p.y)*height/2;b.left=Math.min(b.left,x);b.right=Math.max(b.right,x);b.top=Math.min(b.top,sy);b.bottom=Math.max(b.bottom,sy);}return b;}
test.each([false,true])('fits actual720 Passenger02 allsix with captured fixed-pixel HUD, reduced=%s',reduced=>{
 const f=fixtures[0].inputs,{width,height,insets}=f.viewport,room=ROOM_TEMPLATES['passenger-vault'];
 expect(insets).toEqual({top:182,right:292,bottom:108,left:0});
 const camera=new T.PerspectiveCamera(28,width/height,.1,160),hud=new HudCombatFraming(),final=new RoomCombatFraming(),focus=new T.Vector3();
 camera.position.fromArray(f.camera.position);camera.quaternion.fromArray(f.camera.quaternion);camera.zoom=f.camera.zoom;camera.updateProjectionMatrix();camera.updateMatrixWorld();hud.resize(width,height);hud.setInsets(insets);
 for(const a of f.contacts){const b=box(camera,a,width,height);for(const key of['left','right','top','bottom'])expect(b[key]).toBeCloseTo(a.savedBounds[key],6);}
 const contacts=f.selectedIds.map(id=>f.contacts.find(c=>c.id===id));
 hud.selectContacts(f.hero.x,f.hero.z,-Math.acos(.757300846976699),contacts.map(c=>({id:c.id,x:c.x*32,y:c.z*32,radius:c.radius*32,health:100})),32,id=>contacts.find(c=>c.id===id).height);
 expect(hud.needsFinalFit(f.hero.x,f.hero.z)).toBe(true);expect(hud.diagnostics.selectedIds).toEqual(f.selectedIds);
 Object.assign(final,{ready:true,roomWidth:room.width/32,roomDepth:room.height/32,x:camera.position.x,z:camera.position.z,zoom:camera.zoom});
 final.apply(camera,focus,f.hero.x,f.hero.z,f.hero.radius,f.hero.height,room.width/32,room.height/32,hud.viewport,height,1/60,reduced,room.boundary,hud);hud.refreshFit(camera,new T.Vector3());
 expect(hud.diagnostics.focusedPair).toBe(false);expect(hud.diagnostics.contacts).toBe(6);expect(hud.diagnostics.selectedIds).toEqual(f.selectedIds);expect(hud.diagnostics.fit).toBe(true);
 for(const a of[f.hero,...contacts]){const b=box(camera,a,width,height),info=JSON.stringify({actor:a.id,b,room:final.diagnostics});expect(b.left,info).toBeGreaterThanOrEqual(insets.left-1e-4);expect(b.right,info).toBeLessThanOrEqual(width-insets.right+1e-4);expect(b.top,info).toBeGreaterThanOrEqual(insets.top-1e-4);expect(b.bottom,info).toBeLessThanOrEqual(height-insets.bottom+1e-4);}
 expect(final.diagnostics.heroPixels).toBeGreaterThanOrEqual(100*height/1080-1e-4);expect(final.diagnostics.outside).toBeLessThanOrEqual(.180001);expect(final.diagnostics.outsideX).toBeLessThanOrEqual(.180001);expect(final.diagnostics.outsideZ).toBeLessThanOrEqual(.180001);
 if(process.env.I10_NATIVE720_REPORT==='1')process.stdout.write(JSON.stringify({room:'passenger-vault',reduced,viewport:f.viewport,camera:{position:camera.position.toArray(),zoom:camera.zoom},framing:hud.diagnostics,roomFraming:final.diagnostics,bodies:[f.hero,...contacts].map(a=>({id:a.id,bounds:box(camera,a,width,height)}))})+'\n');
});

test.each([false,true])('keeps actual720 Atrium01 impossible focus honest without spending hero/HUD/room limits, reduced=%s',reduced=>{
 const f=fixtures[1].inputs,{width,height,insets}=f.viewport,room=ROOM_TEMPLATES['communal-atrium'];
 expect(insets).toEqual({top:182,right:292,bottom:108,left:0});
 const camera=new T.PerspectiveCamera(28,width/height,.1,160),hud=new HudCombatFraming(),final=new RoomCombatFraming(),focus=new T.Vector3();
 const restore=()=>{camera.position.fromArray(f.camera.position);camera.quaternion.fromArray(f.camera.quaternion);camera.zoom=f.camera.zoom;camera.updateProjectionMatrix();camera.updateMatrixWorld();focus.set(0,0,0);};restore();hud.resize(width,height);hud.setInsets(insets);
 for(const a of f.contacts){const b=box(camera,a,width,height);for(const key of['left','right','top','bottom'])expect(b[key]).toBeCloseTo(a.savedBounds[key],6);}
 const contacts=f.selectedIds.map(id=>f.contacts.find(c=>c.id===id)),urgent=contacts.find(c=>c.id===16);
 const angle=Math.atan2(urgent.z-f.hero.z,urgent.x-f.hero.x)-Math.acos(.9253956463958721);
 Object.assign(final,{ready:true,roomWidth:room.width/32,roomDepth:room.height/32,x:camera.position.x,z:camera.position.z,zoom:camera.zoom});
 for(let frame=0;frame<60;frame++){
  restore();hud.selectContacts(f.hero.x,f.hero.z,angle,contacts.map(c=>({id:c.id,x:c.x*32,y:c.z*32,radius:c.radius*32,health:100,windupMs:c.id===16?100:0})),32,id=>contacts.find(c=>c.id===id).height);
  expect(hud.needsFinalFit(f.hero.x,f.hero.z)).toBe(true);expect(hud.diagnostics.contacts).toBe(6);expect(hud.diagnostics.selectedIds).toEqual(f.selectedIds);
  final.apply(camera,focus,f.hero.x,f.hero.z,f.hero.radius,f.hero.height,room.width/32,room.height/32,hud.viewport,height,1/60,reduced,room.boundary,hud);hud.refreshFit(camera,new T.Vector3());
  const d=final.diagnostics,marine=box(camera,f.hero,width,height),selected=box(camera,urgent,width,height),info=JSON.stringify({frame,d,marine,selected,framing:hud.diagnostics});
  expect(d.heroPixels,info).toBeGreaterThanOrEqual(100*height/1080-1e-4);
  if(d.smallX)expect(d.centeredX,info).toBe(true);else expect(d.outsideX,info).toBeLessThanOrEqual(.180001);
  if(d.smallZ)expect(d.centeredZ,info).toBe(true);else expect(d.outsideZ,info).toBeLessThanOrEqual(.180001);
  if(!d.smallX&&!d.smallZ)expect(d.outside,info).toBeLessThanOrEqual(.180001);
  expect(marine.left,info).toBeGreaterThanOrEqual(-1e-4);expect(marine.right,info).toBeLessThanOrEqual(width-insets.right+1e-4);expect(marine.top,info).toBeGreaterThanOrEqual(insets.top-1e-4);expect(marine.bottom,info).toBeLessThanOrEqual(height-insets.bottom+1e-4);
  expect(hud.diagnostics.focusedPair,info).toBe(true);expect(hud.diagnostics.focusContactId,info).toBe(16);expect(hud.diagnostics.fit,info).toBe(false);
  expect(selected.left<0||selected.right>width-insets.right||selected.top<insets.top||selected.bottom>height-insets.bottom,info).toBe(true);
 }
 if(process.env.I10_NATIVE720_REPORT==='1')process.stdout.write(JSON.stringify({room:'communal-atrium',reduced,viewport:f.viewport,camera:{position:camera.position.toArray(),zoom:camera.zoom},framing:hud.diagnostics,roomFraming:final.diagnostics,bodies:[f.hero,...contacts].map(a=>({id:a.id,bounds:box(camera,a,width,height)})),qualification:'Exact fixed-pitch/height100-reference hero +18%AABB necessary-interval proof rejects this focused pair; keep honestfitfalse/nativebearing.'})+'\n');
});
