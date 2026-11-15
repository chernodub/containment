import {createHash} from 'node:crypto';
import {describe, expect, it} from 'vitest';
import {DepthGame, type GameEffect} from '../src/DepthGame';
import {EnemySystem, type EnemyEvent} from '../src/game/enemies/EnemySystem';
import {MELEE_ATTACKS, meleeStrikeContains} from '../src/game/enemies/meleeAttacks';
import type {StandardEnemyId} from '../src/game/enemies/types';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
import {createRun, clearRoom} from '../src/game/roguelike/run';
import {parseCheckpoint, serializeCheckpoint} from '../src/game/roguelike/checkpoints';

const player = {x: 520, y: 500, radius: 16, angle: 0};
function fixture(family: StandardEnemyId = 'crawler', elite = false) {
  const enemies = new EnemySystem();
  const result = enemies.spawn(family, 500, 500, elite);
  if (!result.spawned) throw Error('spawn');
  return {enemies, id: result.enemy.id, snapshot: () => enemies.getSnapshot(result.enemy.id)!};
}
function advance(enemies: EnemySystem, ms: number, target = player) {
  const events: EnemyEvent[] = [];
  for (let elapsed = 0; elapsed < ms; elapsed += 10) events.push(...enemies.update(Math.min(10, ms - elapsed), target));
  return events;
}

