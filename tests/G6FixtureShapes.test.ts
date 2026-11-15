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
  // Cryo strip floors omit the old radial pedestal; other constructions retain
  // their original shaped-source fill. The shared aperture still drives both.
  expect(shader.fragmentShader).toContain('float stripOnly=max(roomFloorApertureOnly,1.0-step(.5,roomFloorPattern.z))');
  expect(shader.fragmentShader).toContain('directLight.color*=mix(.12+slit*.40,slit*.40,stripOnly)');
  pools.dispose();lighting.dispose();floorMaterial.dispose();
 });
 it('does not apply room aperture attenuation to actors or dynamic source slots',()=>{
  const room=new T.Group(),material=new T.MeshStandardMaterial({name:'g2-dressing-steel'});room.add(new T.Mesh(new T.BoxGeometry(),material));applyRoomMood(room,'communications');const shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};material.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms,{} as T.WebGLRenderer);expect(shader.fragmentShader).not.toContain('roomFloorPracticalShapes');material.dispose();
 });
});

it('leaves packed Low suit-fill and muzzle slots unmasked, and restores High axes without a topology change',()=>{
 const room=new T.Group();addRoomPracticals(room,26,20,'communications');const lighting=new SceneLighting();lighting.loadRoom(room,26,20,'communications','relay-racks');
 const slots=lighting.practicalShapes;lighting.setQuality('low',false,false);lighting.setPlayer(4,8,0);
 expect(slots.slice(0,2).every(v=>v.z>0)).toBe(true);expect(slots.slice(2).every(v=>v.z===0)).toBe(true);
 lighting.setQuality('high');lighting.setPlayer(4,8,0);expect(lighting.practicalShapes).toBe(slots);expect(slots.every(v=>v.z>0)).toBe(true);lighting.dispose();
});

it('dims actual breached-cargo sources while keeping fixture color semantics and fixed inventories',()=>{
 const world=new T.Group(),dressing=new T.Group();dressing.name='g2-world-dressing';dressing.userData.signature='breached-loading-bay';world.add(dressing);addRoomPracticals(world,26,20,'cargo');
 const fixtures=world.userData.lightFixtures as {gain:number;color:number}[];expect(fixtures.some(f=>f.gain<.2)).toBe(true);expect(fixtures.some(f=>f.gain===1)).toBe(true);
 const lighting=new SceneLighting();lighting.loadRoom(world,26,20,'cargo','breached-loading-bay');lighting.setPlayer(3,4,0);lighting.update(0);
 expect(lighting.fixtures.some(f=>(f.userData.fixtureGain??1)<1)).toBe(true);expect(lighting.fixtures).toHaveLength(4);lighting.dispose();
});
