import * as T from 'three';
import {expect,it,vi} from 'vitest';
import {configureCinematicLayers,CINEMATIC_LAYER} from './CinematicLayers';
import {SceneLighting} from './SceneLighting';

it('isolates title meshes from retained combat meshes while preserving a fixed light topology',()=>{
 const title=new T.Group(),cast=new T.Group(),world=new T.Group(),combat=new T.Group(),contacts=new T.Mesh(),lighting=new SceneLighting(),muzzle=new T.PointLight();
 const titleMesh=new T.Mesh(),hero=new T.Mesh(),alien=new T.Mesh(),enemy=new T.Mesh(),bullet=new T.Mesh();title.add(titleMesh);cast.add(hero,alien);combat.add(enemy,bullet);
 const camera=new T.PerspectiveCamera();configureCinematicLayers(title,cast,lighting,contacts,muzzle);camera.layers.set(CINEMATIC_LAYER);
 try{
  for(const object of [titleMesh,hero,alien,contacts,lighting.key,lighting.fill,lighting.rim,...lighting.fixtures,lighting.blast,...lighting.pool.lights,muzzle])expect(object.layers.test(camera.layers)).toBe(true);
  for(const object of [world,enemy,bullet])expect(object.layers.test(camera.layers)).toBe(false);
  expect(enemy.visible).toBe(true);expect(combat.children).toHaveLength(2);
  camera.layers.set(0);for(const object of [world,enemy,bullet,lighting.blast,...lighting.pool.lights,contacts,muzzle])expect(object.layers.test(camera.layers)).toBe(true);
  for(const object of [titleMesh,hero,alien])expect(object.layers.test(camera.layers)).toBe(false);
 }finally{lighting.dispose();}
});

it.each([
 ['high',true,16],['low',true,5],['high',false,5],['low',false,3],
] as const)('keeps %s dynamic=%s menu light inventory equal to gameplay while cancelling late combat energy', (tier,dynamicLights,expectedPoints)=>{
 const scene=new T.Scene(),lighting=new SceneLighting(),muzzle=new T.PointLight(0xffffff,0),camera=new T.PerspectiveCamera();
 scene.add(lighting.root,muzzle);
 configureCinematicLayers(new T.Group(),new T.Group(),lighting,new T.Mesh(),muzzle);
 lighting.setQuality(tier,dynamicLights);muzzle.visible=dynamicLights;
 const points=(layer:number)=>{
  camera.layers.set(layer);const result:T.PointLight[]=[];
  scene.traverseVisible(object=>{if(object instanceof T.PointLight&&object.layers.test(camera.layers))result.push(object);});
  return result;
 };
 const shadowDispose=vi.spyOn(lighting.key.shadow,'dispose'),poolDispose=vi.spyOn(lighting.pool,'dispose');
 try{
  const gameplayPoints=points(0);expect(gameplayPoints).toHaveLength(expectedPoints);
  lighting.pool.attach('retained-combat',{x:2,z:3,color:0xffa14c,intensity:14,duration:2});lighting.explosion(2,3,2);
  lighting.setMenu(true);
  expect(lighting.pool.lights.every(light=>light.intensity===0)).toBe(true);expect(lighting.blast.intensity).toBe(0);
  // World VFX can refresh attached sources after menu entry. The final suppression
  // seam must cancel those sources again without hiding slots or changing programs.
  lighting.pool.attach('late-vfx',{x:2,z:3,color:0xff7a2e,intensity:18,duration:2});lighting.explosion(2,3,2);
  if(tier==='high'&&dynamicLights)expect(lighting.pool.lights.some(light=>light.intensity>0)).toBe(true);
  if(dynamicLights)expect(lighting.blast.intensity).toBeGreaterThan(0);
  muzzle.intensity=12;lighting.suppressCombatFeedback(muzzle);lighting.update(.016);
  expect(lighting.pool.lights.every(light=>light.intensity===0)).toBe(true);expect(lighting.blast.intensity).toBe(0);
  expect(points(CINEMATIC_LAYER)).toEqual(gameplayPoints);expect(points(0)).toEqual(gameplayPoints);
  expect(muzzle.intensity).toBe(0);
 }finally{lighting.dispose();lighting.dispose();expect(shadowDispose).toHaveBeenCalledOnce();expect(poolDispose).toHaveBeenCalledOnce();}
});
