import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {authoredRoom} from './AuthoredRooms';
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import {disposeModel} from './meshParts';
const legacy=['room8-freight-apron','room8-apron-markings','room8-docking-channels'];
const local=['room8-repair-casing','room8-repair-joints','room8-repair-fixture'];
describe('Room8 room visuals',()=>{
 it('replaces the generic apron recipe with flush bed guides and finite owned repair materials',()=>{
  const room=authoredRoom('breached-loading-bay',ROOM_TEMPLATES['breached-loading-bay'])!;
  const repair=room.getObjectByName('room8-repair-architecture')!;expect(repair).toBeDefined();
  expect(repair.userData.replacesLegacyLoadingFloor).toBe(true);expect(repair.userData.loadingGuides).toHaveLength(4);
  const disposalCounts:Array<()=>number>=[];let floorVertices=0;
  for(const name of local){
   const mesh=repair.children.find(o=>o instanceof T.Mesh&&(o.material as T.Material).name===name) as T.Mesh;
   expect(mesh).toBeDefined();const p=mesh.geometry.getAttribute('position');
   for(let i=0;i<p.count;i++){
    expect(Number.isFinite(p.getX(i)+p.getY(i)+p.getZ(i))).toBe(true);
    expect(p.getY(i)).toBeGreaterThanOrEqual(-.00001);expect(p.getY(i)).toBeLessThan(.90);
    if(p.getY(i)>.001&&p.getY(i)<.022){floorVertices++;expect(p.getY(i)).toBeLessThanOrEqual(.01901);}
   }
   let disposed=0;(mesh.material as T.Material).addEventListener('dispose',()=>disposed++);disposalCounts.push(()=>disposed);
  }
  expect(floorVertices).toBeGreaterThan(100);
  room.traverse(o=>{if(o instanceof T.Mesh)expect(legacy).not.toContain((o.material as T.Material).name);});
  disposeModel(room);expect(disposalCounts).toHaveLength(3);for(const count of disposalCounts)expect(count()).toBe(1);
 });
 it.each(['awakening-bay','passenger-vault','overload-floor'] as const)('does not leak Room8 materials into %s',id=>{
  const room=authoredRoom(id,ROOM_TEMPLATES[id])!;
  room.traverse(o=>{if(o instanceof T.Mesh)expect([...legacy,...local]).not.toContain((o.material as T.Material).name);});
  disposeModel(room);
 });
});
