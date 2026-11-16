import * as T from 'three';
import type {OriginalKitInstance} from './OriginalShipKitAssets';
/** Native machinery solids retain collision ownership; these are presentation replacements. */
export function p11ControlPlacements(id:string):OriginalKitInstance[]{
 const placements:Record<string,[string,number,number,number,number,number]>={
  'transmission-chamber':['uplink-tracking-dish',816,380,1,.65,.6],
  'diagnostic-gallery':['specimen-probe-cradle',790,340,1.1,.85,.8],
  'safety-interlock-station':['key-cylinder-interlock',650,365,1,.85,.8],
  'manual-control-chamber':['manual-authorisation-dais',640,380,.95,.9,.75],
  'overload-floor':['reactor-crown',700,500,1.7,1.4,1.7],
 };
 const p=placements[id];if(!p)return [];
 return [{pack:(id==='manual-control-chamber'||id==='overload-floor')?'p11-reactor':'p11-control',asset:p[0],matrix:new T.Matrix4().compose(new T.Vector3(p[1]/32,0,p[2]/32),new T.Quaternion(),new T.Vector3(p[3],p[4],p[5])),purpose:'P11 / '+p[0],cutaway:true}];
}
