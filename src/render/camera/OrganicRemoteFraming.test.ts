import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {HudCombatFraming} from './HudCombatFraming';
import {RoomCombatFraming} from './RoomCombatFraming';
import {CameraRig} from './CameraRig';
import {COMBAT_VIEW_HEIGHT} from './CombatFraming';

/** Original AA seed1729 campaign snapshots r4/r5. Fixed CameraRig orientation
 * and each saved .65m point/depth recover translation; saved body tops recover
 * heights, with the other seven corners independently checked below.
 */
const cases=[{
 id:'communal-atrium',position:[17.31519436891604,24.287016892935558,29.72445058268231],zoom:1.2991492133683356,
 hero:{x:8.24999999999999,z:10.427083333333316,angle:-.17190068094455177},heroPixels:122.40167614946895,
 contacts:[{id:5,x:589.8508249198007,y:261.21001904142236,radius:28,height:2.554733359475305,
  bounds:{left:980.7851883672558,right:1148.4501772885503,top:56.23934920781232,bottom:330.1759503427219}}],
},{
 id:'crew-checkpoint',position:[14.447079074946657,24.287016892935362,29.05216799883327],zoom:1.279483283366624,
 hero:{x:11.320641860935874,z:12.277124570887725,angle:2.823986436462641},heroPixels:115.95929991796774,
 contacts:[{id:1,x:172.96504922002953,y:160.30966673777164,radius:18,height:1.7393647986993503,
  bounds:{left:129.79137480495,right:271.45535675615645,top:-15.745564699367737,bottom:156.7605422146879}},
 {id:4,x:156.56215210472425,y:192.85324238100313,radius:18,height:1.7393647986993588,
  bounds:{left:68.80229421253429,right:216.76388676007406,top:44.708936376582116,bottom:219.00245342762878}}],
},{
 id:'coolant-plant',position:[14.20923051195965,24.28701689293644,33.95906595943414],zoom:1.0591498393422931,
 hero:{x:4.809734187492566,z:13.989776773358699,angle:1.6317352126420546},heroPixels:100.60083850260077,
 contacts:[{id:1,x:4.641569755166546*32,y:23.146649610283244*32,radius:28,height:4.394141378297196,
  bounds:{left:-132.59739306242886,right:207.6727220203169,top:769.9026053602839,bottom:1107.9233430098975}}],
},{
 id:'breached-loading-bay',position:[24.720467534226902,24.287016892935526,33.8402703405563],zoom:1.0558754621095958,
 hero:{x:15.078029097580945,z:12.244438735443431,angle:.5246674873823032},heroPixels:101.95094893214542,
 // The original five-contact selection had already focused this urgent Spitter.
 contacts:[{id:4,x:728.9105822190708,y:702.1007145055956,radius:18,height:1.739364798699511,
  bounds:{left:729.9267317927831,right:842.9937581267313,top:830.0581533538988,bottom:990.1159949609712}}],
}] as const;

function body(camera:T.Camera,x:number,z:number,r:number,h:number,height=1080){
 const point=new T.Vector3(),b={left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity};
 for(const ix of[-1,1])for(const iz of[-1,1])for(const y of[0,h]){
  point.set(x+ix*r,y,z+iz*r).project(camera);
  const px=(point.x+1)*height*16/9/2,py=(1-point.y)*height/2;
  b.left=Math.min(b.left,px);b.right=Math.max(b.right,px);b.top=Math.min(b.top,py);b.bottom=Math.max(b.bottom,py);
 }
 return b;
}

