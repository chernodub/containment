import {afterEach, beforeAll, expect, it, vi} from 'vitest';
import * as T from 'three';
import {DepthGame} from '../src/DepthGame';
import type {DepthRenderer} from '../src/render/DepthRenderer';
import {CameraRig} from '../src/render/camera/CameraRig';
import {HudCombatFraming} from '../src/render/camera/HudCombatFraming';
import {RoomCombatFraming} from '../src/render/camera/RoomCombatFraming';
import {COMBAT_VIEW_HEIGHT, combatFocusTarget, protectPlayerFrame} from '../src/render/camera/CombatFraming';
import {roomFocus} from '../src/render/roomFraming';
import {installDebug} from '../scripts/nextgen/debug';
import {loadModels} from './loadModels';
import {alien,marine,disposeModel} from '../src/render/models';
// @ts-expect-error The capture functions intentionally run as serialized JavaScript.
import {stageKiting, advanceKiting, stageCombat} from '../scripts/nextgen/scenarios.mjs';
// @ts-expect-error Native capture fixture is serialized self-contained JavaScript.
import {stageC6Families} from '../scripts/nextgen/c6-scenarios.mjs';
// @ts-expect-error Native death/packing fixture is serialized JavaScript.
import {stageCorpseBudget} from '../scripts/nextgen/i8-scenarios.mjs';

// CPU integration only: real simulation/geometry and native camera mathematics,
// without WebGL, a browser, HUD DOM or claims about pixel/asset correctness.
const heights=new Map<string,number>();let marineHeight=2.05;
beforeAll(async()=>{
  await loadModels();const body=marine();marineHeight=body.height;body.stop?.();disposeModel(body.root);
  for(const family of ['crawler','spitter','brute','carrier','stalker'])for(const elite of [false,true])for(const champion of [undefined,...(elite&&family==='brute'?['warden']:elite&&family==='carrier'?['matron']:[])]){
    const model=alien(family,elite);model.setThreat?.(0,null,champion as 'warden'|'matron'|undefined);
    heights.set(`${family}:${elite}:${champion??''}`,model.height);model.stop?.();disposeModel(model.root);
  }
});
function setup(width: number, height: number) {
  const target: Record<string, any> = {};
  vi.stubGlobal('window', target);
  vi.stubGlobal('innerWidth',width);vi.stubGlobal('innerHeight',height);
  vi.stubGlobal('location', {search: '?debug=1&seed=1729'});
  const camera = new T.PerspectiveCamera(28, width / height, .1, 160);
  const rig = new CameraRig(), hud = new HudCombatFraming(), roomFraming = new RoomCombatFraming();
  hud.resize(width, height);
  hud.setInsets({top: 182, right: 292, bottom: height === 720 ? 108 : 120, left: 0});
  const desired = new T.Vector3(), point = new T.Vector3(), scratch = new T.Vector3(), focus = new T.Vector3();
  let room = '', muzzleLife = 0;const nativeActorIds=new Set<number>();
  const renderer = {
    muzzle: {intensity: 0}, corpses:[] as {id:number}[], beginGameplayPresentation:vi.fn(), roomLoading: false,
    camera,cameraRig:rig,roomCombatFraming:roomFraming,hudInsets:{top:182,right:292,bottom:height===720?108:120,left:0},viewportWidth:width,viewportHeight:height,
    player:{root:new T.Group(),height:marineHeight},actors:new Map<number,{height:number}>(),
    actorScreenBounds(id:number,x:number,y:number,radius:number,box:{left:number;right:number;top:number;bottom:number}){
      const actor=this.actors.get(id);if(!actor)return false;box.left=box.top=Infinity;box.right=box.bottom=-Infinity;
      for(const ix of [-1,1])for(const iz of [-1,1])for(const iy of [0,1]){point.set((x+ix*radius)/32,iy*actor.height,(y+iz*radius)/32).project(camera);const sx=(point.x+1)*width/2,sy=(1-point.y)*height/2;box.left=Math.min(box.left,sx);box.right=Math.max(box.right,sx);box.top=Math.min(box.top,sy);box.bottom=Math.max(box.bottom,sy);}
      return true;
    },
    // Production prepare reloads even the same node: reset presentation state
    // on a legal lane retry rather than carrying the prior trial's spring.
    prepare: async () => {room='';muzzleLife=0;nativeActorIds.clear();},
    effect(event: {type: string}) {if (event.type === 'shot') muzzleLife = .045;},
    render(game: DepthGame, dt = 0) {
      muzzleLife -= dt;
      this.muzzle.intensity = muzzleLife > 0 ? 6 * Math.min(1, muzzleLife / .035) : 0;
      const p = game.player, b = game.geometry.bounds;
      this.player.root.position.set(p.x/32,0,p.y/32);this.actors.clear();for(const e of game.enemies.snapshot.enemies)this.actors.set(e.id,{height:heights.get(`${e.type}:${e.elite}:${e.champion??''}`)??3.2});
      if (room !== game.node.id) {
        room = game.node.id;
        const initial = roomFocus(p.x / 32, p.y / 32, b.width / 32, b.height / 32, COMBAT_VIEW_HEIGHT * width / height, COMBAT_VIEW_HEIGHT, game.node.templateId);
        rig.reset(initial.x, initial.z);
        roomFraming.reset();
        nativeActorIds.clear();
      }
      combatFocusTarget(p.x / 32, p.y / 32, p.angle, 0, 0, false, false, desired);
      hud.selectContacts(p.x / 32, p.y / 32, p.angle, game.enemies.snapshot.enemies, 32, id => {
        const e=game.enemies.getSnapshot(id);
        return e&&nativeActorIds.has(id)?heights.get(`${e.type}:${e.elite}:${e.champion??''}`)??3.2:3.2;
      });
      hud.biasTarget(p.x / 32, p.y / 32, p.angle, false, false, desired);
      const bounded = roomFocus(desired.x, desired.z, b.width / 32, b.height / 32, COMBAT_VIEW_HEIGHT * width / height, COMBAT_VIEW_HEIGHT, game.node.templateId);
      if (!hud.hasEngagement) desired.set(bounded.x, 0, bounded.z);
      rig.update(dt, desired.x, desired.z, 0, false);
      rig.apply(camera, 1, COMBAT_VIEW_HEIGHT, 0);
      focus.copy(rig.focus);
      hud.center(camera, rig.focus, point, scratch);
      hud.protectEngagement(camera, focus, p.x / 32, p.y / 32, p.radius / 32, marineHeight, point, scratch);
      protectPlayerFrame(camera, rig.focus, p.x / 32, p.y / 32, p.radius / 32, marineHeight, point, scratch, hud.viewport);
      roomFraming.apply(camera, rig.focus, p.x / 32, p.y / 32, p.radius / 32, marineHeight, b.width / 32, b.height / 32, hud.viewport, height, dt, false, game.geometry.boundary, hud);
      hud.refreshFit(camera, point);
      nativeActorIds.clear();for(const e of game.enemies.snapshot.enemies)nativeActorIds.add(e.id);
    },
    visible(x: number, y: number) {
      point.set(x / 32, .6, y / 32).project(camera);
      const v = hud.viewport;
      return point.z >= -1 && point.z <= 1 && Math.abs(point.x - v.centerX) < v.halfX * .9 && Math.abs(point.y - v.centerY) < v.halfY * .8;
    },
  };
  const game = new DepthGame(event => renderer.effect(event));
  installDebug(game, renderer as unknown as DepthRenderer, () => {}, () => {});
  return {game, renderer, debug: target.__containmentDebug};
}

