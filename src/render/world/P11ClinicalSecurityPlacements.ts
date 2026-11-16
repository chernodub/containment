import * as T from 'three';
import type {OriginalKitInstance} from './OriginalShipKitAssets';
export function p11ClinicalSecurityPlacements(id:string):OriginalKitInstance[]{
 const place=(asset:string,x:number,z:number,angle=0,sx=1,sy=1,sz=1):OriginalKitInstance=>({pack:'p11-clinical-security',asset,purpose:'P11 clinical/security / '+asset,cutaway:true,matrix:new T.Matrix4().compose(new T.Vector3(x/32,0,z/32),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),angle),new T.Vector3(sx,sy,sz))});
 if(id==='awakening-bay')return [place('awakening-berth-array',640,190,0,1.15,1,1.25)];
 if(id==='passenger-vault')return [place('passenger-sleeper-carrier',420,190,0,1.8,1,2.5)];
 if(id==='crew-checkpoint')return [place('checkpoint-scanner-gate',208,440,Math.PI/2)];
 if(id==='armory')return [place('armory-weapon-carousel',600,450,0,1.65,1.3,1.65)];
 return [];
}
