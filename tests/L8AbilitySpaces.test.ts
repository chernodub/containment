import {describe,it,expect} from 'vitest';
import {DepthGame,type GameEffect} from '../src/DepthGame';
import type {RigId} from '../src/game/abilities/contract';
import {generateRun} from '../src/game/roguelike/run';
import {expeditionRewardOffers} from '../src/game/roguelike/expedition';
import {SHIP_ARCHITECTURE_PLANS} from '../src/game/roguelike/shipArchitectureLayouts';
import {createExpeditionGeometry,canOccupyExpedition,canTraverseExpedition} from '../src/game/world/expeditionGeometry';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';

const nodes=generateRun(1729,3).nodes;
const angles=[0,Math.PI/2,Math.PI,Math.PI*1.5];
function fixture(node:typeof nodes[number],rig:RigId){
  const effects:GameEffect[]=[],game=new DepthGame(e=>effects.push(e));
  game.newRun(1729,{rigSelect:true});game.chooseRig(rig);
  game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
  game['director'].reset();game['pending']=[];game.enemies.reset();
  game.node=node;game.geometry=createExpeditionGeometry(node);game.navigation=new FacilityNavigation(game.geometry);
  game.combat.setBuild({rig,mutations:[]});
  const plan=SHIP_ARCHITECTURE_PLANS[node.templateId as keyof typeof SHIP_ARCHITECTURE_PLANS];
  if(!plan)throw Error('Ability-space fixture requires an authored story plan');
  Object.assign(game.player,{...plan.arena,vx:0,vy:0,angle:0});
  return{game,effects,arena:{x:game.player.x,y:game.player.y}};
}

/** Isolated native geometry opportunities, not extra campaign victories or a
 * claim that a player must always be able to cast through surrounding cover. */
describe('L8 authored fight floors retain native ability shapes',()=>{
  it.each(nodes)('$templateId admits full Bulwark/Glacier walls in four orientations',node=>{
    for(const rig of ['breacher','cryo'] as const)for(const angle of angles){
      const{game,arena}=fixture(node,rig),distance=rig==='breacher'?70:40;
      const aim={x:arena.x+Math.cos(angle)*distance,y:arena.y+Math.sin(angle)*distance};
      game.setAimPoint(aim);game.player.angle=angle;
      expect(game.useAbility('power'),`${rig} native placement at ${angle}`).toBe(true);
      for(let tick=0;tick<4;tick++)game.abilities.update(50);
      const walls=game.abilities.snapshot.deployables;
      expect(walls).toHaveLength(1);expect(walls[0].kind).toBe(rig==='breacher'?'barrier':'ice-wall');
      expect(walls[0].length).toBe(rig==='breacher'?220:200);
      expect(walls[0].x).toBeCloseTo(aim.x);expect(walls[0].y).toBeCloseTo(aim.y);
    }
  });
  it.each(nodes)('$templateId supports complete native dash traversals across the crowd floor',node=>{
    for(const rig of ['breacher','cryo','pyro','arc'] as const)for(const angle of angles){
      const{game,arena}=fixture(node,rig),distance=rig==='pyro'?240:150;
      const direction={x:Math.cos(angle),y:Math.sin(angle)};
      Object.assign(game.player,{x:arena.x-direction.x*distance/2,y:arena.y-direction.y*distance/2,angle});
      game.abilities.setIntent(direction.x,direction.y,null);
      const start={x:game.player.x,y:game.player.y};expect(game.useAbility('dash')).toBe(true);
      for(let tick=0;tick<20;tick++){
        const before={x:game.player.x,y:game.player.y};game.abilities.update(7);
        expect(canTraverseExpedition(game.geometry,before,game.player,16)).toBe(true);
        expect(canOccupyExpedition(game.geometry,game.player,16)).toBe(true);
      }
      expect(game.abilities.dashing).toBe(false);
      expect(game.player.x).toBeCloseTo(start.x+direction.x*distance,4);
      expect(game.player.y).toBeCloseTo(start.y+direction.y*distance,4);
    }
  });
  it.each(nodes)('$templateId permits a native Railbreaker line to hit two separated bodies',node=>{
    const{game,arena,effects}=fixture(node,'breacher');
    Object.assign(game.player,{x:arena.x-100,y:arena.y,angle:0});
    const ids=[0,76].map(offset=>{
      const result=game.enemies.spawn('brute',arena.x+offset,arena.y);
      expect(result.spawned).toBe(true);if(!result.spawned)throw Error('Native geometry rejected line target');return result.enemy.id;
    });
    game.abilities.addCharge(12000);expect(game.useAbility('overdrive')).toBe(true);
    // Advance the production ability runtime against stationary native bodies:
    // this isolates the line/cover question from attack-slot movement tactics.
    for(let tick=0;tick<6;tick++)game.abilities.update(50);
    const hitIds=effects.flatMap(e=>e.type==='ability'&&e.ability?.ability==='railbreaker'&&e.ability.phase==='link'?e.ability.targetIds??[]:[]);
    expect(hitIds).toEqual(ids);expect(game.stats.damageDealt.ability).toBeGreaterThan(0);
  });
});
