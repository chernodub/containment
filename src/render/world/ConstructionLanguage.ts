import * as T from 'three';
import type { RoomTemplate } from '../../game/roguelike/types';
import type { ShipEnvironment } from '../ShipEnvironments';
import { deckMarkingSupported } from './DeckMarkings';
import { membraneGeometry, organicGeometry } from './OrganicGrowth';

type Writer = {
  box: (material:T.Material,x:number,y:number,z:number,w:number,h:number,d:number,angle?:number)=>void;
  add: (geometry:T.BufferGeometry,material:T.Material,x:number,y:number,z:number,sx?:number,sy?:number,sz?:number,angle?:number)=>void;
};
type Finishes = { steel:T.Material; dark:T.Material; paint:T.Material; resin:T.Material; vein:T.Material; signal:T.Material };
export const CONSTRUCTION_STANDARD_ROOMS = new Set(['residential-gallery','transmission-chamber','swarm-junction']);

/** Batched architectural storytelling. Raised additions are outboard or inside an existing solid. */
export function addConstructionLanguage(world:T.Group,root:T.Group,template:RoomTemplate,environment:ShipEnvironment,id:string,writer:Writer,m:Finishes):void {
  if (!CONSTRUCTION_STANDARD_ROOMS.has(id)) return;
  const {box,add}=writer,w=template.width/32,h=template.height/32;
  const boundary=template.boundary??[{x:0,y:0},{x:template.width,y:0},{x:template.width,y:template.height},{x:0,y:template.height}];
  const solid=(x:number,z:number)=>template.obstacles.some(r=>x>=r.x/32&&x<=(r.x+r.width)/32&&z>=r.y/32&&z<=(r.y+r.height)/32);
  const flat=(material:T.Material,x:number,z:number,width:number,depth:number,angle=0)=>{
    const c=Math.cos(angle),s=Math.sin(angle);
    if(![[-1,-1],[-1,1],[1,-1],[1,1],[0,0]].every(([ix,iz])=>deckMarkingSupported(template,x+ix*width/2*c-iz*depth/2*s,z+ix*width/2*s+iz*depth/2*c)))return;
    box(material,x,.021,z,width,.008,depth,angle);
  };
  // An off-centre utility spine, with a closed edge and broken covers, rather than a whole-room tile grid.
  const spine=environment==='habitation'?1.9:environment==='communications'?w*.37:w*.29;
  for(let z=.8;z<h-.8;z+=.55){
    flat(m.dark,spine,z,environment==='communications'?.42:.19,.53);
    if(environment==='communications')for(const side of [-1,1])flat(m.steel,spine+side*.24,z,.035,.53);
    if(environment==='habitation'&&Math.floor(z*2)%5!==0)flat(m.paint,spine+.16,z,.06,.43);
  }
  // Each hull edge gets its own construction rhythm; all depth goes outward from navigation.
  let area=0;for(let i=0;i<boundary.length;i++){const a=boundary[i],b=boundary[(i+1)%boundary.length];area+=a.x*b.y-b.x*a.y;}
  const winding=area>0?1:-1;
  for(let edge=0;edge<boundary.length;edge++){
    const a=boundary[edge],b=boundary[(edge+1)%boundary.length],dx=(b.x-a.x)/32,dz=(b.y-a.y)/32,length=Math.hypot(dx,dz);
    const tx=dx/length,tz=dz/length,nx=tz*winding,nz=-tx*winding,angle=-Math.atan2(dz,dx);
    const pitch=environment==='habitation'?5.1:environment==='communications'?2.35:6.7;
    const rear=(a.y+b.y)/64<h*.2,height=rear?2.25:environment==='habitation'?1.05:environment==='communications'?1.18:1.3;
    const wall=(mat:T.Material,t:number,y:number,span:number,thick:number,depth:number,out=.22)=>box(mat,a.x/32+tx*t+nx*out,y,a.y/32+tz*t+nz*out,span,thick,depth,angle);
    for(let t=.4;t<length-.3;t+=pitch){
      const span=Math.min(pitch-.24,length-t-.12);
      if(environment==='habitation'){
        wall(m.paint,t+span/2,height/2,span,height,.10,.30);
        wall(m.dark,t+span/2,.18,span,.24,.12,.20);
        wall(m.steel,t+.08,height/2,.10,height,.19,.18);
        if(rear){wall(m.dark,t+span*.56,1.15,span*.56,.68,.05,.23);wall(m.paint,t+span*.56,1.15,span*.47,.52,.05,.195);}
      }else if(environment==='communications'){
        wall(m.dark,t+span/2,height/2,span,height,.18,.29);
        wall(m.steel,t+.12,height/2,.16,height,.23,.18);
        for(let rail=0;rail<3;rail++)wall(rail===1?m.paint:m.steel,t+span/2,.19+rail*.13,span,.055,.12,.16);
        if(rear)for(let slat=0;slat<4;slat++)wall(m.paint,t+span*.5,.94+slat*.22,span*.67,.045,.06,.17);
      }else{
        wall(m.dark,t+span/2,height/2,span,height,.18,.29);
        // Large irregularly slumped masses consume seams and fixtures, rather than a cord per rib.
        const x=a.x/32+tx*(t+span*.43)+nx*.45,z=a.y/32+tz*(t+span*.43)+nz*.45;
        const g=organicGeometry(edge%3).clone();g.scale(Math.min(1.8,span*.42),height*.55,.20);g.rotateY(angle);g.translate(x,height*.52,z);
        add(g,m.resin,0,0,0);
        wall(m.vein,t+span*.64,height*.68,span*.19,.055,.04,.055);
      }
    }
  }
  // One supported narrative cluster at the nearest existing reservation. No freestanding lane clutter.
  world.updateWorldMatrix(true,true);
  const ray=new T.Raycaster(),sx=template.spawn.x/32,sz=template.spawn.y/32;
  const reservations=[...template.obstacles].filter(r=>Math.min(r.width,r.height)>32).sort((a,b)=>Math.hypot(a.x/32-sx,a.y/32-sz)-Math.hypot(b.x/32-sx,b.y/32-sz));
  const r=reservations[0];
  if(r){
    const x=(r.x+r.width*.5)/32,z=(r.y+r.height*.5)/32,rw=r.width/32,rd=r.height/32;
    ray.set(new T.Vector3(x,20,z),new T.Vector3(0,-1,0));const roof=ray.intersectObject(world,true).find(hit=>hit.point.y>.15)?.point.y??.8;
    const size=Math.min(.72,rw*.20,rd*.20),cx=x-rw*.14,cz=z+rd*.16;
    if(environment==='habitation'){
      // Arrival luggage has been opened: lid, folded cloth, two fallen slates and a small keepsake.
      box(m.dark,cx,roof+.08,cz,size*2,.16,size*1.3,.17);
      box(m.paint,cx,roof+.18,cz-size*.54,size*2,.06,size*.28,.17);
      box(m.paint,cx-size*.24,roof+.19,cz+size*.08,size*1.1,.055,size*.85,-.14);
      box(m.steel,cx+size*.66,roof+.05,cz+size*.65,size*.48,.035,size*.72,.42);
      box(m.signal,cx+size*.66,roof+.071,cz+size*.65,size*.29,.006,size*.46,.42);
      flat(m.dark,x-rw*.15,z+rd*.5+.23,.85,.12,.28);
    }else if(environment==='communications'){
      // A removed access cassette exposes the uplink bus: human repair interrupted by the warning.
      box(m.dark,cx,roof+.04,cz,size*2,.08,size*1.5);
      for(let rail=0;rail<4;rail++)box(rail===1?m.signal:m.steel,cx-size*.7+rail*size*.46,roof+.09,cz,.045,.025,size*1.3);
      box(m.paint,cx+size*.67,roof+.14,cz+size*.28,size,.08,size*.75,.36);
      box(m.dark,cx-size*.4,roof+.14,cz-size*.2,size*.4,.07,size*.58,-.24);
    }
    root.userData.narrativeVignette={id:environment==='habitation'?'arrival-abandoned':environment==='communications'?'uplink-repair-interrupted':'nursery-consumes-transit',footprint:{...r}};
  }
  if(environment==='infested'){
    let consumed=0;
    for(const [index,r]of template.obstacles.entries()){
      if(index>3||Math.min(r.width,r.height)<32)continue;
      const x=(r.x+r.width*.5)/32,z=(r.y+r.height*.5)/32,rw=r.width/32,rd=r.height/32;
      ray.set(new T.Vector3(x,20,z),new T.Vector3(0,-1,0));const roof=ray.intersectObject(world,true).find(hit=>hit.point.y>.15)?.point.y??1;
      const px=x-rw*.12,pz=z+rd*.1;
      const constrain=(g:T.BufferGeometry)=>{g.computeBoundingBox();const b=g.boundingBox!,width=(r.width/32-.05),depth=(r.height/32-.05),scale=Math.min(1,width/(b.max.x-b.min.x),depth/(b.max.z-b.min.z));const cx=(b.min.x+b.max.x)/2,cz=(b.min.z+b.max.z)/2;const targetX=Math.max(r.x/32+.025+(b.max.x-b.min.x)*scale/2,Math.min((r.x+r.width)/32-.025-(b.max.x-b.min.x)*scale/2,cx)),targetZ=Math.max(r.y/32+.025+(b.max.z-b.min.z)*scale/2,Math.min((r.y+r.height)/32-.025-(b.max.z-b.min.z)*scale/2,cz));const p=g.getAttribute('position');for(let k=0;k<p.count;k++)p.setXYZ(k,(p.getX(k)-cx)*scale+targetX,p.getY(k),(p.getZ(k)-cz)*scale+targetZ);g.computeVertexNormals();return g;};
      const mass=organicGeometry(index).clone();mass.scale(rw*.30,roof*.75,rd*.30);mass.rotateY(.15+index*.7);mass.translate(px,roof*.8,pz);add(constrain(mass),m.resin,0,0,0);
      for(let branch=0;branch<2;branch++){
        const endX=x+(branch?1:-1)*rw*.43,endZ=z+(branch?-.2:.2)*rd;
        if(!solid(endX,endZ))continue;
        add(constrain(membraneGeometry([new T.Vector3(px,roof+.10,pz),new T.Vector3(x,roof+.22,z),new T.Vector3(endX,roof*.65,endZ),new T.Vector3(endX,.04,endZ)],Math.min(rw,rd)*.22,.13,undefined,14)),m.resin,0,0,0);
      }
      // Broad flat damage/tissue tongues can cross panel seams without creating collision.
      for(let t=0;t<6;t++)flat(m.resin,x-rw*.45-.25-t*.2,z+rd*.18+t*.15,.46,.43,.4);
      consumed++;
    }
    root.userData.consumedConstruction=consumed;
  }
  root.userData.constructionLanguage=environment;
}
