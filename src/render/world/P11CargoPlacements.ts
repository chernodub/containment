import * as T from 'three';
import type {OriginalKitInstance} from './OriginalShipKitAssets';
/** Cargo landmarks remain inside existing native machinery/tear solids. */
export function p11CargoPlacements(id:string):OriginalKitInstance[]{
 const place=(asset:string,x:number,z:number,angle:number,heightScale=1):OriginalKitInstance=>({
  pack:'p11-cargo',asset,purpose:'P11 cargo / '+asset,cutaway:true,
  matrix:new T.Matrix4().compose(new T.Vector3(x/32,0,z/32),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),angle),new T.Vector3(1,heightScale,1)),
 });
 // Gantry footprint fits the established 260×108-unit machinery island.
 // Lower the crown to 4.16m: the native tour cropped its original 5.62m height.
 if(id==='freight-hold')return [place('freight-suspension-gantry',790,486,0,.74)];
 // Compact assembly follows the diagonal void; no gameplay collider added.
 if(id==='breached-loading-bay')return [place('loading-wedged-pod',690,390,-.58)];
 return [];
}