afterEach(() => vi.unstubAllGlobals());

const rooms = ['awakening-bay', 'passenger-vault', 'residential-gallery', 'communal-atrium', 'crew-checkpoint', 'armory', 'freight-hold', 'breached-loading-bay', 'relay-racks', 'transmission-chamber', 'diagnostic-gallery', 'safety-interlock-station', 'coolant-plant', 'service-shaft-landing', 'infested-workshop', 'swarm-junction', 'shielding-gate', 'containment-annulus', 'manual-control-chamber', 'overload-floor'];
for (const [width, height] of [[1280, 720], [1920, 1080]]) {
  it.each(rooms)(`packs legal kiting bodies in the native ${width}×${height} HUD footprint: %s`, async room => {
    const {game, renderer, debug} = setup(width, height);
    await debug.gotoRoom(room, {rig: 'cryo'});
    expect(renderer.beginGameplayPresentation).toHaveBeenCalled();
    const result = await stageKiting();
    expect(result.initialVisible).toBeGreaterThanOrEqual(room === 'communal-atrium' ? 15 : 18);
    expect(result.placedVisible).toBeGreaterThanOrEqual(room === 'communal-atrium' ? 15 : 18);
    expect(result.staged).toBeGreaterThanOrEqual(18);
    expect(result.laneAttempt).toBeLessThan(32);
    expect(result.packingExclusion).toBeGreaterThanOrEqual(110);
    expect(result.minimumSpawnClearance).toBeGreaterThanOrEqual(12);
    expect(result.packingPasses.length).toBeGreaterThan(0);
    expect(result.packingPasses.length).toBeLessThanOrEqual(6);
    for (const [n, a] of result.packingPoints.entries()) for (const b of result.packingPoints.slice(n + 1)) expect(Math.hypot(a.x-b.x,a.y-b.y)).toBeGreaterThanOrEqual(65.01-1e-6);
    for (const enemy of game.enemies.snapshot.enemies) expect(debug.canStand(enemy.x, enemy.y, enemy.radius)).toBe(true);
    for (let frame = 0; frame < 4; frame++) {
      advanceKiting({frame, stepMs: 150});
      expect(game.enemies.snapshot.enemies.filter(e => e.health > 0 && renderer.visible(e.x, e.y)).length, `frame ${frame}`).toBeGreaterThanOrEqual(12);
      expect(game.status).toBe('playing');
    }
    expect(game.stats.abilityUses).toMatchObject({dash: 1, tactical: 1, power: 1, overdrive: 1});
  });
  it.each(['awakening-bay', 'communal-atrium', 'containment-annulus', 'passenger-vault', 'overload-floor', 'breached-loading-bay'])(`retains twelve heavy bodies after real combat at ${width}×${height}: %s`, async room => {
    const {game, renderer, debug} = setup(width, height);
    await debug.gotoRoom(room);
    expect(renderer.beginGameplayPresentation).toHaveBeenCalled();
    const staged = stageCombat({status: false});
    expect(staged.plasmaLaneProof).toMatchObject({minimumTravel:60,bodyHalfWidth:60,simulationAdvancedMs:0});
    expect(staged.plasmaLaneProof.tested).toBeLessThanOrEqual(192);
    if(!['breached-loading-bay','overload-floor'].includes(room)||staged.plasmaLaneProof.coarseClearance>=60)expect(staged.plasmaLaneProof.tested).toBe(48);
    expect(staged.plasmaLaneProof.clearance).toBeGreaterThanOrEqual(60);
    expect(renderer.muzzle.intensity).toBeGreaterThan(0);
    expect(game.bullets.some(b => b.kind === 'player')).toBe(true);
    expect(debug.events.some((e: {type: string;at: number}) => e.type === 'explosion' && game.elapsed - e.at < .25)).toBe(true);
    for (let frame = 0; frame < 4; frame++) {
      if (frame) debug.step(150);
      expect(game.enemies.snapshot.enemies.filter(e => e.health > 0 && renderer.visible(e.x, e.y)).length, `frame ${frame}`).toBeGreaterThanOrEqual(12);
      expect(game.status).toBe('playing');
    }
  });
}

