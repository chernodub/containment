import { describe, expect, it, vi } from 'vitest';
import { DepthGame } from '../src/DepthGame';
import type { DepthRenderer } from '../src/render/DepthRenderer';
import { createPlacementPreview, readPlacementPreview, setPlacementPreview, placementPointer } from '../src/ui/gameAdapter';
import type { MutationId } from '../src/game/roguelike/types';
import type { RigId } from '../src/game/abilities/contract';

function openGame(rig: RigId, mutations: MutationId[] = []) {
  const game = new DepthGame(); game.status = 'playing';
  game.geometry = { ...game.geometry, bounds: { x: 0, y: 0, width: 2000, height: 2000 }, boundary: undefined, voids: undefined, blockers: [], boundaryWalls: [] };
  game.player.x = game.player.y = 500; game.player.angle = .41;
  game.combat.setBuild({ mutations }); game.abilities.setRig(rig);
  return game;
}

describe('placement UI contract', () => {
  it('feature detects direct, scene and legacy APIs and rejects nonfinite states', () => {
    const state = createPlacementPreview(); state.x = 10; state.y = 20;
    expect(() => setPlacementPreview({} as DepthRenderer, state)).not.toThrow();
    const direct = vi.fn(), fallback = vi.fn();
    const renderer = { setPlacementPreview: direct, scene: { userData: { setPlacementPreview: fallback } } } as unknown as DepthRenderer;
    setPlacementPreview(renderer, state); expect(direct).toHaveBeenCalledWith(state); expect(fallback).not.toHaveBeenCalled();
    state.x = NaN; setPlacementPreview(renderer, state); expect(direct).toHaveBeenCalledOnce();
    setPlacementPreview(renderer, null); expect(direct).toHaveBeenLastCalledWith(null);
    state.x = 10; setPlacementPreview({ scene: renderer.scene } as DepthRenderer, state); expect(fallback).toHaveBeenCalledWith(state);
    const legacy = vi.fn(); setPlacementPreview({ setInvalidAbilityPlacement: legacy } as unknown as DepthRenderer, state);
    expect(legacy).toHaveBeenCalledWith('glacier', 10, 20);
  });

  it.each([
    ['cryo', [], 1], ['cryo', ['twin-glacier'], 2], ['arc', ['twin-pylon'], 2], ['pyro', ['napalm-triplet'], 3], ['breacher', [], 1],
  ] as const)('matches native %s deployment geometry and augment offsets', (rig, mutations, count) => {
    const game = openGame(rig, [...mutations]), out = createPlacementPreview();
    const aim = { x: 1000, y: 800 }; game.setAimPoint(aim);
    const before = JSON.stringify({ player: game.player, combat: game.combat.snapshot, abilities: game.abilities.snapshot });
    const points = out.points;
    expect(readPlacementPreview(game, aim, out)).toBe(true); expect(out.valid).toBe(true); expect(out.pointCount).toBe(count);
    expect(out.points).toBe(points);
    expect(JSON.stringify({ player: game.player, combat: game.combat.snapshot, abilities: game.abilities.snapshot })).toBe(before);
    expect(game.useAbility('power')).toBe(true); game.abilities.update(100); game.abilities.update(100);
    const placed = rig === 'pyro' ? game.abilities.snapshot.zones : game.abilities.snapshot.deployables;
    expect(placed).toHaveLength(count);
    for (let i = 0; i < count; i++) {
      expect(out.points[i].x).toBeCloseTo(placed[i].x); expect(out.points[i].y).toBeCloseTo(placed[i].y);
      if (rig === 'pyro') expect(out.points[i].radius).toBe(80);
    }
  });

  it('shows a native range-clamped footprint without inventing an out-of-range rejection', () => {
    const game = openGame('cryo'), out = createPlacementPreview(), aim = { x: 5000, y: 500 };
    game.setAimPoint(aim);
    expect(readPlacementPreview(game, aim, out)).toBe(true); expect(out.x).toBe(920); expect(out.y).toBe(500);
    expect(out.valid).toBe(true); expect(out.reason).toBeUndefined(); expect(game.useAbility('power')).toBe(true);
  });

  it('retains each augmented candidate validity when only one native wall fits', () => {
    const game = openGame('cryo', ['twin-glacier']), out = createPlacementPreview(), aim = { x: 650, y: 500 };
    game.player.angle = 0;
    game.geometry = { ...game.geometry, blockers: [{ x: 605, y: 560, width: 10, height: 30 }] };
    game.setAimPoint(aim); readPlacementPreview(game, aim, out);
    expect(out.pointCount).toBe(2); expect(out.valid).toBe(true);
    expect(out.points[0].valid).toBe(false); expect(out.points[1].valid).toBe(true);
    expect(game.useAbility('power')).toBe(true); game.abilities.update(100); game.abilities.update(100);
    expect(game.abilities.snapshot.deployables).toHaveLength(1);
    expect(game.abilities.snapshot.deployables[0].x).toBe(out.points[1].x);
  });

  it('distinguishes blocked machinery from unavailable ground and preserves blocked native acceptance', () => {
    const game = openGame('cryo'), out = createPlacementPreview(), aim = { x: 650, y: 500 };
    game.geometry = { ...game.geometry, blockers: [{ x: 630, y: 460, width: 40, height: 80 }] };
    game.setAimPoint(aim); readPlacementPreview(game, aim, out);
    expect(out.valid).toBe(false); expect(out.reason).toBe('Blocked by machinery'); expect(game.useAbility('power')).toBe(false);
    game.geometry = { ...game.geometry, blockers: [], bounds: { x: 0, y: 0, width: 600, height: 600 } };
    readPlacementPreview(game, aim, out); expect(out.reason).toBe('Need clear ground');
    game.status = 'paused'; expect(readPlacementPreview(game, aim, out)).toBe(false);
  });

  it('uses native target-aware torso picking with pooled target records and no aim mutation', () => {
    const game = openGame('arc'), pointer = vi.fn((_x: number, _y: number, _targets: unknown[]) => ({ x: 600, y: 500 }));
    const renderer = { pointer } as unknown as DepthRenderer;
    const before = game.player.angle;
    expect(placementPointer(renderer, game, 40, 50)).toEqual({ x: 600, y: 500 });
    expect(pointer).toHaveBeenCalledWith(40, 50, expect.any(Array));
    const storage = pointer.mock.calls[0][2];
    placementPointer(renderer, game, 45, 55); expect(pointer.mock.calls[1][2]).toBe(storage); expect(game.player.angle).toBe(before);
  });
});
