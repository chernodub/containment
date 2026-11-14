import {afterEach, expect, it, vi} from 'vitest';
import {DepthGame} from '../src/DepthGame';
import type {DepthRenderer} from '../src/render/DepthRenderer';
import {installDebug} from '../scripts/nextgen/debug';
// Capture functions run unchanged in a browser page. This integration proof uses
// real room geometry, public ability actions, movement and projectile collision.
// @ts-expect-error The shared runner is intentionally plain JavaScript.
import {DEFAULT_ROOMS, stageKiting, advanceKiting} from '../scripts/nextgen/scenarios.mjs';

afterEach(() => vi.unstubAllGlobals());

it.each([...(DEFAULT_ROOMS as string[]), 'communal-atrium:retry', 'containment-annulus:retry'])('stages legal real kiting actions and a travelling rifle round in %s', async scenario => {
  const [room, mode] = scenario.split(':');
  const target: Record<string, any> = {};
  vi.stubGlobal('window', target);
  vi.stubGlobal('location', {search: '?debug=1&seed=1729'});
  const rendererStub = {
    muzzle: {intensity: 0}, beginGameplayPresentation:vi.fn(), render: vi.fn(), prepare: async () => {}, roomLoading: false,
    visible: () => true,
    effect(event: {type: string}) {if (event.type === 'shot') this.muzzle.intensity = 1;},
  };
  const game = new DepthGame(effect => rendererStub.effect(effect));
  installDebug(game, rendererStub as unknown as DepthRenderer, () => {}, () => {});
  await target.__containmentDebug.gotoRoom(room, {rig: 'cryo'});
  expect(rendererStub.beginGameplayPresentation).toHaveBeenCalled();
  const staged = await stageKiting(mode === 'retry' ? 1 : 0);
  // Native footprint/placement rejection may require a later deterministic lane.
  expect(staged.laneAttempt).toBeGreaterThanOrEqual(mode === 'retry' ? 1 : 0);
  expect(staged.laneAttempt).toBeLessThan(32);
  expect(staged.staged).toBeGreaterThanOrEqual(18);
  expect(target.__containmentDebug.canStand(game.player.x, game.player.y)).toBe(true);
  expect(game.bullets.some(bullet => bullet.kind === 'player')).toBe(true);
  expect(game.stats.abilityUses).toMatchObject({dash: 1, tactical: 1});
  const origin = {x: game.player.x, y: game.player.y};
  advanceKiting({frame: 1, stepMs: 150});
  advanceKiting({frame: 2, stepMs: 150});
  expect(Math.hypot(game.player.x - origin.x, game.player.y - origin.y)).toBeGreaterThan(1);
  expect(game.stats.abilityUses).toMatchObject({dash: 1, tactical: 1, power: 1, overdrive: 1});
  expect(game.enemies.snapshot.enemies.filter(enemy => enemy.health > 0).length).toBeGreaterThanOrEqual(12);
  expect(game.status).toBe('playing');
});

it('seeds legal contacts before demanding the unchanged eighteen-target reserve from an unengaged close camera', async () => {
  const target: Record<string, any> = {};
  vi.stubGlobal('window', target);vi.stubGlobal('location', {search:'?debug=1&seed=1729'});
  let game: DepthGame;
  const productionRender=vi.fn((_game:DepthGame,_dt=0)=>{});
  const renderer = {
    muzzle:{intensity:0},beginGameplayPresentation:vi.fn(),roomLoading:false,prepare:async()=>{},render:productionRender,
    visible(x:number,y:number){return game.enemies.activeCount>0||Math.hypot(x-game.player.x,y-game.player.y)<145;},
    effect(event:{type:string}){if(event.type==='shot')this.muzzle.intensity=1;},
  };
  game=new DepthGame(event=>renderer.effect(event));installDebug(game,renderer as unknown as DepthRenderer,()=>{},()=>{});
  const d=target.__containmentDebug;await d.gotoRoom('awakening-bay',{rig:'cryo'});
  const result=await stageKiting();
  expect(result.staged).toBeGreaterThanOrEqual(18);expect(result.initialVisible).toBeGreaterThanOrEqual(18);expect(result.placedVisible).toBeGreaterThanOrEqual(18);
  expect(result.packingPasses[0].initialVisible).toBeLessThan(18);expect(result.packingPasses.length).toBeGreaterThan(1);
  // installDebug forces renderer delta0 unless the tool's synchronous mode
  // bracket is correct. Observe the underlying production render spy.
  expect(productionRender.mock.calls.some(call=>(call[1]??0)>0)).toBe(true);
  expect(game.stats.abilityUses).toMatchObject({dash:1,tactical:1});
  for(let frame=0;frame<4;frame++){advanceKiting({frame,stepMs:150});expect(game.enemies.snapshot.enemies.filter(e=>e.health>0&&renderer.visible(e.x,e.y)).length).toBeGreaterThanOrEqual(12);}
  expect(game.stats.abilityUses).toMatchObject({dash:1,tactical:1,power:1,overdrive:1});
});
