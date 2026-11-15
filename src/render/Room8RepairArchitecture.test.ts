import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {room8RepairArchitecture,room8OrganicVoids,room8RepairVoids} from './Room8RepairArchitecture';
import {SHIP_ACT2_PLANS} from '../game/roguelike/shipArchitectureAct2';
import {insidePlanPolygon} from '../game/roguelike/shipPlanChecks';
import {disposeModel} from './meshParts';
import {clearPolygonTopology} from '../game/world/polygonGeometry';
const t=SHIP_ACT2_PLANS['breached-loading-bay'].topology;
describe('Loading bay hull-connected repair trunk',()=>{
 it('retains exactly one original colony and classifies the appended ship wall separately',()=>{
  expect(room8OrganicVoids(t)).toEqual(t.voids!.slice(0,1));expect(room8RepairVoids(t)).toEqual(t.voids!.slice(1));
  expect(room8RepairVoids({voids:room8OrganicVoids(t)})).toEqual([]);
 });
 it('fills every appended reservation below .90m without raised lane geometry',()=>{
  const room=room8RepairArchitecture(t);let count=0;
  room.traverse(o=>{if(!(o instanceof T.Mesh))return;count++;const p=o.geometry.getAttribute('position');
   for(let i=0;i<p.count;i++){
    expect(p.getY(i)).toBeGreaterThanOrEqual(-.00001);expect(p.getY(i)).toBeLessThanOrEqual(.90);
    const q={x:p.getX(i)*32,y:p.getZ(i)*32};
    if(p.getY(i)>.001&&p.getY(i)<.022){expect(clearPolygonTopology(t,q,q)).toBe(true);continue;}
    // Inset the boundary by floating tolerance solely for polygon-edge samples.
    const c={x:610,y:190},inward={x:q.x+(c.x-q.x)*1e-6,y:q.y+(c.y-q.y)*1e-6};
    expect(room8RepairVoids(t).some(poly=>insidePlanPolygon(inward,poly)),JSON.stringify(q)).toBe(true);
   }
  });expect(count).toBe(3);
  expect(room.userData.lightFixtures).toHaveLength(1);const fixture=room.userData.lightFixtures[0];
  expect(insidePlanPolygon({x:fixture.x*32,y:fixture.z*32},room8RepairVoids(t)[0])).toBe(true);
  disposeModel(room);
 });
 it('replaces the old scatter with four stock-aligned flush guide channels',()=>{
  const room=room8RepairArchitecture(t);expect(room.userData.replacesLegacyLoadingFloor).toBe(true);
  expect(room.userData.loadingGuides).toEqual(t.obstacles.flatMap((r,bed)=>[r.x+8,r.x+r.width-8].map(x=>({bed,x,z:r.y-68,length:88}))));
  let floorVertices=0;room.traverse(o=>{if(!(o instanceof T.Mesh))return;const p=o.geometry.getAttribute('position');
   for(let i=0;i<p.count;i++)if(p.getY(i)>.001&&p.getY(i)<.022){floorVertices++;expect(p.getY(i)).toBeLessThanOrEqual(.01901);}
  });expect(floorVertices).toBeGreaterThan(100);disposeModel(room);
 });
 it('owns disposable local resources and allocates nothing for the legacy one-scar plan',()=>{
  const room=room8RepairArchitecture(t),geometries:number[]=[],materials:number[]=[];
  room.traverse(o=>{if(!(o instanceof T.Mesh))return;const i=geometries.length;geometries.push(0);materials.push(0);o.geometry.addEventListener('dispose',()=>geometries[i]++);(o.material as T.Material).addEventListener('dispose',()=>materials[i]++);});
  disposeModel(room);expect(geometries).toEqual([1,1,1]);expect(materials).toEqual([1,1,1]);
  const legacy=room8RepairArchitecture({voids:room8OrganicVoids(t)});expect(legacy.children).toHaveLength(0);disposeModel(legacy);
 });
});
