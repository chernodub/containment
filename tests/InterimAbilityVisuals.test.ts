import { describe, expect, it, vi } from 'vitest';
import * as T from 'three';
import { InterimAbilityVisuals, INTERIM_ABILITY_LIMITS, interimAbilityCameraFeedback } from '../src/render/abilities/InterimAbilityVisuals';
import { DepthRenderer } from '../src/render/DepthRenderer';
import { ContextResources } from '../src/render/ContextResources';
import { MaterialWarmup } from '../src/render/MaterialWarmup';
import type { AbilitiesSnapshot, AbilityEvent, AbilityZoneSnapshot, DeployableSnapshot } from '../src/game/abilities/contract';

const snapshot = (extra: Partial<AbilitiesSnapshot> = {}): AbilitiesSnapshot => ({
  rig: 'cryo', slots: null, overdrive: { charge: 0, ready: false, active: false, activeRemainingMs: 0 },
  invulnerable: false, dashing: false, hostileTimeScale: 1, zones: [], deployables: [], ...extra,
});
const zone = (extra: Partial<AbilityZoneSnapshot> = {}): AbilityZoneSnapshot => ({
  id: 1, ability: 'whiteout', element: 'cryo', shape: 'circle', x: 64, y: 96, radius: 160,
  x2: 224, y2: 96, width: 32, attached: true, remainingMs: 4000, durationMs: 8000, ...extra,
});
const deployable = (extra: Partial<DeployableSnapshot> = {}): DeployableSnapshot => ({
  id: 1, ability: 'glacier', element: 'cryo', kind: 'ice-wall', x: 64, y: 96,
  angle: 0, length: 192, thickness: 32, radius: 0, remainingMs: 4000, durationMs: 5000, health: 100, maxHealth: 160, ...extra,
});
const event = (extra: Partial<AbilityEvent> = {}): AbilityEvent => ({
  ability: 'seismic-slam', slot: 'tactical', rig: 'breacher', element: 'kinetic', phase: 'cast', radius: 230, durationMs: 220, ...extra,
});
function probe(fx: InterimAbilityVisuals) {
  return fx as unknown as {
    footprints: { mesh: T.InstancedMesh }; telegraphs: { mesh: T.InstancedMesh }; ribbons: { mesh: T.InstancedMesh };
    zones: { body: T.Mesh; start: T.Mesh; end: T.Mesh }[];
    deployables: { wall: T.Mesh; pylon: T.Mesh }[];
  };
}
function transform(mesh: T.InstancedMesh, index = 0) {
  const matrix = new T.Matrix4(); mesh.getMatrixAt(index, matrix);
  const position = new T.Vector3(), scale = new T.Vector3(), rotation = new T.Quaternion();
  matrix.decompose(position, rotation, scale);
  return { position, scale, rotation };
}

