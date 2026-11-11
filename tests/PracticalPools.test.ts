import {expect,it,vi} from 'vitest';
import * as T from 'three';
import {PracticalPools} from '../src/render/lighting/PracticalPools';
import {applyRoomMood} from '../src/render/lighting/applyRoomMood';
import {addRoomPracticals} from '../src/render/lighting/RoomPracticals';
import {disposeModel} from '../src/render/meshParts';
import {optimizeLocalLights} from '../src/render/lighting/LocalLightShading';

it('reuses four analytic pools at their real fixture origins and bounds Low to two',()=>{
 const scene=new T.Scene(),pools=new PracticalPools(scene),geometry=pools.root.geometry,material=pools.root.material;
 const fixtures=Array.from({length:4},(_,i)=>{const light=new T.PointLight(0xffbb88,18,6);light.position.set(i*3,2,i);return light;});
 pools.update(fixtures,true);expect(pools.root.count).toBe(4);
 const matrix=new T.Matrix4();pools.root.getMatrixAt(2,matrix);expect(new T.Vector3().setFromMatrixPosition(matrix).toArray()).toEqual([6,expect.closeTo(.035),2]);
 for(let i=0;i<20;i++)pools.update(fixtures,i%2===0);
 expect(pools.root.count).toBe(2);expect(pools.root.geometry).toBe(geometry);expect(pools.root.material).toBe(material);
 const disposeGeometry=vi.spyOn(geometry,'dispose'),disposeMaterial=vi.spyOn(material,'dispose');pools.dispose();pools.dispose();
 expect(disposeGeometry).toHaveBeenCalledOnce();expect(disposeMaterial).toHaveBeenCalledOnce();expect(scene.children).toHaveLength(0);
});

it('retains the original material hook and rejects only zero-contribution direct light',()=>{
 const material=new T.MeshStandardMaterial(),previous=vi.fn();material.onBeforeCompile=previous;
 optimizeLocalLights(material);const hook=material.onBeforeCompile;optimizeLocalLights(material);expect(material.onBeforeCompile).toBe(hook);
 const shader={fragmentShader:'#include <lights_fragment_begin>'};hook(shader as T.WebGLProgramParametersWithUniforms,{} as T.WebGLRenderer);
 expect(previous).toHaveBeenCalledOnce();expect(shader.fragmentShader).toContain('getPointLightInfo');
 expect(shader.fragmentShader.match(/if \( directLight.visible \)/g)).toHaveLength(3);
 material.dispose();
});


it('keeps physical practical origins and retires per-room instance buffers and materials',()=>{
 const room=new T.Group();addRoomPracticals(room,24,18,'infested');
 const fixtures=room.userData.lightFixtures;expect(fixtures.length).toBe(8);expect(new Set(fixtures.map((f:any)=>f.color)).size).toBe(2);
 applyRoomMood(room,'infested');const shader={fragmentShader:T.ShaderLib.standard.fragmentShader};const emitter=(room.children[1] as T.Mesh).material as T.MeshStandardMaterial;emitter.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms,{} as T.WebGLRenderer);expect(shader.fragmentShader).toContain('#ifdef USE_COLOR');expect(emitter.emissiveIntensity).toBe(1.3);
 const meshes=room.children as T.InstancedMesh[],geometries=meshes.map(m=>vi.spyOn(m.geometry,'dispose')),materials=meshes.map(m=>vi.spyOn(m.material as T.Material,'dispose')),buffers=meshes.map(m=>vi.spyOn(m,'dispose'));
 disposeModel(room);for(const spy of [...geometries,...materials,...buffers])expect(spy).toHaveBeenCalledOnce();
});

it('keeps reactor bounce hue and darker gaps while leaving other environment pools unchanged',()=>{
 const scene=new T.Scene(),pools=new PracticalPools(scene),light=new T.PointLight(0xff6a28,18,7.5);
 light.position.set(3,2,5);light.userData.reactorMood=true;pools.update([light],true);
 const color=new T.Color(),matrix=new T.Matrix4();pools.root.getColorAt(0,color);pools.root.getMatrixAt(0,matrix);
 expect(color.g/color.r).toBeCloseTo(light.color.g/light.color.r);
 expect(new T.Vector3().setFromMatrixScale(matrix).x).toBeCloseTo(3.6);
 expect(pools.root.geometry.getAttribute('reactorPoolAmount').getX(0)).toBe(1);
 light.userData.reactorMood=false;pools.update([light],true);pools.root.getColorAt(0,color);
 expect(color.g/color.r).toBeGreaterThan(light.color.g/light.color.r);
 expect(pools.root.geometry.getAttribute('reactorPoolAmount').getX(0)).toBe(0);
 pools.dispose();
});
