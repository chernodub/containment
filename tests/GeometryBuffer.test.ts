import { describe, it, expect, vi } from 'vitest';
import { Group, Mesh, MeshStandardMaterial, BoxGeometry, ShaderLib, ShaderMaterial, Vector2 } from 'three';
import { GEOMETRY_CLASSES, registerGeometry, installGeometryClearPolicy } from '../src/render/post/GeometryBuffer';

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
  expect(shader.fragmentShader).toContain('normalize(vNormal)');expect(shader.fragmentShader).toContain('graphicMinorDot');geometry.dispose();material.dispose();copy.dispose();
 });
 it('writes exclusion for effect programs instead of assigning actor or world contour IDs',()=>{
  const material=new ShaderMaterial({vertexShader:'void main(){gl_Position=vec4(position,1.);}',fragmentShader:'void main(){if(true){gl_FragColor=vec4(1.);}}'}),geometry=new BoxGeometry(),root=new Group();root.add(new Mesh(geometry,material));registerGeometry(root);
  const shader={vertexShader:material.vertexShader,fragmentShader:material.fragmentShader,uniforms:{}};material.onBeforeCompile(shader as never,{} as never);
  expect(shader.fragmentShader).toContain('containmentGeometry=vec4(0.0,0.0,0.0,1.0)');expect(shader.fragmentShader).not.toContain('containmentIdentity');geometry.dispose();material.dispose();
 });
});

describe('MRT draw-buffer isolation',()=>{
 it('clears background IDs once, preserves overlay exclusion and releases the renderer hook',()=>{
  const root=new Group(),geometry=new BoxGeometry(),surface=new MeshStandardMaterial(),effect=new ShaderMaterial({transparent:true});root.add(new Mesh(geometry,surface),new Mesh(geometry,effect));registerGeometry(root);
  const events:unknown[]=[],target={textures:[{}, {name:'Containment geometry normal + identity'}]},clear=vi.fn(()=>events.push('color-depth-clear'));
  let current:typeof target|null=target;
  const renderer={clear,getRenderTarget:()=>current,getContext:()=>({COLOR:0x1800,drawBuffers:(v:number[])=>events.push([...v]),clearBufferfv:(_target:number,index:number,v:Float32Array)=>events.push({index,value:[...v]})}),info:{render:{frame:1}}};
  const release=installGeometryClearPolicy(renderer as never),second=installGeometryClearPolicy(renderer as never);
  renderer.clear();surface.onBeforeRender(renderer as never,{} as never,{} as never,geometry,root as never,{} as never);effect.onBeforeRender(renderer as never,{} as never,{} as never,geometry,root as never,{} as never);
  expect(events).toEqual([[0x8ce0,0],'color-depth-clear',[0x8ce0,0x8ce1],{index:1,value:[0,0,0,0]},[0x8ce0,0]]);
  // Nested reflection/other-scene renders can advance Three's frame counter.
  // They must not erase geometry already emitted into this uncleared target.
  events.length=0;renderer.info.render.frame++;
  surface.onBeforeRender(renderer as never,{} as never,{} as never,geometry,root as never,{} as never);
  expect(events).toEqual([[0x8ce0,0x8ce1]]);
  events.length=0;current=null;renderer.clear();expect(events).toEqual(['color-depth-clear']);
  release();release();expect(renderer.clear).not.toBe(clear);second();expect(renderer.clear).toBe(clear);
  geometry.dispose();surface.dispose();effect.dispose();
 });
 it('blocks priority standard overlays and restores classification when priority is removed',()=>{
  const root=new Group(),geometry=new BoxGeometry(),material=new MeshStandardMaterial();root.add(new Mesh(geometry,material));root.renderOrder=20;root.userData.containmentHostilePriority=true;registerGeometry(root);
  const shader=compiled(material),identity=(shader.uniforms as Record<string,{value:Vector2}>).containmentIdentity.value;
  expect(identity.toArray()).toEqual([0,255]);expect(material.userData.containmentInkBlock).toBe(true);
  const version=material.version;root.renderOrder=0;root.userData.containmentHostilePriority=false;registerGeometry(root);expect(identity.toArray()).toEqual([2,GEOMETRY_CLASSES.architecture]);expect(material.version).toBe(version);expect(material.userData.containmentInkBlock).toBe(false);
  geometry.dispose();material.dispose();
 });
 it('preserves normals/IDs behind transparent effects and restores writes for the next solid draw',()=>{
  const surface=new MeshStandardMaterial(),effect=new ShaderMaterial({transparent:true});
  const root=new Group(),geometry=new BoxGeometry();root.add(new Mesh(geometry,surface),new Mesh(geometry,effect));registerGeometry(root);
  const clears=vi.fn(),calls:number[][]=[],target={textures:[{}, {name:'Containment geometry normal + identity'}]},renderer={getRenderTarget:()=>target,getContext:()=>({COLOR:0x1800,clearBufferfv:clears,drawBuffers:(values:number[])=>calls.push([...values])}),info:{render:{frame:1}}};
  const draw=(material:MeshStandardMaterial|ShaderMaterial)=>material.onBeforeRender(renderer as never,{} as never,{} as never,geometry,root as never,{} as never);
  draw(surface);draw(surface);draw(effect);draw(effect);draw(surface);
  expect(calls).toEqual([[0x8ce0,0x8ce1],[0x8ce0,0],[0x8ce0,0x8ce1]]);
  expect(clears).toHaveBeenCalledTimes(1);expect(clears).toHaveBeenLastCalledWith(0x1800,1,new Float32Array(4));
  renderer.info.render.frame++;draw(surface);expect(calls).toHaveLength(4);expect(clears).toHaveBeenCalledTimes(2);
  geometry.dispose();surface.dispose();effect.dispose();
 });
 it('excludes opaque affliction droplets from actor and world classification',()=>{
  const root=new Group();root.name='shared-affliction-batches';const material=new MeshStandardMaterial(),geometry=new BoxGeometry();root.add(new Mesh(geometry,material));registerGeometry(root);
  const shader=compiled(material);expect(shader.fragmentShader).not.toContain('containmentIdentity');expect(shader.fragmentShader).toContain('containmentGeometry=vec4(0.0,0.0,0.0,1.0)');geometry.dispose();material.dispose();
 });
});

