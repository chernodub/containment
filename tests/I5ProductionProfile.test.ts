import {describe, expect, it} from 'vitest';
import {createHash} from 'node:crypto';
import {DepthGame} from '../src/DepthGame';
import {I5_ENCOUNTER_TUNING_ENABLED} from '../src/game/roguelike/i5Tuning';
import {progressionFor} from '../src/game/roguelike/progression';
import {generateRun} from '../src/game/roguelike/run';
import {createEncounterPlan} from '../src/game/waves/EncounterDirector';

const SEEDS = [1729, 2718, 31415, 42, 137, 8675309, 2026, 9001, 65537, 123456];
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

// Generated independently from the frozen merged 76e744d source over all nodes of ten seeds.
// These legacy references remain unchanged by the active story encounter profile.
const BASELINE = {
  1: {
    plans: '466031180a772d622e938cdc9b67ebfa69ff9f514c2c737a8b31cf5b2bda75e3',
    progression: 'e8689d61b61f47162ce76a9616b646fb4a2e6a1e5983abc51a62e6c665a7e89c',
  },
  2: {
    plans: '9ff6846741322e3727c1c9a9a570ef7fc95e42a4f1056b9bdf355b357c91fe4c',
    progression: '964df3bee34f5ea638202dbc8fbb4bbd9c7c41d770dc2b92a0ec9f929466f0b9',
  },
} as const;

// A3 retains the V25 progression fingerprint. The late pool changes only the
// final 5% type draws from stalker to spitter; all 200 schedules retain other fields.
const STORY_PROFILE = {
  plans: '5e75648612329a47605d2b4c7c979b4e629aa08639d684fd67a4e01a999b0333',
  progression: '99d09e9484dd593c34320ded447f0b4ee8d6503368c8c838c432d6a38b56acf0',
} as const;

const EXPERIMENT_OPTIONS = [
  'chargeWindupMs', 'chargeCooldownMs', 'chargeInitialCooldownMs', 'championHealth', 'championDamage',
];

describe('I5 active story profile keeps legacy encounters and reviewed story numbers pinned', () => {
  it('activates the story profile and retains the approved half-rate charge arithmetic', () => {
    expect(I5_ENCOUNTER_TUNING_ENABLED).toBe(true);
    const game = new DepthGame();
    game.abilities.addCharge(600, 2);
    expect(game.abilities.snapshot.overdrive.charge).toBeCloseTo(.075);
  });

  it.each([1, 2] as const)('matches every merged legacy graph-v%i encounter and progression record across ten seeds', version => {
    const nodes = SEEDS.flatMap(seed => generateRun(seed, version).nodes.map(node => ({seed, node})));
    const plans = nodes.map(({seed, node}) => createEncounterPlan({seed, node, breachIds: ['north', 'south', 'east', 'west']}));
    const balances = nodes.map(({node}) => {
      const {guardianKind: _guardianKind, ...balance} = progressionFor(node);
      for (const option of EXPERIMENT_OPTIONS) expect(Object.hasOwn(balance, option)).toBe(false);
      return balance;
    });
    expect(digest(plans)).toBe(BASELINE[version].plans);
    expect(digest(balances)).toBe(BASELINE[version].progression);
  });

  it('pins every active story encounter and progression record across ten seeds', () => {
    const nodes = SEEDS.flatMap(seed => generateRun(seed).nodes.map(node => ({seed, node})));
    const plans = nodes.map(({seed, node}) => createEncounterPlan({seed, node, breachIds: ['north', 'south', 'east', 'west']}));
    const balances = nodes.map(({node}) => progressionFor(node));
    // L8 appends exactly two actual combatants in four measured fast rooms.
    // Preserve the historical all200-plan digest after removing only those tails.
    const originalPlans=plans.map((plan,index)=>{
      const appended=['transmission-chamber','diagnostic-gallery','safety-interlock-station','shielding-gate'].includes(nodes[index].node.templateId)?2:0;
      return {...plan,totalSpawns:plan.totalSpawns-appended,schedule:plan.schedule.slice(0,plan.totalSpawns-appended)};
    });
    expect(digest(originalPlans)).toBe(STORY_PROFILE.plans);
    expect(digest(balances)).toBe(STORY_PROFILE.progression);
    for (const {node} of nodes) {
      const balance = progressionFor(node);
      if (node.depth < 10) {
        for (const option of EXPERIMENT_OPTIONS) expect(Object.hasOwn(balance, option)).toBe(false);
      } else {
        expect(balance).toMatchObject({chargeWindupMs:1150, chargeCooldownMs:6500, chargeInitialCooldownMs:5000, championHealth:1, championDamage:1});
      }
    }
  });

  it('pins the active story guardian set and finite Transmission append at the original cadence', () => {
    for (const seed of SEEDS) {
      const nodes = generateRun(seed).nodes;
      expect(nodes.filter(node => progressionFor(node).guardian).map(node => node.depth)).toEqual([5, 8, 12, 15, 18]);
      expect(progressionFor(nodes[5]).guardianKind).toBe('warden');
      expect(progressionFor(nodes[15]).guardianKind).toBe('matron');
      const transmission = createEncounterPlan({seed, node: nodes[9], breachIds: ['north', 'south', 'east', 'west']});
      expect(transmission).toMatchObject({totalSpawns: 34, concurrentCap: 14});
      expect(transmission.schedule[0].atMs).toBe(650);
      expect(transmission.schedule.at(-1)!.atMs).toBe(25400);
      expect(transmission.schedule.every(request => !request.elite)).toBe(true);
    }
  });

  it.each([5, 8, 12, 15, 18])('enters production guardian room-index %i with the original champion stats', depth => {
    const game = new DepthGame();
    game.newRun(1729);
    const nodes = generateRun(1729).nodes, node = nodes[depth];
    game.expedition = {
      ...game.expedition,
      run: {...game.expedition.run, currentNodeId: node.id, completedNodeIds: nodes.slice(0, depth).map(entry => entry.id), phase: 'combat'},
      build: {mutations: [], rig: 'breacher'},
    };
    game['enterRoom']();
    for (let tick = 0; tick < 36; tick++) game.update(50);
    const matron = depth === 15;
    expect(game.enemies.snapshot.enemies.find(enemy => enemy.champion)).toMatchObject({
      type: matron ? 'carrier' : 'brute', champion: matron ? 'matron' : 'warden', elite: true,
      maxHealth: matron ? 1150 : 760, maxArmor: matron ? 0 : 120, contactDamage: matron ? 24 : 28,
      radius: matron ? 24 : 28, baseSpeed: matron ? 76 : 88,
    });
  });
});
