import {SHIP_ARCHITECTURE_PLANS,SHIP_ARCHITECTURE_LAYOUTS} from '../../game/roguelike/shipArchitectureLayouts';
import * as T from 'three';
import type {RoomTemplate} from '../../game/roguelike/types';

type Reservation={x:number;y:number;width:number;height:number};
type Point=readonly [number,number];
type FloorPainter={
 valid:(x:number,z:number)=>boolean;
 quad:(x:number,z:number,w:number,d:number,angle:number,color:number,kind:string,y?:number)=>boolean;
 segment:(ax:number,az:number,bx:number,bz:number,w:number,color:number,kind:string,y?:number)=>boolean;
 patch:(points:readonly Point[],color:number,kind:string,y?:number)=>boolean;
};
export type FloorAftermathProof={idea:string;site:number[];admitted:number};

const IDEAS:Record<string,string>={
 'awakening-bay':'Wet release tracks leave the only open berth and turn into the escape aisle',
 'passenger-vault':'An interrupted service cart left coolant and twin wheel tracks beside occupied berths',
 'residential-gallery':'One arrival bag was unpacked; clothing and colony papers spread beyond the cabin rug',
 'communal-atrium':'Soil, leaves and a displaced garden mat interrupt the last domestic gathering place',
 'crew-checkpoint':'A directional blast fan, spent casings and a dragged defense panel record the failed line',
 armory:'An equipment issue was interrupted with ammunition spilling from an opened inventory case',
 'freight-hold':'Freight wrapping and crate contents spill across the loading bay beneath a long skid trail',
 'breached-loading-bay':'A jagged decompression scar draws torn insulation and ash inward from the hull breach',
 'relay-racks':'Removed relay covers and a loose coiled service cable break the pristine access-floor field',
 'transmission-chamber':'Torn uplink thermal foil and a relocated service rig leave asymmetric drag tracks',
 'diagnostic-gallery':'Diagnostic printouts scatter from a burned service connection beneath the fatal warning',
 'safety-interlock-station':'An abandoned lockout mat and opened record docket stop at the sealed interlock',
 'coolant-plant':'A pressure-fluid spill follows the drain away from a serviced pump',
 'service-shaft-landing':'Heavy repair tracks stop at the lost lower-deck connection beside a snapped cable coil',
 'infested-workshop':'Human repair covers and coolant streaks disappear into branching living tissue',
 'swarm-junction':'Dragged transit contents and scattered shell fragments vanish beneath the brood mat',
 'shielding-gate':'A damaged calibration sweep and broken probe strips interrupt the field test floor',
 'containment-annulus':'A crescent of safety glass and abandoned probes records a failed annulus inspection',
 'manual-control-chamber':'One operator path ends at the console beside a spilled mug and scorched service mat',
 'overload-floor':'Unequal radial scorch fans and loose insulation carry reactor heat into the circulation floor',
 'reactor-vault':'Consumed repair stock leaves torn human floor remnants inside the Queen foundation',
};