describe('M10 deterministic native melee', () => {
  it.each(['crawler', 'brute', 'spitter', 'stalker', 'carrier'] as const)('%s earns an attack slot, winds up, strikes once, and recovers without turning', family => {
    const h = fixture(family), profile = MELEE_ATTACKS[family];
    const warning = h.enemies.update(0, player);
    expect(warning).toContainEqual(expect.objectContaining({type: 'melee-warning', shape: profile.shape, durationMs: profile.windupMs}));
    expect(h.snapshot()).toMatchObject({meleePhase: 'windup', meleeProgress: 0, meleeFacingLocked: false, engagement: 'engaged'});
    expect(advance(h.enemies, profile.windupMs - 1).some(e => e.type === 'contact-attack')).toBe(false);
    const strike = h.enemies.update(1, player);
    expect(strike.filter(e => e.type === 'melee-strike')).toHaveLength(1);
    expect(strike.filter(e => e.type === 'contact-attack')).toHaveLength(1);
    expect(h.snapshot()).toMatchObject({meleePhase: 'strike', meleeProgress: 0, meleeFacingLocked: true});
    const angle = h.snapshot().meleeAngle;
    expect(advance(h.enemies, profile.strikeMs).filter(e => e.type === 'contact-attack')).toHaveLength(0);
    expect(h.snapshot().meleePhase).toBe('recovery');
    advance(h.enemies, profile.recoveryMs - 1, {...player, x: 500, y: 540});
    expect(h.snapshot()).toMatchObject({meleePhase: 'recovery', meleeAngle: angle, velocityX: 0, velocityY: 0});
  });

  it('tracks early, locks at 72%, and a late sidestep misses instead of damaging by touch', () => {
    const h = fixture();
    h.enemies.update(0, player);
    advance(h.enemies, 100, {...player, y: 510});
    expect(h.snapshot().meleeAngle).toBeGreaterThan(0);
    advance(h.enemies, 90, player);
    expect(h.snapshot().meleeFacingLocked).toBe(true);
    const locked = h.snapshot().meleeAngle;
    const events = advance(h.enemies, 70, {...player, x: 500, y: 540});
    expect(h.snapshot().meleeAngle).toBe(locked);
    expect(events.some(e => e.type === 'melee-strike')).toBe(true);
    expect(events.some(e => e.type === 'contact-attack')).toBe(false);
  });

  it('cannot damage again during strike/recovery and earns a fresh full warning on the next cadence', () => {
    const h=fixture();h.enemies.update(0,player);
    const hits:number[]=[],warnings:number[]=[];
    for(let ms=10;ms<=1200;ms+=10){
      const events=h.enemies.update(10,player);
      if(events.some(e=>e.type==='contact-attack'))hits.push(ms);
      if(events.some(e=>e.type==='melee-warning'))warnings.push(ms);
    }
    expect(hits).toEqual([260,860]);
    expect(warnings).toEqual([600,1200]);
  });

  it.each([
    ['crawler',15,600],['stalker',26,1070],['brute',42,1220],['spitter',12,860],['carrier',22,1200],
  ] as const)('retunes only %s melee damage and start cadence to %i / %ims', (family,damage,cadence) => {
    const h=fixture(family),profile=MELEE_ATTACKS[family];
    h.enemies.update(0,player);
    expect(h.snapshot().meleeDamage).toBeCloseTo(damage);
    const events=advance(h.enemies,profile.windupMs);
    expect(events.find(e=>e.type==='contact-attack')).toMatchObject({damage});
    const beforeNext=advance(h.enemies,cadence-profile.windupMs-1);
    expect(beforeNext.some(e=>e.type==='melee-warning')).toBe(false);
    expect(h.enemies.update(1,player)).toContainEqual(expect.objectContaining({type:'melee-warning'}));
  });

  it('scales elite and progression melee damage without changing the ranged Spitter source', () => {
    const balance={health:1,damage:1.3,speed:1,eliteHealth:1.65,eliteDamage:1.2,specials:false};
    const enemies=new EnemySystem({balance});
    const spawn=enemies.spawn('spitter',500,500,true);
    if(!spawn.spawned)throw Error('spawn');
    expect(spawn.enemy.contactDamage).toBeCloseTo(10*1.2*1.3);
    expect(spawn.enemy.meleeDamage).toBeCloseTo(12*1.2*1.3);
    const events=enemies.update(0,{...player,x:800});
    expect(events.find(e=>e.type==='hazard-attack')).toMatchObject({damage:10*1.2*1.3});
    expect(enemies.getSnapshot(spawn.enemy.id)!.rangedCooldownRemainingMs).toBe(1500);
    expect(Object.isFrozen(MELEE_ATTACKS.spitter)).toBe(true);
  });

  it.each(['freeze', 'stun', 'shove', 'launch'] as const)('cancels a wind-up on %s and never resolves the cancelled strike', control => {
    let launched = false;
    const enemies = new EnemySystem({launched: () => launched});
    const spawn = enemies.spawn('crawler', 500, 500);
    if (!spawn.spawned) throw Error('spawn');
    enemies.update(0,player);advance(enemies, 200);
    if (control === 'freeze' || control === 'stun') enemies.setSlow(spawn.enemy.id, 0);
    else if (control === 'shove') enemies.applyDamage(spawn.enemy.id, 1, {x: 1, y: 0});
    else {launched = true;enemies.update(0, player);}
    expect(enemies.getSnapshot(spawn.enemy.id)?.meleePhase).toBe('approach');
    expect(advance(enemies, 100).some(e => e.type === 'contact-attack')).toBe(false);
  });

  it('applies hostile time scale to wind-up and recovery and makes elites faster', () => {
    const normal = fixture(), slow = fixture(), elite = fixture('crawler', true);
    for (const h of [normal, slow, elite]) h.enemies.update(0, player);
    normal.enemies.update(100, player);slow.enemies.update(30, player);
    expect(normal.snapshot().meleeRemainingMs).toBe(160);
    expect(slow.snapshot().meleeRemainingMs).toBe(230);
    expect(elite.snapshot().meleeDurationMs).toBeCloseTo(260 * .82);
    advance(normal.enemies, 230);advance(slow.enemies, 69);
    expect(normal.snapshot().meleePhase).toBe('recovery');
    expect(slow.snapshot().meleePhase).toBe('windup');
  });

  it('wires native Overclock to melee phase clocks while the marine clock advances normally', () => {
    const game = new DepthGame();
    game.newRun(1729, {rigSelect: true});game.chooseRig('arc');
    game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
    game['director'].reset();game['pending']=[];game.enemies.reset();
    const spawn=game.enemies.spawn('crawler',game.player.x-30,game.player.y);
    if(!spawn.spawned)throw Error('spawn');
    game.update(1);
    const before=game.enemies.getSnapshot(spawn.enemy.id)!;
    expect(before.meleePhase).toBe('windup');
    game.abilities.addCharge(12000);expect(game.useAbility('overdrive')).toBe(true);
    const elapsed=game.elapsed;game.update(50);
    expect(game.enemies.getSnapshot(spawn.enemy.id)!.meleeRemainingMs).toBeCloseTo(before.meleeRemainingMs-15);
    expect(game.elapsed-elapsed).toBeCloseTo(.05);
  });

  it('shares the maximum three melee slots with close ranged families', () => {
    const enemies = new EnemySystem();
    for (let i = 0; i < 12; i++) enemies.spawn(i % 3 === 0 ? 'spitter' : i % 3 === 1 ? 'carrier' : 'crawler', 480 + i % 4 * 20, 470 + Math.floor(i / 4) * 20);
    for (let i = 0; i < 100; i++) {
      enemies.update(10, player);
      const active = enemies.snapshot.enemies.filter(e => e.meleePhase !== 'approach');
      expect(active.length).toBeLessThanOrEqual(3);
      expect(active.every(e => e.attackSlot !== undefined)).toBe(true);
    }
  });

  it('replays mixed-family attacks and controls identically', () => {
    const replay = () => {
      const enemies = new EnemySystem(), events: EnemyEvent[] = [];
      for (const [i, family] of (['crawler', 'brute', 'spitter', 'stalker', 'carrier'] as const).entries()) enemies.spawn(family, 440 + i * 30, 460, i % 2 === 0);
      for (let tick = 0; tick < 500; tick++) {
        if (tick % 97 === 0) enemies.setSlow(1, 0);
        if (tick % 97 === 7) enemies.setSlow(1, 1);
        events.push(...enemies.update(10, {...player, y: 500 + Math.sin(tick / 20) * 50}));
      }
      return createHash('sha256').update(JSON.stringify({events, snapshot: enemies.snapshot})).digest('hex');
    };
    expect(replay()).toBe(replay());
  });

  it('uses exact circle versus sector and capsule footprints, including edge grazing and stepping behind', () => {
    const arc = MELEE_ATTACKS.brute.shape, line = MELEE_ATTACKS.stalker.shape;
    expect(meleeStrikeContains(arc, 0, 0, 0, arc.range + 5, 0, 5)).toBe(true);
    expect(meleeStrikeContains(arc, 0, 0, 0, arc.range + 5.01, 0, 5)).toBe(false);
    expect(meleeStrikeContains(arc, 0, 0, 0, -20, 0, 10)).toBe(false);
    expect(meleeStrikeContains(line, 0, 0, 0, 100, 23, 5)).toBe(true);
    expect(meleeStrikeContains(line, 0, 0, 0, 100, 23.01, 5)).toBe(false);
    expect(meleeStrikeContains(line, 0, 0, Math.PI / 2, -23, 100, 5)).toBe(true);
    expect(meleeStrikeContains(line, 0, 0, 0, NaN, 0)).toBe(false);
  });

  it('routes native warning and miss events through existing hostile effects and dash i-frames reject a strike hit', () => {
    const effects: GameEffect[] = [];
    const game = new DepthGame(e => effects.push(e));
    game.newRun(1729);game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
    game.enemies.reset();
    const origin = {x: game.player.x - 20, y: game.player.y};
    const spawned = game.enemies.spawn('crawler', origin.x, origin.y);
    if (!spawned.spawned) throw Error('spawn');
    game['enemyEvents'](game.enemies.update(0, game.player));
    expect(effects).toContainEqual(expect.objectContaining({type: 'enemy-warning', meleeShape: MELEE_ATTACKS.crawler.shape, dangerWeight: 'low'}));
    advance(game.enemies, 259, game.player);
    game.abilities.setIntent(0, 1, {x: game.player.x, y: game.player.y + 100});
    expect(game.useAbility('dash')).toBe(true);
    expect(game.abilities.invulnerable).toBe(true);
    const before = game.combat.snapshot;
    const strike = game.enemies.update(1, game.player);
    expect(strike.some(e => e.type === 'contact-attack')).toBe(true);
    game['enemyEvents'](strike);
    expect(game.combat.snapshot.health).toBe(before.health);
    expect(game.combat.snapshot.armor).toBe(before.armor);
    expect(effects.filter(e => e.type === 'enemy-attack')).toHaveLength(1);
  });

  it('keeps room-boundary checkpoints byte-compatible, rejects injected attack state, and resets attack defaults', () => {
    const game = new DepthGame();
    const saved = {version: 1 as const, savedAt: 123, run: clearRoom(createRun(42)), build: {mutations: []}, resources: game.combat.getRunResources()};
    const encoded = serializeCheckpoint(saved);
    expect(encoded).toBe(JSON.stringify(saved));
    expect(parseCheckpoint(encoded)).toEqual(saved);
    expect(parseCheckpoint(JSON.stringify({...saved, meleePhase: 'strike'}))).toBeNull();
    const h = fixture();h.enemies.update(0, player);h.enemies.reset();
    const fresh = h.enemies.spawn('crawler', 500, 500);
    expect(fresh.spawned && fresh.enemy).toMatchObject({meleePhase: 'approach', meleeProgress: 0, meleeRemainingMs: 0, meleeFacingLocked: false});
    expect(Object.isFrozen(h.enemies.snapshot.enemies[0].meleeShape)).toBe(true);
  });
});
