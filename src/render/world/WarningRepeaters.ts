import * as T from 'three';
import type {RoomTemplate} from '../../game/roguelike/types';
import {SHIP_ARCHITECTURE_PLANS} from '../../game/roguelike/shipArchitectureLayouts';

const BOARD_HEIGHT=5.8,BOARD_DEPTH=1.2;
export const WARNING_FRAME_LOWEST=BOARD_HEIGHT-BOARD_DEPTH/2-.0225;
export const WARNING_REPEATER_ROOMS=new Set(['diagnostic-gallery','safety-interlock-station','manual-control-chamber']);
type Writer={box:(m:T.Material,x:number,y:number,z:number,w:number,h:number,d:number,rotation?:number)=>void;pipe:(m:T.Material,a:T.Vector3,b:T.Vector3,r:number)=>void;add:(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number)=>void};
type Finishes={structure:T.MeshStandardMaterial;screen:T.MeshStandardMaterial;signal:T.MeshStandardMaterial;case:T.Material;metal:T.Material;recess:T.Material};
type Body={x:number;y:number;radius:number};
type NativeBody=Body&{id:number};
type Model={height:number;root?:T.Object3D};
type Display={center:number[];corners:number[][];normal:number[];support:{x:number;y:number;width:number;height:number};mount:string};
const EMPTY:readonly NativeBody[]=Object.freeze([]);
/** A pair of physical, ceiling-supported warning boards. Masts stand on the
 * actual recorder/control cabinet; the entire cross-room span clears champions.
 * Manufactured structure and actor-aware text/structure cutaways preserve silhouettes. */
