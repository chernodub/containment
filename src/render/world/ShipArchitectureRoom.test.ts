import {describe,it,expect,vi} from 'vitest';
import * as T from 'three';
import {shipArchitectureRoom,BESPOKE_SHIP_ROOMS} from './ShipArchitectureRoom';
import {SHIP_ARCHITECTURE_LAYOUTS} from '../../game/roguelike/shipArchitectureLayouts';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {clearPolygonTopology} from '../../game/world/polygonGeometry';
import {disposeModel,geometries} from '../meshParts';

describe('template-driven ship architecture',()=>{
 it.each(Object.keys(SHIP_ARCHITECTURE_LAYOUTS).filter(id=>!BESPOKE_SHIP_ROOMS.has(id)))('%s uses exact floor/hull and contained partition meshes with owned disposal',id=>{
  const t=ROOM_TEMPLATES[id as keyof typeof ROOM_TEMPLATES],before=JSON.stringify(t),root=shipArchitectureRoom(id,t)!;
  expect(root.userData.templateArchitecture).toBe(true);expect(root.userData.lightFixtures.length).toBeGreaterThan(2);
  const floor=root.children.find(o=>o instanceof T.Mesh&&(o.material as T.Material).name==='painted-steel-deck') as T.Mesh;
  expect(floor).toBeDefined();const p=floor.geometry.getAttribute('position');
  // Triangle centroids on the actual upper deck must occupy collision floor.
  for(let i=0;i<p.count;i+=3){
   if(![0,1,2].every(n=>Math.abs(p.getY(i+n)+.02)<1e-5))continue;
   const point={x:(p.getX(i)+p.getX(i+1)+p.getX(i+2))*32/3,y:(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))*32/3};
   expect(clearPolygonTopology(t,point,point,0)).toBe(true);
  }
  root.updateMatrixWorld(true);
  root.traverse(o=>{if(o instanceof T.Mesh&&(o.material as T.Material).name==='ship-interior-cutaway'){
   o.geometry.computeBoundingBox();expect(o.geometry.boundingBox!.max.y).toBeLessThanOrEqual(.73);
  }});
  const resources=new Set<T.BufferGeometry|T.Material>();root.traverse(o=>{if(o instanceof T.Mesh){if(![...geometries.values()].includes(o.geometry)&&!o.geometry.userData.sharedAsset)resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.userData.actorMaterial)resources.add(m);}});
  const spies=[...resources].map(r=>vi.spyOn(r,'dispose'));disposeModel(root);spies.forEach(s=>expect(s).toHaveBeenCalledTimes(1));
  expect(JSON.stringify(t)).toBe(before);
 });
 it('leaves legacy rooms with their original builders',()=>{expect(shipArchitectureRoom('reactor-vault',ROOM_TEMPLATES['reactor-vault'])).toBeNull();});
});
