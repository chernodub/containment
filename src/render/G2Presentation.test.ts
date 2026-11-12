import {describe,it,expect,vi} from 'vitest';
import * as T from 'three';
import {TitlePresentation,TITLE_STAGE} from './world/TitlePresentation';
import {addExitSignal,updateExitSignal} from './world/ExitSignal';
import {SceneLighting} from './SceneLighting';
import {ROOM_COMPOSITIONS} from './lighting/RoomCompositions';
import {ROOM_STORY_ROUTE} from '../game/roguelike/storyRooms';
import {disposeModel} from './meshParts';

describe('G2 cinematic and room presentation',()=>{
 it.each([16/9,4/3,21/9])('holds the marine on the right with title space at aspect %s',aspect=>{
  const title=new TitlePresentation(),camera=new T.PerspectiveCamera(28,aspect,.1,160);
  title.apply(camera,0,true);const feet=new T.Vector3(23,0,13).project(camera),head=new T.Vector3(23,3.7,13).project(camera);
  expect(feet.x).toBeGreaterThan(.15);expect(head.x).toBeGreaterThan(.15);expect(Math.abs(feet.x)).toBeLessThan(.95);
  expect(feet.y).toBeGreaterThan(-.95);expect(head.y).toBeLessThan(.95);
  expect(title.root.visible).toBe(false);title.dispose();
 });
 it('has deterministic reduced-motion framing and exactly-once set disposal',()=>{
  const title=new TitlePresentation(),camera=new T.PerspectiveCamera(28,16/9);
  title.apply(camera,0,true);const matrix=camera.matrixWorld.clone();title.apply(camera,900,true);expect(camera.matrixWorld.equals(matrix)).toBe(true);
  const disposals:Array<ReturnType<typeof vi.fn>>=[];title.root.traverse(o=>{if(o instanceof T.Mesh){const f=vi.fn();o.geometry.addEventListener('dispose',f);disposals.push(f);}});
  expect(disposals.length).toBeLessThanOrEqual(6);title.dispose();title.dispose();for(const dispose of disposals)expect(dispose).toHaveBeenCalledOnce();
 });
 it('layers a foreground marine against a creature partially hidden between real pod casings',()=>{
  const title=new TitlePresentation(),camera=new T.PerspectiveCamera(28,16/9,.1,160);title.apply(camera,0,true);title.root.visible=true;title.root.updateWorldMatrix(true,true);
  const m=TITLE_STAGE.marine,c=TITLE_STAGE.creature;
  expect(m.z-c.z).toBeGreaterThan(5);expect(m.angle).toBeLessThan(-.9);
  const hero=new T.Vector3(m.x,1.8,m.z).project(camera);expect(hero.x).toBeGreaterThan(.15);expect(hero.x).toBeLessThan(.95);
  const ray=new T.Raycaster();let revealed=0,hidden=0;
  for(const dx of [-1,-.5,0,.5,1])for(const y of [.6,1.4,2.2]){
   const target=new T.Vector3(c.x+dx,y,c.z),distance=camera.position.distanceTo(target);ray.set(camera.position,target.sub(camera.position).normalize());ray.far=distance-.02;
   if(ray.intersectObject(title.root,true).length)hidden++;else revealed++;
  }
  expect(hidden).toBeGreaterThan(0);expect(revealed).toBeGreaterThan(0);expect(hidden).toBeGreaterThan(revealed);
  title.dispose();
 });
 it('authors a finite distinct composition for every story beat',()=>{
  const ideas=new Set<string>();for(const room of ROOM_STORY_ROUTE){const c=ROOM_COMPOSITIONS[room.templateId];expect(c).toBeDefined();expect(c.keyOffset.every(Number.isFinite)).toBe(true);expect(c.keyGain).toBeGreaterThan(.4);expect(c.keyGain).toBeLessThan(2.5);ideas.add(c.idea);}expect(ideas.size).toBe(20);
 });
 it('reuses the same prepared light inventory through menu transitions and boss phases',()=>{
  const rig=new SceneLighting();rig.loadRoom(new T.Group(),45,34,'reactor','reactor-vault');const lights:T.Light[]=[];rig.root.traverse(o=>{if(o instanceof T.Light)lights.push(o);});
  const count=lights.length;rig.setMenu(true);rig.setPlayer(23,13,.42);rig.update(.016);rig.setMenu(false);rig.setBossState(22,17,false,false);
  expect(rig.coreKey.position.y).toBeGreaterThan(rig.coreKey.target.position.y+5);expect(rig.fill.intensity).toBeGreaterThan(.5);const armored=rig.coreKey.intensity;
  rig.setBossState(22,17,true,false);expect(rig.coreKey.intensity).toBe(armored);rig.setBossState(22,17,false,true);expect(rig.coreKey.intensity).toBeGreaterThan(400);
  let after=0;rig.root.traverse(o=>{if(o instanceof T.Light)after++;});expect(after).toBe(count);rig.dispose();
 });
 it('keeps exit guidance flush and freezes only its presentation motion',()=>{
  const exit=new T.Group();addExitSignal(exit);const bounds=new T.Box3().setFromObject(exit);expect(bounds.max.y).toBeLessThan(.08);
  updateExitSignal(exit,3,true,false);const m=exit.userData.signal as T.ShaderMaterial;expect(m.uniforms.exitReady.value).toBe(1);expect(m.uniforms.exitTime.value).toBe(3);
  updateExitSignal(exit,4,false,true);expect(m.uniforms.exitReady.value).toBe(0);expect(m.uniforms.exitTime.value).toBe(0);disposeModel(exit);
 });
});

it('keeps optional domestic task lights supported and leaves the atrium opt-out intact',async()=>{
 const {addInteriorPracticals}=await import('./lighting/InteriorPracticals');
 const world=new T.Group(),solid=new T.Mesh(new T.BoxGeometry(2,1,2),new T.MeshStandardMaterial());solid.position.set(2,.5,2);world.add(solid);
 addInteriorPracticals(world,{obstacles:[{x:32,y:32,width:64,height:64}]},'habitation',true);
 expect(world.userData.lightFixtures).toHaveLength(1);const light=world.userData.lightFixtures[0];expect(light.y).toBeGreaterThan(1);expect(light.x).toBeGreaterThanOrEqual(1);expect(light.x).toBeLessThanOrEqual(3);disposeModel(world);solid.geometry.dispose();(solid.material as T.Material).dispose();
});
