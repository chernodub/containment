import {dress13EarlyIncidents} from './Dress13EarlyIncidents';
import * as T from 'three';
import type {OriginalKitInstance} from './OriginalShipKitAssets';
/** P11 props sit within existing furnishing solids, with overhead cutaway enabled. */
export function p11HabitationPlacements(id:string):OriginalKitInstance[]{
 const place=(asset:string,x:number,z:number,angle:number,sx=1,sy=1,sz=1):OriginalKitInstance=>({
  pack:'p11-habitation',asset,purpose:'P11 habitation / '+asset,cutaway:true,
  matrix:new T.Matrix4().compose(new T.Vector3(x/32,0,z/32),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),angle),new T.Vector3(sx,sy,sz)),
 });
 // North common-nook solid x572..768,z241..279, outside the arena radius.
 // Retain 156 units to the west cabin edge and the full east gallery route.
 if(id==='residential-gallery')return [
  ...dress13EarlyIncidents(id),
  {...place('residential-common-nook',670,260,0,.90,1,.70),cutaway:false},
  place('residential-story-wall',670,260,0,.90,1,.70),
 ];
 // The existing 218×90 shared garden void supplies all collision support.
 if(id==='communal-atrium')return [...dress13EarlyIncidents(id),place('atrium-conservatory',589,355,0,1.65,1,1.04)];
 return dress13EarlyIncidents(id);
}
