import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {MAT,box,geometry,ball} from '../meshParts';

/** Stable room-seeded growth; this never consumes the simulation random stream. */
function randomSource(seed:number,index:number){
  let state=(seed^Math.imul(index+1,0x9e3779b1))>>>0;
  return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}
const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
const up=new T.Vector3(0,1,0);
// Seeded dimensions live in transforms, never dimension-keyed global geometry entries.
function rod(parent:T.Group,a:T.Vector3,b:T.Vector3,r:number,_r2:number,material:T.Material){
  const mesh=new T.Mesh(geometry('x2-organic-taper',()=>new T.CylinderGeometry(.65,1,1,8)),material);
  mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.set(r,a.distanceTo(b),r);mesh.quaternion.setFromUnitVectors(up,b.clone().sub(a).normalize());mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
export const GROWTH_MAT={
  tissue:new T.MeshStandardMaterial({color:0x84675c,roughness:.9,metalness:.02}),
  carapace:new T.MeshStandardMaterial({color:0x435040,roughness:.82,metalness:.04}),
  fissure:new T.MeshStandardMaterial({color:0xa1c46f,roughness:.53,metalness:0,emissive:0x78c73f,emissiveIntensity:1.4}),
};
/** Shared ribbed, asymmetric sac topology. Seeded size stays entirely in transforms. */
export function organicGeometry():T.BufferGeometry {
  return geometry('x2-ribbed-organic-sac-v2',()=>{
    const g=new T.SphereGeometry(1,16,12),p=g.getAttribute('position');
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x),rib=1+.085*Math.cos(a*7+y*2.5),lump=1+.075*Math.sin(x*8+y*4)*Math.sin(z*6-y*3);
      p.setXYZ(i,x*rib*lump+y*y*.09,y*(1+.04*Math.sin(a*3)),z*rib*lump);
    }
    g.computeVertexNormals();return g;
  });
}
/** One instanced wall-root surface includes attached branches rather than a lamp housing. */
export function organicWallGeometry():T.BufferGeometry {
  return geometry('x2-branched-wall-tissue-v1',()=>{
    const parts:T.BufferGeometry[]=[organicGeometry().toNonIndexed()];
    for(let branch=0;branch<4;branch++){
      const sign=branch%2?1:-1,a=v(.65,(branch-1.5)*.13,sign*.55),mid=v(.78,(branch-1.5)*.42,sign*1.1),end=v(.75,(branch-1.5)*.65,sign*1.85);
      for(const [from,to]of [[a,mid],[mid,end]]){
        const g=new T.CylinderGeometry(.075,.14,from.distanceTo(to),7);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(up,to.clone().sub(from).normalize()));g.translate((from.x+to.x)/2,(from.y+to.y)/2,(from.z+to.z)/2);parts.push(g.toNonIndexed());g.dispose();
      }
    }
    const merged=mergeGeometries(parts,false)!;for(const part of parts)part.dispose();return merged;
  });
}
function lobe(parent:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,material:T.Material){
  const mesh=new T.Mesh(organicGeometry(),material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
/** Broad flared membrane, owned by the room batch rather than cached for each random span. */
function web(parent:T.Group,points:T.Vector3[],width:number,material:T.Material){
  const data:number[]=[],uv:number[]=[],indices:number[]=[],side=new T.Vector3(),normal=new T.Vector3(),tangent=new T.Vector3();
  for(let i=0;i<points.length;i++){
    tangent.copy(points[Math.min(i+1,points.length-1)]).sub(points[Math.max(0,i-1)]).normalize();side.crossVectors(up,tangent);if(side.lengthSq()<.01)side.set(1,0,0);side.normalize();normal.crossVectors(tangent,side).normalize();
    const size=width*(.7+.3*Math.sin(i/(points.length-1)*Math.PI));
    for(let j=0;j<8;j++){const a=j/8*Math.PI*2,q=points[i].clone().addScaledVector(side,Math.cos(a)*size).addScaledVector(normal,Math.sin(a)*.035);data.push(q.x,q.y,q.z);uv.push(j/8,i/(points.length-1));if(i<points.length-1){const k=i*8+j,n=i*8+(j+1)%8;indices.push(k,k+8,n,n,k+8,n+8);}}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(data,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.userData.environmentUV=true;
  const mesh=new T.Mesh(g,material);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}

/** Irregular brood tissue consumes a retained equipment chassis inside its fitted cell. */
export function addBroodCell(cell:T.Group,seed:number,index:number):void {
  const random=randomSource(seed,index),bias=random()*.7-.35;
  const wreck=box(cell,-.12,.19,-.11,1.38,.27,1.5,MAT.steel,.07);wreck.rotation.y=.12+bias*.17;
  // One damaged console is still recognizable beneath the connected tissue.
  box(cell,-.44,.65,-.55,.63,.8,.66,MAT.black,.04);
  const face=box(cell,-.44,1.06,-.55,.52,.035,.5,MAT.edge,.015);face.rotation.x=.23;
  for(let wire=0;wire<3;wire++)rod(cell,v(-.6+wire*.1,.96,-.28),v(-.7+wire*.11,.36,.14),.026,.02,MAT.copper);
  // Sphere dimensions are radii: three overlapping low lobes fit the original 2.2m cell.
  lobe(cell,bias-.12,.35,-.4,.62,.16,.58,GROWTH_MAT.tissue);
  lobe(cell,bias+.18,.38,.15,.52,.19,.72,GROWTH_MAT.tissue);
  lobe(cell,bias-.14,.35,.69,.45,.15,.4,GROWTH_MAT.tissue);
  const sacs=3+Math.floor(random()*3);
  for(let n=0;n<sacs;n++){
    const x=(random()-.5)*.98,z=(random()-.5)*1.6;
    const size=.26+random()*.33,height=.35+random()*.57,turn=random()*Math.PI;
    const cy=.61+height*.42,hy=height*.72;
    const sac=lobe(cell,x,cy,z,size,hy,size*.72,GROWTH_MAT.carapace);sac.rotation.y=turn;
    for(let rib=0;rib<7;rib++){
      const angle=rib*Math.PI*2/7,path:T.Vector3[]=[];
      for(let row=0;row<7;row++){const t=-.65+row/6*1.57,rad=Math.sqrt(Math.max(0,1-t*t))*1.04;const px=Math.cos(angle)*size*rad,pz=Math.sin(angle)*size*.72*rad;path.push(v(x+px*Math.cos(turn)+pz*Math.sin(turn),cy+t*hy,z-px*Math.sin(turn)+pz*Math.cos(turn)));}
      web(cell,path,.035,GROWTH_MAT.tissue);
      if(rib===1||rib===4){const crack=path.map(p=>p.clone().add(v(.015,.012,.015)));web(cell,crack,.016,GROWTH_MAT.fissure);}
    }
    // Flared tissue webs crawl over the chassis and merge into adjacent sacs.
    web(cell,[v(bias,.49,.12),v((bias+x)/2,.61,z*.45),v(x,cy-hy*.4,z)],.19,GROWTH_MAT.tissue);
    const edge=n%2?-.77:.77;
    web(cell,[v(x,cy-hy*.45,z),v(edge*.8,.38,z+.06),v(edge,.11,z+(random()-.5)*.4)],.18,GROWTH_MAT.tissue);
  }
  cell.userData.growthSeed=seed;cell.userData.broodSacs=sacs;
}

/** Wall-root mesh stays behind the enclosure plane; branching crosses panel seams. */
export function addWallRoots(parent:T.Group,x:number,seed:number,index:number):void {
  const random=randomSource(seed,index),lean=(random()-.5)*1.1;
  lobe(parent,x+lean,1.3,.01,.65,.95,.07,GROWTH_MAT.tissue);
  for(let branch=0;branch<5;branch++){
    const base=x+(random()-.5)*2.8,top=x+lean+(random()-.5)*1.3;
    const mid=v((base+top)/2,.75+random()*.6,.045+random()*.025);
    web(parent,[v(base,.05,.035),mid,v(top,1.8+random()*.7,.04)],.17,GROWTH_MAT.tissue);
    rod(parent,mid,v(top,1.8+random()*.7,.04),.085,.025,GROWTH_MAT.tissue);
    if(branch%2===0)ball(parent,mid.x,mid.y,.085,.045,.2,.018,GROWTH_MAT.fissure);
  }
}
