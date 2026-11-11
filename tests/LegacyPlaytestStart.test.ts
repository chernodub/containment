import {afterEach, describe, expect, it, vi} from 'vitest';
import {DepthGame, type GameInput} from '../src/DepthGame';
import {CombatSystem} from '../src/game/combat/CombatSystem';
import {createExpedition, expeditionRewardOffers} from '../src/game/roguelike/expedition';
import {generateRun, isValidRunState} from '../src/game/roguelike/run';
import {parseCheckpoint, CHECKPOINT_STORAGE_KEY} from '../src/game/roguelike/checkpoints';
import {installDebug} from '../scripts/nextgen/debug';
import type {DepthRenderer} from '../src/render/DepthRenderer';

const idle: GameInput = {x: 0, y: 0, fire: false, angle: null, autoAim: false};
function host() {
  const data = new Map<string, string>();
  const storage = {getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => {data.set(key, value);}, removeItem: (key: string) => {data.delete(key);}};
  return {game: new DepthGame(() => {}, storage), data};
}
afterEach(() => vi.unstubAllGlobals());

describe('initial legacy campaign factory', () => {
  it('preserves default v3 starting-boon and native rig selection behavior', () => {
    const {game} = host();
    game.newRun(137);
    expect(game.expedition.run).toMatchObject({version: 3, currentNodeId: '137:v3-r0', phase: 'starting-boon', completedNodeIds: []});
    expect(game.status).toBe('reward');
    expect(game.expedition.build).toEqual({mutations: [], rig: 'breacher'});
    expect(expeditionRewardOffers(game.expedition)).toHaveLength(3);
    expect(game.canContinue).toBe(true);
    game.newRun(137, {rigSelect: true});
    expect(game.expedition.run.phase).toBe('rig-select');
    expect(game.chooseRig('cryo')).toBe(true);
    expect(game.expedition.run.phase).toBe('starting-boon');
  });

  it.each([1, 2] as const)('starts version %i at its canonical first encounter with ordinary resources and no granted boons/statistics', version => {
    const {game, data} = host();
    game.newRun(1729, {version, rig: 'arc', rigSelect: true});
    const graph = generateRun(1729, version);
    expect(game.expedition.run).toMatchObject({version, currentNodeId: graph.startId, phase: 'combat', completedNodeIds: []});
    expect(game.node.id).toBe(graph.startId);
    expect(game.node.depth).toBe(0);
    expect(game.status).toBe('playing');
    expect(game.expedition.build).toEqual({mutations: [], rig: 'arc'});
    expect(game.abilities.snapshot.rig).toBe('arc');
    expect(expeditionRewardOffers(game.expedition)).toEqual([]);
    const ordinaryStart = new CombatSystem(); ordinaryStart.switchWeapon('shotgun'); ordinaryStart.replenishReserves();
    expect(game.combat.getRunResources()).toEqual(ordinaryStart.getRunResources());
    expect(game.stats).toMatchObject({kills: {total: 0}, damageTaken: 0, shotsFired: 0, shotsHit: 0, overdrivesUsed: 0, creditsEarned: 0, roomTimeMs: {[graph.startId]: 0}});
    expect(Object.values(game.stats.damageDealt).every(value => value === 0)).toBe(true);
    expect(Object.values(game.stats.abilityUses).every(value => value === 0)).toBe(true);
    expect(game.elapsed).toBe(0);
    expect(game.canContinue).toBe(false);
    expect(data.has(CHECKPOINT_STORAGE_KEY)).toBe(false);
    // Scheduled enemies must appear by advancing the actual director; no test spawns or room skipping.
    for (let i = 0; i < 50 && !game.enemies.activeCount; i++) game.update(50, idle);
    expect(game.enemies.activeCount).toBeGreaterThan(0);
    expect(game.expedition.run.completedNodeIds).toEqual([]);
    expect(game.canContinue).toBe(false);
  });

  it('keeps legacy choice phases invalid and only saves after the first real clear boundary', () => {
    const {game, data} = host(); game.newRun(1729, {version: 2, rig: 'pyro'});
    expect(isValidRunState({...game.expedition.run, phase: 'rig-select'})).toBe(false);
    expect(isValidRunState({...game.expedition.run, phase: 'starting-boon'})).toBe(false);
    for (let i = 0; i < 1000 && game.status === 'playing'; i++) {
      for (const enemy of game.enemies.snapshot.enemies) game.damage(enemy.id, 10000);
      game.update(50, idle);
    }
    expect(game.status).toBe('reward');
    expect(game.expedition.run.completedNodeIds).toEqual([generateRun(1729, 2).startId]);
    expect(game.canContinue).toBe(true);
    expect(parseCheckpoint(data.get(CHECKPOINT_STORAGE_KEY))?.run.phase).toBe('reward');
  });

  it('requires alive resources and validates starting rigs in the expedition factory', () => {
    const resources = new CombatSystem().getRunResources();
    expect(() => createExpedition(1, {...resources, health: 0}, {version: 2})).toThrow('start alive');
    expect(() => createExpedition(1, resources, {version: 2, rig: 'unknown' as 'arc'})).toThrow('Unknown starting rig');
  });
});

