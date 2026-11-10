import { afterEach, describe, expect, it, vi } from 'vitest';
import * as T from 'three';
import { SceneLighting } from '../src/render/SceneLighting';
import { LightPool } from '../src/render/lighting/LightPool';
import { ENVIRONMENT_MOODS, getEnvironmentMood } from '../src/render/lighting/EnvironmentMoods';
import { RoomReflectionCapture } from '../src/render/lighting/RoomReflectionCapture';
import { applyRoomMood } from '../src/render/lighting/applyRoomMood';
import { applyFloorVariation } from '../src/render/lighting/FloorVariation';
import { applyHotFixtureSurface, updateHotFixtureSurfaces } from '../src/render/lighting/HotFixtureSurface';

afterEach(() => vi.restoreAllMocks());

describe('environment color script', () => {
  it('provides ten immutable, distinct and readable environment moods', () => {
    const moods = Object.values(ENVIRONMENT_MOODS);
    expect(moods).toHaveLength(10);
    expect(new Set(moods.map(mood => mood.practical.color)).size).toBe(10);
    for (const mood of moods) {
      expect(Object.isFrozen(mood)).toBe(true);
      expect(getEnvironmentMood(mood.environment)).toBe(mood);
      expect(mood.ambient.intensity).toBeGreaterThanOrEqual(.45);
      expect(mood.ambient.intensity).toBeLessThan(mood.key.intensity / 2);
      expect(mood.grade.exposure).toBeGreaterThan(.8);
      expect(mood.fog.density).toBeLessThan(.03);
    }
    expect(getEnvironmentMood('maintenance').floorRoughness).toBeLessThan(.35);
    expect(getEnvironmentMood('cargo').floorRoughness).toBeGreaterThan(.8);
  });
  it('changes key, practical behavior and material response per room without adding lights', () => {
    const rig = new SceneLighting(), room = new T.Group();
    room.userData.lightFixtures = [{ x: 2, y: 1.5, z: 3, color: 0x88ccdd }];
    const children = [...rig.root.children];
    rig.loadRoom(room, 24, 16, 'reactor');
    expect(rig.key.color.getHex()).toBe(getEnvironmentMood('reactor').key.color);
    const initial = rig.fixtures[0].intensity;
    rig.update(.5); expect(rig.fixtures[0].intensity).not.toBe(initial);
    rig.loadRoom(room, 24, 16, 'cryogenics');
    const steady = rig.fixtures[0].intensity;
    rig.update(.5); expect(rig.fixtures[0].intensity).toBe(steady);
    expect(rig.root.children).toEqual(children);
    rig.dispose();
  });
  it('tunes only deck response and existing emissive energy, preserving semantic hues', () => {
    const room = new T.Group();
    const deck = new T.MeshStandardMaterial({ roughness: .91, metalness: .3, color: 0x8899aa });
    deck.name = 'painted-steel-deck';
    const warning = new T.MeshStandardMaterial({ color: 0xff5333, emissive: 0xff3322, emissiveIntensity: .8 });
    room.add(new T.Mesh(new T.BoxGeometry(), deck), new T.Mesh(new T.BoxGeometry(), warning));
    applyRoomMood(room, 'maintenance');
    expect(deck.roughness).toBe(getEnvironmentMood('maintenance').floorRoughness);
    expect(warning.emissive.getHex()).toBe(0xff3322);
    expect(warning.color.getHex()).toBe(0xff5333);
    expect(warning.emissiveIntensity).toBeGreaterThan(2);
    applyRoomMood(room, 'cargo');
    expect(deck.roughness).toBeGreaterThan(.8);
    const color = deck.color.clone(); applyRoomMood(room, 'cargo');
    expect(deck.color.equals(color)).toBe(true);
    room.traverse(object => { if (object instanceof T.Mesh) object.geometry.dispose(); });
    deck.dispose(); warning.dispose();
  });
});

