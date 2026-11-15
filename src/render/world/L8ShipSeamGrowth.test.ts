import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {buildL8ShipSeamGrowth} from './L8ShipSeamGrowth';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {SHIP_ARCHITECTURE_PLANS} from '../../game/roguelike/shipArchitectureLayouts';
import {createRoomTemplateGeometry,canOccupyExpedition,canTraverseExpedition} from '../../game/world/expeditionGeometry';
import {clearPolygonTopology} from '../../game/world/polygonGeometry';
import {CameraRig} from '../camera/CameraRig';
import {COMBAT_VIEW_HEIGHT,combatFocusTarget,protectPlayerFrame} from '../camera/CombatFraming';
import {roomFocus} from '../roomFraming';
import {disposeModel} from '../meshParts';
const ids=['infested-workshop','swarm-junction'] as const;
describe('L8 architecture-consumed seam growth',()=>{
 for(const id of ids){const t=ROOM_TEMPLATES[id],plan=SHIP_ARCHITECTURE_PLANS[id]!,g=createRoomTemplateGeometry(t,'growth');
  it(`${id}: every floor triangle is supported and leaves the9m arena clear; raised caps stay in solids`,()=>{
   const root=buildL8ShipSeamGrowth(id,t)!,solids=[...t.obstacles.map(r=>[{x:r.x,y:r.y},{x:r.x+r.width,y:r.y},{x:r.x+r.width,y:r.y+r.height},{x:r.x,y:r.y+r.height}]),...t.voids??[]];
   let floor=0,caps=0,area=0,nearArena=0;
   root.traverse(o=>{if(!(o instanceof T.Mesh))return;const p=o.geometry.getAttribute('position');
    for(let i=0;i<p.count;i+=3){const tri=[0,1,2].map(n=>({x:p.getX(i+n)*32,y:p.getZ(i+n)*32})),heights=[0,1,2].map(n=>p.getY(i+n));
     const samples=[...tri,...[0,1,2].flatMap(n=>[.25,.5,.75].map(s=>({x:tri[n].x+(tri[(n+1)%3].x-tri[n].x)*s,y:tri[n].y+(tri[(n+1)%3].y-tri[n].y)*s}))),{x:tri.reduce((n,p)=>n+p.x,0)/3,y:tri.reduce((n,p)=>n+p.y,0)/3}];
     expect(heights.every(h=>Number.isFinite(h)&&h>=0&&h<=.91001)).toBe(true);
     if(Math.max(...heights)<.022){floor++;expect(Math.max(...heights)).toBeLessThanOrEqual(.02051);
      for(const q of samples){expect(canOccupyExpedition(g,q,0),JSON.stringify(q)).toBe(true);expect(Math.hypot(q.x-plan.arena.x,q.y-plan.arena.y)).toBeGreaterThan(159.99);if(Math.hypot(q.x-plan.arena.x,q.y-plan.arena.y)<340)nearArena++;}
      for(let n=0;n<3;n++)expect(canTraverseExpedition(g,tri[n],tri[(n+1)%3],0)).toBe(true);
      area+=Math.abs((tri[1].x-tri[0].x)*(tri[2].y-tri[0].y)-(tri[1].y-tri[0].y)*(tri[2].x-tri[0].x))/2;
     }else{caps++;for(const q of samples)expect(solids.some(poly=>clearPolygonTopology({boundary:poly},q,q)),JSON.stringify(q)).toBe(true);}
    }
   });expect(floor).toBeGreaterThan(200);expect(caps).toBeGreaterThan(20);expect(nearArena).toBeGreaterThan(100);expect(area).toBeGreaterThan(10000);expect(area/(t.width*t.height)).toBeLessThan(.13);
   expect(root.children).toHaveLength(2);expect(root.userData.triangles).toBeLessThan(12000);
   expect(root.userData.foldedRootCollars.length).toBeGreaterThan(4);expect(root.userData.foldedRootCollars.every((f:{bodyTriangles:number})=>f.bodyTriangles>0)).toBe(true);
   if(id==='infested-workshop'){expect(root.userData.foldedRootCollars.some((f:{source:string})=>f.source==='partition-mouth')).toBe(true);expect(root.userData.paths.some((p:{kind:string})=>p.kind==='aperture-root-cap')).toBe(true);}
   if(process.env.L8_GROWTH_REPORT==='1')process.stdout.write(JSON.stringify({id,draws:root.children.length,triangles:root.userData.triangles,folds:root.userData.foldedRootCollars.length,floorProjectedArea:area,roomRatio:area/(t.width*t.height)})+'\n');
   const foldHeights:number[]=[];root.traverse(o=>{if(o instanceof T.Mesh){const p=o.geometry.getAttribute('position');for(let j=0;j<p.count;j++)if(p.getY(j)>.1&&p.getY(j)<.899)foldHeights.push(p.getY(j));}});expect(foldHeights.length).toBeGreaterThan(200);
   expect(root.userData.paths.filter((p:{kind:string})=>p.kind==='plate-seam').every((p:{width:number})=>p.width===11)).toBe(true);
   const paths=root.userData.paths as {kind:string;points:{x:number;y:number}[]}[];
   expect(paths.filter(p=>p.kind==='door-root')).toHaveLength(4);expect(paths.some(p=>p.kind==='solid-cap')).toBe(true);
   for(const path of paths.filter(p=>p.kind==='plate-seam'))for(const q of path.points){expect(q.x%128).toBe(0);expect(q.y%128).toBe(0);}
   disposeModel(root);
  });
  it(`${id}: clips added thin solids too and preserves deterministic local resources`,()=>{
   const changed={...t,obstacles:[...t.obstacles,{x:380,y:260,width:8,height:480}],voids:[...t.voids??[],[{x:240,y:508},{x:272,y:508},{x:272,y:512},{x:240,y:512}]]},cg=createRoomTemplateGeometry(changed,'clip'),before=JSON.stringify(changed),a=buildL8ShipSeamGrowth(id,changed)!,b=buildL8ShipSeamGrowth(id,changed)!;
   const resources:number[]=[],materials:number[]=[];
   for(const [i,o]of a.children.entries()){const mesh=o as T.Mesh,other=b.children[i] as T.Mesh;expect([...mesh.geometry.getAttribute('position').array]).toEqual([...other.geometry.getAttribute('position').array]);resources.push(0);materials.push(0);mesh.geometry.addEventListener('dispose',()=>resources[i]++);(mesh.material as T.Material).addEventListener('dispose',()=>materials[i]++);
    const p=mesh.geometry.getAttribute('position');for(let n=0;n<p.count;n++)if(p.getY(n)<.022)expect(canOccupyExpedition(cg,{x:p.getX(n)*32,y:p.getZ(n)*32},0)).toBe(true);
   }expect(JSON.stringify(changed)).toBe(before);disposeModel(a);expect(resources).toEqual([1,1]);expect(materials).toEqual([1,1]);disposeModel(b);
  });
  it(`${id}: actual follow-camera rays keep marine body corners unobscured`,()=>{
   const root=buildL8ShipSeamGrowth(id,t)!;root.updateMatrixWorld(true);const camera=new T.PerspectiveCamera(28,16/9,.1,160),rig=new CameraRig(),desired=new T.Vector3(),scratch=new T.Vector3(),target=new T.Vector3(),ray=new T.Raycaster();
   for(const mark of [t.spawn,plan.arena,...plan.spaces.map(s=>s.anchor)]){
    const x=mark.x/32,z=mark.y/32;combatFocusTarget(x,z,0,0,0,false,false,desired);const focus=roomFocus(desired.x,desired.z,t.width/32,t.height/32,COMBAT_VIEW_HEIGHT*16/9,COMBAT_VIEW_HEIGHT,id);rig.reset(focus.x,focus.z);rig.apply(camera,1,COMBAT_VIEW_HEIGHT,0);protectPlayerFrame(camera,rig.focus,x,z,.5,2.05,scratch,target);
    for(const dx of [-.5,.5])for(const dz of [-.5,.5])for(const y of [.05,2.05]){const corner=new T.Vector3(x+dx,y,z+dz);ray.set(camera.position,corner.clone().sub(camera.position).normalize());ray.far=camera.position.distanceTo(corner)-.001;expect(ray.intersectObject(root,true),JSON.stringify({id,mark,dx,dz,y})).toEqual([]);}
   }disposeModel(root);
  });
 }
 it('leaves legacy geometry, noninfested rooms and fatal-story display rooms untouched',()=>{
  for(const id of ['awakening-bay','diagnostic-gallery','safety-interlock-station','manual-control-chamber','reactor-vault'] as const)expect(buildL8ShipSeamGrowth(id,ROOM_TEMPLATES[id])).toBeNull();
  expect(buildL8ShipSeamGrowth('infested-workshop',{...ROOM_TEMPLATES['infested-workshop'],boundary:undefined})).toBeNull();
  expect(buildL8ShipSeamGrowth('swarm-junction',{...ROOM_TEMPLATES['swarm-junction'],boundary:undefined})).toBeNull();
 });
});
