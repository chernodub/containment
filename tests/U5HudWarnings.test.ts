import {describe, expect, it, vi} from 'vitest';
import type {DepthGame} from '../src/DepthGame';
import {visitHostileWarnings} from '../src/ui/gameAdapter';

vi.mock('../src/game/world/expeditionGeometry', () => ({
  canTraverseExpedition: (_geometry:unknown, from:{x:number;y:number}, to:{x:number;y:number}) => Math.hypot(to.x-from.x,to.y-from.y) <= 100,
}));

function fixture(enemies: unknown[], boss: object = {}): DepthGame {
  return {enemies:{snapshot:{enemies}},boss:{snapshot:{active:false,pendingTelegraph:null,...boss}},geometry:{}} as unknown as DepthGame;
}

describe('native HUD warning footprints', () => {
  it('reads remaining native windup instead of a wall-time event expiry, and drops cancelled/dead warnings', () => {
    const enemy = {health:100,windupMs:80,pendingAttack:'spit',x:10,y:20,lockX:200,lockY:300,radius:22};
    const game = fixture([enemy]), visit = vi.fn();
    visitHostileWarnings(game,visit);
    expect(visit).toHaveBeenLastCalledWith(200,300,9,200,300);
    // Any amount of presentation time leaves a slowed but still pending attack intact.
    visitHostileWarnings(game,visit); expect(visit).toHaveBeenCalledTimes(2);
    enemy.windupMs = 0; visitHostileWarnings(game,visit); expect(visit).toHaveBeenCalledTimes(2);
    enemy.windupMs = 80; enemy.health = 0; visitHostileWarnings(game,visit); expect(visit).toHaveBeenCalledTimes(2);
    enemy.health = 100; enemy.pendingAttack = ''; visitHostileWarnings(game,visit); expect(visit).toHaveBeenCalledTimes(2);
  });

  it('clips the native charge corridor to legal walls and uses its locked vector', () => {
    const visit = vi.fn();
    visitHostileWarnings(fixture([{health:100,windupMs:500,pendingAttack:'charge',x:10,y:20,lockX:0,lockY:400,radius:31}]),visit);
    expect(visit).toHaveBeenCalledOnce();
    const [x,y,radius,endX,endY] = visit.mock.calls[0];
    expect([x,y,radius]).toEqual([10,20,31]);expect(endX).toBeCloseTo(10);
    expect(endY).toBeGreaterThanOrEqual(119.75);expect(endY).toBeLessThanOrEqual(120);
  });

  it('includes the current boss target while pending and removes it immediately when resolved', () => {
    const boss = {active:true,pendingTelegraph:{targetX:700,targetY:800,radius:120,delayRemainingMs:10}};
    const game = fixture([],boss), visit = vi.fn();
    visitHostileWarnings(game,visit);expect(visit).toHaveBeenLastCalledWith(700,800,120,700,800);
    boss.pendingTelegraph.delayRemainingMs = 0;visitHostileWarnings(game,visit);expect(visit).toHaveBeenCalledOnce();
  });
});
