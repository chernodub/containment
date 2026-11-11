import {describe, expect, it} from 'vitest';
import {createHash} from 'node:crypto';
import {DepthGame} from '../src/DepthGame';
import {CombatSystem} from '../src/game/combat/CombatSystem';
import type {WeaponId} from '../src/game/combat/types';
import {EnemySystem, type EnemySystemOptions} from '../src/game/enemies/EnemySystem';
import {ENEMIES} from '../src/game/enemies/catalog';
import {parseCheckpoint, type StorageLike} from '../src/game/roguelike/checkpoints';
import {progressionFor} from '../src/game/roguelike/progression';
import {generateRun} from '../src/game/roguelike/run';
import type {RunNode, RunState} from '../src/game/roguelike/types';
import {createEncounterPlan} from '../src/game/waves/EncounterDirector';

const SEEDS = [1729, 2718, 31415, 42, 137, 8675309, 2026, 9001, 65537, 123456];

/** The shipped pre-I5 progression is a fixed comparison, not recomputed from new tuning. */
function oldProgression(node: RunNode) {
  const story = node.id.includes(':v3-');
  const modern = story || node.id.includes(':v2-');
  const depth = story ? node.depth * 11 / 19 : node.depth;
  const act = Math.min(2, Math.floor(depth / 4));
  return {
    act,
    health: modern ? 1 + depth * .045 + act * .10 : 1,
    damage: modern ? 1 + depth * .014 + act * .035 : 1,
    speed: modern ? Math.min(1.14, 1 + depth * .008 + act * .018) : 1,
    eliteHealth: modern ? 1.65 : 2,
    eliteDamage: modern ? 1.2 : 2,
    specials: modern,
    guardian: modern && (story ? node.depth === 5 || node.depth === 15 : node.depth === 3 || node.depth === 7),
  };
}

/** Center-mass starting-weapon trial: real spread, fire cadence, health and projectile contact. */
function crawlerTtk(balance: NonNullable<EnemySystemOptions['balance']>, weapon: WeaponId) {
  const combat = new CombatSystem();
  combat.switchWeapon(weapon);
  const enemies = new EnemySystem({balance});
  const spawn = enemies.spawn('crawler', 600, 440);
  if (!spawn.spawned) throw new Error('TTK crawler failed to spawn');
  const range = weapon === 'shotgun' ? 90 : 240;
  const step = 1000 / 60;
  for (let elapsed = 0; elapsed < 10_000; elapsed += step) {
    for (const shot of combat.fire(0)) {
      const radius = ENEMIES.crawler.radius + shot.radius;
      const perpendicular = Math.abs(Math.sin(shot.angle) * range);
      if (perpendicular > radius) continue;
      const entry = range * Math.cos(shot.angle) - Math.sqrt(radius * radius - perpendicular * perpendicular);
      const hit = enemies.applyDamage(spawn.enemy.id, shot.damage);
      if (hit.died) return elapsed + entry / shot.speed * 1000;
    }
    combat.update(step, true);
    combat.reloadIfEmpty();
  }
  throw new Error('Starting weapon could not kill a basic crawler');
}

function plan(seed: number, node: RunNode) {
  return createEncounterPlan({seed, node, breachIds: ['north', 'south', 'east', 'west']});
}

