import {describe, expect, it} from 'vitest';
import {AbilitySystem, type AbilityHost, type AbilityPoint} from '../src/game/abilities/AbilitySystem';
import {ABILITY_CATALOG} from '../src/game/abilities/catalog';
import type {AbilityDefinition, AbilityEvent, AbilityId} from '../src/game/abilities/contract';
import type {MutationId} from '../src/game/roguelike/types';

type Receipt = AbilityEvent & AbilityPoint & {hopRange?:number; maxTargets?:number};
type Target = {id:number; x:number; y:number; radius:number; health:number};
const universal: readonly MutationId[] = ['reserve-thruster','tactical-salvage','drive-dynamo','slide-loader'];
const rigAugments: Partial<Record<AbilityId,MutationId>> = {
  'seismic-slam':'afterquake',bulwark:'reinforced-bulwark',
  'cryo-nova':'spreading-nova',glacier:'twin-glacier',
  flashfire:'scorched-fan','napalm-charge':'napalm-triplet',
  overload:'forked-overload','tesla-pylon':'twin-pylon',
};

function world(ability: AbilityId, mutations: readonly MutationId[] = []) {
  const definition=ABILITY_CATALOG[ability];
  const player={x:0,y:0,angle:0,radius:16,vx:0,vy:0};
  const events: Receipt[]=[];
  const targets: Target[]=[];
  const hits: Array<{id:number; amount:number}>=[];
  const chilled=new Set<number>();
  const hidden=new Set<number>();
  let stopX=Infinity;
  const host: AbilityHost={
    player:()=>player,targets:()=>targets.filter(t=>t.health>0),
    visible:(_from,to)=>!hidden.has((to as Target).id),
    traverse:(from,to)=>Math.abs(from.x)<=5000&&Math.abs(from.y)<=5000&&Math.abs(to.x)<=5000&&Math.abs(to.y)<=5000,
    movePlayer:(dx,dy)=>{player.x=Math.min(stopX,player.x+dx);player.y+=dy;},
    damage:(target,amount)=>{hits.push({id:target.id,amount});return false;},
    statuses:id=>({chilled:chilled.has(id),frozen:false}),
    status:()=>{},launch:()=>{},arc:()=>{},
    has:id=>mutations.includes(id),reload:()=>{},
    emit:(event,x,y)=>events.push({...event,x,y}),
  };
  const system=new AbilitySystem(host);
  system.setRig(definition.rig,1);
  system.setIntent(0,0,definition.targeting==='point'?{x:300,y:0}:null);
  const add=(x:number,y=0)=>{
    const target={id:targets.length+1,x,y,radius:14,health:100_000};
    targets.push(target);
    return target;
  };
  const advance=(ms:number)=>{
    for(let elapsed=0;elapsed<ms;elapsed+=25)system.update(Math.min(25,ms-elapsed));
  };
  const use=()=>{
    expect(system.use(definition.slot)).toBe(true);
    advance(definition.castMs);
  };
  return {system,definition,player,events,targets,hits,chilled,hidden,add,advance,use,stopAt:(x:number)=>{stopX=x;}};
}

function geometry(definition:AbilityDefinition, augmented=false) {
  const shape=definition.shape;
  switch(shape.kind) {
    case 'dash':return {length:shape.distance,width:shape.width};
    case 'circle':return {radius:definition.id==='napalm-charge'&&augmented?80:shape.radius};
    case 'cone':return {length:shape.range,arcRadians:shape.arcRadians};
    case 'line':return {length:shape.length,width:shape.width};
    case 'wall':return {length:shape.length,width:shape.thickness};
    case 'chain':return {length:shape.range,hopRange:shape.hopRange,maxTargets:shape.maxTargets+(augmented?2:0)};
  }
}

