import type {RoomCutawayTargets} from './RoomCutawayTargets';
import * as T from 'three';
import {FULL_COMBAT_VIEWPORT,type CombatViewport} from '../camera/HudCombatFraming';
import type {RoomTemplate} from '../../game/roguelike/types';
import {SHIP_ARCHITECTURE_PLANS} from '../../game/roguelike/shipArchitectureLayouts';

const BOARD_HEIGHT=5.8,BOARD_DEPTH=1.2;
export const WARNING_FRAME_LOWEST=BOARD_HEIGHT-BOARD_DEPTH/2-.0225;
export const WARNING_REPEATER_ROOMS=new Set(['diagnostic-gallery','safety-interlock-station','manual-control-chamber']);
type Writer={vertexCount:(m:T.Material)=>number;box:(m:T.Material,x:number,y:number,z:number,w:number,h:number,d:number,rotation?:number)=>void;pipe:(m:T.Material,a:T.Vector3,b:T.Vector3,r:number)=>void;add:(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number)=>void};
type Finishes={structure:T.MeshStandardMaterial;screen:T.MeshStandardMaterial;signal:T.MeshStandardMaterial;case:T.Material;metal:T.Material;recess:T.Material};
type Body={x:number;y:number;radius:number};
type NativeBody=Body&{id:number};
type Model={height:number;root?:T.Object3D};
type Display={center:number[];corners:number[][];normal:number[];support:{x:number;y:number;width:number;height:number};mount:string};
const EMPTY:readonly NativeBody[]=Object.freeze([]);
const NORMAL_ALPHA=184,FADED_ALPHA=14;
type Component={board?:number;kind:string;min:number[];max:number[];start:number;end:number;faded:boolean;material:T.Material;alpha:number;colors?:T.Uint8BufferAttribute};
/** Physical, ceiling-supported warning boards. Masts stand on the
 * actual recorder/control cabinet; the entire cross-room span clears champions.
 * Manufactured structure and actor-aware text/structure cutaways preserve silhouettes. */
