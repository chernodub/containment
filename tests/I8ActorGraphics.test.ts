import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {registerGeometry,GEOMETRY_CLASSES} from '../src/render/post/GeometryBuffer';
import {actorSurface} from '../src/render/vfx/ActorSurface';

function actorColor(name:string,kind:number):T.Color {
 const root=new T.Group(),material=new T.MeshStandardMaterial(),geometry=new T.BoxGeometry();
 root.name=name;root.add(new T.Mesh(geometry,material));actorSurface([material],name==='marine');
 registerGeometry(root,kind as typeof GEOMETRY_CLASSES.marine);
 const shader={vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader,uniforms:{} as Record<string,{value:unknown}>};
 material.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms,{} as T.WebGLRenderer);
 const color=(shader.uniforms.graphicActorBase.value as T.Color).clone();
 geometry.dispose();material.dispose();return color;
}

describe('I8 deliberate actor values',()=>{
 it('keeps graphite marine below pale armor and separates family hue/value without texture tint',()=>{
  const marine=actorColor('marine',GEOMETRY_CLASSES.marine),crawler=actorColor('alien-crawler',GEOMETRY_CLASSES.enemy);
  const brute=actorColor('alien-brute',GEOMETRY_CLASSES.enemy),spitter=actorColor('alien-spitter',GEOMETRY_CLASSES.enemy);
  const stalker=actorColor('alien-stalker',GEOMETRY_CLASSES.enemy),carrier=actorColor('alien-carrier',GEOMETRY_CLASSES.enemy);
  const luma=(c:T.Color)=>c.r*.2126+c.g*.7152+c.b*.0722;
  expect(luma(marine)).toBeLessThan(.08);expect(luma(brute)).toBeGreaterThan(luma(marine)*4);
  expect(crawler.r).toBeGreaterThan(crawler.g*2);expect(spitter.g).toBeGreaterThan(spitter.r*1.6);
  expect(stalker.b).toBeGreaterThan(stalker.r*2);expect(luma(stalker)).toBeLessThan(luma(brute)*.25);
  expect(carrier.r).toBeGreaterThan(carrier.g*2);expect(carrier.b).toBeGreaterThan(carrier.g*1.6);
 });
});
