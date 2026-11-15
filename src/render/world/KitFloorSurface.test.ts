import {SHIP_ARCHITECTURE_LAYOUTS} from '../../game/roguelike/shipArchitectureLayouts';
import {describe,expect,it} from 'vitest';
import {ROOM_STORY_ROUTE} from '../../game/roguelike/storyRooms';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {equipmentReservations} from './WorldDressing';
import {buildKitFloorSurface} from './KitFloorSurface';
import {kitHull,kitInside} from './KitSafety';

describe('functional floor density without navigation or camera cost',()=>{
 it.each(ROOM_STORY_ROUTE)('$templateId keeps contextual detail and quiet combat floor inside the authored hull',room=>{
  const t=ROOM_TEMPLATES[room.templateId],before=JSON.stringify(t),primary=equipmentReservations(t,room.templateId);
  const a=buildKitFloorSurface(t,room.environment,room.templateId,primary.length?primary:equipmentReservations(t,'e6-'+room.templateId));
  expect(a.proof.coverage).toBeGreaterThanOrEqual(0);
  if(room.environment!=='cryogenics')expect(a.proof.coverage).toBeLessThan(.22);
  for(const removed of ['route-inlay','bay-inlay','cross-service-channel'])expect(a.proof.features[removed]).toBeUndefined();expect(a.proof.views.length).toBeGreaterThan(4);
  expect(a.proof.aftermath.admitted).toBeGreaterThan(3);
  expect(a.proof.features['footprints']).toBeUndefined();expect(a.proof.features['drag-mark']).toBeUndefined();
  expect(Object.keys(a.proof.features).length).toBeGreaterThanOrEqual(3);
  if(Object.hasOwn(SHIP_ARCHITECTURE_LAYOUTS,room.templateId)){
   for(const removed of ['material-zone','circulation-scuff','service-hatch','unpacked-clothing','failed-defense-blast','relay-service-notes'])expect(a.proof.features[removed]).toBeUndefined();
   expect(a.proof.views.some(v=>v.features.length>0)).toBe(true);
  }else for(const view of a.proof.views)expect(view.features.length,`${room.templateId} view ${view.x},${view.z}`).toBeGreaterThanOrEqual(1);
  const p=a.geometry.getAttribute('position'),c=a.geometry.getAttribute('color');expect(c.count).toBe(p.count);
  for(let i=0;i<p.count;i++){
   expect(p.getY(i)).toBeGreaterThan(0);expect(p.getY(i)).toBeLessThanOrEqual(.024);
   expect(kitInside(p.getX(i)*32,p.getZ(i)*32,kitHull(t))).toBe(true);
   expect(t.voids?.some(poly=>kitInside(p.getX(i)*32,p.getZ(i)*32,poly))??false).toBe(false);
   expect(Number.isFinite(c.getX(i)+c.getY(i)+c.getZ(i))).toBe(true);
  }
  for(let i=0;i<p.count;i+=3){
   const ax=p.getX(i+1)-p.getX(i),az=p.getZ(i+1)-p.getZ(i),bx=p.getX(i+2)-p.getX(i),bz=p.getZ(i+2)-p.getZ(i);
   expect(az*bx-ax*bz,'floor triangles face the gameplay camera').toBeGreaterThanOrEqual(0);
  }
  expect(JSON.stringify(t)).toBe(before);a.geometry.dispose();
 });
 it('restricts floor tissue to equipment seams and keeps central combat floor exposed',()=>{
  const t=ROOM_TEMPLATES['infested-workshop'],a=buildKitFloorSurface(t,'infested','infested-workshop',equipmentReservations(t,'infested-workshop'));
  expect(a.proof.coverage).toBeGreaterThan(.01);expect(a.proof.coverage).toBeLessThan(.10);
  expect(a.proof.features['creep-mat']).toBeGreaterThan(0);expect(a.proof.features['growth-vein']).toBeGreaterThan(20);a.geometry.dispose();
  expect(a.proof.features['growth-vein-branch']).toBeGreaterThan(12);
 });
});