describe('bounded organic remote camera progression',()=>{
 it.each(cases)('$id fits the actual remote bodies from the last rendered pose without a room-clamp restart',fixture=>{
  const room=ROOM_TEMPLATES[fixture.id];
  const receipts=[];
  for(const reduced of[false,true])for(const cssHeight of[1080,720])for(const dt of[1/60,1/120,1/30,.05]){
   const camera=new T.PerspectiveCamera(28,16/9,.1,160),hud=new HudCombatFraming(),final=new RoomCombatFraming(),focus=new T.Vector3(),point=new T.Vector3();
   const restoreInput=()=>{camera.position.fromArray(fixture.position);camera.quaternion.set(-.4527600968822728,0,0,.8916323764148287);camera.zoom=fixture.zoom;camera.updateProjectionMatrix();camera.updateMatrixWorld();focus.set(0,0,0);};
   restoreInput();hud.resize(cssHeight*16/9,cssHeight);const scale=cssHeight/1080;
   const foot=new T.Vector3(fixture.hero.x,0,fixture.hero.z).project(camera),head=new T.Vector3(fixture.hero.x,2.05,fixture.hero.z).project(camera);
   expect(Math.abs(head.y-foot.y)*cssHeight/2).toBeCloseTo(fixture.heroPixels*scale,6);
   hud.setInsets({left:0,top:182*scale,right:292*scale,bottom:120*scale});
   for(const contact of fixture.contacts){const b=body(camera,contact.x/32,contact.y/32,contact.radius/32,contact.height,cssHeight);for(const key of['left','right','top','bottom']as const)expect(b[key]).toBeCloseTo(contact.bounds[key]*scale,6);}
   Object.assign(final,{ready:true,roomWidth:room.width/32,roomDepth:room.height/32,x:camera.position.x,z:camera.position.z,zoom:camera.zoom});
   let previousX=camera.position.x,previousZ=camera.position.z,previousZoom=camera.zoom,settled=-1,worstPosition=0,worstZoom=0;
   const contacts=fixture.contacts.map(c=>({...c,health:100}));
   for(let frame=0;frame<Math.ceil(3/dt);frame++){
    restoreInput();hud.selectContacts(fixture.hero.x,fixture.hero.z,fixture.hero.angle,contacts,32,id=>contacts.find(c=>c.id===id)!.height);
    expect(hud.needsFinalFit(fixture.hero.x,fixture.hero.z)).toBe(false);
    final.apply(camera,focus,fixture.hero.x,fixture.hero.z,.5,2.05,room.width/32,room.height/32,hud.viewport,cssHeight,dt,reduced,room.boundary,hud);
    hud.refreshFit(camera,point);
    const info=JSON.stringify({room:fixture.id,reduced,cssHeight,dt,frame,diag:final.diagnostics,camera:camera.position.toArray(),zoom:camera.zoom});
    expect(Math.hypot(camera.position.x-previousX,camera.position.z-previousZ),info).toBeLessThanOrEqual((reduced?.25:.5)*Math.min(1,dt*60)+1e-6);
    expect(Math.abs(camera.zoom-previousZoom),info).toBeLessThanOrEqual((reduced?.02:.04)*Math.min(1,dt*60)+1e-6);
    worstPosition=Math.max(worstPosition,Math.hypot(camera.position.x-previousX,camera.position.z-previousZ));worstZoom=Math.max(worstZoom,Math.abs(camera.zoom-previousZoom));
    const d=final.diagnostics;
    expect(d.heroPixels,info).toBeGreaterThanOrEqual(99.999*scale);
    if(d.smallX)expect(d.centeredX,info).toBe(true);else expect(d.outsideX,info).toBeLessThanOrEqual(.180001);
    if(d.smallZ)expect(d.centeredZ,info).toBe(true);else expect(d.outsideZ,info).toBeLessThanOrEqual(.180001);
    if(!d.smallX&&!d.smallZ)expect(d.outside,info).toBeLessThanOrEqual(.180001);
    const marine=body(camera,fixture.hero.x,fixture.hero.z,.5,2.05,cssHeight);
    expect(marine.left,info).toBeGreaterThanOrEqual(-1e-4);expect(marine.right,info).toBeLessThanOrEqual(1628*scale+1e-4);
    expect(marine.top,info).toBeGreaterThanOrEqual(182*scale-1e-4);expect(marine.bottom,info).toBeLessThanOrEqual(960*scale+1e-4);
    if(hud.diagnostics.fit&&settled<0)settled=frame;
    previousX=camera.position.x;previousZ=camera.position.z;previousZoom=camera.zoom;
   }
   expect(settled,`${fixture.id} reduced=${reduced} dt=${dt} ${JSON.stringify({diag:final.diagnostics,position:camera.position.toArray(),zoom:camera.zoom,framing:hud.diagnostics})}`).toBeGreaterThanOrEqual(0);
   expect(hud.diagnostics.fit).toBe(true);
   for(const c of contacts){const b=body(camera,c.x/32,c.y/32,c.radius/32,c.height,cssHeight);expect(b.left).toBeGreaterThanOrEqual(-1e-4);expect(b.right).toBeLessThanOrEqual(1628*scale+1e-4);expect(b.top).toBeGreaterThanOrEqual(182*scale-1e-4);expect(b.bottom).toBeLessThanOrEqual(960*scale+1e-4);}
   receipts.push({room:fixture.id,reduced,cssHeight,dt,settledSeconds:(settled+1)*dt,worstPosition,worstZoom,finalPosition:camera.position.toArray(),finalZoom:camera.zoom,heroPixels:final.diagnostics.heroPixels,outside:final.diagnostics.outside});
  }
  if(process.env.I10_REMOTE_CAMERA_REPORT==='1')process.stdout.write(JSON.stringify(receipts)+'\n');
 });

 it('updates a moving marine at the size floor without holding an invalid previous pose',()=>{
  const fixture=cases[2],room=ROOM_TEMPLATES[fixture.id],camera=new T.PerspectiveCamera(28,16/9,.1,160);
  const hud=new HudCombatFraming(),final=new RoomCombatFraming(),focus=new T.Vector3();
  hud.resize(1920,1080);hud.setInsets({left:0,top:182,right:292,bottom:120});
  const contacts=fixture.contacts.map(c=>({...c,health:100}));let previousX:number=fixture.position[0],previousZ:number=fixture.position[2],previousZoom:number=fixture.zoom,invalidPreviousFrames=0;
  Object.assign(final,{ready:true,roomWidth:room.width/32,roomDepth:room.height/32,x:previousX,z:previousZ,zoom:previousZoom});
  for(let frame=0;frame<240;frame++){
   const x=fixture.hero.x+.25*Math.sin(frame*.11),z=fixture.hero.z+.6*Math.sin(frame*.15);
   if(frame>0){const foot=new T.Vector3(x,0,z).project(camera),head=new T.Vector3(x,2.05,z).project(camera);if(Math.abs(head.y-foot.y)*540<100-1e-6)invalidPreviousFrames++;}
   camera.position.fromArray(fixture.position);camera.quaternion.set(-.4527600968822728,0,0,.8916323764148287);camera.zoom=fixture.zoom;camera.updateProjectionMatrix();camera.updateMatrixWorld();focus.set(0,0,0);
   hud.selectContacts(x,z,Math.atan2(contacts[0].y/32-z,contacts[0].x/32-x),contacts,32,()=>contacts[0].height);
   final.apply(camera,focus,x,z,.5,2.05,room.width/32,room.height/32,hud.viewport,1080,1/60,false,room.boundary,hud);
   const info=JSON.stringify({frame,x,z,diag:final.diagnostics,pose:camera.position.toArray(),zoom:camera.zoom});
   expect(Math.hypot(camera.position.x-previousX,camera.position.z-previousZ),info).toBeLessThanOrEqual(.500001);
   expect(Math.abs(camera.zoom-previousZoom),info).toBeLessThanOrEqual(.040001);
   expect(final.diagnostics.heroPixels,info).toBeGreaterThanOrEqual(99.999);
   expect(final.diagnostics.outside,info).toBeLessThanOrEqual(.180001);
   const marine=body(camera,x,z,.5,2.05);
   expect(marine.left,info).toBeGreaterThanOrEqual(-1e-4);expect(marine.right,info).toBeLessThanOrEqual(1628.0001);
   expect(marine.top,info).toBeGreaterThanOrEqual(181.9999);expect(marine.bottom,info).toBeLessThanOrEqual(960.0001);
   previousX=camera.position.x;previousZ=camera.position.z;previousZoom=camera.zoom;
  }
  expect(invalidPreviousFrames).toBeGreaterThan(0);
 });

 it('clears retained remote state on reset and preserves exact centered small-axis framing',()=>{
  const camera=new T.PerspectiveCamera(28,16/9,.1,160),hud=new HudCombatFraming(),final=new RoomCombatFraming(),rig=new CameraRig(),point=new T.Vector3(),target=new T.Vector3();
  hud.resize(1920,1080);hud.setInsets({left:0,top:182,right:292,bottom:120});
  Object.assign(final,{ready:true,roomWidth:37.5,roomDepth:27.5,x:20,z:40,zoom:1,remoteProgress:true});
  final.reset();hud.selectContacts(4.5,3,0,[]);rig.reset(4.5,3);rig.apply(camera,1,COMBAT_VIEW_HEIGHT,0);hud.center(camera,rig.focus,point,target);
  final.apply(camera,rig.focus,4.5,3,.5,2.05,9,6,hud.viewport,1080,1/60,false,undefined,hud);
  expect(final.diagnostics.smallX&&final.diagnostics.smallZ).toBe(true);expect(final.diagnostics.centeredX&&final.diagnostics.centeredZ).toBe(true);
  expect(final.diagnostics.shallowZoomFloor).toBe(0);expect(final.diagnostics.heroPixels).toBeGreaterThanOrEqual(99.999);
  const marine=body(camera,4.5,3,.5,2.05);expect(marine.left).toBeGreaterThanOrEqual(0);expect(marine.right).toBeLessThanOrEqual(1628);expect(marine.top).toBeGreaterThanOrEqual(182);expect(marine.bottom).toBeLessThanOrEqual(960);
 });
});
