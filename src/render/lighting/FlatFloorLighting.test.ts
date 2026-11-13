import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {applyRoomMood} from './applyRoomMood';
import {patchGraphicSurface} from './GraphicSurface';

function compile(material:T.MeshStandardMaterial){
 const shader={vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader,uniforms:{}};
 material.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms,{} as T.WebGLRenderer);
 return shader as typeof shader&{uniforms:Record<string,{value:any}>};
}
function fixture(name:string,floor=false){
 const material=new T.MeshStandardMaterial({name});material.userData.actorMaterial=true;material.userData.floorDressing=floor;
 const world=new T.Group();world.add(new T.Mesh(new T.PlaneGeometry(),material));return{material,world};
}
describe('flat authored surface registration uses the existing floor light composition',()=>{
 it('shapes four sources on vertex-colored floor art and preserves world graphic classification',()=>{
  const {material,world}=fixture('e6-kit-conduit',true);material.vertexColors=true;
  const shapes=Array.from({length:4},(_,i)=>new T.Vector4(0,1,.22+i*.1,2.6+i));
  applyRoomMood(world,'communications','relay-racks',shapes);patchGraphicSurface(material);const shader=compile(material);
  expect(shader.fragmentShader).toContain('vec4 aperture=roomFloorPracticalShapes[UNROLLED_LOOP_INDEX]');
  expect(shader.fragmentShader.match(/uniform vec4 roomFloorPracticalShapes\[4\]/g)).toHaveLength(1);
  expect(shader.uniforms.roomFloorPracticalShapes.value.map((v:T.Vector4)=>v.toArray())).toEqual(shapes.map(v=>v.toArray()));
  expect(shader.uniforms.roomPracticalNearField.value).toBe(3.24);
  expect(shader.uniforms.graphicSurfaceKind.value.toArray()).toEqual([0,1]);
  expect(material.customProgramCacheKey()).toContain(':flat-floor-apertures-v1');
  const key=material.customProgramCacheKey();applyRoomMood(world,'cryogenics','awakening-bay',shapes);
  expect(material.customProgramCacheKey()).toBe(key);expect(compile(material).uniforms.roomFloorPattern.value.z).toBe(0);
 });
 it('leaves ordinary artist props on the existing hardware path',()=>{
  const {material,world}=fixture('e6-kit-body');applyRoomMood(world,'security','crew-checkpoint');patchGraphicSurface(material);const shader=compile(material);
  expect(shader.uniforms.roomFloorPracticalShapes).toBeUndefined();expect(shader.uniforms.roomPracticalNearField.value).toBe(9);
  expect(shader.uniforms.graphicSurfaceKind.value.toArray()).toEqual([0,0]);
 });
 it('retains the original deck pattern hook without duplicate floor declarations',()=>{
  const {material,world}=fixture('painted-steel-deck',true);applyRoomMood(world,'cargo','freight-hold');const shader=compile(material);
  expect(shader.fragmentShader.match(/uniform vec4 roomFloorPracticalShapes\[4\]/g)).toHaveLength(1);
  expect(material.customProgramCacheKey()).not.toContain(':flat-floor-apertures-v1');
 });
});
