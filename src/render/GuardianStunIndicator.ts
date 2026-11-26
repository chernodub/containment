import * as T from 'three';
/** Pooled world-space stun crown. Snapshot time controls visibility, no combat decisions.
 * Explicit overlay ordering keeps overhead room meshes from hiding the punish cue. */
export function guardianStunIndicator(root:T.Group) {
 const group=new T.Group();group.name='warden-wall-stun';root.add(group);
 const material=new T.MeshBasicMaterial({color:0xffd36a,transparent:true,opacity:1,depthTest:false,depthWrite:false,toneMapped:false,side:T.DoubleSide});material.userData.actorMaterial=true;
 const arc=new T.RingGeometry(.40,.49,32,1,0,Math.PI*.4);arc.userData.sharedAsset=false;
 for(let i=0;i<3;i++){const mesh=new T.Mesh(arc,material);mesh.rotation.x=-Math.PI/2;mesh.rotation.z=i*Math.PI*2/3;mesh.castShadow=mesh.receiveShadow=false;mesh.frustumCulled=false;mesh.renderOrder=900;group.add(mesh);}
 group.visible=false;
 return {update(remaining:number,height:number,warden=false){material.opacity=warden?.58:1;group.visible=remaining>0;group.position.y=height+.12;group.rotation.y=remaining/1500*Math.PI*2;},prepare(height:number){group.visible=true;group.position.y=height+.12;},reset(){group.visible=false;group.traverse(object=>{if(object instanceof T.Mesh)object.castShadow=object.receiveShadow=false;});}};
}
