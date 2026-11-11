import { describe, expect, it, vi } from 'vitest';
import * as T from 'three';
import type { AbilitiesSnapshot, AbilityEvent, DeployableSnapshot } from '../../../game/abilities/contract';
import { GRAPHICS_PRESETS } from '../../graphicsOptions';
import { ElementKit } from '../ElementKit';
import type { AbilityFrame } from '../types';
import { createArcPresentation } from './index';

const event = (extra: Partial<AbilityEvent> = {}): AbilityEvent => ({
  rig: 'arc', element: 'arc', slot: 'tactical', ability: 'overload', phase: 'link',
  targetX: 192, targetY: 96, ...extra,
});
const pylon = (extra: Partial<DeployableSnapshot> = {}): DeployableSnapshot => ({
  id: 1, ability: 'tesla-pylon', element: 'arc', kind: 'pylon', x: 128, y: 160,
  angle: .4, length: 0, thickness: 0, radius: 18, remainingMs: 8600, durationMs: 9000,
  health: 180, maxHealth: 180, ...extra,
});
const snapshot = (extra: Partial<AbilitiesSnapshot> = {}): AbilitiesSnapshot => ({
  rig: 'arc', slots: null, zones: [], deployables: [], dashing: false, invulnerable: false,
  hostileTimeScale: 1, overdrive: { charge: 0, ready: false, active: false, activeRemainingMs: 0 }, ...extra,
});
function setup() {
  const scene = new T.Scene(), kit = new ElementKit(scene), fx = createArcPresentation(kit);
  const frame: AbilityFrame = { snapshot: snapshot(), dt: 0, visible: true };
  const step = (dt: number) => { frame.dt = dt; kit.begin(dt); fx.update(frame); kit.end(); };
  const dispose = () => { fx.dispose(); kit.dispose(); };
  return { scene, kit, fx, frame, step, dispose };
}
function position(mesh: T.InstancedMesh, index: number): T.Vector3 {
  const matrix = new T.Matrix4(); mesh.getMatrixAt(index, matrix);
  return new T.Vector3().setFromMatrixPosition(matrix);
}