export function addWarningRepeaters(world:T.Group,root:T.Group,t:RoomTemplate,id:string,w:Writer,m:Finishes):void {
 const plan=SHIP_ARCHITECTURE_PLANS[id as keyof typeof SHIP_ARCHITECTURE_PLANS];if(!plan||!WARNING_REPEATER_ROOMS.has(id))return;
 const r=t.obstacles[0];if(!r)throw Error('Warning gantry has no recorder/control support');
 const source=new T.Vector3((r.x+r.width/2)/32,0,(r.y+r.height*.5)/32),ray=new T.Raycaster(new T.Vector3(source.x,20,source.z),new T.Vector3(0,-1,0));world.updateMatrixWorld(true);
 const support=ray.intersectObject(world,true).find(hit=>hit.point.y>.2);if(!support)throw Error('Warning gantry support has no physical cabinet roof');
 source.y=support.point.y;
 const height=BOARD_HEIGHT,panelHeight=BOARD_DEPTH,width=3.6,ceiling=6.8,forward=height*19/26*32;
 const centers=[{x:t.spawn.x+220,z:t.spawn.y+forward},{x:plan.arena.x+48,z:plan.arena.y+forward}];
 if(Math.hypot(centers[0].x-centers[1].x,centers[0].z-centers[1].z)<170)centers.splice(0,1);
 const headerZ=Math.min(...centers.map(p=>p.z))/32-.70,routeX=source.x;
 const structural=m.structure;structural.color.setHex(id==='manual-control-chamber'?0x71675a:0x64747a);structural.metalness=.65;structural.roughness=.62;structural.transparent=true;structural.opacity=.72;structural.depthWrite=false;structural.userData.warningCutaway=true;
 const components:Array<{kind:string;min:number[];max:number[]}>=[];
 const beam=(kind:string,x:number,y:number,z:number,bw:number,bh:number,bd:number)=>{
  w.box(structural,x,y,z,bw,bh,bd);components.push({kind,min:[x-bw/2,y-bh/2,z-bd/2],max:[x+bw/2,y+bh/2,z+bd/2]});
 };
 const tray=(a:T.Vector3,b:T.Vector3)=>{
  const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);if(length<.01)return;
  const alongX=Math.abs(dx)>Math.abs(dz),x=(a.x+b.x)/2,z=(a.z+b.z)/2;
  beam('service-tray-web',x,ceiling,z,alongX?length:.38,.12,alongX?.38:length);
  for(const side of [-1,1])beam('service-tray-flange',x+(alongX?0:side*.22),ceiling+.15,z+(alongX?side*.22:0),alongX?length:.055,.24,alongX?.055:length);
  const count=Math.max(1,Math.ceil(length/.70));for(let j=0;j<count;j++){const f=(j+.5)/count;beam('tray-cross-rib',a.x+dx*f,ceiling+.20,a.z+dz*f,alongX?.045:.46,.055,alongX?.46:.045);}
 };
 m.screen.transparent=true;m.screen.opacity=.96;m.screen.depthWrite=false;
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
   w.box(m.metal,px,.66,near-.008,Math.min(.42,pitch*.5),.035,.012);
   w.box(m.recess,px,.33,near-.009,pitch*.55,.13,.014);
   for(let slot=0;slot<3;slot++)w.box(m.metal,px+(slot-1)*.11,.34,near-.001,.024,.09,.008);
  }
  // A continuous instrument well and matched load rails, inside the same bay.
  for(const side of[-1,1])w.box(m.metal,cx+side*cw/2,.42,near-.20,.065,.78,.39);
  if(i===0){
   const sw=Math.min(3.24,cw-.25),sh=.58;
   w.box(m.recess,cx,.46,near-.035,sw+.13,sh+.12,.045);
   w.add(new T.PlaneGeometry(sw,sh),m.screen,cx,.46,near-.008);
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
 const route=[new T.Vector3(source.x,ceiling,source.z),new T.Vector3(routeX,ceiling,source.z),new T.Vector3(routeX,ceiling,headerZ)];
 for(let i=1;i<route.length;i++)tray(route[i-1],route[i]);
 const left=Math.min(routeX,...centers.map(p=>p.x/32-width*.5)),right=Math.max(routeX,...centers.map(p=>p.x/32+width*.5));tray(new T.Vector3(left,ceiling,headerZ),new T.Vector3(right,ceiling,headerZ));
 const displays:Display[]=[];
 for(const center of centers){
  const x=center.x/32,z=center.z/32;
  for(const side of[-1,1]){
   const px=x+side*width*.49;
   beam('display-bracket-run',px,ceiling,(headerZ+z-.18)/2,.08,.10,z-.18-headerZ);
   beam('display-hanger',px,(ceiling+height+panelHeight/2)/2,z-.18,.09,ceiling-height-panelHeight/2,.11);
   beam('display-side-casing',px,height,z,.085,panelHeight,.20);
  }
  beam('display-back-casing',x,height,z,width,panelHeight,.12);beam('display-top-casing',x,height+panelHeight/2,z,width,.045,.20);beam('display-lower-casing',x,height-panelHeight/2,z,width,.045,.20);
  for(const side of[-1,1])beam('display-cable-entry',x+side*(width/2+.06),height+.32,z-.015,.20,.26,.18);
  w.add(new T.PlaneGeometry(width*.9,panelHeight*.8),m.screen,x,height,z+.067);
  displays.push({center:[x,height,z+.067],corners:[[-.45,-.4],[.45,-.4],[.45,.4],[-.45,.4]].map(([dx,dy])=>[x+dx*width,height+dy*panelHeight,z+.067]),normal:[0,0,1],support:{...r},mount:'physical-overhead-repeater'});
 }
 // The actual low console/projector remains the light source; the overhead
 // board never turns the reactor key into a ceiling spotlight.
 w.box(m.signal,source.x,source.y+.045,source.z,.28,.06,.14);
 root.userData.lightFixtures=[{x:source.x,y:source.y+.08,z:source.z,color:m.signal.emissive.getHex(),nativeColor:true,poolStyle:1,poolWidth:.35,poolDepth:5}];
 root.userData.warningStructure=components;root.userData.storyDisplays=displays;root.userData.storyDisplay=displays[0];root.userData.warningSupports=supports;root.userData.warningClearance=WARNING_FRAME_LOWEST;
 root.userData.warningVisibility={material:m.screen,structure:structural,point:new T.Vector3(),structureBounds:new Float64Array(components.length*4),screenBounds:new Float64Array(displays.length*4),actorBounds:new Float64Array(4),faded:false,normalOpacity:.96};
}