const definitions=Object.values(ABILITY_CATALOG);
for(const definition of definitions) {
  const variants: Array<{name:string; mutations:readonly MutationId[]}>=
    [{name:'native',mutations:[]},...universal.map(id=>({name:id,mutations:[id]}))];
  const augment=rigAugments[definition.id];
  if(augment)variants.push({name:augment,mutations:[augment]});
  describe(`${definition.id} public geometry`,()=>{
    for(const variant of variants)it(`${variant.name} keeps cast, impact and persistent geometry consistent`,()=>{
      const w=world(definition.id,variant.mutations);
      w.use();
      if(definition.slot==='dash')w.advance(140);
      const expected=geometry(definition,variant.name===augment);
      const casts=w.events.filter(e=>e.phase==='cast');
      const impacts=w.events.filter(e=>e.phase==='impact');
      expect(casts.length).toBeGreaterThan(0);
      expect(impacts.length).toBeGreaterThan(0);
      for(const event of [...casts,...impacts]) {
        if(definition.id==='flashfire'&&event.radius!==undefined) {
          expect(event).toMatchObject({targetX:180,targetY:0,radius:120});
        } else expect(event).toMatchObject(expected);
      }
      const snapshot=w.system.snapshot;
      for(const entity of snapshot.deployables) {
        const matches=(event:Receipt)=>event.targetX===entity.x&&event.targetY===entity.y;
        const cast=casts.find(matches),impact=impacts.find(matches);
        expect(cast).toBeDefined();expect(impact).toBeDefined();
        if(entity.kind==='pylon') {
          expect(cast!.radius).toBe(220);expect(impact!.radius).toBe(220);
          expect(entity.radius).toBe(18);
        } else {
          expect(cast).toMatchObject({length:entity.length,width:entity.thickness});
          expect(impact).toMatchObject({length:entity.length,width:entity.thickness});
        }
        expect(w.events.find(e=>e.phase==='tick'&&e.entityId===entity.id)).toMatchObject({x:entity.x,y:entity.y,...expected});
      }
      for(const zone of snapshot.zones) {
        const tick=w.events.find(e=>e.phase==='tick'&&e.entityId===zone.id);
        expect(tick).toMatchObject({x:zone.x,y:zone.y,radius:zone.radius,width:zone.width,targetX:zone.x2,targetY:zone.y2});
        if(zone.shape==='circle') {
          const matches=(event:Receipt)=>event.targetX===zone.x&&event.targetY===zone.y&&event.radius===zone.radius;
          expect(casts.some(matches)).toBe(true);
          expect(impacts.some(matches)).toBe(true);
        } else {
          expect(tick!.length).toBeCloseTo(Math.hypot(zone.x2-zone.x,zone.y2-zone.y));
        }
      }
    });
  });
}