/** Budget points combine body/reservation pressure with real damage, speed and elite multipliers. */
function pressure(seed: number, nodes: readonly RunNode[]) {
  const plans = nodes.map(node => ({node, encounter: plan(seed, node), balance: progressionFor(node)}));
  const entries = plans.flatMap(({node, encounter, balance}) => encounter.schedule.map(spawn => ({spawn, node, balance})));
  const ordinaryPlans = plans.filter(({node}) => node.kind === 'combat' && ![9, 19].includes(node.depth));
  const ordinary = entries.filter(({node}) => node.kind === 'combat' && ![9, 19].includes(node.depth));
  const weights = {crawler: 1, brute: 2.5, spitter: 2, stalker: 2, carrier: 4};
  return {
    spawns: entries.length,
    specialistShare: entries.filter(({spawn}) => spawn.enemyId === 'spitter' || spawn.enemyId === 'stalker').length / entries.length,
    eliteShare: entries.filter(({spawn}) => spawn.elite).length / entries.length,
    ordinaryEliteShare: ordinary.filter(({spawn}) => spawn.elite).length / ordinary.length,
    ordinaryStalkerShare: ordinary.filter(({spawn}) => spawn.enemyId === 'stalker').length / ordinary.length,
    ordinaryCrawlerShare: ordinary.filter(({spawn}) => spawn.enemyId === 'crawler').length / ordinary.length,
    meanCap: plans.reduce((sum, {encounter}) => sum + encounter.concurrentCap, 0) / plans.length,
    ordinaryLastSpawnMs: ordinaryPlans.reduce((sum, {encounter}) => sum + encounter.schedule.at(-1)!.atMs, 0) / ordinaryPlans.length,
    damageRatio: plans.reduce((sum, {node, balance}) => sum + balance.damage / oldProgression(node).damage, 0) / plans.length,
    speedRatio: plans.reduce((sum, {node, balance}) => sum + balance.speed / oldProgression(node).speed, 0) / plans.length,
    budget: entries.reduce((sum, {spawn, balance}) => sum + weights[spawn.enemyId] * balance.damage * balance.speed * (spawn.elite ? balance.eliteHealth * balance.eliteDamage : 1), 0),
  };
}

function within(value: number, range: readonly [number, number], label: string) {
  expect(value, label).toBeGreaterThanOrEqual(range[0]);
  expect(value, label).toBeLessThanOrEqual(range[1]);
}

function oldBoundary(version: 1 | 2 | 3, depth: number, includeRig = false) {
  const seed = 1729;
  const graph = generateRun(seed, version);
  const path = [graph.nodes.find(node => node.id === graph.startId)!];
  while (path.at(-1)!.depth < depth) path.push(graph.nodes.find(node => node.id === path.at(-1)!.next[0])!);
  const node = path.at(-1)!;
  const run: RunState = {version, seed, currentNodeId: node.id, completedNodeIds: path.map(entry => entry.id), phase: 'route'};
  // Deliberately omit stats, draftRoll and all other later optional data from these historical saves.
  const resources = new DepthGame().combat.getRunResources();
  const serialized = JSON.stringify({
    version: 1, savedAt: 0, run, build: includeRig ? {mutations: [], rig: 'arc'} : {mutations: []}, resources,
    ...(includeRig ? {abilities: {overdriveCharge: .625}} : {}),
  });
  return {serialized, node, resources};
}

