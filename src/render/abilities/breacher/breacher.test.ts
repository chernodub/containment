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
  it('assembles a perpendicular seven-panel barrier from authoritative dimensions', () => {
    const kit = kitMock(), fx = new BreacherPresentation(kit as unknown as ElementKit);
    fx.update(frame([barrier()]));
    const panels = kit.draw.mock.calls.filter(c => c[0] === 'solid' && c[5] === 1.5);
    expect(panels).toHaveLength(BREACHER_LIMITS.panels);
    for (let i = 0; i < panels.length; i++) {
      const call = panels[i];
      expect(call[1]).toBeCloseTo(2 - ((i + .5) - 3.5));
      expect(call[3]).toBeCloseTo(3);
      expect(call[4]).toBeCloseTo(.5 * .45);
      expect(call[6]).toBeCloseTo(.92);
      expect(call[9]).toBeCloseTo(-Math.PI / 2);
      expect(call[8]).toBeLessThan(.1); // Transparent cover never conceals actors.
    }
    expect(kit.ribbon.mock.calls.length).toBe(7 * 14);
    fx.dispose();
  });

  it('unfolds left to right within 150ms and keeps Low silhouette cheaper', () => {
    const kit = kitMock(), fx = new BreacherPresentation(kit as unknown as ElementKit);
    fx.update(frame([barrier({ remainingMs: 6000 })], 0));
    expect(kit.draw.mock.calls.filter(c => c[5] === .13)).toHaveLength(7);
    expect(kit.draw.mock.calls.filter(c => c[5] === .04)).toHaveLength(7);
    kit.draw.mockClear();
    fx.update(frame([barrier({ remainingMs: 5980 })], 0));
    const opening = kit.draw.mock.calls.length;
    kit.draw.mockClear(); kit.ribbon.mockClear();
    fx.update(frame([barrier({ remainingMs: 5800 })], 0));
    expect(kit.draw.mock.calls.length).toBeGreaterThan(opening);
    const highCount = kit.ribbon.mock.calls.length;
    const low = kitMock(true), lowFx = new BreacherPresentation(low as unknown as ElementKit);
    lowFx.update(frame([barrier()], 0));
    expect(low.ribbon.mock.calls.length).toBeLessThan(highCount / 5);
    expect(low.draw.mock.calls.filter(c => c[5] === 1.5)).toHaveLength(3);
    fx.dispose(); lowFx.dispose();
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
    expect(shards).toBe(18);
    fx.update(frame()); expect(kit.mote.mock.calls).toHaveLength(shards);
    fx.dispose();
  });

  it('caps barriers at the simulation inventory budget without allocating overflow state', () => {
    const kit = kitMock(true), fx = new BreacherPresentation(kit as unknown as ElementKit);
    fx.update(frame(Array.from({ length: 20 }, (_, id) => barrier({ id }))));
    expect(kit.lightAt).toHaveBeenCalledTimes(BREACHER_LIMITS.barriers);
    expect(kit.draw.mock.calls.filter(c => c[5] === 1.5)).toHaveLength(8 * 3);
    fx.dispose();
  });

  it('gives Slam an exact pressure-front radius, deck cracks, debris and one impact camera response', () => {
    const kit = kitMock(), fx = new BreacherPresentation(kit as unknown as ElementKit);
    fx.event(event({ radius: 310 }), 64, 96);
    expect(kit.ring).toHaveBeenCalledWith(2, 3, 310 / 32, 0xffb454, .55);
    expect(kit.distort).toHaveBeenCalledWith(2, 3, 310 / 32, .007, .55);
    expect(kit.decal).toHaveBeenCalled();
    expect(kit.mote.mock.calls.some(c => c[0] === 'solid' && c[5] > 0)).toBe(true);
    expect(kit.camera).toHaveBeenCalledTimes(1);
    fx.dispose();
  });

  it('fires Railbreaker once on impact with a short white core and persistent heat/scorch', () => {
    const kit = kitMock(), fx = new BreacherPresentation(kit as unknown as ElementKit);
    fx.event(event({ ability: 'railbreaker', slot: 'overdrive', phase: 'link', angle: 0, targetX: 964, targetY: 96 }), 64, 96);
    expect(kit.beam).not.toHaveBeenCalled();
    fx.event(event({ ability: 'railbreaker', slot: 'overdrive', radius: undefined, length: 900, width: 44, angle: 0 }), 64, 96);
    expect(kit.beam).toHaveBeenCalledTimes(3);
    const core = kit.beam.mock.calls[0];
    expect(core.slice(0, 6)).toEqual([2, .85, 3, 2 + 900 / 32, .85, 3]);
    expect(core[8]).toBeLessThan(.06);
    expect(kit.camera).toHaveBeenCalledWith(.48, 0);
    kit.draw.mockClear(); fx.update(frame([], 1));
    expect(kit.draw.mock.calls.some(c => c[0] === 'solid' && c[4] === 900 / 32 && c[5] === .012)).toBe(true);
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
