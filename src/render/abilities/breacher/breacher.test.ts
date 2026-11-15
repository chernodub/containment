import { describe, expect, it, vi } from 'vitest';
import { BreacherPresentation, BREACHER_LIMITS } from './index';
import type { ElementKit } from '../ElementKit';
import type { AbilityFrame } from '../types';
import type { AbilitiesSnapshot, AbilityEvent, DeployableSnapshot } from '../../../game/abilities/contract';

function kitMock(low = false) {
  return {
    time: .2, low, reducedMotion: false, flashIntensity: 1,
    draw: vi.fn(), sprite: vi.fn(), ribbon: vi.fn(), mote: vi.fn(), burst: vi.fn(), flash: vi.fn(), ring: vi.fn(),
    distort: vi.fn(), camera: vi.fn(), decal: vi.fn(), beam: vi.fn(), outline: vi.fn(), lightAt: vi.fn(),
    sustain: vi.fn(), impact: vi.fn(), front: vi.fn(), debris: vi.fn(), scar: vi.fn(), heavyBeam: vi.fn(), anticipate: vi.fn(), exposureFlash: vi.fn(),
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
  it('grounds two emitter devices on the exact footprint and projects an open textured field between them', () => {
    const kit = kitMock(), fx = new BreacherPresentation(kit as unknown as ElementKit);
    fx.update(frame([barrier()]));
    const fields = kit.sprite.mock.calls.filter(c => c[0] === 'hex' || c[0] === 'scan');
    const ends = kit.draw.mock.calls.filter(c => c[7] === 0x293e4b);
    expect(fields).toHaveLength(2); expect(ends).toHaveLength(2);
    expect(ends.some(c => c[1] < 2 - 3.3)).toBe(true); expect(ends.some(c => c[1] > 2 + 3.3)).toBe(true);
    expect(kit.draw.mock.calls).toHaveLength(6);
    for (const piece of kit.draw.mock.calls) {
      expect(Math.abs(piece[1] - 2) + piece[6] / 2).toBeLessThanOrEqual(3.5 + .00001);
      expect(Math.abs(piece[3] - 3) + piece[4] / 2).toBeLessThanOrEqual(.25 + .00001);
      expect(piece[9]).toBeCloseTo(-Math.PI / 2);
      expect(Math.abs(piece[1] - 2)).toBeGreaterThan(3.3); // No solid central furniture.
    }
    for (const field of fields) {
      expect(field[1]).toBeCloseTo(2); expect(Math.abs(field[3] - 3)).toBeLessThan(.25);
      expect(field[4]).toBeLessThanOrEqual(3.5); expect(field[5]).toBe(1.2);
      expect(field[9]).toBe('vertical'); expect(field[10]).toBeCloseTo(0);
    }
    expect(fields[0][3]).toBeLessThan(3); expect(fields[0][6]).toBe(0x9fe8ff);
    expect(fields[0][7]).toBeGreaterThan(fields[1][7]);
    expect(kit.ribbon.mock.calls.filter(c => c[6] === 0xe8fbff)).toHaveLength(1);
    expect(kit.sustain).toHaveBeenCalledWith(.5); fx.dispose();
  });

  it('raises the field within 150ms and keeps both emitters and full native field width on Low', () => {
    const kit = kitMock(), fx = new BreacherPresentation(kit as unknown as ElementKit);
    fx.update(frame([barrier({ remainingMs: 6000 })], 0));
    expect(kit.sprite.mock.calls.filter(c => c[0] === 'hex')).toHaveLength(0);
    expect(kit.draw.mock.calls.filter(c => c[7] === 0x293e4b)).toHaveLength(2);
    kit.sprite.mockClear(); fx.update(frame([barrier({ remainingMs: 5980 })], 0));
    const opening = kit.sprite.mock.calls.find(c => c[0] === 'hex')!;
    expect(opening[5]).toBeGreaterThan(0); expect(opening[5]).toBeLessThan(1.2);
    kit.sprite.mockClear(); fx.update(frame([barrier({ remainingMs: 5800 })], 0));
    const highField = kit.sprite.mock.calls.find(c => c[0] === 'hex')!;
    expect(highField[2] + highField[5]).toBeCloseTo(2.52);
    const highCount = kit.sprite.mock.calls.length;
    const low = kitMock(true), lowFx = new BreacherPresentation(low as unknown as ElementKit);
    lowFx.update(frame([barrier()], 0));
    expect(low.sprite.mock.calls.length).toBeLessThan(highCount);
    expect(low.sprite.mock.calls.filter(c => c[0] === 'scan')).toHaveLength(1);
    expect(low.sprite.mock.calls[0][4]).toBe(highField[4]);
    expect(low.draw.mock.calls.filter(c => c[7] === 0x293e4b)).toHaveLength(2);
    fx.dispose(); lowFx.dispose();
  });

  it('responds to field load with one local textured ripple and keeps idle coverage restrained', () => {
    const kit = kitMock(), fx = new BreacherPresentation(kit as unknown as ElementKit);
    fx.update(frame([barrier()]));
    expect(kit.sprite.mock.calls.filter(c => c[0] === 'ring')).toHaveLength(0);
    kit.sprite.mockClear(); fx.update(frame([barrier({ health: 160 })]));
    const hot = kit.sprite.mock.calls.filter(c => c[0] === 'ring');
    expect(hot).toHaveLength(1); expect(hot[0][4]).toBeLessThan(.7);
    expect(hot[0][9]).toBe('vertical'); expect(hot[0][5]).toBe(hot[0][4]);
    expect(kit.outline).not.toHaveBeenCalled(); fx.dispose();
  });

  it('places one friendly-shot ripple on the observed crossing, deduplicates it and freezes it on pause', () => {
    const kit = kitMock(), fx = new BreacherPresentation(kit as unknown as ElementKit);
    const shot = { x: 68, y: 128, kind: 'player', request: { angle: 0, speed: 400 } };
    const game = { bullets: [shot] } as never;
    const e = barrier({ angle: 0 }); // Plane x=2, longitudinal axis +Z.
    fx.update({ ...frame([e], .016), game });
    let ripples = kit.sprite.mock.calls.filter(c => c[0] === 'ring');
    expect(ripples).toHaveLength(1);
    expect(ripples[0][1]).toBeCloseTo(2 - .5 * .14); expect(ripples[0][3]).toBeCloseTo(4);
    expect(ripples[0][6]).toBe(0xfff2d2);
    const firstRadius = ripples[0][4];
    kit.sprite.mockClear(); fx.update({ ...frame([e], .016), game });
    ripples = kit.sprite.mock.calls.filter(c => c[0] === 'ring');
    expect(ripples).toHaveLength(1); expect(ripples[0][4]).toBeGreaterThan(firstRadius);
    kit.sprite.mockClear(); fx.update({ ...frame([e], 0), game });
    const paused = kit.sprite.mock.calls.map(c => [...c]);
    kit.sprite.mockClear(); fx.update({ ...frame([e], 0), game });
    expect(kit.sprite.mock.calls).toEqual(paused);
    kit.sprite.mockClear(); fx.update({ ...frame([e], .22), game: { bullets: [] } as never });
    expect(kit.sprite.mock.calls.filter(c => c[0] === 'ring')).toHaveLength(0);
    fx.dispose();
  });

  it('does not invent ripples from a future aim ray, an out-of-bounds crossing or paused native bullets', () => {
    const kit = kitMock(), fx = new BreacherPresentation(kit as unknown as ElementKit);
    const e = barrier({ angle: 0 });
    const bullets = [
      { x: 40, y: 96, kind: 'player', request: { angle: 0, speed: 400 } }, // Still approaching.
      { x: 68, y: 224, kind: 'player', request: { angle: 0, speed: 400 } }, // Past wall end.
    ];
    fx.update({ ...frame([e], .016), game: { bullets } as never });
    expect(kit.sprite.mock.calls.filter(c => c[0] === 'ring')).toHaveLength(0);
    bullets[0].x = 68;
    fx.update({ ...frame([e], 0), game: { bullets } as never });
    expect(kit.sprite.mock.calls.filter(c => c[0] === 'ring')).toHaveLength(0);
    fx.clear(); kit.sprite.mockClear();
    fx.update({ ...frame([e], .016), game: { bullets: [bullets[0]] } as never });
    expect(kit.sprite.mock.calls.filter(c => c[0] === 'ring')).toHaveLength(1);
    fx.dispose();
  });

  it('uses a recently observed hostile approach for load feedback without changing the projectile or health', () => {
    const kit = kitMock(), fx = new BreacherPresentation(kit as unknown as ElementKit);
    const hazard = { x: 70, y: 128, kind: 'hazard', request: { angle: Math.PI, speed: 400 } };
    const e = barrier({ angle: 0 });
    const game = { bullets: [hazard] } as never;
    fx.update({ ...frame([e], .016), game });
    expect(kit.sprite.mock.calls.filter(c => c[0] === 'ring')).toHaveLength(0);
    kit.sprite.mockClear();
    const damaged = barrier({ angle: 0, health: 160 });
    fx.update({ ...frame([damaged], .016), game: { bullets: [] } as never });
    const load = kit.sprite.mock.calls.find(c => c[0] === 'ring')!;
    expect(load[3]).toBeCloseTo(4); expect(load[6]).toBe(0x9fe8ff);
    expect(hazard).toEqual({ x: 70, y: 128, kind: 'hazard', request: { angle: Math.PI, speed: 400 } });
    expect(damaged.health).toBe(160); fx.dispose();
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
    expect(kit.sprite.mock.calls.filter(c => c[0] === 'scan')).toHaveLength(BREACHER_LIMITS.barriers);
    expect(kit.draw.mock.calls.filter(c => c[7] === 0x293e4b)).toHaveLength(BREACHER_LIMITS.barriers * 2);
    fx.dispose();
  });

  it('gives Slam an exact pressure-front radius, deck cracks, debris and one impact camera response', () => {
    const kit = kitMock(), fx = new BreacherPresentation(kit as unknown as ElementKit);
    fx.event(event({ radius: 310 }), 64, 96);
    expect(kit.ring).toHaveBeenCalledWith(2, 3, 310 / 32, 0xffb454, .3);
    expect(kit.distort).toHaveBeenCalledWith(2, 3, 310 / 32, .007, .55);
    expect(kit.scar).toHaveBeenCalledWith('crack', 2, 3, 310 / 32, 0x121c23, 10);
    expect(kit.debris).not.toHaveBeenCalled(); // Only directed clipped steel, no generic random masses.
    expect(kit.camera).toHaveBeenCalledTimes(1);
    expect(kit.anticipate).toHaveBeenCalledWith(34, .045);
    fx.update(frame([], .15));
    const shock = kit.sprite.mock.calls.find(c => c[0] === 'shockwave')!;
    expect(shock[1]).toBe(2); expect(shock[3]).toBe(3);
    expect(shock[4]).toBeGreaterThan(0); expect(shock[4]).toBeLessThanOrEqual(310 / 32);
    expect(shock[5]).toBe(shock[4]); expect(shock[9]).toBe('ground');
    expect(kit.front).not.toHaveBeenCalled();
    expect(kit.ring).toHaveBeenCalledWith(2, 3, 310 / 32, 0xffb454, .3);
    expect(kit.scar).toHaveBeenCalledTimes(1);
    const chips = kit.draw.mock.calls.filter(c => c[0] === 'shard' && c[11] === 30);
    expect(chips.length).toBeGreaterThan(0);
    for (const chip of chips) {
      expect(chip[4]).toBeGreaterThanOrEqual(.32); expect(chip[4]).toBeLessThan(.81);
      expect(chip[5]).toBeLessThanOrEqual(.06); expect(chip[6]).toBeLessThanOrEqual(.38);
      expect(chip[5]).toBeLessThan(chip[4] * .2); // Thin manufactured deck sheet, no stone mass.
      expect([0x34424a, 0x91a5ad, 0xffb454]).toContain(chip[7]);
      expect(Math.hypot(chip[1] - 2, chip[3] - 3)).toBeLessThan(310 / 32 * .5);
    }
    const buckles = kit.draw.mock.calls.filter(c => c[0] === 'shard' && c[11] === 31);
    expect(buckles).toHaveLength(6);
    for (const plate of buckles) { expect(plate[5]).toBe(.022); expect(plate[2]).toBeLessThan(.2); }
    const firstPositions = chips.map(c => [c[1], c[3]]);
    kit.draw.mockClear(); fx.update(frame([], .1));
    const moved = kit.draw.mock.calls.filter(c => c[0] === 'shard' && c[11] === 30);
    for (let i=0;i<moved.length;i++) {
      const a=firstPositions[i],b=moved[i];
      expect((a[0]-2)*(b[3]-3)-(a[1]-3)*(b[1]-2)).toBeCloseTo(0);
      expect(Math.hypot(b[1]-2,b[3]-3)).toBeGreaterThan(Math.hypot(a[0]-2,a[1]-3));
    }
    for (const call of kit.draw.mock.calls) expect(Math.hypot(call[1] - 2, call[3] - 3)).toBeLessThanOrEqual(310 / 32);
    fx.dispose();
  });

  it('fires Railbreaker once on impact with a short white core and persistent heat/scorch', () => {
    const kit = kitMock(), fx = new BreacherPresentation(kit as unknown as ElementKit);
    fx.event(event({ ability: 'railbreaker', slot: 'overdrive', phase: 'link', angle: 0, targetX: 964, targetY: 96 }), 64, 96);
    expect(kit.heavyBeam).not.toHaveBeenCalled();
    fx.event(event({ ability: 'railbreaker', slot: 'overdrive', radius: undefined, length: 900, width: 44, angle: 0 }), 64, 96);
    expect(kit.heavyBeam).toHaveBeenCalledTimes(1);
    const white = kit.beam.mock.calls.find(c => c[6] === 0xfffbf2)!;
    expect(white).toBeDefined(); expect(white[7] * 2).toBeGreaterThan(1);
    expect(white[7] * 2).toBeLessThanOrEqual(44 / 32);
    expect(white[8]).toBeLessThan(.1); // The persistent air trail yields after the impact beat.
    const core = kit.heavyBeam.mock.calls[0];
    expect(core.slice(0, 6)).toEqual([2, .85, 3, 2 + 900 / 32, .85, 3]);
    expect(core[7] * 2).toBeGreaterThanOrEqual(.7);
    expect(core[8]).toBeGreaterThanOrEqual(.5);
    expect(kit.scar).toHaveBeenCalledWith('trench', 2 + 900 / 32 / 2, 3, 900 / 32 / 2, 0x111b22, 12, 0, .62);
    expect(kit.camera).toHaveBeenCalledWith(.92, 0);
    expect(kit.exposureFlash).toHaveBeenCalledWith(.95);
    fx.update(frame([], .03));
    const rings = kit.sprite.mock.calls.filter(c => c[0] === 'shockwave');
    expect(rings).toHaveLength(5);
    expect(new Set(rings.map(r => r[4])).size).toBe(5);
    for (const ring of rings) { expect(ring[9]).toBe('vertical'); expect(ring[10]).toBeCloseTo(Math.PI / 2); }
    kit.draw.mockClear(); fx.update(frame([], 1));
    expect(kit.draw.mock.calls.some(c => c[0] === 'solid')).toBe(false);
    expect(kit.scar).toHaveBeenCalledTimes(1); // One exact trench owns the lingering floor read.
    fx.dispose();
  });

  it('carries a shield-like pressure wedge on the actual marine during Ram', () => {
    const kit = kitMock(), fx = new BreacherPresentation(kit as unknown as ElementKit);
    fx.event(event({ ability: 'ram', slot: 'dash', phase: 'dash-start', angle: Math.PI / 2 }), 64, 96);
    fx.update({ ...frame([], .07), game: { player: { x: 320, y: 224 } } as never });
    const shield = kit.draw.mock.calls.filter(c => c[0] === 'solid');
    expect(shield).toHaveLength(1);
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
      const caps = kit.draw.mock.calls.filter(c => c[0] === 'solid' && c[11] !== 30);
      expect(caps).toHaveLength(1);
      const chips = kit.draw.mock.calls.filter(c => c[0] === 'solid' && c[11] === 30);
      expect(chips).toHaveLength(low ? 2 : 5);
      for (const chip of chips) {
        expect(chip[1]).toBeGreaterThanOrEqual(10); expect(Math.abs(chip[3] - 7)).toBeLessThan(.6);
        expect(chip[5]).toBe(.025); expect(chip[2]).toBeLessThan(.25);
      }
      expect(kit.sprite.mock.calls.filter(c => c[0] === 'impact')).toHaveLength(1);
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