// A native burst does more zero-delta presentation work than a bare simulation
// step: inspectFrame and screenshot RAFs refresh the unchanged snapshot. The
// legal Relay reserve must survive that boundary as well as all4 native casts.
it.each([[1280,720],[1920,1080]])('retains Relay bodies and native movement across capture refreshes at %i×%i',async(width,height)=>{
  const {game,renderer,debug}=setup(width,height);
  await debug.gotoRoom('freight-hold',{rig:'cryo'});
  await stageKiting();for(let frame=0;frame<4;frame++)advanceKiting({frame,stepMs:150});
  await debug.gotoRoom('relay-racks',{rig:'cryo'});
  const staged=await stageKiting();expect(staged.initialVisible).toBeGreaterThanOrEqual(18);expect(staged.staged).toBeGreaterThanOrEqual(18);expect(staged.staged).toBeLessThanOrEqual(26);
  let previous={x:game.player.x,y:game.player.y};
  for(let frame=0;frame<4;frame++){
    advanceKiting({frame,stepMs:150});
    if(frame)expect(Math.hypot(game.player.x-previous.x,game.player.y-previous.y)).toBeGreaterThan(1);
    previous={x:game.player.x,y:game.player.y};
    const elapsed=game.elapsed;
    for(let refresh=0;refresh<8;refresh++){
      renderer.render(game,0);
      expect(game.enemies.snapshot.enemies.filter(e=>e.health>0&&renderer.visible(e.x,e.y)).length,`phase${frame},refresh${refresh}`).toBeGreaterThanOrEqual(12);
      expect(game.elapsed).toBe(elapsed);
    }
  }
  expect(game.stats.abilityUses).toMatchObject({dash:1,tactical:1,power:1,overdrive:1});
  expect(game.status).toBe('playing');
});


