import {describe, expect, it, vi} from 'vitest';
import {DepthGame, type GameEffect} from '../src/DepthGame';
import {AudioSystem} from '../src/game/audio/AudioSystem';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
import {forwardAudioEffect, playPresentationCue, playUiCue, syncAudioDirector} from '../src/ui/gameAdapter';
import {FakeAudioContext} from './audioFake';

function directorSpy() {
  return {
    handleEffect: vi.fn(), playUi: vi.fn(), setEnvironment: vi.fn(), setCombatState: vi.fn(),
    setBossPhase: vi.fn(), playUI: vi.fn(), setMusicIntensity: vi.fn(),
    playConfirmedHit: vi.fn(), playPistol: vi.fn(), playRifle: vi.fn(), playShotgun: vi.fn(),
    playPlasma: vi.fn(), playRocket: vi.fn(), playBodyImpact: vi.fn(), playExplosion: vi.fn(),
    playPickup: vi.fn(), playElemental: vi.fn(), pauseMusic: vi.fn(), resumeMusic: vi.fn(),
  };
}

function play(game: DepthGame) {
  game.newRun(1729, {rigSelect:true});
  expect(game.chooseRig('cryo')).toBe(true);
  game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
  expect(game.status).toBe('playing');
}

async function integrated() {
  const clock = new FakeAudioContext();
  const audio = new AudioSystem({master:1,music:.38,effects:.8}, {context:clock.asContext(),loadSamples:false,prewarm:false});
  await audio.unlock();
  const events: GameEffect[] = [];
  const saved = new Map<string,string>();
  const game = new DepthGame(event => {
    events.push(event);
    forwardAudioEffect(audio, event, game.player);
    if (event.type === 'ability' && event.ability?.phase === 'overdrive-ready') playPresentationCue(audio, 'overdrive-ready');
  }, {getItem:key => saved.get(key) ?? null,setItem:(key,value) => {saved.set(key,value);},removeItem:key => {saved.delete(key);}});
  play(game);
  const sync = (paused = game.status === 'paused', loading = false) => {
    syncAudioDirector(audio, game, {paused,loading});
    audio.syncCombat(game.combat.snapshot);
  };
  sync();
  return {clock,audio,game,events,sync};
}