describe('Arc presentation signatures and lifecycle', () => {
  it('adds a 40ms native-chain hop rhythm using authoritative endpoints', () => {
    const { kit, fx, step, dispose } = setup();
    const beam = vi.spyOn(kit, 'beam');
    fx.event(event(), 64, 96);
    fx.event(event({ targetX: 256, targetY: 128 }), 192, 96);
    fx.event(event({ targetX: 320, targetY: 160 }), 256, 128);
    const cores = beam.mock.calls.filter(call => call[7] === .043);
    expect(cores).toHaveLength(3);
    expect(cores.map(call => call[10])).toEqual([0, .04, .08]);
    expect(cores[1].slice(0, 6)).toEqual([6, .95, 3, 8, .75, 4]);
    step(.01); const early = kit.ribbons.mesh.count;
    step(.08); expect(kit.ribbons.mesh.count).toBeGreaterThan(early);
    step(1); expect(kit.ribbons.mesh.count).toBe(0);
    dispose();
  });

  it('renders pylon base/stem/coil within its actual base radius, then removes it from snapshots', () => {
    const { kit, frame, step, dispose } = setup();
    frame.snapshot = snapshot({ deployables: [pylon()] }); step(0);
    expect(kit.batches.solid.mesh.count).toBeGreaterThan(6);
    expect(kit.ribbons.mesh.count).toBeGreaterThan(50);
    const base = position(kit.batches.solid.mesh, 0);
    expect(base.x).toBe(4); expect(base.z).toBe(5);
    for (let i = 0; i < kit.batches.solid.mesh.count; i++) {
      const p = position(kit.batches.solid.mesh, i);
      expect(Math.hypot(p.x - 4, p.z - 5)).toBeLessThanOrEqual(18 / 32);
    }
    frame.snapshot = snapshot(); step(0);
    expect(kit.batches.solid.mesh.count).toBe(0); expect(kit.ribbons.mesh.count).toBe(0);
    dispose();
  });

  it('uses exact live marine-link endpoints and dims decorative corona on Low', () => {
    const { kit, frame, step, dispose } = setup();
    const ribbon = vi.spyOn(kit, 'ribbon');
    frame.snapshot = snapshot({ links: [{ id: 1, ability: 'tesla-pylon', element: 'arc', x: 32, y: 64, targetX: 192, targetY: 128, width: 28 }] });
    step(0);
    expect(ribbon.mock.calls[0].slice(0, 6)).toEqual([1, 1.5, 2, 6, .85, 4]);
    expect(ribbon).toHaveBeenCalledTimes(2);
    kit.setOptions(GRAPHICS_PRESETS.low, 'low', false); ribbon.mockClear(); step(0);
    expect(ribbon).toHaveBeenCalledOnce(); expect(ribbon.mock.calls[0][9]).toBe(false);
    dispose();
  });

  it('retains fixed GPU inventory, freezes poses at zero delta and simplifies the mechanical silhouette on Low', () => {
    const { scene, kit, frame, fx, step, dispose } = setup();
    const geometry = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
    scene.traverse(o => { if (o instanceof T.Mesh) { geometry.add(o.geometry); materials.add(o.material as T.Material); } });
    frame.snapshot = snapshot({ deployables: [pylon()] }); step(.1);
    const before = kit.batches.solid.mesh.instanceMatrix.array.slice();
    step(0); expect(kit.batches.solid.mesh.instanceMatrix.array).toEqual(before);
    const high = kit.ribbons.mesh.count;
    kit.setOptions(GRAPHICS_PRESETS.low, 'low', true); step(0);
    expect(kit.ribbons.mesh.count).toBeLessThan(high); expect(kit.batches.solid.mesh.count).toBeGreaterThan(6);
    const afterGeometry = new Set<T.BufferGeometry>(), afterMaterials = new Set<T.Material>();
    scene.traverse(o => { if (o instanceof T.Mesh) { afterGeometry.add(o.geometry); afterMaterials.add(o.material as T.Material); } });
    expect(afterGeometry).toEqual(geometry); expect(afterMaterials).toEqual(materials);
    const disposeShared = vi.spyOn(kit, 'dispose'); fx.dispose(); fx.dispose(); expect(disposeShared).not.toHaveBeenCalled();
    dispose();
  });

  it('bounds repeated arcs and keeps denied/ready presses out of the world', () => {
    const { kit, fx, step, dispose } = setup();
    for (const phase of ['denied', 'ready', 'overdrive-ready'] as const) fx.event(event({ phase }), 64, 96);
    step(0); expect(kit.counts.beams).toBe(0); expect(kit.counts.particles).toBe(0);
    for (let i = 0; i < 300; i++) fx.event(event(), 64, 96);
    step(.1); expect(kit.counts.beams).toBeLessThanOrEqual(64); expect(kit.ribbons.mesh.count).toBeLessThanOrEqual(2048);
    fx.clear(); kit.clear(); step(.3); expect(kit.counts.particles).toBe(0); expect(kit.ribbons.mesh.count).toBe(0);
    dispose();
  });

  it('adds an electrical human silhouette for Static Step and retires it promptly', () => {
    const { kit, fx, step, dispose } = setup();
    fx.event(event({ ability: 'static-step', slot: 'dash', phase: 'dash-start', angle: .5 }), 64, 96);
    step(.01); expect(kit.ribbons.mesh.count).toBeGreaterThan(100);
    step(.3); expect(kit.ribbons.mesh.count).toBe(0); dispose();
  });

  it('creates activation and reverse expiry ripples only once for Overclock', () => {
    const { kit, fx, step, dispose } = setup();
    const ring = vi.spyOn(kit, 'ring'), camera = vi.spyOn(kit, 'camera');
    fx.event(event({ ability: 'overclock', slot: 'overdrive', phase: 'impact' }), 64, 96);
    expect(ring).toHaveBeenCalledTimes(2); expect(camera).toHaveBeenCalledOnce();
    step(.1); step(.1); expect(camera).toHaveBeenCalledOnce();
    fx.event(event({ ability: 'overclock', slot: 'overdrive', phase: 'end' }), 64, 96);
    expect(ring.mock.calls[2][5]).toBe(true); dispose();
  });
});
