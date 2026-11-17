import * as T from 'three';
import type {Point,RoomTemplate} from '../../game/roguelike/types';
import {SHIP_ARCHITECTURE_PLANS} from '../../game/roguelike/shipArchitectureLayouts';
import {clearPolygonTopology} from '../../game/world/polygonGeometry';
import {clearRectSweep} from '../../game/world/facilityGeometry';

type Plan=Pick<RoomTemplate,'width'|'height'|'boundary'|'voids'|'obstacles'|'breaches'>;
const U=32,QUIET=160;
const mix=(a:Point,b:Point,s:number):Point=>({x:a.x+(b.x-a.x)*s,y:a.y+(b.y-a.y)*s});
const rectPoly=(r:Plan['obstacles'][number]):Point[]=>[{x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x+r.width,y:r.y+r.height},{x:r.x,y:r.y+r.height}];
const distanceToSegment=(p:Point,a:Point,b:Point)=>{const d=(b.x-a.x)**2+(b.y-a.y)**2,s=d?Math.max(0,Math.min(1,((p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y))/d)):0;return Math.hypot(p.x-a.x-(b.x-a.x)*s,p.y-a.y-(b.y-a.y)*s);};
/** Dry living membranes follow construction, not random stains. Fixed budget,
 * existing Standard material family, no textures/animation/tier allocations. */
