import { describe, expect, it, vi } from 'vitest';
import * as T from 'three';
import { ATMOSPHERE_CAPS, ATMOSPHERE_PROFILES, Atmosphere } from '../src/render/atmosphere/Atmosphere';

const camera = new T.PerspectiveCamera();

describe('bounded room atmosphere', () => {
  it('authors ten distinct profiles within four preallocated batches', () => {
    const scene = new T.Scene(), atmosphere = new Atmosphere(scene);
    const children = [...atmosphere.root.children];
    const origins = atmosphere.motes.geometry.getAttribute('origin');
    expect(scene.children).toContain(atmosphere.root);
    expect(children).toHaveLength(4);
    expect(Object.keys(ATMOSPHERE_PROFILES)).toHaveLength(10);
    expect(new Set(Object.values(ATMOSPHERE_PROFILES).map(profile => JSON.stringify(profile))).size).toBe(10);
    for (const environment of Object.keys(ATMOSPHERE_PROFILES) as (keyof typeof ATMOSPHERE_PROFILES)[]) {
      atmosphere.loadRoom(environment, 30, 24);
      expect(atmosphere.motes.geometry.instanceCount).toBeLessThanOrEqual(ATMOSPHERE_CAPS.motes);
      expect(atmosphere.fog.geometry.instanceCount).toBeLessThanOrEqual(ATMOSPHERE_CAPS.fog);
      expect(atmosphere.plumes.geometry.instanceCount).toBeLessThanOrEqual(ATMOSPHERE_CAPS.plumes);
      expect(atmosphere.shafts.count).toBeLessThanOrEqual(ATMOSPHERE_CAPS.shafts);
      expect(atmosphere.motes.geometry.getAttribute('origin')).toBe(origins);
      expect(atmosphere.root.children).toEqual(children);
      for (const mesh of [atmosphere.motes, atmosphere.fog, atmosphere.plumes, atmosphere.shafts]) {
        expect(mesh.material.depthWrite).toBe(false);
        expect(mesh.material.depthTest).toBe(true);
      }
      expect(atmosphere.fog.material.uniforms.opacity.value).toBeLessThan(.04);
    }
    atmosphere.dispose();
  });

  it('puts low mist and vent plumes at room edges, with motes distributed in physical depth', () => {
    const atmosphere = new Atmosphere();
    atmosphere.loadRoom('engineering', 30, 24);
    for (const mesh of [atmosphere.fog, atmosphere.plumes]) {
      const origins = mesh.geometry.getAttribute('origin');
      for (let i = 0; i < mesh.geometry.instanceCount; i++) {
        const x = origins.getX(i), z = origins.getZ(i);
        expect(Math.min(x, 30 - x, z, 24 - z)).toBeLessThan(.56);
      }
    }
    const heights = atmosphere.motes.geometry.getAttribute('origin');
    expect(heights.getY(0)).not.toBe(heights.getY(1));
    expect(atmosphere.plumes.geometry.instanceCount).toBeGreaterThan(0);
    expect(atmosphere.plumes.material.uniforms.heat.value).toBeGreaterThan(0);
    atmosphere.loadRoom('infested', 30, 24);
    expect(atmosphere.motes.material.uniforms.kind.value).toBe(1);
    atmosphere.loadRoom('reactor', 30, 24);
    expect(atmosphere.motes.material.uniforms.kind.value).toBe(2);
    atmosphere.dispose();
  });

  it('anchors a bounded scattering batch at active practical fixture origins', () => {
    const atmosphere = new Atmosphere();
    const fixtures = Array.from({ length: 8 }, (_, i) => new T.PointLight(0xffaa77, 10));
    fixtures.forEach((fixture, i) => fixture.position.set(i * 3, 2.4, 5));
    fixtures[0].visible = false;
    fixtures[1].intensity = 0;
    atmosphere.loadRoom('cargo', 30, 24, fixtures);
    expect(atmosphere.shafts.count).toBe(4);
    const matrix = new T.Matrix4(), origin = new T.Vector3();
    atmosphere.shafts.getMatrixAt(0, matrix);
    origin.setFromMatrixPosition(matrix);
    expect(origin.toArray()).toEqual([6, expect.closeTo(2.4), 5]);
    const bottom = new T.Vector3(0, -1, 0).applyMatrix4(matrix);
    expect(bottom.y).toBeCloseTo(.06);
    atmosphere.loadRoom('cargo', 30, 24);
    expect(atmosphere.shafts.count).toBe(0);
    expect(atmosphere.shafts.visible).toBe(false);
    atmosphere.dispose();
  });

  it('does no animation on Low, disabled atmosphere, pause or reduced motion', () => {
    const atmosphere = new Atmosphere();
    atmosphere.loadRoom('reactor', 30, 24);
    const time = () => atmosphere.motes.material.uniforms.time.value as number;
    atmosphere.update(.05, camera);
    expect(time()).toBeCloseTo(.05);
    atmosphere.update(0, camera);
    atmosphere.update(-1, camera);
    atmosphere.update(Number.NaN, camera);
    expect(time()).toBeCloseTo(.05);
    atmosphere.setOptions({ atmosphere: true }, 'low');
    atmosphere.update(.05, camera);
    expect(atmosphere.root.visible).toBe(false);
    expect(time()).toBeCloseTo(.05);
    atmosphere.setOptions({ atmosphere: false }, 'high');
    atmosphere.update(.05, camera);
    expect(time()).toBeCloseTo(.05);
    atmosphere.setOptions({ atmosphere: true }, 'high', true);
    atmosphere.update(.05, camera);
    expect(atmosphere.root.visible).toBe(true);
    expect(time()).toBeCloseTo(.05);
    atmosphere.setOptions({ atmosphere: true }, 'high');
    atmosphere.update(100, camera);
    expect(time()).toBeCloseTo(.15);
    atmosphere.loadRoom('habitation', 30, 24);
    expect(time()).toBe(0);
    atmosphere.dispose();
  });

  it('prewarms every shader even on Low in a room with no steam, mist or fixtures, then restores', () => {
    const atmosphere = new Atmosphere();
    atmosphere.loadRoom('security', 30, 24);
    atmosphere.setOptions({ atmosphere: false }, 'low');
    const restore = atmosphere.prepare();
    expect(atmosphere.root.visible).toBe(true);
    expect(atmosphere.root.children.every(child => child.visible)).toBe(true);
    expect(atmosphere.fog.geometry.instanceCount).toBe(1);
    expect(atmosphere.plumes.geometry.instanceCount).toBe(1);
    expect(atmosphere.shafts.count).toBe(1);
    restore();
    expect(atmosphere.root.visible).toBe(false);
    expect(atmosphere.motes.geometry.instanceCount).toBe(24);
    expect(atmosphere.fog.geometry.instanceCount).toBe(0);
    expect(atmosphere.plumes.geometry.instanceCount).toBe(0);
    expect(atmosphere.shafts.count).toBe(0);
    expect(atmosphere.root.children.filter(child => child.visible)).toHaveLength(1);
    atmosphere.dispose();
  });

  it('disposes each GPU resource once and detaches the owner through room and tier changes', () => {
    const scene = new T.Scene(), atmosphere = new Atmosphere(scene);
    const resources = [atmosphere.motes, atmosphere.fog, atmosphere.plumes, atmosphere.shafts]
      .flatMap(mesh => [vi.spyOn(mesh.geometry, 'dispose'), vi.spyOn(mesh.material, 'dispose')]);
    for (let i = 0; i < 5; i++) {
      atmosphere.loadRoom('cryogenics', 30, 24);
      atmosphere.setOptions({ atmosphere: true }, i % 2 ? 'low' : 'high');
      atmosphere.update(.016, camera);
    }
    const restore = atmosphere.prepare();
    atmosphere.dispose();
    atmosphere.dispose();
    restore();
    atmosphere.update(.016, camera);
    atmosphere.setOptions({ atmosphere: true }, 'high');
    expect(resources.every(spy => spy.mock.calls.length === 1)).toBe(true);
    expect(atmosphere.root.visible).toBe(false);
    expect(atmosphere.root.children).toHaveLength(0);
    expect(scene.children).not.toContain(atmosphere.root);
  });
});
