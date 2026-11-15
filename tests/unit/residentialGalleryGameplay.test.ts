import {describe, it, expect} from 'vitest';
import {DepthGame, type GameEffect} from '../../src/DepthGame';
import {generateRun} from '../../src/game/roguelike/run';
import {expeditionRewardOffers} from '../../src/game/roguelike/expedition';
import {createExpeditionGeometry, canOccupyExpedition, canTraverseExpedition, hasClearExpeditionShot} from '../../src/game/world/expeditionGeometry';
import {FacilityNavigation} from '../../src/game/world/FacilityNavigation';
import {ProjectileHitTracker} from '../../src/game/combat/CombatSystem';
import {STORY_ROOM_TEMPLATES} from '../../src/game/roguelike/storyRoomTemplates';
import {SHIP_STANDARD_PLANS} from '../../src/game/roguelike/shipArchitectureStandards';
import {ENEMIES} from '../../src/game/enemies/catalog';

const node = generateRun(3, 3).nodes.find(n => n.templateId === 'residential-gallery')!;
const point = (x: number, y: number) => ({x, y});
const template=STORY_ROOM_TEMPLATES['residential-gallery'];
const solids=template.obstacles.map(r=>[r.x,r.y,r.width,r.height]);
const families = ['crawler', 'brute', 'spitter'] as const;
const geometry = () => createExpeditionGeometry(node);
// Isolated geometry probes leave the director idle. Rebuild enemies after selecting
// Gallery so movement, attack visibility AND room-3 balance are production values.
const setup = (emit: (e: GameEffect) => void = () => {}) => {
  const game = new DepthGame(emit);
  game.node = node;
  game.geometry = geometry();
  game.navigation = new FacilityNavigation(game.geometry);
  game.enemies = game['makeEnemies']();
  game.status = 'playing';
  Object.assign(game.player, game.geometry.playerSpawn);
  return game;
};
const routes = [
 [[200,200],[200,480],[1100,480]],
 [[200,220],[600,220],[984,220],[1060,480]],
 [[200,740],[600,740],[984,740],[1060,480]],
 [[600,220],[600,740]],
 [[200,220],[200,480],[600,480],[600,220],[200,220]],
 [[984,220],[1060,480],[984,740],[600,740],[600,480],[984,480],[984,220]],
 [[216,80],[216,220],[600,220],[600,80]],
].map(route=>route.map(([x,y])=>point(x,y)));
const targets=SHIP_STANDARD_PLANS['residential-gallery'].spaces.map(s=>s.anchor);
// Hull-connected and adjoining faces cannot be approached from outside the ship
// or through another solid. Test every exposed face, including cabin partitions.
const collisionRects=[...solids,...template.voids!.map(poly=>{const xs=poly.map(p=>p.x),ys=poly.map(p=>p.y);return[Math.min(...xs),Math.min(...ys),Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)];})];
const faces = collisionRects.flatMap(([x,y,w,h]) => [
  {face:point(x,y+h/2), normal:point(-1,0)},
  {face:point(x+w,y+h/2), normal:point(1,0)},
  {face:point(x+w/2,y), normal:point(0,-1)},
  {face:point(x+w/2,y+h), normal:point(0,1)},
]).filter(({face,normal})=>canOccupyExpedition(geometry(),point(face.x+normal.x*60,face.y+normal.y*60),16)&&canOccupyExpedition(geometry(),point(face.x+normal.x*15,face.y+normal.y*15),14));
const outward = (p: {x:number;y:number}, n: {x:number;y:number}, d: number) => point(p.x+n.x*d,p.y+n.y*d);

