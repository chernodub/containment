import {describe, expect, it, vi} from 'vitest';
import {DepthGame, type GameEffect} from '../src/DepthGame';
import {CombatSystem} from '../src/game/combat/CombatSystem';
import {MutationRuntime, type MutationTarget} from '../src/game/roguelike/MutationRuntime';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
import {createExpeditionGeometry} from '../src/game/world/expeditionGeometry';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';

function arena() {
  const effects: GameEffect[] = [];
  const game = new DepthGame(e => effects.push(e));
  game.newRun(137, {rigSelect: true});
  game.chooseRig('breacher');
  game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
  game['director'].reset();
  game['pending'] = [];
  game.enemies.reset();
  const room = createExpeditionGeometry({...game.node, templateId: 'receiving'});
  game.geometry = {...room, blockers: room.boundaryWalls};
  game.navigation = new FacilityNavigation(game.geometry);
  Object.assign(game.player, {x: 400, y: 440, angle: 0, vx: 0, vy: 0});
  game.combat.setBuild({rig: 'breacher', mutations: ['chain-reaction']});
  vi.spyOn(game.enemies, 'update').mockReturnValue([]);
  return {game, effects};
}

function advance(runtime: {update(ms: number): unknown}, total: number, step: number) {
  for (let elapsed = 0; elapsed < total - 1e-8; elapsed += step) {
    runtime.update(Math.min(step, total - elapsed));
  }
}

type Target = {id: number; x: number; y: number; radius: number; health: number; resistant?: boolean};
function fixture(ghost = false) {
  const combat = new CombatSystem();
  combat.setBuild({mutations: ['chain-reaction']});
  const targets: Target[] = [{id: 1, x: 0, y: 0, radius: 14, health: 1000}];
  const hits: Array<{id: number; amount: number}> = [];
  const corpses: Array<{x: number; y: number}> = [];
  let wall = Infinity, visible = (_a: {x: number; y: number}, _b: {x: number; y: number}) => true;
  const move = (t: MutationTarget, dx: number, dy: number) => {
    const x = Math.min(wall, t.x + dx), y = t.y + dy;
    return {x, y, blocked: x !== t.x + dx};
  };
  const runtime = new MutationRuntime(combat, {
    targets: () => targets.filter(t => t.health > 0),
    damage: (id, amount) => {
      const target = targets.find(t => t.id === id)!;
      hits.push({id, amount});
      target.health -= amount;
      return {applied: true, died: target.health <= 0};
    },
    move: (id, dx, dy) => {
      const target = targets.find(t => t.id === id)!;
      const result = move(target, dx, dy);
      target.x = result.x; target.y = result.y;
      return result;
    },
    moveCorpse: (target, dx, dy) => {
      const result = move(target, dx, dy);
      corpses.push({x: result.x, y: result.y});
      return result;
    },
    setSlow: () => {},
    canAffect: (a, b) => visible(a, b),
  });
  const launch = () => {
    runtime.launchAbility(targets[0], 4800, 0);
    if (ghost) {
      const victim = {...targets[0]};
      targets[0].health = 0;
      runtime.kill(victim, 'direct');
    }
  };
  return {runtime, targets, hits, corpses, launch,
    wallAt: (x: number) => { wall = x; },
    visibility: (predicate: typeof visible) => { visible = predicate; }};
}

