import {describe, it, expect} from 'vitest';
import {chooseBoon, chooseRoute, chooseTarget, chooseMovement, chooseActions, quantiles, pointerFirePlan, assessLoading} from './policy.mjs';
describe('organic playtest policy', () => {
  it('prefers rig enablers and augments over unrelated damage', () => {
    expect(chooseBoon(['incendiary', 'cryogenic'], 'cryo')).toBe('cryogenic');
    expect(chooseBoon(['cryogenic', 'twin-glacier'], 'cryo')).toBe('twin-glacier');
    expect(chooseBoon(['incendiary', 'tactical-salvage'], 'arc')).toBe('tactical-salvage');
    expect(chooseBoon(['incendiary', 'slide-loader'], 'arc')).toBe('slide-loader');
  });
  it('uses the documented safe/heal route rule deterministically', () => {
    expect(chooseRoute([{id:'a',kind:'elite'},{id:'b',kind:'medical'}], 20).id).toBe('b');
  });
  it('focuses ranged threats without targeting dead or hidden enemies', () => {
    const enemies = [{id:1,type:'crawler',x:10,y:0,health:30,clear:true,visible:true},{id:2,type:'spitter',x:200,y:0,health:30,clear:true,visible:true},{id:3,type:'spitter',x:0,y:0,health:0,clear:true,visible:true}];
    expect(chooseTarget(enemies,{x:0,y:0}).id).toBe(2);
    enemies[1].clear=false;
    expect(chooseTarget(enemies,{x:0,y:0}).id).toBe(1);
  });
  it('avoids illegal destinations and acid despite movement inertia', () => {
    const s={player:{x:0,y:0},combat:{weapon:'rifle'},enemies:[],hazards:[{x:100,y:0,radius:80}],candidates:[{x:100,y:0,dx:1,dy:0,legal:true},{x:-100,y:0,dx:-1,dy:0,legal:true},{x:0,y:100,dx:0,dy:1,legal:false}]};
    expect(chooseMovement(s,{x:1,y:0}).dx).toBe(-1);
  });
  it('saves Overdrive for crowds/bosses and heals only when needed', () => {
    const s={player:{x:0,y:0},rig:'arc',hazards:[],abilities:{slots:{},overdrive:{ready:true}},combat:{health:39,medkits:1,grenades:0},enemies:[{id:1,x:200,y:0}]};
    expect(chooseActions(s)).toEqual(['e']);
    s.enemies[0].champion='matron';
    expect(chooseActions(s)).toEqual(['e','v']);
  });
  it('reports exact sample percentiles and null for absent evidence', () => {
    expect(quantiles([9,1,3,2,4])).toEqual({samples:5,p50:3,p95:9,max:9});
    expect(quantiles([]).max).toBeNull();
  });
});

it('captures native fire on canvas before aiming over opaque HUD panels', () => {
  expect(pointerFirePlan({x:1700,y:150},{left:600,right:700,top:500,bottom:650},false)).toEqual([{type:'move',x:650,y:575},{type:'down'},{type:'move',x:1700,y:150}]);
  expect(pointerFirePlan({x:1700,y:150},{left:600,right:700,top:500,bottom:650},true)).toEqual([{type:'move',x:1700,y:150}]);
});
it('records a >5s loading hold once while allowing the earned run to continue', () => {
  expect(assessLoading(4999)).toEqual({record:false,timeout:false});
  expect(assessLoading(6000)).toEqual({record:true,timeout:false});
  expect(assessLoading(6000,true)).toEqual({record:false,timeout:false});
  expect(assessLoading(120001,true)).toEqual({record:false,timeout:true});
});
