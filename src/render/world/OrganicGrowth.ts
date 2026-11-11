import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {MAT,box,geometry} from '../meshParts';

function randomSource(seed:number,index:number){
  let state=(seed^Math.imul(index+1,0x9e3779b1))>>>0;
  return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}
const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
const up=v(0,1,0),wallNormal=v(1,0,0);

/** Session-owned finishes. Green belongs to a cut inside the growth, never the whole skin. */
export const GROWTH_MAT={
  tissue:new T.MeshStandardMaterial({color:0x51313f,roughness:.83,metalness:.02}),
  carapace:new T.MeshStandardMaterial({color:0x6b5368,roughness:.72,metalness:.035}),
  fissure:new T.MeshStandardMaterial({color:0x75896b,roughness:.57,metalness:0,emissive:0x74b942,emissiveIntensity:.48}),
};

function deformSac(x:number,y:number,z:number,variant:number):T.Vector3 {
  const phase=variant*1.7;
  const fold=1+.14*Math.sin(y*3.2+z*2.7+phase)+.065*Math.cos(z*7+x*4+phase);
  return v(x*(.84+.16*(1-y))*fold+.2*y*y+.11*Math.sin(y*2+phase),
    y*(.82+.055*Math.sin(x*3+phase))+.12*x*x-.13*z,
    z*(1+.16*Math.sin(x*3.7-y*2+phase))+.15*y-.06*x*x);
}

/** Three shared slumped topologies; no rotational ribs or dimension-keyed seed entries. */
export function organicGeometry(variant=0):T.BufferGeometry {
  const bin=((Math.floor(variant)%3)+3)%3;
  return geometry(`x2-slumped-sac-v4:${bin}`,()=>{
    const g=new T.SphereGeometry(1,18,12),p=g.getAttribute('position');
    for(let i=0;i<p.count;i++){const q=deformSac(p.getX(i),p.getY(i),p.getZ(i),bin);p.setXYZ(i,q.x,q.y,q.z);}
    g.computeVertexNormals();return g;
  });
}

