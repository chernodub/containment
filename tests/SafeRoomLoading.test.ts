import {uiSource} from './uiSource';
import {it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {GameFeel} from '../src/ui/feel';
import {DepthGame} from '../src/DepthGame';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';

// Execute the actual main RAF body, with only GPU/DOM/audio adapters replaced.
function harness(graphicsBlocked=false,game=new DepthGame()){
 game.newRun(137);game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
 const renderer={roomLoading:true,beginGameplayPresentation:vi.fn(),endGameplayPresentation:vi.fn(),loadRoom:vi.fn(),render:vi.fn(),observeFrame:vi.fn(),playerScreenBounds:()=>({left:0,top:0,right:0,bottom:0})};
 let held=true;const input={read:()=>({x:held?1:0,y:0,fire:held,angle:0,autoAim:false}),reset:vi.fn(()=>{held=false;})};
 const node={hidden:true,setAttribute:vi.fn()},audio={syncCombat:vi.fn(),setMusicIntensity:vi.fn(),syncFrozen:vi.fn()};
 const source=uiSource;
 const body=source.slice(source.indexOf('function frame('),source.indexOf('\n    lastRoom = game.roomRevision;'));
 const presentation=vi.fn(),screens={graphicsBlocked},observer=vi.fn();
 const factory=new Function('game','renderer','input','el','audio','advancePresentation','GameFeel','screens','observer',`const optionalPresentationStarted=true;const presentationFrozen=false,presentationEnabled=true,motion={matches:false},beats=null,feel=new GameFeel(),feelContext=()=>({dashing:false,critical:false,remaining:game.encounterRemaining}),hasAudioDirector=()=>false,syncAudioDirector=()=>{};let benchmarkListener=observer;const benchmarkSample={frame:0,update:0,render:0,hud:0,audio:0};let controlsForStep;const stepSimulation=ms=>game.update(ms,controlsForStep);let lastRoom=-1,lastStatus='',graphicsLost=false,roomRecovering=true,hudTime=0,hudLastMs=0,hudTotalMs=0,hudSamples=0;const positionHud=()=>{},requestAnimationFrame=()=>{},document={hidden:false},pacer={sample:()=>.05,reset:()=>{}},confirmation={update:()=>{}},performance={now:()=>0},syncScreen=()=>{},hud=()=>{},syncHud=()=>{},diagnostics={record:()=>{}},nativeFrameSamples={record:()=>{}};${ts.transpile(body)};return frame;`);
 return {game,renderer,input,node,audio,presentation,frame:factory(game,renderer,input,()=>node,audio,presentation,GameFeel,screens,observer),screens,observer};
}
const snapshot=(g:DepthGame)=>JSON.stringify({player:g.player,combat:g.combat.snapshot,enemies:g.enemies.snapshot,bullets:g.bullets,pools:g.pools,elapsed:g.elapsed,remaining:g.encounterRemaining,expedition:g.expedition,story:g.storyPresentation});
it('actual RAF freezes all combat/progression while pending and discards held movement/fire',()=>{
 const h=harness(),before=snapshot(h.game);for(let i=0;i<160;i++)h.frame(i*50);
 expect(snapshot(h.game)).toBe(before);expect(h.input.reset).toHaveBeenCalled();expect(h.renderer.render).not.toHaveBeenCalled();
 expect(h.node.hidden).toBe(false);expect(h.audio.syncFrozen).not.toHaveBeenCalled();expect(h.presentation.mock.calls.every(([dt])=>dt===0)).toBe(true);
 h.renderer.roomLoading=false;h.frame(9000);expect(snapshot(h.game)).toBe(before);expect(h.renderer.render).toHaveBeenCalled();expect(h.audio.syncFrozen).not.toHaveBeenCalled();
 h.frame(9050);expect(h.game.elapsed).toBeCloseTo(.05);expect(h.presentation).toHaveBeenLastCalledWith(.05);expect(h.game.player.x).toBe(230);expect(h.game.bullets).toHaveLength(0);expect(h.audio.syncFrozen).toHaveBeenCalledOnce();
});
it('ready/fallback recovery does not unpause a user pause and reentry gates before update',()=>{
 const h=harness();h.frame(0);h.game.pause();const paused=snapshot(h.game);h.renderer.roomLoading=false;h.frame(9000);h.frame(9050);
 expect(h.game.status).toBe('paused');expect(snapshot(h.game)).toBe(paused);expect(h.audio.syncFrozen).not.toHaveBeenCalled();
 h.game.resume();h.game.newRun(137);expect(h.game.status).toBe('reward');expect(h.game.expedition.build.mutations).toHaveLength(0);
 h.renderer.roomLoading=true;h.frame(9100);expect(h.game.status).toBe('reward');expect(h.game.storyPresentation).toBeTruthy();
 h.game.chooseMutation(expeditionRewardOffers(h.game.expedition)[0].id);const restarted=snapshot(h.game);h.frame(9150);expect(snapshot(h.game)).toBe(restarted);
});

it('keeps restored graphics held while rendering and delivering opt-in benchmark samples',()=>{
 const h=harness(true),before=snapshot(h.game);
 h.renderer.roomLoading=false;
 for(let i=0;i<4;i++)h.frame(i*50);
 expect(snapshot(h.game)).toBe(before);expect(h.input.reset).toHaveBeenCalledTimes(4);
 expect(h.renderer.render).toHaveBeenCalledTimes(4);expect(h.observer).toHaveBeenCalledTimes(4);
 expect(h.observer.mock.lastCall?.[0]).toMatchObject({frame:50,update:0,render:0,hud:0,audio:0});
 h.screens.graphicsBlocked=false;h.frame(250);
 expect(h.game.elapsed).toBeCloseTo(.05);expect(h.game.player.x).toBe(230);expect(h.game.bullets).toHaveLength(0);
});

it('holds lazy gameplay assets through rig selection and starts them before the first combat readiness hold',()=>{
 const h=harness();h.game.newRun(1729,{rigSelect:true});
 h.frame(0);expect(h.game.expedition.run.phase).toBe('rig-select');expect(h.renderer.beginGameplayPresentation).not.toHaveBeenCalled();
 expect(h.game.chooseRig('arc')).toBe(true);h.frame(50);expect(h.renderer.beginGameplayPresentation).not.toHaveBeenCalled();
 h.game.chooseMutation(expeditionRewardOffers(h.game.expedition)[0].id);h.renderer.loadRoom.mockClear();h.frame(100);
 expect(h.renderer.beginGameplayPresentation).toHaveBeenCalledOnce();expect(h.renderer.loadRoom).toHaveBeenCalledOnce();
 expect(h.renderer.beginGameplayPresentation.mock.invocationCallOrder[0]).toBeLessThan(h.renderer.loadRoom.mock.invocationCallOrder[0]);
 expect(h.renderer.render).not.toHaveBeenCalled();
 h.game.menu();h.frame(150);h.frame(200);expect(h.renderer.endGameplayPresentation).toHaveBeenCalledOnce();
 h.game.newRun(1730,{rigSelect:true});h.frame(250);expect(h.renderer.beginGameplayPresentation).toHaveBeenCalledOnce();
 h.game.chooseRig('cryo');h.game.chooseMutation(expeditionRewardOffers(h.game.expedition)[0].id);h.frame(300);
 expect(h.renderer.beginGameplayPresentation).toHaveBeenCalledTimes(2);
});

it('restores Continue choices without acquiring assets until the restored run enters combat',()=>{
 const data=new Map<string,string>(),storage={getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value);},removeItem:(key:string)=>{data.delete(key);}};
 const h=harness(false,new DepthGame(()=>{},storage));
 h.game.newRun(1729,{rigSelect:true});h.game.chooseRig('arc');
 h.game.menu();h.frame(0);expect(h.renderer.endGameplayPresentation).toHaveBeenCalledOnce();
 expect(h.game.continueRun()).toBe(true);h.frame(50);
 expect(h.game.status).toBe('reward');expect(h.renderer.beginGameplayPresentation).not.toHaveBeenCalled();
 h.game.chooseMutation(expeditionRewardOffers(h.game.expedition)[0].id);h.frame(100);
 expect(h.game.status).toBe('playing');expect(h.renderer.beginGameplayPresentation).toHaveBeenCalledOnce();expect(h.renderer.render).not.toHaveBeenCalled();
});
