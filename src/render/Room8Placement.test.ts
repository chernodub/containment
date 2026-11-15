import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {authoredRoom} from './AuthoredRooms';
import {disposeModel} from './meshParts';
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import {SHIP_ACT2_PLANS} from '../game/roguelike/shipArchitectureAct2';
import {createRoomTemplateGeometry,canOccupyExpedition} from '../game/world/expeditionGeometry';
import {FacilityNavigation} from '../game/world/FacilityNavigation';
import {DepthGame} from '../DepthGame';
const id='breached-loading-bay';
const template={...ROOM_TEMPLATES[id],...SHIP_ACT2_PLANS[id].topology};
const routes=[[[140,440],[280,520],[440,560],[600,620],[960,620],[1080,520]],[[140,440],[160,700],[500,760],[600,780],[940,780],[980,740],[980,620],[1080,520]]];
describe('Room8 story-flow placement',()=>{
 it('secures both loading beds against the stern and retains the exact diagonal scar',()=>{
  expect(template.obstacles).toEqual([{x:280,y:840,width:140,height:80},{x:700,y:840,width:200,height:80}]);for(const r of template.obstacles)expect(r.y+r.height).toBe(920);
  expect(template.voids![0]).toEqual(ROOM_TEMPLATES[id].voids![0]);
  const geometry=createRoomTemplateGeometry(template,'room8-layout');
  expect(canOccupyExpedition(geometry,{x:780,y:880},16)).toBe(false);
 });
 it('renders a continuous raised hull seal across the solid scar',()=>{
  const room=authoredRoom(id,template)!;room.updateMatrixWorld(true);
  const seal=room.children.find(o=>o instanceof T.Mesh&&(o.material as T.Material).name==='room8-hull-seal') as T.Mesh;
  expect(seal).toBeDefined();
  if(seal){
   const ray=new T.Raycaster();
   for(const [x,y] of [[460,307],[600,280],[680,410],[820,510],[900,459]]){
    ray.set(new T.Vector3(x/32,6,y/32),new T.Vector3(0,-1,0));
    const hit=ray.intersectObject(seal)[0];expect(hit).toBeDefined();expect(hit.point.y).toBeGreaterThan(.1);
   }
  }
  disposeModel(room);
 });
 it('keeps both broad lanes below the hull-connected tear usable for player and large actors in runtime geometry',()=>{
  const geometry=createRoomTemplateGeometry(template,'room8-layout'),navigation=new FacilityNavigation(geometry);navigation.prepare(geometry.playerSpawn,1);
  for(const route of routes)for(let i=1;i<route.length;i++){
   const a=route[i-1],b=route[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/4);
   for(let j=0;j<=steps;j++)for(const radius of [16,28,38])expect(canOccupyExpedition(geometry,{x:a[0]+(b[0]-a[0])*j/steps,y:a[1]+(b[1]-a[1])*j/steps},radius)).toBe(true);
  }
  for(const p of [geometry.playerSpawn,geometry.exitPoint,...geometry.breaches])expect(navigation.reachable(p)).toBe(true);
  for(const route of routes)for(const radius of [16,28,38]){
   const game=new DepthGame();game.geometry=geometry;
   for(let i=1;i<route.length;i++){
    const a=route[i-1],b=route[i],moved=game.moveCorpse({x:a[0],y:a[1],radius},b[0]-a[0],b[1]-a[1]);
    expect(moved.blocked).toBe(false);expect(moved.x).toBeCloseTo(b[0]);expect(moved.y).toBeCloseTo(b[1]);
   }
  }
 });
});
