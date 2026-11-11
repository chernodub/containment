import {describe, expect, it} from 'vitest';
import {AbilitySystem, type AbilityHost, type AbilityPoint} from '../src/game/abilities/AbilitySystem';
import {ABILITY_CATALOG} from '../src/game/abilities/catalog';
import type {AbilityEvent, AbilityId, RigId} from '../src/game/abilities/contract';
import type {MutationId} from '../src/game/roguelike/types';

type PlacementCase = {
  rig: RigId;
  ability: AbilityId;
  augment: MutationId;
  offsets: readonly number[];
  axis: 'forward' | 'lateral';
};
const cases: readonly PlacementCase[] = [
  {rig:'cryo', ability:'glacier', augment:'twin-glacier', offsets:[-40,40], axis:'forward'},
  {rig:'arc', ability:'tesla-pylon', augment:'twin-pylon', offsets:[-50,50], axis:'lateral'},
  {rig:'pyro', ability:'napalm-charge', augment:'napalm-triplet', offsets:[-100,0,100], axis:'lateral'},
];
type Footprint = {x:number; y:number; radius?:number; length?:number; width?:number};

function world(config: PlacementCase, augmented = true) {
  const player = {x:0, y:0, angle:0, radius:16, vx:0, vy:0};
  const events: Array<AbilityEvent & AbilityPoint> = [];
  const owned = new Set<MutationId>(augmented ? [config.augment] : []);
  let allowed = (_from:AbilityPoint, _to:AbilityPoint, _radius:number) => true;
  const host: AbilityHost = {
    player:()=>player,
    targets:()=>[],
    visible:()=>true,
    traverse:(from,to,radius)=>Math.abs(from.x)<=5000 && Math.abs(from.y)<=5000
      && Math.abs(to.x)<=5000 && Math.abs(to.y)<=5000 && allowed(from,to,radius),
    movePlayer:()=>{},
    damage:()=>false,
    statuses:()=>({chilled:false,frozen:false}),
    status:()=>{},
    launch:()=>{},
    arc:()=>{},
    has:id=>owned.has(id),
    reload:()=>{},
    emit:(event,x,y)=>events.push({...event,x,y}),
  };
  const system = new AbilitySystem(host);
  system.setRig(config.rig);
  system.setIntent(0,0,{x:300,y:0});
  const advance = (ms:number) => {
    for (let elapsed=0; elapsed<ms; elapsed+=25) system.update(Math.min(25,ms-elapsed));
  };
  const telegraphs = (): Footprint[] => events.filter(e=>e.phase==='cast').map(e=>{
    const point = {x:e.targetX!, y:e.targetY!};
    return config.ability==='glacier' ? {...point,length:e.length,width:e.width} : {...point,radius:e.radius};
  });
  const entities = (): Footprint[] => {
    const snapshot = system.snapshot;
    if (config.ability==='napalm-charge') return snapshot.zones.map(z=>({x:z.x,y:z.y,radius:z.radius}));
    return snapshot.deployables.map(d=>config.ability==='glacier'
      ? {x:d.x,y:d.y,length:d.length,width:d.thickness}
      : {x:d.x,y:d.y,radius:220});
  };
  return {system,player,events,owned,advance,telegraphs,entities,
    allow:(predicate:typeof allowed)=>{allowed=predicate;}};
}

function expectPoints(actual: readonly Footprint[], expected: readonly AbilityPoint[]) {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((point,index)=>{
    expect(point.x).toBeCloseTo(expected[index].x,10);
    expect(point.y).toBeCloseTo(expected[index].y,10);
  });
}

