import {beforeAll, expect, it} from 'vitest';
import * as T from 'three';
import {loadModels} from '../../../tests/loadModels';
import {alien, disposeModel} from '../models';
import {ACTOR_OFFSET_LIMIT, HEAVY_HOLD_SECONDS} from './EnemyMotion';

beforeAll(loadModels);
const families = ['crawler', 'spitter', 'brute', 'stalker', 'carrier', 'queen'];

it('keeps all living roots exact and directional offsets bounded through impact, warning and recovery', () => {
  for (const family of families) {
    const model = alien(family, true);
    model.root.position.set(3, 0, 5);
    const state = model.root.userData.motion;
    const restBodyY = model.body.position.y;
    try {
      for (let i = 0; i < 240; i++) {
        if (i % 30 === 0) model.hit!(1, i / 30 * Math.PI / 4, true);
        model.setThreat!(i < 60 ? 1000 - i * 16 : 0, i < 60 ? 'spit' : null);
        model.animate(i / 60, 1, .7);
        expect(model.root.position.toArray()).toEqual([3, 0, 5]);
        expect(Math.hypot(state.offsetX, state.offsetZ)).toBeLessThanOrEqual(ACTOR_OFFSET_LIMIT + 1e-10);
        // Includes emergence plus impact, including legacy Queen's larger rise.
        expect(restBodyY - model.body.position.y).toBeGreaterThanOrEqual(0);
        expect(restBodyY - model.body.position.y).toBeLessThanOrEqual(.19 + 1e-10);
        expect(state.holdMs).toBeLessThanOrEqual(HEAVY_HOLD_SECONDS * 1000);
        expect(model.body.scale.y).toBeGreaterThanOrEqual(.89);
        expect(model.body.quaternion.toArray().every(Number.isFinite)).toBe(true);
      }
    } finally { disposeModel(model.root); }
  }
});

it('has an unmistakable held native warning through its last millisecond without replay-clock drift', () => {
  for (const family of ['brute', 'spitter']) {
    const model = alien(family);
    const state = model.root.userData.motion;
    try {
      model.animate(0, 0, 0);
      for (const [i, remaining] of [850, 600, 300, 1].entries()) {
        model.setThreat!(remaining, family === 'brute' ? 'charge' : 'spit');
        model.animate((i + 1) / 60, 0, 0);
        expect(state.anticipation).toBeCloseTo(1 - remaining / 850, 10);
        expect(Math.abs(model.body.rotation.x)).toBeGreaterThan(.09);
        const q = model.body.quaternion.clone();
        model.animate((i + 1) / 60, 0, 0);
        expect(model.body.quaternion.angleTo(q)).toBeLessThan(1e-7);
      }
      model.setThreat!(0, null); model.attack!(); model.animate(.1, 0, 0);
      expect(state.anticipation).toBe(0);
    } finally { disposeModel(model.root); }
  }
});

it('prevents heavy holds from stacking and clears secondary impulses for reduced motion while paused', () => {
  const model = alien('crawler'), state = model.root.userData.motion;
  try {
    model.animate(0, 1, 0);
    for (let i = 0; i < 8; i++) { model.hit!(1, 0, true); model.animate((i + 1) / 60, 1, 0); }
    expect(state.holdMs).toBe(0);
    model.setMotionOptions!(0, true); model.animate(8 / 60, 0, 0);
    expect(state.holdMs).toBe(0); expect(Math.hypot(state.offsetX, state.offsetZ)).toBe(0);
    model.setThreat!(400, 'spit'); model.animate(9 / 60, 0, 0);
    expect(Math.abs(model.body.rotation.x)).toBe(0); expect(Math.abs(model.body.rotation.z)).toBe(0);
  } finally { disposeModel(model.root); }
});

it('seeds source clips by native actor id and reuses all geometry/materials through status and pool reset', () => {
  const a = alien('crawler'), b = alien('crawler');
  const resources = (m: typeof a) => { const out: unknown[] = []; m.root.traverse(o => {if (o instanceof T.Mesh) out.push(o.geometry, o.material);}); return out; };
  const before = resources(a);
  try {
    a.setMotionSeed!(12); b.setMotionSeed!(13);
    for (let i = 0; i < 20; i++) { a.animate(i / 60, 1, 0); b.animate(i / 60, 1, 0); }
    expect(a.root.getObjectByName('leg0_lower')!.quaternion.angleTo(b.root.getObjectByName('leg0_lower')!.quaternion)).toBeGreaterThan(.01);
    a.setAffliction!({chilled: true, frozen: true, burning: false}); a.animate(.5, 0, 0);
    const q = a.root.getObjectByName('leg0_lower')!.quaternion.clone(); a.animate(.6, 1, 0);
    expect(a.root.getObjectByName('leg0_lower')!.quaternion.toArray()).toEqual(q.toArray());
    a.reset!(); expect(resources(a)).toEqual(before);
  } finally { disposeModel(a.root); disposeModel(b.root); }
});
