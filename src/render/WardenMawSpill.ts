import * as T from 'three';
import {geometry} from './meshParts';

/** Project the animated leading lip onto the deck. The floor pool has no ink ID. */
export function wardenMawSpill(root: T.Object3D, mesh: T.SkinnedMesh, boss: T.BufferGeometry) {
  const positions=boss.getAttribute('position'), uv=boss.getAttribute('uv');
  let lip=-1;
  for(let i=0;i<positions.count;i++){
    const cell=Math.floor(uv.getX(i)*4)+4*(3-Math.floor(uv.getY(i)*4));
    if(cell===3 && (lip<0 || positions.getX(i)>positions.getX(lip)))lip=i;
  }
  const disc=geometry('warden-maw-spill',()=>new T.CircleGeometry(1,32));
  const material=new T.MeshBasicMaterial({color:0xc09353,blending:T.AdditiveBlending,
    transparent:true,depthWrite:false,opacity:.32});
  material.userData.actorMaterial=true;
  const card=new T.Mesh(disc,material);
  card.name='warden-maw-spill';
  card.rotation.x=-Math.PI/2;
  card.scale.set(.28,.36,1);
  card.visible=false;
  root.add(card);
  const point=new T.Vector3();
  return (visible:boolean)=>{
    card.visible=visible && lip>=0 && mesh.geometry===boss;
    if(!card.visible)return;
    mesh.getVertexPosition(lip,point);
    root.worldToLocal(mesh.localToWorld(point));
    const distance=Math.hypot(point.x,point.z);
    card.rotation.z=Math.atan2(-point.x,-point.z);
    // Clear the planted elbow in the rear view while keeping the pool head-sized.
    const factor=1+.54/Math.max(.1,distance);
    card.position.set(point.x*factor,.045,point.z*factor);
  };
}
