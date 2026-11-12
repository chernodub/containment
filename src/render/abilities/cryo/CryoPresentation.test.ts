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
    sustain: vi.fn(), impact: vi.fn(), gust: vi.fn(), frostFilm: vi.fn(), front: vi.fn(), scar: vi.fn(), debris: vi.fn(), iceColumn: vi.fn(),
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
    expect(shards.length).toBeGreaterThan(30);
    expect(shards.length).toBeLessThan(65);
    expect(new Set(shards.map(c => c[4].toFixed(3))).size).toBeGreaterThan(10);
    for (const draw of shards) expect(Math.hypot(draw[1] - 2, draw[3] - 3)).toBeLessThanOrEqual(310 / 32);
    expect(kit.front.mock.calls[0][2]).toBe(310 / 32);
    expect(kit.front.mock.calls[0][3]).toBeGreaterThan(.95);
    expect(kit.front.mock.calls[0][5]).toBeGreaterThanOrEqual(.27);
    expect(kit.front.mock.calls[0][5]).toBeLessThan(.5); // At150ms the impact curtain is already thinning.
    expect(kit.front.mock.calls[0][7]).toBe(2); // Matte rolling cold vapor uses the existing front batch.
    expect(kit.front).toHaveBeenCalledOnce();
  });

  it('retains the Nova impact wall then thins the same wavy edge before sustained combat', () => {
    const kit = recordingKit(), fx = createCryoPresentation(kit as unknown as ElementKit);
    fx.event(receipt({ radius: 230 }), 64, 96);
    fx.update(frame({}, .09));
    const impact = kit.front.mock.calls.at(-1)!;
    expect(impact[5]).toBe(.7); expect(impact[6]).toBeGreaterThan(.4);
    kit.front.mockClear(); fx.update(frame({}, .077));
    const settled = kit.front.mock.calls.at(-1)!;
    expect(settled[2]).toBe(impact[2]); expect(settled[3]).toBeGreaterThan(impact[3]);
    expect(settled[5]).toBeGreaterThanOrEqual(.27); expect(settled[5]).toBeLessThan(.35);
    expect(settled[6]).toBeLessThan(impact[6] * .5); expect(settled[7]).toBe(2);
    // The authored flash, camera response and impact particles keep their original receipt.
    expect(kit.flash).toHaveBeenCalledWith(2, 3, 0xe8fbff, 15, expect.any(Number), 4, .14);
    expect(kit.burst).toHaveBeenCalledWith(2, .18, 3, 'cryo', 32, 5.2, .95);
  });

  it('lowers settled ground fill while retaining Frost Trail crystals and Whiteout snow/currents', () => {
    const kit = recordingKit(), fx = createCryoPresentation(kit as unknown as ElementKit);
    const trail = zone({ ability: 'frost-trail', shape: 'strip', width: 44, x2: 480,
      attached: false, durationMs: 2500, remainingMs: 2350 });
    fx.update(frame({ zones: [trail] }, 0));
    const freshFilm = kit.frostFilm.mock.calls.at(-1)!, freshMist = kit.draw.mock.calls.filter(c => c[0] === 'smoke');
    kit.frostFilm.mockClear(); kit.draw.mockClear();
    fx.update(frame({ zones: [{ ...trail, remainingMs: 2000 }] }, 0));
    const settledFilm = kit.frostFilm.mock.calls.at(-1)!;
    expect(settledFilm.slice(0, 5)).toEqual(freshFilm.slice(0, 5));
    expect(settledFilm[5]).toBeLessThan(freshFilm[5] * .33);
    const settledMist = kit.draw.mock.calls.filter(c => c[0] === 'smoke');
    expect(settledMist).toHaveLength(freshMist.length);
    for (let i = 0; i < settledMist.length; i++) expect(settledMist[i][8]).toBeCloseTo(freshMist[i][8] * .32);
    expect(kit.draw.mock.calls.filter(c => c[0] === 'shard').some(c => c[8] > .7)).toBe(true);
    kit.draw.mockClear(); kit.gust.mockClear();
    fx.update(frame({ zones: [zone({ remainingMs: 7850 })] }, 0));
    const freshGusts = kit.gust.mock.calls.map(c => [...c]);
    const freshSnow = kit.draw.mock.calls.filter(c => c[0] === 'shard').map(c => c[8]);
    kit.draw.mockClear(); kit.gust.mockClear();
    fx.update(frame({ zones: [zone({ remainingMs: 7000 })] }, 0));
    expect(kit.gust.mock.calls).toHaveLength(freshGusts.length);
    for (let i = 0; i < freshGusts.length; i++) {
      expect(kit.gust.mock.calls[i].slice(2, 4)).toEqual(freshGusts[i].slice(2, 4));
      expect(kit.gust.mock.calls[i][6]).toBeLessThan(freshGusts[i][6] * .36);
    }
    expect(kit.draw.mock.calls.filter(c => c[0] === 'shard').map(c => c[8])).toEqual(freshSnow);
    expect(kit.front.mock.calls.every(c => c[7] === 3 && c[3] === 1)).toBe(true);
  });

  it('builds irregular overlapping Glacier facets with no backing slab inside the blocking strip', () => {
    const kit = recordingKit(), fx = createCryoPresentation(kit as unknown as ElementKit);
    for (const angle of [0, Math.PI / 2, .67]) {
      kit.draw.mockClear();
      fx.update(frame({ deployables: [wall({ angle })] }, 0));
      const facets = kit.draw.mock.calls;
      expect(facets.length).toBe(8);
      expect(facets.every(c => c[0] === 'shard')).toBe(true);
      const heights = new Set(facets.map(c => Number(c[5].toFixed(3))));
      const yaws = new Set(facets.map(c => Number(c[9].toFixed(3))));
      expect(heights.size).toBeGreaterThan(5); expect(yaws.size).toBeGreaterThan(3);
      expect(new Set(facets.map(c => c[6].toFixed(3))).size).toBeGreaterThan(3);
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

  it('uses irregular edge growth and low mist inside the exact Frost Trail capsule at every orientation', () => {
    const kit = recordingKit(), fx = createCryoPresentation(kit as unknown as ElementKit);
    for (const angle of [0, .67, Math.PI / 2]) for (const length of [0, 160]) {
      kit.draw.mockClear(); kit.ribbon.mockClear(); kit.frostFilm.mockClear();
      const strip = zone({ ability: 'frost-trail', shape: 'strip', attached: false, radius: 0,
        x: 64, y: 96, x2: 64 + Math.cos(angle) * length, y2: 96 + Math.sin(angle) * length,
        width: 44, remainingMs: 2000, durationMs: 2500 });
      fx.update(frame({ zones: [strip] }, 0));
      expect(kit.frostFilm).toHaveBeenCalledOnce();
      const film = kit.frostFilm.mock.calls[0];
      expect(film[0]).toBeCloseTo((strip.x + strip.x2) / 64);
      expect(film[1]).toBeCloseTo((strip.y + strip.y2) / 64);
      expect(film[2]).toBeCloseTo(length / 32);
      expect(film[3]).toBe(44 / 32 / 2);
      if (length > 0) expect(film[4]).toBeCloseTo(angle);
      expect(film[5]).toBeLessThanOrEqual(.62);
      expect(kit.draw.mock.calls.some(c => c[0] === 'solid')).toBe(false);
      const shards = kit.draw.mock.calls.filter(c => c[0] === 'shard');
      expect(shards.length).toBeGreaterThan(8);
      expect(new Set(shards.map(c => c[5].toFixed(3))).size).toBeGreaterThan(6);
      const capsuleDistance = (px: number, pz: number) => {
        const dx = px - 2, dz = pz - 3, along = dx * Math.cos(angle) + dz * Math.sin(angle);
        return Math.hypot(along - Math.max(0, Math.min(length / 32, along)), -dx * Math.sin(angle) + dz * Math.cos(angle));
      };
      for (const c of kit.draw.mock.calls) {
        const support = c[0] === 'smoke' ? c[4] : Math.max(c[4], c[6]) + c[5] * Math.abs(Math.sin(c[10]));
        expect(capsuleDistance(c[1], c[3]) + support).toBeLessThanOrEqual(44 / 32 / 2);
        expect(c[2]).toBeLessThan(c[0] === 'smoke' ? .2 : .6);
        for (const v of c) if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true);
      }
      for (const c of kit.ribbon.mock.calls) {
        expect(capsuleDistance(c[0], c[2]) + c[7]).toBeLessThan(44 / 32 / 2);
        expect(capsuleDistance(c[3], c[5]) + c[7]).toBeLessThan(44 / 32 / 2);
      }
      expect(kit.draw.mock.calls.filter(c => c[0] === 'smoke').length).toBeGreaterThan(0);
      expect(shards.filter(c => c[5] > .4).length).toBeGreaterThan(1);
      expect(shards.filter(c => c[5] > .4).length).toBeLessThan(shards.length / 2);
      expect(kit.draw.mock.calls.filter(c => c[0] === 'smoke').every(c => c[8] <= .34)).toBe(true);
    }
  });

  it('retains the larger Frost Trail clusters and mist on Low with fewer instances', () => {
    const high = recordingKit(), low = recordingKit(); low.low = true;
    const strip = zone({ ability: 'frost-trail', shape: 'strip', width: 44, x2: 480, attached: false,
      remainingMs: 2000, durationMs: 2500 });
    createCryoPresentation(high as unknown as ElementKit).update(frame({ zones: [strip] }, 0));
    createCryoPresentation(low as unknown as ElementKit).update(frame({ zones: [strip] }, 0));
    expect(low.frostFilm).toHaveBeenCalledOnce();
    expect(low.frostFilm.mock.calls).toEqual(high.frostFilm.mock.calls);
    expect(low.draw.mock.calls.length).toBeLessThan(high.draw.mock.calls.length * .6);
    expect(low.draw.mock.calls.some(c => c[0] === 'smoke')).toBe(true);
    expect(low.draw.mock.calls.some(c => c[0] === 'shard' && c[5] > .4)).toBe(true);
    expect(low.draw.mock.calls.some(c => c[0] === 'solid')).toBe(false);
    expect(low.ribbon.mock.calls.length).toBeLessThan(high.ribbon.mock.calls.length);
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

  it('shatters Glacier into fewer large pooled fracture masses and persistent full-radius frost', () => {
    const kit = recordingKit(), fx = createCryoPresentation(kit as unknown as ElementKit);
    fx.event(receipt({ ability: 'glacier', phase: 'burst', radius: 180 }), 64, 96);
    expect(kit.debris).toHaveBeenCalledWith(2, 3, 180 / 32, 'cryo', 18);
    expect(kit.scar).toHaveBeenCalledWith('frost', 2, 3, 180 / 32, 0x7fd6ff, 7);
    fx.update(frame({}, .15));
    expect(kit.front).not.toHaveBeenCalled();
    expect(kit.ring).toHaveBeenCalledWith(2, 3, 180 / 32, 0xe8fbff, .5);
  });

  it('circulates sparse snow and short gusts along one perimeter storm wall with a calm eye', () => {
    const kit = recordingKit(), fx = createCryoPresentation(kit as unknown as ElementKit);
    const f = frame({ zones: [zone()] }, 0);
    f.game = { geometry: { blockers: [{ x: 480, y: 300, width: 40, height: 40 }, { x: 900, y: 900, width: 40, height: 40 }] } } as never;
    fx.update(f);
    const shards = kit.draw.mock.calls.filter(c => c[0] === 'shard');
    expect(shards.length).toBe(24);
    const snow = shards.slice(0, 24);
    expect(snow.filter(c => c[6] > .2).length).toBeGreaterThan(6);
    expect(snow.every(c => c[4] >= .028 && c[8] >= .4)).toBe(true);
    for (const c of kit.draw.mock.calls) {
      const distance = Math.hypot(c[1] - 10, c[3] - 10);
      const support = Math.max(c[4], c[6]);
      expect(distance - support).toBeGreaterThan(2.25);
      expect(distance + support).toBeLessThan(300 / 32);
      expect(c[8]).toBeLessThanOrEqual(.58);
    }
    const gusts = kit.gust.mock.calls;
    expect(gusts).toHaveLength(6);
    const radii = gusts.map(c => Math.hypot(c[0] - 10, c[1] - 10));
    expect(Math.min(...radii)).toBeGreaterThan(300 / 32 * .8);
    expect(Math.max(...radii) - Math.min(...radii)).toBeGreaterThan(.1);
    expect(new Set(gusts.map(c => c[2].toFixed(2))).size).toBeGreaterThan(3);
    let supportArea = 0;
    for (const c of gusts) {
      const dx = c[0] - 10, dz = c[1] - 10, cosine = Math.cos(c[4]), sine = Math.sin(c[4]);
      const localX = dx * cosine + dz * sine, localZ = -dx * sine + dz * cosine;
      const nearest = Math.hypot(Math.max(0, Math.abs(localX) - c[2] / 2), Math.max(0, Math.abs(localZ) - c[3] / 2));
      expect(nearest).toBeGreaterThan(2.25);
      for (const side of [-1, 1]) for (const end of [-1, 1]) {
        expect(Math.hypot(dx + cosine * end * c[2] / 2 - sine * side * c[3] / 2,
          dz + sine * end * c[2] / 2 + cosine * side * c[3] / 2)).toBeLessThan(300 / 32);
      }
      expect(c[6]).toBeLessThanOrEqual(.48);
      supportArea += c[2] * c[3];
    }
    expect(supportArea).toBeLessThan(Math.PI * (300 / 32) ** 2 * .24);
    expect(kit.front).toHaveBeenCalledWith(10, 10, 300 / 32, 1, 0x7fd6ff, .65, .18, 3);
    // All spiral markers were replaced; only short authored-prop frost seams remain.
    for (const c of kit.ribbon.mock.calls) expect(Math.hypot(c[3] - c[0], c[5] - c[2])).toBeLessThanOrEqual(.350001);
    const positions = shards.map(c => [c[1], c[3], c[9]]), gustAngle = gusts[0][4];
    kit.draw.mockClear(); kit.gust.mockClear();
    fx.update(frame({ zones: [zone({ remainingMs: 6500 })] }, 0));
    expect(kit.draw.mock.calls.filter(c => c[0] === 'shard').map(c => [c[1], c[3], c[9]])).not.toEqual(positions);
    expect(kit.gust.mock.calls[0][4] - gustAngle).toBeCloseTo(.12);
    expect(kit.gust.mock.calls).toHaveLength(6);
    expect(kit.front.mock.calls.every(c => c[7] === 3)).toBe(true);
  });

  it('reserves expanding impact fronts for Nova and holds Whiteout at its exact storm perimeter', () => {
    const kit = recordingKit(), fx = createCryoPresentation(kit as unknown as ElementKit);
    for (const phase of ['impact', 'burst', 'end'] as const) fx.event(receipt({ ability: 'whiteout', phase, radius: 300 }), 320, 320);
    fx.update(frame({ zones: [zone({ remainingMs: 5990 })] }, .1));
    fx.update(frame({}, .1));
    expect(kit.front).toHaveBeenCalledExactlyOnceWith(10, 10, 300 / 32, 1, 0x7fd6ff, .65, .18, 3);
    expect(kit.ring).toHaveBeenCalledTimes(4);
    fx.event(receipt({ radius: 210 }), 320, 320); fx.update(frame({}, .1));
    expect(kit.front).toHaveBeenCalled();
  });

  it('keeps low-tier wall and storm silhouettes with fewer pooled instances and segments', () => {
    const high = recordingKit(), low = recordingKit(); low.low = true;
    createCryoPresentation(high as unknown as ElementKit).update(frame({ zones: [zone()], deployables: [wall({ health: 80 })] }));
    createCryoPresentation(low as unknown as ElementKit).update(frame({ zones: [zone()], deployables: [wall({ health: 80 })] }));
    expect(low.draw.mock.calls.length).toBe(16);
    expect(low.draw.mock.calls.length).toBeLessThanOrEqual(high.draw.mock.calls.length / 2);
    expect(low.ribbon.mock.calls.length).toBeLessThan(high.ribbon.mock.calls.length);
    expect(low.gust).toHaveBeenCalledTimes(3);
    expect(low.gust.mock.calls.length).toBeLessThan(high.gust.mock.calls.length);
    expect(low.front.mock.calls[0]).toEqual(high.front.mock.calls[0]);
  });

  it('marks sustained coverage by authoritative age and resets priority before leaving each presentation', () => {
    const kit = recordingKit(), fx = createCryoPresentation(kit as unknown as ElementKit);
    fx.update(frame({ zones: [zone(), zone({ ability: 'frost-trail', shape: 'strip', width: 44, remainingMs: 2000, durationMs: 2500 })], deployables: [wall()] }, 0));
    expect(kit.sustain).toHaveBeenCalledWith(1);
    expect(kit.sustain).toHaveBeenCalledWith(.5);
    expect(kit.impact.mock.invocationCallOrder.at(-1)).toBeGreaterThan(kit.sustain.mock.invocationCallOrder.at(-1)!);
    kit.reducedMotion = true; kit.draw.mockClear();
    fx.update(frame({ zones: [zone()] }, 0));
    const still = kit.draw.mock.calls.map(c => c.slice()), stillGusts = kit.gust.mock.calls.slice(-6).map(c => c.slice());
    kit.draw.mockClear(); kit.gust.mockClear(); kit.time = 20;
    fx.update(frame({ zones: [zone({ remainingMs: 6500 })] }, 0));
    expect(kit.draw.mock.calls).toEqual(still);
    expect(kit.gust.mock.calls).toEqual(stillGusts);
  });

  it('keeps three Low currents and the continuous storm wall in the exact outer annulus', () => {
    const kit = recordingKit(); kit.low = true;
    createCryoPresentation(kit as unknown as ElementKit).update(frame({ zones: [zone()] }, 0));
    const gusts = kit.gust.mock.calls;
    for (const c of gusts) {
      const dx = c[0] - 10, dz = c[1] - 10, cosine = Math.cos(c[4]), sine = Math.sin(c[4]);
      const localX = dx * cosine + dz * sine, localZ = -dx * sine + dz * cosine;
      expect(Math.hypot(Math.max(0, Math.abs(localX) - c[2] / 2), Math.max(0, Math.abs(localZ) - c[3] / 2))).toBeGreaterThan(2.25);
      for (const side of [-1, 1]) for (const end of [-1, 1]) {
        expect(Math.hypot(dx + cosine * end * c[2] / 2 - sine * side * c[3] / 2,
          dz + sine * end * c[2] / 2 + cosine * side * c[3] / 2)).toBeLessThan(300 / 32);
      }
    }
    expect(gusts).toHaveLength(3);
    expect(kit.front).toHaveBeenCalledExactlyOnceWith(10, 10, 300 / 32, 1, 0x7fd6ff, .65, .18, 3);

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
