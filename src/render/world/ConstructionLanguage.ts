import * as T from 'three';
import type { Rect, RoomTemplate } from '../../game/roguelike/types';
import { ROOM_STORY_ROUTE, storyRoomFor } from '../../game/roguelike/storyRooms';
import type { ShipEnvironment } from '../ShipEnvironments';
import { deckMarkingSupported } from './DeckMarkings';
import { industrialBoxGeometry } from './IndustrialFormKit';
import { membraneGeometry } from './OrganicGrowth';

type Writer = {
  box: (material:T.Material,x:number,y:number,z:number,w:number,h:number,d:number,angle?:number)=>void;
  add: (geometry:T.BufferGeometry,material:T.Material,x:number,y:number,z:number,sx?:number,sy?:number,sz?:number,angle?:number)=>void;
};
type Finishes = { steel:T.Material; dark:T.Material; paint:T.Material; resin:T.Material; vein:T.Material; signal:T.Material };
type Profile = { pitch:number; height:number; spine:number; width:number; idea:string };

export const CONSTRUCTION_STANDARD_ROOMS = new Set<string>([...ROOM_STORY_ROUTE.map(room=>room.templateId),'reactor-vault']);
const profiles:Record<ShipEnvironment,Profile> = {
  cryogenics:{pitch:3.15,height:1.12,spine:.18,width:.32,idea:'sealed pressure cassettes / pod supply gutters'},
  habitation:{pitch:5.1,height:1.05,spine:0,width:.19,idea:'domestic strip deck / deep cabin thresholds'},
  security:{pitch:3.75,height:1.24,spine:.23,width:.38,idea:'armored bulkhead bays / crosswise inspection stops'},
  cargo:{pitch:6.2,height:1.35,spine:.24,width:.24,idea:'freight rail plates / paired load-bearing ribs'},
  communications:{pitch:2.35,height:1.18,spine:.37,width:.42,idea:'access cassettes / stacked cable buses'},
  engineering:{pitch:4.45,height:1.28,spine:.32,width:.56,idea:'service grate channels / broken overhead runs'},
  maintenance:{pitch:2.8,height:1.02,spine:.21,width:.62,idea:'drain covers / horizontal coolant headers'},
  infested:{pitch:6.7,height:1.30,spine:.29,width:.19,idea:'consumed transit plates / slumped living bulkheads'},
  containment:{pitch:4.8,height:1.22,spine:.35,width:.18,idea:'sealed shield sectors / clinical gasket joints'},
  reactor:{pitch:7.4,height:1.38,spine:.27,width:.44,idea:'segmented heat deck / massive thermal buttresses'},
};
const narratives:Record<string,string> = {
  'awakening-bay':'abandoned-emergency-release-tools',
  'passenger-vault':'occupied-life-support-service-index',
  'residential-gallery':'arrival-abandoned',
  'communal-atrium':'garden-arrival-trays-left-unpacked',
  'crew-checkpoint':'spent-defense-magazines-and-brace',
  armory:'opened-issue-case-and-empty-equipment-sockets',
  'freight-hold':'colony-cargo-manifest-and-dragged-lid',
  'breached-loading-bay':'sealed-scar-swallowing-repair-panel',
  'relay-racks':'relay-bus-repair-with-removed-cassette',
  'transmission-chamber':'uplink-repair-interrupted',
  'diagnostic-gallery':'independent-recorder-and-removed-service-cover',
  'safety-interlock-station':'locked-original-safety-recorder',
  'coolant-plant':'cut-pressure-union-and-displaced-cover',
  'service-shaft-landing':'disconnected-local-power-bridge',
  'infested-workshop':'tool-manifold-engulfed-by-living-machine',
  'swarm-junction':'nursery-consumes-transit',
  'shielding-gate':'abandoned-shield-calibration-jig',
  'containment-annulus':'unarmed-mechanical-authorization-seals',
  'manual-control-chamber':'last-manual-key-cover-and-disconnected-service-tools',
  'overload-floor':'burnt-terminal-sequence-and-spent-service-cable',
  'reactor-vault':'crushed-machine-remnants-in-queen-foundation',
};

function inside(x:number,z:number,polygon:readonly {x:number;y:number}[]):boolean {
  let value=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j];
    if((a.y>z)!==(b.y>z)&&x<(b.x-a.x)*(z-a.y)/(b.y-a.y)+a.x)value=!value;
  }
  return value;
}

