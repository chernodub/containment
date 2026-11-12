import { describe, expect, it, vi } from 'vitest';
import * as T from 'three';
import { AttackEffects, EFFECT_LIMITS } from '../src/render/AttackEffects';
import { TelegraphBatch, EnergyRibbonBatch, createGroundZoneMaterial, createDeployableShieldMaterial, demoVfx } from '../src/render/vfx';
import { actorSurface } from '../src/render/vfx/ActorSurface';
import { afflictionEffects, AfflictionBatches } from '../src/render/afflictions';

describe('next generation combat presentation', () => {
  it('sends bounded local light and shockwave feedback and respects flash/motion options', () => {
    const scene = new T.Scene(), fx = new AttackEffects(scene);
    const flash = vi.fn(), shockwave = vi.fn();
    fx.setFeedback({ flash, shockwave });
    fx.shot(new T.Vector3(1, 1, 2), 0, 'pistol');
    expect(flash).toHaveBeenCalledOnce();
    expect(flash.mock.calls[0][0]).toMatchObject({ intensity: 1.6, priority: 2 });
    fx.event({ type: 'explosion', x: 64, y: 96, radius: 96, elements: ['fire'] });
    expect(shockwave.mock.calls[0][0]).toMatchObject({ radius: 3, duration: .42 });
    fx.setOptions({ reducedMotion: true, flashIntensity: .5 });
    fx.event({ type: 'explosion', x: 0, y: 0, radius: 96 });
    expect(shockwave).toHaveBeenCalledOnce();
    expect(flash.mock.calls.at(-1)![0].intensity).toBe(2);
    fx.setOptions({ flashIntensity: 0 });
    const count = flash.mock.calls.length;
    fx.shot(new T.Vector3(), 0, 'shotgun');
    expect(flash).toHaveBeenCalledTimes(count);
    fx.dispose(); fx.dispose(); expect(scene.children).toHaveLength(0);
  });

  it('reuses fixed CPU particle objects across saturation, expiration, clearing and tier switches', () => {
    const scene = new T.Scene(), fx = new AttackEffects(scene), camera = new T.Camera();
    type Particle = { age: number; life: number };
    const internal = fx as unknown as { particleFree: Map<Particle[], Particle[]>; glow: Particle[] };
    const inventory = new Set([...internal.particleFree].flatMap(([active, free]) => [...active, ...free]));
    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < 100; i++) fx.shot(new T.Vector3(), 0, 'shotgun');
      fx.setOptions({ tier: 'low' });
      expect(fx.counts.glow).toBeLessThanOrEqual(Math.floor(EFFECT_LIMITS.glow * .45));
      fx.update(10, camera, []);
      fx.clear(); fx.setOptions({ tier: 'high' });
    }
    const after = [...internal.particleFree].flatMap(([active, free]) => [...active, ...free]);
    expect(after).toHaveLength(inventory.size);
    expect(after.every(p => inventory.has(p))).toBe(true);
    fx.dispose();
  });

  it('keeps exact warning hit dimensions while filling without growth or extra draws', () => {
    const scene = new T.Scene(), warnings = new TelegraphBatch(scene, 4);
    const cone = warnings.add({ shape: 'cone', x: 2, z: 3, radius: 4, arc: Math.PI / 3, angle: Math.PI / 2 });
    const line = warnings.add({ shape: 'line', x: 0, z: 0, length: 6, width: 2, angle: Math.PI / 2 });
    const matrix = new T.Matrix4(), position = new T.Vector3(), scale = new T.Vector3(), rotation = new T.Quaternion();
    warnings.mesh.getMatrixAt(cone, matrix); matrix.decompose(position, rotation, scale);
    expect(scale.x).toBeCloseTo(4); expect(scale.y).toBeCloseTo(4); expect(position.x).toBeCloseTo(2);
    warnings.mesh.getMatrixAt(line, matrix); matrix.decompose(position, rotation, scale);
    expect(position.z).toBeCloseTo(3); expect(position.x).toBeCloseTo(0); expect(scale.x * 2).toBeCloseTo(6); expect(scale.y * 2).toBeCloseTo(2);
    const before = matrix.clone(); warnings.progress(line, 5); warnings.mesh.getMatrixAt(line, matrix); expect(matrix).toEqual(before);
    expect(warnings.mesh.geometry.getAttribute('telegraph').getY(line)).toBe(1);
    for (let i = 0; i < 40; i++) warnings.add({ shape: 'circle', x: i, z: 0 });
    expect(warnings.mesh.count).toBeLessThanOrEqual(4); expect(scene.children).toHaveLength(1);
    warnings.remove(cone); expect(warnings.mesh.geometry.getAttribute('telegraph').getW(cone)).toBe(0);
    warnings.clear(); expect(warnings.mesh.count).toBe(0); warnings.dispose(); expect(scene.children).toHaveLength(0);
  });

  it('shows the full enemy warning radius throughout anticipation and increases urgency', () => {
    const scene = new T.Scene(), fx = new AttackEffects(scene), camera = new T.Camera();
    fx.event({ type: 'enemy-warning', x: 32, y: 64, radius: 96, durationMs: 1000 });
    const ring = scene.getObjectByName('hostile-warning-fills') as T.InstancedMesh, matrix = new T.Matrix4();
    fx.update(.01, camera, []); ring.getMatrixAt(0, matrix);
    expect(new T.Vector3().setFromMatrixScale(matrix).x).toBeCloseTo(3);
    const alpha = ring.geometry.getAttribute('effectAlpha').getX(0);
    fx.update(.8, camera, []); ring.getMatrixAt(0, matrix);
    expect(new T.Vector3().setFromMatrixScale(matrix).x).toBeCloseTo(3);
    expect(ring.geometry.getAttribute('effectAlpha').getX(0)).toBeGreaterThan(alpha);
    fx.dispose();
  });

  it('anchors lightning endpoints, saturates one ribbon draw and freezes restrikes under reduced motion', () => {
    const scene = new T.Scene(), ribbons = new EnergyRibbonBatch(scene, 48);
    const effect = { start: new T.Vector3(0, 1, 0), end: new T.Vector3(6, 1, 0), lightning: true, seed: 7 };
    ribbons.begin(); ribbons.append(effect, 1, true); ribbons.end();
    const before = ribbons.mesh.instanceMatrix.array.slice();
    ribbons.begin(); ribbons.append(effect, 4, true); ribbons.end();
    expect(ribbons.mesh.instanceMatrix.array).toEqual(before);
    expect(ribbons.mesh.count).toBe(24);
    ribbons.append(effect); ribbons.append(effect); expect(ribbons.mesh.count).toBe(48);
    ribbons.dispose(); expect(scene.children).toHaveLength(0);
  });

  it('composes actor rim, hit and dissolve with frozen surfaces before first compilation', () => {
    const material = new T.MeshStandardMaterial(), root = new T.Group();
    root.add(new T.Mesh(new T.BoxGeometry(), material));
    const surface = actorSurface([material], false, true), status = afflictionEffects(root, 1, 1);
    surface.hit(1); surface.dissolve(.4); status.set({ chilled: true, burning: false, frozen: true });
    const shader = { uniforms: {}, vertexShader: '#include <begin_vertex>', fragmentShader: '#include <color_fragment>\n#include <emissivemap_fragment>' };
    material.onBeforeCompile(shader as never, {} as T.WebGLRenderer);
    const uniforms = shader.uniforms as Record<string, { value: number }>;
    expect(uniforms.actorFlash.value).toBe(1); expect(uniforms.actorDissolve.value).toBe(.4); expect(uniforms.statusFrost.value).toBe(1);
    expect(shader.fragmentShader).toContain('actorRim'); expect(shader.fragmentShader).toContain('frostPatch');
    surface.reset(); status.reset(); expect(uniforms.actorDissolve.value).toBe(0); expect(uniforms.statusFrost.value).toBe(0);
    root.children[0].removeFromParent(); material.dispose();
  });

  it('constructs, animates and disposes every reusable material and demo primitive', () => {
    const scene = new T.Scene(), demo = demoVfx(scene);
    demo.update(.5); demo.update(1, true);
    const fire = createGroundZoneMaterial('fire'), frost = createGroundZoneMaterial('frost'), electric = createGroundZoneMaterial('electric'), shield = createDeployableShieldMaterial();
    for (const material of [fire, frost, electric, shield]) { expect(material.depthWrite).toBe(false); expect(material.uniforms.motion.value).toBe(1); material.dispose(); }
    demo.dispose(); expect(scene.children).toHaveLength(0);
  });

  it('preserves all persistent status cues on Low and holds motion while requested', () => {
    const batch = new AfflictionBatches(undefined, 1), root = new T.Group(), camera = new T.Camera();
    afflictionEffects(root, 2, 1).set({ burning: true, poisoned: true, chilled: true, frozen: true });
    batch.setOptions({ tier: 'low', reducedMotion: true, flashIntensity: 0 });
    batch.update([root], camera, 1);
    expect(batch.counts).toEqual({ fire: 3, poison: 2, ice: 6, drops: 2, embers: 2 });
    const before = batch.root.children.map(m => (m as T.InstancedMesh).instanceMatrix.array.slice());
    batch.update([root], camera, 4);
    expect(batch.root.children.map(m => (m as T.InstancedMesh).instanceMatrix.array)).toEqual(before);
    batch.setOptions({ tier: 'high', reducedMotion: false }); batch.update([root], camera, 4);
    expect(batch.counts.fire).toBe(6); batch.dispose();
  });
});

it('keeps marine and alien shader families distinct and adds only a restrained shadow fill to aliens',()=>{
 const friendly=new T.MeshStandardMaterial(),enemy=new T.MeshStandardMaterial();
 actorSurface([friendly],true);actorSurface([enemy],false);
 expect(friendly.customProgramCacheKey()).not.toBe(enemy.customProgramCacheKey());
 const compile=(material:T.Material)=>{const shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};material.onBeforeCompile(shader as T.WebGLProgramParametersWithUniforms,{} as T.WebGLRenderer);return shader.fragmentShader;};
 expect(compile(enemy)).toContain('actorLitLuma');expect(compile(friendly)).not.toContain('actorLitLuma');
 friendly.dispose();enemy.dispose();
});
