import * as T from 'three';
import type {RoomTemplate} from '../../game/roguelike/types';
import {SHIP_ARCHITECTURE_PLANS} from '../../game/roguelike/shipArchitectureLayouts';

const BOARD_HEIGHT=5.8,BOARD_DEPTH=1.2;
export const WARNING_FRAME_LOWEST=BOARD_HEIGHT-BOARD_DEPTH/2-.0225;
export const WARNING_REPEATER_ROOMS=new Set(['diagnostic-gallery','safety-interlock-station','manual-control-chamber']);
type Writer={box:(m:T.Material,x:number,y:number,z:number,w:number,h:number,d:number,rotation?:number)=>void;pipe:(m:T.Material,a:T.Vector3,b:T.Vector3,r:number)=>void;add:(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number)=>void};
type Finishes={structure:T.MeshStandardMaterial;screen:T.MeshStandardMaterial;signal:T.MeshStandardMaterial};
type Body={x:number;y:number;radius:number};
type NativeBody=Body&{id:number};
type Model={height:number;root?:T.Object3D};
type Display={center:number[];corners:number[][];normal:number[];support:{x:number;y:number;width:number;height:number};mount:string};
const EMPTY:readonly NativeBody[]=Object.freeze([]);
/** A pair of physical, ceiling-supported warning boards. Masts stand on the
 * actual recorder/control cabinet; the entire cross-room span clears champions.
 * Faint cutaway structure and actor-aware text fading preserve body silhouettes. */
export function addWarningRepeaters(world:T.Group,root:T.Group,t:RoomTemplate,id:string,w:Writer,m:Finishes):void {
 const plan=SHIP_ARCHITECTURE_PLANS[id as keyof typeof SHIP_ARCHITECTURE_PLANS];if(!plan||!WARNING_REPEATER_ROOMS.has(id))return;
 const r=t.obstacles[id==='manual-control-chamber'?2:0];if(!r)throw Error('Warning gantry has no recorder/control support');
 const source=new T.Vector3((r.x+r.width/2)/32,0,(r.y+r.height*.5)/32),ray=new T.Raycaster(new T.Vector3(source.x,20,source.z),new T.Vector3(0,-1,0));world.updateMatrixWorld(true);
 const support=ray.intersectObject(world,true).find(hit=>hit.point.y>.2);if(!support)throw Error('Warning gantry support has no physical cabinet roof');
 source.y=support.point.y;
 const height=BOARD_HEIGHT,panelHeight=BOARD_DEPTH,width=3.6,ceiling=6.8,forward=height*19/26*32;
 const centers=[{x:t.spawn.x+220,z:t.spawn.y+forward},{x:plan.arena.x+48,z:plan.arena.y+forward}];
 if(Math.hypot(centers[0].x-centers[1].x,centers[0].z-centers[1].z)<170)centers.splice(0,1);
 const headerZ=Math.min(...centers.map(p=>p.z))/32-.70,routeX=id==='manual-control-chamber'?(t.width-130)/32:source.x;
 const structural=m.structure;structural.transparent=true;structural.opacity=.14;structural.depthWrite=false;structural.userData.warningCutaway=true;
 m.screen.transparent=true;m.screen.opacity=.96;m.screen.depthWrite=false;
 const supports=[];
 for(const side of[-1,1]){
  const x=source.x+side*Math.min(.8,r.width/32*.25),foot=new T.Vector3(x,source.y,source.z),top=new T.Vector3(x,ceiling,source.z);
  w.pipe(structural,foot,top,.065);w.box(structural,x,source.y+.07,source.z,.27,.14,.27);supports.push({x:x*32,y:source.z*32,roof:source.y});
 }
 // A continuous cable tray and return rail connect the real case to the
 // repeated displays. The aft control desk routes around the east side so
 // a low opaque tray never crosses the warning's reading sightline.
 const route=[new T.Vector3(source.x,ceiling,source.z),new T.Vector3(routeX,ceiling,source.z),new T.Vector3(routeX,ceiling,headerZ)];
 for(let i=1;i<route.length;i++)if(route[i].distanceTo(route[i-1])>.01){w.pipe(structural,route[i-1],route[i],.075);w.pipe(structural,route[i-1].clone().add(new T.Vector3(0,.16,0)),route[i].clone().add(new T.Vector3(0,.16,0)),.035);}
 const left=Math.min(routeX,...centers.map(p=>p.x/32-width*.5)),right=Math.max(routeX,...centers.map(p=>p.x/32+width*.5));w.box(structural,(left+right)/2,ceiling,headerZ,right-left,.14,.22);
 const displays:Display[]=[];
 for(const center of centers){
  const x=center.x/32,z=center.z/32;
  for(const side of[-1,1]){
   const px=x+side*width*.49;w.pipe(structural,new T.Vector3(px,ceiling,headerZ),new T.Vector3(px,ceiling,z-.18),.04);w.pipe(structural,new T.Vector3(px,ceiling,z-.18),new T.Vector3(px,height+panelHeight/2,z-.18),.04);
   w.box(structural,px,height,z,.045,panelHeight,.16);
  }
  w.box(structural,x,height,z,width,panelHeight,.12);w.box(structural,x,height+panelHeight/2,z,width,.045,.16);w.box(structural,x,height-panelHeight/2,z,width,.045,.16);
  w.add(new T.PlaneGeometry(width*.9,panelHeight*.8),m.screen,x,height,z+.067);
  displays.push({center:[x,height,z+.067],corners:[[-.45,-.4],[.45,-.4],[.45,.4],[-.45,.4]].map(([dx,dy])=>[x+dx*width,height+dy*panelHeight,z+.067]),normal:[0,0,1],support:{...r},mount:'physical-overhead-repeater'});
 }
 // The actual low console/projector remains the light source; the overhead
 // board never turns the reactor key into a ceiling spotlight.
 w.box(m.signal,source.x,source.y+.045,source.z,.28,.06,.14);
 root.userData.lightFixtures=[{x:source.x,y:source.y+.08,z:source.z,color:m.signal.emissive.getHex(),nativeColor:true,poolStyle:1,poolWidth:.35,poolDepth:5}];
 root.userData.storyDisplays=displays;root.userData.storyDisplay=displays[0];root.userData.warningSupports=supports;root.userData.warningClearance=WARNING_FRAME_LOWEST;
 root.userData.warningVisibility={material:m.screen,point:new T.Vector3(),screenBounds:new Float64Array(displays.length*4),actorBounds:new Float64Array(4),faded:false,normalOpacity:.96};
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
