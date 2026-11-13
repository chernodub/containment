import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {ENVIRONMENT_MOODS} from './EnvironmentMoods';
import {ROOM_COMPOSITIONS} from './RoomCompositions';
import {applyRoomMood} from './applyRoomMood';
import {SceneLighting} from '../SceneLighting';
import type {ShipEnvironment} from '../ShipEnvironments';

function shaderFor(material:T.MeshStandardMaterial){
  const shader={uniforms:{} as Record<string,{value:number}>,vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};
  material.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms,{} as T.WebGLRenderer);
  return shader;
}
function materials(){
  const deck=new T.MeshStandardMaterial({name:'environment-floor',color:0x657481,roughness:.88}),hardware=new T.MeshStandardMaterial({name:'e6-kit-dark',color:0x18242c,roughness:.84}),world=new T.Group();
  world.add(new T.Mesh(new T.BoxGeometry(),deck),new T.Mesh(new T.BoxGeometry(),hardware));
  return{deck,hardware,world,dispose(){world.traverse(o=>{if(o instanceof T.Mesh)o.geometry.dispose();});deck.dispose();hardware.dispose();}};
}

describe('E6 room value hierarchy',()=>{
 it.each(['communications','security','containment'] as const)('%s keeps deck shadow readability without lifting hardware recesses',environment=>{
  const m=materials();applyRoomMood(m.world,environment);
  const floor=shaderFor(m.deck),hardware=shaderFor(m.hardware);
  expect(floor.uniforms.roomShadowReadability.value).toBeGreaterThan(hardware.uniforms.roomShadowReadability.value*2);
  expect(floor.uniforms.roomShadowReadability.value).toBeLessThanOrEqual(.02);
  expect(hardware.uniforms.roomShadowReadability.value).toBeGreaterThan(0);
  const key=m.hardware.customProgramCacheKey();applyRoomMood(m.world,environment);expect(m.hardware.customProgramCacheKey()).toBe(key);
  const second=shaderFor(m.hardware);expect(second.uniforms.roomShadowReadability).toBe(hardware.uniforms.roomShadowReadability);
  m.dispose();
 });
 it('retains the hot reactor source while lifting only the overload deck toe',()=>{
  const m=materials();applyRoomMood(m.world,'reactor','overload-floor');
  expect(shaderFor(m.deck).uniforms.roomShadowReadability.value).toBeGreaterThan(shaderFor(m.hardware).uniforms.roomShadowReadability.value);
  const manual=materials();applyRoomMood(manual.world,'reactor','manual-control-chamber');expect(shaderFor(manual.deck).uniforms.roomShadowReadability.value).toBe(.010);
  m.dispose();manual.dispose();
 });
 it('keeps the same exposure and preserves semantic emitter hues during repeated mood changes',()=>{
  expect(new Set(Object.values(ENVIRONMENT_MOODS).map(m=>m.grade.exposure))).toEqual(new Set([1.06]));
  const m=materials(),warning=new T.MeshStandardMaterial({name:'danger-warning',color:0xff5333,emissive:0xff3322,emissiveIntensity:.8});
  m.world.add(new T.Mesh(new T.BoxGeometry(),warning));
  for(const environment of Object.keys(ENVIRONMENT_MOODS) as ShipEnvironment[]){applyRoomMood(m.world,environment);expect(warning.color.getHex()).toBe(0xff5333);expect(warning.emissive.getHex()).toBe(0xff3322);expect(warning.emissiveIntensity).toBe(2.6);}
  m.dispose();warning.dispose();
 });
 it('uses a lower hot service key, isolated clinical hardware light and dark communications fill without new lights',()=>{
  const rig=new SceneLighting(),world=new T.Group(),original=[...rig.root.children];
  rig.loadRoom(world,37.5,27.5,'engineering','diagnostic-gallery');
  expect(rig.key.position.y).toBe(4.2);expect(rig.key.color.r).toBeGreaterThan(rig.key.color.b*2);expect(rig.fill.intensity).toBeCloseTo(.42*3.8);
  rig.loadRoom(world,37.5,27.5,'communications','relay-racks');expect(rig.fill.intensity).toBeCloseTo(.6*.95);
  rig.loadRoom(world,37.5,27.5,'containment','shielding-gate');expect(ROOM_COMPOSITIONS['shielding-gate'].practicalGain).toBe(2);expect(rig.root.children).toEqual(original);
  for(const environment of ['security','cryogenics','containment'] as const){const m=materials();applyRoomMood(m.world,environment);expect(m.deck.roughness).toBeGreaterThanOrEqual(.85);m.dispose();}
  rig.dispose();
 });
});
