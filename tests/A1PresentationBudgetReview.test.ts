import {describe, expect, it, vi} from 'vitest';
import {DepthGame, type GameEffect} from '../src/DepthGame';
import {PresentationBudget} from '../src/game/abilities/PresentationBudget';
import type {RigId} from '../src/game/abilities/contract';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
import {createExpeditionGeometry} from '../src/game/world/expeditionGeometry';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';

const receipt = (id: number, source: GameEffect['source'] = 'ability', damage = 4): GameEffect =>
  ({type: 'hit', source, damage, targetId: id, x: id, y: 0, lethal: false});
const ability = (phase: NonNullable<GameEffect['ability']>['phase']): GameEffect =>
  ({type: 'ability', x: 0, y: 0,
    ability: {ability: 'whiteout', slot: 'overdrive', rig: 'cryo', element: 'cryo', phase}});

describe('presentation receipt budget', () => {
  it('coalesces selected receipts per target/source, preserves lethal state, and does not mutate inputs', () => {
    const output: GameEffect[] = [], budget = new PresentationBudget(e => output.push(e));
    const first = receipt(1, 'status', 3);
    budget.push(first);
    budget.push(receipt(1, 'ability', 4));
    budget.push({...receipt(1, 'status', 5), lethal: true});
    expect(output.map(e => ({source: e.source, damage: e.damage, lethal: e.lethal}))).toEqual([
      {source: 'status', damage: 8, lethal: true},
      {source: 'ability', damage: 4, lethal: false},
    ]);
    expect(first).toMatchObject({damage: 3, lethal: false});
  });

  it('allows at most eight selected keys and two repeated status FX in each simulation window', () => {
    const output: GameEffect[] = [], budget = new PresentationBudget(e => output.push(e));
    for (let id = 0; id < 1000; id++) {
      budget.push(receipt(id));
      budget.push({type: 'boon', boon: id % 2 ? 'frost' : 'burn', x: id, y: 0});
    }
    expect(output).toHaveLength(2);
    budget.update(249);
    expect(output).toHaveLength(2);
    budget.update(1);
    expect(output.filter(e => e.damage)).toHaveLength(8);
    budget.push(receipt(1001));
    budget.update(250);
    expect(output.filter(e => e.damage)).toHaveLength(9);
  });

  it('does not refill a window after early lifecycle flushing or re-emit selected keys', () => {
    const output: GameEffect[] = [], budget = new PresentationBudget(e => output.push(e));
    for (let id = 0; id < 8; id++) budget.push(receipt(id));
    budget.push(ability('impact'));
    for (let id = 0; id < 20; id++) budget.push(receipt(id));
    budget.push(ability('end'));
    budget.update(250);
    expect(output.filter(e => e.damage)).toHaveLength(8);
    expect(output.filter(e => e.ability).map(e => e.ability!.phase)).toEqual(['impact', 'end']);
  });

  it('forwards weapon/native actions and every lifecycle event promptly after pending receipts', () => {
    const output: GameEffect[] = [], budget = new PresentationBudget(e => output.push(e));
    const weapon = receipt(1, 'weapon');
    budget.push(weapon);
    expect(output).toEqual([weapon]);
    budget.push(receipt(2, 'boon'));
    const lifecycle: GameEffect[] = [
      {type: 'corpse', id: 2, x: 0, y: 0}, {type: 'hurt', x: 0, y: 0},
      ability('end'), ability('denied'), ability('ready'), ability('burst'),
      {type: 'wall-slam', x: 0, y: 0}, {type: 'enemy-warning', x: 0, y: 0},
    ];
    for (const event of lifecycle) budget.push(event);
    expect(output).toEqual([weapon, receipt(2, 'boon'), ...lifecycle]);
  });

  it('resets pending feedback at room boundaries and ignores invalid or paused time', () => {
    const output: GameEffect[] = [], budget = new PresentationBudget(e => output.push(e));
    budget.push(receipt(1));
    for (const ms of [0, -1, NaN, Infinity]) budget.update(ms);
    expect(output).toEqual([]);
    budget.reset();
    budget.update(250);
    expect(output).toEqual([]);
    budget.push(receipt(2));
    budget.update(250);
    expect(output.map(e => e.targetId)).toEqual([2]);
  });

  it('preserves bounded area target IDs and aggregate damage while per-target receipts are saturated', () => {
    const output: GameEffect[] = [], budget = new PresentationBudget(e => output.push(e));
    for (let id = 0; id < 25; id++) budget.push(receipt(id));
    const tick = {...ability('tick'), ability: {...ability('tick').ability!,
      targetIds: Array.from({length: 25}, (_, id) => id), totalDamage: 100}};
    budget.push(tick);
    expect(output).toEqual([tick]);
    budget.update(250);
    expect(output.filter(e => e.damage)).toHaveLength(8);
    expect(tick.ability.targetIds).toHaveLength(25);
    expect(tick.ability.totalDamage).toBe(100);
  });

  it('replays identical effect sequences across different frame partitions of the same windows', () => {
    function replay(step: number) {
      const output: GameEffect[] = [], budget = new PresentationBudget(e => output.push(e));
      for (let window = 0; window < 20; window++) {
        for (let id = 0; id < 25; id++) {
          budget.push(receipt(id, 'status', window + 1));
          budget.push({type: 'boon', boon: 'frost', x: id, y: 0});
        }
        for (let ms = 0; ms < 250; ms += step) budget.update(Math.min(step, 250 - ms));
      }
      return output;
    }
    expect(replay(50)).toEqual(replay(25));
    expect(replay(50)).toEqual(replay(16.67));
    expect(replay(50)).toEqual(replay(4.1675));
  });
});

