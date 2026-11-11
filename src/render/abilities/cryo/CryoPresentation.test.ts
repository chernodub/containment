import { describe, expect, it, vi } from 'vitest';
import * as T from 'three';
import type { AbilitiesSnapshot, AbilityEvent, AbilityZoneSnapshot, DeployableSnapshot } from '../../../game/abilities/contract';
import { ElementKit } from '../ElementKit';
import type { AbilityFrame } from '../types';
import { createCryoPresentation } from './index';

function recordingKit() {
  return {
    time: 1, low: false, reducedMotion: false, flashIntensity: 1,
    draw: vi.fn(), mote: vi.fn(), burst: vi.fn(), ring: vi.fn(), outline: vi.fn(), beam: vi.fn(),
    ribbon: vi.fn(), decal: vi.fn(), flash: vi.fn(), distort: vi.fn(), camera: vi.fn(), lightAt: vi.fn(),
    front: vi.fn(), scar: vi.fn(), debris: vi.fn(), iceColumn: vi.fn(),
  };
}
const snapshot = (extra: Partial<AbilitiesSnapshot> = {}): AbilitiesSnapshot => ({
  rig: 'cryo', slots: null, overdrive: { charge: 0, ready: false, active: false, activeRemainingMs: 0 },
  invulnerable: false, dashing: false, hostileTimeScale: 1, zones: [], deployables: [], ...extra,
});
const frame = (extra: Partial<AbilitiesSnapshot>, dt = .016): AbilityFrame => ({ snapshot: snapshot(extra), dt, visible: true });
const wall = (extra: Partial<DeployableSnapshot> = {}): DeployableSnapshot => ({
  id: 1, ability: 'glacier', element: 'cryo', kind: 'ice-wall', x: 320, y: 320, angle: 0,
  length: 200, thickness: 26, radius: 0, remainingMs: 4000, durationMs: 5000, health: 160, maxHealth: 160, ...extra,
});
const zone = (extra: Partial<AbilityZoneSnapshot> = {}): AbilityZoneSnapshot => ({
  id: 2, ability: 'whiteout', element: 'cryo', shape: 'circle', x: 320, y: 320, radius: 300,
  x2: 320, y2: 320, width: 0, attached: true, remainingMs: 7000, durationMs: 8000, ...extra,
});
const receipt = (extra: Partial<AbilityEvent> = {}): AbilityEvent => ({
  ability: 'cryo-nova', slot: 'tactical', rig: 'cryo', element: 'cryo', phase: 'impact', ...extra,
});

