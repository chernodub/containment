import { describe, expect, it, vi } from 'vitest';
import * as T from 'three';
import type { AbilitiesSnapshot, AbilityEvent, AbilityZoneSnapshot, DeployableSnapshot } from '../../../game/abilities/contract';
import { ElementKit } from '../ElementKit';
import type { AbilityFrame } from '../types';
import { createCryoPresentation } from './index';

function recordingKit() {
  return {
    time: 1, low: false, reducedMotion: false, flashIntensity: 1,
    sprite: vi.fn(), statusActor: vi.fn(), draw: vi.fn(), mote: vi.fn(), burst: vi.fn(), ring: vi.fn(), outline: vi.fn(), beam: vi.fn(),
    ribbon: vi.fn(), decal: vi.fn(), flash: vi.fn(), distort: vi.fn(), camera: vi.fn(), lightAt: vi.fn(),
    sustain: vi.fn(), impact: vi.fn(), stormWisp: vi.fn(), gust: vi.fn(), frostFilm: vi.fn(), front: vi.fn(), scar: vi.fn(), debris: vi.fn(), iceColumn: vi.fn(),
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
    const mist = kit.sprite.mock.calls.filter(c => c[0] === 'mist');
    expect(mist).toHaveLength(8);
    for (const c of mist) {
      expect(Math.hypot(c[1] - 2, c[3] - 3) + c[4]).toBeLessThanOrEqual(310 / 32);
      expect(c[5]).toBeLessThan(.4); expect(c[7]).toBeLessThan(.5);
    }
    expect(kit.front).not.toHaveBeenCalled();

  });

  it('retains the Nova texture-vapor impact then thins it before sustained combat', () => {
    const kit = recordingKit(), fx = createCryoPresentation(kit as unknown as ElementKit);
    fx.event(receipt({ radius: 230 }), 64, 96);
    fx.update(frame({}, .09));
    const impact = kit.sprite.mock.calls.filter(c => c[0] === 'mist');
    expect(impact).toHaveLength(8); expect(impact[0][5]).toBeCloseTo(.46); expect(impact[0][7]).toBeGreaterThan(.4);
    kit.sprite.mockClear(); fx.update(frame({}, .077));
    const settled = kit.sprite.mock.calls.filter(c => c[0] === 'mist');
    expect(settled).toHaveLength(impact.length);
    for (let i = 0; i < settled.length; i++) {
      const c = settled[i];
      expect(Math.hypot(c[1] - 2, c[3] - 3)).toBeGreaterThan(Math.hypot(impact[i][1] - 2, impact[i][3] - 3));
      expect(Math.hypot(c[1] - 2, c[3] - 3) + c[4]).toBeLessThanOrEqual(230 / 32);
      expect(c[5]).toBeGreaterThanOrEqual(.24); expect(c[5]).toBeLessThan(.3);
      expect(c[7]).toBeLessThan(impact[i][7] * .5);
    }
    expect(kit.front).not.toHaveBeenCalled();
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
    const freshSnow = kit.sprite.mock.calls.filter(c => c[0] === 'snow').map(c => c[7]);
    kit.draw.mockClear(); kit.gust.mockClear(); kit.sprite.mockClear();
    fx.update(frame({ zones: [zone({ remainingMs: 7000 })] }, 0));
    expect(kit.gust.mock.calls).toHaveLength(freshGusts.length);
    for (let i = 0; i < freshGusts.length; i++) {
      expect(kit.gust.mock.calls[i].slice(2, 4)).toEqual(freshGusts[i].slice(2, 4));
      expect(kit.gust.mock.calls[i][6]).toBeLessThan(freshGusts[i][6] * .36);
    }
    expect(kit.sprite.mock.calls.filter(c => c[0] === 'snow').map(c => c[7])).toEqual(freshSnow);
    expect(kit.front).not.toHaveBeenCalled();
    expect(kit.sprite.mock.calls.filter(c => c[0] === 'mist')).toHaveLength(20);
  });

  it('grounds seven unequal tapered Glacier crystals inside the exact blocking strip', () => {
    const kit = recordingKit(), fx = createCryoPresentation(kit as unknown as ElementKit);
    for (const angle of [0, Math.PI / 2, .67]) {
      kit.draw.mockClear();
      fx.update(frame({ deployables: [wall({ angle })] }, 0));
      const facets = kit.draw.mock.calls;
      expect(facets.length).toBe(11);
      expect(facets.filter(c => c[11] >= 22 && c[11] < 26)).toHaveLength(7);
      expect(facets[0][2] - facets[0][5]).toBe(0);
      expect(facets.filter(c => c[6] === 200 / 32 / 2)).toHaveLength(1);
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
    expect(low.sprite.mock.calls.length).toBeLessThan(high.sprite.mock.calls.length);
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

  it('drives authored snow and mist around one storm perimeter with a calm eye', () => {
    const kit = recordingKit(), fx = createCryoPresentation(kit as unknown as ElementKit);
    const f = frame({ zones: [zone()] }, 0);
    f.game = { geometry: { blockers: [{ x: 480, y: 300, width: 40, height: 40 }, { x: 900, y: 900, width: 40, height: 40 }] } } as never;
    fx.update(f);
    const clouds = kit.sprite.mock.calls.filter(c => c[0] === 'mist'), snow = kit.sprite.mock.calls.filter(c => c[0] === 'snow');
    expect(clouds).toHaveLength(20); expect(snow).toHaveLength(7);
    expect(new Set(clouds.map(c => c[5].toFixed(3))).size).toBeGreaterThan(8);
    for (const c of [...clouds, ...snow]) {
      const distance = Math.hypot(c[1] - 10, c[3] - 10);
      const support = c[4] * Math.cos(Math.abs(c[11])) + c[5] * Math.sin(Math.abs(c[11]));
      expect(distance - support).toBeGreaterThan(2.25);
      expect(distance + support).toBeLessThan(300 / 32);
      expect(c[7]).toBeLessThanOrEqual(1); expect(c[9]).toBe('billboard');
      expect(c[11]).toBe(c[0] === 'mist' ? -.24 : -.72);
    }
    const deposits = kit.sprite.mock.calls.filter(c => c[0] === 'frost');
    expect(deposits.length).toBeGreaterThan(0); expect(deposits.length).toBeLessThanOrEqual(4);
    for (const c of deposits) {
      expect(c[9]).toBe('ground');
      expect(Math.hypot(c[1] - 10, c[3] - 10) + Math.hypot(c[4], c[5])).toBeLessThan(300 / 32);
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
    // Shared pool leaves room for status wisps and scars; no geometry snow draw remains.
    expect(kit.draw).not.toHaveBeenCalled();
    const positions = clouds.map(c => [c[1], c[3]]), gustAngle = gusts[0][4];
    kit.sprite.mockClear(); kit.gust.mockClear();
    fx.update(frame({ zones: [zone({ remainingMs: 6500 })] }, 0));
    expect(kit.sprite.mock.calls.filter(c => c[0] === 'mist').map(c => [c[1], c[3]])).not.toEqual(positions);
    expect(kit.gust.mock.calls[0][4] - gustAngle).toBeCloseTo(.12);
    expect(kit.gust.mock.calls).toHaveLength(6);
    expect(kit.front).not.toHaveBeenCalled();

  });

  it.each([false, true])('overlaps broad storm clouds above the floor with a clear directional crest (Low %s)', low => {
    const kit = recordingKit(); kit.low = low;
    createCryoPresentation(kit as unknown as ElementKit).update(frame({ zones: [zone()] }, 0));
    const clouds = kit.sprite.mock.calls.filter(c => c[0] === 'mist');
    expect(clouds).toHaveLength(low ? 10 : 20);
    let minimumHeight = Infinity, maximumHeight = 0;
    for (const c of clouds) {
      expect(c[4]).toBeGreaterThanOrEqual(low ? 1.8 : 1.4);
      expect(c[4]).toBeLessThanOrEqual(low ? 2.2 : 1.8);
      expect(c[5]).toBeGreaterThanOrEqual(low ? .5 : .9);
      expect(c[5]).toBeLessThanOrEqual(low ? .65 : 1.4);
      expect(c[7]).toBeGreaterThanOrEqual(.85); expect(c[7]).toBeLessThanOrEqual(1);
      const vertical = c[4] * Math.abs(Math.sin(c[11])) + c[5] * Math.cos(c[11]);
      const horizontal = Math.hypot(c[4], c[5]);
      expect(c[2] - vertical).toBeGreaterThanOrEqual(.034999);
      const distance = Math.hypot(c[1] - 10, c[3] - 10);
      expect(distance - horizontal).toBeGreaterThan(4);
      expect(distance + horizontal).toBeLessThan(300 / 32);
      minimumHeight = Math.min(minimumHeight, c[5]); maximumHeight = Math.max(maximumHeight, c[5]);
    }
    expect(maximumHeight - minimumHeight).toBeGreaterThan(low ? .06 : .15);
  });

  it('reserves expanding textured vapor for Nova and holds Whiteout at its exact storm perimeter', () => {
    const kit = recordingKit(), fx = createCryoPresentation(kit as unknown as ElementKit);
    for (const phase of ['impact', 'burst', 'end'] as const) fx.event(receipt({ ability: 'whiteout', phase, radius: 300 }), 320, 320);
    fx.update(frame({ zones: [zone({ remainingMs: 5990 })] }, .1));
    fx.update(frame({}, .1));
    expect(kit.front).not.toHaveBeenCalled();
    expect(kit.sprite.mock.calls.filter(c => c[0] === 'mist')).toHaveLength(20);
    expect(kit.ring).toHaveBeenCalledTimes(4);
    fx.event(receipt({ radius: 210 }), 320, 320); fx.update(frame({}, .1));
    expect(kit.sprite.mock.calls.filter(c => c[0] === 'mist')).toHaveLength(28);
    expect(kit.front).not.toHaveBeenCalled();
  });

  it('keeps low-tier wall and storm silhouettes with fewer pooled instances and segments', () => {
    const high = recordingKit(), low = recordingKit(); low.low = true;
    createCryoPresentation(high as unknown as ElementKit).update(frame({ zones: [zone()], deployables: [wall({ health: 80 })] }));
    createCryoPresentation(low as unknown as ElementKit).update(frame({ zones: [zone()], deployables: [wall({ health: 80 })] }));
    expect(low.draw.mock.calls.length).toBe(8);
    expect(low.draw.mock.calls.length).toBeLessThan(high.draw.mock.calls.length);
    expect(low.sprite.mock.calls.length).toBeLessThan(high.sprite.mock.calls.length);
    expect(low.gust).toHaveBeenCalledTimes(3);
    expect(low.gust.mock.calls.length).toBeLessThan(high.gust.mock.calls.length);
    expect(low.sprite.mock.calls.filter(c => c[0] === 'mist')).toHaveLength(10);
    expect(high.sprite.mock.calls.filter(c => c[0] === 'mist')).toHaveLength(20);
  });

  it('marks sustained coverage by authoritative age and resets priority before leaving each presentation', () => {
    const kit = recordingKit(), fx = createCryoPresentation(kit as unknown as ElementKit);
    fx.update(frame({ zones: [zone(), zone({ ability: 'frost-trail', shape: 'strip', width: 44, remainingMs: 2000, durationMs: 2500 })], deployables: [wall()] }, 0));
    expect(kit.sustain).toHaveBeenCalledWith(1);
    expect(kit.sustain).toHaveBeenCalledWith(.5);
    expect(kit.impact.mock.invocationCallOrder.at(-1)).toBeGreaterThan(kit.sustain.mock.invocationCallOrder.at(-1)!);
    kit.reducedMotion = true; kit.draw.mockClear(); kit.sprite.mockClear();
    fx.update(frame({ zones: [zone()] }, 0));
    const still = kit.draw.mock.calls.map(c => c.slice()), stillSprites = kit.sprite.mock.calls.map(c => c.slice()), stillGusts = kit.gust.mock.calls.slice(-6).map(c => c.slice());
    kit.draw.mockClear(); kit.gust.mockClear(); kit.sprite.mockClear(); kit.time = 20;
    fx.update(frame({ zones: [zone({ remainingMs: 6500 })] }, 0));
    expect(kit.draw.mock.calls).toEqual(still);
    expect(kit.sprite.mock.calls).toEqual(stillSprites);
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
    expect(kit.front).not.toHaveBeenCalled();
    expect(kit.sprite.mock.calls.filter(c => c[0] === 'mist')).toHaveLength(10);

  });

  it.each([false, true])('puts bounded vapor on actually chilled targets and creeps frost at real blocker bases (Low %s)', low => {
    const kit = recordingKit(); kit.low = low;
    const fx = createCryoPresentation(kit as unknown as ElementKit);
    const f = frame({ zones: [zone()] }, 0);
    f.game = {
      enemies: { snapshot: { enemies: Array.from({ length: 9 }, (_, i) => ({
        id: i, x: i === 8 ? 2000 : 340 + i * 10, y: 350, radius: 16, health: i === 7 ? 0 : 30,
      })) } },
      boonStatuses: (id: number) => ({ chilled: id !== 0, frozen: id === 2 }),
      geometry: { blockers: [{ x: 480, y: 300, width: 40, height: 40 }] },
    } as never;
    fx.update(f);
    const mist = kit.sprite.mock.calls.filter(c => c[0] === 'mist');
    const target = mist.slice(low ? 10 : 20);
    expect(target).toHaveLength(low ? 2 : 4);
    expect(target.every(c => c[7] <= .38 && c[5] <= .58)).toBe(true);
    expect(target.map(c => c[8])).not.toContain(0);
    expect(target.map(c => c[8])).not.toContain(7);
    expect(target.map(c => c[8])).not.toContain(8);
    const fresh = kit.sprite.mock.calls.filter(c => c[0] === 'frost');
    expect(fresh).toHaveLength(low ? 2 : 4);
    kit.sprite.mockClear();
    f.snapshot = snapshot({ zones: [zone({ remainingMs: 5000 })] });
    fx.update(f);
    const settled = kit.sprite.mock.calls.filter(c => c[0] === 'frost');
    expect(settled).toHaveLength(fresh.length);
    for (let i = 0; i < fresh.length; i++) {
      expect(settled[i][4]).toBeGreaterThan(fresh[i][4]);
      expect(settled[i][5]).toBeGreaterThan(fresh[i][5]);
      expect(settled[i].slice(1, 4)).toEqual(fresh[i].slice(1, 4));
    }
    // Perimeter + target vapor + deposits leave room in the 64-decal pool.
    expect(kit.sprite.mock.calls.length).toBeLessThanOrEqual(low ? 17 : 35);
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