/** Keep actual health, armor, statuses, ability ticks and statistics; freeze AI scheduling only. */
function crowdedFight(rig: RigId, record = true) {
  const events: Array<{at: number; effect: GameEffect}> = [];
  let time = 0;
  const game = new DepthGame(effect => { if (record) events.push({at: time, effect}); });
  game.newRun(137, {rigSelect: true});
  game.chooseRig(rig);
  game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
  game['director'].reset(); game['pending'] = []; game.enemies.reset();
  const room = createExpeditionGeometry({...game.node, templateId: 'receiving'});
  game.geometry = {...room, blockers: room.boundaryWalls};
  game.navigation = new FacilityNavigation(game.geometry);
  Object.assign(game.player, {x: 400, y: 440, angle: 0, vx: 0, vy: 0});
  game.combat.setBuild({rig, mutations: rig === 'cryo' ? ['frostbite'] : []});
  vi.spyOn(game.enemies, 'update').mockReturnValue([]);
  for (let id = 0; id < 25; id++) {
    const spawn = game.enemies.spawn('brute', 450 + id % 5 * 10, 420 + Math.floor(id / 5) * 10);
    expect(spawn.spawned).toBe(true);
  }
  game.abilities.addCharge(12000);
  events.length = 0;
  expect(game.useAbility('overdrive')).toBe(true);
  for (time = 50; time <= 8000; time += 50) game.update(50);
  return {game, events};
}

describe('crowded Combat Rig presentation budget', () => {
  for (const rig of ['cryo', 'pyro'] as const) {
    it(`keeps the 25-target ${rig} Overdrive below 80 events per second without changing combat`, () => {
      const {game, events} = crowdedFight(rig);
      expect(game.enemies.activeCount).toBe(25);
      expect(game.stats.damageDealt.ability).toBeGreaterThan(0);
      expect(game.stats.damageDealt.status).toBeGreaterThan(0);
      expect(events.length / 8).toBeLessThan(80);
      let peakSecond = 0;
      for (let start = 0; start <= 7000; start += 50) {
        const count = events.filter(e => e.at >= start && e.at < start + 1000).length;
        peakSecond = Math.max(peakSecond, count);
      }
      expect(peakSecond).toBeLessThanOrEqual(80);
      const pulses = events.filter(e => e.effect.ability?.phase === 'tick' && e.effect.ability.targetIds);
      expect(pulses).toHaveLength(32);
      expect(pulses.every(e => e.effect.ability!.targetIds!.length === 25)).toBe(true);
      expect(pulses.reduce((damage, e) => damage + (e.effect.ability!.totalDamage ?? 0), 0))
        .toBe(game.stats.damageDealt.ability);
      expect(events.filter(e => e.effect.ability?.phase === 'end')).toHaveLength(1);
      expect(game.abilities.snapshot.zones).toEqual([]);
      const noop = crowdedFight(rig, false);
      expect(noop.game.stats).toEqual(game.stats);
      expect(noop.game.enemies.snapshot).toEqual(game.enemies.snapshot);
      expect(noop.game.abilities.snapshot).toEqual(game.abilities.snapshot);
    });
  }
});
