import * as T from 'three';
import { describe, expect, it, vi } from 'vitest';
import { ElementKit, ABILITY_VFX_LIMITS } from './ElementKit';
import { GRAPHICS_PRESETS } from '../graphicsOptions';

describe('V3 shared spectacle', () => {
  it('bounds the volume to the real radius and reduces height without shrinking Low footprints', () => {
    const k = new ElementKit(new T.Scene()), m = new T.Matrix4(), p = new T.Vector3(), q = new T.Quaternion(), s = new T.Vector3();
    for (const tier of ['high', 'low'] as const) {
      k.setOptions(GRAPHICS_PRESETS[tier], tier, false); k.begin(0);
      k.front(3, 4, 7, 1.2, 0xffb454, 1.5);
      k.end(); k.batches.front.mesh.getMatrixAt(0, m); m.decompose(p, q, s);
      expect(s.x).toBeCloseTo(7); expect(s.z).toBeCloseTo(7);
      expect(p.y - s.y * .12).toBeCloseTo(.025);
      expect(s.y * .24).toBeCloseTo(tier === 'low' ? .9 : 1.5);
      const bounds = k.batches.front.mesh.geometry; bounds.computeBoundingBox();
      expect(bounds.boundingBox!.max.x).toBeCloseTo(1);
    }
    k.dispose();
  });

  it('keeps full-length scars for eight seconds, pauses and retires them at expiry', () => {
    const k = new ElementKit(new T.Scene()), m = new T.Matrix4();
    k.scar('trench', 10, 4, 14, 0x201711, 9, Math.PI / 2, .55);
    k.begin(8); k.end(); expect(k.batches.decal.mesh.count).toBe(1);
    k.batches.decal.mesh.getMatrixAt(0, m);
    const bounds = new T.Box3().setFromBufferAttribute(k.batches.decal.mesh.geometry.getAttribute('position') as T.BufferAttribute).applyMatrix4(m);
    expect(bounds.max.z - bounds.min.z).toBeCloseTo(28);
    expect(bounds.max.x - bounds.min.x).toBeCloseTo(1.1);
    const before = m.elements.slice(); k.begin(0); k.end(); k.batches.decal.mesh.getMatrixAt(0, m);
    expect(m.elements).toEqual(before); k.begin(1); k.end(); expect(k.batches.decal.mesh.count).toBe(0); k.dispose();
  });

  it('shares fixed pools for debris, liquid, ice and afterimages under repeated use', () => {
    const scene = new T.Scene(), k = new ElementKit(scene), inventory = scene.children.slice();
    for (let i = 0; i < 100; i++) k.debris(0, 0, 6, 'kinetic', 28);
    k.begin(.03); k.liquidFire(0, 0, 4); k.iceColumn(1, 2, .8, .7, 2, .4); k.iceShell(1, 1, .5, 1.6); k.afterImage(2, 2, .3, 0xb79cff, .4); k.end();
    expect(k.counts.particles).toBe(ABILITY_VFX_LIMITS.particles);
    expect(scene.children).toEqual(inventory);
    k.setOptions(GRAPHICS_PRESETS.low, 'low', false); k.begin(.02); k.debris(0, 0, 4, 'cryo', 64); k.end();
    expect(k.counts.particles).toBeLessThanOrEqual(160); k.dispose();
  });

  it('streams varied directional tongues inside the cone and leaves only dark persistent floor aftermath', () => {
    const k = new ElementKit(new T.Scene()), m = new T.Matrix4(), scale = new T.Vector3(), position = new T.Vector3();
    const material = k.batches.decal.mesh.material, phase = k.batches.decal.mesh.geometry.getAttribute('abilityPhase');
    k.scar('trench', 8, 4, 6, 0x201711, 12, .3, .6);
    k.begin(0); k.end(); expect(phase.getX(0)).toBeCloseTo(2.1);
    k.begin(1.1); k.fireFan(2, 3, 9, .7, 1.4, .8); k.end();
    expect(phase.getX(0)).toBe(2); expect(k.batches.decal.mesh.count).toBe(1);
    expect(k.batches.flame.mesh.count).toBeGreaterThanOrEqual(16);
    expect(k.batches.flame.mesh.count).toBeLessThan(48);
    expect(k.batches.flame.mesh.count).toBeLessThanOrEqual(k.batches.flame.capacity);
    for (let i = 0; i < k.batches.flame.mesh.count; i++) {
      k.batches.flame.mesh.getMatrixAt(i, m); scale.setFromMatrixScale(m); position.setFromMatrixPosition(m);
      const dx = position.x - 2, dz = position.z - 3;
      expect(Math.hypot(dx, dz)).toBeLessThan(9);
      expect(Math.abs(Math.atan2(dz, dx) - .7)).toBeLessThan(.7);
      expect(scale.y * 2).toBeGreaterThan(.5); expect(scale.y * 2).toBeLessThanOrEqual(2.8);
      expect(position.y).toBeGreaterThan(.15);
    }
    expect(k.batches.decal.mesh.material).toBe(material);
    k.begin(0); k.end(); expect(k.batches.flame.mesh.count).toBe(0); k.dispose();
  });


  it('projects directional combustion along the actual camera right axis instead of a fixed screen diagonal', () => {
    const k = new ElementKit(new T.Group()), camera = new T.PerspectiveCamera();
    camera.position.set(0,8,8);camera.lookAt(0,0,0);camera.updateMatrixWorld();k.setView(camera);k.begin(0);
    k.directedFlame(0,0,0,.2,1,-Math.PI/2,2,1);k.directedFlame(0,0,0,.2,1,0,2,1);k.end();
    const m = new T.Matrix4();k.batches.flame.mesh.getMatrixAt(0,m);expect(m.elements[4]).toBeCloseTo(0);
    k.batches.flame.mesh.getMatrixAt(1,m);expect(m.elements[4]).toBeGreaterThan(.1);k.dispose();
  });

  it('uses one prepared composite input and suppresses exposure impulses at zero flash or reduced motion', () => {
    const k = new ElementKit(new T.Scene()), setAbilityPresentation = vi.fn();
    k.bind({ lights: {} as never, distortion: {} as never, camera: {} as never, presentation: { setAbilityPresentation } });
    k.begin(0); k.exposureFlash(.8); k.grade(.4, .7); k.end();
    expect(setAbilityPresentation).toHaveBeenLastCalledWith(.8, .4, .7);
    k.begin(0); k.end(); expect(setAbilityPresentation).toHaveBeenLastCalledWith(0, 0, 0);
    for (const reduced of [false, true]) {
      k.setOptions({ ...GRAPHICS_PRESETS.high, flashIntensity: reduced ? 1 : 0 }, 'high', reduced);
      k.begin(.016); k.exposureFlash(1); k.end(); expect(setAbilityPresentation.mock.lastCall![0]).toBe(0);
    }
    k.clear(); expect(setAbilityPresentation).toHaveBeenLastCalledWith(0, 0, 0); k.dispose();
  });

  it('keeps the heavy impact punch to two frames without extending it through the ordinary camera helper', () => {
    const k = new ElementKit(new T.Scene()), punch = vi.fn(), addTrauma = vi.fn();
    k.bind({ lights: {} as never, distortion: {} as never, camera: { punch, addTrauma, kick() {} } });
    k.camera(.54); expect(punch).toHaveBeenLastCalledWith(.0324, 34);
    k.setOptions(GRAPHICS_PRESETS.high, 'high', true); k.camera(.92);
    expect(addTrauma).toHaveBeenCalledOnce(); k.dispose();
  });
});