/** Smooth, flared tissue with an elliptical section. Only returned room geometry is owned. */
export function membraneGeometry(points:T.Vector3[],width:number,thickness=.035,normalHint=up,steps=18):T.BufferGeometry {
  const curve=new T.CatmullRomCurve3(points,false,'centripetal'),data:number[]=[],uv:number[]=[],indices:number[]=[];
  const side=new T.Vector3(),normal=new T.Vector3(),sides=6;
  for(let i=0;i<=steps;i++){
    const t=i/steps,p=curve.getPoint(t),tangent=curve.getTangent(t).normalize();side.crossVectors(normalHint,tangent);
    if(side.lengthSq()<.001)side.set(1,0,0);side.normalize();normal.crossVectors(tangent,side).normalize();
    const flare=.32+.68*Math.pow(Math.sin(t*Math.PI),.7),w=width*flare*(1+.12*Math.sin(t*9.3));
    for(let j=0;j<sides;j++){
      const a=j/sides*Math.PI*2,q=p.clone().addScaledVector(side,Math.cos(a)*w).addScaledVector(normal,Math.sin(a)*thickness*flare);
      data.push(q.x,q.y,q.z);uv.push(j/sides,t);
      if(i<steps){const k=i*sides+j,n=i*sides+(j+1)%sides;indices.push(k,k+sides,n,n,k+sides,n+sides);}
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(data,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.userData.environmentUV=true;return g;
}

function web(parent:T.Group,points:T.Vector3[],width:number,material:T.Material,thickness=.035,normalHint=up){
  const mesh=new T.Mesh(membraneGeometry(points,width,thickness,normalHint),material);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function sac(parent:T.Group,x:number,y:number,z:number,w:number,h:number,d:number,variant:number,material:T.Material){
  const mesh=new T.Mesh(organicGeometry(variant),material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}

/** A long asymmetric membrane fan, with no central circular body or radial spokes. */
export function organicWallGeometry():T.BufferGeometry {
  return geometry('x2-wall-membrane-fan-v3',()=>{
    const parts:T.BufferGeometry[]=[];
    const paths=[
      [v(.65,-1.8,-1.1),v(.72,-.7,-.48),v(.74,.35,.18),v(.69,1.35,1.9)],
      [v(.65,-1.3,-.83),v(.76,-.3,-1.05),v(.71,.85,-2.35)],
      [v(.7,-.85,-.55),v(.73,.2,.9),v(.68,.42,2.5)],
      [v(.71,.25,.25),v(.75,1.25,-.35),v(.7,1.92,-1.15)],
    ];
    for(let i=0;i<paths.length;i++){const g=membraneGeometry(paths[i],i===0?.3:.18,.065,wallNormal,14);parts.push(g.toNonIndexed());g.dispose();}
    for(const [i,p]of [v(.73,.8,-1.64),v(.74,.42,1.62)].entries()){
      const g=organicGeometry(i+1).clone();g.scale(.19,.36,.26);g.rotateX(i?.5:-.6);g.translate(p.x,p.y,p.z);parts.push(g.toNonIndexed());g.dispose();
    }
    const merged=mergeGeometries(parts,false)!;for(const part of parts)part.dispose();merged.translate(.35,0,0);return merged;
  });
}

/** Restrained crooked fissure geometry shared by wall and equipment tissue. */
export function organicFissureGeometry():T.BufferGeometry {
  return geometry('x2-inner-organic-fissure-v2',()=>membraneGeometry([v(0,-.8,-.28),v(.01,-.2,.14),v(0,.22,.08),v(0,.65,.43)],.07,.018,wallNormal,14));
}

/** A consumed machine has irregular slumped sacs and tissue wrapping its remaining frame. */
export function addBroodCell(cell:T.Group,seed:number,index:number):void {
  const random=randomSource(seed,index),bias=(random()-.5)*.55;
  const wreck=box(cell,-.12,.18,-.11,1.24,.2,.94,MAT.steel,.045);wreck.rotation.y=(random()-.5)*.5;
  const remnant=box(cell,-.4,.48,-.5,.48,.5,.4,MAT.black,.035);remnant.rotation.z=-.18;
  const face=box(cell,-.39,.75,-.49,.42,.025,.34,MAT.edge,.012);face.rotation.x=.3;
  // Tissue curls around the remaining mechanical edges instead of forming a flat pad.
  web(cell,[v(-.55,.1,-.54),v(-.68,.29,-.32),v(-.45,.46,-.05),v(.08,.43,.19)],.2,GROWTH_MAT.tissue,.065);
  web(cell,[v(.57,.11,.45),v(.64,.28,.19),v(.35,.48,-.13),v(-.15,.43,-.25)],.23,GROWTH_MAT.tissue,.07);
  const count=2+Math.floor(random()*4),leanSign=random()<.5?-1:1;
  for(let n=0;n<count;n++){
    const x=bias+(random()-.5)*.96,z=(random()-.5)*1.42,variant=(index+n)%3;
    const size=(n===0?.46:.22)+random()*(n===0?.12:.26),h=.27+random()*.42,d=size*(.65+random()*.55);
    const group=new T.Group();group.position.set(x,.46+h*.8,z);group.rotation.set((random()-.5)*.75,random()*Math.PI*2,leanSign*(.2+random()*.48));group.scale.set(size,h,d);cell.add(group);
    sac(group,0,0,0,1,1,1,variant,n%3===1?GROWTH_MAT.tissue:GROWTH_MAT.carapace);
    // One interrupted wound is embedded in the deformed skin; no seven-part crown.
    const angle=random()*Math.PI*2,path:T.Vector3[]=[];
    for(let row=0;row<7;row++){
      const t=row/6,y=-.22+t*.91,a=angle+Math.sin(t*5.4+n)*.17,r=Math.sqrt(Math.max(0,1-y*y));
      path.push(deformSac(Math.cos(a)*r,y,Math.sin(a)*r,variant).multiplyScalar(1.012));
    }
    web(group,path,.019,GROWTH_MAT.fissure,.012);
    web(cell,[v(bias,.31,.04),v((bias+x)*.5,.45,z*.4),v(x,.48,z)],.14+random()*.09,GROWTH_MAT.tissue,.065);
    const side=n%2?-.59:.59;
    web(cell,[v(x,.5,z),v(side,.37,z+.12),v(side*.98,.11,z+.24)],.15,GROWTH_MAT.tissue,.055);
  }
  cell.userData.growthSeed=seed;cell.userData.broodSacs=count;
}

/** Irregular climbing membranes stay attached to the existing rear wall face. */
export function addWallRoots(parent:T.Group,x:number,seed:number,index:number):void {
  const random=randomSource(seed,index),start=x+(random()-.5)*.8;
  for(let branch=0;branch<4;branch++){
    const to=x+(random()-.5)*3.1;
    web(parent,[v(start,.05,.045),v(start+(to-start)*.2,.65,.055),v(to,1.24+random()*.3,.05),v(to+(random()-.5)*.5,2.1+random()*.3,.04)],.13+random()*.08,GROWTH_MAT.tissue,.018,v(0,0,1));
  }
}
