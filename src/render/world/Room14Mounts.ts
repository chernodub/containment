import * as T from 'three';
import data from './room14-mounts.json';

// Affine room-space mounts measured by the offline placement tool. Preserve
// relative orientations within each assembly. Rows store scale, native-unit X/Z
// translation, shelf height in metres and an optional independent depth scale.
export function mountMatrix(room:string):T.Matrix4|undefined {
  const entry=(data as Record<string,number[]>)[room];
  if(!entry)return;
  const [scale,x,z,lift,depth=scale]=entry;
  return new T.Matrix4().makeScale(scale,scale,depth).setPosition(x/32,lift,z/32);
}
export function mountObject(room:string,object:T.Object3D):void {
  const m=mountMatrix(room);
  if(!m||!object.parent)return;
  if(object.name==='room14-manual-cable')return;
  if(object.name.endsWith('-deck')){
    // Damage on the deck stays in the approach. Only the bypass cables and
    // living membrane have endpoints that physically track their fixture.
    if(['freight-hold','diagnostic-gallery','crew-checkpoint','relay-racks','shielding-gate','breached-loading-bay'].includes(room))return;
    m.elements[5]=1;m.elements[13]=0;
    if(room==='swarm-junction'){
      // Fan out from the new duct lip across the plates toward the original fight.
      m.elements[2]=.78;m.elements[10]=1;m.elements[14]=(370-493-.78*361)/32;
    }
  }
  const parent=object.parent,mount=new T.Group();
  mount.matrix.copy(m);mount.matrixAutoUpdate=false;parent.add(mount);mount.add(object);
}
