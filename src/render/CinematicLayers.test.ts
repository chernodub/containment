import * as T from 'three';
import {expect,it} from 'vitest';
import {configureCinematicLayers,CINEMATIC_LAYER} from './CinematicLayers';
import {SceneLighting} from './SceneLighting';
it('isolates title meshes and motivated keys from retained combat meshes and flashes',()=>{
 const title=new T.Group(),cast=new T.Group(),world=new T.Group(),combat=new T.Group(),contacts=new T.Mesh(),lighting=new SceneLighting();
 const titleMesh=new T.Mesh(),hero=new T.Mesh(),alien=new T.Mesh(),enemy=new T.Mesh(),bullet=new T.Mesh();title.add(titleMesh);cast.add(hero,alien);combat.add(enemy,bullet);
 const camera=new T.PerspectiveCamera();configureCinematicLayers(title,cast,lighting,contacts);camera.layers.set(CINEMATIC_LAYER);
 try{
  for(const object of [titleMesh,hero,alien,contacts,lighting.key,lighting.fill,lighting.rim,...lighting.fixtures])expect(object.layers.test(camera.layers)).toBe(true);
  for(const object of [world,enemy,bullet,lighting.blast,...lighting.pool.lights])expect(object.layers.test(camera.layers)).toBe(false);
  expect(enemy.visible).toBe(true);expect(combat.children).toHaveLength(2);
  camera.layers.set(0);for(const object of [world,enemy,bullet,lighting.blast,...lighting.pool.lights,contacts])expect(object.layers.test(camera.layers)).toBe(true);
  for(const object of [titleMesh,hero,alien])expect(object.layers.test(camera.layers)).toBe(false);
 }finally{lighting.dispose();}
});