/** Batched architectural storytelling. Raised additions are outboard or inside an existing solid. */
export function addConstructionLanguage(
  world:T.Group,root:T.Group,template:RoomTemplate,environment:ShipEnvironment,id:string,
  writer:Writer,m:Finishes,supportReservations:readonly Rect[]=template.obstacles,
):void {
  if(!CONSTRUCTION_STANDARD_ROOMS.has(id))return;
  const w=template.width/32,h=template.height/32,profile=profiles[environment];
  const boundary=template.boundary??[{x:0,y:0},{x:template.width,y:0},{x:template.width,y:template.height},{x:0,y:template.height}];
  const solid=(x:number,z:number)=>template.obstacles.some(r=>x>=r.x/32-.0001&&x<=(r.x+r.width)/32+.0001&&z>=r.y/32-.0001&&z<=(r.y+r.height)/32+.0001)
    ||(template.voids??[]).some(polygon=>inside(x*32,z*32,polygon));
  const supported=(x:number,z:number)=>!inside(x*32,z*32,boundary)||solid(x,z);
  let acceptedParts=0,triangleCount=0;
  const add:Writer['add']=(geometry,material,x,y,z,sx=1,sy=1,sz=1,angle=0)=>{
    geometry.scale(sx,sy,sz);geometry.rotateY(angle);geometry.translate(x,y,z);
    const p=geometry.getAttribute('position');
    for(let i=0;i<p.count;i++)if(p.getY(i)>.031&&!supported(p.getX(i),p.getZ(i))){geometry.dispose();return;}
    const indices=geometry.index;
    for(let i=0;i<(indices?.count??p.count);i+=3){
      const ia=indices?.getX(i)??i,ib=indices?.getX(i+1)??i+1,ic=indices?.getX(i+2)??i+2;
      if((p.getY(ia)+p.getY(ib)+p.getY(ic))/3>.031&&!supported((p.getX(ia)+p.getX(ib)+p.getX(ic))/3,(p.getZ(ia)+p.getZ(ib)+p.getZ(ic))/3)){geometry.dispose();return;}
    }
    acceptedParts++;triangleCount+=(geometry.index?.count??p.count)/3;writer.add(geometry,material,0,0,0);
  };
  const box:Writer['box']=(material,x,y,z,width,height,depth,angle=0)=>{
    // Test both footprint corners and edge middles: no long diagonal bridges over circulation.
    const c=Math.cos(angle),s=Math.sin(angle);
    if(y+height*.5>.031)for(const [ix,iz]of [[-1,-1],[-1,1],[1,-1],[1,1],[0,-1],[0,1],[-1,0],[1,0],[0,0]]){
      if(!supported(x+ix*width*.5*c+iz*depth*.5*s,z-ix*width*.5*s+iz*depth*.5*c))return;
    }
    acceptedParts++;triangleCount+=Math.min(width,height,depth)>.045?44:12;writer.box(material,x,y,z,width,height,depth,angle);
  };
  const flat=(material:T.Material,x:number,z:number,width:number,depth:number,angle=0)=>{
    const c=Math.cos(angle),s=Math.sin(angle);
    for(const ix of [-1,-.5,0,.5,1])for(const iz of [-1,-.5,0,.5,1])if(!deckMarkingSupported(template,x+ix*width/2*c+iz*depth/2*s,z-ix*width/2*s+iz*depth/2*c))return;
    box(material,x,.021,z,width,.008,depth,angle);
  };
  const spine=environment==='habitation'?1.9:w*profile.spine;
  for(let z=.8;z<h-.8;z+=.55){
    flat(m.dark,spine,z,profile.width,.53);
    if(environment==='communications'||environment==='maintenance')for(const side of [-1,1])flat(m.steel,spine+side*(profile.width/2+.03),z,.035,.53);
    if(environment==='habitation'&&Math.floor(z*2)%5!==0)flat(m.paint,spine+.16,z,.06,.43);
    if(environment==='cargo'&&Math.floor(z*2)%7===0)flat(m.steel,spine+.32,z,.06,.48);
    if(environment==='engineering'&&Math.floor(z*2)%3===0)flat(m.paint,spine,z,profile.width*.8,.075);
  }
  // Existing portals receive flush construction thresholds, never a new collision frame.
  const ex=template.exit.x/32,ez=template.exit.y/32;
  for(const offset of [-.32,0,.32])flat(offset===0?m.dark:m.steel,ex,ez+offset,1.75,.10);
  for(const breach of template.breaches){
    const x=breach.x/32,z=breach.y/32;
    for(const side of [-1,1])flat(m.steel,x+side*.74,z,.07,1.28);
  }
  let area=0;
  for(let i=0;i<boundary.length;i++){const a=boundary[i],b=boundary[(i+1)%boundary.length];area+=a.x*b.y-b.x*a.y;}
  const winding=area>0?1:-1;
  for(let edge=0;edge<boundary.length;edge++){
    const a=boundary[edge],b=boundary[(edge+1)%boundary.length],dx=(b.x-a.x)/32,dz=(b.y-a.y)/32,length=Math.hypot(dx,dz);
    if(length<.7)continue;
    const tx=dx/length,tz=dz/length,nx=tz*winding,nz=-tx*winding,angle=-Math.atan2(dz,dx);
    const rear=(a.y+b.y)/64<h*.2,height=rear?environment==='cargo'?3.0:2.25:profile.height;
    const wall=(mat:T.Material,t:number,y:number,span:number,thick:number,depth:number,out=.22)=>{
      // Thin trim is structural stock; only the dominant panel receives a bevel.
      const g=span>3&&thick>1&&depth>.10?industrialBoxGeometry(span,thick,depth):new T.BoxGeometry(span,thick,depth);
      add(g,mat,a.x/32+tx*t+nx*out,y,a.y/32+tz*t+nz*out,1,1,1,angle);
    };
    for(let t=.4;t<length-.3;t+=profile.pitch){
      const span=Math.min(profile.pitch-.24,length-t-.12);
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
      }else if(environment==='infested'){
        wall(m.dark,t+span/2,height/2,span,height,.18,.29);
        // Consumption is authored below as connected machine-to-hull webs.
      }else if(environment==='cryogenics'){
        wall(m.paint,t+span/2,height*.52,span*.94,height*.90,.14,.30);
        for(const end of [.12,span-.10])wall(m.steel,t+end,height*.5,.12,height,.23,.20);
        wall(m.dark,t+span/2,height*.24,span*.80,.075,.04,.19);
        if(rear)wall(m.dark,t+span/2,1.55,span*.62,.12,.06,.20);
      }else if(environment==='security'){
        wall(m.steel,t+span/2,height/2,span,height,.22,.34);
        wall(m.dark,t+span/2,height*.54,span*.73,height*.64,.06,.20);
        for(const end of [.16,span-.16])wall(m.paint,t+end,height*.5,.22,height*.94,.17,.16);
        wall(m.paint,t+span/2,.21,span*.75,.07,.13,.16);
      }else if(environment==='cargo'){
        wall(m.dark,t+span/2,height/2,span,height,.16,.34);
        for(const end of [.16,.51])wall(m.steel,t+end,height*.5,.18,height,.24,.20);
        for(const y of [.19,height-.12])wall(m.paint,t+span/2,y,span,.12,.24,.19);
      }else if(environment==='engineering'){
        wall(m.dark,t+span/2,height/2,span,height,.20,.35);
        wall(m.steel,t+.15,height/2,.24,height,.27,.20);
        for(const y of [.24,.48,height-.16])wall(m.steel,t+span*.54,y,span*.86,.10,.18,.18);
        if(rear)for(let slot=0;slot<3;slot++)wall(m.paint,t+span*.54,1.04+slot*.18,span*.64,.075,.08,.17);
      }else if(environment==='maintenance'){
        wall(m.paint,t+span/2,height/2,span,height*.88,.12,.32);
        for(const y of [.20,.39])wall(m.steel,t+span/2,y,span,.13,.22,.20);
        wall(m.dark,t+span*.23,height*.65,.14,height*.45,.05,.18);
      }else if(environment==='containment'){
        wall(m.paint,t+span/2,height*.5,span,height,.12,.34);
        wall(m.dark,t+.13,height*.5,.065,height,.04,.19);
        for(const y of [.19,height-.13])wall(m.steel,t+span*.5,y,span*.92,.055,.09,.18);
        if(rear)wall(m.dark,t+span*.53,1.25,span*.70,.90,.04,.25);
      }else{
        wall(m.dark,t+span/2,height/2,span,height,.22,.38);
        for(const end of [.18,.58])wall(m.steel,t+end,height/2,.24,height,.30,.20);
        wall(m.paint,t+span/2,.23,span*.87,.16,.17,.23);
        if(rear)wall(m.steel,t+span*.53,height-.13,span*.90,.19,.24,.21);
      }
    }
    // A single displaced service panel interrupts the rhythm, below the retained hull silhouette.
    if(edge===0&&length>5){wall(m.dark,length*.71,.28,1.45,.24,.34,.62);wall(m.paint,length*.71,.42,1.25,.055,.29,.61);}
  }
  world.updateWorldMatrix(true,true);
  const ray=new T.Raycaster(),down=new T.Vector3(0,-1,0),sx=template.spawn.x/32,sz=template.spawn.y/32;
  const reservations=[...supportReservations].filter(r=>Math.min(r.width,r.height)>26);
  // The retained cryo GLBs intentionally have no loose-equipment reservations.
  // A conservative inset within their sealed solid polygons may still support
  // one authored service vignette after an actual roof hit, without new scatter.
  if(!reservations.length)for(const polygon of template.voids??[]){
    const left=Math.min(...polygon.map(p=>p.x)),right=Math.max(...polygon.map(p=>p.x)),near=Math.min(...polygon.map(p=>p.y)),far=Math.max(...polygon.map(p=>p.y));
    const width=Math.min(96,(right-left)*.45),height=Math.min(80,(far-near)*.45);
    if(Math.min(width,height)<26)continue;
    let placed=false;
    for(const fx of [.5,.3,.7])for(const fz of [.5,.3,.7]){
      if(placed)continue;
      const x=left+(right-left)*fx,y=near+(far-near)*fz;
      if(![-1,-.5,0,.5,1].every(ix=>[-1,-.5,0,.5,1].every(iz=>inside(x+ix*width*.5,y+iz*height*.5,polygon))))continue;
      reservations.push({x:x-width*.5,y:y-height*.5,width,height});placed=true;
    }
  }
  reservations.sort((a,b)=>Math.hypot(a.x/32-sx,a.y/32-sz)-Math.hypot(b.x/32-sx,b.y/32-sz));
  let selected:{r:Rect;roof:number}|undefined;
  for(const r of reservations){
    let roof=0;
    for(const fx of [.35,.5,.65])for(const fz of [.35,.5,.65]){
      ray.set(new T.Vector3((r.x+r.width*fx)/32,20,(r.y+r.height*fz)/32),down);
      const hit=ray.intersectObject(world,true).find(value=>value.point.y>.15&&value.point.y<4);
      if(hit)roof=Math.max(roof,hit.point.y);
    }
    if(roof){selected={r,roof};break;}
  }
  const beforeNarrative=acceptedParts;
  if(selected){
    const {r,roof}=selected,x=(r.x+r.width*.5)/32,z=(r.y+r.height*.5)/32,rw=r.width/32,rd=r.height/32;
    const size=Math.min(.72,rw*.20,rd*.20),cx=x-rw*.14,cz=z+rd*.16;
    // Every story form uses the existing matte steel/paint/signal bins.
    if(environment==='habitation'){
      box(m.dark,cx,roof+.08,cz,size*2,.16,size*1.3,.17);
      box(m.paint,cx,roof+.18,cz-size*.54,size*2,.06,size*.28,.17);
      box(m.paint,cx-size*.24,roof+.19,cz+size*.08,size*1.1,.055,size*.85,-.14);
      box(m.steel,cx+size*.66,roof+.05,cz+size*.65,size*.48,.035,size*.72,.42);
      box(m.signal,cx+size*.66,roof+.071,cz+size*.65,size*.29,.006,size*.46,.42);
      if(id==='communal-atrium')for(let tray=0;tray<3;tray++){box(m.dark,cx-size*.4+tray*size*.4,roof+.22,cz-size*.15,size*.30,.08,size*.38);box(m.paint,cx-size*.4+tray*size*.4,roof+.27,cz-size*.15,size*.22,.035,size*.29);}
      flat(m.dark,x-rw*.15,z+rd*.5+.23,.85,.12,.28);
    }else if(environment==='communications'){
      box(m.dark,cx,roof+.04,cz,size*2,.08,size*1.5);
      for(let rail=0;rail<4;rail++)box(rail===1?m.signal:m.steel,cx-size*.7+rail*size*.46,roof+.09,cz,.045,.025,size*1.3);
      box(m.paint,cx+size*.67,roof+.14,cz+size*.28,size,.08,size*.75,.36);
      box(m.dark,cx-size*.4,roof+.14,cz-size*.2,size*.4,.07,size*.58,-.24);
    }else if(environment==='cryogenics'){
      box(m.dark,cx,roof+.07,cz,size*2,.14,size*1.4,.08);
      box(m.paint,cx+size*.12,roof+.16,cz,size*1.50,.055,size*.9,.08);
      if(id==='awakening-bay'){
        box(m.steel,cx-size*.55,roof+.21,cz,size*.16,.05,size*.84,.36);
        box(m.dark,cx+size*.52,roof+.22,cz-size*.18,size*.34,.09,size*.34,-.20);
      }else for(let pod=0;pod<5;pod++)box(pod===3?m.dark:m.signal,cx-size*.58+pod*size*.29,roof+.20,cz,size*.13,.025,size*.23);
    }else if(environment==='security'){
      box(m.dark,cx,roof+.08,cz,size*2,.16,size*1.5,.10);
      for(let socket=0;socket<3;socket++){box(m.paint,cx-size*.59+socket*size*.60,roof+.18,cz,size*.43,.06,size*1.12,.10);box(m.dark,cx-size*.59+socket*size*.60,roof+.22,cz,size*.26,.035,size*.82,.10);}
      if(id==='crew-checkpoint')for(let mag=0;mag<3;mag++)box(m.steel,cx+size*.65,roof+.24+mag*.025,cz+size*.35, size*.25,.045,size*.52,.34+mag*.13);
      else box(m.steel,cx-size*.19,roof+.26,cz-size*.15,size*.15,.075,size*.86,.10);
    }else if(environment==='cargo'){
      box(m.dark,cx,roof+.08,cz,size*2,.16,size*1.60,.13);
      box(m.paint,cx-size*.15,roof+.19,cz-size*.08,size*1.4,.06,size*.94,-.16);
      for(const side of [-1,1])box(m.steel,cx+side*size*.65,roof+.22,cz,size*.10,.045,size*1.34,.13);
      box(m.paint,cx+size*.53,roof+.24,cz+size*.43,size*.46,.04,size*.33,.48);
      if(id==='freight-hold')box(m.dark,cx+size*.53,roof+.267,cz+size*.43,size*.32,.008,size*.19,.48);
    }else if(environment==='engineering'){
      box(m.dark,cx,roof+.06,cz,size*1.90,.12,size*1.4,.08);
      box(m.steel,cx-size*.12,roof+.16,cz,size*1.30,.10,size*.88,.08);
      box(m.paint,cx+size*.65,roof+.10,cz+size*.28,size*.72,.045,size*.94,.42);
      for(let lock=0;lock<(id==='safety-interlock-station'?3:1);lock++)box(m.dark,cx-size*.42+lock*size*.36,roof+.225,cz,size*.20,.06,size*.28);
      box(m.signal,cx+size*.38,roof+.22,cz-size*.20,size*.10,.015,size*.13);
    }else if(environment==='maintenance'){
      box(m.dark,cx,roof+.045,cz,size*2,.09,size*1.4,-.10);
      for(const side of [-1,1]){box(m.steel,cx+side*size*.50,roof+.18,cz,size*.34,.24,size*.75,-.10);box(m.dark,cx+side*size*.50,roof+.315,cz,size*.20,.035,size*.46,-.10);}
      box(m.paint,cx+size*.64,roof+.08,cz+size*.50,size*.80,.06,size*.60,.31);
      if(id==='service-shaft-landing')box(m.steel,cx,roof+.19,cz-size*.25,size*.72,.08,size*.12,.26);
      else box(m.signal,cx,roof+.11,cz+size*.26,size*.22,.02,size*.21);
    }else if(environment==='containment'){
      box(m.dark,cx,roof+.04,cz,size*2,.08,size*1.6);
      for(const side of [-1,1])box(m.steel,cx+side*size*.72,roof+.16,cz,size*.12,.24,size*1.35);
      for(let lock=0;lock<3;lock++)box(m.paint,cx-size*.48+lock*size*.48,roof+.13,cz,size*.31,.18,size*.7);
      if(id==='shielding-gate')box(m.signal,cx,roof+.24,cz-size*.24,size*.12,.02,size*.13);
    }else if(environment==='reactor'){
      box(m.dark,cx,roof+.06,cz,size*2,.12,size*1.6,.12);
      box(m.steel,cx-size*.35,roof+.18,cz,size*.72,.15,size*.84,-.14);
      box(m.paint,cx+size*.45,roof+.11,cz+size*.30,size*.74,.07,size*.56,.42);
      if(id==='manual-control-chamber')box(m.dark,cx-size*.31,roof+.28,cz,size*.24,.04,size*.38,-.14);
      else for(let cable=0;cable<3;cable++)box(m.dark,cx-size*.4+cable*size*.37,roof+.19,cz+size*.45,size*.10,.045,size*.49,.30);
    }else{
      box(m.dark,cx,roof+.08,cz,size*1.8,.16,size*1.25,.17);
      box(m.paint,cx-size*.34,roof+.18,cz-size*.25,size*.70,.075,size*.52,-.24);
    }
    root.userData.narrativeVignette={id:narratives[id],footprint:{...r},source:'storyRooms.ts',objective:storyRoomFor(id)?.objective??'The Queen occupies the reactor.'};
  }else{
    // Rooms with no supported equipment use an outboard abandoned service cache.
    const a=boundary[0],b=boundary[1],dx=(b.x-a.x)/32,dz=(b.y-a.y)/32,length=Math.hypot(dx,dz),tx=dx/length,tz=dz/length,nx=tz*winding,nz=-tx*winding;
    const x=(a.x+b.x)/64+nx*.65,z=(a.y+b.y)/64+nz*.65,angle=-Math.atan2(dz,dx);
    box(m.dark,x,.18,z,Math.min(1.8,length*.35),.36,.5,angle);box(m.paint,x+tx*.12,.39,z+tz*.12,Math.min(1.5,length*.30),.06,.42,angle);
    root.userData.narrativeVignette={id:narratives[id],source:'storyRooms.ts',outboard:true,objective:storyRoomFor(id)?.objective??'The Queen occupies the reactor.'};
  }
  root.userData.narrativeVignette.parts=acceptedParts-beforeNarrative;
  const consumed=environment==='infested'||id==='breached-loading-bay'||id==='reactor-vault';
  if(consumed){
    type ConsumptionFixture={x:number;y:number;z:number;color:number;nativeColor:true;poolStyle:3;growthSource:true;poolWidth:number;poolDepth:number;poolAngle:number;gain:number};
    const fixtures:ConsumptionFixture[]=[],forms:Array<{kind:string;source:number[];footprint?:Rect}>=[];
    const emit=(x:number,y:number,z:number,index:number,kind:string,footprint?:Rect)=>{
      if(fixtures.length>=4)return;
      fixtures.push({x,y,z,color:index%2?0xc47fae:0xa6d878,nativeColor:true,poolStyle:3,growthSource:true,poolWidth:2.5,poolDepth:6.4,poolAngle:Math.atan2(w/2-x,h/2-z),gain:.72});
      forms.push({kind,source:[x,y,z],footprint});
    };
    // A connected skin is fitted affinely to a solid; no sphere, boulder or
    // independently scattered nodule is added by this construction layer.
    type SkinFit={scale:number;cx:number;cz:number;tx:number;tz:number};
    const fitSkin=(g:T.BufferGeometry,r:Rect,onFit?:(fit:SkinFit)=>void)=>{
      g.computeBoundingBox();const b=g.boundingBox!,rw=r.width/32-.06,rd=r.height/32-.06;
      const scale=Math.min(1,rw/(b.max.x-b.min.x),rd/(b.max.z-b.min.z)),cx=(b.min.x+b.max.x)/2,cz=(b.min.z+b.max.z)/2;
      const tx=Math.max(r.x/32+.03+(b.max.x-b.min.x)*scale/2,Math.min((r.x+r.width)/32-.03-(b.max.x-b.min.x)*scale/2,cx));
      const tz=Math.max(r.y/32+.03+(b.max.z-b.min.z)*scale/2,Math.min((r.y+r.height)/32-.03-(b.max.z-b.min.z)*scale/2,cz));
      const p=g.getAttribute('position');for(let i=0;i<p.count;i++)p.setXYZ(i,(p.getX(i)-cx)*scale+tx,p.getY(i),(p.getZ(i)-cz)*scale+tz);
      onFit?.({scale,cx,cz,tx,tz});g.computeVertexNormals();return g;
    };
    const tissueRibbon=(points:T.Vector3[],width:number,thickness:number,steps:number,phase:number,normalHint=new T.Vector3(0,1,0))=>{
      const curve=new T.CatmullRomCurve3(points,false,'centripetal'),side=new T.Vector3(),normal=new T.Vector3(),tangent=new T.Vector3();
      const positions:number[]=[],uvs:number[]=[],indices:number[]=[],sides=8;
      const basis=(t:number)=>{curve.getTangent(t,tangent).normalize();side.crossVectors(normalHint,tangent);if(side.lengthSq()<.001)side.set(1,0,0);side.normalize();normal.crossVectors(tangent,side).normalize();};
      const flare=(t:number)=>.20+.80*Math.pow(Math.sin(t*Math.PI),.64);
      const crown=(t:number)=>thickness*flare(t)*(.82+.18*Math.sin(t*5.1+phase));
      for(let row=0;row<=steps;row++){
        const t=row/steps,center=curve.getPoint(t);basis(t);
        const left=.94+.25*Math.sin(t*9.2+phase)+.12*Math.sin(t*18.1+.4);
        const right=.80+.22*Math.sin(t*6.3+phase+1.7)+.13*Math.sin(t*13.2+1.2);
        for(let col=0;col<sides;col++){
          const angle=col/sides*Math.PI*2,c=Math.cos(angle),q=center.clone().addScaledVector(side,c*width*flare(t)*(c<0?left:right)).addScaledVector(normal,Math.sin(angle)*crown(t));
          positions.push(q.x,q.y,q.z);uvs.push(col/sides,t);
          if(row<steps){const a=row*sides+col,b=row*sides+(col+1)%sides;indices.push(a,a+sides,b,b,a+sides,b+sides);}
        }
      }
      const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
      return {geometry,crest:(t:number)=>{const p=curve.getPoint(t);basis(t);return p.addScaledVector(normal,crown(t)+.018);}};
    };
    const flatSkin=(points:T.Vector3[],width:number,material:T.Material)=>{
      const g=membraneGeometry(points,width,.002,undefined,6),p=g.getAttribute('position');
      // Existing floor-support guarantees remain stricter than navigation:
      // neither a void nor an equipment reservation may carry a floor web.
      for(let i=0;i<p.count;i++)if(!deckMarkingSupported(template,p.getX(i),p.getZ(i))){g.dispose();return false;}
      const indices=g.index!;for(let i=0;i<indices.count;i+=3){const a=indices.getX(i),b=indices.getX(i+1),c=indices.getX(i+2);if(!deckMarkingSupported(template,(p.getX(a)+p.getX(b)+p.getX(c))/3,(p.getZ(a)+p.getZ(b)+p.getZ(c))/3)){g.dispose();return false;}}
      add(g,material,0,0,0);return true;
    };
    let count=0,wallAuthored=false;
    for(const r of reservations){
      if(count>=2||Math.min(r.width,r.height)<26)continue;
      const x=(r.x+r.width*.5)/32,z=(r.y+r.height*.5)/32,rw=r.width/32,rd=r.height/32;
      let roof=0;
      for(const fx of [.18,.35,.5,.65,.82])for(const fz of [.18,.35,.5,.65,.82]){
        ray.set(new T.Vector3((r.x+r.width*fx)/32,20,(r.y+r.height*fz)/32),down);
        const hit=ray.intersectObject(world,true).find(value=>value.point.y>.15&&value.point.y<5);
        if(hit)roof=Math.max(roof,hit.point.y);
      }
      if(!roof)continue;
      const alongX=rw>=rd,long=alongX?rw:rd,short=alongX?rd:rw;
      const point=(along:number,across:number,y:number)=>new T.Vector3(x+(alongX?along:across),y,z+(alongX?across:along));
      const main=[point(-long*.44,short*.16,.055),point(-long*.29,-short*.08,roof*.82),point(-long*.11,-short*.14,roof+.15),point(long*.12,short*.13,roof+.22),point(long*.34,short*.20,roof*.60),point(long*.44,short*.30,.055)];
      const before=acceptedParts,skin=tissueRibbon(main,short*.36,Math.min(.62,Math.max(.26,short*.15)),18,count*.91+.35);
      let mainFit:SkinFit={scale:1,cx:x,cz:z,tx:x,tz:z};
      add(fitSkin(skin.geometry,r,value=>mainFit=value),m.resin,0,0,0);
      const mapPoint=(p:T.Vector3)=>p.set((p.x-mainFit.cx)*mainFit.scale+mainFit.tx,p.y,(p.z-mainFit.cz)*mainFit.scale+mainFit.tz);
      // Two muscular roots bind the lobed body to different machine sides.
      // They share its junction but descend asymmetrically into existing solids.
      const ribs=[
        [point(-long*.08,-short*.10,roof+.60),point(-long*.12,-short*.25,roof+.34),point(-long*.28,-short*.43,roof*.55),point(-long*.34,-short*.45,.06)],
        [point(long*.14,short*.05,roof+.57),point(long*.28,short*.25,roof+.23),point(long*.42,short*.35,roof*.48),point(long*.44,short*.40,.055)],
      ];
      for(const [index,points]of ribs.entries())add(fitSkin(tissueRibbon(points.map(p=>mapPoint(p)),Math.min(.34,short*.15),.20,12,index*.8+.7).geometry,r),m.resin,0,0,0);
      if(count===0){
        // The surviving human strip is physically under the fold: one end
        // protrudes from the wide skin, with its old dark housing still visible.
        const fragment=point(-long*.11,short*.13,roof+.10);
        box(m.dark,fragment.x,fragment.y-.035,fragment.z,alongX?.12:short*.77,.06,alongX?short*.77:.12);
        box(m.steel,fragment.x,fragment.y+.006,fragment.z,alongX?.065:short*.72,.035,alongX?short*.72:.065);
        root.userData.partlyBuriedHumanFixture={position:fragment.toArray(),axis:alongX?'z':'x',span:short*.72};
      }
      const wound=[.40,.49,.58].map(t=>mapPoint(skin.crest(t)));
      add(fitSkin(membraneGeometry(wound,Math.min(.075,short*.05),.014,undefined,8),r),m.vein,0,0,0);
      if(acceptedParts===before)continue;
      const source=mapPoint(skin.crest(.49));emit(source.x,source.y+.035,source.z,count,'machine-saddle',r);count++;
      let nearest={x:0,z:0,distance:Infinity,edge:0,t:0},visibleSide:typeof nearest|undefined;
      for(let edge=0;edge<boundary.length;edge++){
        const a=boundary[edge],b=boundary[(edge+1)%boundary.length],dx=(b.x-a.x)/32,dz=(b.y-a.y)/32,length=Math.hypot(dx,dz);
        const t=Math.max(0,Math.min(1,((x-a.x/32)*dx+(z-a.y/32)*dz)/(dx*dx+dz*dz||1))),px=a.x/32+dx*t,pz=a.y/32+dz*t,distance=Math.hypot(px-x,pz-z);
        const candidate={x:px,z:pz,distance,edge,t};if(distance<nearest.distance)nearest=candidate;
        if(length>5&&Math.abs(dz)>Math.abs(dx)*1.3&&(a.x+b.x)/64<w*.40&&(!visibleSide||distance<visibleSide.distance))visibleSide=candidate;
      }
      // The entry camera sees the side hull; the nearest north/south segment
      // can lie outside the actual frame even though a bridge exists in data.
      if(!wallAuthored&&visibleSide)nearest=visibleSide;
      const dx=nearest.x-x,dz=nearest.z-z,distance=nearest.distance||1;
      const sample=(t:number)=>{const bend=Math.sin(t*Math.PI)*.42;return new T.Vector3(x+dx*t-dz/distance*bend,.026,z+dz*t+dx/distance*bend);};
      const bridge=tissueRibbon([sample(0),sample(.28),sample(.64),sample(1)],1.22,.002,Math.min(30,Math.max(10,Math.ceil(distance/.65))),count*.8+.9).geometry;
      const flatBridge=bridge.toNonIndexed();bridge.dispose();
      const p=flatBridge.getAttribute('position'),normal=flatBridge.getAttribute('normal'),uv=flatBridge.getAttribute('uv');
      const positions:number[]=[],normals:number[]=[],uvs:number[]=[];
      // One continuous fan is clipped at existing solids/voids. It does not
      // repeat a scalloped tile or add raised geometry across a combat lane.
      for(let i=0;i<p.count;i+=3){
        let valid=true;
        for(let k=0;k<3;k++){const j=i+k,l=i+(k+1)%3;if(!deckMarkingSupported(template,p.getX(j),p.getZ(j))||!deckMarkingSupported(template,(p.getX(j)+p.getX(l))*.5,(p.getZ(j)+p.getZ(l))*.5)){valid=false;break;}}
        if(valid&&!deckMarkingSupported(template,(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3))valid=false;
        if(!valid)continue;
        for(let k=0;k<3;k++){const j=i+k;positions.push(p.getX(j),p.getY(j),p.getZ(j));normals.push(normal.getX(j),normal.getY(j),normal.getZ(j));uvs.push(uv.getX(j),uv.getY(j));}
      }
      flatBridge.dispose();
      if(positions.length){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));add(g,m.resin,0,0,0);}
      if(!wallAuthored){
        const a=boundary[nearest.edge],b=boundary[(nearest.edge+1)%boundary.length],ex=(b.x-a.x)/32,ez=(b.y-a.y)/32,length=Math.hypot(ex,ez),tx=ex/length,tz=ez/length,nx=tz*winding,nz=-tx*winding;
        const center=Math.max(Math.min(3.0,length*.40),Math.min(length-Math.min(3.0,length*.40),nearest.t*length)),span=Math.min(2.7,length*.36);
        const wallPoint=(t:number,y:number,out=.36)=>new T.Vector3(a.x/32+tx*(center+t)+nx*out,y,a.y/32+tz*(center+t)+nz*out);
        const normal=new T.Vector3(nx,0,nz),wallBefore=acceptedParts;
        // Thick sheets climb and spread over the actual hull segment. Their
        // thickness remains entirely outboard of the unchanged navigation edge.
        add(tissueRibbon([wallPoint(-span*.62,.05),wallPoint(-span*.25,.72),wallPoint(.05,1.42),wallPoint(span*.23,2.20)],Math.min(1.06,span*.46),.17,16,.4,normal).geometry,m.resin,0,0,0);
        add(tissueRibbon([wallPoint(-span,.35),wallPoint(-span*.38,1.08),wallPoint(span*.22,.98),wallPoint(span,.43)],.48,.16,12,1.7,normal).geometry,m.resin,0,0,0);
        add(membraneGeometry([wallPoint(-span*.16,.84,.205),wallPoint(0,1.25,.205),wallPoint(span*.15,1.65,.205)],.055,.012,normal,9),m.vein,0,0,0);
        if(acceptedParts>wallBefore){const source=wallPoint(0,1.30,.16);emit(source.x,source.y,source.z,2,'climbing-hull-web');wallAuthored=true;}
      }
    }
    // Smother one existing breach grille with a broad floor-flat membrane;
    // some old metal bars remain embedded as human evidence, not a new blocker.
    let coveredBreach:number[]|null=null;
    for(const breach of template.breaches){
      const bx=breach.x/32,bz=breach.y/32;
      if(flatSkin([new T.Vector3(bx-.83,.026,bz-.43),new T.Vector3(bx-.15,.026,bz-.05),new T.Vector3(bx+.80,.026,bz+.35)],.78,m.resin)){
        coveredBreach=[bx,bz];break;
      }
    }
    const existing=(root.userData.lightFixtures??[]) as ConsumptionFixture[];
    root.userData.lightFixtures=[...existing,...fixtures].slice(0,4);
    root.userData.consumedConstruction=count;
    root.userData.consumptionForms=forms;
    root.userData.coveredBreach=coveredBreach;
    root.userData.failedHumanFixtureZones=reservations.slice(0,2).map(r=>({...r}));
  }
  root.userData.constructionLanguage=environment;
  root.userData.constructionIdea=profile.idea;
  root.userData.constructionParts=acceptedParts;
  root.userData.constructionTriangles=triangleCount;
}
