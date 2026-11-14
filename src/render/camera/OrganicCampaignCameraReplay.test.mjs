import {test,expect} from 'vitest';
import * as T from 'three';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {HudCombatFraming} from './HudCombatFraming';
import {RoomCombatFraming} from './RoomCombatFraming';

/** Opt-in, render-free replay of original campaign evidence. No artifact tests
 * are generated and no recorded diagnostic/input is modified.
 */
test.skipIf(!process.env.I10_CAMERA_REPLAY_DIRECTORY)('settles every original campaign mid-frame selection with actual body geometry',async()=>{
 const directory=resolve(process.env.I10_CAMERA_REPLAY_DIRECTORY),rows=[];
 for(const file of(await readdir(directory)).filter(f=>f.endsWith('-mid.json')).sort()){
  const bytes=await readFile(resolve(directory,file)),s=JSON.parse(bytes),e=s.framingEvidence,f=e.framing;
  const original=new T.PerspectiveCamera(28,16/9,.1,160);original.zoom=f.pullback;original.lookAt(0,-26,-19);original.updateProjectionMatrix();original.updateMatrixWorld();
  const point=new T.Vector3(s.player.screen.x/960-1,1-s.player.screen.y/540,s.player.screen.depth).unproject(original);
  original.position.set(s.player.x/32,.65,s.player.y/32).sub(point);original.updateMatrixWorld();
  const box=(camera,x,z,r,h)=>{const b={left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity};for(const ix of[-1,1])for(const iz of[-1,1])for(const y of[0,h]){point.set(x+ix*r,y,z+iz*r).project(camera);const px=(point.x+1)*960,py=(1-point.y)*540;b.left=Math.min(b.left,px);b.right=Math.max(b.right,px);b.top=Math.min(b.top,py);b.bottom=Math.max(b.bottom,py);}return b;};
  const active=f.selectedIds.slice(0,f.contacts),selected=f.focusedPair?[f.focusContactId]:active;
  const contacts=active.map(id=>{
   const enemy=s.enemies.find(a=>a.id===id),receipt=e.contacts.find(a=>a.id===id);expect(enemy,`${file} enemy${id}`).toBeTruthy();expect(receipt,`${file} bounds${id}`).toBeTruthy();
   let low=0,high=12;for(let n=0;n<64;n++){const mid=(low+high)*.5;if(box(original,enemy.x/32,enemy.y/32,enemy.radius/32,mid).top>receipt.bounds.top)low=mid;else high=mid;}
   const height=(low+high)*.5,b=box(original,enemy.x/32,enemy.y/32,enemy.radius/32,height);
   for(const key of['left','right','top','bottom'])expect(b[key],`${file} original${id}/${key}`).toBeCloseTo(receipt.bounds[key],5);
   return{...enemy,height};
  });
  const room=ROOM_TEMPLATES[s.node.templateId],camera=original.clone(),hud=new HudCombatFraming(),final=new RoomCombatFraming(),focus=new T.Vector3();
  hud.resize(1920,1080);hud.setInsets(e.insets);
  Object.assign(final,{ready:true,roomWidth:room.width/32,roomDepth:room.height/32,x:original.position.x,z:original.position.z,zoom:original.zoom});
  let previousX=camera.position.x,previousZ=camera.position.z,previousZoom=camera.zoom,worstPosition=0,worstZoom=0,settled=-1;
  for(let frame=0;frame<180;frame++){
   camera.copy(original);focus.set(0,0,0);hud.selectContacts(s.player.x/32,s.player.y/32,s.player.angle,contacts,32,id=>contacts.find(c=>c.id===id).height);
   final.apply(camera,focus,s.player.x/32,s.player.y/32,s.player.radius/32,2.05,room.width/32,room.height/32,hud.viewport,1080,1/60,false,room.boundary,hud);
   const d=final.diagnostics,info=JSON.stringify({file,frame,d,pose:camera.position.toArray(),zoom:camera.zoom});
   expect(d.heroPixels,info).toBeGreaterThanOrEqual(99.999);
   if(d.smallX)expect(d.centeredX,info).toBe(true);else expect(d.outsideX,info).toBeLessThanOrEqual(.180001);
   if(d.smallZ)expect(d.centeredZ,info).toBe(true);else expect(d.outsideZ,info).toBeLessThanOrEqual(.180001);
   if(!d.smallX&&!d.smallZ)expect(d.outside,info).toBeLessThanOrEqual(.180001);
   const marine=box(camera,s.player.x/32,s.player.y/32,s.player.radius/32,2.05),inside=b=>b.left>=-1e-4&&b.right<=1628.0001&&b.top>=181.9999&&b.bottom<=960.0001;
   expect(inside(marine),info).toBe(true);
   const delta=Math.hypot(camera.position.x-previousX,camera.position.z-previousZ),zoomDelta=Math.abs(camera.zoom-previousZoom);
   // Urgent nearby contacts retain the authorized immediate C04 safety fit.
   if(!hud.needsFinalFit(s.player.x/32,s.player.y/32)&&contacts.length){expect(delta,info).toBeLessThanOrEqual(.500001);expect(zoomDelta,info).toBeLessThanOrEqual(.040001);}
   worstPosition=Math.max(worstPosition,delta);worstZoom=Math.max(worstZoom,zoomDelta);
   if(selected.every(id=>{const c=contacts.find(a=>a.id===id);return inside(box(camera,c.x/32,c.y/32,c.radius/32,c.height));})&&settled<0)settled=frame;
   previousX=camera.position.x;previousZ=camera.position.z;previousZoom=camera.zoom;
  }
  expect(settled,`${file}: original selected bodies never fit`).toBeGreaterThanOrEqual(0);
  const finalBounds=selected.map(id=>{const c=contacts.find(a=>a.id===id);return{id,bounds:box(camera,c.x/32,c.y/32,c.radius/32,c.height)};});
  expect(finalBounds.every(({bounds:b})=>b.left>=-1e-4&&b.right<=1628.0001&&b.top>=181.9999&&b.bottom<=960.0001),`${file}: original selected bodies must remain fitted`).toBe(true);
  rows.push({file,sha256:createHash('sha256').update(bytes).digest('hex'),originalFraming:f,selectedIds:selected,settledSeconds:(settled+1)/60,worstPosition,worstZoom,finalBounds,finalFraming:{...hud.diagnostics},finalRoom:{...final.diagnostics}});
 }
 expect(rows.length).toBeGreaterThan(0);
 if(process.env.I10_CAMERA_REPLAY_REPORT)await writeFile(resolve(process.env.I10_CAMERA_REPLAY_REPORT),JSON.stringify({method:'CPU-only static snapshot replay; actual recovered body bounds, no browser or hardware timing claim.',directory,rows},null,2)+'\n');
});
