import { describe, expect, it, vi } from 'vitest';
import { BreacherPresentation, BREACHER_LIMITS } from './index';
import type { ElementKit } from '../ElementKit';
import type { AbilityFrame } from '../types';
import type { AbilitiesSnapshot, AbilityEvent, DeployableSnapshot } from '../../../game/abilities/contract';

function kitMock(low = false) {
  return {
    time: .2, low, reducedMotion: false, flashIntensity: 1,
    draw: vi.fn(), ribbon: vi.fn(), mote: vi.fn(), burst: vi.fn(), flash: vi.fn(), ring: vi.fn(),
    distort: vi.fn(), camera: vi.fn(), decal: vi.fn(), beam: vi.fn(), outline: vi.fn(), lightAt: vi.fn(),
    front: vi.fn(), debris: vi.fn(), scar: vi.fn(), heavyBeam: vi.fn(), anticipate: vi.fn(), exposureFlash: vi.fn(),
  };
}
const barrier = (extra: Partial<DeployableSnapshot> = {}): DeployableSnapshot => ({
  id: 1, ability: 'bulwark', element: 'kinetic', kind: 'barrier', x: 64, y: 96, angle: Math.PI / 2,
  length: 224, thickness: 16, radius: 0, remainingMs: 5700, durationMs: 6000, health: 200, maxHealth: 200, ...extra,
});
const state = (deployables: readonly DeployableSnapshot[] = []): AbilitiesSnapshot => ({
  rig: 'breacher', slots: null, zones: [], deployables,
  invulnerable: false, dashing: false, hostileTimeScale: 1,
  overdrive: { charge: 0, ready: false, active: false, activeRemainingMs: 0 },
});
const frame = (deployables: readonly DeployableSnapshot[] = [], dt = .016): AbilityFrame => ({
  snapshot: state(deployables), dt, visible: true,
});
const event = (extra: Partial<AbilityEvent> = {}): AbilityEvent => ({
  ability: 'seismic-slam', rig: 'breacher', slot: 'tactical', phase: 'impact', element: 'kinetic', radius: 230, ...extra,
});

