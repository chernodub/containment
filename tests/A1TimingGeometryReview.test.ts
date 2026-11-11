import {describe,it,expect,vi} from 'vitest';
import {advance,arena,world} from './A1ReviewFixtures';
import {ABILITY_CATALOG,RIG_IDS} from '../src/game/abilities/catalog';
import type {AbilitySlot,RigId} from '../src/game/abilities/contract';
import {AUGMENT_BOONS} from '../src/game/abilities/augmentCatalog';
import type {MutationId} from '../src/game/roguelike/types';

const partitions=[50,16.67,4.1675];
describe('A1 review: exact ability event-time boundaries',()=>{
  for(const definition of Object.values(ABILITY_CATALOG).filter(d=>d.castMs||d.durationMs&&d.id!=='overclock')){
    it(`${definition.id} has partition-independent damage, kills and lifetime`,()=>{
      const results=partitions.map(step=>{
        const w=world(definition.rig);w.targets[0].health=175;
        const target=w.targets[0];
        // Follow attached auras / retain contact with strips while allowing dash motion.
        if(definition.slot==='dash')Object.assign(target,{x:75,y:0});
        w.system.use(definition.slot);
        const total=definition.castMs+(definition.slot==='dash'?140:0)+(definition.durationMs||250);
        advance(w.system,total,step);
        return {damage:w.hits.reduce((n,h)=>n+h.damage,0),dead:target.health<=0,zones:w.system.snapshot.zones.length,deployables:w.system.snapshot.deployables.length};
      });
      expect(results[1]).toEqual(results[0]);expect(results[2]).toEqual(results[0]);
    });
  }
  for(const d of Object.values(ABILITY_CATALOG).filter(d=>d.castMs||d.durationMs&&d.id!=='overclock')) {
    it(`real ${d.id} preserves applied damage and deaths across all three frame partitions`,()=>{
      const results=partitions.map(step=>{
        const {game}=arena(d.rig);vi.spyOn(game.enemies,'update').mockReturnValue([]);
        const spawn=game.enemies.spawn('brute',d.slot==='dash'?475:500,440);if(!spawn.spawned)throw Error('spawn');
        game.setAimPoint({x:500,y:440});if(d.slot==='overdrive')game.abilities.addCharge(6000);
        game.useAbility(d.slot);
        advance(game,d.castMs+(d.slot==='dash'?140:0)+(d.durationMs||250)+1500,step);
        return {damage:game.stats.damageDealt,kills:game.stats.kills.total};
      });
      expect(results[1]).toEqual(results[0]);expect(results[2]).toEqual(results[0]);
    });
  }
  it('real Napalm burn clocks start at the exact pulse boundary across partitions',()=>{
    const results=partitions.map(step=>{
      const {game}=arena('pyro');vi.spyOn(game.enemies,'update').mockReturnValue([]);
      const target=game.enemies.spawn('brute',500,440);if(!target.spawned)throw Error('spawn');
      game.setAimPoint({x:500,y:440});game.useAbility('power');advance(game,850,step);
      return {ability:game.stats.damageDealt.ability,status:game.stats.damageDealt.status,kills:game.stats.kills.total};
    });
    expect(results[0].status).toBeGreaterThan(0);expect(results[1]).toEqual(results[0]);expect(results[2]).toEqual(results[0]);
  });
  it('Napalm first pulse occurs exactly 600ms after press for every partition',()=>{
    for(const step of partitions){const w=world();w.system.use('power');advance(w.system,600,step);expect(w.hits).toHaveLength(1);expect(w.system.snapshot.zones[0].remainingMs).toBeCloseTo(5750,6);}
  });
  it.each(['cryo','pyro'] as const)('%s final Overdrive pulse retains kill payoffs before ending',rig=>{
    const {game,effects}=arena(rig);vi.spyOn(game.enemies,'update').mockReturnValue([]);
    const spawn=game.enemies.spawn('brute',rig==='pyro'?500:550,440);if(!spawn.spawned)throw Error('spawn');
    // Pyro native burn is isolated here: aura damage alone kills exactly on the last pulse.
    if(rig==='pyro')vi.spyOn(game['mutations'],'applyAbilityStatus').mockImplementation(()=>{});
    game.damage(spawn.enemy.id,spawn.enemy.health+spawn.enemy.armor-128);
    game.abilities.addCharge(6000);game.useAbility('overdrive');advance(game,8000);
    expect(game.stats.kills.total).toBe(1);
    const bursts=effects.filter(e=>e.ability?.phase==='burst'&&e.ability.ability===(rig==='cryo'?'whiteout':'meltdown'));
    expect(bursts).toHaveLength(1);
    const end=effects.findIndex(e=>e.ability?.phase==='end'&&e.ability.ability===(rig==='cryo'?'whiteout':'meltdown'));
    expect(effects.indexOf(bursts[0])).toBeLessThan(end);
    expect(game.abilities.snapshot.overdrive.active).toBe(false);
  });
});

describe('A1 review: authoritative telegraphs and cached placement',()=>{
  it('Spreading Nova previews and hits the captured augmented radius',()=>{
    const w=world('cryo',['spreading-nova']);w.status.set(1,{chilled:true,frozen:false});
    w.targets.push({id:2,x:225,y:0,radius:14,health:1e6},{id:3,x:231,y:0,radius:14,health:1e6});
    w.system.use('tactical');
    expect(w.events.find(e=>e.phase==='cast')?.radius).toBe(230);
    expect(w.events.find(e=>e.phase==='impact')?.radius).toBe(230);
    expect(w.hits.map(h=>h.id)).toEqual([1,2]);
  });
  it.each(RIG_IDS)('%s unchanged snapshot reads perform zero placement collision traversals',rig=>{
    const w=world(rig),traverse=vi.spyOn(w.host,'traverse');const snapshot=w.system.snapshot;traverse.mockClear();
    for(let i=0;i<100;i++)expect(w.system.snapshot).toBe(snapshot);
    expect(traverse).not.toHaveBeenCalled();
    w.player.x=10;void w.system.snapshot;expect(traverse).toHaveBeenCalled();traverse.mockClear();
    const after=w.system.snapshot;for(let i=0;i<100;i++)expect(w.system.snapshot).toBe(after);expect(traverse).not.toHaveBeenCalled();
  });
  it('placement caching invalidates on aim, orientation, position, rig and placement augments',()=>{
    const w=world('cryo'),traverse=vi.spyOn(w.host,'traverse');void w.system.snapshot;
    for(const mutate of [()=>w.system.setIntent(0,0,{x:200,y:0}),()=>w.player.angle=.3,()=>w.player.x=5,()=>w.owned.add('twin-glacier')]){
      traverse.mockClear();mutate();void w.system.snapshot;expect(traverse).toHaveBeenCalled();
    }
    w.system.setRig('arc');traverse.mockClear();void w.system.snapshot;expect(traverse).toHaveBeenCalled();
  });
});

describe('A1 review: dash invulnerability budget',()=>{
  it.each(RIG_IDS)('%s never exceeds35%% even with every relevant augment and cooldown refund kills',rig=>{
    const all=Object.keys(AUGMENT_BOONS) as MutationId[];
    const w=world(rig,all);let immune=0;const total=60_000,step=5;
    for(let t=0;t<total;t+=step){if(w.system.snapshot.slots!.dash.ready)w.system.use('dash');if(w.system.invulnerable)immune+=step;w.system.onKill(w.targets[0],false);w.system.update(step);}
    expect(immune/total).toBeLessThanOrEqual(.35);expect(immune/total).toBeGreaterThan(.15);
  });
});
