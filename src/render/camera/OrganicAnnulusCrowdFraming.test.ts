import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {HudCombatFraming} from './HudCombatFraming';
import {RoomCombatFraming} from './RoomCombatFraming';

type Bounds={left:number;right:number;top:number;bottom:number};
type Actor={id:number|string;x:number;z:number;radius:number;height:number;savedBounds?:Bounds};
const fixture=JSON.parse(readFileSync(new URL('../../../tests/fixtures/annulus03-camera.json',import.meta.url),'utf8')) as {
 inputs:{camera:{position:number[];quaternion:number[];zoom:number};hero:Actor;contacts:Actor[];selectedIds:number[]};
};
function body(camera:T.Camera,a:Actor,height:number):Bounds {
 const p=new T.Vector3(),b={left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity};
 for(const ix of[-1,1])for(const iz of[-1,1])for(const y of[0,a.height]){
  p.set(a.x+ix*a.radius,y,a.z+iz*a.radius).project(camera);const x=(p.x+1)*height*16/9/2,sy=(1-p.y)*height/2;
  b.left=Math.min(b.left,x);b.right=Math.max(b.right,x);b.top=Math.min(b.top,sy);b.bottom=Math.max(b.bottom,sy);
 }
 return b;
}

describe('native Annulus03 nearby six-body joint fit',()=>{
 it.each([[1080,false],[1080,true],[720,false],[720,true]] as const)('retains all strict padded body bounds at CSSheight%i reduced=%s', (height,reduced)=>{
  const input=fixture.inputs,room=ROOM_TEMPLATES['containment-annulus'],scale=height/1080;
  const camera=new T.PerspectiveCamera(28,16/9,.1,160),hud=new HudCombatFraming(),final=new RoomCombatFraming(),focus=new T.Vector3();
  camera.position.fromArray(input.camera.position);camera.quaternion.fromArray(input.camera.quaternion);camera.zoom=input.camera.zoom;camera.updateProjectionMatrix();camera.updateMatrixWorld();
  hud.resize(height*16/9,height);hud.setInsets({left:0,top:182*scale,right:292*scale,bottom:120*scale});
  const contacts=input.selectedIds.map(id=>input.contacts.find(c=>c.id===id)!);
  for(const c of contacts){const b=body(camera,c,height);for(const key of['left','right','top','bottom']as const)expect(b[key]).toBeCloseTo(c.savedBounds![key]*scale,6);}
  const snapshots=contacts.map(c=>({id:c.id as number,x:c.x*32,y:c.z*32,radius:c.radius*32,health:100}));
  hud.selectContacts(input.hero.x,input.hero.z,Math.acos(.8792266614712383),snapshots,32,id=>contacts.find(c=>c.id===id)!.height);
  expect(hud.diagnostics.contacts).toBe(6);expect(hud.diagnostics.selectedIds).toEqual(input.selectedIds);expect(hud.needsFinalFit(input.hero.x,input.hero.z)).toBe(true);
  Object.assign(final,{ready:true,roomWidth:room.width/32,roomDepth:room.height/32,x:camera.position.x,z:camera.position.z,zoom:camera.zoom});
  final.apply(camera,focus,input.hero.x,input.hero.z,input.hero.radius,input.hero.height,room.width/32,room.height/32,hud.viewport,height,1/60,reduced,room.boundary,hud);
  hud.refreshFit(camera,new T.Vector3());
  expect(hud.diagnostics.focusedPair).toBe(false);expect(hud.diagnostics.selectedIds).toEqual(input.selectedIds);expect(hud.diagnostics.fit).toBe(true);
  const padX=.06*(1920-292)/2*scale,padY=.10*(1080-182-120)/2*scale;
  for(const actor of[input.hero,...contacts]){
   const b=body(camera,actor,height),info=JSON.stringify({actor:actor.id,b,position:camera.position.toArray(),zoom:camera.zoom,diag:final.diagnostics});expect(b.left,info).toBeGreaterThanOrEqual(padX-1e-4);expect(b.right,info).toBeLessThanOrEqual(1628*scale-padX+1e-4);expect(b.top,info).toBeGreaterThanOrEqual(182*scale+padY-1e-4);expect(b.bottom,info).toBeLessThanOrEqual(960*scale-padY+1e-4);
  }
  expect(final.diagnostics.heroPixels).toBeGreaterThanOrEqual(99.999*scale);expect(final.diagnostics.outside).toBeLessThanOrEqual(.180001);expect(final.diagnostics.outsideX).toBeLessThanOrEqual(.180001);expect(final.diagnostics.outsideZ).toBeLessThanOrEqual(.180001);
  expect(final.diagnostics.smallX||final.diagnostics.smallZ).toBe(false);
  const marine=body(camera,input.hero,height),centerX=814*scale,centerY=571*scale;
  expect(marine.left).toBeGreaterThanOrEqual(centerX-.60*814*scale);expect(marine.right).toBeLessThanOrEqual(centerX+.60*814*scale);
  expect(marine.top).toBeGreaterThanOrEqual(centerY-.55*389*scale);expect(marine.bottom).toBeLessThanOrEqual(centerY+.55*389*scale);
  if(process.env.I10_ANNULUS_REPORT==='1')process.stdout.write(JSON.stringify({height,reduced,position:camera.position.toArray(),zoom:camera.zoom,room:final.diagnostics,framing:hud.diagnostics,bodies:[input.hero,...contacts].map(a=>({id:a.id,bounds:body(camera,a,height)}))})+'\n');
 });
});