describe('Breacher presentation', () => {
  it('grounds one continuous field on the exact footprint, with nodes at both ends and a thick top edge', () => {
    const kit = kitMock(), fx = new BreacherPresentation(kit as unknown as ElementKit);
    fx.update(frame([barrier()]));
    const fields = kit.draw.mock.calls.filter(c => c[0] === 'solid' && c[5] === 2.4);
    expect(fields).toHaveLength(1);
    const field = fields[0];
    expect(field[1]).toBe(2); expect(field[3]).toBe(3);
    expect(field[4]).toBeCloseTo(.5 * .72); expect(field[6]).toBe(7);
    expect(field[9]).toBeCloseTo(-Math.PI / 2);
    expect(field[7]).toBe(0x9fe8ff);
    expect(field[8]).toBeGreaterThan(.15); expect(field[8]).toBeLessThan(.25);
    const nodes = kit.draw.mock.calls.filter(c => c[0] === 'solid' && c[5] === .22);
    expect(nodes).toHaveLength(5);
    expect(nodes.some(c => c[1] < 2 - 3.3)).toBe(true);
    expect(nodes.some(c => c[1] > 2 + 3.3)).toBe(true);
    for (const node of nodes) {
      expect(node[3]).toBeCloseTo(3);
      expect(Math.abs(node[1] - 2) + node[6] / 2).toBeLessThanOrEqual(3.5);
    }
    const rims = kit.ribbon.mock.calls.filter(c => c[1] === 2.46 && c[4] === 2.46);
    expect(rims).toHaveLength(4); // Front/back rails and the two depth caps.
    expect(kit.ribbon.mock.calls.length).toBeLessThan(7 * 20);
    fx.dispose();
  });

  it('unfolds a single field within 150ms and keeps Low cover with fewer decorative cells', () => {
    const kit = kitMock(), fx = new BreacherPresentation(kit as unknown as ElementKit);
    fx.update(frame([barrier({ remainingMs: 6000 })], 0));
    expect(kit.draw.mock.calls.some(c => c[7] === 0x9fe8ff && c[5] > .1)).toBe(false);
    expect(kit.draw.mock.calls.filter(c => c[5] === .22)).toHaveLength(5);
    kit.draw.mockClear();
    fx.update(frame([barrier({ remainingMs: 5980 })], 0));
    const opening = kit.draw.mock.calls.find(c => c[7] === 0x9fe8ff && c[5] > .1)!;
    expect(opening[5]).toBeGreaterThan(0); expect(opening[5]).toBeLessThan(2.4);
    kit.draw.mockClear(); kit.ribbon.mockClear();
    fx.update(frame([barrier({ remainingMs: 5800 })], 0));
    expect(kit.draw.mock.calls.filter(c => c[5] === 2.4)).toHaveLength(1);
    const highCount = kit.ribbon.mock.calls.length;
    const low = kitMock(true), lowFx = new BreacherPresentation(low as unknown as ElementKit);
    lowFx.update(frame([barrier()], 0));
    expect(low.ribbon.mock.calls.length).toBeLessThan(highCount / 5);
    expect(low.draw.mock.calls.filter(c => c[5] === 2.4)).toHaveLength(1);
    expect(low.draw.mock.calls.filter(c => c[5] === .22)).toHaveLength(3);
    fx.dispose(); lowFx.dispose();
  });

  it('lights only nearby hex cells on a load receipt and leaves other cells subdued', () => {
    const kit = kitMock(), fx = new BreacherPresentation(kit as unknown as ElementKit);
    fx.update(frame([barrier()])); kit.ribbon.mockClear();
    fx.update(frame([barrier({ health: 160 })]));
    const cells = kit.ribbon.mock.calls.filter(c => c[7] < .012);
    const hot = cells.filter(c => c[6] === 0xfff2d2), cool = cells.filter(c => c[6] === 0x9fe8ff);
    expect(hot.length).toBeGreaterThan(0); expect(cool.length).toBeGreaterThan(hot.length);
    expect(kit.outline).not.toHaveBeenCalled(); // No friendly circular warning appears on impact.
    fx.dispose();
  });

  it('responds once to health receipts and collapses retired barriers once', () => {
    const kit = kitMock(), fx = new BreacherPresentation(kit as unknown as ElementKit);
    fx.update(frame([barrier()]));
    fx.update(frame([barrier({ health: 160 })]));
    expect(kit.burst).toHaveBeenCalledTimes(1);
    fx.update(frame([barrier({ health: 160 })]));
    expect(kit.burst).toHaveBeenCalledTimes(1);
    fx.update(frame());
    const shards = kit.mote.mock.calls.length;
    expect(shards).toBe(21);
    fx.update(frame()); expect(kit.mote.mock.calls).toHaveLength(shards);
    fx.dispose();
  });

  it('caps barriers at the simulation inventory budget without allocating overflow state', () => {
    const kit = kitMock(true), fx = new BreacherPresentation(kit as unknown as ElementKit);
    fx.update(frame(Array.from({ length: 20 }, (_, id) => barrier({ id }))));
    expect(kit.lightAt).toHaveBeenCalledTimes(BREACHER_LIMITS.barriers);
    expect(kit.draw.mock.calls.filter(c => c[5] === 2.4)).toHaveLength(8);
    fx.dispose();
  });

  it('gives Slam an exact pressure-front radius, deck cracks, debris and one impact camera response', () => {
    const kit = kitMock(), fx = new BreacherPresentation(kit as unknown as ElementKit);
    fx.event(event({ radius: 310 }), 64, 96);
    expect(kit.ring).toHaveBeenCalledWith(2, 3, 310 / 32, 0xffb454, .28);
    expect(kit.distort).toHaveBeenCalledWith(2, 3, 310 / 32, .007, .55);
    expect(kit.scar).toHaveBeenCalledWith('crack', 2, 3, 310 / 32, 0x211a13, 10);
    expect(kit.debris).toHaveBeenCalledWith(2, 3, 310 / 32, 'kinetic', 32);
    expect(kit.camera).toHaveBeenCalledTimes(1);
    expect(kit.anticipate).toHaveBeenCalledWith(34, .045);
    fx.update(frame([], .15));
    expect(kit.front).toHaveBeenCalledWith(2, 3, 310 / 32, 1, 0xffb454, .045, expect.any(Number));
    expect(kit.front).toHaveBeenCalledTimes(1);
    expect(kit.scar).toHaveBeenCalledTimes(1);
    const chips = kit.draw.mock.calls.filter(c => c[0] === 'shard');
    expect(chips.length).toBeGreaterThan(0);
    for (const chip of chips) { expect(chip[4]).toBeLessThan(.13); expect(chip[6]).toBeLessThan(.09); }
    expect(kit.draw.mock.calls.some(c => c[0] === 'solid')).toBe(false);
    for (const call of kit.front.mock.calls) expect(call[3]).toBeLessThanOrEqual(1);
    fx.dispose();
  });

  it('fires Railbreaker once on impact with a short white core and persistent heat/scorch', () => {
    const kit = kitMock(), fx = new BreacherPresentation(kit as unknown as ElementKit);
    fx.event(event({ ability: 'railbreaker', slot: 'overdrive', phase: 'link', angle: 0, targetX: 964, targetY: 96 }), 64, 96);
    expect(kit.heavyBeam).not.toHaveBeenCalled();
    fx.event(event({ ability: 'railbreaker', slot: 'overdrive', radius: undefined, length: 900, width: 44, angle: 0 }), 64, 96);
    expect(kit.heavyBeam).toHaveBeenCalledTimes(1);
    const core = kit.heavyBeam.mock.calls[0];
    expect(core.slice(0, 6)).toEqual([2, .85, 3, 2 + 900 / 32, .85, 3]);
    expect(core[7] * 2).toBeGreaterThanOrEqual(.7);
    expect(core[8]).toBeGreaterThanOrEqual(.5);
    expect(kit.scar).toHaveBeenCalledWith('trench', 2 + 900 / 32 / 2, 3, 900 / 32 / 2, 0x1b1510, 12, 0, .62);
    expect(kit.camera).toHaveBeenCalledWith(.92, 0);
    expect(kit.exposureFlash).toHaveBeenCalledWith(.95);
    fx.update(frame([], .03));
    const rings = kit.draw.mock.calls.filter(c => c[0] === 'front');
    expect(rings).toHaveLength(6);
    for (const ring of rings) { expect(ring[9]).toBeCloseTo(0); expect(ring[10]).toBe(Math.PI / 2); }
    kit.draw.mockClear(); fx.update(frame([], 1));
    expect(kit.draw.mock.calls.some(c => c[0] === 'solid' && c[4] === 900 / 32 && c[5] === .012)).toBe(true);
    fx.dispose();
  });

  it('carries a shield-like pressure wedge on the actual marine during Ram', () => {
    const kit = kitMock(), fx = new BreacherPresentation(kit as unknown as ElementKit);
    fx.event(event({ ability: 'ram', slot: 'dash', phase: 'dash-start', angle: Math.PI / 2 }), 64, 96);
    fx.update({ ...frame([], .07), game: { player: { x: 320, y: 224 } } as never });
    const shield = kit.draw.mock.calls.filter(c => c[0] === 'shard');
    expect(shield).toHaveLength(4);
    for (const face of shield) {
      expect(face[1]).toBeCloseTo(10); expect(face[3]).toBeGreaterThan(7);
      expect(face[5] * 2).toBeGreaterThanOrEqual(1.2);
    }
    expect(kit.draw.mock.calls.filter(c => c[0] === 'smoke')).toHaveLength(2);
    fx.dispose();
  });

  it('keeps Ram arrival mass directional at the actual endpoint without inventing a circular hit area', () => {
    for (const low of [false, true]) {
      const kit = kitMock(low), fx = new BreacherPresentation(kit as unknown as ElementKit);
      fx.event(event({ ability: 'ram', slot: 'dash', phase: 'dash-end', angle: 0, targetX: 320, targetY: 224 }), 64, 96);
      fx.update(frame([], .03));
      const caps = kit.draw.mock.calls.filter(c => c[0] === 'shard');
      expect(caps.length).toBe(low ? 1 : 2);
      expect(caps[0][1]).toBeGreaterThan(10); expect(caps[0][3]).toBeCloseTo(7);
      expect(caps[0][8]).toBeGreaterThan(.35);
      expect(kit.draw.mock.calls.filter(c => c[0] === 'smoke')).toHaveLength(2);
      expect(kit.ring).not.toHaveBeenCalled(); expect(kit.front).not.toHaveBeenCalled(); expect(kit.outline).not.toHaveBeenCalled();
      kit.draw.mockClear(); fx.update(frame([], 0)); const paused = kit.draw.mock.calls.map(c => [...c]);
      kit.draw.mockClear(); fx.update(frame([], 0)); expect(kit.draw.mock.calls).toEqual(paused);
      fx.clear(); kit.draw.mockClear(); fx.update(frame([], .03)); expect(kit.draw).not.toHaveBeenCalled(); fx.dispose();
    }
  });

  it('places two short Ram skids only between observed dash endpoints, with no speculative future mark', () => {
    for (const low of [false, true]) {
      const kit = kitMock(low), fx = new BreacherPresentation(kit as unknown as ElementKit);
      fx.event(event({ ability: 'ram', slot: 'dash', phase: 'dash-start', angle: 0, targetX: 960, targetY: 96 }), 64, 96);
      expect(kit.scar).not.toHaveBeenCalled(); expect(kit.beam).not.toHaveBeenCalled();
      fx.event(event({ ability: 'ram', slot: 'dash', phase: 'dash-end', angle: 0, targetX: 192, targetY: 96 }), 64, 96);
      expect(kit.scar).toHaveBeenCalledTimes(2); expect(kit.beam).toHaveBeenCalledTimes(2);
      for (const scar of kit.scar.mock.calls) {
        expect(scar[0]).toBe('trench'); expect(scar[1]).toBe(4); expect(scar[3]).toBe(2);
        expect(Math.abs(scar[2] - 3)).toBeCloseTo(.38); expect(scar[5]).toBe(2.4);
      }
      for (const heat of kit.beam.mock.calls) {
        expect(heat[0]).toBe(2); expect(heat[3]).toBe(6); expect(heat[1]).toBe(.055);
        expect(heat[8]).toBeLessThan(1); expect(heat[9]).toBe(false);
      }
      fx.event(event({ ability: 'ram', slot: 'dash', phase: 'dash-end', targetX: 224, targetY: 96 }), 64, 96);
      expect(kit.scar).toHaveBeenCalledTimes(2); // A duplicate arrival cannot reuse an old start.
      fx.clear(); kit.scar.mockClear();
      fx.event(event({ ability: 'ram', slot: 'dash', phase: 'dash-start' }), 64, 96); fx.clear();
      fx.event(event({ ability: 'ram', slot: 'dash', phase: 'dash-end', targetX: 224, targetY: 96 }), 64, 96);
      expect(kit.scar).not.toHaveBeenCalled(); fx.dispose();
    }
  });

  it('locates Rail slag at the first authored wall, once, and emits nothing on paused refresh', () => {
    const kit = kitMock(), fx = new BreacherPresentation(kit as unknown as ElementKit);
    const game = { geometry: { bounds: { x: 0, y: 0, width: 960, height: 640 }, blockers: [{ x: 320, y: 64, width: 20, height: 80 }] } } as never;
    fx.event(event({ ability: 'railbreaker', slot: 'overdrive', radius: undefined, length: 900, angle: 0 }), 64, 96);
    const f = { ...frame([], 0), game };
    fx.update(f); expect(kit.burst.mock.calls.filter(c => c[0] === 10)).toHaveLength(0);
    fx.update({ ...f, dt: .03 });
    expect(kit.burst.mock.calls.filter(c => c[0] === 10 && c[1] === .85 && c[2] === 3)).toHaveLength(1);
    fx.update({ ...f, dt: .03 });
    expect(kit.burst.mock.calls.filter(c => c[0] === 10)).toHaveLength(1);
    fx.dispose();
  });

  it('freezes cast animation at zero delta, ignores dry phases, and clears all transient state', () => {
    const kit = kitMock(), fx = new BreacherPresentation(kit as unknown as ElementKit);
    fx.event(event({ phase: 'denied' }), 64, 96);
    fx.event(event({ phase: 'ready' }), 64, 96);
    expect(kit.draw).not.toHaveBeenCalled(); expect(kit.camera).not.toHaveBeenCalled();
    fx.event(event({ phase: 'cast', durationMs: 220 }), 64, 96);
    fx.update(frame([], .03));
    kit.ribbon.mockClear(); fx.update(frame([], 0));
    const first = kit.ribbon.mock.calls.map(c => [...c]);
    kit.ribbon.mockClear(); fx.update(frame([], 0));
    expect(kit.ribbon.mock.calls).toEqual(first);
    fx.clear(); kit.ribbon.mockClear(); kit.draw.mockClear(); fx.update(frame([], .03));
    expect(kit.draw).not.toHaveBeenCalled(); expect(kit.ribbon).not.toHaveBeenCalled();
    fx.dispose(); fx.dispose();
    fx.event(event(), 64, 96); expect(kit.camera).not.toHaveBeenCalled();
  });
});