describe('fixed dynamic lights', () => {
  it('bounds priority replacement, one-shot fade, fixed resources and prewarmed visibility budgets', () => {
    const pool = new LightPool(), children = [...pool.root.children];
    for (let i = 0; i < 9; i++) expect(pool.flash({ x: i, z: 0, color: 0xffaa44, priority: 5, duration: 1 })).not.toBeNull();
    expect(pool.flash({ x: 99, z: 0, color: 0xffffff, priority: 1 })).toBeNull();
    const important = pool.flash({ x: 99, z: 0, color: 0xffffff, priority: 10, intensity: 12, duration: .2 })!;
    expect(important.position.x).toBe(99);
    pool.update(.1); expect(important.intensity).toBeCloseTo(3);
    pool.update(.2); expect(important.intensity).toBe(0);
    expect(pool.root.children).toEqual(children);
    pool.setQuality('low'); expect(pool.capacity).toBe(2);
    expect(pool.lights.filter(light => light.visible)).toHaveLength(2);
    pool.setQuality('high', false); expect(pool.capacity).toBe(0);
    expect(pool.lights.every(light => light.intensity === 0)).toBe(true);
    pool.dispose(); pool.dispose(); expect(pool.root.children).toHaveLength(0);
  });
  it('refreshes attachments in place, releases with a fading tail and resets cleanly', () => {
    const pool = new LightPool();
    const first = pool.attach('burning-7', { x: 2, z: 3, color: 0xff7722, intensity: 8 })!;
    const moved = pool.attach('burning-7', { x: 4, z: 5, color: 0xff7722, intensity: 8 })!;
    expect(moved).toBe(first); expect(moved.position.toArray()).toEqual([4, .9, 5]);
    pool.release('burning-7', .2); pool.update(.1); expect(first.intensity).toBeCloseTo(2);
    pool.reset(); expect(pool.lights.every(light => light.intensity === 0)).toBe(true); pool.dispose();
  });
  it('keeps Low genuinely bounded and the marine cone aligned with native mouse aim', () => {
    const rig = new SceneLighting(); rig.setQuality('low');
    expect(rig.pool.capacity).toBe(0); expect(rig.lamp.cone.visible).toBe(false); expect(rig.key.castShadow).toBe(false);
    rig.setQuality('high', true, true, 0); rig.setPlayer(4, 6, Math.PI / 2);
    expect(rig.lamp.light.target.position.x).toBeCloseTo(4);
    expect(rig.lamp.light.target.position.z).toBeCloseTo(14);
    expect(rig.lamp.cone.visible).toBe(true);
    rig.explosion(1, 2, 3); expect(rig.blast.intensity).toBe(0);
    rig.dispose();
  });
});

it('captures local reflections once per settled room and disposes every owned target', () => {
  const scene = new T.Scene(), actor = new T.Group(), atmosphere = new T.Group(); atmosphere.visible = false;
  const generated = new T.WebGLRenderTarget(64, 64), dispose = vi.spyOn(generated, 'dispose');
  const capture = vi.spyOn(T.CubeCamera.prototype, 'update').mockImplementation((_renderer, room) => {
    expect((_renderer as T.WebGLRenderer).shadowMap.enabled).toBe(false);expect((room as T.Scene).environment).toBeNull(); expect(actor.visible).toBe(false); expect(atmosphere.visible).toBe(false);
  });
  const pmrem = vi.spyOn(T.PMREMGenerator.prototype, 'fromCubemap').mockReturnValue(generated);
  const cubeDispose = vi.spyOn(T.WebGLCubeRenderTarget.prototype, 'dispose');
  const gpu={shadowMap:{enabled:true}} as T.WebGLRenderer;
  const reflections = new RoomReflectionCapture(gpu, scene);
  expect(reflections.capture(10, 2, 8, [actor, atmosphere])).toBe(true);
  expect(gpu.shadowMap.enabled).toBe(true);expect(scene.environment).toBe(generated.texture); expect(actor.visible).toBe(true); expect(atmosphere.visible).toBe(false);
  expect(reflections.capture(10, 2, 8)).toBe(false);
  expect(capture).toHaveBeenCalledOnce(); expect(pmrem).toHaveBeenCalledOnce(); expect(cubeDispose).toHaveBeenCalledOnce();
  reflections.invalidate(); expect(dispose).toHaveBeenCalledOnce(); expect(scene.environment).toBeNull();
  reflections.dispose(); expect(dispose).toHaveBeenCalledOnce();
});

it('restores excluded objects and environment if reflection capture fails', () => {
  const scene = new T.Scene(), actor = new T.Group(), previous = new T.Texture(); scene.environment = previous;
  vi.spyOn(T.CubeCamera.prototype, 'update').mockImplementation(() => { throw new Error('context lost'); });
  const dispose = vi.spyOn(T.WebGLCubeRenderTarget.prototype, 'dispose');
  const gpu={shadowMap:{enabled:true}} as T.WebGLRenderer;
  const reflections = new RoomReflectionCapture(gpu, scene);
  expect(() => reflections.capture(0, 2, 0, [actor])).toThrow('context lost');
  expect(gpu.shadowMap.enabled).toBe(true);expect(actor.visible).toBe(true); expect(scene.environment).toBe(previous); expect(dispose).toHaveBeenCalledOnce();
  reflections.dispose(); previous.dispose();
});

