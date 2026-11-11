import {describe,it,expect,vi} from 'vitest';
import {advance,arena} from './A1ReviewFixtures';

describe('A1 review: Overclock expiry',()=>{
  it.each([25,1,49.5])('Overclock preserves a free shot in its last %s ms of a crossing update',remaining=>{
    const {game}=arena('arc');vi.spyOn(game.combat,'regenerateReserves').mockImplementation(()=>{});const r=game.combat.getRunResources();
    game.combat.restoreRunResources({...r,weapon:'rocket',ammo:{...r.ammo,rocket:{magazine:0,reserve:0}}});
    game.abilities.addCharge(6000);game.useAbility('overdrive');advance(game,6000-remaining,25);
    const before=game.stats.shotsFired;
    game.update(50,{x:0,y:0,fire:true,angle:0,autoAim:false});
    expect(game.stats.shotsFired).toBe(before+1);
    expect(game.combat.snapshot.magazine).toBe(0);expect(game.combat.snapshot.reserve).toBe(0);
    expect(game.abilities.overclocked).toBe(false);
    game.update(50,{x:0,y:0,fire:true,angle:0,autoAim:false});expect(game.stats.shotsFired).toBe(before+1);
  });
});