export function addWarningRepeaters(world:T.Group,root:T.Group,t:RoomTemplate,id:string,w:Writer,m:Finishes):void {
 const plan=SHIP_ARCHITECTURE_PLANS[id as keyof typeof SHIP_ARCHITECTURE_PLANS];if(!plan||!WARNING_REPEATER_ROOMS.has(id))return;
 const r=t.obstacles[0];if(!r)throw Error('Warning gantry has no recorder/control support');
 const source=new T.Vector3((r.x+r.width/2)/32,0,(r.y+r.height*.5)/32),ray=new T.Raycaster(new T.Vector3(source.x,20,source.z),new T.Vector3(0,-1,0));world.updateMatrixWorld(true);
 const support=ray.intersectObject(world,true).find(hit=>hit.point.y>.2);if(!support)throw Error('Warning gantry support has no physical cabinet roof');
 source.y=support.point.y;
 const height=BOARD_HEIGHT,panelHeight=BOARD_DEPTH,width=3.6,ceiling=6.8,forward=height*19/26*32;
 const centers=[{x:t.spawn.x+220,z:t.spawn.y+forward},{x:plan.arena.x+(id==='safety-interlock-station'?108:96),z:plan.arena.y+forward}];
 if(Math.hypot(centers[0].x-centers[1].x,centers[0].z-centers[1].z)<170)centers.splice(0,1);
 // Keep the first diagnostic face inside the HUD-safe window while kiting
 // along the right inspection lane; the second face protects the arena mark.
 if(id==='diagnostic-gallery')centers[0].x=plan.arena.x-96;
 // Suspend the control-room record just to the above and to the right of the damaged workstation.
 // The board's projection clears the bridge and remains on its approach.
 if(id==='manual-control-chamber'&&centers.length>1)centers[1]={x:560,z:493+forward};
 const canonicalCenters=centers.length;
 // Repeat the same fatal record at the named workbays and exit, rather than
 // covering only the old spawn/arena crops. Lateral clearance keeps every
 // repeated face away from all named-space actor anchors; the runtime's
 // original full-body cutaway still protects actors between those anchors.
 const anchors=[t.spawn,plan.arena,t.exit,...plan.spaces.map(space=>space.anchor)],hull=t.boundary??[{x:0,y:0},{x:t.width,y:t.height}];
 const minX=Math.min(...hull.map(p=>p.x))+width*16+8,maxX=Math.max(...hull.map(p=>p.x))-width*16-8;
 const maxZ=Math.max(...hull.map(p=>p.y))-16;
 for(const anchor of [...plan.spaces.map(space=>space.anchor),t.exit]){
  if(centers.slice(0,canonicalCenters).some(center=>Math.abs(center.z-forward-anchor.y)<100&&Math.abs(center.x-anchor.x)<380))continue;
  const z=Math.min(maxZ,anchor.y+forward),apparentY=z-forward;
  const offsets=id==='safety-interlock-station'?[-130,130,-144,144,-220,220]:[144,-144,220,-220,130,-130];
  const x=offsets.map(offset=>anchor.x+offset).find(candidate=>candidate>=minX&&candidate<=maxX&&anchors.every(other=>Math.abs(apparentY-other.y)>=100||Math.abs(candidate-other.x)>=120));
  if(x===undefined)continue;
  if(centers.some(center=>Math.hypot(center.x-x,center.z-z)<150))continue;
  centers.push({x,z});
 }
 const canonical=centers.slice(0,canonicalCenters),headerZ=Math.min(...canonical.map(p=>p.z))/32-.70,routeX=source.x;
 const structural=m.structure;structural.color.setHex(id==='manual-control-chamber'?0x71675a:0x64747a);structural.metalness=.65;structural.roughness=.62;structural.transparent=false;structural.opacity=1;structural.vertexColors=true;structural.depthWrite=true;structural.alphaTest=.3;structural.userData.warningCutaway=true;
 const components:Component[]=[];let board=-1;
 const beam=(kind:string,x:number,y:number,z:number,bw:number,bh:number,bd:number,material:T.Material=structural,alpha=NORMAL_ALPHA)=>{
  const start=w.vertexCount(material);w.add(new T.BoxGeometry(bw,bh,bd),material,x,y,z);components.push({board,kind,material,alpha,start,end:w.vertexCount(material),faded:false,min:[x-bw/2,y-bh/2,z-bd/2],max:[x+bw/2,y+bh/2,z+bd/2]});
 };
 const tray=(a:T.Vector3,b:T.Vector3,y=ceiling)=>{
  const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);if(length<.01)return;
  const alongX=Math.abs(dx)>Math.abs(dz),sections=Math.ceil(length/1.25),span=length/sections;
  // Narrow captive rails carry the warning screens without masking the
  // room landmark. Keep section ownership for the existing actor cutaway.
  // Cut away a local carrier section above an actor, not the whole room-long
  // web while leaving its cross-ribs suspended in empty space.
  for(let n=0;n<sections;n++){
   const f=(n+.5)/sections,x=a.x+dx*f,z=a.z+dz*f;
   beam('service-tray-web',x,y,z,alongX?span:.10,.035,alongX?.10:span);
   for(const side of [-1,1])beam('service-tray-flange',x+(alongX?0:side*.065),y+.04,z+(alongX?side*.065:0),alongX?span:.018,.055,alongX?.018:span);
  }
  const count=Math.max(1,Math.ceil(length/3.0));for(let j=0;j<count;j++){const f=(j+.5)/count;beam('tray-cross-rib',a.x+dx*f,y+.055,a.z+dz*f,alongX?.018:.15,.018,alongX?.15:.018);}
 };
 const lampColor=id==='diagnostic-gallery'?0xb4dee5:id==='safety-interlock-station'?0xe5c99c:0x9bd6c2;m.signal.color.setHex(lampColor);m.signal.emissive.setHex(lampColor);
 m.screen.emissive.setHex(lampColor);
 m.screen.transparent=true;m.screen.opacity=.96;m.screen.depthWrite=false;m.screen.vertexColors=true;
 // Manufactured service fronts occupy the actual sealed machine bays. Deep
 // drawer returns, cable sockets and restrained controls give each case a
 // purpose; there are no loose equipment islands on the combat floor.
 const bayParts:Array<{role:string;support:typeof r;maxHeight:number}>=[];
 for(const [i,cell]of t.obstacles.entries()){
  const cx=(cell.x+cell.width/2)/32,near=(cell.y+cell.height)/32-.012,cw=cell.width/32-.30;
  if(cw<1.2)continue;
  w.box(m.recess,cx,.42,near-.18,cw,.66,.36);
  const count=Math.min(4,Math.max(1,Math.floor(cw/1.4))),pitch=cw/count;
  for(let n=0;n<count;n++){
   const px=cx-cw/2+(n+.5)*pitch;
   w.box(m.case,px,.43,near-.035,pitch-.085,.54,.045);
   if(i!==0||Math.abs(px-cx)>1.95){
    w.box(m.metal,px,.66,near-.008,Math.min(.42,pitch*.5),.035,.012);
    w.box(m.recess,px,.33,near-.009,pitch*.55,.13,.014);
    for(let slot=0;slot<3;slot++)w.box(m.metal,px+(slot-1)*.11,.34,near-.001,.024,.09,.008);
   }
  }
  // A continuous instrument well and matched load rails, inside the same bay.
  for(const side of[-1,1])w.box(m.metal,cx+side*cw/2,.42,near-.20,.065,.78,.39);
  if(i===0){
   const sw=Math.min(3.24,cw-.25),sh=.58;
   w.box(m.recess,cx,.46,near-.035,sw+.13,sh+.12,.045);
   for(let row=0;row<3;row++){w.box(m.signal,cx-sw*.36,.64-row*.17,near-.001,sw*.10,.055,.008);w.box(m.metal,cx+sw*.07,.64-row*.17,near-.001,sw*(row===1?.43:.62),.025,.008);}
  }
  bayParts.push({role:id==='manual-control-chamber'?'guarded-authorization-workbay':id==='safety-interlock-station'?'recorder-isolation-cabinet':'cryo-instrument-workbay',support:{...cell},maxHeight:.81});
 }
 root.userData.warningWorkBays=bayParts;
 const supports=[];
 for(const side of[-1,1]){
  const x=source.x+side*Math.min(.8,r.width/32*.25);
  beam('paired-load-bearing-upright',x,(source.y+ceiling)/2,source.z,.13,ceiling-source.y,.16);beam('upright-foot',x,source.y+.07,source.z,.36,.14,.40);
  for(let y=source.y+.7;y<ceiling;y+=.95)beam('upright-cable-clamp',x,y,source.z,.22,.07,.24);supports.push({x:x*32,y:source.z*32,roof:source.y});
 }
 // A continuous cable tray and return rail connect the real case to the
 // repeated displays. The route follows the recorder's actual service axis;
 // individual beam bounds drive cutaway where actors cross that axis.
 tray(new T.Vector3(routeX,ceiling,source.z),new T.Vector3(routeX,ceiling,headerZ));
 const left=Math.min(routeX,...canonical.map(p=>p.x/32-width*.5)),right=Math.max(routeX,...canonical.map(p=>p.x/32+width*.5));
 tray(new T.Vector3(left,ceiling,headerZ),new T.Vector3(right,ceiling,headerZ));
 // Extension carriers run above the original gantry's reading cone. They
 // remain connected to the same pair of cabinet-backed load-bearing masts.
 const extensionHeight=8.8,extensions=centers.slice(canonicalCenters),extensionSpineX=(Math.max(...hull.map(p=>p.x))+48)/32;
 if(extensions.length){
  beam('extension-upright',source.x,(ceiling+extensionHeight)/2,source.z,.13,extensionHeight-ceiling,.16);
  const zs=extensions.map(p=>p.z/32-.70);
  tray(new T.Vector3(routeX,extensionHeight,source.z),new T.Vector3(extensionSpineX,extensionHeight,source.z),extensionHeight);
  tray(new T.Vector3(extensionSpineX,extensionHeight,Math.min(source.z,...zs)),new T.Vector3(extensionSpineX,extensionHeight,Math.max(source.z,...zs)),extensionHeight);
  const rows=new Map<number,{left:number;right:number}>();
  for(const center of extensions){const z=center.z/32-.70,row=rows.get(z)??{left:extensionSpineX,right:extensionSpineX};row.left=Math.min(row.left,center.x/32-width*.5);row.right=Math.max(row.right,center.x/32+width*.5);rows.set(z,row);}
  for(const [z,row]of rows)tray(new T.Vector3(row.left,extensionHeight,z),new T.Vector3(row.right,extensionHeight,z),extensionHeight);
 }
 const displays:Display[]=[];
 for(const [index,center]of centers.entries()){
  board=index;
  const x=center.x/32,z=center.z/32,carrier=index<canonicalCenters?ceiling:extensionHeight;
  const localHeaderZ=index<canonicalCenters?headerZ:z-.70;
  for(const side of[-1,1]){
   const px=x+side*width*.49;
   beam('display-bracket-run',px,carrier,(localHeaderZ+z-.18)/2,.08,.10,z-.18-localHeaderZ);
   beam('display-hanger',px,(carrier+height+panelHeight/2)/2,z-.18,.09,carrier-height-panelHeight/2,.11);
   beam('display-side-casing',px,height,z,.085,panelHeight,.20);
  }
  beam('display-back-casing',x,height,z,width,panelHeight,.12);beam('display-top-casing',x,height+panelHeight/2,z,width,.045,.20);beam('display-lower-casing',x,height-panelHeight/2,z,width,.045,.20);
  for(const side of[-1,1])beam('display-cable-entry',x+side*(width/2+.06),height+.32,z-.015,.20,.26,.18);
  const faceStart=w.vertexCount(m.screen);w.add(new T.PlaneGeometry(width*.9,panelHeight*.8),m.screen,x,height,z+.067);
  components.push({board,kind:'warning-face',material:m.screen,alpha:255,start:faceStart,end:w.vertexCount(m.screen),faded:false,min:[x-width*.45,height-panelHeight*.4,z+.065],max:[x+width*.45,height+panelHeight*.4,z+.069]});
  displays.push({center:[x,height,z+.067],corners:[[-.45,-.4],[.45,-.4],[.45,.4],[-.45,.4]].map(([dx,dy])=>[x+dx*width,height+dy*panelHeight,z+.067]),normal:[0,0,1],support:{...r},mount:'physical-overhead-repeater'});
 }
 board=-1;
 // A real underside service luminaire gives the arena a fixture-shaped
 // source while retaining the low authorization console as the reactor key.
 const lampX=Math.max(left+.5,Math.min(right-.5,(plan.arena.x+(id==='safety-interlock-station'?150:-180))/32));
 beam('linear-service-luminaire-case',lampX,ceiling-.12,headerZ,1.90,.18,.40);
 m.signal.transparent=true;m.signal.depthWrite=false;m.signal.vertexColors=true;
 beam('linear-service-luminaire-diffuser',lampX,ceiling-.215,headerZ,1.62,.025,.24,m.signal,255);
 // The original low console/projector remains the primary reactor key; the
 // appended, physically mounted overhead task source is an additional pool.
 w.box(m.signal,source.x,source.y+.045,source.z,.28,.06,.14);
 root.userData.lightFixtures=[{x:source.x,y:source.y+.08,z:source.z,color:m.signal.emissive.getHex(),nativeColor:true,poolStyle:1,poolWidth:.35,poolDepth:5},{x:lampX,y:ceiling-.23,z:headerZ,color:lampColor,nativeColor:true,poolStyle:1,poolAngle:Math.PI/2,poolWidth:.7,poolDepth:5.5,distance:10,gain:.8}];
 root.userData.warningStructure=components;root.userData.canonicalWarningDisplays=canonicalCenters;root.userData.storyDisplays=displays;root.userData.storyDisplay=displays[0];root.userData.warningSupports=supports;root.userData.warningClearance=WARNING_FRAME_LOWEST;
 root.userData.warningVisibility={allDisplays:displays,material:m.screen,structure:structural,point:new T.Vector3(),structureBounds:new Float64Array(components.length*6),screenBounds:new Float64Array(displays.length*6),actorBounds:new Float64Array(1025*6),faded:false};
}