it('stages the Queen reactor core within the fixed practical budget and preserves long shadows', () => {
  const rig = new SceneLighting(), room = new T.Group();
  room.userData.lightFixtures = Array.from({ length: 6 }, (_, i) => ({ x: i * 4, y: 2, z: 3, color: 0x66bbdd }));
  rig.loadRoom(room, 45, 33.75, undefined, 'reactor-vault');
  expect(rig.mood.environment).toBe('reactor'); expect(rig.staging).not.toBeNull();
  expect(rig.fixtures).toHaveLength(4);
  expect(rig.fixtures[0].position.toArray()).toEqual([22.5, 2.6, 16.875]);
  expect(rig.fixtures[0].color.getHex()).toBe(0xffdfab);
  expect(rig.fixtures[0].intensity).toBeGreaterThan(40);
  expect(rig.fixtures[1].color.r).toBeGreaterThan(rig.fixtures[1].color.b);
  expect(rig.key.position.y).toBeLessThan(8);
  rig.setQuality('low'); expect(rig.fixtures.filter(light => light.visible)).toHaveLength(2);
  rig.loadRoom(room, 45, 33.75, 'infested');
  expect(rig.staging).toBeNull(); expect(rig.key.color.g).toBeGreaterThan(rig.key.color.r);
  expect(rig.fill.color.b).toBeGreaterThan(rig.fill.color.r);
  expect(rig.rim.color.b).toBeGreaterThan(rig.rim.color.g);
  expect(rig.fixtures.every(light => !light.userData.reactorCore)).toBe(true);
  rig.dispose();
});

it('adds macro surface variation once and switches environments through uniforms', () => {
  const material = new T.MeshStandardMaterial();
  applyFloorVariation(material, 'maintenance');
  const hook = material.onBeforeCompile, cacheKey = material.customProgramCacheKey();
  const shader = {
    uniforms: {} as Record<string, { value: unknown }>,
    vertexShader: '#include <common>\n#include <worldpos_vertex>',
    fragmentShader: '#include <common>\n#include <color_fragment>\n#include <roughnessmap_fragment>',
  };
  hook(shader as Parameters<T.Material['onBeforeCompile']>[0], {} as T.WebGLRenderer);
  expect(shader.vertexShader).toContain('modelMatrix*roomFloorLocal');
  expect(shader.fragmentShader).toContain('roughnessFactor=clamp(');
  expect(shader.fragmentShader).toContain('diffuseColor.rgb*=');
  expect(shader.uniforms.roomFloorWetness.value).toBe(1);
  applyFloorVariation(material, 'cargo');
  expect(material.onBeforeCompile).toBe(hook); expect(material.customProgramCacheKey()).toBe(cacheKey);
  expect(shader.uniforms.roomFloorWetness.value).toBe(0);
  expect(shader.uniforms.roomFloorGrime.value).toBeGreaterThan(.3);
  material.dispose();
});

it('moves the practical budget between actual nearby fixtures while retaining topology',()=>{
 const rig=new SceneLighting(),world=new T.Group();world.userData.lightFixtures=Array.from({length:16},(_,i)=>({x:i*3,y:1.8,z:4,color:0x9fe8ff}));
 rig.loadRoom(world,48,20,'security');const topology=[...rig.root.children];rig.setPlayer(2,4,0);
 const first=rig.fixtures.map(light=>light.position.x);expect(Math.min(...first)).toBe(0);
 rig.setPlayer(44,4,0);expect(Math.max(...rig.fixtures.map(light=>light.position.x))).toBe(45);
 expect(rig.root.children).toEqual(topology);expect(rig.fixtures).toHaveLength(4);rig.dispose();
});
it('applies flash gain once to already-scaled VFX requests and once to raw attachments',()=>{
 const pool=new LightPool();pool.setIntensityScale(.25);
 const flash=pool.flash({x:0,z:0,color:0xffffff,intensity:2},true)!;
 expect(flash.intensity).toBe(2);pool.setIntensityScale(.5);expect(flash.intensity).toBe(4);
 const attached=pool.attach('burn',{x:1,z:1,color:0xff7a2e,intensity:8})!;expect(attached.intensity).toBe(4);pool.dispose();
});

