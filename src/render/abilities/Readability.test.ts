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
        expect(material.forceSinglePass).toBe(true);
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
    expect(boundaries).toBe(1);
    expect(visuals.kit.rings.capacity).toBe(112 + 32 + 160);
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


  it('retains impact waves, casts and authoritative footprints together in the shared boundary draw', () => {
    const v = new AbilityVisuals(new T.Group());
    v.kit.ring(1, 2, 5, 0xffb454, .6);
    v.event({ability:'seismic-slam',rig:'breacher',slot:'tactical',element:'kinetic',phase:'cast',durationMs:220,radius:230},32,64);
    v.update({rig:'breacher',slots:null,zones:[{id:1,ability:'napalm-charge',element:'pyro',shape:'circle',x:32,y:64,radius:96,x2:0,y2:0,width:0,durationMs:6000,remainingMs:4000,attached:false}],deployables:[],overdrive:{active:false,ready:false,charge:0,activeRemainingMs:0},invulnerable:false,dashing:false,hostileTimeScale:1},.05);
    const b = v.kit.rings.mesh, kinds = b.geometry.getAttribute('telegraph'), weights = b.geometry.getAttribute('abilityPriority');
    expect(b.count).toBe(3);expect(kinds.getX(0)).toBe(3);expect(kinds.getX(1)).toBe(0);expect(kinds.getX(2)).toBe(0);
    expect([weights.getX(0),weights.getX(1),weights.getX(2)]).toEqual([0,1,0]);
    v.clear();expect(b.count).toBe(0);v.dispose();
  });

  it('freezes friendly dash rotation for reduced motion and preserves exact shapes', () => {
    const b = new FriendlyBoundaryBatch(new T.Group(), 4);
    b.setTime(4, false); expect((b.mesh.material as T.ShaderMaterial).uniforms.boundaryTime.value).toBe(4);
    b.setTime(4, true); expect((b.mesh.material as T.ShaderMaterial).uniforms.boundaryTime.value).toBe(0);
    b.add({ shape: 'circle', x: 2, z: 4, radius: 7 });
    const m = new T.Matrix4(), scale = new T.Vector3(); b.mesh.getMatrixAt(0, m); scale.setFromMatrixScale(m);
    expect(scale.x).toBeCloseTo(7); expect(scale.y).toBeCloseTo(7); b.dispose();
  });


  it('keeps the exact rounded strip in one instance and fades only its pixels inside the dominant storm', () => {
    const b = new FriendlyBoundaryBatch(new T.Group(), 8), m = new T.Matrix4();
    b.setColdDominance(3, 4, 7);
    b.addCapsule(2, 4, 5, 1.5, .7, 0x7fd6ff, .22);
    b.mesh.getMatrixAt(0, m);
    const start = new T.Vector3(-1, 0, 0).applyMatrix4(m), end = new T.Vector3(1, 0, 0).applyMatrix4(m);
    expect(start.x).toBeCloseTo(2 - Math.cos(.7) * .75);
    expect(start.z).toBeCloseTo(4 - Math.sin(.7) * .75);
    expect(end.x).toBeCloseTo(2 + Math.cos(.7) * 5.75);
    expect(end.z).toBeCloseTo(4 + Math.sin(.7) * 5.75);
    expect(b.mesh.count).toBe(1);
    expect(b.mesh.geometry.getAttribute('boundaryCapsule').getX(0)).toBeCloseTo(1.5 / 6.5);
    const cold = b.mesh.geometry.getAttribute('coldDominance');
    expect([cold.getX(0), cold.getY(0), cold.getZ(0)]).toEqual([3, 4, 7]);
    b.setColdDominance(); b.add({ shape: 'circle', x: 3, z: 4, radius: 7 });
    expect(cold.getZ(1)).toBe(0); // Dominant perimeter never suppresses itself.
    b.clear(); b.add({ shape: 'circle', x: 1, z: 2, radius: 3 });
    expect(b.mesh.geometry.getAttribute('boundaryCapsule').getX(0)).toBe(0);
    expect(cold.getZ(0)).toBe(0); b.dispose();
  });

  it('lets Whiteout own the persistent local boundary while preserving exact Frost Trail endpoints', () => {
    const v = new AbilityVisuals(new T.Group());
    const common = { element: 'cryo' as const, x: 96, y: 128, radius: 240, x2: 192, y2: 128, width: 44, durationMs: 6000, remainingMs: 4000, attached: false };
    v.update({rig:'cryo',slots:null,zones:[{...common,id:1,ability:'whiteout',shape:'circle'}, {...common,id:2,ability:'frost-trail',shape:'strip'}],deployables:[],overdrive:{active:false,ready:false,charge:0,activeRemainingMs:0},invulnerable:false,dashing:false,hostileTimeScale:1},0);
    const b = v.kit.rings.mesh, cold = b.geometry.getAttribute('coldDominance');
    expect(b.count).toBe(2); expect(cold.getZ(0)).toBe(0); expect(cold.getZ(1)).toBe(7.5);
    expect(b.geometry.getAttribute('boundaryCapsule').getX(1)).toBeCloseTo(44 / (96 + 44));
    v.clear(); expect(b.count).toBe(0); v.dispose();
  });

  it.each([false,true])('spends only two segments on local suit crackles without changing long target bolts (Low %s)', low => {
    const b = new AbilityLightningBatch(new T.Group(),256);b.low=low;
    const r = {start:new T.Vector3(0,1,0),end:new T.Vector3(.2,1.1,0),lightning:true,width:.018};
    b.begin();b.append(r,.1);b.end();expect(b.mesh.count).toBe(4);
    r.end.set(6,1,0);b.begin();b.append(r,.1);b.end();expect(b.mesh.count).toBeGreaterThanOrEqual(12);expect(b.mesh.count).toBeLessThanOrEqual(23);
    b.dispose();
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