describe('review: altered shapes have exact telegraphs and hit boundaries',()=>{
  it('Spreading Nova captures 230 radius before applying fresh chill and reports the same cast/impact area',()=>{
    const w=world('cryo-nova',['spreading-nova']);
    w.chilled.add(w.add(100).id);
    const inside=w.add(230),outside=w.add(230.001);
    w.use();
    for(const phase of ['cast','impact'])expect(w.events.find(e=>e.phase===phase)).toMatchObject({radius:230});
    expect(w.hits.some(h=>h.id===inside.id)).toBe(true);
    expect(w.hits.some(h=>h.id===outside.id)).toBe(false);
  });

  it('Spreading Nova caps extra radius at 100 and excludes hidden pre-chilled targets from growth',()=>{
    const w=world('cryo-nova',['spreading-nova']);
    for(let n=0;n<7;n++)w.chilled.add(w.add(100+n).id);
    const inside=w.add(310),outside=w.add(310.001);
    w.use();
    expect(w.events.filter(e=>e.phase==='cast'||e.phase==='impact').every(e=>e.radius===310)).toBe(true);
    expect(w.hits.some(h=>h.id===inside.id)).toBe(true);expect(w.hits.some(h=>h.id===outside.id)).toBe(false);
    const hidden=world('cryo-nova',['spreading-nova']);
    const source=hidden.add(100);hidden.chilled.add(source.id);hidden.hidden.add(source.id);
    hidden.use();expect(hidden.events.find(e=>e.phase==='cast')).toMatchObject({radius:210});
  });

  it('Afterquake uses the same 230-radius telegraph and exact boundary for its delayed pulse',()=>{
    const w=world('seismic-slam',['afterquake']);w.use();
    const inside=w.add(230),outside=w.add(230.001);w.advance(450);
    expect(w.events.filter(e=>e.phase==='cast'||e.phase==='impact').every(e=>e.radius===230)).toBe(true);
    expect(w.hits).toEqual([{id:inside.id,amount:35}]);
    expect(w.hits.some(h=>h.id===outside.id)).toBe(false);
  });

  for(const [ability,augment] of [['bulwark','reinforced-bulwark'],['glacier','twin-glacier']] as const) {
    it(`${augment} rectangle reaches its advertised flat face and stops immediately outside`,()=>{
      const w=world(ability,[augment]);w.use();
      const wall=w.system.snapshot.deployables[0];
      const inside={x:wall.x+wall.thickness/2,y:wall.y+wall.length/2};
      const outside={...inside,x:inside.x+.001};
      expect(w.system.blocksMovement(inside,inside,0)).toBe(true);
      expect(w.system.blocksMovement(outside,outside,0)).toBe(false);
      expect(w.events.find(e=>e.phase==='cast'&&e.targetX===wall.x)).toMatchObject({length:wall.length,width:wall.thickness});
    });
  }

  it('Scorched Fan adds a distinct circle cast/impact and burns exactly inside its 120-radius pool',()=>{
    const w=world('flashfire',['scorched-fan']);
    const inside=w.add(180,120),outside=w.add(180,120.001);w.use();
    for(const phase of ['cast','impact']) {
      const events=w.events.filter(e=>e.phase===phase);
      expect(events).toHaveLength(2);
      const circle=events.find(e=>e.radius===120)!;
      expect(circle).toMatchObject({targetX:180,targetY:0});
      expect(circle.length).toBeUndefined();expect(circle.arcRadians).toBeUndefined();
      expect(events.find(e=>e.arcRadians!==undefined)).toMatchObject({length:300,arcRadians:1.22});
    }
    const groundTicks=w.events.filter(e=>e.phase==='tick'&&e.radius===120);
    expect(groundTicks.length).toBeGreaterThan(0);
    for(const tick of groundTicks) {
      expect(tick.length).toBeUndefined();expect(tick.arcRadians).toBeUndefined();
    }
    w.advance(250);
    expect(w.hits.filter(h=>h.amount===4)).toEqual([{id:inside.id,amount:4}]);
    expect(w.hits.some(h=>h.id===outside.id&&h.amount===4)).toBe(false);
  });

  it('Napalm Triplet reports every 80-radius impact and hits the exact outside edge of the outer pool',()=>{
    const w=world('napalm-charge',['napalm-triplet']);
    const inside=w.add(300,180),outside=w.add(300,180.001);w.use();
    const impacts=w.events.filter(e=>e.phase==='impact');
    expect(impacts.map(e=>({x:e.targetX,y:e.targetY,radius:e.radius}))).toEqual([-100,0,100].map(y=>({x:300,y,radius:80})));
    w.advance(250);
    expect(w.hits).toEqual([{id:inside.id,amount:6.5}]);
    expect(w.hits.some(h=>h.id===outside.id)).toBe(false);
  });

  for(const augmented of [false,true])it(`Overload advertises its ${augmented?'eight':'six'}-target cap and exact 200 hop range`,()=>{
    const w=world('overload',augmented?['forked-overload']:[]);
    const first=w.add(100),edge=w.add(300),outside=w.add(500.001);
    w.system.setIntent(0,0,first);w.use();
    const cap=augmented?8:6;
    for(const event of w.events.filter(e=>e.phase==='cast'||e.phase==='impact'))expect(event).toMatchObject({length:520,hopRange:200,maxTargets:cap});
    expect(w.hits.map(h=>h.id)).toEqual([first.id,edge.id]);
    expect(w.hits.some(h=>h.id===outside.id)).toBe(false);
    const saturated=world('overload',augmented?['forked-overload']:[]);
    for(let n=0;n<10;n++)saturated.add(50+n*40);
    saturated.system.setIntent(0,0,{x:50,y:0});saturated.use();
    expect(saturated.hits).toHaveLength(cap);
  });

  it('Twin Pylon emits one impact per 220-radius zap footprint and preserves exact zap range',()=>{
    const w=world('tesla-pylon',['twin-pylon']);w.use();
    const pylons=w.system.snapshot.deployables;
    expect(w.events.filter(e=>e.phase==='impact').map(e=>({x:e.targetX,y:e.targetY,radius:e.radius})))
      .toEqual(pylons.map(p=>({x:p.x,y:p.y,radius:220})));
    const inside=w.add(520,-50),outside=w.add(520.001,-50);w.advance(500);
    expect(w.hits.filter(h=>h.amount===26)).toEqual([{id:inside.id,amount:26}]);
    expect(w.hits.some(h=>h.id===outside.id)).toBe(false);
  });

  for(const ability of ['frost-trail','afterburn'] as const)it(`${ability} advertises the shortened actual strip when a dash hits a wall`,()=>{
    const w=world(ability);w.stopAt(60);w.use();w.advance(100);
    const zone=w.system.snapshot.zones[0];
    expect(zone).toMatchObject({x:0,y:0,x2:60,y2:0,width:44});
    expect(w.events.find(e=>e.phase==='tick'&&e.entityId===zone.id)).toMatchObject({length:60,targetX:60,targetY:0,width:44});
  });
});