it('uses only prepared visibility buckets while retaining every active light and resource identity', () => {
  const pool = new LightPool(), lights = [...pool.lights], children = [...pool.root.children];
  const visible = () => pool.lights.filter(light => light.visible).length;
  expect(pool.capacity).toBe(9); expect(pool.lights).toHaveLength(10); expect(visible()).toBe(0);
  const expected = [2, 2, 4, 4, 6, 6, 8, 8, 9];
  for (let i = 0; i < 9; i++) {
    const light = pool.attach(i, { x: i, z: 0, color: 0xffffff, duration: 1 })!;
    expect(light.visible).toBe(true); expect(visible()).toBe(expected[i]);
    expect(pool.lights.filter(candidate => candidate.intensity > 0).every(candidate => candidate.visible)).toBe(true);
  }
  // Release/fade an early slot; a source at the end must still be visible in a smaller bucket.
  for (let i = 0; i < 8; i++) pool.release(i, .01);
  pool.update(.02); expect(visible()).toBe(2); expect(pool.lights[8].visible).toBe(true);
  expect(pool.lights.filter(light => light.visible && light.intensity === 0)).toHaveLength(1);
  pool.setIntensityScale(0); expect(visible()).toBe(0);
  pool.setIntensityScale(.5); expect(visible()).toBe(2);
  pool.reset(); expect(visible()).toBe(0);
  expect(pool.lights).toEqual(lights); expect(pool.root.children).toEqual(children);
  pool.dispose();
});

it('exposes each shader count for prewarming and restores same-frame live visibility', () => {
  const pool = new LightPool(), visible = () => pool.lights.filter(light => light.visible).length;
  expect(pool.prewarmCounts).toEqual([0, 2, 4, 6, 8, 9]);
  for (const count of pool.prewarmCounts) {
    pool.setPrewarmCount(count); expect(visible()).toBe(count);
    expect(pool.lights.every((light, i) => light.visible === (i < count))).toBe(true);
  }
  pool.setPrewarmCount(null); expect(visible()).toBe(0);
  const light = pool.flash({ x: 0, z: 0, color: 0xffffff, duration: .1 })!;
  expect(light.visible).toBe(true); expect(visible()).toBe(2);
  pool.update(.2); expect(visible()).toBe(0);
  pool.setQuality('low'); pool.setPrewarmCount(9); expect(visible()).toBe(2);
  pool.setPrewarmCount(null); expect(visible()).toBe(0);
  pool.attach('late-projectile', { x: 1, z: 2, color: 0xffffff });
  expect(visible()).toBe(2); pool.dispose();
});

it('keeps broad illumination and deck albedo readable while practical hues define the room', () => {
  for (const mood of Object.values(ENVIRONMENT_MOODS)) {
    expect(mood.ambient.intensity).toBeGreaterThanOrEqual(.78);
    expect(mood.fill.intensity).toBeGreaterThanOrEqual(.8);
    expect(mood.grade.exposure).toBeGreaterThanOrEqual(1.1);
    expect(mood.grade.contrast).toBeLessThan(1.03);
    const room = new T.Group(), deck = new T.MeshStandardMaterial({ color: 0x263238, roughness: .91 });
    deck.name = 'painted-steel-deck'; room.add(new T.Mesh(new T.BoxGeometry(), deck));
    applyRoomMood(room, mood.environment);
    const channels = [deck.color.r, deck.color.g, deck.color.b];
    // Albedo stays neutral enough to preserve steel and hazard markings under local colored pools.
    expect(Math.min(...channels)).toBeGreaterThan(.17);
    expect(Math.max(...channels) / Math.min(...channels)).toBeLessThan(1.4);
    room.children.forEach(object => (object as T.Mesh).geometry.dispose()); deck.dispose();
  }
  const reactor = getEnvironmentMood('reactor');
  expect(new T.Color(reactor.fill.color).b).toBeGreaterThan(new T.Color(reactor.fill.color).r);
});

it('structures hot reactor emissives using a shared presentation clock and stable shader hook', () => {
  const material = new T.MeshStandardMaterial({ emissive: 0xffd69a, emissiveIntensity: 3.4 });
  applyHotFixtureSurface(material);
  const hook = material.onBeforeCompile, key = material.customProgramCacheKey();
  const shader = {
    uniforms: {} as Record<string, { value: unknown }>,
    vertexShader: '#include <common>\n#include <uv_vertex>',
    fragmentShader: '#include <common>\n#include <emissivemap_fragment>',
  };
  hook(shader as Parameters<T.Material['onBeforeCompile']>[0], {} as T.WebGLRenderer);
  expect(shader.fragmentShader).toContain('hotFixturePearl');
  expect(shader.fragmentShader).toContain('hotFixtureSeam');
  expect(shader.fragmentShader).toContain('totalEmissiveRadiance*=');
  updateHotFixtureSurfaces(2.5); expect(shader.uniforms.hotFixtureTime.value).toBe(2.5);
  applyHotFixtureSurface(material); expect(material.onBeforeCompile).toBe(hook);
  expect(material.customProgramCacheKey()).toBe(key); expect(material.emissiveIntensity).toBe(3.4);
  material.dispose();
});