/** Opacity-only cutaway. Every native body corner participates; no transforms,
 * resources, uniforms layouts or material defines change during combat. */
export function updateWarningRepeaterVisibility(root:T.Object3D,camera?:T.Camera,marine?:Body,marineHeight=2.05,enemies:readonly NativeBody[]=EMPTY,models?:ReadonlyMap<number,Model>):void {
 const state=root.userData.warningVisibility,displays=root.userData.storyDisplays as Display[]|undefined;if(!state||!displays||!camera||!marine)return;
 const point=state.point as T.Vector3,screen=state.screenBounds as Float64Array,actor=state.actorBounds as Float64Array;let fade=false;
 for(let i=0;i<displays.length;i++){
  let left=Infinity,top=-Infinity,right=-Infinity,bottom=Infinity;
  for(const corner of displays[i].corners){point.fromArray(corner).applyMatrix4(root.matrixWorld).project(camera);left=Math.min(left,point.x);right=Math.max(right,point.x);top=Math.max(top,point.y);bottom=Math.min(bottom,point.y);}
  const n=i*4;screen[n]=left;screen[n+1]=bottom;screen[n+2]=right;screen[n+3]=top;
 }
 fade=obscuresActor(marine,marineHeight,camera,point,screen,actor,displays.length);
 for(let i=0;!fade&&i<enemies.length;i++){const enemy=enemies[i],model=models?.get(enemy.id);if(model?.root?.visible===false)continue;fade=obscuresActor(enemy,model?.height??4.7,camera,point,screen,actor,displays.length);}
 state.faded=fade;(state.material as T.MeshStandardMaterial).opacity=fade?.04:state.normalOpacity;
 const components=root.userData.warningStructure as {min:number[];max:number[]}[],structure=state.structureBounds as Float64Array;
 for(let i=0;i<components.length;i++){
  const part=components[i],n=i*4;structure[n]=structure[n+1]=Infinity;structure[n+2]=structure[n+3]=-Infinity;
  for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++){
   point.set(x?part.max[0]:part.min[0],y?part.max[1]:part.min[1],z?part.max[2]:part.min[2]).applyMatrix4(root.matrixWorld).project(camera);
   structure[n]=Math.min(structure[n],point.x);structure[n+1]=Math.min(structure[n+1],point.y);structure[n+2]=Math.max(structure[n+2],point.x);structure[n+3]=Math.max(structure[n+3],point.y);
  }
 }
 let structuralFade=obscuresActor(marine,marineHeight,camera,point,structure,actor,components.length);
 for(let i=0;!structuralFade&&i<enemies.length;i++){const enemy=enemies[i],model=models?.get(enemy.id);if(model?.root?.visible===false)continue;structuralFade=obscuresActor(enemy,model?.height??4.7,camera,point,structure,actor,components.length);}
 state.structureFaded=structuralFade;(state.structure as T.MeshStandardMaterial).opacity=structuralFade?.055:.72;
}

function obscuresActor(body:Body,height:number,camera:T.Camera,point:T.Vector3,screen:Float64Array,actor:Float64Array,count:number):boolean {
 actor[0]=actor[1]=Infinity;actor[2]=actor[3]=-Infinity;
 for(let sx=-1;sx<=1;sx+=2)for(let sz=-1;sz<=1;sz+=2)for(let top=0;top<2;top++){
  point.set((body.x+sx*body.radius)/32,top*height,(body.y+sz*body.radius)/32).project(camera);
  actor[0]=Math.min(actor[0],point.x);actor[1]=Math.min(actor[1],point.y);actor[2]=Math.max(actor[2],point.x);actor[3]=Math.max(actor[3],point.y);
 }
 for(let i=0;i<count;i++){const n=i*4;if(actor[0]<=screen[n+2]+.015&&actor[2]>=screen[n]-.015&&actor[1]<=screen[n+3]+.015&&actor[3]>=screen[n+1]-.015)return true;}
 return false;
}
