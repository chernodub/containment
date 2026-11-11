import {describe,it,expect,vi} from 'vitest';
import {advance,arena} from './A1ReviewFixtures';

describe('A1 review: immovable dash collision and Overclock expiry',()=>{
  it('two exhausted dashes stop outside the Queen and allow immediate walking away',()=>{
    const {game}=arena();game.player.x=250;game.boss.start(550,440);
    expect(game.useAbility('dash')).toBe(true);advance(game,150);
    expect(game.useAbility('dash')).toBe(true);advance(game,150);
    expect(game.abilities.snapshot.slots!.dash.charges).toBe(0);
    expect(Math.hypot(game.player.x-550,game.player.y-440)).toBeGreaterThanOrEqual(108-1e-7);
    const before=game.player.x;
    game.update(50,{x:-1,y:0,fire:false,angle:0,autoAim:false});
    expect(game.player.x).toBeLessThan(before-5);
  });
  it.each([0,35,100])('walking can escape an existing Queen overlap at offset %s with no dash charges',offset=>{
    const {game}=arena();game.boss.start(550,440);vi.spyOn(game.boss,'update').mockReturnValue([]);
    game.useAbility('dash');advance(game,150);game.useAbility('dash');advance(game,150);
    Object.assign(game.player,{x:550+offset,y:440});
    for(let t=0;t<800;t+=50)game.update(50,{x:1,y:0,fire:false,angle:0,autoAim:false});
    expect(game.player.x).toBeGreaterThan(658);
    expect(game.abilities.snapshot.slots!.dash.charges).toBe(0);
  });
  it('dash stops at nests and ordinary movement escapes a pre-existing nest overlap',()=>{
    const {game}=arena();
    vi.spyOn(game,'targets').mockReturnValue([{id:-101,x:550,y:440,radius:28,health:100,immovable:true}]);
    game.player.x=400;game.useAbility('dash');advance(game,150);
    expect(game.player.x).toBeLessThanOrEqual(506);
    Object.assign(game.player,{x:550,y:440});
    const moved=game.moveCorpse(game.player,60,0);expect(moved.x).toBeGreaterThanOrEqual(610);
  });
});
