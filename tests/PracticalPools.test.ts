import {expect,it,vi} from 'vitest';
import * as T from 'three';
import {PracticalPools} from '../src/render/lighting/PracticalPools';
import {applyRoomMood} from '../src/render/lighting/applyRoomMood';
import {addRoomPracticals,updateRoomPracticals} from '../src/render/lighting/RoomPracticals';
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
 const fixtures=room.userData.lightFixtures;expect(fixtures.length).toBe(8);expect(new Set(fixtures.map((f:any)=>f.color)).size).toBe(3);
 applyRoomMood(room,'infested');const shader={fragmentShader:T.ShaderLib.standard.fragmentShader};const emitter=(room.children[1] as T.Mesh).material as T.MeshStandardMaterial;emitter.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms,{} as T.WebGLRenderer);expect(shader.fragmentShader).toContain('#ifdef USE_COLOR');expect(emitter.emissiveIntensity).toBeGreaterThan(0);expect(emitter.emissiveIntensity).toBeLessThan(1);
 const meshes=room.children as T.InstancedMesh[],geometries=meshes.map(m=>vi.spyOn(m.geometry,'dispose')),materials=meshes.map(m=>vi.spyOn(m.material as T.Material,'dispose')),buffers=meshes.map(m=>vi.spyOn(m,'dispose'));
 disposeModel(room);for(const spy of [...geometries,...materials,...buffers])expect(spy).toHaveBeenCalledOnce();
});

it('keeps fixture hue and origins while shaping interrupted elongated apertures with a smaller reactor footprint',()=>{
 const scene=new T.Scene(),pools=new PracticalPools(scene),light=new T.PointLight(0xff6a28,18,7.5);
 light.position.set(3,2,5);light.userData.reactorMood=true;light.userData.poolAngle=.41;pools.update([light],true);
 const color=new T.Color(),matrix=new T.Matrix4();pools.root.getColorAt(0,color);pools.root.getMatrixAt(0,matrix);
 expect(color.g/color.r).toBeCloseTo(light.color.g/light.color.r);
 const reactor=new T.Vector3().setFromMatrixScale(matrix);expect(reactor.z/reactor.x).toBeGreaterThan(3);
 expect(new T.Vector3().setFromMatrixPosition(matrix).toArray()).toEqual([3,expect.closeTo(.035),5]);expect(pools.root.material.uniforms.poolIntensity.value).toBeLessThan(.22);
 light.userData.reactorMood=false;pools.update([light],true);pools.root.getColorAt(0,color);
 expect(color.g/color.r).toBeCloseTo(light.color.g/light.color.r);
 pools.root.getMatrixAt(0,matrix);const ordinary=new T.Vector3().setFromMatrixScale(matrix);
 expect(ordinary.z/ordinary.x).toBeGreaterThan(3);expect(ordinary.x*ordinary.z).toBeGreaterThan(reactor.x*reactor.z);
 expect(pools.root.material.fragmentShader).not.toContain('length(q)');
 expect(pools.root.material.fragmentShader).toContain('grille');
 expect(pools.root.geometry.getAttribute('reactorPoolAmount').getX(0)).toBe(1);
 pools.dispose();
});

it('keeps broad organic spill attached to sources and freezes failing human emitters for reduced motion',()=>{
 const room=new T.Group();addRoomPracticals(room,24,18,'infested');const mesh=room.children[1] as T.InstancedMesh,material=mesh.material as T.MeshStandardMaterial;
 const shader={uniforms:{} as Record<string,{value:number}>,vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};material.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms,{} as T.WebGLRenderer);
 expect(room.userData.lightFixtures.some((f:any)=>f.poolStyle===0&&f.gain>0&&f.gain<=.18)).toBe(true);expect(mesh.geometry.getAttribute('humanFixtureFailure').getX(0)).toBe(1);
 updateRoomPracticals(room,2.7);expect(shader.uniforms.roomPracticalTime.value).toBe(2.7);updateRoomPracticals(room,8,true);expect(shader.uniforms.roomPracticalTime.value).toBe(0);expect(shader.uniforms.roomPracticalFailureGain.value).toBe(0);updateRoomPracticals(room,10,false,.25);expect(shader.uniforms.roomPracticalFailureGain.value).toBe(.25);updateRoomPracticals(room,10,false,0);expect(shader.uniforms.roomPracticalTime.value).toBe(0);expect(shader.uniforms.roomPracticalFailureGain.value).toBe(0);
 const scene=new T.Scene(),pools=new PracticalPools(scene),light=new T.PointLight(0xa1ef72,100,8);light.position.set(7,2,8);light.userData.poolStyle=3;light.userData.poolWidth=2.5;light.userData.poolDepth=6.4;pools.update([light],true);const matrix=new T.Matrix4();pools.root.getMatrixAt(0,matrix);expect(new T.Vector3().setFromMatrixPosition(matrix).toArray()).toEqual([7,expect.closeTo(.035),8]);expect(new T.Vector3().setFromMatrixScale(matrix).toArray()).toEqual([expect.closeTo(2.5),1,expect.closeTo(6.4)]);expect(pools.root.material.fragmentShader).toContain('membrane');expect(pools.root.material.fragmentShader).not.toContain('length(q)');
 pools.dispose();disposeModel(room);
});
