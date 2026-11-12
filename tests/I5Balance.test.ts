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
import {createEncounterPlan, EncounterDirector} from '../src/game/waves/EncounterDirector';

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
  // Strict ordinary-room classification stays distinct from the broader A3 non-holdout Overdrive cap.
  const ordinaryRoom = ({node, balance}: {node: RunNode; balance: ReturnType<typeof progressionFor>}) =>
    node.id.includes(':v3-') && node.kind === 'combat' && !balance.guardian && ![9, 19].includes(node.depth);
  const ordinaryPlans = plans.filter(ordinaryRoom);
  const ordinary = entries.filter(ordinaryRoom);
  const nonHoldoutPlans = plans.filter(({node}) => ![9, 19].includes(node.depth));
  const weights = {crawler: 1, brute: 2.5, spitter: 2, stalker: 2, carrier: 4};
  let effectiveHealth = 0, contactDps = 0, reservationBodies = 0;
  for (const {encounter, balance} of plans) {
    const enemies = new EnemySystem({balance});
    encounter.schedule.forEach((request, index) => {
      const result = enemies.spawn(request.enemyId, 600, 440, request.elite);
      if (!result.spawned) throw new Error('Physical budget target failed to spawn');
      if (index === 0 && balance.guardianKind) enemies.promote(result.enemy.id, balance.guardianKind);
      const target = enemies.getSnapshot(result.enemy.id)!;
      effectiveHealth += target.maxHealth + target.maxArmor;
      contactDps += target.contactDamage * 1000 / ENEMIES[target.type].attackCooldownMs;
      reservationBodies += 1 + enemies.reservedCount;
      enemies.reset();
    });
  }
  return {
    effectiveHealth, contactDps, reservationBodies,
    spawns: entries.length,
    specialistShare: entries.filter(({spawn}) => spawn.enemyId === 'spitter' || spawn.enemyId === 'stalker').length / entries.length,
    eliteShare: entries.filter(({spawn}) => spawn.elite).length / entries.length,
    ordinaryEliteShare: ordinary.filter(({spawn}) => spawn.elite).length / ordinary.length,
    ordinaryStalkerShare: ordinary.filter(({spawn}) => spawn.enemyId === 'stalker').length / ordinary.length,
    ordinaryCrawlerShare: ordinary.filter(({spawn}) => spawn.enemyId === 'crawler').length / ordinary.length,
    ordinarySpitterShare: ordinary.filter(({spawn}) => spawn.enemyId === 'spitter').length / ordinary.length,
    ordinaryBruteShare: ordinary.filter(({spawn}) => spawn.enemyId === 'brute').length / ordinary.length,
    meanCap: plans.reduce((sum, {encounter}) => sum + encounter.concurrentCap, 0) / plans.length,
    ordinaryLastSpawnMs: ordinaryPlans.reduce((sum, {encounter}) => sum + encounter.schedule.at(-1)!.atMs, 0) / ordinaryPlans.length,
    nonHoldoutLastSpawnMs: nonHoldoutPlans.reduce((sum, {encounter}) => sum + encounter.schedule.at(-1)!.atMs, 0) / nonHoldoutPlans.length,
    damageRatio: plans.reduce((sum, {node, balance}) => sum + balance.damage / oldProgression(node).damage, 0) / plans.length,
    speedRatio: plans.reduce((sum, {node, balance}) => sum + balance.speed / oldProgression(node).speed, 0) / plans.length,
    budget: entries.reduce((sum, {spawn, balance}) => sum + weights[spawn.enemyId] * balance.damage * balance.speed * (spawn.elite ? balance.eliteHealth * balance.eliteDamage : 1), 0),
  };
}

