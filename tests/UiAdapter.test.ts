import {describe, expect, it, vi} from 'vitest';
import {OrthographicCamera, PerspectiveCamera, Vector3} from 'three';
import {DepthGame} from '../src/DepthGame';
import type {DepthRenderer} from '../src/render/DepthRenderer';
import {GRAPHICS_PRESETS} from '../src/render/graphicsOptions';
import {abilityFixture} from '../src/ui/fixtures';
import {chooseRig, getAbilities, getCameraFootprint, getGraphicsOptions, getRunStats, getUiPhase, setGraphicsOptions, setGraphicsTier, setUiFixture, useAbility} from '../src/ui/gameAdapter';

describe('version-tolerant presentation adapter', () => {
  it('keeps a legacy game inert without abilities or invented run statistics', () => {
    const game = new DepthGame();
    expect(getAbilities(game)).toBeNull();
    expect(getRunStats(game)).toEqual({});
    expect(chooseRig(game, 'arc')).toBe(false);
    expect(useAbility(game, 'power')).toBe(false);
  });
  it('reads live snapshots and invokes only public actions when A1 exists', () => {
    const game = new DepthGame();
    const snapshot = abilityFixture('cryo', 'cooling');
    const next = Object.assign(game, {abilities: {snapshot}, chooseRig: vi.fn(), useAbility: vi.fn(), stats: {kills: 17}});
    expect(getAbilities(game)).toBe(snapshot);
    expect(getRunStats(game)).toEqual({kills: 17});
    expect(chooseRig(game, 'pyro')).toBe(true);
    expect(useAbility(game, 'tactical')).toBe(true);
    expect(next.chooseRig).toHaveBeenCalledWith('pyro');
    expect(next.useAbility).toHaveBeenCalledWith('tactical');
  });
  it('isolates explicit visual fixtures from simulation and removes them cleanly', () => {
    const game = new DepthGame(), other = new DepthGame();
    const before = JSON.stringify(game.expedition);
    setUiFixture(game, {phase: 'rig-select', abilities: abilityFixture('arc', 'overdrive'), stats: {damage: 6200}});
    expect(getUiPhase(game)).toBe('rig-select');
    expect(getAbilities(game)?.overdrive.ready).toBe(true);
    expect(getAbilities(other)).toBeNull();
    expect(JSON.stringify(game.expedition)).toBe(before);
    setUiFixture(game, null);
    expect(getAbilities(game)).toBeNull();
    expect(getUiPhase(game)).toBe('menu');
  });
  it('applies tier presets and per-option overrides through the optional G1 surface', () => {
    const renderer = {qualityTier: 'high', setQuality: vi.fn(), setGraphicsOptions: vi.fn()} as unknown as DepthRenderer;
    expect(getGraphicsOptions(renderer)).toEqual(GRAPHICS_PRESETS.high);
    setGraphicsTier(renderer, 'low');
    setGraphicsOptions(renderer, {screenShake: .3, flashIntensity: .2});
    expect(getGraphicsOptions(renderer)).toEqual({...GRAPHICS_PRESETS.low, screenShake: .3, flashIntensity: .2});
    expect(renderer.setQuality).toHaveBeenCalledWith('low');
    expect((renderer as unknown as {setGraphicsOptions: ReturnType<typeof vi.fn>}).setGraphicsOptions).toHaveBeenLastCalledWith(getGraphicsOptions(renderer));
  });
});

describe('camera footprint without DOM measurements', () => {
  it.each(['orthographic','perspective'])('unprojects the %s view corners onto the real floor', kind => {
    const camera=kind==='orthographic'?new OrthographicCamera(-12,12,7,-7,.1,150):new PerspectiveCamera(45,16/9,.1,150);
    camera.position.set(10,26,30);camera.lookAt(10,0,10);camera.updateMatrixWorld(true);
    const out=Array.from({length:4},()=>({x:0,y:0}));
    const renderer={camera,canvas:{getBoundingClientRect:()=>{throw Error('No layout reads');}}} as unknown as DepthRenderer;
    expect(getCameraFootprint(renderer,out)).toBe(true);
    for(const [i,point] of out.entries()) {
      const screen=new Vector3(point.x/32,0,point.y/32).project(camera);
      expect(screen.x).toBeCloseTo(i===0||i===3?-1:1);
      expect(screen.y).toBeCloseTo(i<2?1:-1);
    }
  });
  it('keeps title reachable when a live abandoned run is still awaiting a rig', () => {
    const game={status:'menu',expedition:{run:{phase:'rig-select'}}} as unknown as DepthGame;
    expect(getUiPhase(game)).toBe('menu');
  });
});

describe('ability visual states', () => {
  it.each(['breacher', 'cryo', 'pyro', 'arc'] as const)('covers the complete %s catalog with charging, cast, active and denied states', rig => {
    const ready = abilityFixture(rig, 'ready');
    expect(Object.keys(ready.slots!)).toHaveLength(4);
    expect(ready.slots?.dash.charges).toBe(2);
    expect(abilityFixture(rig, 'cooling').slots?.tactical.cooldownRemainingMs).toBeGreaterThan(0);
    expect(abilityFixture(rig, 'casting').slots?.tactical.castRemainingMs).toBeGreaterThan(0);
    expect(abilityFixture(rig, 'active').overdrive.active).toBe(true);
    expect(abilityFixture(rig, 'denied').slots?.power.ready).toBe(false);
    expect(abilityFixture(rig, 'overdrive').overdrive.charge).toBe(1);
  });
});
