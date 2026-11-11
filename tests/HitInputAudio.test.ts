import {expect,it,vi} from 'vitest';
import {InputController} from '../src/InputController';
import {DepthGame} from '../src/DepthGame';
import {EnemySystem} from '../src/game/enemies/EnemySystem';
import {AudioSystem} from '../src/game/audio/AudioSystem';
import {impactRecipe} from '../src/game/audio/combatCues';
import {synthesize} from '../src/game/audio/synthesis';
import {FakeAudioContext} from './audioFake';
import {enemyShotRadius} from '../src/game/combat/enemyContact';

it('production InputController supplies visible body colliders and uses corrected aim',()=>{
 const game=new DepthGame();game.enemies=new EnemySystem();game.geometry={...game.geometry,bounds:{x:0,y:0,width:1000,height:1000},boundary:undefined,voids:[],blockers:[{x:400,y:0,width:10,height:1000}]};Object.assign(game.player,{x:100,y:100});game.enemies.spawn('crawler',200,200);game.enemies.spawn('brute',500,200);
 const pointer=vi.fn(()=>({x:200,y:200}));
 const input=Object.assign(Object.create(InputController.prototype),{game,gameplayReady:()=>true,view:{pointer},keys:new Set(),mouse:{x:300,y:250,active:true},shooting:true}) as InputController;
 expect(input.read()).toMatchObject({angle:Math.PI/4,fire:true,autoAim:false});
 expect(pointer.mock.calls[0]).toEqual([300,250,[expect.objectContaining({id:1,x:200,y:200,radius:enemyShotRadius('crawler')})]]);
});
it('armor uses quieter metallic PCM; rapid hits and paused audio are suppressed', async()=>{
 const clock=new FakeAudioContext(),audio=new AudioSystem({}, {context:clock.asContext(),loadSamples:false,prewarm:false});
 await audio.unlock();
 audio.playConfirmedHit(true);expect(clock.sources[0].buffer!.getChannelData(0)).toEqual(synthesize(impactRecipe('armor')));
 audio.playConfirmedHit(false);expect(clock.sources).toHaveLength(1);
 clock.advance(.06);audio.playConfirmedHit(false);expect(clock.sources[1].buffer!.getChannelData(0)).toEqual(synthesize(impactRecipe('flesh')));
 audio.pauseAll();clock.advance(1);audio.playConfirmedHit(true);expect(clock.sources).toHaveLength(2);audio.destroy();
});
