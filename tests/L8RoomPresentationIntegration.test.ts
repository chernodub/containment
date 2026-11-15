import {describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {DepthRenderer} from '../src/render/DepthRenderer';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {generateRun} from '../src/game/roguelike/run';
import {shipArchitectureRoom} from '../src/render/world/ShipArchitectureRoom';
import {ACT3_PRESENTATION_ROOMS} from '../src/render/world/Act3ShipPresentation';
import {disposeModel} from '../src/render/meshParts';
const nodes=generateRun(1729,3).nodes;
function count(root:T.Object3D,name:string){let n=0;root.traverse(o=>{if(o.name===name)n++;});return n;}
function room(id:string){return DepthRenderer.prototype['buildRoomArchitecture'].call(Object.create(DepthRenderer.prototype),nodes.find(n=>n.templateId===id)!,ROOM_TEMPLATES[id as keyof typeof ROOM_TEMPLATES])!;}

describe('L8 architecture presentation dispatch',()=>{
 it.each([...ACT3_PRESENTATION_ROOMS])('%s attaches Act3 exactly once and suppresses duplicate generic obstacles',id=>{
  const root=room(id);expect(count(root,'l8-act3-presentation')).toBe(1);
  if(id!=='service-shaft-landing')expect(count(root,'l8-equipment')).toBe(0);
  let fixtures=0;root.traverse(o=>{for(const f of o.userData.lightFixtures??[]){expect(f.poolStyle).toBe(1);fixtures++;}});expect(fixtures).toBeGreaterThanOrEqual(2);disposeModel(root);
 });
 it.each(['swarm-junction','shielding-gate','manual-control-chamber','containment-annulus','overload-floor'])('%s retains exactly one Act4 helper and source ownership',id=>{
  const root=room(id);expect(count(root,'act4-function-architecture')).toBe(1);
  if(id==='shielding-gate')for(const name of ['shielding-gate-west','shielding-gate-backing','shielding-gate-east'])expect(count(root,name)).toBe(1);
  if(id==='manual-control-chamber')for(const i of[0,1,2])expect(count(root,'manual-control-blockout-'+i)).toBe(1);
  if(id==='containment-annulus')expect(root.userData.coreOffset).toEqual({x:200,y:80});
  if(id==='overload-floor')expect(root.userData.hotCore).toMatchObject({x:700/32,z:510/32});disposeModel(root);
 });
 it('fits the manual observation shell to the actual northern hull span',()=>{
  const t=ROOM_TEMPLATES['manual-control-chamber'],root=room(t.id),shell=root.getObjectByName('manual-control-template-observation')!;expect(shell).toBeDefined();
  const north=t.boundary!.filter(p=>p.y===Math.min(...t.boundary!.map(q=>q.y))),bounds=new T.Box3().setFromObject(shell,true);
  expect(bounds.min.x).toBeGreaterThanOrEqual(Math.min(...north.map(p=>p.x))/32-1e-5);expect(bounds.max.x).toBeLessThanOrEqual(Math.max(...north.map(p=>p.x))/32+1e-5);
  expect(count(root,'armored-observation-recess')).toBe(1);disposeModel(root);
 });
 it('retains all shaft source transforms and explicit fixture metadata through flattening',()=>{
  const root=room('service-shaft-landing'),expected:{x:number;y:number;z:number;poolStyle:number}[]=[];root.updateMatrixWorld(true);
  root.traverse(o=>{for(const f of o.userData.lightFixtures??[]){const p=new T.Vector3(f.x,f.y,f.z).applyMatrix4(o.matrixWorld);expected.push({...f,x:p.x,y:p.y,z:p.z});}});
  const meshes:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)meshes.push(o);});const before=new T.Box3().setFromObject(root,true),world=new T.Group(),bakeWorld=vi.fn();
  DepthRenderer.prototype['appendShaftArchitecture'].call({world,bakeWorld} as unknown as DepthRenderer,root);
  expect(bakeWorld).toHaveBeenCalledTimes(1);expect(world.children.length).toBe(meshes.length);expect(world.userData.lightFixtures).toEqual(expected);const after=new T.Box3().setFromObject(world,true);expect(after.min.distanceTo(before.min)).toBeLessThan(1e-5);expect(after.max.distanceTo(before.max)).toBeLessThan(1e-5);disposeModel(world);
 });
 it.each(['swarm-junction','shielding-gate','manual-control-chamber'])('%s emits explicit architecture-shaped fixtures',id=>{
  const root=shipArchitectureRoom(id,ROOM_TEMPLATES[id as keyof typeof ROOM_TEMPLATES])!;expect(root.userData.lightFixtures.length).toBeGreaterThan(2);
  for(const f of root.userData.lightFixtures){expect(f.poolStyle).toBe(1);expect(f.poolWidth).toBeLessThanOrEqual(.4);expect(Number.isFinite(f.poolAngle)).toBe(true);}disposeModel(root);
 });
});
