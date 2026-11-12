import { describe, it, expect } from 'vitest';
import { Group, Mesh, MeshStandardMaterial, BoxGeometry, ShaderLib, ShaderMaterial, Vector2 } from 'three';
import { GEOMETRY_CLASSES, registerGeometry } from '../src/render/post/GeometryBuffer';

function compiled(material: MeshStandardMaterial | ShaderMaterial) {
 const shader={vertexShader:ShaderLib.standard.vertexShader,fragmentShader:ShaderLib.standard.fragmentShader,uniforms:{}};
 material.onBeforeCompile(shader as never,{} as never);return shader;
}
describe('shared MRT geometry contract',()=>{
 it('keeps every skin of one rig at the same identity and overlapping rigs distinct without program variants',()=>{
  const root=new Group(),other=new Group(),geometry=new BoxGeometry();
  const materials=[new MeshStandardMaterial(),new MeshStandardMaterial(),new MeshStandardMaterial()];
  root.add(new Mesh(geometry,materials[0]),new Mesh(geometry,materials[1]));other.add(new Mesh(geometry,materials[2]));
  registerGeometry(root,GEOMETRY_CLASSES.enemy);registerGeometry(other,GEOMETRY_CLASSES.enemy);
  const shaders=materials.map(compiled),id=shaders.map(s=>(s.uniforms as Record<string,{value:Vector2}>).containmentIdentity.value);
  expect(id[0].equals(id[1])).toBe(true);expect(id[0].x).not.toBe(id[2].x);expect(id[0].y).toBe(GEOMETRY_CLASSES.enemy);
  expect(materials[0].customProgramCacheKey()).toBe(materials[2].customProgramCacheKey());
  const version=materials[0].version;registerGeometry(root,GEOMETRY_CLASSES.elite);expect(materials[0].version).toBe(version);
  expect(id[0].y).toBe(GEOMETRY_CLASSES.elite);geometry.dispose();materials.forEach(m=>m.dispose());
 });
 it('chains actor discard and handles retained material hook copies exactly once',()=>{
  const material=new MeshStandardMaterial();material.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nif(diffuseColor.r<.01)discard;');};
  const geometry=new BoxGeometry(),root=new Group();root.add(new Mesh(geometry,material));registerGeometry(root,GEOMETRY_CLASSES.marine);
  const copy=material.clone();copy.onBeforeCompile=material.onBeforeCompile;copy.customProgramCacheKey=material.customProgramCacheKey;
  const proxy=new Group();proxy.add(new Mesh(geometry,copy));registerGeometry(proxy);
  const shader=compiled(copy);expect(shader.fragmentShader.match(/out highp vec4 containmentGeometry/g)).toHaveLength(1);expect(shader.fragmentShader).toContain('if(diffuseColor.r<.01)discard;');
  expect(shader.fragmentShader).toContain('normalize(vNormal)');geometry.dispose();material.dispose();copy.dispose();
 });
 it('writes exclusion for effect programs instead of assigning actor or world contour IDs',()=>{
  const material=new ShaderMaterial({vertexShader:'void main(){gl_Position=vec4(position,1.);}',fragmentShader:'void main(){if(true){gl_FragColor=vec4(1.);}}'}),geometry=new BoxGeometry(),root=new Group();root.add(new Mesh(geometry,material));registerGeometry(root);
  const shader={vertexShader:material.vertexShader,fragmentShader:material.fragmentShader,uniforms:{}};material.onBeforeCompile(shader as never,{} as never);
  expect(shader.fragmentShader).toContain('containmentGeometry=vec4(0.0,0.0,0.0,clamp(gl_FragColor.a,0.0,1.0))');expect(shader.fragmentShader).not.toContain('containmentIdentity');geometry.dispose();material.dispose();
 });
});

describe('MRT draw-buffer isolation',()=>{
 it('preserves normals/IDs behind transparent effects and restores writes for the next solid draw',()=>{
  const surface=new MeshStandardMaterial(),effect=new ShaderMaterial({transparent:true});
  const root=new Group(),geometry=new BoxGeometry();root.add(new Mesh(geometry,surface),new Mesh(geometry,effect));registerGeometry(root);
  const calls:number[][]=[],target={textures:[{}, {name:'Containment geometry normal + identity'}]},renderer={getRenderTarget:()=>target,getContext:()=>({drawBuffers:(values:number[])=>calls.push([...values])}),info:{render:{frame:1}}};
  const draw=(material:MeshStandardMaterial|ShaderMaterial)=>material.onBeforeRender(renderer as never,{} as never,{} as never,geometry,root as never,{} as never);
  draw(surface);draw(surface);draw(effect);draw(effect);draw(surface);
  expect(calls).toEqual([[0x8ce0,0x8ce1],[0x8ce0,0],[0x8ce0,0x8ce1]]);
  renderer.info.render.frame++;draw(surface);expect(calls).toHaveLength(4);
  geometry.dispose();surface.dispose();effect.dispose();
 });
 it('excludes opaque affliction droplets from actor and world classification',()=>{
  const root=new Group();root.name='shared-affliction-batches';const material=new MeshStandardMaterial(),geometry=new BoxGeometry();root.add(new Mesh(geometry,material));registerGeometry(root);
  const shader=compiled(material);expect(shader.fragmentShader).not.toContain('containmentIdentity');expect(shader.fragmentShader).toContain('containmentGeometry=vec4(0.0,0.0,0.0,clamp');geometry.dispose();material.dispose();
 });
});
