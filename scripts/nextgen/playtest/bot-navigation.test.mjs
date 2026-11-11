import {describe, expect, it, vi} from 'vitest';
import {DepthGame} from '../../../src/DepthGame';
import {generateRun} from '../../../src/game/roguelike/run';
import {FacilityNavigation} from '../../../src/game/world/FacilityNavigation';
import {createExpeditionGeometry, canOccupyExpedition, canTraverseExpedition, hasClearExpeditionShot} from '../../../src/game/world/expeditionGeometry';
import {botWaypoint} from './bot-navigation.ts';
import {chooseMovement} from './policy.mjs';

const DIRECTIONS=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const FIXTURES = [
  {name:'Transmission Breacher2026',seed:2026,depth:9,player:{x:1086.9348987396934,y:428.99468223662575},target:{x:278.48162659838425,y:691.1328156329026},visible:false},
  {name:'Workshop Breacher65537 clear offscreen',seed:65537,depth:14,player:{x:56.18104625959782,y:822.07967737569},target:{x:667.6870201012963,y:731.9520496103099},visible:false},
  {name:'Loading Bay Cryo1729 v2',seed:1729,depth:7,player:{x:380.12897875736587,y:689.1721118138313},target:{x:410.9104939753582,y:588.194970711651},visible:true},
  {name:'Relay Arc2718 v1',seed:2718,depth:8,player:{x:210.11794569655135,y:808.7930312871434},target:{x:910.123874281684,y:148.40271330249863},visible:false},
  {name:'Interlock Cryo8675309 v1 clear offscreen',seed:8675309,depth:11,player:{x:309.23355261972523,y:447.2521363241124},target:{x:731.2435878287295,y:569.1671769509402},visible:false},
  {name:'Manual Control Arc2718 v2',seed:2718,depth:18,player:{x:1044.6664034490716,y:571.8079570673501},target:{x:459.0079805378,y:721.4548724408013},visible:false},
  {name:'Relay Breacher1729 v2',seed:1729,depth:8,player:{x:378.49390770689786,y:410.3115896845478},target:{x:410.2228147623044,y:149.00441652312293},visible:false},
  {name:'Loading Bay Cryo1729 v1',seed:1729,depth:7,player:{x:259.6700222170666,y:764.0225166543089},target:{x:410.9104939753582,y:588.194970711651},visible:true},
];
function recordedFixture(fixture=FIXTURES[0], capturedSelfWaypoint=false){
  const game=new DepthGame();
  game.node=generateRun(fixture.seed).nodes[fixture.depth];
  game.geometry=createExpeditionGeometry(game.node);
  game.navigation=new FacilityNavigation(game.geometry);
  Object.assign(game.player,fixture.player);
  if(capturedSelfWaypoint)vi.spyOn(game.navigation,'waypoint').mockImplementation(()=>({...game.player}));
  return {game,target:{id:29,type:'crawler',health:56,...fixture.target,clear:hasClearExpeditionShot(game.geometry,game.player,fixture.target),visible:fixture.visible}};
}
function movement(game,target,previous={x:0,y:0}){
  const waypoint=botWaypoint(game,target)??target;
  const candidates=DIRECTIONS.map(([dx,dy])=>{
    const length=Math.hypot(dx,dy)||1,x=game.player.x+dx/length*90,y=game.player.y+dy/length*90;
    let legal=true;
    for(let i=1;i<=6;i++)if(!canOccupyExpedition(game.geometry,{x:game.player.x+(x-game.player.x)*i/6,y:game.player.y+(y-game.player.y)*i/6},19))legal=false;
    if(game.abilities.blocksMovement(game.player,{x,y},19))legal=false;
    return {x,y,dx,dy,legal,waypoint,clear:hasClearExpeditionShot(game.geometry,{x,y},target)};
  });
  return chooseMovement({player:game.player,combat:{weapon:game.node.depth===7?'shotgun':'rifle'},enemies:[target],candidates,hazards:[]},previous);
}

describe('controlled bot navigation observer',()=>{
  it('gives the unchanged movement policy a useful legal waypoint for the recorded Transmission censor',()=>{
    const {game,target}=recordedFixture();
    const ordinary=game.navigation.waypoint({...game.player,radius:16},target,1);
    expect(Math.hypot(ordinary.x-game.player.x,ordinary.y-game.player.y)).toBeLessThan(45);
    expect(hasClearExpeditionShot(game.geometry,game.player,target)).toBe(false);
    const waypoint=botWaypoint(game,target),chosen=movement(game,target);
    expect(Math.hypot(waypoint.x-game.player.x,waypoint.y-game.player.y)).toBeGreaterThan(90);
    expect(canTraverseExpedition(game.geometry,game.player,waypoint,18)).toBe(true);
    expect(Math.abs(chosen.dx)+Math.abs(chosen.dy)).toBeGreaterThan(0);
    expect(chosen.legal).toBe(true);
  });
  it.each(FIXTURES)('walks $name to a close firing lane using the unchanged movement policy',fixture=>{
    const {game,target}=recordedFixture(fixture,true);
    const first=movement(game,target);
    expect(Math.abs(first.dx)+Math.abs(first.dy)).toBeGreaterThan(0);
    expect(first.legal).toBe(true);
    game.status='playing';
    let previous={x:0,y:0},decisions=0;
    const arrived=()=>hasClearExpeditionShot(game.geometry,game.player,target)&&Math.hypot(game.player.x-target.x,game.player.y-target.y)<300;
    for(;decisions<200&&!arrived();decisions++){
      target.clear=hasClearExpeditionShot(game.geometry,game.player,target);
      const chosen=movement(game,target,previous),before={...game.player};
      previous={x:chosen.dx,y:chosen.dy};
      for(let step=0;step<5;step++)game.update(50,{x:chosen.dx,y:chosen.dy/.81,angle:null,fire:false,autoAim:false});
      expect(canOccupyExpedition(game.geometry,game.player,16)).toBe(true);
      expect(Math.hypot(game.player.x-before.x,game.player.y-before.y)).toBeLessThanOrEqual(55.001);
    }
    expect(arrived()).toBe(true);
    expect(decisions).toBeLessThan(200);
  });
  it('keeps ordinary routes and all authoritative state intact and repeats observer results',()=>{
    const {game,target}=recordedFixture();
    const before=JSON.stringify({player:game.player,combat:game.combat.snapshot,resources:game.combat.getRunResources(),stats:game.stats,abilities:game.abilities.snapshot,run:game.expedition});
    const navigation=game.navigation,first=botWaypoint(game,target),second=botWaypoint(game,target);
    expect(first).toEqual(second);expect(game.navigation).toBe(navigation);
    expect(JSON.stringify({player:game.player,combat:game.combat.snapshot,resources:game.combat.getRunResources(),stats:game.stats,abilities:game.abilities.snapshot,run:game.expedition})).toBe(before);
    const visible={x:game.player.x-100,y:game.player.y};
    const ordinary=game.navigation.waypoint({...game.player,radius:16},visible,1);
    expect(botWaypoint(game,visible)).toEqual(ordinary);
  });
});