function pressureByAct() {
  return [0, 1, 2, 3].map(act => {
    const samples = SEEDS.map(seed => pressure(seed, generateRun(seed).nodes.slice(act * 5, act * 5 + 5)));
    return Object.fromEntries((Object.keys(samples[0]) as Array<keyof typeof samples[number]>)
      .map(key => [key, samples.reduce((sum, sample) => sum + sample[key], 0) / samples.length])) as ReturnType<typeof pressure>;
  });
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
  it('keeps the approved half-rate charge contribution and Dynamo multiplier in all three graphs', () => {
    for (const version of [1, 2, 3] as const) {
      for (const dynamo of [false, true]) {
        const game = new DepthGame();
        game.newRun(1729, {version});
        game.combat.setBuild({mutations: dynamo ? ['drive-dynamo'] : [], rig: 'breacher'});
        game.abilities.addCharge(600, 2);
        expect(game.abilities.snapshot.overdrive.charge).toBeCloseTo(dynamo ? .0975 : .075);
      }
    }
  });

  it.each(['shotgun', 'rifle'] as const)('keeps starting %s crawler TTK within 15% of shipped tuning in every story room', weapon => {
    const observed: number[][] = [[], [], [], []];
    for (const node of generateRun(1729).nodes) {
      const before = oldProgression(node);
      const after = progressionFor(node);
      const previousMs = crawlerTtk(before, weapon);
      const nextMs = crawlerTtk(after, weapon);
      expect(nextMs, `room ${node.depth + 1} ${weapon} TTK`).toBeLessThanOrEqual(previousMs * 1.15 + 1e-7);
      expect(after.health, `room ${node.depth + 1} basic health`).toBeLessThanOrEqual(before.health * 1.15);
      observed[Math.floor(node.depth / 5)].push(nextMs);
    }
    // Independent physical probe of the immutable V25 bundle; unchanged basic HP/weapons.
    const expected = weapon === 'shotgun'
      ? [[94.813, 94.813], [94.813, 95.397], [95.397, 95.397], [96.619, 96.619]]
      : [[444.901, 444.901], [444.901, 561.430], [561.430, 678.561], [678.561, 678.561]];
    observed.forEach((times, act) => {
      within(Math.min(...times), [expected[act][0] - 1, expected[act][0] + 1], `act ${act + 1} ${weapon} minimum TTK ms`);
      within(Math.max(...times), [expected[act][1] - 1, expected[act][1] + 1], `act ${act + 1} ${weapon} maximum TTK ms`);
    });
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

  it('preserves exact introductory plans and opening progression while adding only two authorized bodies from room three', () => {
    const openingPlans = SEEDS.flatMap(seed => generateRun(seed).nodes.slice(0, 5).map(node => {
      const {guardianKind: _guardianKind, ...balance} = progressionFor(node);
      expect(balance).toEqual(oldProgression(node));
      const encounter = plan(seed, node);
      expect(encounter.totalSpawns).toBe([12, 13, 15, 16, 17][node.depth]);
      expect(encounter.schedule.every(request => !request.elite)).toBe(true);
      return encounter;
    }));
    const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
    // Both references were generated independently from the frozen 76e744d director.
    expect(digest(openingPlans.filter((_, index) => index % 5 < 2)))
      .toBe('3a427085626c84494dddbe30f1a85dbc30ed2363e6ae61955d5e6c869aa9c5d2');
    // Preserve the old exact five-room plan prefix, normalizing only the approved +2 requests.
    const originalPrefixes = openingPlans.map((encounter, index) => {
      const extra = index % 5 >= 2 ? 2 : 0;
      return {...encounter, totalSpawns: encounter.totalSpawns - extra, schedule: encounter.schedule.slice(0, encounter.totalSpawns - extra)};
    });
    expect(digest(originalPrefixes)).toBe('9418031045c72ac412c79f233f500060c3ceec156eca98b2180c6c96111ae326');
  });

  it('holds per-act threat, specialist, elite and tempo budgets over the ten-seed campaign cohort', () => {
    const acts = pressureByAct();
    console.info(`[A3 encounter budgets] ${JSON.stringify(acts)}`);
    // EHP/contact budgets cover scheduled parents with actual armor and champion promotion.
    // Child reservations are counted separately; runtime Matron broods are not assumed.
    // Contact DPS assumes every attack connects: it is a threat diagnostic, not expected damage.
    // Weighted points and these envelopes do not substitute for campaign win-rate evidence.
    // V24/V25 shared encounter profile, independently measured from the immutable V25 bundle.
    // Physical envelopes retain ~5% tolerance; counts and late body reservations stay exact.
    // These pins do not assert that the pending campaign/native acceptance targets pass.
    const budgets = [
      {
        spawns: [73, 73], threat: [120, 133], elite: [0, 0], ordinaryElite: [0, 0],
        specialist: [.23, .28], cap: [8, 8.5], tail: [2850, 3000], broadTail: [2850, 3000], damage: [1, 1], speed: [1, 1],
        ehp: [11000, 12200], contactDps: [1330, 1480], bodies: [80, 86],
      },
      {
        spawns: [108, 108], threat: [246, 272], elite: [.10, .15], ordinaryElite: [.115, .165],
        specialist: [.44, .52], cap: [13, 14], tail: [3150, 3350], broadTail: [3200, 3400], damage: [1.015, 1.035], speed: [1.003, 1.012],
        ehp: [16950, 18750], contactDps: [1850, 2050], bodies: [153, 164],
      },
      {
        spawns: [142, 142], threat: [279, 309], elite: [.60, .67], ordinaryElite: [.60, .66],
        specialist: [.55, .61], cap: [15, 15], tail: [4200, 4550], broadTail: [4200, 4550], damage: [.780, .800], speed: [1.02, 1.035],
        ehp: [26150, 28950], contactDps: [2160, 2395], bodies: [142, 142],
      },
      {
        spawns: [180, 180], threat: [467, 518], elite: [.65, .72], ordinaryElite: [.67, .73],
        specialist: [.56, .62], cap: [15, 15], tail: [4250, 4650], broadTail: [4400, 4750], damage: [.887, .910], speed: [1.035, 1.055],
        ehp: [37150, 41150], contactDps: [3320, 3675], bodies: [183, 183],
      },
    ] as const;
    acts.forEach((act, index) => {
      const expected = budgets[index], label = `act ${index + 1}`;
      within(act.spawns, expected.spawns, `${label} spawn budget`);
      within(act.effectiveHealth, expected.ehp, `${label} scheduled-parent health plus armor budget`);
      within(act.contactDps, expected.contactDps, `${label} unmitigated contact DPS potential`);
      within(act.reservationBodies, expected.bodies, `${label} planned bodies including child reservations`);
      within(act.budget, expected.threat, `${label} weighted threat budget`);
      within(act.eliteShare, expected.elite, `${label} elite frequency`);
      within(act.ordinaryEliteShare, expected.ordinaryElite, `${label} ordinary elite frequency`);
      within(act.specialistShare, expected.specialist, `${label} ranged/flanking frequency`);
      within(act.meanCap, expected.cap, `${label} concurrency`);
      within(act.ordinaryLastSpawnMs, expected.tail, `${label} ordinary schedule tail`);
      within(act.nonHoldoutLastSpawnMs, expected.broadTail, `${label} broad non-holdout schedule tail`);
      within(act.damageRatio, expected.damage, `${label} damage increase`);
      within(act.speedRatio, expected.speed, `${label} pursuit increase`);
      if (index >= 2) {
        within(act.ordinaryStalkerShare, [.08, .15], `${label} stalker mix`);
        within(act.ordinaryCrawlerShare, [.28, .36], `${label} crawler mix`);
        within(act.ordinarySpitterShare, [.41, .50], `${label} spitter mix`);
        within(act.ordinaryBruteShare, [.05, .15], `${label} brute mix`);
      }
    });
    for (const seed of SEEDS) {
      for (const node of generateRun(seed).nodes) {
        expect(plan(seed, node).concurrentCap).toBeLessThanOrEqual(20);
        expect(progressionFor(node).health).toBe(oldProgression(node).health);
        expect(progressionFor(node).eliteHealth).toBe(node.depth < 5 ? 1.65 : 1.08);
        expect(progressionFor(node).eliteDamage).toBe(node.depth >= 5 && node.depth < 10 ? 1.05 : 1.2);
      }
    }
  });

  it('keeps late ordinary waves brood-free except the authored Matron, including the finale', () => {
    for (const seed of SEEDS) {
      for (const node of generateRun(seed).nodes.filter(node => node.depth >= 10)) {
        const encounter = plan(seed, node);
        expect(encounter.concurrentCap).toBe(15);
        encounter.schedule.forEach((request, index) => {
          if (node.depth === 15 && index === 0) {
            expect(request).toMatchObject({enemyId: 'carrier', elite: true});
          } else {
            expect(['crawler', 'brute', 'spitter', 'stalker']).toContain(request.enemyId);
          }
        });
      }
    }
  });

  it.each([{depth: 12, requests: 28}, {depth: 18, requests: 33}])('keeps room-index $depth as a mixed wave with its Warden first', ({depth, requests}) => {
    for (const seed of SEEDS) {
      const encounter = plan(seed, generateRun(seed).nodes[depth]);
      expect(encounter.totalSpawns).toBe(requests);
      expect(encounter.schedule[0]).toMatchObject({enemyId: 'brute', elite: true});
      expect(encounter.schedule.slice(1).every(request => ['crawler', 'brute', 'spitter', 'stalker'].includes(request.enemyId))).toBe(true);
      expect(encounter.schedule.slice(1).some(request => request.enemyId === 'spitter' || request.enemyId === 'stalker')).toBe(true);
    }
  });

  it('gives naturally scheduled late elites control resistance while ordinary targets still freeze', () => {
    const game = new DepthGame();
    game.newRun(1729);
    const nodes = generateRun(1729).nodes, node = nodes[10];
    game.expedition = {
      ...game.expedition,
      run: {...game.expedition.run, currentNodeId: node.id, completedNodeIds: nodes.slice(0, 10).map(entry => entry.id), phase: 'combat'},
      build: {mutations: [], rig: 'breacher'},
    };
    game['enterRoom']();
    for (let tick = 0; tick < 50; tick++) game.update(50);
    const live = game.enemies.snapshot.enemies;
    const elite = live.find(enemy => enemy.elite && !enemy.champion);
    const ordinary = live.find(enemy => !enemy.elite && !enemy.champion);
    if (!elite || !ordinary) throw new Error('Scheduled late mix must expose both elite and ordinary control behavior');
    const eliteTarget = game.targets().find(target => target.id === elite.id)!;
    const ordinaryTarget = game.targets().find(target => target.id === ordinary.id)!;
    expect(eliteTarget.resistant).toBe(true);
    expect(ordinaryTarget.resistant).toBe(false);
    game['mutations'].applyAbilityStatus(eliteTarget, 'freeze', 1800);
    game['mutations'].applyAbilityStatus(ordinaryTarget, 'freeze', 1800);
    expect(game.boonStatuses(elite.id).frozen).toBe(false);
    expect(game.boonStatuses(ordinary.id).frozen).toBe(true);
    expect(game.enemies.getSnapshot(elite.id)!.speed).toBeCloseTo(elite.baseSpeed * .65);
    expect(game.enemies.getSnapshot(ordinary.id)!.speed).toBe(0);
  });

  it('preserves Transmission pacing and ordinary target stats while extending the final pressure sequence', () => {
    for (const seed of SEEDS) {
      const nodes = generateRun(seed).nodes;
      const transmission = plan(seed, nodes[9]), finale = plan(seed, nodes[19]);
      expect(transmission).toMatchObject({totalSpawns: 32, concurrentCap: 14});
      expect(transmission.schedule[0].atMs).toBe(650);
      expect(transmission.schedule.at(-1)!.atMs).toBe(23900);
      transmission.schedule.forEach((spawn, index) => {
        expect(spawn.elite).toBe(false);
        if (index) expect(spawn.atMs - transmission.schedule[index - 1].atMs).toBe(750);
      });
      const previous = oldProgression(nodes[9]), current = progressionFor(nodes[9]);
      expect({health: current.health, damage: current.damage, speed: current.speed})
        .toEqual({health: previous.health, damage: previous.damage, speed: previous.speed});
      expect(finale).toMatchObject({totalSpawns: 48, concurrentCap: 15});
      // Normal Warden waves now have 33 requests, replacing the unaccepted nine-body duel.
      expect(plan(seed, nodes[18]).totalSpawns).toBe(33);
      within(finale.totalSpawns / plan(seed, nodes[18]).totalSpawns, [1.4, 1.5], 'finale request-count climax');
      expect(finale.schedule[0].atMs).toBe(650);
      expect(finale.schedule.at(-1)!.atMs).toBe(42950);
      finale.schedule.forEach((spawn, index) => {
        if (index) expect(spawn.atMs - finale.schedule[index - 1].atMs).toBe(900);
      });
      expect(finale.schedule.filter(spawn => spawn.elite).length / finale.totalSpawns).toBeGreaterThanOrEqual(.55);
      expect(finale.schedule.filter(spawn => spawn.elite).length / finale.totalSpawns).toBeLessThanOrEqual(.82);
    }
  });

  it('builds final holdout density gradually, retaining queued pressure until all 48 requests resolve', () => {
    const node = generateRun(1729).nodes[19];
    const director = new EncounterDirector({seed: 1729, node, breachIds: ['north', 'south', 'east', 'west']});
    director.start();
    let occupied = 0;
    const density: number[] = [];
    for (let elapsed = 50; elapsed <= 20000; elapsed += 50) {
      occupied += director.update(50, occupied).filter(event => event.type === 'spawn-request').length;
      if ([1000, 5000, 10000, 20000].includes(elapsed)) density.push(occupied);
    }
    expect(density[0]).toBeGreaterThan(0);
    expect(density[0]).toBeLessThan(density[1]);
    expect(density[1]).toBeLessThan(density[2]);
    expect(density[2]).toBeLessThan(density[3]);
    expect(density[3]).toBe(15);
    expect(director.snapshot).toMatchObject({phase: 'combat', dispatched: 15, remaining: 33});
    expect(director.update(60000, occupied)).toEqual([]);
    while (director.snapshot.remaining > 0) {
      const next = director.update(0, 0);
      expect(next.length).toBeGreaterThan(0);
      expect(next.every(event => event.type === 'spawn-request')).toBe(true);
      expect(director.phase).toBe('combat');
    }
    expect(director.update(0, 1)).toEqual([]);
    expect(director.phase).toBe('combat');
    expect(director.update(0, 0)).toContainEqual({type: 'room-clear', nodeId: node.id, wave: 20});
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

  it.each([
    {depth: 5, maxHealth: 760, damage: 28}, {depth: 8, maxHealth: 760, damage: 28},
    {depth: 12, maxHealth: 760, damage: 28}, {depth: 15, maxHealth: 1150, damage: 24},
    {depth: 18, maxHealth: 760, damage: 28},
  ])('spawns room-index $depth champion with its real type, elite presentation and control resistance', ({depth, maxHealth, damage}) => {
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
      radius: matron ? 24 : 28, maxHealth, maxArmor: matron ? 0 : 120,
    });
    expect(champion!.contactDamage).toBeCloseTo(damage, 12);
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