describe('Residential Gallery production gameplay', () => {
  it('walks the gallery, cabin side doors, cross connections and both end bays with actual player updates', () => {
    const game = setup();
    for (const radius of [16, ...families.map(f => ENEMIES[f].radius)]) {
      for (const route of routes) for (let i=1;i<route.length;i++) {
        expect(canTraverseExpedition(game.geometry,route[i-1],route[i],radius), JSON.stringify({radius,route,i})).toBe(true);
      }
    }
    for (const route of routes) {
      Object.assign(game.player,route[0]);
      for (const target of route.slice(1)) {
        for (let frame=0;frame<300 && Math.hypot(target.x-game.player.x,target.y-game.player.y)>2;frame++) {
          const dx=target.x-game.player.x, dy=target.y-game.player.y;
          game.update(Math.min(50,Math.hypot(dx,dy)/220*1000), {x:dx,y:dy,fire:false,angle:null,autoAim:false});
          expect(canOccupyExpedition(game.geometry,game.player,16)).toBe(true);
        }
        expect(Math.hypot(target.x-game.player.x,target.y-game.player.y),JSON.stringify(target)).toBeLessThan(2);
      }
    }
  });

  it.each(families.flatMap(family => targets.flatMap(target => geometry().breaches.map(breach => ({family,target,breach})))))('routes $family from $breach.id to $target and attacks without clipping', ({family,target,breach}) => {
      const game=setup(); Object.assign(game.player,target);
      const start=point(breach.x+(breach.facing==='east'?56:-56),breach.y);
      expect(canOccupyExpedition(game.geometry,start,ENEMIES[family].radius)).toBe(true);
      expect(game['spawn'](family,start.x,start.y)).toBe(true);
      const initial=game.enemies.snapshot.enemies[0];
      const safetyDistance=initial.radius+game.player.radius+80;
      expect(canOccupyExpedition(game.geometry,initial,initial.radius)).toBe(true);
      expect(Math.hypot(initial.x-target.x,initial.y-target.y)).toBeGreaterThan(safetyDistance);
      if(Math.hypot(start.x-target.x,start.y-target.y)>safetyDistance)expect(point(initial.x,initial.y)).toEqual(start);
      else expect(Math.hypot(initial.x-start.x,initial.y-start.y)).toBeLessThanOrEqual(20+Math.sqrt(24)*18);
      expect(initial.radius).toBe(ENEMIES[family].radius); // brute is 28, not the radius-38 warning envelope.
      let attacked=false;
      const step = () => {
        const before=game.enemies.getSnapshot(initial.id)!;
        game.navigation.prepare(game.player,1);
        const events=game.enemies.update(50,game.player);
        const enemy=game.enemies.getSnapshot(initial.id)!;
        expect(canOccupyExpedition(game.geometry,enemy,enemy.radius)).toBe(true);
        expect(canTraverseExpedition(game.geometry,before,enemy,enemy.radius)).toBe(true);
        for (const event of events) {
          if (event.type==='attack-warning' && family==='spitter' || event.type==='hazard-attack') {
            const distance=Math.hypot(enemy.x-game.player.x,enemy.y-game.player.y);
            expect(hasClearExpeditionShot(game.geometry,enemy,game.player)).toBe(true);
            expect(distance).toBeGreaterThanOrEqual(180);
            expect(distance).toBeLessThanOrEqual(420);
          }
        }
        attacked ||= events.some(e => e.type===(family==='spitter'?'hazard-attack':'contact-attack'));
        return enemy;
      };
      if (family==='spitter') {
        // The unchanged stationary fixture must first yield clear LOS in range.
        // No relocation can rescue a blocked-LOS stall.
        let enemy=initial;
        const opportunityLine = () => hasClearExpeditionShot(game.geometry,enemy,game.player)
          && Math.hypot(enemy.x-game.player.x,enemy.y-game.player.y)<=420;
        for (let frame=0;frame<1200 && !opportunityLine();frame++) enemy=step();
        expect(opportunityLine(),JSON.stringify({start,target,last:enemy})).toBe(true);
        if (Math.hypot(enemy.x-game.player.x,enemy.y-game.player.y)<180) {
          // Clear LOS inside the intentional deadzone is not a firing opportunity.
          expect(attacked).toBe(false);
          const candidates=Array.from({length:72},(_,i)=>point(
            enemy.x+280*Math.cos(i*Math.PI/36),enemy.y+280*Math.sin(i*Math.PI/36)));
          const legal=candidates.find(p=>canOccupyExpedition(game.geometry,p,16)
            && canTraverseExpedition(game.geometry,game.player,p,16)
            && hasClearExpeditionShot(game.geometry,enemy,p));
          expect(legal,'reachable player reposition to a legal firing range').toBeDefined();
          Object.assign(game.player,legal!); // Fixture relocation, not a simulated player walk.
        }
        const distance=Math.hypot(enemy.x-game.player.x,enemy.y-game.player.y);
        expect(distance).toBeGreaterThanOrEqual(180);
        expect(distance).toBeLessThanOrEqual(420);
        expect(hasClearExpeditionShot(game.geometry,enemy,game.player)).toBe(true);
        for (let frame=0;frame<100 && !attacked;frame++) step();
      } else {
        for (let frame=0;frame<1200 && !attacked;frame++) step();
      }
      expect(attacked,JSON.stringify({family,start,target,last:game.enemies.snapshot.enemies[0]})).toBe(true);
      expect(hasClearExpeditionShot(game.geometry,game.enemies.getSnapshot(initial.id)!,game.player)).toBe(true);
  });

  it('keeps gallery and cross-cabin shots open and furnished rear banks blocked', () => {
    const g=geometry();
    for (const [from,to] of [[point(180,480),point(1020,480)],[point(600,180),point(600,780)]]) {
      expect(hasClearExpeditionShot(g,from,to)).toBe(true);
      for (const kind of ['player','hazard'] as const) {
        const events:GameEffect[]=[], game=setup(e=>events.push(e));
        const distance=Math.hypot(to.x-from.x,to.y-from.y);
        game.bullets.push({kind,...from,life:2,request:{weaponId:'plasma',damage:20,speed:1000,radius:9,angle:Math.atan2(to.y-from.y,to.x-from.x),penetration:1,splashRadius:0,knockback:0},tracker:new ProjectileHitTracker(1)});
        for (let remaining=distance/1000;remaining>0;remaining-=.05) game['updateBullets'](Math.min(.05,remaining));
        expect(game.bullets).toHaveLength(1);
        expect(game.bullets[0].x).toBeCloseTo(to.x); expect(game.bullets[0].y).toBeCloseTo(to.y);
        expect(events).toEqual([]);
      }
    }
    for (const [x,y,w,h] of solids) expect(hasClearExpeditionShot(g,point(x-60,y+h/2),point(x+w+60,y+h/2))).toBe(false);
  });

  it('stops real player/hazard shots and grenade motion at every solid face, preserving fuse and impact normals', () => {
    expect(faces.length).toBeGreaterThanOrEqual(24);
    for (const {face,normal} of faces) for (const kind of ['player','hazard','grenade'] as const) {
      const events:GameEffect[]=[], game=setup(e=>events.push(e));
      const start=outward(face,normal,60), previous=outward(face,normal,11);
      expect(canOccupyExpedition(game.geometry,start,16)).toBe(true);
      game.bullets.push({kind,...start,life:1.1,request:{weaponId:'shotgun',damage:20,speed:1000,radius:7,angle:Math.atan2(-normal.y,-normal.x),penetration:1,splashRadius:kind==='grenade'?80:0,knockback:0},tracker:new ProjectileHitTracker(1)});
      for (let i=0;i<7;i++) game['updateBullets'](.007);
      expect(events).toEqual([]); expect(game.bullets).toHaveLength(1);
      expect(game.bullets[0].x).toBeCloseTo(previous.x); expect(game.bullets[0].y).toBeCloseTo(previous.y);
      game['updateBullets'](.007);
      if (kind==='grenade') {
        expect(events).toEqual([]); expect(game.bullets[0].request.speed).toBe(0);
        game['updateBullets'](.5); expect(events).toEqual([]);
        expect(game.bullets[0].x).toBeCloseTo(previous.x); expect(game.bullets[0].y).toBeCloseTo(previous.y);
        game['updateBullets'](.55);
      }
      expect(game.bullets).toHaveLength(0); expect(events).toHaveLength(1);
      const event=events[0], expected=kind==='player'?face:previous;
      expect(event.type).toBe(kind==='grenade'?'explosion':'hit');
      expect(event.x).toBeCloseTo(expected.x); expect(event.y).toBeCloseTo(expected.y);
      if (kind==='player') expect(event.wall).toEqual(normal);
    }
  });

  it('damages an exposed target but not a target behind the northwest cabin with real grenade splash', () => {
    const game=setup();
    const exposed=game.enemies.spawn('crawler',340,200), shielded=game.enemies.spawn('crawler',448,160);
    if (!exposed.spawned || !shielded.spawned) throw new Error('illegal splash fixture');
    const before=game.enemies.getSnapshot(shielded.enemy.id)!.health;
    game.bullets.push({kind:'grenade',x:376,y:120,life:.01,request:{weaponId:'rocket',damage:20,speed:0,radius:7,angle:0,penetration:1,splashRadius:300,knockback:0},tracker:new ProjectileHitTracker(1)});
    game['updateBullets'](.02);
    expect(game.enemies.getSnapshot(exposed.enemy.id)!.health).toBeLessThan(exposed.enemy.health);
    expect(game.enemies.getSnapshot(shielded.enemy.id)!.health).toBe(before);
  });

  it('collects legal real drops at every corner and representative route position', () => {
    const positions=[...targets,...collisionRects.flatMap(([x,y,w,h])=>[point(x-28,y-28),point(x+w+28,y-28),point(x-28,y+h+28),point(x+w+28,y+h+28)])].filter(p=>canOccupyExpedition(geometry(),p,16));
    expect(positions.length).toBeGreaterThanOrEqual(20);
    for (const p of positions) {
      const events:GameEffect[]=[],game=setup(e=>events.push(e));
      expect(canOccupyExpedition(game.geometry,p,16)).toBe(true);
      game.navigation.prepare(game.player,1); expect(game.navigation.reachable(p)).toBe(true);
      let dropped=false;
      for (let i=0;i<100 && !dropped;i++) dropped=game.pickups.rollEnemyDrop('brute',p.x,p.y).dropped;
      expect(dropped).toBe(true); Object.assign(game.player,p); game.update(50);
      expect(game.pickups.snapshot).toHaveLength(0); expect(events.some(e=>e.type==='pickup')).toBe(true);
    }
  });

  it('blocks corner magnet shortcuts at every solid, then collects from an open approach', () => {
    const corners=collisionRects.flatMap(([x,y,w,h])=>[-1,1].flatMap(sx=>[-1,1].map(sy=>({x:sx>0?x+w:x,y:sy>0?y+h:y,sx,sy})))).filter(c=>[
     point(c.x-20*c.sx,c.y+28*c.sy),point(c.x+28*c.sx,c.y-20*c.sy),point(c.x+48*c.sx,c.y+20*c.sy)
    ].every(p=>canOccupyExpedition(geometry(),p,16)));
    expect(corners.length).toBeGreaterThanOrEqual(12);
    for (const corner of corners) {
      const game=setup(),{sx,sy}=corner;
      Object.assign(game.player,point(corner.x-20*sx,corner.y+28*sy));
      expect(game.pickups.spawn('credits',10,corner.x+28*sx,corner.y-20*sy).spawned).toBe(true);
      expect(canTraverseExpedition(game.geometry,game.pickups.snapshot[0],game.player,16)).toBe(false);
      const credits=game.combat.snapshot.credits;
      for (let i=0;i<10;i++) game.update(50);
      expect(game.pickups.snapshot).toHaveLength(1);
      expect(canOccupyExpedition(game.geometry,game.pickups.snapshot[0],16)).toBe(true);
      Object.assign(game.player,point(corner.x+48*sx,corner.y+20*sy));
      for (let i=0;i<20;i++) game.update(50);
      expect(game.pickups.snapshot).toHaveLength(0); expect(game.combat.snapshot.credits).toBe(credits+10);
    }
  });

  it('rejects uncollectable crawler-edge drops on every solid face', () => {
    for (const {face,normal} of faces) {
      const game=setup(), p=outward(face,normal,15);
      expect(canOccupyExpedition(game.geometry,p,ENEMIES.crawler.radius)).toBe(true);
      expect(canOccupyExpedition(game.geometry,p,16)).toBe(false);
      expect(game.pickups.spawn('credits',10,p.x,p.y)).toEqual({spawned:false,reason:'invalid'});
      const reasons=new Set<string>();
      for (let i=0;i<200;i++) {
        const result=game.pickups.rollEnemyDrop('crawler',p.x,p.y);
        expect(result.dropped).toBe(false); if (!result.dropped) reasons.add(result.reason);
      }
      expect([...reasons].sort()).toEqual(['chance','invalid-position']); expect(game.pickups.snapshot).toHaveLength(0);
    }
  });

  it('runs room 3 warnings, delayed mixed spawns, clear sweep, exact objective and reward route to Communal Atrium', () => {
    const events:GameEffect[]=[], game=new DepthGame(e=>events.push(e));
    game.newRun(137); game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
    const claim=()=>{const offers=expeditionRewardOffers(game.expedition); if(offers.length) game.chooseMutation(offers[0].id); else game.claimResources();};
    // Deterministic kills exercise real director/death/progression, not player combat skill.
    for (let room=0;room<2;room++) {
      let frames=0;
      for (;frames<2000 && game.status==='playing';frames++) {game.update(50); for(const enemy of game.enemies.snapshot.enemies) game.damage(enemy.id,100000);}
      expect(frames).toBeLessThan(2000); expect(game.status).toBe('reward'); claim(); game.route(game.node.next[0]);
    }
    expect(game.node.templateId).toBe('residential-gallery'); expect(game.node.depth).toBe(2);
    expect(game.expedition.run.currentNodeId).toBe(game.node.id);
    expect(game.storyRoom?.objective).toBe('Fight through the residential doorways.');
    const plan=game['director'].plan, chosen=game.geometry.breaches.find(b=>b.id===plan.schedule[0].breachId)!;
    Object.assign(game.player,chosen); events.length=0;
    for(let i=0;i<13;i++) game.update(50);
    const warning=events.find(e=>e.type==='enemy-warning')!;
    expect(warning).toBeDefined(); expect(warning.durationMs).toBe(650);
    const safe=[...game.geometry.breaches].sort((a,b)=>Math.hypot(b.x-chosen.x,b.y-chosen.y)-Math.hypot(a.x-chosen.x,a.y-chosen.y))[0];
    expect(warning.x).toBe(safe.x+(safe.facing==='east'?56:-56)); expect(warning.y).toBe(safe.y);
    expect(game.enemies.activeCount).toBe(0);
    for(let i=0;i<12;i++) game.update(50);
    expect(game.enemies.activeCount).toBe(0); game.update(50); expect(game.enemies.activeCount).toBe(1);
    const seen=new Set<number>(), actualFamilies=new Set<string>(); let frames=0,peak=0;
    for(;frames<2000 && game.status==='playing';frames++) {
      for(const enemy of game.enemies.snapshot.enemies) {seen.add(enemy.id); actualFamilies.add(enemy.type); expect(canOccupyExpedition(game.geometry,enemy,enemy.radius)).toBe(true);}
      peak=Math.max(peak,game.enemies.activeCount);
      if(frames>=30) for(const enemy of game.enemies.snapshot.enemies) game.damage(enemy.id,100000);
      if(game['director'].snapshot.remaining===0 && game.enemies.activeCount===0 && game['pending'].length===0) {
        game.pickups.reset(137); expect(game.pickups.spawn('credits',10,580,440).spawned).toBe(true);
        const credits=game.combat.snapshot.credits; game.update(50); expect(game.combat.snapshot.credits).toBe(credits+10); break;
      }
      game.update(50);
    }
    expect(frames).toBeLessThan(2000); expect(seen.size).toBe(plan.totalSpawns);
    expect(actualFamilies).toEqual(new Set(families)); expect(actualFamilies).toEqual(new Set(plan.schedule.map(s=>s.enemyId))); expect(peak).toBeGreaterThan(1);
    expect(game['director'].phase).toBe('complete'); expect(game.status).toBe('reward'); expect(game.encounterRemaining).toBe(0);
    expect(game.pickups.snapshot).toHaveLength(0); expect(game.expedition.run.completedNodeIds).toContain(game.node.id);
    expect(game.expedition.resources.credits).toBe(game.combat.snapshot.credits);
    claim(); expect(game.status).toBe('route'); game.route(game.node.next[0]);
    expect(game.node.templateId).toBe('communal-atrium'); expect(game.node.depth).toBe(3); expect(game.status).toBe('playing');
  });
});