function debugHost() {
  const {game, data} = host();
  game.newRun(1729, {rigSelect: true});
  const target: Record<string, any> = {};
  vi.stubGlobal('window', target); vi.stubGlobal('location', {search: '?debug=1&seed=1729'});
  const intent: GameInput = {...idle, x: 1}, advanceUi = vi.fn();
  const presentation = {setEnabled: vi.fn(), reset: vi.fn(), effect: vi.fn(), step: vi.fn((ms: number, input: GameInput, update: (ms: number, input: GameInput) => void) => update(ms * .5, input))};
  const renderer = {render: vi.fn(), effect: vi.fn(), prepare: vi.fn(async () => {}), roomLoading: false} as unknown as DepthRenderer;
  installDebug(game, renderer, vi.fn(), vi.fn(), vi.fn(), advanceUi, presentation, () => intent, () => true);
  return {game, data, debug: target.__containmentDebug, presentation};
}

describe('diagnostic initial legacy bootstrap', () => {
  it('requires the real selected rig boundary and preserves native input, feel and assistance settings', async () => {
    const {game, debug, presentation} = debugHost();
    expect(game.chooseRig('cryo')).toBe(true);
    debug.nativeInput(true); debug.presentation(true); debug.incomingDamageScale(.25);
    const setEnabledCalls = presentation.setEnabled.mock.calls.length;
    await debug.startLegacyRun(1729, 'cryo');
    expect(game.expedition.run).toMatchObject({version: 2, phase: 'combat', currentNodeId: generateRun(1729, 2).startId, completedNodeIds: []});
    expect(game.expedition.build).toEqual({mutations: [], rig: 'cryo'});
    expect(debug.events).toEqual([]);
    expect(presentation.setEnabled).toHaveBeenCalledTimes(setEnabledCalls);
    expect(presentation.setEnabled).toHaveBeenLastCalledWith(true);
    const before = {...game.player}, armor = game.combat.snapshot.armor;
    game.hurt(20); expect(game.combat.snapshot.armor).toBe(armor - 5);
    debug.step(100);
    expect(game.player.x).toBeGreaterThan(before.x);
    expect(game.elapsed).toBeCloseTo(.05);
    expect(presentation.step).toHaveBeenCalled();
    expect(game.canContinue).toBe(false);
  });

  it('rejects unselected, mismatched-seed/rig and already-started campaign states', async () => {
    const {game, debug} = debugHost();
    await expect(debug.startLegacyRun(1729, 'breacher')).rejects.toThrow('untouched native rig choice');
    expect(game.chooseRig('arc')).toBe(true);
    await expect(debug.startLegacyRun(137, 'arc')).rejects.toThrow('same seed');
    await expect(debug.startLegacyRun(1729, 'pyro')).rejects.toThrow('same seed');
    game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
    await expect(debug.startLegacyRun(1729, 'arc')).rejects.toThrow('untouched native rig choice');
    expect(game.expedition.run.version).toBe(3);
  });
});

it('rejects unsupported legacy factory versions without widening the run schema',()=>{expect(()=>createExpedition(1729,new DepthGame().combat.getRunResources(),{version:4 as never})).toThrow('Unsupported run version');});

it('validates a new campaign before discarding the existing earned checkpoint',()=>{const data=new Map<string,string>();const storage={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);},removeItem:(k:string)=>{data.delete(k);}};const game=new DepthGame(()=>{},storage);game.newRun(1729);const before=[...data],expedition=game.expedition,combat=game.combat;expect(()=>game.newRun(1729,{version:4 as never})).toThrow('Unsupported run version');expect([...data]).toEqual(before);expect(game.expedition).toBe(expedition);expect(game.combat).toBe(combat);});