describe('launch body sweeps', () => {
  it.each([50, 16.67, 4.1675])('Railbreaker corpse gives the same Chain Reaction payoff at %sms steps', step => {
    const {game, effects} = arena();
    const a = game.enemies.spawn('brute', 600, 440);
    const b = game.enemies.spawn('crawler', 600, 500);
    if (!a.spawned || !b.spawned) throw new Error('Expected both enemies');
    game.damage(a.enemy.id, a.enemy.health + a.enemy.armor - 1);
    game.abilities.addCharge(12000);
    expect(game.useAbility('overdrive')).toBe(true);
    advance(game, 650, step);
    expect(game.stats.damageDealt.boon).toBe(24);
    expect(game.enemies.getSnapshot(b.enemy.id)!.health).toBe(b.enemy.health - 24);
    advance(game,125,step); // Receipt latency is bounded by the250ms presentation window.
    expect(game.stats.damageDealt.boon).toBe(24);
    const contacts = effects.filter(e => e.source === 'boon' && e.damage);
    expect(contacts.map(e => e.targetId)).toEqual([b.enemy.id]);
    expect(effects.some(e => e.type === 'sync-corpse' && e.id === a.enemy.id)).toBe(true);
  });

  for (const ghost of [false, true]) {
    it(`sweeps ${ghost ? 'corpse' : 'live'} launches through thin bodies in earliest contact order`, () => {
      const w = fixture(ghost);
      // Reverse ID/distance order so endpoint or ID-only ordering cannot pass.
      w.targets.push(
        {id: 2, x: 80, y: 0, radius: 3, health: 1000, resistant: true},
        {id: 9, x: 40, y: 0, radius: 3, health: 1000, resistant: true},
        {id: 5, x: 80, y: 0, radius: 3, health: 1000, resistant: true},
      );
      w.launch();
      w.runtime.update(25); // The launching body travels from 0 to 120 in one substep.
      expect(w.hits).toEqual([{id: 9, amount: 24}, {id: 2, amount: 24}, {id: 5, amount: 24}]);
      w.runtime.update(25);
      expect(w.hits).toHaveLength(3);
    });

    it(`only sweeps the resolved ${ghost ? 'corpse' : 'live'} segment before a blocking wall`, () => {
      const w = fixture(ghost);
      w.targets.push(
        {id: 2, x: 35, y: 0, radius: 3, health: 1000, resistant: true},
        {id: 3, x: 100, y: 0, radius: 3, health: 1000},
        {id: 4, x: 70, y: 0, radius: 3, health: 1000},
      );
      w.wallAt(60);
      w.visibility((a, b) => !((a.x <= 60 && b.x > 60) || (b.x <= 60 && a.x > 60)));
      w.launch();
      w.runtime.update(25);
      expect(w.hits).toEqual([{id: 2, amount: 24}]);
      w.runtime.update(100);
      expect(w.hits).toHaveLength(1);
      if (ghost) expect(w.corpses[0].x).toBe(60);
      else expect(w.targets[0].x).toBe(60);
    });
  }

  it('requires authored line of sight at the physical contact and does not hit across walls', () => {
    const w = fixture(true);
    w.targets.push(
      {id: 2, x: 50, y: 12, radius: 3, health: 1000},
      {id: 3, x: 80, y: 0, radius: 3, health: 1000},
    );
    w.visibility((a, b) => !(a.y < 6 && b.y >= 6));
    w.launch();
    w.runtime.update(25);
    expect(w.hits).toEqual([{id: 3, amount: 24}]);
  });

  it('accepts a swept grazing body contact and rejects a nearby outside body', () => {
    const w = fixture(true);
    w.targets.push(
      {id: 2, x: 60, y: 17, radius: 3, health: 1000, resistant: true},
      {id: 3, x: 60, y: 17.001, radius: 3, health: 1000, resistant: true},
    );
    w.launch();
    w.runtime.update(25);
    expect(w.hits).toEqual([{id: 2, amount: 24}]);
  });

  it('does not pay again for an overlapping body on later launch substeps', () => {
    const w = fixture(true);
    w.targets.push({id: 2, x: 60, y: 0, radius: 200, health: 1000, resistant: true});
    w.launch();
    advance(w.runtime, 500, 4.1675);
    expect(w.hits).toEqual([{id: 2, amount: 24}]);
  });

  it('clears launch contacts at reset and allows a new encounter to use the same target IDs', () => {
    const w = fixture();
    w.targets.push({id: 2, x: 60, y: 0, radius: 3, health: 1000});
    w.launch();
    w.runtime.reset();
    w.runtime.update(100);
    expect(w.hits).toEqual([]);
    w.launch();
    w.runtime.update(25);
    expect(w.hits).toEqual([{id: 2, amount: 24}]);
  });
});
