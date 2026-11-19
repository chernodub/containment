import * as T from 'three';
import type {OriginalKitInstance} from './OriginalShipKitAssets';
export function p11ClinicalSecurityPlacements(id:string):OriginalKitInstance[]{
 const place=(asset:string,x:number,z:number,angle=0,sx=1,sy=1,sz=1):OriginalKitInstance=>({pack:'p11-clinical-security',asset,purpose:'P11 clinical/security / '+asset,cutaway:true,matrix:new T.Matrix4().compose(new T.Vector3(x/32,0,z/32),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),angle),new T.Vector3(sx,sy,sz))});
 // Existing north-bank void x440..840,z240..350; full bank skin is replaced.
 if(id==='awakening-bay')return [{...place('breached-recovery-bank',640,295,0,1.15,1,1.42),pack:'p11-inc13-awakening',cutaway:false}];
 // Existing A-bank void x320..520,z260..360; keep drawer travel inside it.
 if(id==='passenger-vault')return [place('passenger-sleeper-carrier',420,307,0,1.8,1,1.45)];
 if(id==='crew-checkpoint'){
  const failed=place('checkpoint-failed-barrier',820,272);
  // The retained manufactured booth rail is 1.202m high. Its hinge shoe
  // begins at .90m in the authoring model, so seat it on that actual cap.
  failed.matrix.elements[13]=.302;
  // The original portal already supplies both scanner shoes. The extra
  // freestanding reader projected into the lane between them.
  return [failed];
 }
 if(id==='armory')return [place('armory-weapon-carousel',600,450,0,1.65,1.3,1.65)];
 return [];
}
