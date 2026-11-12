import * as T from 'three';
import { describe, expect, it, vi } from 'vitest';
import type { DepthGame } from '../../DepthGame';
import { AbilityPriorityMask, bindPriorityMask } from './PriorityMask';
import { ElementKit } from './ElementKit';

const camera = () => {
  const c = new T.PerspectiveCamera(45, 16 / 9, .1, 200);
  c.position.set(0, 15, 15); c.lookAt(0, 0, 0); c.updateMatrixWorld(); return c;
};
const game = () => ({ player: { x: -160, y: 0 }, enemies: { snapshot: { enemies: [] } }, bullets: [] }) as unknown as DepthGame;

describe('friendly priority mask', () => {
  it('retains one bounded texture and rasterizes marine silhouettes, hostile projectiles and optional renderer warnings', () => {
    const mask = new AbilityPriorityMask(), c = camera(), g = game();
    const pixels = mask.pixels, texture = mask.texture;
    mask.update(g, c); const marine = pixels.slice();
    const visit = vi.fn((stamp: (s: { shape: 'circle'; x: number; z: number; radius: number }) => void) => stamp({ shape: 'circle', x: 3, z: 0, radius: 2 }));
    mask.update(g, c, { forEachHostilePriority: visit });
    expect(visit).toHaveBeenCalledOnce();
    expect(pixels.some((v, i) => v > marine[i])).toBe(true);
    (g.bullets as unknown[]) .push({ kind: 'hazard', x: 0, y: 0, request: { angle: 0 } });
    mask.update(g, c); expect(pixels.some((v, i) => v > marine[i])).toBe(true);
    for (let i = 0; i < 60; i++) mask.update(g, c);
    expect(mask.pixels).toBe(pixels); expect(mask.texture).toBe(texture); expect(pixels.length).toBe(9216);
    mask.update(undefined, c); expect(pixels.every(v => v === 0)).toBe(true);
    const dispose = vi.spyOn(texture, 'dispose'); mask.dispose(); mask.dispose(); expect(dispose).toHaveBeenCalledOnce();
  });

  it('keeps sustained emitter particles masked from birth while preserving actual impact grace', () => {
    const k=new ElementKit(new T.Group());k.sustain();k.mote('smoke',0,1,0,0,0,0,.2,1,0x9bdcf0);
    k.impact();k.mote('smoke',1,1,0,0,0,0,.2,1,0x9bdcf0);k.begin(.02);k.end();
    const weights=k.batches.smoke.mesh.geometry.getAttribute('abilityPriority');
    expect([weights.getX(0),weights.getX(1)]).toEqual([1,0]);
    k.begin(.4);k.end();expect([weights.getX(0),weights.getX(1)]).toEqual([1,1]);
    k.clear();k.begin(0);k.end();expect(k.batches.smoke.mesh.count).toBe(0);k.dispose();
  });

  it('prepares shader sampling once and gives every streamed primitive a 250 ms impact exemption', () => {
    const k = new ElementKit(new T.Group()), mask = new AbilityPriorityMask();
    const m = k.batches.flame.mesh.material as T.ShaderMaterial;
    bindPriorityMask(m, mask.texture, 'abilityPriority'); const shader = m.fragmentShader;
    bindPriorityMask(m, mask.texture, 'abilityPriority'); expect(m.fragmentShader).toBe(shader);
    expect(m.vertexShader).toContain('priorityClip=gl_Position');
    expect(shader).toContain('texture2D(abilityPriorityMap,priorityUv)');
    k.begin(0);
    for (const age of [.03, .15, .25, .31, .4]) { k.sustain(age); k.draw('flame', 0, 1, 0, .2, .5, 1, 0xff7a2e); }
    k.impact(); k.draw('flame', 0, 1, 0, .2, .5, 1, 0xff7a2e); k.end();
    const weights = k.batches.flame.mesh.geometry.getAttribute('abilityPriority');
    expect(Array.from(weights.array).slice(0, 6)).toEqual([0, 0, 0, .5, 1, 0]);
    k.dispose(); mask.dispose();
  });
});

describe('hostile presentation accessor', () => {
  it('exposes the actual stable warning circles without changing warning construction', async () => {
    const { AttackEffects } = await import('../AttackEffects');
    const a = new AttackEffects(new T.Scene(), undefined);
    a.event({ type: 'enemy-warning', x: 64, y: 96, targetX: 160, targetY: 192, radius: 48, durationMs: 600 });
    const seen: { x: number; z: number; radius?: number }[] = [];
    a.forEachHostilePriority(s => seen.push({ ...s }));
    expect(seen).toEqual([{ shape: 'circle', x: 2, z: 3, radius: 1.5 }, { shape: 'circle', x: 5, z: 6, radius: .8 }]);
    a.clear(); const visit = vi.fn(); a.forEachHostilePriority(visit); expect(visit).not.toHaveBeenCalled(); a.dispose();
  });
});
