import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {containmentAnnulusBlockout} from '../ContainmentAnnulusBlockout';
import {environmentObstacle} from '../ShipEnvironments';
import {disposeModel} from '../meshParts';
import {CameraRig} from './CameraRig';
import {COMBAT_VIEW_HEIGHT,combatFocusTarget,protectPlayerFrame} from './CombatFraming';
import {HudCombatFraming} from './HudCombatFraming';
import {RoomCombatFraming} from './RoomCombatFraming';
import {projectedLandmarkShare} from './LandmarkShare';
import fixtures from '../../../scripts/nextgen/e7-landmark-fixtures.json';

describe('E7 encounter priority over decorative landmarks',()=>{
 it('favors immediate threats while retaining remote contact selection and reduced motion',()=>{
  const hud=new HudCombatFraming(),p=new T.Vector3();hud.resize(1920,1080);
  hud.selectContacts(10,10,0,[{id:1,x:8*32,y:10*32,radius:18,windupMs:100},{id:2,x:20*32,y:10*32,radius:18,windupMs:100}]);
  hud.biasTarget(10,10,0,false,false,p);
  expect(p.x).toBeLessThan(10);expect(hud.diagnostics.contacts).toBe(2);
  hud.biasTarget(10,10,0,true,false,p);expect(p.x).toBeLessThan(10);expect(10-p.x).toBeLessThanOrEqual(1.1);
 });
 it.each(fixtures)('$room bounds raised decorative box share at the cited marine mark',sample=>{
  const room=ROOM_TEMPLATES[sample.room as keyof typeof ROOM_TEMPLATES],models:T.Group[]=[];
  if(sample.room==='containment-annulus')models.push(containmentAnnulusBlockout(room));
  else room.obstacles.forEach((r,i)=>models.push(environmentObstacle('cargo',{x:r.x/32,y:r.y/32,width:r.width/32,height:r.height/32},i,room.id)));
  const boxes=models.map(model=>{
   if(sample.room!=='containment-annulus')return new T.Box3().setFromObject(model,true);
   // The unchanged low sealed foundation is collision exposition; measure
   // the raised decorative assembly above .4m, including its shoes and guards.
   const box=new T.Box3(),p=new T.Vector3();model.updateMatrixWorld(true);
   model.traverse(o=>{if(!(o instanceof T.Mesh))return;const positions=o.geometry.getAttribute('position');for(let n=0;n<positions.count;n++){p.fromBufferAttribute(positions,n).applyMatrix4(o.matrixWorld);if(p.y>.40&&p.x>11&&p.x<26.5&&p.z>6&&p.z<21.5)box.expandByPoint(p);}});return box;
  });
  for(const height of[1080,720])for(const reduced of[false,true]){
   const camera=new T.PerspectiveCamera(28,16/9,.1,160),rig=new CameraRig(),hud=new HudCombatFraming(),final=new RoomCombatFraming(),p=new T.Vector3(),target=new T.Vector3();
   const x=sample.x/32,z=sample.y/32,scale=height/1080;hud.resize(height*16/9,height);hud.setInsets({top:182*scale,right:292*scale,bottom:120*scale,left:0});
   const enemies=sample.enemies.map((e,id)=>({...e,id,health:100}));
   for(let n=0;n<180;n++){
    hud.selectContacts(x,z,sample.angle,enemies);combatFocusTarget(x,z,sample.angle,0,0,false,reduced,p);hud.biasTarget(x,z,sample.angle,reduced,false,p);
    rig.update(1/60,p.x,p.z,0,reduced);rig.apply(camera,1,COMBAT_VIEW_HEIGHT,0);hud.center(camera,rig.focus,p,target);
    hud.protectEngagement(camera,rig.focus,x,z,.5,2.05,p,target);protectPlayerFrame(camera,rig.focus,x,z,.5,2.05,p,target,hud.viewport);
    final.apply(camera,rig.focus,x,z,.5,2.05,room.width/32,room.height/32,hud.viewport,height,1/60,reduced,room.boundary,hud);
   }
   const shares=boxes.map(box=>projectedLandmarkShare(camera,box,hud.viewport));
   const info=JSON.stringify({room:sample.room,height,reduced,shares,diag:final.diagnostics});
   expect(Math.max(...shares),info).toBeLessThanOrEqual(.35);
   expect(final.diagnostics.heroPixels,info).toBeGreaterThanOrEqual(99.999*scale);expect(final.diagnostics.outside,info).toBeLessThanOrEqual(.180001);
   for(const ix of[-1,1])for(const iz of[-1,1])for(const y of[0,2.05]){p.set(x+ix*.5,y,z+iz*.5).project(camera);expect(p.x,info).toBeGreaterThanOrEqual(hud.viewport.left-1e-5);expect(p.x,info).toBeLessThanOrEqual(hud.viewport.right+1e-5);expect(p.y,info).toBeGreaterThanOrEqual(hud.viewport.bottom-1e-5);expect(p.y,info).toBeLessThanOrEqual(hud.viewport.top+1e-5);}
   if(process.env.E7_CAMERA_REPORT==='1')process.stdout.write(info+'\n');
  }
  models.forEach(disposeModel);
 });
});
