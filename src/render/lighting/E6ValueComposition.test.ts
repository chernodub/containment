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
 it.each([
  ['awakening-bay','cryogenics'],['communal-atrium','habitation'],['freight-hold','cargo'],
  ['relay-racks','communications'],['swarm-junction','infested'],['shielding-gate','containment'],
  ['service-shaft-landing','maintenance'],['containment-annulus','containment'],
 ] as const)('%s recalibrates only floor albedo without compounding room preparation', (room,environment)=>{
  const world=new T.Group(),geometry=new T.PlaneGeometry(2,2);
  const decks=['painted-steel-deck','annulus-deck','annulus-circulation','environment-floor','shaft-deck','shaft-floor-panel'].map(name=>new T.MeshStandardMaterial({name,color:0x354247,roughness:.92,metalness:.06}));
  const semantics=['marine-suit','enemy-family','hostile-warning','navigation-safe','e6-kit-body'].map(name=>new T.MeshStandardMaterial({name,color:0x93634f}));
  const dressing=new T.MeshStandardMaterial({name:'e6-kit-floor',color:0x63777f});dressing.userData.floorDressing=true;
  const all=[...decks,...semantics,dressing],untouched=[...semantics,dressing].map(material=>material.color.clone());
  for(const material of all)world.add(new T.Mesh(geometry,material));
  const objects=[...world.children];applyRoomMood(world,environment,room);
  const calibrated=decks.map(material=>material.color.clone()),hooks=all.map(material=>material.onBeforeCompile),keys=all.map(material=>material.customProgramCacheKey());
  for(let n=0;n<6;n++)applyRoomMood(world,environment,room);
  decks.forEach((material,index)=>expect(material.color.equals(calibrated[index])).toBe(true));
  [...semantics,dressing].forEach((material,index)=>expect(material.color.equals(untouched[index])).toBe(true));
  all.forEach((material,index)=>{expect(material.onBeforeCompile).toBe(hooks[index]);expect(material.customProgramCacheKey()).toBe(keys[index]);});
  // A quality/mood transition must also recover the same authored starting albedo.
  applyRoomMood(world,'cargo','freight-hold');applyRoomMood(world,environment,room);
  decks.forEach((material,index)=>expect(material.color.equals(calibrated[index])).toBe(true));
  expect(world.children).toEqual(objects);geometry.dispose();all.forEach(material=>material.dispose());
 });
 it('limits the circulation lift to its named room while retaining the main annulus deck calibration',()=>{
  const run=(room?:string)=>{const world=new T.Group(),geometry=new T.PlaneGeometry(2,2),deck=new T.MeshStandardMaterial({name:'annulus-deck',color:0x354247}),circulation=new T.MeshStandardMaterial({name:'annulus-circulation',color:0x354247});world.add(new T.Mesh(geometry,deck),new T.Mesh(geometry,circulation));applyRoomMood(world,'containment',room);const colors=[deck.color.clone(),circulation.color.clone()];geometry.dispose();deck.dispose();circulation.dispose();return colors;};
  const named=run('containment-annulus'),generic=run();expect(named[0].equals(generic[0])).toBe(true);expect(named[1].r).toBeGreaterThan(generic[1].r);expect(generic[1].equals(new T.Color(0x354247))).toBe(true);
 });
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
  rig.loadRoom(world,37.5,27.5,'communications','relay-racks');expect(rig.fill.intensity).toBeCloseTo(.20*.65);
  rig.loadRoom(world,37.5,27.5,'containment','shielding-gate');expect(ROOM_COMPOSITIONS['shielding-gate'].practicalGain).toBe(2);expect(rig.root.children).toEqual(original);
  for(const environment of ['security','cryogenics','containment'] as const){const m=materials();applyRoomMood(m.world,environment);expect(m.deck.roughness).toBeGreaterThanOrEqual(.85);m.dispose();}
  rig.dispose();
 });
});
