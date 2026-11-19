import * as T from 'three';
import {inc13ManualPlacement} from './Inc13Manual';
import type {OriginalKitInstance} from './OriginalShipKitAssets';
import {dress13GatePlacements} from './Dress13GatePlacements';
/** Native machinery solids retain collision ownership; these are presentation replacements. */
export function p11ControlPlacements(id:string):OriginalKitInstance[]{
 const placements:Record<string,[string,number,number,number,number,number]>={
  'transmission-chamber':['uplink-tracking-dish',816,348,.97,.65,.22],
  'diagnostic-gallery':['specimen-probe-cradle',790,340,1.1,.85,.8],
  'safety-interlock-station':['key-cylinder-interlock',650,365,1,.85,.8],
  'overload-floor':['reactor-crown',700,508,1.67,1.4,1.69],
 };
 const growth=dress13GatePlacements(id);
 if(id==='manual-control-chamber')return [...growth,inc13ManualPlacement()];
 const p=placements[id];if(!p)return growth;
 return [...growth,{pack:(id==='overload-floor')?'p11-reactor':'p11-control',asset:p[0],matrix:new T.Matrix4().compose(new T.Vector3(p[1]/32,0,p[2]/32),new T.Quaternion(),new T.Vector3(p[3],p[4],p[5])),purpose:'P11 / '+p[0],cutaway:true}];
}