/** One large, room-specific interruption, rather than the same stamp at every machine toe. */
export function addKitFloorAftermath(t:RoomTemplate,id:string,reservations:readonly Reservation[],p:FloorPainter):FloorAftermathProof {
 if(Object.hasOwn(SHIP_ARCHITECTURE_LAYOUTS,id)){
  let admitted=0;
  const stroke=(ax:number,az:number,bx:number,bz:number,width:number,color:number,kind:string)=>{if(p.segment(ax,az,bx,bz,width,color,kind,.023))admitted++;};
  if(id==='residential-gallery'){
   for(const [i,left]of [40,416,808].entries())for(const south of [false,true]){
    const width=i===1?368:352,x=left+width/2,front=south?660:300,color=south?0x4e5855:0x605b52;
    const field=(x0:number,y0:number,x1:number,y1:number)=>{if(p.quad((x0+x1)/64,(y0+y1)/64,(x1-x0)/32,(y1-y0)/32,0,color,'cabin-vinyl',.018))admitted++;};
    // The finish fills the actual U-shaped cabin floor between bed, desk and
    // wardrobe, ending at its gallery threshold. No floating rug rectangle.
    field(left+.1,south?660.1:140.1,left+width-.1,south?819.9:299.9);
    field(left+94.1,south?820.1:40.1,left+width-68.1,south?919.9:139.9);
    field(left+width-67.9,south?820.1:100.1,left+width-.1,south?859.9:139.9);
    stroke((x-100)/32,front/32,(x+100)/32,front/32,.09,0x918674,'cabin-threshold');
    for(const side of [-1,1])stroke((x+side*12)/32,(front+(south?14:-14))/32,(x+side*12)/32,(front+(south?36:-36))/32,.05,0x444a43,'doorway-footwear');
   }
   return {idea:'Six cabin finishes meet their gallery thresholds',site:[t.spawn.x/32,t.spawn.y/32],admitted};
  }
  if(id==='crew-checkpoint'){
   for(const y of [288,592])stroke(272/32,y/32,464/32,y/32,.075,0x8c907d,'inspection-booth-threshold');
   for(const y of [344,408,472,536])stroke(476/32,y/32,492/32,y/32,.055,0x899889,'scanner-alignment-ticks');
   return {idea:'Inspection booth thresholds and scanner alignment',site:[450/32,440/32],admitted};
  }
  if(id==='relay-racks'){
   for(const r of reservations){const end=(r.y+r.height)/32+.12,x=(r.x+r.width/2)/32;
    stroke(r.x/32,end,(r.x+r.width)/32,end,.07,0x68797b,'rack-service-threshold');
    for(const side of [-1,1])stroke(x+side*.25,end,x+side*.25,end+.55,.04,0x34494f,'cooling-access-wear');
   }
   return {idea:'Rack service thresholds follow the live banks',site:[t.spawn.x/32,t.spawn.y/32],admitted};
  }
  const plan=SHIP_ARCHITECTURE_PLANS[id as keyof typeof SHIP_ARCHITECTURE_PLANS];
  // Other architecture owns its own finish. A single functional annotation
  // belongs to an actual named threshold, never one patch per obstacle.
  const functionByRoom:Record<string,{gate:number;kind:string;color:number;paired?:boolean}>={
   'awakening-bay':{gate:0,kind:'release-hatch-sill',color:0x7c8b86},
   'passenger-vault':{gate:1,kind:'medical-clean-zone',color:0x637b7c,paired:true},
   'communal-atrium':{gate:5,kind:'conservatory-finish-joint',color:0x696657},
   'armory':{gate:0,kind:'ammunition-issue-boundary',color:0x97856a,paired:true},
   'freight-hold':{gate:1,kind:'loading-clearance-stop',color:0x827a5c,paired:true},
   'breached-loading-bay':{gate:0,kind:'repair-clearance-sill',color:0x877d69},
   'transmission-chamber':{gate:0,kind:'uplink-operator-sill',color:0x778589},
   'diagnostic-gallery':{gate:0,kind:'diagnostic-clean-boundary',color:0x70807e},
   'safety-interlock-station':{gate:1,kind:'interlock-release-line',color:0x8a8669,paired:true},
   'coolant-plant':{gate:0,kind:'pump-service-drain',color:0x3d625c},
   'service-shaft-landing':{gate:0,kind:'lost-deck-access-stop',color:0x8a8060,paired:true},
   'infested-workshop':{gate:0,kind:'engulfed-service-joint',color:0x52604d},
   'swarm-junction':{gate:1,kind:'distorted-transit-sill',color:0x575951},
   'shielding-gate':{gate:0,kind:'field-calibration-baseline',color:0x737f87,paired:true},
   'containment-annulus':{gate:0,kind:'containment-airlock-sill',color:0x8a936f,paired:true},
   'manual-control-chamber':{gate:0,kind:'manual-console-access',color:0x8e775f},
   'overload-floor':{gate:0,kind:'core-control-heat-stop',color:0xa17b5e,paired:true},
  };
  const fn=functionByRoom[id],g=plan&&fn?plan.openings[fn.gate]:undefined;
  if(g){
   const dx=g.to.x-g.from.x,dy=g.to.y-g.from.y,len=Math.hypot(dx,dy),nx=-dy/len,nz=dx/len;
   // A bounded door annotation: split sill, two jamb ends and alignment
   // references share the real opening. No detached mat, scatter or bar recipe.
   const ux=dx/len,uz=dy/len,cx=(g.from.x+g.to.x)/2,cz=(g.from.y+g.to.y)/2,half=Math.min(48,len/2-12);
   for(const side of [-1,1]){
    stroke((cx+ux*side*half)/32,(cz+uz*side*half)/32,(cx+ux*side*6)/32,(cz+uz*side*6)/32,.035,fn.color,fn.kind);
    const x=cx+ux*side*half,z=cz+uz*side*half;
    stroke((x-nx*5)/32,(z-nz*5)/32,(x+nx*5)/32,(z+nz*5)/32,.035,fn.color,fn.kind+'-jamb');
    stroke((cx+ux*side*16+nx*8)/32,(cz+uz*side*16+nz*8)/32,(cx+ux*side*16+nx*14)/32,(cz+uz*side*16+nz*14)/32,.025,fn.color,fn.kind+'-alignment');
   }
  }
  return {idea:fn?.kind??'Architecture owns its working floor',site:[t.spawn.x/32,t.spawn.y/32],admitted};
 }
 const w=t.width/32,h=t.height/32,r=reservations[0];
 const desired:Point=r?[(r.x+r.width*.5)/32,(r.y+r.height)/32+2.1]:[w*.5,h*.5];
 const candidates:Point[]=[desired];
 if(r)candidates.push([(r.x-64)/32,(r.y+r.height*.5)/32],[(r.x+r.width+64)/32,(r.y+r.height*.5)/32]);
 for(let z=1.5;z<h-1;z+=1.5)for(let x=1.5;x<w-1;x+=1.5)candidates.push([x,z]);
 candidates.sort((a,b)=>Math.hypot(a[0]-desired[0],a[1]-desired[1])-Math.hypot(b[0]-desired[0],b[1]-desired[1]));
 const site=candidates.find(([x,z])=>[[0,0],[-1,-.8],[1,-.8],[-1,.8],[1,.8]].every(([dx,dz])=>p.valid(x+dx,z+dz)))??desired;
 const angle=Math.atan2(t.spawn.y/32-site[1],t.spawn.x/32-site[0]),ca=Math.cos(angle),sa=Math.sin(angle);
 const at=(u:number,v:number):Point=>[site[0]+u*ca-v*sa,site[1]+u*sa+v*ca];
 let admitted=0,state=1;for(const c of id)state=(Math.imul(state,31)+c.charCodeAt(0))>>>0;
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const mark=(u:number,v:number,width:number,depth:number,turn:number,color:number,kind:string,y=.028)=>{const q=at(u,v);if(p.quad(q[0],q[1],width,depth,angle+turn,color,kind,y))admitted++;};
 const line=(a:Point,b:Point,width:number,color:number,kind:string,y=.026)=>{const aa=at(...a),bb=at(...b);if(p.segment(aa[0],aa[1],bb[0],bb[1],width,color,kind,y))admitted++;};
 const shape=(points:readonly Point[],color:number,kind:string,y=.024)=>{if(p.patch(points.map(q=>at(...q)),color,kind,y))admitted++;};
 const fan=(kind:string,color=0x293035,length=5.2)=>shape([[-.5,-.35],[1,-.7],[length*.72,-1.45],[length,-.65],[length*.84,.3],[length*.63,1.4],[1.2,.6],[-.4,.35]],color,kind);
 const scatter=(kind:string,color:number,count:number,paper=false)=>{
  for(let i=0;i<count;i++){const u=.5+random()*4.4,v=(random()-.5)*(1+u*.32);mark(u,v,paper?.25+random()*.22:.06+random()*.08,paper?.4+random()*.18:.16+random()*.16,random()*2,color,kind);}
 };
 const footsteps=(start:number,length:number,kind:string)=>{
  for(let u=start;u<start+length;u+=.47){const sway=Math.sin(u*.8)*.22;for(const side of [-1,1])mark(u,sway+side*.17,.11,.24,Math.PI/2+.06*side,0x3d484c,kind);}
 };
 const cable=(kind:string)=>{
  const points=[at(-1,-.6),at(.7,-1.1),at(2.2,.5),at(3.1,1.2),at(3.7,-.2),at(2.5,-.55),at(1.8,.25),at(5,.5)];
  const curve=new T.CatmullRomCurve3(points.map(q=>new T.Vector3(q[0],.027,q[1])));
  for(let i=0;i<44;i++){const a=curve.getPoint(i/44),b=curve.getPoint((i+1)/44);if(p.segment(a.x,a.z,b.x,b.z,.065,0x283a43,kind,.027))admitted++;}
 };
 const arc=(kind:string,color:number,radius=3.4)=>{
  for(let i=0;i<27;i++){const a=-1+i*.075,b=a+.045;line([Math.cos(a)*radius,Math.sin(a)*radius],[Math.cos(b)*radius,Math.sin(b)*radius],.11,color,kind);}
 };
 switch(id){
  case 'awakening-bay':shape([[-1,-.6],[.8,-1],[3,-.2],[3.7,.6],[1.3,.8]],0x44565d,'release-thaw-spill');footsteps(-.5,7,'emergency-release-tracks');break;
  case 'passenger-vault':shape([[-.8,-.8],[1.2,-1],[3.4,-.2],[3.1,.9],[.5,.6]],0x405b60,'cart-coolant-spill');for(const v of [-.48,.48])line([0,v],[6.5,v+.45],.14,0x35464b,'interrupted-cart-tracks');mark(2.5,-.8,.6,.85,.35,0x63777a,'discarded-berth-service-cloth');break;
  case 'residential-gallery':shape([[.1,-.7],[1.2,-.9],[1.8,-.1],[1.3,.2],[2.2,.7],[.5,.9],[-.2,.3]],0x55444b,'unpacked-clothing');scatter('arrival-paperwork',0x8d8979,8,true);mark(-.3,.4,.65,.5,.3,0x414444,'spilled-cabin-mug');break;
  case 'communal-atrium':fan('garden-soil-spill',0x3c4330,4.6);scatter('fallen-garden-leaves',0x69754b,18);mark(1.2,-1,1.3,1.8,.4,0x666553,'displaced-garden-mat');break;
  case 'crew-checkpoint':fan('failed-defense-blast',0x232b30,6.2);scatter('defense-spent-casings',0x9c8356,30);line([-.4,-.8],[5.8,.4],.24,0x4f5654,'dragged-defense-panel');footsteps(1,4,'defender-retreat-tracks');break;
  case 'armory':shape([[-.3,-.7],[1.8,-1.1],[3.3,-.3],[2.5,1.1],[.2,.7]],0x3b484c,'open-inventory-case-imprint');scatter('issued-ammunition-spill',0x9b8a65,34);mark(2.8,-1.2,.9,1.5,-.5,0x64747b,'removed-issue-tray');break;
  case 'freight-hold':shape([[-.5,-.9],[1.8,-1.3],[1.5,-.2],[3.2,.2],[2.6,1.4],[.6,.8]],0x8b846d,'torn-freight-wrapping');scatter('spilled-crate-contents',0x6e6954,17);for(const v of [-.7,.7])line([-.5,v],[6,v+.9],.2,0x343c3e,'crate-skid-tracks');break;
  case 'breached-loading-bay':fan('decompression-ash-scar',0x2b3032,7);shape([[1,-1.5],[3.6,-1],[2.8,-.4],[5,.3],[4.1,.8],[1.6,.1]],0x87908a,'torn-hull-insulation');scatter('breach-fragments',0x5a6363,22);break;
  case 'relay-racks':mark(.8,-.8,1.2,2.3,.52,0x394d56,'removed-relay-cover');mark(2.9,.8,.9,1.8,-.47,0x536872,'removed-relay-cover');cable('loose-relay-service-cable');scatter('relay-service-notes',0x849292,6,true);break;
  case 'transmission-chamber':shape([[0,-1.1],[2.4,-1.6],[1.5,-.5],[4,-.1],[2.5,.5],[3.4,1.1],[.4,.8]],0x7e8b8c,'torn-uplink-thermal-foil');for(const v of [-.7,.7])line([-.5,v],[5.3,v+.55],.18,0x354a53,'uplink-rig-drag-tracks');scatter('uplink-repair-docket',0x829496,7,true);break;
  case 'diagnostic-gallery':fan('burned-diagnostic-connection',0x30363b,4.5);scatter('discarded-diagnostic-printouts',0x90948c,11,true);cable('disconnected-diagnostic-lead');break;
  case 'safety-interlock-station':shape([[-.7,-1],[1.5,-1.1],[3,.2],[1.6,.8],[-.5,.6]],0x414b4b,'abandoned-lockout-mat');scatter('locked-record-docket',0x8b8d7e,9,true);for(let i=0;i<3;i++)mark(1+i*.5,-.9,.16,1.2,.3,0xa38e62,'torn-lockout-strips');break;
  case 'coolant-plant':shape([[-1,-.5],[1,-1.2],[3.5,-.6],[4.2,.4],[2.3,1.1],[.2,.7]],0x36564e,'pressure-fluid-spill');line([1,-.2],[6,1.1],.34,0x4c6b5e,'coolant-follows-drain');arc('pump-cart-wheel-sweep',0x3d4e48,2.6);break;
  case 'service-shaft-landing':for(const v of [-.58,.58])line([-.7,v],[5.6,v+.4],.23,0x344b49,'repair-drag-trail');cable('snapped-lower-deck-cable');scatter('shaft-service-fragments',0x64756a,12);break;
  case 'infested-workshop':mark(1,-.7,1.3,2.1,.4,0x4a5557,'engulfed-human-service-cover');shape([[-.5,-.8],[1.6,-1.2],[3.4,-.2],[2.6,1],[.2,.6]],0x3a4a47,'consumed-coolant-streak');scatter('consumed-repair-fragments',0x657365,14);break;
  case 'swarm-junction':fan('dragged-transit-remnants',0x47434b,5);scatter('brood-shell-fragments',0x716a66,27);line([0,-.8],[5.5,.9],.2,0x333d3d,'consumed-freight-drag');break;
  case 'shielding-gate':arc('broken-calibration-sweep',0x4a5361,3.8);for(let i=0;i<7;i++)mark(.3+random()*3,(random()-.5)*2,.14,.65+random()*.6,random()*2,0x7f8992,'broken-field-probe');scatter('field-inspection-glass',0x869396,17);break;
  case 'containment-annulus':arc('failed-annulus-inspection',0x465365,3.6);scatter('safety-glass-crescent',0x8d9ca2,28);for(let i=0;i<4;i++)mark(.5+i*.55,.5-i*.32,.17,1.3,.5+i*.2,0x6a7889,'abandoned-calibration-probe');break;
  case 'manual-control-chamber':fan('scorched-operator-service-mat',0x292d34,5.8);footsteps(-.8,7,'last-operator-path');mark(.3,.65,.85,.65,.3,0x39373a,'operator-mug-spill');scatter('manual-authorization-docket',0x9c8b76,5,true);break;
  case 'overload-floor':fan('reactor-heat-scar',0x292a31,7);shape([[1,-1.7],[4,-1.9],[3.5,-.3],[6.4,.5],[4.8,1.3],[1.6,.3]],0x50403b,'unequal-radial-heat-plating');scatter('overload-insulation-ash',0x625850,24);for(const v of [-.75,.75])line([.5,v],[6.6,v*1.7],.13,0x966e48,'heat-fracture-edge');break;
  case 'reactor-vault':shape([[-.8,-.8],[2,-1.1],[3.6,-.1],[2,1.2],[.1,.6]],0x46504d,'consumed-repair-floor-remnant');scatter('nest-crushed-insulation',0x777062,22);cable('consumed-human-power-feed');break;
 }
 return{idea:IDEAS[id]??id,site:[...site],admitted};
}
