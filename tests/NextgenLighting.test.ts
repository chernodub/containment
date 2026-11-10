import { afterEach, describe, expect, it, vi } from 'vitest';
import * as T from 'three';
import { SceneLighting } from '../src/render/SceneLighting';
import { LightPool } from '../src/render/lighting/LightPool';
import { ENVIRONMENT_MOODS, getEnvironmentMood } from '../src/render/lighting/EnvironmentMoods';
import { RoomReflectionCapture } from '../src/render/lighting/RoomReflectionCapture';
import { applyRoomMood } from '../src/render/lighting/applyRoomMood';

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
  it('bounds priority replacement, one-shot fade, topology and quality budgets', () => {
    const pool = new LightPool(), children = [...pool.root.children];
    for (let i = 0; i < 10; i++) expect(pool.flash({ x: i, z: 0, color: 0xffaa44, priority: 5, duration: 1 })).not.toBeNull();
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
    expect((room as T.Scene).environment).toBeNull(); expect(actor.visible).toBe(false); expect(atmosphere.visible).toBe(false);
  });
  const pmrem = vi.spyOn(T.PMREMGenerator.prototype, 'fromCubemap').mockReturnValue(generated);
  const cubeDispose = vi.spyOn(T.WebGLCubeRenderTarget.prototype, 'dispose');
  const reflections = new RoomReflectionCapture({} as T.WebGLRenderer, scene);
  expect(reflections.capture(10, 2, 8, [actor, atmosphere])).toBe(true);
  expect(scene.environment).toBe(generated.texture); expect(actor.visible).toBe(true); expect(atmosphere.visible).toBe(false);
  expect(reflections.capture(10, 2, 8)).toBe(false);
  expect(capture).toHaveBeenCalledOnce(); expect(pmrem).toHaveBeenCalledOnce(); expect(cubeDispose).toHaveBeenCalledOnce();
  reflections.invalidate(); expect(dispose).toHaveBeenCalledOnce(); expect(scene.environment).toBeNull();
  reflections.dispose(); expect(dispose).toHaveBeenCalledOnce();
});

it('restores excluded objects and environment if reflection capture fails', () => {
  const scene = new T.Scene(), actor = new T.Group(), previous = new T.Texture(); scene.environment = previous;
  vi.spyOn(T.CubeCamera.prototype, 'update').mockImplementation(() => { throw new Error('context lost'); });
  const dispose = vi.spyOn(T.WebGLCubeRenderTarget.prototype, 'dispose');
  const reflections = new RoomReflectionCapture({} as T.WebGLRenderer, scene);
  expect(() => reflections.capture(0, 2, 0, [actor])).toThrow('context lost');
  expect(actor.visible).toBe(true); expect(scene.environment).toBe(previous); expect(dispose).toHaveBeenCalledOnce();
  reflections.dispose(); previous.dispose();
});
