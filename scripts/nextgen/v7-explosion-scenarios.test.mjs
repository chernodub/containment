import { afterEach, describe, expect, it } from 'vitest';
import { registerV7ExplosionScenarios, stageV7Explosion, V7_EXPLOSION_ORIGINS } from './v7-explosion-scenarios.mjs';

afterEach(() => { delete globalThis.window; });

function harness({ legal = true } = {}) {
  const effects = [], steps = [];
  const gl = { createProgram() {} };
  const g = { player: {}, geometry: { bounds: { x: 0, y: 0, width: 1024, height: 1024 } }, enemies: { reset() {} } };
  const r = { effect: e => effects.push(structuredClone(e)), renderer: { getContext: () => gl } };
  const d = { game: g, renderer: r, async gotoRoom() {}, invulnerable() {},
    canStand: (x, y, radius) => legal && x >= radius && y >= radius && x <= 1024 - radius && y <= 1024 - radius,
    clearShot: () => true, setInput() {}, step: ms => steps.push(ms), refresh() {} };
  globalThis.window = { __containmentDebug: d };
  return { d, g, r, gl, effects, steps };
}

describe('V7 explosion capture contracts', () => {
  it('adds five idempotent seven-phase payload inspections while retaining existing scenarios', () => {
    const old = { id: 'old', setup() {} }, scenarios = [old];
    registerV7ExplosionScenarios(scenarios); registerV7ExplosionScenarios(scenarios);
    expect(scenarios).toHaveLength(6); expect(scenarios[0]).toBe(old);
    expect(scenarios.slice(1).map(s => s.setupArgument.origin)).toEqual(['weapon', 'grenade', 'rocket', 'nest', 'queen']);
    for (const s of scenarios.slice(1)) {
      expect(s.burst).toBe(true); expect(s.setupArgument.samples).toEqual([0, 30, 90, 180, 340, 600, 1000]);
      expect(s.setup).toBe(stageV7Explosion);
    }
    expect(V7_EXPLOSION_ORIGINS.find(s => s.origin === 'nest').event).toEqual({ type: 'explosion', radius: 64 });
    expect(V7_EXPLOSION_ORIGINS.find(s => s.origin === 'queen').event).toEqual({ type: 'explosion', radius: 240 });
  });

  it('replays each honest payload at the same legal mark with a warning and compile guard', async () => {
    const marks = [];
    for (const entry of V7_EXPLOSION_ORIGINS) {
      const h = harness(), samples = [0, 30, 90, 180, 340, 600, 1000];
      await stageV7Explosion({ ...entry, room: 'containment-annulus', samples });
      const proof = h.d.g4DangerProof; marks.push(proof.mark);
      expect(proof.presentationOnly).toBe(true); expect(proof.nativeAction).toBe(false);
      expect(proof.source).toBe(entry.source); expect(proof.qualification).toContain('does not simulate');
      expect(h.effects).toHaveLength(2); expect(h.effects[0].type).toBe('enemy-warning');
      expect(h.effects[1]).toEqual({ ...entry.event, x: proof.mark.tx, y: proof.mark.ty });
      expect(Math.hypot(proof.mark.tx - h.g.player.x, proof.mark.ty - h.g.player.y)).toBeCloseTo(240);
      for (let i = 1; i < samples.length; i++) h.d.step(150);
      expect(h.steps).toEqual([3800, 30, 60, 90, 160, 260, 400]);
      expect(proof.sampleMs).toBe(1000); expect(h.d.shaderCompilations).toBe(0);
      expect(() => h.gl.createProgram()).toThrow('compiled a combat shader');
    }
    for (const mark of marks) expect(mark).toEqual(marks[0]);
  });

  it('rejects unavailable legal floor rather than bypassing room geometry', async () => {
    harness({ legal: false });
    await expect(stageV7Explosion({ ...V7_EXPLOSION_ORIGINS[0], room: 'containment-annulus', samples: [0, 30] }))
      .rejects.toThrow('No legal V7 shared explosion inspection mark');
  });
});
