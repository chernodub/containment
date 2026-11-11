import {describe, expect, it, vi} from 'vitest';
import {OrthographicCamera, PerspectiveCamera, Vector3} from 'three';
import {DepthGame} from '../src/DepthGame';
import type {DepthRenderer} from '../src/render/DepthRenderer';
import {GRAPHICS_PRESETS} from '../src/render/graphicsOptions';
import {abilityFixture} from '../src/ui/fixtures';
import {chooseRig, getAbilities, getCameraFootprint, getGraphicsOptions, getRunStats, getUiPhase, setGraphicsOptions, setGraphicsTier, setUiFixture, showInvalidAbilityPlacement, useAbility} from '../src/ui/gameAdapter';

describe('version-tolerant presentation adapter', () => {
  it('feature-detects invalid-placement previews and never passes nonfinite world positions', () => {
    expect(()=>showInvalidAbilityPlacement({} as DepthRenderer,'glacier',4,5)).not.toThrow();
    const preview=vi.fn(),renderer={setInvalidAbilityPlacement:preview} as unknown as DepthRenderer;
    showInvalidAbilityPlacement(renderer,'glacier',NaN,5);
    showInvalidAbilityPlacement(renderer,'glacier');
    expect(preview).not.toHaveBeenCalled();
    showInvalidAbilityPlacement(renderer,'glacier',4,5);
    expect(preview).toHaveBeenLastCalledWith('glacier',4,5);
    showInvalidAbilityPlacement(renderer,null);
    expect(preview).toHaveBeenLastCalledWith(null,undefined,undefined);
  });
  it('reads the live runtime and preserves action acceptance', () => {
    const game = new DepthGame();
    expect(getAbilities(game)).toBe(game.abilities.snapshot);
    expect(getRunStats(game)).toBe(game.stats);
    expect(chooseRig(game, 'arc')).toBe(false);
    expect(useAbility(game, 'power')).toBe(false);
    game.newRun(1729, {rigSelect: true});
    expect(chooseRig(game, 'cryo')).toBe(true);
    expect(getAbilities(game)?.rig).toBe('cryo');
    expect(chooseRig(game, 'arc')).toBe(false);
    expect(useAbility(game, 'power')).toBe(false);
  });
  it('isolates explicit visual fixtures from simulation and removes them cleanly', () => {
    const game = new DepthGame(), other = new DepthGame();
    const before = JSON.stringify(game.expedition);
    setUiFixture(game, {phase: 'rig-select', abilities: abilityFixture('arc', 'overdrive'), stats: game.stats});
    expect(getUiPhase(game)).toBe('rig-select');
    expect(getAbilities(game)?.overdrive.ready).toBe(true);
    expect(getAbilities(other)).toBe(other.abilities.snapshot);
    expect(JSON.stringify(game.expedition)).toBe(before);
    setUiFixture(game, null);
    expect(getAbilities(game)).toBe(game.abilities.snapshot);
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

describe('S2 audio and G1 camera boundaries', () => {
  it('dispatches every effect exclusively to a complete audio director', async () => {
    const {forwardAudioEffect, playUiCue, syncAudioDirector} = await import('../src/ui/gameAdapter');
    const legacy = {playUI: vi.fn(), playConfirmedHit: vi.fn(), playPistol: vi.fn(), playRifle: vi.fn(), playShotgun: vi.fn(), playPlasma: vi.fn(), playRocket: vi.fn(), playBodyImpact: vi.fn(), playExplosion: vi.fn(), playPickup: vi.fn(), playElemental: vi.fn(), setMusicIntensity: vi.fn()};
    forwardAudioEffect(legacy, {type:'shot', x:0, y:0, weapon:'rifle'}, {x:0, y:0});
    expect(legacy.playRifle).toHaveBeenCalledOnce();
    const audio = {...legacy, handleEffect: vi.fn(), playUi: vi.fn(), setEnvironment: vi.fn(), setCombatState: vi.fn()};
    forwardAudioEffect(audio, {type:'shot', x:0, y:0, weapon:'rifle'}, {x:0, y:0});
    forwardAudioEffect(audio, {type:'hit', x:0, y:0, contact:'armor'}, {x:0, y:0});
    playUiCue(audio, 'room-enter'); syncAudioDirector(audio, new DepthGame());
    expect(audio.handleEffect).toHaveBeenCalledTimes(2);
    expect(legacy.playRifle).toHaveBeenCalledOnce(); expect(legacy.playConfirmedHit).not.toHaveBeenCalled();
    expect(audio.playUi).toHaveBeenCalledWith('room-enter'); expect(legacy.playUI).not.toHaveBeenCalled();
    expect(audio.setEnvironment).toHaveBeenCalled(); expect(audio.setCombatState).toHaveBeenCalledWith(expect.objectContaining({paused:true, hostileTimeScale:1}));
  });
  it('falls back safely for a partially landed director', async () => {
    const {playUiCue} = await import('../src/ui/gameAdapter');
    const audio = {playUI:vi.fn(), playUi:vi.fn()}; playUiCue(audio, 'confirm');
    expect(audio.playUI).toHaveBeenCalledOnce(); expect(audio.playUi).not.toHaveBeenCalled();
  });
  it('uses angle/amount camera hooks, scales comfort, and respects renderer-owned feedback', async () => {
    const {cameraEffect} = await import('../src/ui/gameAdapter');
    const cameraRig = {kick:vi.fn(), addTrauma:vi.fn(), punch:vi.fn()};
    const renderer = {cameraRig} as unknown as DepthRenderer;
    cameraEffect(renderer, {type:'shot', x:0, y:0, weapon:'shotgun', angle:0}, .5);
    expect(cameraRig.kick).toHaveBeenCalledWith(Math.PI,.05);
    cameraEffect(renderer, {type:'explosion', x:0, y:0}, 0);
    expect(cameraRig.addTrauma).not.toHaveBeenCalled();
    cameraEffect({cameraRig, handlesCameraEffects:true} as unknown as DepthRenderer, {type:'explosion',x:0,y:0},1);
    expect(cameraRig.punch).not.toHaveBeenCalled();
    expect(() => cameraEffect({} as DepthRenderer,{type:'hurt',x:0,y:0},1)).not.toThrow();
  });
});
