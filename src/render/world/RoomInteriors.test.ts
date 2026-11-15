import * as T from 'three';
import {describe,it,expect,vi} from 'vitest';
import {buildRoomInteriors,INTERIOR_ROOMS,type InteriorProof} from './RoomInteriors';
import {SHIP_ARCHITECTURE_PLANS} from '../../game/roguelike/shipArchitectureLayouts';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {clearPolygonTopology} from '../../game/world/polygonGeometry';
import {kitBoundsSupported} from './KitSafety';
import {disposeModel} from '../meshParts';

describe('named ship interiors',()=>{
  it.each([...INTERIOR_ROOMS])('%s covers every space without borrowing navigation',id=>{
    const t=ROOM_TEMPLATES[id as keyof typeof ROOM_TEMPLATES],before=JSON.stringify(t),root=buildRoomInteriors(id,t)!;
    const proof=root.userData.interior as InteriorProof,plan=SHIP_ARCHITECTURE_PLANS[id as keyof typeof SHIP_ARCHITECTURE_PLANS]!;
    expect(proof.landmark.length).toBeGreaterThan(15);
    for(const space of plan.spaces){
      expect(proof.floor.find(f=>f.name===space.name)?.area,space.name).toBeGreaterThan(1);
      const cluster=proof.clusters.find(c=>c.space===space.name);expect(cluster,space.name).toBeDefined();
      expect(cluster!.pieces).toBeGreaterThanOrEqual(3);
      for(const [min,max]of cluster!.bounds)expect(kitBoundsSupported(t,new T.Box3(new T.Vector3(...min),new T.Vector3(...max))),space.name).toBe(true);
    }
    expect(proof.fixtures).toHaveLength(plan.spaces.length);
    expect(proof.thresholds).toBe(plan.openings.length);
    const floor=root.getObjectByName('e9-named-space-decks') as T.Mesh,p=floor.geometry.getAttribute('position');
    for(let i=0;i<p.count;i+=3){
      const point={x:(p.getX(i)+p.getX(i+1)+p.getX(i+2))*32/3,y:(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))*32/3};
      expect(clearPolygonTopology(t,point,point,0),JSON.stringify({point,i,vertices:[0,1,2].map(n=>[p.getX(i+n)*32,p.getZ(i+n)*32])})).toBe(true);
      for(let n=0;n<3;n++)expect(p.getY(i+n)).toBeLessThan(.022);
    }
    expect(root.children.length).toBeLessThanOrEqual(4);
    const resources=new Set<T.BufferGeometry|T.Material>();root.traverse(o=>{if(o instanceof T.Mesh){resources.add(o.geometry);resources.add(o.material as T.Material);}});
    const spies=[...resources].map(r=>vi.spyOn(r,'dispose'));disposeModel(root);spies.forEach(s=>expect(s).toHaveBeenCalledTimes(1));
    expect(JSON.stringify(t)).toBe(before);
  });
});
