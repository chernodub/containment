import * as T from 'three';
import type {OriginalKitInstance} from './OriginalShipKitAssets';
/** P11 props sit within existing furnishing solids, with overhead cutaway enabled. */
export function p11HabitationPlacements(id:string):OriginalKitInstance[]{
 const place=(asset:string,x:number,z:number,angle:number,sx=1,sy=1,sz=1):OriginalKitInstance=>({
  pack:'p11-habitation',asset,purpose:'P11 habitation / '+asset,cutaway:true,
  matrix:new T.Matrix4().compose(new T.Vector3(x/32,0,z/32),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),angle),new T.Vector3(sx,sy,sz)),
 });
 // West common-nook footprint x=0..40, z=400..560. Scale along the wall to
 // that existing solid; retain 140+ unit gallery lanes and native colliders.
 if(id==='residential-gallery')return [place('residential-common-nook',23,480,Math.PI/2,.72,1,.78)];
 // The existing 218×90 shared garden void supplies all collision support.
 if(id==='communal-atrium')return [place('atrium-conservatory',589,355,0,1.65,1,1.04)];
 return [];
}
