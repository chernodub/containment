import * as T from 'three';

/** Pin a point on the actual skinned pad while its clip is bearing weight.
 * Release before the next mixer evaluation, including skipped distant poses. */
export function heavyContacts(root:T.Object3D) {
 let mesh:T.SkinnedMesh|undefined;
 root.traverse(o=>{if(o instanceof T.SkinnedMesh && !mesh && o.name.includes('base'))mesh=o;});
 if(!mesh)return;
 const skin=mesh;
 const point=new T.Vector3(), anchorLocal=new T.Vector3(),hinge=new T.Vector3(),desired=new T.Vector3(),turn=new T.Quaternion();
 const pads=[-1,1].flatMap(side=>[true,false].flatMap(hand=>{
  const suffix=side<0?'r':'l';
  const joint=skin.skeleton.bones.findIndex(b=>b.name.replace(/[._]/g,'')===(hand?'shoulder':'footback')+suffix);
  if(joint<0)return [];
  const bone=skin.skeleton.bones[joint];
  const bind=new T.Vector3(hand?2.4:-1.4,side*(hand?3:1.95),hand?2.40:.12);
  bind.applyMatrix4(skin.bindMatrix).applyMatrix4(skin.skeleton.boneInverses[joint]);
  const pivot=new T.Vector3(hand?.3:-1.30,side*(hand?1.70:1.70),hand?6.90/1.8:3.05/1.8)
   .applyMatrix4(skin.bindMatrix).applyMatrix4(skin.skeleton.boneInverses[joint]);
  return [{bone,bind,pivot,original:new T.Quaternion(),turned:false,side,hand,anchor:new T.Vector3(),offset:new T.Vector3(),held:false}];
 }));
 return {
  release(){for(const pad of pads){pad.bone.position.sub(pad.offset);pad.offset.set(0,0,0);if(pad.turned){pad.bone.quaternion.copy(pad.original);pad.turned=false;}pad.bone.updateMatrix();}},
  reset(){for(const pad of pads)pad.held=false;},
  apply(phase:number){
   for(const p of pads){
    const u=(phase+(p.side>0?.5:0)+(p.hand?0:.36))%1;
    if(phase<0||u>=.58){p.held=false;continue;}
    const parent=p.bone.parent!;
    p.bone.updateWorldMatrix(true,false);
    point.copy(p.bind).applyMatrix4(p.bone.matrixWorld);
    if(!p.held || Math.hypot(point.x-p.anchor.x,point.z-p.anchor.z)>1.45){
     p.anchor.copy(point);p.anchor.y=root.position.y+.06;p.held=true;
    }
    anchorLocal.copy(p.anchor);
    parent.worldToLocal(anchorLocal);parent.worldToLocal(point);
    // Rotate the link about its proximal contact first. Only the remaining
    // difference in reach travels through the shoulder or hind ankle.
    hinge.copy(p.pivot).applyMatrix4(p.bone.matrix);
    desired.subVectors(anchorLocal,hinge).normalize();
    point.sub(hinge).normalize();
    turn.setFromUnitVectors(point,desired);
    p.original.copy(p.bone.quaternion);p.turned=true;
    p.bone.quaternion.premultiply(turn);p.bone.updateMatrix();
    point.copy(p.bind).applyMatrix4(p.bone.matrix);
    p.offset.subVectors(anchorLocal,point);
    p.bone.position.add(p.offset);p.bone.updateMatrix();
   }
  }
 };
}