export function buildL8ShipSeamGrowth(id:string,t:Plan):T.Group|null{
 if(id === 'swarm-junction') return null; // DRESS13 replaces strands with the authored Brood masses.
 if(!['infested-workshop','swarm-junction'].includes(id))return null;
 const plan=SHIP_ARCHITECTURE_PLANS[id as keyof typeof SHIP_ARCHITECTURE_PLANS];
 // An exact live-plan opt-in preserves historical/legacy construction.
 if(!plan||JSON.stringify(t.boundary)!==JSON.stringify(plan.topology.boundary))return null;
 const root=new T.Group();root.name='l8-ship-seam-growth';
 const body=new T.MeshStandardMaterial({name:'l8-rooted-membrane',color:0x71616a,roughness:.78,metalness:.025,vertexColors:true,side:T.DoubleSide});
 const vein=new T.MeshStandardMaterial({name:'l8-rooted-fibre',color:0x8b9278,roughness:.74,metalness:.015,emissive:0x465032,emissiveIntensity:.07,vertexColors:true,side:T.DoubleSide});
 body.userData.actorMaterial=vein.userData.actorMaterial=true;
 // Exact solid faces carry shallow folded skins; offset only resolves their
 // coplanar attachment to the manufactured wall, without moving any vertex.
 body.polygonOffset=vein.polygonOffset=true;body.polygonOffsetFactor=vein.polygonOffsetFactor=-1;body.polygonOffsetUnits=vein.polygonOffsetUnits=-1;
 const bins=[{p:[] as number[],c:[] as number[]},{p:[] as number[],c:[] as number[]}],arena=plan.arena;
 const deck=(a:Point,b=a)=>clearPolygonTopology(t,a,b)&&t.obstacles.every(r=>clearRectSweep(a,b,0,r));
 const outsideQuiet=(a:Point,b:Point)=>distanceToSegment(arena,a,b)>=QUIET;
 const emit=(a:T.Vector3,b:T.Vector3,c:T.Vector3,bin:number,solid?:readonly Point[])=>{
  const points=[a,b,c].map(v=>({x:v.x*U,y:v.z*U}));
  const samples=[...points,mix(points[0],points[1],.5),mix(points[1],points[2],.5),mix(points[2],points[0],.5),{x:(points[0].x+points[1].x+points[2].x)/3,y:(points[0].y+points[1].y+points[2].y)/3}];
  if(solid){if(!samples.every(p=>clearPolygonTopology({boundary:solid},p,p))||!points.every((p,i)=>clearPolygonTopology({boundary:solid},p,points[(i+1)%3])))return;}
  else if(!samples.every(p=>deck(p)&&Math.hypot(p.x-arena.x,p.y-arena.y)>=QUIET)||!points.every((p,i)=>deck(p,points[(i+1)%3])&&outsideQuiet(p,points[(i+1)%3])))return;
  if(new T.Vector3().subVectors(b,a).cross(new T.Vector3().subVectors(c,a)).y<0)[b,c]=[c,b];
  for(const v of [a,b,c]){bins[bin].p.push(v.x,v.y,v.z);const shade=.82+.15*Math.sin(v.x*2.3+v.z*1.7);bins[bin].c.push(shade,shade,shade);}
 };
 const paths:{kind:string;points:readonly Point[];width:number}[]=[];
 const ribbon=(path:readonly Point[],width:number,phase:number,kind:string,solid?:readonly Point[])=>{
  paths.push({kind,points:path,width});let travelled=0;
  const total=path.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-path[i].x,p.y-path[i].y),0);
  for(let k=1;k<path.length;k++){
   const a=path[k-1],b=path[k],len=Math.hypot(b.x-a.x,b.y-a.y);if(len<1)continue;
   const nx=-(b.y-a.y)/len,ny=(b.x-a.x)/len,n=Math.ceil(len/10);
   const row=(s:number)=>{const p=mix(a,b,s),d=travelled+s*len,taper=kind.startsWith('plate-')?.05+.95*Math.max(0,Math.sin(Math.PI*d/total))**.25:1,w=width*taper*(.66+.23*Math.sin(d*.037+phase)+.10*Math.sin(d*.11+phase)),drift=solid?0:2.2*Math.sin(d*.051+phase)+Math.sin(d*.117+phase);
    return [-1,0,1].map(q=>new T.Vector3((p.x+nx*(q*w/2+drift))/U,solid?.903+.005*(1-q*q):.007+.012*(1-q*q)*(.7+.3*Math.sin(d*.053+phase)**2),(p.y+ny*(q*w/2+drift))/U));};
   for(let j=0;j<n;j++){const x=row(j/n),y=row((j+1)/n);for(let q=0;q<2;q++){emit(x[q],y[q],x[q+1],0,solid);emit(x[q+1],y[q],y[q+1],0,solid);}
    // A thin continuous, folded fibre sits in the membrane, not detached rods.
    const fibreWidth=Math.min(.035,x[0].distanceTo(x[2])*.25,y[0].distanceTo(y[2])*.25),x0=x[1].clone(),y0=y[1].clone(),x1=x0.clone().add(new T.Vector3(nx*fibreWidth,0,ny*fibreWidth)),y1=y0.clone().add(new T.Vector3(nx*fibreWidth,0,ny*fibreWidth));
    for(const v of [x0,y0,x1,y1])v.y+=solid?.001:.0015;emit(x0,y0,x1,1,solid);emit(x1,y0,y1,1,solid);
   }travelled+=len;
  }
 };
 const hull=t.boundary!,solids=[...t.obstacles.map(rectPoly),...(t.voids??[])];
 // Follow actual wall feet and cabinet seams; inward/outward is determined by
 // legal floor, so concave hulls and machine overlaps cannot make floating pads.
 for(const [index,poly]of [hull,...solids].entries())for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],len=Math.hypot(b.x-a.x,b.y-a.y);if(len<24)continue;
  const mid=mix(a,b,.5),nx=-(b.y-a.y)/len,ny=(b.x-a.x)/len;
  if(Math.min(...plan.breachFeatures.map(f=>Math.hypot(f.at.x-mid.x,f.at.y-mid.y)),Math.hypot(t.breaches[0].x-mid.x,t.breaches[0].y-mid.y))>270)continue;
  const sign=deck({x:mid.x+nx*18,y:mid.y+ny*18})?1:deck({x:mid.x-nx*18,y:mid.y-ny*18})?-1:0;if(!sign)continue;
  const offset=(p:Point,n:number)=>({x:p.x+nx*n*sign,y:p.y+ny*n*sign});
  ribbon([offset(mix(a,b,.025),18),offset(mix(a,b,.975),18)],22,index*.7+i,'wall-foot');
  if(index>0)ribbon([offset(mix(a,b,.08),-9),offset(mix(a,b,.92),-9)],9,i*.9,'solid-cap',poly);
 }
 // Breach features are real seams/tears. Their leads meet 128-unit plate joints.
 for(const [i,f]of plan.breachFeatures.entries()){
  const b=t.breaches[i],joint={x:Math.round(b.x/128)*128,y:Math.round(b.y/128)*128};
  ribbon([f.at,b,{x:joint.x,y:b.y},joint],18,i,'door-root');
  const end={x:joint.x,y:joint.y+(joint.y<arena.y?128:-128)};
  ribbon([joint,end],12,i+2,'plate-branch');
 }
 const joints=t.breaches.map(b=>({x:Math.round(b.x/128)*128,y:Math.round(b.y/128)*128})),trunkX=Math.floor((arena.x-200)/128)*128;
 // Workshop: a converted service feed. Swarm: opposite airway seams creeping
 // toward the crossing. Both are rooted in real 128-unit deck joints.
 const seams=id==='infested-workshop'?[
  [joints[0],{x:trunkX,y:joints[0].y},{x:trunkX,y:joints[2].y},{x:joints[3].x,y:joints[2].y},joints[3]],
  [joints[2],{x:trunkX,y:joints[2].y}],
  [{x:trunkX,y:joints[0].y+128},{x:trunkX+128,y:joints[0].y+128}],
 ]:[
  [joints[0],joints[2]], [joints[1],joints[3]],
  [{x:joints[0].x,y:joints[0].y+128},{x:joints[0].x+256,y:joints[0].y+128}],
  [{x:joints[3].x,y:joints[3].y-128},{x:joints[3].x-128,y:joints[3].y-128}],
 ];
 for(const [i,path]of seams.entries())ribbon(path,11,i+3,'plate-seam');
 // Folded root collars occupy real cabinet/airway faces, grouped at the
 // ingress mechanisms. Their raised area is architectural consumption rather
 // than free-floating floor growth. Near-face stems meet the cap/door seams.
 const folds:Array<{solid:number;edge:number;width:number;depth:number;source:string;bodyTriangles:number}>=[];
 for(const [si,poly]of solids.entries())for(let edge=0;edge<poly.length;edge++){
  const a=poly[edge],b=poly[(edge+1)%poly.length],length=Math.hypot(b.x-a.x,b.y-a.y);if(length<55)continue;
  const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=(b.x-a.x)/length,dy=(b.y-a.y)/length;
  const face=[-1,1].map(sign=>({x:mx-dy*sign*5,y:my+dx*sign*5,sign})).find(q=>deck(q));if(!face)continue;
  const nearest=Math.min(...plan.breachFeatures.map(f=>distanceToSegment(f.at,a,b)));
  const apertureDistance=Math.min(...(plan.apertures??[]).flatMap(m=>[distanceToSegment(m.from,a,b),distanceToSegment(m.to,a,b)]));
  if(Math.min(nearest,apertureDistance)>210)continue;
  const inwardX=dy*face.sign,inwardY=-dx*face.sign,count=Math.min(3,Math.max(1,Math.floor(length/125)));
  for(let rootIndex=0;rootIndex<count;rootIndex++){
   const along=length*(rootIndex+1)/(count+1),spread=Math.min(40,length/(count+1)*.40),depth=si<t.obstacles.length?3.2:.005;
   const rows=9,cols=6,bodyBefore=bins[0].p.length;
   const v=(row:number,col:number)=>{
    const rise=row/rows,q=col/cols*2-1,taper=.25+.75*Math.sin(Math.PI*rise)**.35,center=along+Math.sin(rise*5.4+si)*4.2;
    const offset=.005+depth*(1-Math.cos(q*Math.PI*3+rise*1.8))*.5;
    return new T.Vector3((a.x+dx*(center+q*spread*taper)+inwardX*offset)/U,.10+rise*.795,(a.y+dy*(center+q*spread*taper)+inwardY*offset)/U);
   };
   for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    const a0=v(row,col),a1=v(row,col+1),b0=v(row+1,col),b1=v(row+1,col+1);emit(a0,b0,a1,0,poly);emit(a1,b0,b1,0,poly);
    if(col===1||col===4){
     const f0=a0.clone(),f1=b0.clone(),g0=a0.clone().add(new T.Vector3(dx*.025,0,dy*.025)),g1=b0.clone().add(new T.Vector3(dx*.025,0,dy*.025));
     for(const p of[f0,f1,g0,g1]){p.x-=inwardX*.00005;p.z-=inwardY*.00005;}
     emit(f0,f1,g0,1,poly);emit(g0,f1,g1,1,poly);
    }
   }
   const bodyTriangles=(bins[0].p.length-bodyBefore)/9;if(bodyTriangles>0)folds.push({solid:si,edge,width:spread*2,depth,source:apertureDistance<=210?'partition-mouth':'breach',bodyTriangles});
  }
  if(apertureDistance<=210){
   const offset=(q:Point)=>({x:q.x+inwardX*2,y:q.y+inwardY*2});
   ribbon([offset(mix(a,b,.08)),offset(mix(a,b,.92))],3,si+edge,'aperture-root-cap',poly);
  }
 }
 root.userData.foldedRootCollars=folds;
 for(const [i,bin]of bins.entries())if(bin.p.length){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(bin.p,3));g.setAttribute('color',new T.Float32BufferAttribute(bin.c,3));g.computeVertexNormals();g.computeBoundingSphere();const mesh=new T.Mesh(g,i?vein:body);mesh.name=i?'seam-fibres':'seam-membranes';mesh.userData.bakedEnvironment=true;mesh.castShadow=false;mesh.receiveShadow=true;root.add(mesh);}
 else (i?vein:body).dispose();
 root.userData.paths=paths;root.userData.quietRadius=QUIET;root.userData.floorMaxHeight=.0205;root.userData.solidMaxHeight=.909;root.userData.triangles=bins.reduce((n,b)=>n+b.p.length/9,0);
 return root;
}