describe('interim ability visualization bridge', () => {
  it('draws authoritative circular zones and follows attached snapshot positions while paused', () => {
    const fx = new InterimAbilityVisuals(new T.Scene()), p = probe(fx);
    fx.update(snapshot({ zones: [zone()] }), .01);
    expect(p.zones[0].start.position.toArray()).toEqual([2, .04, 3]);
    expect(p.zones[0].start.scale.toArray()).toEqual([5, 5, 1]);
    fx.update(snapshot({ zones: [zone({ x: 128, y: 32, radius: 210 })] }), 0);
    expect(p.zones[0].start.position.toArray()).toEqual([4, .04, 1]);
    expect(transform(p.footprints.mesh).scale.x).toBeCloseTo(210 / 32);
    fx.update(snapshot(), 0);
    expect(p.zones[0].start.visible).toBe(false); expect(p.footprints.mesh.count).toBe(0);
    fx.dispose();
  });

  it('matches strip capsules, including endpoint discs and the zero-length case', () => {
    const fx = new InterimAbilityVisuals(new T.Scene()), p = probe(fx);
    fx.update(snapshot({ zones: [zone({ shape: 'strip', attached: false, radius: 0 })] }), 0);
    const slot = p.zones[0];
    expect(slot.body.scale.toArray()).toEqual([2.5, .5, 1]);
    expect(slot.body.position.toArray()).toEqual([4.5, .04, 3]);
    expect(slot.start.position.x).toBe(2); expect(slot.end.position.x).toBe(7);
    expect(slot.start.scale.x).toBe(.5); expect(p.footprints.mesh.count).toBe(3);
    // Rectangle UVs stay within the exported material's disc, preserving flat sides.
    const uv = slot.body.geometry.getAttribute('uv');
    for (let i = 0; i < uv.count; i++) expect(Math.hypot(uv.getX(i) * 2 - 1, uv.getY(i) * 2 - 1)).toBeLessThan(1);
    fx.update(snapshot({ zones: [zone({ shape: 'strip', x2: 64, y2: 96 })] }), 0);
    expect(slot.body.visible).toBe(false); expect(slot.start.visible).toBe(true);
    fx.dispose();
  });

  it('keeps wall thickness, perpendicular length and pylon radius faithful to snapshots', () => {
    const fx = new InterimAbilityVisuals(new T.Scene()), p = probe(fx);
    fx.update(snapshot({ deployables: [deployable({ angle: Math.PI / 2 }), deployable({ kind: 'pylon', ability: 'tesla-pylon', element: 'arc', radius: 18 })] }), 0);
    expect(p.deployables[0].wall.scale.toArray()).toEqual([1, 1.4, 6]);
    expect(p.deployables[0].wall.rotation.y).toBeCloseTo(-Math.PI / 2);
    const warning = transform(p.footprints.mesh);
    expect(warning.position.x).toBeCloseTo(2); expect(warning.position.z).toBeCloseTo(3);
    expect(warning.scale.x * 2).toBeCloseTo(6); expect(warning.scale.y * 2).toBeCloseTo(1);
    expect(p.deployables[1].pylon.scale.x).toBe(18 / 32);
    expect(transform(p.footprints.mesh, 1).scale.x).toBeCloseTo(18 / 32);
    fx.update(snapshot({ deployables: [deployable({ health: 0 })] }), 0);
    expect(p.deployables.every(s => !s.wall.visible && !s.pylon.visible)).toBe(true);
    fx.dispose();
  });

  it('keeps augmented cast radii, cone angles, line width and placed centers exact', () => {
    const fx = new InterimAbilityVisuals(new T.Scene()), p = probe(fx);
    fx.event(event({ ability: 'cryo-nova', radius: 310, durationMs: 200 }), 64, 96);
    fx.event(event({ ability: 'flashfire', radius: undefined, length: 300, arcRadians: 1.22, angle: 1 }), 64, 96);
    fx.event(event({ ability: 'railbreaker', radius: undefined, length: 900, width: 44, angle: 0 }), 64, 96);
    fx.event(event({ ability: 'napalm-charge', radius: 156, targetX: 320, targetY: 192 }), 64, 96);
    fx.update(snapshot(), .05);
    expect(p.telegraphs.mesh.count).toBe(4);
    expect(transform(p.telegraphs.mesh).scale.x).toBeCloseTo(310 / 32);
    expect(p.telegraphs.mesh.geometry.getAttribute('telegraph').getZ(1)).toBeCloseTo(1.22);
    expect(transform(p.telegraphs.mesh, 1).scale.x).toBeCloseTo(300 / 32);
    expect(transform(p.telegraphs.mesh, 2).scale.y * 2).toBeCloseTo(44 / 32);
    expect(transform(p.telegraphs.mesh, 3).position.x).toBeCloseTo(10);
    expect(transform(p.telegraphs.mesh, 3).position.z).toBeCloseTo(6);
    const before = p.telegraphs.mesh.instanceMatrix.array.slice();
    fx.update(snapshot(), 0); expect(p.telegraphs.mesh.instanceMatrix.array).toEqual(before);
    fx.update(snapshot(), 1); expect(p.telegraphs.mesh.count).toBe(0);
    fx.dispose();
  });

  it('orients placed wall casts and shows glacier bursts as circles at the wall', () => {
    const fx = new InterimAbilityVisuals(new T.Scene()), p = probe(fx);
    fx.event(event({ ability: 'glacier', radius: undefined, length: 200, width: 26, angle: 0, targetX: 320, targetY: 192 }), 0, 0);
    fx.event(event({ ability: 'glacier', phase: 'burst', radius: 150, length: 200, width: 26 }), 320, 192);
    fx.update(snapshot(), .01);
    expect(transform(p.telegraphs.mesh).position.x).toBeCloseTo(10);
    expect(transform(p.telegraphs.mesh).position.z).toBeCloseTo(6);
    expect(p.telegraphs.mesh.geometry.getAttribute('telegraph').getX(1)).toBe(0);
    expect(transform(p.telegraphs.mesh, 1).scale.x).toBeCloseTo(150 / 32);
    fx.dispose();
  });

  it('draws live pylon links from snapshot endpoints, plus bounded short event beams', () => {
    const fx = new InterimAbilityVisuals(new T.Scene()), p = probe(fx);
    const state = snapshot({ links: [{ id: 1, ability: 'tesla-pylon', element: 'arc', x: 32, y: 64, targetX: 192, targetY: 64, width: 28 }] });
    fx.update(state, 0);
    expect(p.ribbons.mesh.count).toBe(2); expect(p.footprints.mesh.count).toBe(3);
    expect(transform(p.ribbons.mesh).position.x).toBeCloseTo(3.5);
    expect(transform(p.footprints.mesh).scale.y * 2).toBeCloseTo(28 / 32);
    fx.event(event({ ability: 'overload', phase: 'link', targetX: 64, targetY: 64 }), 0, 0);
    fx.update(state, .01); expect(p.ribbons.mesh.count).toBe(4);
    fx.update(state, .3); expect(p.ribbons.mesh.count).toBe(2);
    fx.update(snapshot(), 0); expect(p.ribbons.mesh.count).toBe(0);
    fx.dispose();
  });

  it('ignores non-spatial/invalid receipts and uses only ability impacts for camera feedback', () => {
    const fx = new InterimAbilityVisuals(new T.Scene()), p = probe(fx);
    for (const phase of ['tick', 'denied', 'ready', 'overdrive-ready', 'dash-start', 'dash-end', 'end'] as const) fx.event(event({ phase }), 0, 0);
    fx.event(event({ radius: undefined, length: 520, ability: 'overload' }), 0, 0);
    fx.event(event(), NaN, 0); fx.event(event({ radius: NaN }), 0, 0);
    fx.update(snapshot(), 0); expect(p.telegraphs.mesh.count).toBe(0);
    const camera = { addTrauma: vi.fn(), punch: vi.fn() };
    interimAbilityCameraFeedback(event(), camera); expect(camera.addTrauma).not.toHaveBeenCalled();
    interimAbilityCameraFeedback(event({ phase: 'impact' }), camera); expect(camera.addTrauma).toHaveBeenCalledOnce(); expect(camera.punch).not.toHaveBeenCalled();
    interimAbilityCameraFeedback(event({ phase: 'impact', slot: 'overdrive' }), camera); expect(camera.punch).toHaveBeenCalledOnce();
    fx.dispose();
  });

  it('routes ability events safely before the generic attack effects consumer', () => {
    const generic = vi.fn(), ability = vi.fn(), camera = { addTrauma: vi.fn(), punch: vi.fn() };
    const renderer = Object.assign(Object.create(DepthRenderer.prototype), {
      interimAbilities: { event: ability }, effects: { event: generic }, cameraRig: camera,
    }) as DepthRenderer;
    renderer.effect({ type: 'ability', ability: event({ phase: 'impact' }), x: 32, y: 64 });
    renderer.effect({ type: 'ability', x: 0, y: 0 });
    expect(ability).toHaveBeenCalledOnce(); expect(generic).not.toHaveBeenCalled();
    expect(camera.addTrauma).toHaveBeenCalledOnce();
  });

  it('preserves the existing single shot, hurt and explosion camera feedback paths', () => {
    const camera = { addTrauma: vi.fn(), punch: vi.fn(), kick: vi.fn() };
    const abilities = { event: vi.fn() }, effects = { event: vi.fn() }, lighting = { explosion: vi.fn() };
    const renderer = Object.assign(Object.create(DepthRenderer.prototype), {
      interimAbilities: abilities, effects, cameraRig: camera, lighting, pendingShots: [], player: { hit: vi.fn() },
    }) as DepthRenderer;
    renderer.effect({ type: 'shot', x: 0, y: 0, angle: 1, weapon: 'rifle' });
    expect(camera.kick).toHaveBeenCalledOnce(); expect(camera.addTrauma).not.toHaveBeenCalled();
    renderer.effect({ type: 'hurt', x: 0, y: 0 });
    expect(camera.addTrauma).toHaveBeenCalledOnce(); expect(camera.punch).toHaveBeenCalledOnce();
    renderer.effect({ type: 'explosion', x: 0, y: 0, radius: 96 });
    expect(camera.addTrauma).toHaveBeenCalledTimes(2); expect(camera.punch).toHaveBeenCalledTimes(2);
    expect(lighting.explosion).toHaveBeenCalledOnce(); expect(effects.event).toHaveBeenCalledOnce();
    expect(abilities.event).not.toHaveBeenCalled();
  });

  it('retains fixed pools on saturation, motion changes, menu hiding and room reset', () => {
    const fx = new InterimAbilityVisuals(new T.Scene()), p = probe(fx);
    const meshes: T.Mesh[] = []; fx.root.traverse(o => { if (o instanceof T.Mesh) meshes.push(o); });
    const geometry = meshes.map(m => m.geometry), materials = meshes.map(m => m.material);
    fx.setReducedMotion(true);
    for (let i = 0; i < 100; i++) fx.event(event(), i, 0);
    fx.update(snapshot({ zones: Array.from({ length: 40 }, () => zone()), deployables: Array.from({ length: 20 }, () => deployable()) }), .01, false);
    expect(fx.root.visible).toBe(false); expect(p.telegraphs.mesh.count).toBe(INTERIM_ABILITY_LIMITS.events);
    expect(p.footprints.mesh.count).toBeLessThanOrEqual(112);
    const material = p.zones[0].start.material as T.ShaderMaterial;
    expect(material.uniforms.motion.value).toBe(0);
    fx.setReducedMotion(false); expect(material.uniforms.motion.value).toBe(1);
    fx.clear(); expect(p.telegraphs.mesh.count).toBe(0); expect(p.ribbons.mesh.count).toBe(0);
    expect(p.zones.every(s => !s.start.visible && !s.body.visible && !s.end.visible)).toBe(true);
    expect(meshes.map(m => m.geometry)).toEqual(geometry);
    // Materials are shared by kind, and no mesh/material is created during updates.
    expect(new Set(meshes.map(m => m.material)).size).toBeLessThanOrEqual(new Set(materials).size + 1);
    fx.update(snapshot(), 0, true); expect(fx.root.visible).toBe(true);
    fx.dispose();
  });

  it('registers all hidden shader variants before prepare, survives context retirement, and disposes once', () => {
    const scene = new T.Scene(), fx = new InterimAbilityVisuals(scene);
    const surface = new T.MeshStandardMaterial();
    const warmup = new MaterialWarmup({ floor: surface, wall: surface, cover: surface });
    expect(warmup.register(fx.root)).toBeGreaterThanOrEqual(3);
    fx.update(snapshot({ zones: [zone({ element: 'pyro' }), zone({ element: 'arc' })], deployables: [deployable({ kind: 'barrier' }), deployable({ kind: 'pylon' })] }), 0);
    expect(warmup.register(fx.root)).toBe(0);
    const inventory = fx.root.getObjectByName('interim-ability-material-library')!;
    expect(inventory.visible).toBe(false); expect(inventory.children).toHaveLength(6);
    const hiddenMaterials = inventory.children.map(mesh => (mesh as T.Mesh).material as T.Material);
    const retired = hiddenMaterials.map(material => vi.spyOn(material, 'dispose'));
    const resources = new ContextResources(); resources.track(fx.root); resources.invalidate(); resources.track(fx.root);
    for (const dispose of retired) { expect(dispose).toHaveBeenCalledOnce(); dispose.mockClear(); }
    fx.update(snapshot({ zones: [zone()], deployables: [deployable()] }), 0);
    expect(probe(fx).zones[0].start.visible).toBe(true);
    const geometry = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
    fx.root.traverse(o => { if (o instanceof T.Mesh) { geometry.add(o.geometry); for (const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m); } });
    const disposals = [...geometry, ...materials].map(resource => vi.spyOn(resource, 'dispose'));
    fx.dispose(); fx.dispose();
    for (const dispose of disposals) expect(dispose).toHaveBeenCalledOnce();
    expect(scene.children).toHaveLength(0); warmup.dispose(); surface.dispose();
  });
});