/** One existing merged batch uses built-in Standard RGBA vertex alpha. The
 * byte ranges are owned by that geometry; no new draw or custom shader code. */
export function prepareWarningVertexColors(root:T.Group,material:T.Material,geometry:T.BufferGeometry):void {
 const state=root.userData.warningVisibility;if(!state)return;const components=root.userData.warningStructure as Component[];if(!components.some(c=>c.material===material))return;
 const colors=new T.Uint8BufferAttribute(new Uint8Array(geometry.attributes.position.count*4).fill(255),4,true);colors.setUsage(T.DynamicDrawUsage);
 const normals=geometry.getAttribute('normal');for(let i=0;i<normals.count;i++){const value=material===state.material?255:normals.getY(i)>.5?255:normals.getZ(i)>.35?130:205;colors.array[i*4]=colors.array[i*4+1]=colors.array[i*4+2]=value;}
 for(const component of components)if(component.material===material){component.colors=colors;for(let i=component.start;i<component.end;i++)colors.array[i*4+3]=component.alpha;}
 geometry.setAttribute('color',colors);if(state.structure===material)state.colors=colors;
}

/** Opacity/vertex-alpha-only cutaway. Actual full body corners participate;
 * only intersected physical beam ranges fade. All scratch storage is retained. */
export function updateWarningRepeaterVisibility(root:T.Object3D,camera?:T.Camera,marine?:Body,marineHeight=2.05,enemies:readonly NativeBody[]=EMPTY,models?:ReadonlyMap<number,Model>,viewport:CombatViewport=FULL_COMBAT_VIEWPORT,targets?:RoomCutawayTargets):void {
 const state=root.userData.warningVisibility,displays=state?.allDisplays as Display[]|undefined;if(!state||!displays||!camera||!marine)return;
 const point=state.point as T.Vector3,screen=state.screenBounds as Float64Array,actors=state.actorBounds as Float64Array,structure=state.structureBounds as Float64Array;
 let bodies=1;projectActor(marine,marineHeight,camera,point,actors,0);
 for(let i=0;i<enemies.length;i++){const enemy=enemies[i],model=models?.get(enemy.id);if(model?.root?.visible===false)continue;if(bodies===1025)break;projectActor(enemy,model?.height??4.7,camera,point,actors,bodies++*6);}
  for(let i=0;targets&&i<targets.count&&bodies<1025;i++)
    projectActor(targets.bodies[i],.6,camera,point,actors,bodies++*6);
 let fade=false,selected=-1,best=-Infinity;
 for(let i=0;i<displays.length;i++){
  const n=i*6;resetBounds(screen,n);
  for(const corner of displays[i].corners){point.fromArray(corner).applyMatrix4(root.matrixWorld).project(camera);extend(screen,n,point);}
  const safe=screen[n]>=viewport.left&&screen[n+2]<=viewport.right&&screen[n+1]>=viewport.bottom&&screen[n+3]<=viewport.top;
  const body=overlapsBodies(screen,n,actors,bodies),score=(safe?1000:0)-(body?200:0)-Math.abs((screen[n]+screen[n+2])*.5)-Math.abs((screen[n+1]+screen[n+3])*.5)*.3;
  if(score>best){best=score;selected=i;fade=body;}
 }
 root.userData.storyDisplays=selected<0?[]:[displays[selected]];root.userData.storyDisplay=displays[selected];state.selectedDisplay=selected;
 state.faded=fade;(state.material as T.MeshStandardMaterial).opacity=fade?.04:.96;
 const components=root.userData.warningStructure as Component[];let fadedParts=0;
 for(let i=0;i<components.length;i++){
  const part=components[i],n=i*6;resetBounds(structure,n);
  for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++){
   point.set(x?part.max[0]:part.min[0],y?part.max[1]:part.min[1],z?part.max[2]:part.min[2]).applyMatrix4(root.matrixWorld).project(camera);extend(structure,n,point);
  }
  const hidden=part.board!==undefined&&part.board>=0&&part.board!==selected||bodies===1025||overlapsBodies(structure,n,actors,bodies);if(hidden)fadedParts++;
  if(part.faded!==hidden){const colors=part.colors!;for(let j=part.start;j<part.end;j++)colors.array[j*4+3]=hidden?(part.board!==undefined&&part.board>=0&&part.board!==selected?0:FADED_ALPHA):part.alpha;part.faded=hidden;colors.needsUpdate=true;}
 }
 state.structureFaded=fadedParts>0;state.fadedParts=fadedParts;state.totalParts=components.length;
}
function resetBounds(rect:Float64Array,n:number):void {
 rect[n]=rect[n+1]=rect[n+4]=Infinity;
 rect[n+2]=rect[n+3]=rect[n+5]=-Infinity;
}
function extend(rect:Float64Array,n:number,p:T.Vector3):void {rect[n]=Math.min(rect[n],p.x);rect[n+1]=Math.min(rect[n+1],p.y);rect[n+2]=Math.max(rect[n+2],p.x);rect[n+3]=Math.max(rect[n+3],p.y);rect[n+4]=Math.min(rect[n+4],p.z);rect[n+5]=Math.max(rect[n+5],p.z);}
function projectActor(body:Body,height:number,camera:T.Camera,point:T.Vector3,rect:Float64Array,n:number):void {
 resetBounds(rect,n);
 for(let sx=-1;sx<=1;sx+=2)for(let sz=-1;sz<=1;sz+=2)for(let top=0;top<2;top++){point.set((body.x+sx*body.radius)/32,top*height,(body.y+sz*body.radius)/32).project(camera);extend(rect,n,point);}
}
function overlapsBodies(bounds:Float64Array,n:number,actors:Float64Array,count:number):boolean {
 for(let i=0;i<count;i++){const a=i*6;if(actors[a+5]>bounds[n+4]&&actors[a]<=bounds[n+2]+.015&&actors[a+2]>=bounds[n]-.015&&actors[a+1]<=bounds[n+3]+.015&&actors[a+3]>=bounds[n+1]-.015)return true;}return false;
}
