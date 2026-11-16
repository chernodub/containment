import * as T from 'three';
import type {RoomTemplate} from '../../game/roguelike/types';
import {shipInteriorFurnishings} from '../../game/roguelike/shipInteriorFurnishings';
import {SHIP_ARCHITECTURE_PLANS} from '../../game/roguelike/shipArchitectureLayouts';
import {storyRoomFor} from '../../game/roguelike/storyRooms';
import type {OriginalKitInstance} from './OriginalShipKitAssets';

/** Small hardware is captive on existing far-side machinery roofs. Existing
 * authoritative furnishing solids and lane clearances remain unchanged. */
export function p11ServicePlacements(t:RoomTemplate):OriginalKitInstance[]{
 const plan=SHIP_ARCHITECTURE_PLANS[t.id as keyof typeof SHIP_ARCHITECTURE_PLANS];
 const environment=storyRoomFor(t.id)?.environment;
 if(!plan||!environment)return [];
 const height:Record<string,number>={
  'comms-rack-low':.8885,'cargo-restraintbank':.9,
  'security-lockers-low':.9,
 };
 const consoleAsset:Record<string,string>={
  'relay-racks':'service-console-bars','transmission-chamber':'service-console-schematic',
  'crew-checkpoint':'service-console-bars',armory:'service-console-schematic',
 };
 const consoleRoom=consoleAsset[t.id];
 const candidates=shipInteriorFurnishings(t)
  .filter(f=>f.source!=='portal'&&(height[f.asset]!==undefined||f.source==='wall')&&f.z<plan.arena.y-80)
  .sort((a,b)=>(consoleRoom?Number(height[b.asset]!==undefined)-Number(height[a.asset]!==undefined):0)||a.z-b.z||a.x-b.x).slice(0,2);
 const industrial=['cargo','maintenance','infested','reactor'].includes(environment);
 return candidates.flatMap((f,i)=>{
  const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),f.angle);
  const roof=height[f.asset];
  const position=new T.Vector3(f.x/32,(roof??0)*f.scale[1],f.z/32);
  if(roof===undefined)position.add(new T.Vector3(0,0,-.5).applyQuaternion(q));
  const console=consoleRoom&&roof!==undefined&&i===0;
  const asset=console?consoleRoom:roof===undefined?(industrial?'service-valve-manifold':'service-access-hatch'):industrial?(i?'service-pressure-drum':'service-transit-case'):(i?'service-stowage-crate':'service-cable-tray');
  // Tray runs along equipment width, fitting the shallow original roof.
  const rotation=asset==='service-cable-tray'?q.clone().multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2)):q;
  return [{pack:'p11-service' as const,asset,purpose:'P11 captive service hardware / '+f.space,cutaway:true,highDetail:true,
   matrix:new T.Matrix4().compose(position,rotation,new T.Vector3().setScalar(console ? .65 : .8)),
  }];
 });
}
