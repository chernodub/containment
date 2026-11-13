import {afterEach, expect, it, vi} from 'vitest';
import * as T from 'three';
import {DepthGame} from '../src/DepthGame';
import type {DepthRenderer} from '../src/render/DepthRenderer';
import {CameraRig} from '../src/render/camera/CameraRig';
import {HudCombatFraming} from '../src/render/camera/HudCombatFraming';
import {COMBAT_VIEW_HEIGHT, combatFocusTarget, protectPlayerFrame} from '../src/render/camera/CombatFraming';
import {roomFocus} from '../src/render/roomFraming';
import {installDebug} from '../scripts/nextgen/debug';
// @ts-expect-error The capture functions intentionally run as serialized JavaScript.
import {stageKiting, advanceKiting, stageCombat} from '../scripts/nextgen/scenarios.mjs';

// CPU integration only: real simulation/geometry and native camera mathematics,
// without WebGL, a browser, HUD DOM or claims about pixel/asset correctness.
function setup(width: number, height: number) {
  const target: Record<string, any> = {};
  vi.stubGlobal('window', target);
  vi.stubGlobal('location', {search: '?debug=1&seed=1729'});
  const camera = new T.PerspectiveCamera(28, width / height, .1, 160);
  const rig = new CameraRig(), hud = new HudCombatFraming();
  hud.resize(width, height);
  hud.setInsets({top: 182, right: 292, bottom: height === 720 ? 108 : 120, left: 0});
  const desired = new T.Vector3(), point = new T.Vector3(), scratch = new T.Vector3(), focus = new T.Vector3();
  let room = '', muzzleLife = 0;
  const renderer = {
    muzzle: {intensity: 0}, beginGameplayPresentation:vi.fn(), roomLoading: false, prepare: async () => {},
    effect(event: {type: string}) {if (event.type === 'shot') muzzleLife = .045;},
    render(game: DepthGame, dt = 0) {
      muzzleLife -= dt;
      this.muzzle.intensity = muzzleLife > 0 ? 6 * Math.min(1, muzzleLife / .035) : 0;
      const p = game.player, b = game.geometry.bounds;
      if (room !== game.node.id) {
        room = game.node.id;
        const initial = roomFocus(p.x / 32, p.y / 32, b.width / 32, b.height / 32, COMBAT_VIEW_HEIGHT * width / height, COMBAT_VIEW_HEIGHT, game.node.templateId);
        rig.reset(initial.x, initial.z);
      }
      combatFocusTarget(p.x / 32, p.y / 32, p.angle, 0, 0, false, false, desired);
      hud.selectContacts(p.x / 32, p.y / 32, p.angle, game.enemies.snapshot.enemies, 32, () => 3.2);
      hud.biasTarget(p.x / 32, p.y / 32, p.angle, false, false, desired);
      const bounded = roomFocus(desired.x, desired.z, b.width / 32, b.height / 32, COMBAT_VIEW_HEIGHT * width / height, COMBAT_VIEW_HEIGHT, game.node.templateId);
      if (!hud.hasEngagement) desired.set(bounded.x, 0, bounded.z);
      rig.update(dt, desired.x, desired.z, 0, false);
      rig.apply(camera, 1, COMBAT_VIEW_HEIGHT, 0);
      focus.copy(rig.focus);
      hud.center(camera, rig.focus, point, scratch);
      hud.protectEngagement(camera, focus, p.x / 32, p.y / 32, p.radius / 32, 2.2, point, scratch);
      protectPlayerFrame(camera, rig.focus, p.x / 32, p.y / 32, p.radius / 32, 2.2, point, scratch, hud.viewport);
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
    for (const enemy of game.enemies.snapshot.enemies) expect(debug.canStand(enemy.x, enemy.y, enemy.radius)).toBe(true);
    for (let frame = 0; frame < 4; frame++) {
      advanceKiting({frame, stepMs: 150});
      expect(game.enemies.snapshot.enemies.filter(e => e.health > 0 && renderer.visible(e.x, e.y)).length, `frame ${frame}`).toBeGreaterThanOrEqual(12);
      expect(game.status).toBe('playing');
    }
    expect(game.stats.abilityUses).toMatchObject({dash: 1, tactical: 1, power: 1, overdrive: 1});
  });
  it.each(['awakening-bay', 'communal-atrium', 'containment-annulus', 'passenger-vault', 'overload-floor'])(`retains twelve heavy bodies after real combat at ${width}×${height}: %s`, async room => {
    const {game, renderer, debug} = setup(width, height);
    await debug.gotoRoom(room);
    expect(renderer.beginGameplayPresentation).toHaveBeenCalled();
    stageCombat({status: false});
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
