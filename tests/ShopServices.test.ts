import {describe, expect, it} from 'vitest';
import {DepthGame} from '../src/DepthGame';
import {generateRun} from '../src/game/roguelike/run';
import type {MutationId} from '../src/game/roguelike/types';
import {shopScreen} from '../src/ui/screens/templates';

function reward(options: {health?: number; armor?: number; credits?: number; mutations?: MutationId[]; kind?: 'healing' | 'supplies'} = {}) {
  const storage = new Map<string, string>();
  const game = new DepthGame(() => {}, {getItem: key => storage.get(key) ?? null, setItem: (key, value) => {storage.set(key, value);}, removeItem: key => {storage.delete(key);}});
  game.newRun(2718);
  const graph = generateRun(2718), node = graph.nodes.find(value => value.reward === (options.kind ?? 'healing'))!;
  const build = {rig: 'breacher' as const, mutations: options.mutations ?? []};
  game.combat.setBuild(build);
  const resources = {...game.combat.getRunResources(), health: options.health ?? 100, armor: options.armor ?? game.combat.snapshot.maxArmor, credits: options.credits ?? 500};
  expect(game.combat.restoreRunResources(resources)).toBe(true);
  game.node = node;
  game.expedition = {...game.expedition, build, resources, run: {...game.expedition.run, seed: 2718, currentNodeId: node.id, phase: 'reward', completedNodeIds: graph.nodes.filter(value => value.depth <= node.depth).map(value => value.id)}};
  game.status = 'reward';
  return {game, storage};
}

function serviceTag(game: DepthGame, id: string) {
  return shopScreen(game).match(new RegExp(`<button[^>]*data-purchase="${id}"[^>]*>`))![0];
}

describe('paid room services', () => {
  it('rejects recovery at full resources without spending, taking the free allocation or advancing the reward', () => {
    const {game, storage} = reward(), before = game.combat.getRunResources(), expedition = game.expedition;
    const saved = [...storage];
    expect(game.canPurchaseService('heal')).toBe(false);
    expect(game.canPurchaseService('armor')).toBe(false);
    game.claimResources('heal'); game.claimResources('armor');
    expect(game.combat.getRunResources()).toEqual(before);
    expect(game.expedition).toBe(expedition);
    expect(game.status).toBe('reward');
    expect([...storage]).toEqual(saved);
    game.claimResources();
    expect(game.status).toBe('route');
    expect(game.combat.snapshot.credits).toBe(500);
  });

  it('does not charge for health or armor already filled by the pending free allocation', () => {
    const {game} = reward({health: 65, armor: 85});
    const before = game.combat.getRunResources();
    expect(game.canPurchaseService('heal')).toBe(false);
    expect(game.canPurchaseService('armor')).toBe(false);
    game.claimResources('heal'); game.claimResources('armor');
    expect(game.combat.getRunResources()).toEqual(before);
    game.claimResources();
    expect(game.combat.snapshot).toMatchObject({health: 100, armor: game.combat.snapshot.maxArmor, credits: 500});
  });

  it('retains existing healing amounts, price and cap when the service adds health', () => {
    const {game} = reward({health: 20, armor: 0});
    expect(game.canPurchaseService('heal')).toBe(true);
    game.claimResources('heal');
    expect(game.combat.snapshot).toMatchObject({health: 85, armor: 15, credits: 400});
    expect(game.status).toBe('route');
    const receipt = game.combat.getRunResources(); game.claimResources('heal');
    expect(game.combat.getRunResources()).toEqual(receipt);
    const edge = reward({health: 64}).game;
    expect(edge.canPurchaseService('heal')).toBe(true);
    edge.claimResources('heal');
    expect(edge.combat.snapshot).toMatchObject({health: 100, credits: 400});
  });

  it('retains the existing armor amount and price only for marginal armor', () => {
    const {game} = reward({health: 100, armor: 0});
    expect(game.canPurchaseService('armor')).toBe(true);
    game.claimResources('armor');
    expect(game.combat.snapshot).toMatchObject({armor: 40, credits: 410});
  });

  it('preserves full-health Field Medic armor conversion and accounts for its free bonus', () => {
    const {game} = reward({health: 100, armor: 0, mutations: ['field-medic']});
    const before = game.combat.getRunResources();
    expect(game.canPurchaseService('heal')).toBe(true);
    expect(game.combat.getRunResources()).toEqual(before);
    game.claimResources('heal');
    expect(game.combat.snapshot).toMatchObject({health: 100, armor: 31.25, credits: 400});
    const freeCapsHealth = reward({health: 60, mutations: ['field-medic']}).game;
    expect(freeCapsHealth.canPurchaseService('heal')).toBe(false);
    const freeCapsArmor = reward({health: 100, armor: 80, mutations: ['field-medic']}).game;
    expect(freeCapsArmor.canPurchaseService('armor')).toBe(false);
  });

  it('keeps ammo services and supplies-room recovery while enforcing credits and actual reward phase', () => {
    const {game} = reward({health: 70, kind: 'supplies'});
    expect(game.canPurchaseService('heal')).toBe(true);
    expect(game.canPurchaseService('ammo')).toBe(true);
    const before = game.combat.getRunResources();
    game.claimResources('heal');
    expect(game.combat.snapshot).toMatchObject({health: 100, credits: 400});
    expect(game.combat.getRunResources().ammo.rifle.reserve).toBeGreaterThan(before.ammo.rifle.reserve);
    expect(game.canPurchaseService('ammo')).toBe(false);
    const poor = reward({health: 1, armor: 0, credits: 89}).game;
    for (const service of ['heal', 'armor', 'ammo'] as const) expect(poor.canPurchaseService(service)).toBe(false);
    poor.expedition = {...poor.expedition, run: {...poor.expedition.run, phase: 'combat'}};
    const resources = poor.combat.getRunResources(); poor.claimResources();
    expect(poor.combat.getRunResources()).toEqual(resources);
    expect(poor.status).toBe('reward');
  });

  it('uses the same predicate for disabled native buttons and accessible explanatory copy', () => {
    const {game} = reward({health: 65, armor: 85});
    expect(serviceTag(game, 'heal')).toContain('disabled');
    expect(serviceTag(game, 'armor')).toContain('disabled');
    expect(serviceTag(game, 'ammo')).not.toContain('disabled');
    expect(serviceTag(game, 'heal')).toContain('aria-describedby="service-heal-reason"');
    expect(shopScreen(game)).toContain('<small id="service-heal-reason">No extra recovery after allocation.</small>');
    expect(shopScreen(game)).toContain('<small id="service-armor-reason">Armor full after allocation.</small>');
    const useful = reward({health: 100, armor: 0, mutations: ['field-medic']}).game;
    expect(serviceTag(useful, 'heal')).not.toContain('disabled');
  });
});
