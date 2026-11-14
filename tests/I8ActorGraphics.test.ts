import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {registerGeometry,GEOMETRY_CLASSES} from '../src/render/post/GeometryBuffer';
import {FAMILY_IDENTITY,ENEMY_BODY_COLORS} from '../src/render/ActorIdentity';
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
  expect(luma(marine)).toBeLessThan(.08);
  // Each family retains a dark articulated body below its authored armor,
  // without requiring a saturated primary hue or a pale Brute cape.
  expect(luma(brute)).toBeLessThan(luma(new T.Color(FAMILY_IDENTITY.brute))*.5);
  const colors=[crawler,brute,spitter,stalker,carrier];
  expect(new Set(colors.map(c=>c.getHex())).size).toBe(5);
  for(const [family,color] of Object.entries(ENEMY_BODY_COLORS)){
    const actual=actorColor('alien-'+family,GEOMETRY_CLASSES.enemy);
    expect(actual.getHex()).toBe(color);expect(luma(actual)).toBeLessThan(.08);
  }

 });
});