// Same actual body-height/camera adapter as native packing: the720 HUD reserves
// substantial vertical space, so center-point or wide-camera counts are not proof.
it.each(['containment-annulus','infested-workshop','overload-floor','awakening-bay','communal-atrium','armory','breached-loading-bay','relay-racks','safety-interlock-station','service-shaft-landing'])('packs native720 family bodies without reducing coverage: %s',async room=>{
  const {game,renderer,debug}=setup(1280,720);await stageC6Families(room);
  const proof=debug.i8FamilyProof;if(room==='containment-annulus'){expect(proof.packingMode).toBe('native-hex-fallback');expect(proof.fallbackTrials.length).toBeGreaterThan(0);for(const trial of proof.fallbackTrials){expect(trial.seedMode).toBe('nearby-annulus');expect(trial.seedNearest).toBeGreaterThanOrEqual(105);expect(trial.seedNearest).toBeLessThanOrEqual(176);expect(trial.seedFarthest).toBeLessThan(400);}}expect(proof.requested).toBe(15);expect(proof.fullBodyCount).toBeGreaterThanOrEqual(12);expect(new Set(proof.actors.map((p:{family:string})=>p.family)).size).toBe(5);
  for(const [n,a]of proof.actors.entries())for(const b of proof.actors.slice(n+1))expect(Math.hypot(a.x-b.x,a.y-b.y)).toBeGreaterThanOrEqual(76-1e-6);
  const elapsed=game.elapsed,box={left:0,right:0,top:0,bottom:0};
  for(let refresh=0;refresh<4;refresh++){
    renderer.render(game,0);expect(game.elapsed).toBe(elapsed);
    const frame=renderer.roomCombatFraming.diagnostics;expect(frame.heroPixels*1080/720).toBeGreaterThanOrEqual(100-1e-6);if(!frame.smallX&&!frame.smallZ)expect(frame.outside).toBeLessThanOrEqual(.18+1e-6);
    for(const dx of [-game.player.radius,game.player.radius])for(const dz of [-game.player.radius,game.player.radius])for(const h of [0,marineHeight]){const p=new T.Vector3((game.player.x+dx)/32,h,(game.player.y+dz)/32).project(renderer.camera);expect((p.x+1)*640).toBeGreaterThanOrEqual(0);expect((p.x+1)*640).toBeLessThanOrEqual(988);expect((1-p.y)*360).toBeGreaterThanOrEqual(182);expect((1-p.y)*360).toBeLessThanOrEqual(612);}
    for(const p of proof.actors){const e=game.enemies.getSnapshot(p.id)!;expect(debug.canStand(e.x,e.y,e.radius)).toBe(true);expect(renderer.actorScreenBounds(p.id,p.x,p.y,e.radius,box)).toBe(true);expect(box.left).toBeGreaterThanOrEqual(0);expect(box.right).toBeLessThanOrEqual(988);expect(box.top).toBeGreaterThanOrEqual(182);expect(box.bottom).toBeLessThanOrEqual(612);}
  }
});

// The CPU adapter deliberately does not implement corpse rendering/retention.
// This proves native deaths and legal marks; native capture owns the ten-pool proof.
it('finds thirteen legal720 corpse marks and uses the native damage path',async()=>{
 const {game,debug}=setup(1280,720);await stageCorpseBudget();
 const proof=debug.i8CorpseProof;expect(proof.nativeDeaths).toBe(13);expect(game.kills).toBe(13);
 expect(debug.events.filter((e:{type:string})=>e.type==='corpse')).toHaveLength(13);
 expect(proof.marks).toHaveLength(13);expect(proof.packingMode).toBe('hex-fallback');
 for(const [n,p] of proof.marks.entries()){
  expect(debug.canStand(p.x,p.y,32)).toBe(true);expect(Math.hypot(p.x-proof.origin.x,p.y-proof.origin.y)).toBeGreaterThanOrEqual(64);
  for(const q of proof.marks.slice(n+1))expect(Math.hypot(p.x-q.x,p.y-q.y)).toBeGreaterThanOrEqual(76-1e-6);
 }
});

it('keeps an already adequate1080 family composition on its legacy path',async()=>{
 const {debug}=setup(1920,1080);await stageC6Families('containment-annulus');
 expect(debug.i8FamilyProof.packingMode).toBe('legacy-grid');expect(debug.i8FamilyProof.fullBodyCount).toBeGreaterThanOrEqual(12);expect(debug.i8FamilyProof.fallbackTrials).toEqual([]);
});
