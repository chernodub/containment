import {expect,it} from 'vitest';
import {DepthGame} from '../src/DepthGame';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
import {GameFeel} from '../src/ui/feel';
const normal={dashing:false,critical:false,remaining:10};
it('holds whole deferred steps through frames entirely inside hit-stop',()=>{
  const feel=new GameFeel();let steps=0;
  feel.advance(50,normal,()=>{steps++;feel.effect({type:'wall-slam',x:0,y:0},normal);});
  expect(steps).toBe(1);const deferred=feel.snapshot.remainderMs;
  for(const ms of [16,16,7]) {
    expect(feel.advance(ms,normal,()=>steps++)).toBe(0);
    expect(steps).toBe(1);expect(feel.snapshot.remainderMs).toBe(deferred);
  }
  expect(feel.snapshot.hitStopMs).toBe(1);
  feel.advance(1,normal,()=>steps++);expect(steps).toBe(3);
});
it('arms finale only after the authoritative zero-threat transition, never the penultimate death',()=>{
  const feel=new GameFeel();let game:DepthGame;
  game=new DepthGame(e=>feel.effect(e,{...normal,remaining:game.encounterRemaining}));
  game.newRun(1729);game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
  (game as any).director={snapshot:{remaining:0}};(game as any).pending=[];
  const a=game.enemies.spawn('crawler',350,350),b=game.enemies.spawn('crawler',450,350);
  expect(a.spawned&&b.spawned).toBe(true);if(!a.spawned||!b.spawned)throw Error('spawn');
  feel.advance(1,{...normal,remaining:game.encounterRemaining},()=>{});
  game.damage(a.enemy.id,10000);expect(game.encounterRemaining).toBe(1);expect(feel.snapshot.slowMotionMs).toBe(0);
  game.damage(b.enemy.id,10000);expect(game.encounterRemaining).toBe(0);expect(feel.snapshot.slowMotionMs).toBe(420);
});
it('also observes zero threats without a corpse callback (boss/room completion)',()=>{
  const feel=new GameFeel();feel.advance(1,normal,()=>{});
  feel.advance(1,{...normal,remaining:0},()=>{});expect(feel.snapshot.slowMotionMs).toBe(419);
});