describe('I5 encounter balance guardrails', () => {
  it.each(['shotgun', 'rifle'] as const)('keeps starting %s crawler TTK within 15% of shipped tuning in every story room', weapon => {
    for (const node of generateRun(1729).nodes) {
      const before = oldProgression(node);
      const after = progressionFor(node);
      const previousMs = crawlerTtk(before, weapon);
      const nextMs = crawlerTtk(after, weapon);
      expect(nextMs, `room ${node.depth + 1} ${weapon} TTK`).toBeLessThanOrEqual(previousMs * 1.15 + 1e-7);
      expect(after.health, `room ${node.depth + 1} basic health`).toBeLessThanOrEqual(before.health * 1.15);
    }
  });

  it('keeps legacy v1/v2 progression and encounter tempo stable', () => {
    for (const version of [1, 2] as const) {
      for (const seed of SEEDS) {
        for (const node of generateRun(seed, version).nodes) {
          expect(progressionFor(node)).toMatchObject(oldProgression(node));
          const encounter = plan(seed, node);
          const combat = ['combat', 'elite'].includes(node.kind);
          const oldCount = combat ? Math.round((12 + node.depth * 3 + (node.kind === 'elite' ? 5 : 0)) * (version === 2 ? 1.25 : 1)) : 0;
          expect(encounter.totalSpawns).toBe(oldCount);
          const interval = Math.max(430, 1050 - node.depth * 48 - (node.kind === 'elite' ? 120 : 0));
          encounter.schedule.forEach((spawn, index) => expect(spawn.atMs).toBe(650 + index * interval + Math.floor(index / 8) * 1800));
        }
      }
    }
  });

  it('preserves the exact shipped opening plans and progression across ten campaign seeds', () => {
    const openingPlans = SEEDS.flatMap(seed => generateRun(seed).nodes.slice(0, 5).map(node => {
      const {guardianKind: _guardianKind, ...balance} = progressionFor(node);
      expect(balance).toEqual(oldProgression(node));
      return plan(seed, node);
    }));
    // Generated independently from the frozen 76e744d director, before I5 tuning.
    const digest = createHash('sha256').update(JSON.stringify(openingPlans)).digest('hex');
    expect(digest).toBe('9418031045c72ac412c79f233f500060c3ceec156eca98b2180c6c96111ae326');
  });

  it('holds per-act threat, specialist, elite and tempo budgets over the ten-seed campaign cohort', () => {
    const acts = [0, 1, 2, 3].map(act => {
      const samples = SEEDS.map(seed => pressure(seed, generateRun(seed).nodes.slice(act * 5, act * 5 + 5)));
      const mean = (key: keyof typeof samples[number]) => samples.reduce((sum, sample) => sum + sample[key], 0) / samples.length;
      return {
        spawns: mean('spawns'), specialistShare: mean('specialistShare'), eliteShare: mean('eliteShare'),
        ordinaryEliteShare: mean('ordinaryEliteShare'), ordinaryStalkerShare: mean('ordinaryStalkerShare'),
        ordinaryCrawlerShare: mean('ordinaryCrawlerShare'), meanCap: mean('meanCap'),
        ordinaryLastSpawnMs: mean('ordinaryLastSpawnMs'), damageRatio: mean('damageRatio'),
        speedRatio: mean('speedRatio'), budget: mean('budget'),
      };
    });
    // These envelopes allow small seeded mix changes while rejecting the original weak late acts
    // and threat-v1's excessive pursuit/damage. They are not campaign win-rate substitutes.
    const budgets = [
      {
        spawns: [65, 69], threat: [105, 130], elite: [0, 0], ordinaryElite: [0, 0],
        specialist: [.23, .28], cap: [8, 8.5], tail: [2500, 3100], damage: [1, 1], speed: [1, 1],
      },
      {
        spawns: [100, 108], threat: [235, 285], elite: [.06, .11], ordinaryElite: [.07, .12],
        specialist: [.44, .54], cap: [13, 14], tail: [2500, 3400], damage: [1.03, 1.05], speed: [1.005, 1.015],
      },
      {
        spawns: [98, 106], threat: [305, 365], elite: [.12, .19], ordinaryElite: [.12, .19],
        specialist: [.44, .54], cap: [17.5, 19], tail: [2900, 3800], damage: [1.14, 1.16], speed: [1.03, 1.045],
      },
      {
        spawns: [142, 154], threat: [520, 630], elite: [.10, .17], ordinaryElite: [.15, .22],
        specialist: [.44, .54], cap: [19.5, 20], tail: [3000, 3900], damage: [1.23, 1.25], speed: [1.055, 1.07],
      },
    ] as const;
    acts.forEach((act, index) => {
      const expected = budgets[index], label = `act ${index + 1}`;
      within(act.spawns, expected.spawns, `${label} spawn budget`);
      within(act.budget, expected.threat, `${label} weighted threat budget`);
      within(act.eliteShare, expected.elite, `${label} elite frequency`);
      within(act.ordinaryEliteShare, expected.ordinaryElite, `${label} ordinary elite frequency`);
      within(act.specialistShare, expected.specialist, `${label} ranged/flanking frequency`);
      within(act.meanCap, expected.cap, `${label} concurrency`);
      within(act.ordinaryLastSpawnMs, expected.tail, `${label} ordinary schedule tail`);
      within(act.damageRatio, expected.damage, `${label} damage increase`);
      within(act.speedRatio, expected.speed, `${label} pursuit increase`);
      if (index >= 2) {
        within(act.ordinaryStalkerShare, [.20, .29], `${label} stalker mix`);
        within(act.ordinaryCrawlerShare, [.20, .31], `${label} crawler mix`);
      }
    });
    for (const seed of SEEDS) {
      for (const node of generateRun(seed).nodes) {
        expect(plan(seed, node).concurrentCap).toBeLessThanOrEqual(20);
        expect(progressionFor(node).health).toBe(oldProgression(node).health);
        expect(progressionFor(node).eliteHealth).toBe(node.depth < 5 ? 1.65 : 1.25);
      }
    }
  });

  it('reserves the correct elite champion as the first request in all authored guardian rooms', () => {
    for (const seed of SEEDS) {
      const nodes = generateRun(seed).nodes;
      expect(nodes.filter(node => progressionFor(node).guardian).map(node => node.depth + 1)).toEqual([6, 9, 13, 16, 19]);
      for (const node of nodes.filter(node => progressionFor(node).guardian)) {
        const kind = node.depth === 15 ? 'matron' : 'warden';
        expect(progressionFor(node).guardianKind).toBe(kind);
        expect(plan(seed, node).schedule[0]).toMatchObject({elite: true, enemyId: kind === 'matron' ? 'carrier' : 'brute'});
      }
    }
  });

  it.each([5, 8, 12, 15, 18])('spawns room-index %i champion with its real type, elite presentation and control resistance', depth => {
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
    const champion = game.enemies.snapshot.enemies.find(enemy => enemy.champion);
    expect(champion).toMatchObject({
      type: matron ? 'carrier' : 'brute', champion: matron ? 'matron' : 'warden', elite: true,
      radius: matron ? 24 : 28, maxHealth: matron ? 1150 : 760, maxArmor: matron ? 0 : 120,
    });
    expect(game.targets().find(target => target.id === champion?.id)?.resistant).toBe(true);
  });

  it.each([1, 2, 3] as const)('loads historical graph-v%i checkpoints and enters a playable next room under current balance', version => {
    for (const depth of version === 3 ? [4, 9, 14, 18] : version === 1 ? [1] : [0]) {
      for (const includeRig of [false, true]) {
        const {serialized, node, resources} = oldBoundary(version, depth, includeRig);
        expect(parseCheckpoint(serialized)).not.toBeNull();
        const storage: StorageLike = {getItem: () => serialized, setItem() {}, removeItem() {}};
        const game = new DepthGame(() => {}, storage);
        expect(game.canContinue).toBe(true);
        expect(game.continueRun()).toBe(true);
        expect(game.expedition.run.phase).toBe('route');
        expect(game.combat.getRunResources()).toEqual(resources);
        expect(game.abilities.snapshot.rig).toBe(includeRig ? 'arc' : 'breacher');
        expect(game.abilities.snapshot.overdrive.charge).toBe(includeRig ? .625 : 0);
        if (node.templateId === 'manual-control-chamber') expect(game.authorizeDestruction()).toBe(true);
        else game.route(node.next[0]);
        expect(game.status).toBe('playing');
        expect(game.node.depth).toBe(depth + 1);
        const elapsed = game.elapsed;
        for (let tick = 0; tick < 120; tick++) game.update(1000 / 60);
        expect(game.status).toBe('playing');
        expect(game.elapsed).toBeCloseTo(elapsed + 2);
        expect(game.encounterRemaining).toBeGreaterThan(0);
        expect(game.enemies.snapshot.enemies.length).toBeGreaterThan(0);
        expect(game.abilities.snapshot.overdrive.charge).toBe(includeRig ? .625 : 0);
      }
    }
  });
});
