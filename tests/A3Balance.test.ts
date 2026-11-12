import {describe, expect, it} from 'vitest';
import {DepthGame} from '../src/DepthGame';
import {generateRun} from '../src/game/roguelike/run';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';

/** Real Overdrive requests preserve earned charge at the new encounter boundary. */
function encounter(depth: number, version: 2 | 3 = 3) {
  const game = new DepthGame();
  game.newRun(1729, {rigSelect: true});
  game.chooseRig('arc');
  game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
  const nodes = generateRun(1729, version).nodes;
  const node = nodes[depth];
  game.expedition = {
    ...game.expedition,
    run: {version, seed: 1729, currentNodeId: node.id,
      completedNodeIds: nodes.slice(0, depth).map(n => n.id), phase: 'combat'},
    build: {rig: 'arc', mutations: []},
  };
  game['enterRoom']();
  game.abilities.setRig('arc', 1);
  expect(game.useAbility('overdrive')).toBe(true);
  for (let ms = 0; ms < 6000; ms += 50) game.abilities.update(50);
  game.abilities.addCharge(12000);
  expect(game.abilities.snapshot.overdrive.charge).toBe(1);
  return game;
}

describe('A3 encounter-side Overdrive cadence', () => {
  it.each([0, 5, 8, 12, 15, 16, 18])('caps story room index %s at one activation, retaining the next room charge', depth => {
    const game = encounter(depth);
    expect(game.abilities.snapshot.overdrive).toMatchObject({ready: false, roomLimited: true, charge: 1});
    expect(game.useAbility('overdrive')).toBe(false);
    expect(game.abilities.snapshot.overdrive.charge).toBe(1);
    game.abilities.resetRoom();
    expect(game.abilities.snapshot.overdrive.ready).toBe(true);
    expect(game.useAbility('overdrive')).toBe(true);
  });

  it.each([9, 19])('retains repeated earned activations in story holdout index %s', depth => {
    const game = encounter(depth);
    expect(game.abilities.snapshot.overdrive.ready).toBe(true);
    expect(game.abilities.snapshot.overdrive.roomLimited).toBeUndefined();
    expect(game.useAbility('overdrive')).toBe(true);
  });

  it('preserves the legacy guardian allowance', () => {
    const game = encounter(7, 2);
    expect(game.abilities.snapshot.overdrive.ready).toBe(true);
    expect(game.useAbility('overdrive')).toBe(true);
  });
});
