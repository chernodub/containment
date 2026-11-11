import {expect,it} from 'vitest';
import {DepthGame,type GameEffect} from '../src/DepthGame';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
function fixture(){const effects:GameEffect[]=[];const game=new DepthGame(e=>effects.push(e));game.newRun(1729);game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);return {game,effects};}
it('hurt carries only the finite origin supplied by that damage event',()=>{
  const {game,effects}=fixture();game.hurt(1,{x:35,y:65});expect([...effects].reverse().find(e=>e.type==='hurt')).toMatchObject({sourceX:35,sourceY:65});
  (game as any).hurtCooldown=0;game.hurt(1);const unknown=[...effects].reverse().find(e=>e.type==='hurt');expect(unknown).not.toHaveProperty('sourceX');expect(unknown).not.toHaveProperty('sourceY');
});
it('contact, projectile, pool and boss-area hits forward their own origins',()=>{
  for(const kind of ['contact','projectile','pool','boss'] as const){
    const {game,effects}=fixture();const g=game as any;
    const p=game.player,origin={x:p.x+10,y:p.y+5};
    if(kind==='contact'){
      const spawned=game.enemies.spawn('crawler',origin.x,origin.y);if(!spawned.spawned)throw Error('spawn');
      g.enemyEvents([{type:'contact-attack',enemyId:spawned.enemy.id,enemyType:'crawler',damage:1}]);
    }else if(kind==='projectile'){
      g.enemyEvents([{type:'hazard-attack',enemyId:1,sourceX:origin.x,sourceY:origin.y,targetX:p.x,targetY:p.y,damage:1}]);
      game.update(1,{x:0,y:0,fire:false,angle:null,autoAim:false});
    }else if(kind==='pool'){
      game.pools.push({id:1,...origin,radius:40,life:1,warning:0,damage:1,tick:0});game.update(1,{x:0,y:0,fire:false,angle:null,autoAim:false});
    }else g.queenEvents([{type:'area-attack',...origin,radius:40,damage:1}]);
    expect([...effects].reverse().find(e=>e.type==='hurt'),kind).toMatchObject({sourceX:origin.x,sourceY:origin.y});
  }
});