it('keeps actor IDs beneath high-order friendly effects and opaque status droplets',()=>{
 const actor=new MeshStandardMaterial(),friendly=new ShaderMaterial({transparent:true}),droplet=new MeshStandardMaterial(),geometry=new BoxGeometry();
 const root=new Group(),effects=new Group();effects.name='shared-affliction-batches';effects.add(new Mesh(geometry,droplet));
 const overlay=new Mesh(geometry,friendly);overlay.renderOrder=100;root.add(new Mesh(geometry,actor),overlay,effects);registerGeometry(root);
 const calls:number[][]=[],target={textures:[{}, {name:'Containment geometry normal + identity'}]},renderer={getRenderTarget:()=>target,getContext:()=>({COLOR:0x1800,clearBufferfv:()=>{},drawBuffers:(values:number[])=>calls.push([...values])}),info:{render:{frame:1}}};
 const draw=(m:MeshStandardMaterial|ShaderMaterial)=>m.onBeforeRender(renderer as never,{} as never,{} as never,geometry,root as never,{} as never);
 draw(actor);draw(friendly);draw(droplet);draw(actor);
 expect(calls).toEqual([[0x8ce0,0x8ce1],[0x8ce0,0],[0x8ce0,0x8ce1]]);
 expect(friendly.userData.containmentInkBlock).toBe(false);expect(droplet.userData.containmentPreserveGeometry).toBe(true);
 geometry.dispose();actor.dispose();friendly.dispose();droplet.dispose();
});