for (const config of cases) describe(`${config.augment} placement telegraphs`,()=>{
  for (const angle of [0, Math.PI/2]) {
    it(`telegraphs exactly the eventual augmented geometry when aiming at ${angle} radians`,()=>{
      const w=world(config), definition=ABILITY_CATALOG[config.ability];
      w.player.angle=angle;
      expect(w.system.use('power')).toBe(true);
      expect(w.entities()).toEqual([]);
      const expected=config.offsets.map(offset=>({
        x:300 + (config.axis==='forward' ? Math.cos(angle) : -Math.sin(angle))*offset,
        y:(config.axis==='forward' ? Math.sin(angle) : Math.cos(angle))*offset,
      }));
      const cast=w.telegraphs();
      expectPoints(cast,expected);
      for (const event of w.events.filter(e=>e.phase==='cast')) {
        expect(event).toMatchObject({ability:config.ability,slot:'power',angle,durationMs:definition.castMs});
      }
      expect(w.system.snapshot.slots!.power).toMatchObject({charges:0,cooldownRemainingMs:definition.cooldownMs});
      expect(w.system.use('power')).toBe(false);
      w.advance(definition.castMs-1);
      expect(w.entities()).toEqual([]);
      w.advance(1);
      expect(w.entities()).toEqual(cast);
      if (config.ability==='tesla-pylon') {
        expect(cast.every(point=>point.radius===220)).toBe(true);
        expect(w.system.snapshot.deployables.every(pylon=>pylon.radius===18)).toBe(true);
      }
      expect(w.events.filter(e=>e.phase==='cast')).toHaveLength(config.offsets.length);
      expect(w.system.snapshot.slots!.power.cooldownRemainingMs).toBeCloseTo(definition.cooldownMs-definition.castMs);
      expect(w.system.use('power')).toBe(false);
      w.advance(definition.cooldownMs-definition.castMs);
      expect(w.system.snapshot.slots!.power).toMatchObject({charges:1,ready:true,cooldownRemainingMs:0});
      expect(w.events.filter(e=>e.phase==='ready'&&e.slot==='power')).toHaveLength(1);
    });
  }

  it('accepts a legal augmented point when the unaugmented center is blocked and telegraphs only the accepted point',()=>{
    const w=world(config);
    // Glacier's complete wall-fit sweep also has to stay at the accepted X.
    // Lateral variants must cross into the accepted negative-Y side.
    w.allow((_from,to)=>config.axis==='forward' ? to.x<280 : to.y<0);
    expect(w.system.use('power')).toBe(true);
    const cast=w.telegraphs();
    expectPoints(cast,[config.axis==='forward' ? {x:260,y:0} : {x:300,y:config.offsets[0]}]);
    w.advance(ABILITY_CATALOG[config.ability].castMs);
    expect(w.entities()).toEqual(cast);
    expect(w.system.snapshot.slots!.power.charges).toBe(0);
  });

  it('denies an entirely obstructed placement without a telegraph or spent cooldown',()=>{
    const w=world(config);
    w.allow(()=>false);
    const before=w.system.snapshot.slots!.power;
    expect(before.ready).toBe(false);
    expect(w.system.use('power')).toBe(false);
    expect(w.telegraphs()).toEqual([]);
    expect(w.entities()).toEqual([]);
    expect(w.events).toHaveLength(1);
    expect(w.events[0]).toMatchObject({phase:'denied',ability:config.ability,denial:'blocked'});
    expect(w.system.snapshot.slots!.power).toEqual(before);
  });

  it('clamps the base cursor point to range before applying the augment offsets',()=>{
    const w=world(config), definition=ABILITY_CATALOG[config.ability];
    w.system.setIntent(0,0,{x:10_000,y:0});
    expect(w.system.use('power')).toBe(true);
    const expected=config.offsets.map(offset=>({
      x:definition.range+(config.axis==='forward'?offset:0),
      y:config.axis==='lateral'?offset:0,
    }));
    const cast=w.telegraphs();
    expectPoints(cast,expected);
    w.advance(definition.castMs);
    expect(w.entities()).toEqual(cast);
  });

  it('keeps the accepted cast plan when the cursor, aim and augment ownership change during wind-up',()=>{
    const w=world(config);
    expect(w.system.use('power')).toBe(true);
    const cast=w.telegraphs();
    w.system.setIntent(0,0,{x:-300,y:200});
    w.player.angle=Math.PI;
    w.owned.clear();
    w.advance(ABILITY_CATALOG[config.ability].castMs);
    expect(w.entities()).toEqual(cast);
  });

  it('retains a single centered native placement when the augment is absent',()=>{
    const w=world(config,false), definition=ABILITY_CATALOG[config.ability];
    expect(w.system.use('power')).toBe(true);
    const cast=w.telegraphs();
    expectPoints(cast,[{x:300,y:0}]);
    w.advance(definition.castMs);
    expect(w.entities()).toEqual(cast);
    if (config.ability==='glacier') expect(cast[0]).toEqual({x:300,y:0,length:200,width:26});
    else expect(cast[0].radius).toBe(config.ability==='napalm-charge'?120:220);
  });
});

it('Twin Glacier telegraphs only the wall whose complete segment fits the world',()=>{
  const w=world(cases[0]);
  // Every placement center is reachable. Only the first complete wall fits.
  w.allow((from,to)=>Math.abs(to.y-from.y)<100 || to.x<280);
  expect(w.system.use('power')).toBe(true);
  const cast=w.telegraphs();
  expectPoints(cast,[{x:260,y:0}]);
  w.advance(ABILITY_CATALOG.glacier.castMs);
  expect(w.entities()).toEqual(cast);
});
