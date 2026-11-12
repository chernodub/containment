import {describe,it,expect,vi} from 'vitest';
import * as T from 'three';
import {TitlePresentation,TITLE_STAGE,styleTitleActor} from './world/TitlePresentation';
import {addExitSignal,updateExitSignal} from './world/ExitSignal';
import {SceneLighting} from './SceneLighting';
import {ROOM_COMPOSITIONS} from './lighting/RoomCompositions';
import {ROOM_STORY_ROUTE} from '../game/roguelike/storyRooms';
import {disposeModel} from './meshParts';
import {actorSurface} from './vfx/ActorSurface';

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
  expect(disposals.length).toBeLessThanOrEqual(7);title.dispose();title.dispose();for(const dispose of disposals)expect(dispose).toHaveBeenCalledOnce();
 });
 it('layers a foreground marine against a creature partially hidden between real pod casings',()=>{
  const title=new TitlePresentation(),camera=new T.PerspectiveCamera(28,16/9,.1,160);title.apply(camera,0,true);title.root.visible=true;title.root.updateWorldMatrix(true,true);
  const m=TITLE_STAGE.marine,c=TITLE_STAGE.creature;
  expect(m.z-c.z).toBeGreaterThan(5);expect(m.angle).toBeLessThan(-.9);
  const hero=new T.Vector3(m.x,1.8,m.z).project(camera);expect(hero.x).toBeGreaterThan(.15);expect(hero.x).toBeLessThan(.95);
  const ray=new T.Raycaster();let revealed=0,hidden=0;
  for(const dx of [-1,-.5,0,.5,1])for(const y of [.6,1.4,2.2]){
   const target=new T.Vector3(c.x+dx,y,c.z),distance=camera.position.distanceTo(target);ray.set(camera.position,target.sub(camera.position).normalize());ray.far=distance-.02;
   if(ray.intersectObject(title.root,true).some(hit=>hit.object!==title.shaft))hidden++;else revealed++;
  }
  expect(hidden).toBeGreaterThan(0);expect(revealed).toBeGreaterThan(0);
  const emergingHead=new T.Vector3(c.x,2.2,c.z).project(camera);expect(emergingHead.x).toBeGreaterThan(.45);expect(emergingHead.x).toBeLessThan(.95);
  title.dispose();
 });
 it('keeps the emergency shaft singular, prepared and disposable without adding title light slots',()=>{
  const title=new TitlePresentation(),camera=new T.PerspectiveCamera(28,16/9);
  const lights:T.Light[]=[],shafts:T.Object3D[]=[];
  title.root.traverse(o=>{if(o instanceof T.Light)lights.push(o);if(o.name==='title-emergency-shaft')shafts.push(o);});
  expect(lights).toHaveLength(0);expect(shafts).toEqual([title.shaft]);
  const material=title.shaft.material,geometry=title.shaft.geometry;
  expect(material.transparent).toBe(true);expect(material.depthTest).toBe(true);expect(material.depthWrite).toBe(false);
  expect(geometry.index!.count/3).toBeLessThanOrEqual(24);
  const vertices=vi.spyOn(geometry,'dispose'),program=vi.spyOn(material,'dispose');
  title.apply(camera,0,true,false);expect(title.shaft.visible).toBe(false);
  title.apply(camera,400,true,true);expect(title.shaft.visible).toBe(true);
  title.dispose();title.dispose();expect(vertices).toHaveBeenCalledOnce();expect(program).toHaveBeenCalledOnce();
 });
 it('applies graphic title values only to the separate cast while preserving shared source materials',()=>{
  for(const friendly of [true,false]){
   const root=new T.Group(),material=new T.MeshStandardMaterial(),gameplay=new T.MeshStandardMaterial();
   actorSurface([material],friendly);actorSurface([gameplay],friendly);
   const geometry=new T.BoxGeometry(),mesh=new T.Mesh(geometry,material);root.add(mesh);
   const originalGameplay=gameplay.customProgramCacheKey();styleTitleActor(root,friendly);
   expect(root.userData.graphicActorBase).toBe(friendly?0x30363b:0x34233b);
   expect(material.customProgramCacheKey()).toContain(':title-graphic-v2');expect(gameplay.customProgramCacheKey()).toBe(originalGameplay);
   const shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};
   material.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms,{} as T.WebGLRenderer);
   if(friendly){
    expect(shader.fragmentShader).not.toContain('titleBodyColor');
    expect(shader.fragmentShader).not.toContain('titlePanel');
    expect(shader.fragmentShader).toContain('outgoingLight=outgoingLight*1.6');
    expect(shader.fragmentShader).toContain('vec3(.04,.095,.125)*titleMarineRim');
   }else{
    expect(shader.fragmentShader).toContain('uniform vec3 titleBodyColor;');
    expect(shader.fragmentShader).toContain('outgoingLight=titleBodyColor*titleTone');
   }
   expect(shader.uniforms).toHaveProperty('actorRimStrength.value',friendly?.075:.08);
   geometry.dispose();material.dispose();gameplay.dispose();
  }
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
