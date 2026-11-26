import * as T from 'three';

/** Pin a point on the actual skinned pad while its clip is bearing weight.
 * Release before the next mixer evaluation, including skipped distant poses. */
export function heavyContacts(root:T.Object3D) {
 let mesh:T.SkinnedMesh|undefined;
 root.traverse(o=>{if(o instanceof T.SkinnedMesh && !mesh && o.name.includes('base'))mesh=o;});
 if(!mesh)return;
 const skin=mesh;
 const point=new T.Vector3(), anchorLocal=new T.Vector3();
 const pads=[-1,1].flatMap(side=>[true,false].flatMap(hand=>{
  const suffix=side<0?'r':'l';
  const joint=skin.skeleton.bones.findIndex(b=>b.name===(hand?'shoulder':'foot_back')+'_'+suffix || b.name===(hand?'shoulder':'foot.back')+'.'+suffix);
  if(joint<0)return [];
  const bone=skin.skeleton.bones[joint];
  const bind=new T.Vector3(hand?2.4:-1.4,side*(hand?3:1.95),hand?2.40:.12);
  bind.applyMatrix4(skin.bindMatrix).applyMatrix4(skin.skeleton.boneInverses[joint]);
  return [{bone,bind,side,hand,anchor:new T.Vector3(),offset:new T.Vector3(),held:false}];
 }));
 return {
  release(){for(const pad of pads){pad.bone.position.sub(pad.offset);pad.offset.set(0,0,0);}},
  reset(){for(const pad of pads)pad.held=false;},
  apply(phase:number){
   for(const p of pads){
    const u=(phase+(p.side>0?.5:0)+(p.hand?0:.36))%1;
    if(phase<0||u>=.58){p.held=false;continue;}
    const parent=p.bone.parent!;
    p.bone.updateWorldMatrix(true,false);
    point.copy(p.bind).applyMatrix4(p.bone.matrixWorld);
    if(!p.held || point.distanceToSquared(p.anchor)>1.44){
     p.anchor.copy(point);p.anchor.y=root.position.y+.06;p.held=true;
    }
    anchorLocal.copy(p.anchor);
    parent.worldToLocal(anchorLocal);parent.worldToLocal(point);
    p.offset.subVectors(anchorLocal,point);
    p.bone.position.add(p.offset);p.bone.updateMatrix();
   }
  }
 };
}
