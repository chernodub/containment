import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {SceneLighting} from '../src/render/SceneLighting';
import {addRoomPracticals} from '../src/render/lighting/RoomPracticals';
import {PracticalPools} from '../src/render/lighting/PracticalPools';
import {applyRoomMood} from '../src/render/lighting/applyRoomMood';

describe('fixture-motivated floor apertures',()=>{
 it('shares selected fixture orientation with retained floor uniforms and the single bounce draw',()=>{
  const room=new T.Group();addRoomPracticals(room,26,20,'communications');const floorMaterial=new T.MeshStandardMaterial({name:'environment-floor'});room.add(new T.Mesh(new T.PlaneGeometry(26,20),floorMaterial));
  const lighting=new SceneLighting();lighting.loadRoom(room,26,20,'communications','transmission-chamber');applyRoomMood(room,'communications','transmission-chamber',lighting.practicalShapes);
  const shader={uniforms:{} as Record<string,{value:unknown}>,vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};floorMaterial.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms,{} as T.WebGLRenderer);
  expect(shader.uniforms.roomFloorPracticalShapes.value).toBe(lighting.practicalShapes);
  const pools=new PracticalPools(new T.Scene());
  for(const [x,z]of [[2,3],[22,17],[13,9]]){lighting.setPlayer(x,z,0);lighting.update(.016);pools.update(lighting.fixtures,true);for(let i=0;i<lighting.fixtures.length;i++){const f=lighting.fixtures[i],axis=lighting.practicalShapes[i];if(f.intensity===0)continue;expect(Math.hypot(axis.x,axis.y)).toBeCloseTo(1);expect(axis.w/axis.z).toBeGreaterThan(3);expect(Math.sin(f.userData.poolAngle)).toBeCloseTo(axis.x);}}
  expect(shader.fragmentShader).toContain('roomFloorPracticalShapes[UNROLLED_LOOP_INDEX]');
  expect(shader.fragmentShader).toContain('directLight.color*=.12+slit*.40');
  pools.dispose();lighting.dispose();floorMaterial.dispose();
 });
 it('does not apply room aperture attenuation to actors or dynamic source slots',()=>{
  const room=new T.Group(),material=new T.MeshStandardMaterial({name:'g2-dressing-steel'});room.add(new T.Mesh(new T.BoxGeometry(),material));applyRoomMood(room,'communications');const shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};material.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms,{} as T.WebGLRenderer);expect(shader.fragmentShader).not.toContain('roomFloorPracticalShapes');material.dispose();
 });
});