describe('Cryo signatures', () => {
  it('uses the receipt radius for augmented Nova and leaves an icy aftermath', () => {
    const kit = recordingKit(), fx = createCryoPresentation(kit as unknown as ElementKit);
    fx.event(receipt({ radius: 310 }), 64, 96);
    expect(kit.ring).toHaveBeenCalledWith(2, 3, 310 / 32, 0xe8fbff, .5);
    expect(kit.scar).toHaveBeenCalledWith('frost', 2, 3, 310 / 32, 0x7fd6ff, 6.5);
    fx.update(frame({}, .15));
    const shards = kit.draw.mock.calls.filter(c => c[0] === 'shard');
    expect(shards.length).toBe(60);
    for (const draw of shards) expect(Math.hypot(draw[1] - 2, draw[3] - 3)).toBeLessThanOrEqual(310 / 32);
    expect(kit.front.mock.calls[0][2]).toBe(310 / 32);
    expect(kit.front.mock.calls[0][3]).toBeGreaterThan(.95);
    expect(kit.front.mock.calls[0][5]).toBeGreaterThanOrEqual(.5);
    expect(kit.front.mock.calls[0][5]).toBeLessThanOrEqual(.75);
    expect(kit.front).toHaveBeenCalledOnce();
  });

  it('builds irregular overlapping Glacier facets with no backing slab inside the blocking strip', () => {
    const kit = recordingKit(), fx = createCryoPresentation(kit as unknown as ElementKit);
    for (const angle of [0, Math.PI / 2, .67]) {
      kit.draw.mockClear();
      fx.update(frame({ deployables: [wall({ angle })] }, 0));
      const facets = kit.draw.mock.calls;
      expect(facets).toHaveLength(36);
      expect(facets.every(c => c[0] === 'shard')).toBe(true);
      const heights = new Set(facets.map(c => Number(c[5].toFixed(3))));
      const yaws = new Set(facets.map(c => Number(c[9].toFixed(3))));
      expect(heights.size).toBeGreaterThan(12); expect(yaws.size).toBeGreaterThan(6);
      for (const c of facets) {
        const dx = c[1] - 10, dz = c[3] - 10;
        const lateral = dx * Math.cos(angle) + dz * Math.sin(angle);
        const along = -dx * Math.sin(angle) + dz * Math.cos(angle);
        const yaw = c[9] + angle;
        expect(Math.abs(lateral) + Math.abs(Math.cos(yaw) * c[4]) + Math.abs(Math.sin(yaw) * c[6])).toBeLessThanOrEqual(26 / 32 / 2 + .00001);
        expect(Math.abs(along) + Math.abs(Math.sin(yaw) * c[4]) + Math.abs(Math.cos(yaw) * c[6])).toBeLessThanOrEqual(200 / 32 / 2 + .00001);
      }
    }
    expect(kit.iceColumn).not.toHaveBeenCalled();
  });

  it('grows Glacier from snapshot age and pauses without advancing its facets', () => {
    const kit = recordingKit(), fx = createCryoPresentation(kit as unknown as ElementKit);
    fx.update(frame({ deployables: [wall({ remainingMs: 5000 })] }, 0));
    const emerging = kit.draw.mock.calls.map(c => c[5]);
    kit.draw.mockClear();
    fx.update(frame({ deployables: [wall({ remainingMs: 4850 })] }, 0));
    const raised = kit.draw.mock.calls.map(c => c[5]);
    expect(raised[0]).toBeGreaterThan(emerging[0] * 20);
    kit.draw.mockClear();
    fx.update(frame({ deployables: [wall({ remainingMs: 4850 })] }, 0));
    expect(kit.draw.mock.calls.map(c => c[5])).toEqual(raised);
  });

  it('reacts once to real wall health loss and does not emit while paused', () => {
    const kit = recordingKit(), fx = createCryoPresentation(kit as unknown as ElementKit);
    fx.update(frame({ deployables: [wall()] }));
    fx.update(frame({ deployables: [wall({ health: 140 })] }));
    expect(kit.burst).toHaveBeenCalledTimes(1);
    fx.update(frame({ deployables: [wall({ health: 120 })] }, 0));
    expect(kit.burst).toHaveBeenCalledTimes(1);
  });

  it('places frost edge crystals inside the authoritative strip width including zero-length strips', () => {
    const kit = recordingKit(), fx = createCryoPresentation(kit as unknown as ElementKit);
    const strip = zone({ ability: 'frost-trail', shape: 'strip', attached: false, radius: 0, x: 64, y: 96, x2: 224, y2: 96, width: 44, remainingMs: 2000, durationMs: 2500 });
    fx.update(frame({ zones: [strip] }, 0));
    const sheet = kit.draw.mock.calls.find(c => c[0] === 'solid')!;
    expect(sheet.slice(1, 7)).toEqual([4.5, .055, 3, 5, .095, 44 / 32 / 2 * 1.88]);
    for (const draw of kit.draw.mock.calls.filter(c => c[0] === 'shard')) {
      expect(draw[1]).toBeGreaterThanOrEqual(2); expect(draw[1]).toBeLessThanOrEqual(7);
      expect(Math.abs(draw[3] - 3) + draw[6]).toBeLessThan(44 / 32 / 2);
    }
    kit.draw.mockClear();
    fx.update(frame({ zones: [{ ...strip, x2: strip.x }] }, 0));
    for (const draw of kit.draw.mock.calls) for (const value of draw) if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
  });

  it('makes Whiteout freeze waves once per authoritative two-second boundary', () => {
    const kit = recordingKit(), fx = createCryoPresentation(kit as unknown as ElementKit);
    fx.update(frame({ zones: [zone()] }));
    expect(kit.ring).not.toHaveBeenCalled();
    fx.update(frame({ zones: [zone({ remainingMs: 5990 })] }));
    expect(kit.ring).toHaveBeenCalledTimes(1);
    fx.update(frame({ zones: [zone({ remainingMs: 5990 })] }, 0));
    fx.update(frame({ zones: [zone({ remainingMs: 5750 })] }));
    expect(kit.ring).toHaveBeenCalledTimes(1);
    fx.update(frame({ zones: [zone({ remainingMs: 3990 })] }));
    expect(kit.ring).toHaveBeenCalledTimes(2);
  });

  it('shatters Glacier into dozens of pooled tumbling shards and persistent full-radius frost', () => {
    const kit = recordingKit(), fx = createCryoPresentation(kit as unknown as ElementKit);
    fx.event(receipt({ ability: 'glacier', phase: 'burst', radius: 180 }), 64, 96);
    expect(kit.debris).toHaveBeenCalledWith(2, 3, 180 / 32, 'cryo', 48);
    expect(kit.scar).toHaveBeenCalledWith('frost', 2, 3, 180 / 32, 0x7fd6ff, 7);
    fx.update(frame({}, .15));
    expect(kit.front).not.toHaveBeenCalled();
    expect(kit.ring).toHaveBeenCalledWith(2, 3, 180 / 32, 0xe8fbff, .5);
  });

  it('keeps Whiteout sparse, with a clear marine region and narrow low-opacity perimeter wall', () => {
    const kit = recordingKit(), fx = createCryoPresentation(kit as unknown as ElementKit);
    const f = frame({ zones: [zone()] }, 0);
    f.game = { geometry: { blockers: [{ x: 480, y: 300, width: 40, height: 40 }, { x: 900, y: 900, width: 40, height: 40 }] } } as never;
    fx.update(f);
    const shards = kit.draw.mock.calls.filter(c => c[0] === 'shard');
    expect(shards.length).toBe(48 + 4);
    for (const draw of shards) {
      const distance = Math.hypot(draw[1] - 10, draw[3] - 10);
      expect(distance).toBeGreaterThan(2.25); expect(distance).toBeLessThan(300 / 32);
      expect(draw[8]).toBeLessThanOrEqual(.37);
    }
    expect(kit.ribbon.mock.calls.length).toBe(8 + 24 + 4);
    for (const c of kit.ribbon.mock.calls) expect(c[7]).toBeLessThanOrEqual(.024);
    const wisps = kit.draw.mock.calls.filter(c => c[0] === 'smoke');
    expect(wisps).toHaveLength(12);
    for (const wisp of wisps) {
      const distance = Math.hypot(wisp[1] - 10, wisp[3] - 10);
      expect(distance).toBeGreaterThan(300 / 32 * .9);
      expect(distance + wisp[4]).toBeLessThan(300 / 32);
      expect(wisp[8]).toBeLessThanOrEqual(.14);
    }
    expect(kit.front).not.toHaveBeenCalled();
    expect(kit.lightAt).toHaveBeenCalledWith(2, 10, 10, 0x7fd6ff, .85, 4.5);
  });

  it('reserves thick shock fronts for Nova and never emits them for any Whiteout phase or pulse', () => {
    const kit = recordingKit(), fx = createCryoPresentation(kit as unknown as ElementKit);
    for (const phase of ['impact', 'burst', 'end'] as const) fx.event(receipt({ ability: 'whiteout', phase, radius: 300 }), 320, 320);
    fx.update(frame({ zones: [zone({ remainingMs: 5990 })] }, .1));
    fx.update(frame({}, .1));
    expect(kit.front).not.toHaveBeenCalled();
    expect(kit.ring).toHaveBeenCalledTimes(4);
    fx.event(receipt({ radius: 210 }), 320, 320); fx.update(frame({}, .1));
    expect(kit.front).toHaveBeenCalled();
  });

  it('keeps low-tier wall and storm silhouettes with fewer pooled instances and segments', () => {
    const high = recordingKit(), low = recordingKit(); low.low = true;
    createCryoPresentation(high as unknown as ElementKit).update(frame({ zones: [zone()], deployables: [wall({ health: 80 })] }));
    createCryoPresentation(low as unknown as ElementKit).update(frame({ zones: [zone()], deployables: [wall({ health: 80 })] }));
    expect(low.draw.mock.calls.length).toBeGreaterThan(20);
    expect(low.draw.mock.calls.length).toBeLessThan(high.draw.mock.calls.length / 2);
    expect(low.ribbon.mock.calls.length).toBe(12);
    expect(low.front).not.toHaveBeenCalled();
  });

  it('renders no denied/ready world feedback and clears all transient state', () => {
    const kit = recordingKit(), fx = createCryoPresentation(kit as unknown as ElementKit);
    fx.event(receipt({ phase: 'denied' }), 32, 32); fx.event(receipt({ phase: 'ready' }), 32, 32);
    expect(kit.burst).not.toHaveBeenCalled(); expect(kit.ring).not.toHaveBeenCalled();
    fx.event(receipt(), 32, 32); fx.clear(); fx.update(frame({}, .05));
    expect(kit.draw).not.toHaveBeenCalled();
    fx.dispose(); fx.dispose(); fx.event(receipt(), 32, 32);
    expect(kit.burst).toHaveBeenCalledTimes(1);
  });

  it('reuses the shared GPU inventory across all signatures and retires no shared resources', () => {
    const scene = new T.Scene(), kit = new ElementKit(scene), fx = createCryoPresentation(kit);
    let before = 0; scene.traverse(() => before++);
    const geometry = kit.batches.shard.mesh.geometry, dispose = vi.spyOn(geometry, 'dispose');
    fx.event(receipt(), 320, 320); fx.event(receipt({ ability: 'glacier', phase: 'burst', radius: 150 }), 320, 320);
    for (let i = 0; i < 90; i++) {
      kit.begin(1 / 60); fx.update(frame({ zones: [zone()], deployables: [wall()] }, 1 / 60)); kit.end();
    }
    let after = 0; scene.traverse(() => after++); expect(after).toBe(before);
    expect(kit.peakInstances).toBeLessThan(600);
    fx.dispose(); expect(dispose).not.toHaveBeenCalled();
    kit.dispose(); expect(dispose).toHaveBeenCalledTimes(1);
  });
});
