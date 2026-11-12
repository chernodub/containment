import * as T from 'three';
import { describe, expect, it } from 'vitest';
import { AbilityVisuals } from './AbilityVisuals';
import { AttackEffects } from '../AttackEffects';
import { TelegraphBatch } from '../vfx/TelegraphBatch';
import { FriendlyBoundaryBatch, FRIENDLY_GROUND_ORDER } from './FriendlyBoundary';
import { AbilityLightningBatch } from './LightningBatch';

describe('friendly ability readability contracts', () => {
  it('uses the friendly boundary material for every ability telegraph and keeps hostile fills above ground effects', () => {
    const scene = new T.Scene(), visuals = new AbilityVisuals(scene), hostile = new TelegraphBatch(scene);
    let boundaries = 0;
    visuals.root.traverse(node => {
      if (!(node instanceof T.Mesh)) return;
      if (node.name === 'ground-telegraphs') {
        const material = node.material as T.ShaderMaterial;
        expect(material.userData.friendlyBoundary).toBe(true);
        expect(material.fragmentShader).toContain('float dash=');
        expect(material.fragmentShader).toContain('float tick=');
        expect(material.fragmentShader).not.toContain('filled');
        boundaries++;
      }
      if (node.renderOrder === FRIENDLY_GROUND_ORDER || node.name === 'ground-telegraphs') {
        expect(node.renderOrder).toBeLessThan(hostile.mesh.renderOrder);
        expect((node.material as T.Material).depthWrite).toBe(false);
      }
    });
    expect(boundaries).toBe(3);
    expect((hostile.mesh.material as T.ShaderMaterial).fragmentShader).toContain('filled*.14');
    const attacks = new AttackEffects(scene, undefined);
    const hostilePulse = scene.children.find(node => node instanceof T.InstancedMesh && node.geometry instanceof T.RingGeometry && node.geometry.parameters.innerRadius === .955);
    expect(hostilePulse?.renderOrder).toBe(hostile.mesh.renderOrder);
    attacks.dispose(); hostile.dispose(); visuals.dispose();
  });


  it('keeps exact sustained boundaries without duplicate large ground quads beneath rig surfaces', () => {
    const visuals = new AbilityVisuals(new T.Group());
    visuals.update({rig:'pyro', slots:null, zones:[{id:1,ability:'napalm-charge',element:'pyro',shape:'circle',x:96,y:128,radius:120,x2:0,y2:0,width:0,durationMs:6000,remainingMs:4000,attached:false}], deployables:[],overdrive:{active:false,ready:false,charge:0,activeRemainingMs:0},invulnerable:false,dashing:false,hostileTimeScale:1},0);
    let boundaries=0, groundSurfaces=0;
    visuals.root.traverseVisible(n=>{if(!(n instanceof T.Mesh))return;const m=n.material as T.ShaderMaterial;if(m.userData.friendlyBoundary&&n instanceof T.InstancedMesh)boundaries+=n.count;if(m.uniforms?.kind)groundSurfaces++;});
    expect(boundaries).toBeGreaterThan(0);expect(groundSurfaces).toBe(0);
    expect(visuals.kit.batches.decal.mesh.count).toBe(1);visuals.dispose();
  });

  it('freezes friendly dash rotation for reduced motion and preserves exact shapes', () => {
    const b = new FriendlyBoundaryBatch(new T.Group(), 4);
    b.setTime(4, false); expect((b.mesh.material as T.ShaderMaterial).uniforms.boundaryTime.value).toBe(4);
    b.setTime(4, true); expect((b.mesh.material as T.ShaderMaterial).uniforms.boundaryTime.value).toBe(0);
    b.add({ shape: 'circle', x: 2, z: 4, radius: 7 });
    const m = new T.Matrix4(), scale = new T.Vector3(); b.mesh.getMatrixAt(0, m); scale.setFromMatrixScale(m);
    expect(scale.x).toBeCloseTo(7); expect(scale.y).toBeCloseTo(7); b.dispose();
  });

  it.each([false, true])('streams tapered caller-width lightning with 40ms rerolls, exact contacts and no new buffers (Low %s)', low => {
    const b = new AbilityLightningBatch(new T.Group(), 256); b.low = low;
    const r = { start: new T.Vector3(1, .9, 2), end: new T.Vector3(6, .7, 4), lightning: true, width: .2, seed: 7 };
    const matrices = b.mesh.instanceMatrix.array;
    b.begin(); b.append(r, .001); b.end();
    const first = matrices.slice(), count = b.mesh.count, m = new T.Matrix4(), scale = new T.Vector3();
    expect(count).toBeLessThanOrEqual(low ? 12 : 23);
    for (let i = 0; i < count; i++) {
      b.mesh.getMatrixAt(i, m); scale.setFromMatrixScale(m);
      expect(scale.x).toBeLessThanOrEqual(.144); expect(scale.z).toBeLessThanOrEqual(.144);
      if (i < 2) expect(scale.x).toBeGreaterThan(.045);
    }
    b.begin(); b.append(r, .035); b.end(); expect(matrices).toEqual(first);
    b.begin(); b.append(r, .045); b.end(); expect(matrices).not.toEqual(first);
    expect(b.mesh.instanceMatrix.array).toBe(matrices);
    // Last core segment terminates exactly at the real target.
    b.mesh.getMatrixAt(count - 1, m);
    const end = new T.Vector3(0, .5, 0).applyMatrix4(m);
    expect(end.distanceTo(r.end)).toBeLessThan(.00001);
    b.begin(); b.append(r, .5, true); b.end(); const still = matrices.slice();
    b.begin(); b.append(r, .9, true); b.end(); expect(matrices).toEqual(still); b.dispose();
  });
});