describe('UI subscription to the production audio director', () => {
  it('forwards all effects exclusively, including denied and ability-ready events', () => {
    const audio = directorSpy();
    const effects: GameEffect[] = [
      {type:'shot',weapon:'rifle',x:1,y:2},
      {type:'hit',contact:'armor',x:1,y:2},
      {type:'ability',x:1,y:2,ability:{ability:'cryo-nova',slot:'tactical',rig:'cryo',element:'cryo',phase:'denied',denial:'cooldown'}},
      {type:'ability',x:1,y:2,ability:{ability:'cryo-nova',slot:'tactical',rig:'cryo',element:'cryo',phase:'ready'}},
    ];
    for (const effect of effects) forwardAudioEffect(audio,effect,{x:4,y:5});
    expect(audio.handleEffect.mock.calls).toEqual(effects.map(effect => [effect,{x:4,y:5}]));
    for (const method of ['playUI','playRifle','playConfirmedHit','playElemental'] as const) expect(audio[method]).not.toHaveBeenCalled();
  });

  it('exits explicitly on revision and menu, including adjacent identical environments', () => {
    const audio = directorSpy(), game = new DepthGame();
    play(game);
    syncAudioDirector(audio,game,{paused:false});
    const environment = game.storyRoom!.environment;
    expect(audio.setEnvironment.mock.calls).toEqual([[null],[environment]]);
    audio.setEnvironment.mockClear();
    syncAudioDirector(audio,game,{paused:false});
    expect(audio.setEnvironment).not.toHaveBeenCalled();
    game.roomRevision++;
    syncAudioDirector(audio,game,{paused:false});
    expect(audio.setEnvironment.mock.calls).toEqual([[null],[environment]]);
    audio.setEnvironment.mockClear();
    game.menu(); syncAudioDirector(audio,game,{paused:false});
    expect(audio.setEnvironment.mock.calls).toEqual([[null]]);
    expect(audio.pauseMusic).toHaveBeenCalled();
    expect(audio.setCombatState).toHaveBeenLastCalledWith({intensity:0,boss:false,overdrive:false,danger:0,hostileTimeScale:1,paused:false});
  });

  it('uses authoritative max health and runtime abilities, with actual loading/pause transport', () => {
    const audio = directorSpy(), game = new DepthGame();
    play(game);
    const resources = game.combat.mutationResources();
    vi.spyOn(game.combat,'mutationResources').mockReturnValue({...resources,maxHealth:200});
    syncAudioDirector(audio,game,{paused:false});
    expect(audio.setCombatState).toHaveBeenLastCalledWith(expect.objectContaining({danger:.5,paused:false}));
    syncAudioDirector(audio,game,{paused:true,loading:true});
    expect(audio.setCombatState).toHaveBeenLastCalledWith(expect.objectContaining({paused:true}));
    expect(audio.setEnvironment).toHaveBeenLastCalledWith(null);
    game.pause(); syncAudioDirector(audio,game,{paused:true});
    expect(audio.setCombatState).toHaveBeenLastCalledWith(expect.objectContaining({intensity:0,danger:0,overdrive:false,paused:true}));
    game.resume(); syncAudioDirector(audio,game,{paused:false});
    expect(audio.setCombatState).toHaveBeenLastCalledWith(expect.objectContaining({paused:false}));
  });

  it('forwards optional Queen phase and deduplicates director-owned presentation accents', () => {
    const audio = directorSpy(), game = new DepthGame();
    play(game);
    vi.spyOn(game.boss,'snapshot','get').mockReturnValue({...game.boss.snapshot,active:true,phase:'vulnerable'});
    syncAudioDirector(audio,game,{paused:false});
    expect(audio.setBossPhase).toHaveBeenCalledWith('vulnerable');
    audio.playUi.mockClear();
    for (const cue of ['room-enter','room-clear','death','victory','boss-intro','overdrive-ready'] as const) playPresentationCue(audio,cue);
    expect(audio.playUi).not.toHaveBeenCalled();
    playPresentationCue(audio,'low-health');
    expect(audio.playUi).toHaveBeenCalledExactlyOnceWith('low-health');
  });

  it('plays one real Overdrive-ready cue and one terminal stinger, without shortening either', async () => {
    const {audio,clock,game,sync,events} = await integrated();
    const ready = vi.spyOn(audio,'playUi');
    game.abilities.addCharge(12000);
    game.update(16);
    expect(events.some(event => event.ability?.phase === 'overdrive-ready')).toBe(true);
    expect(ready.mock.calls.filter(([cue]) => cue === 'overdrive-ready')).toHaveLength(1);
    clock.advance(2);
    game.hurt(10000); sync(); sync();
    expect(ready.mock.calls.filter(([cue]) => cue === 'death')).toHaveLength(1);
    const death = clock.sources.filter(source => source.buffer?.duration === 1.5);
    expect(death).toHaveLength(1);
    expect(death[0].stops).toHaveLength(0);
    clock.advance(.6); sync();
    expect(death[0].ended).toBe(false);
    expect(audio.diagnostics.loops).toBe(0);
    audio.destroy();
  });

  it('announces a loaded boss once after readiness and preserves that edge through pause/resume', async () => {
    const {audio,game,sync} = await integrated();
    const cues = vi.spyOn(audio,'playUi');
    vi.spyOn(game.boss,'snapshot','get').mockReturnValue({...game.boss.snapshot,active:true,phase:'vulnerable'});
    sync(true,true);
    expect(cues.mock.calls.filter(([cue]) => cue === 'boss-intro')).toHaveLength(0);
    sync(false,false);
    expect(cues.mock.calls.filter(([cue]) => cue === 'boss-intro')).toHaveLength(1);
    game.pause(); sync(); game.resume(); sync(); sync();
    expect(cues.mock.calls.filter(([cue]) => cue === 'boss-intro')).toHaveLength(1);
    audio.destroy();
  });

  it('keeps clear/victory/checkpoint audio live when visual presentation is disabled', async () => {
    const {audio,clock,game,sync} = await integrated();
    const cues = vi.spyOn(audio,'playUi');
    // Match the opt-in production debug seam: invoke the real room-clear transition.
    (game as unknown as {clearRoom(): void}).clearRoom(); sync(); sync();
    expect(cues.mock.calls.filter(([cue]) => cue === 'room-clear')).toHaveLength(1);
    expect(cues.mock.calls.filter(([cue]) => cue === 'checkpoint')).toHaveLength(1);
    const clear = clock.sources.find(source => source.buffer?.duration === 1.05)!;
    expect(clear).toBeDefined(); expect(clear.stops).toHaveLength(0);
    game.status = 'complete'; sync(); sync();
    expect(cues.mock.calls.filter(([cue]) => cue === 'victory')).toHaveLength(1);
    expect(clock.sources.find(source => source.buffer?.duration === 1.75)?.stops).toEqual([]);
    audio.destroy();
  });

  it('clears a real Whiteout loop on same-environment revision and on menu exit', async () => {
    const {audio,clock,game,sync} = await integrated();
    game.abilities.addCharge(12000);
    expect(game.useAbility('overdrive')).toBe(true);
    game.update(50); sync();
    expect(audio.diagnostics.loops).toBeGreaterThan(0);
    game.roomRevision++; sync();
    expect(audio.diagnostics.loops).toBe(0);
    clock.advance(.1);
    for (let step = 0; step < 5; step++) {game.update(50); clock.advance(.05);}
    sync();
    expect(audio.diagnostics.loops).toBeGreaterThan(0);
    game.menu(); sync();
    expect(audio.diagnostics.loops).toBe(0);
    audio.destroy();
  });

  it('keeps syncCombat authoritative for reload/switch and schedules nothing paused or muted', async () => {
    const {audio,clock,game,sync} = await integrated();
    clock.advance(2);
    game.update(16,{x:0,y:0,fire:true,angle:0,autoAim:false});
    game.reload();
    const beforeReload = clock.sources.length;
    sync(); const afterReload = clock.sources.length;
    expect(afterReload).toBeGreaterThan(beforeReload);
    sync(); expect(clock.sources).toHaveLength(afterReload);
    game.switchWeapon('rifle'); sync();
    const afterSwitch = clock.sources.length;
    expect(afterSwitch).toBeGreaterThan(afterReload);
    sync(); expect(clock.sources).toHaveLength(afterSwitch);
    playUiCue(audio,'back');
    // A first gesture may finish its asynchronous unlock, exactly as in the application.
    await Promise.resolve();
    game.pause(); sync();
    const paused = clock.sources.length;
    for (const cue of ['tab','slider','toggle','denied'] as const) playUiCue(audio,cue);
    forwardAudioEffect(audio,{type:'shot',weapon:'rifle',x:0,y:0},game.player);
    sync(); expect(clock.sources).toHaveLength(paused);
    game.resume(); audio.setMasterVolume(0); sync();
    const muted = clock.sources.length;
    playUiCue(audio,'confirm'); game.useAbility('tactical'); game.update(16);
    expect(clock.sources).toHaveLength(muted);
    audio.destroy();
  });
});
