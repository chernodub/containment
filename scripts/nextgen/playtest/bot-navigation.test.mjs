import {describe, expect, it, vi} from 'vitest';
import {DepthGame} from '../../../src/DepthGame';
import {generateRun} from '../../../src/game/roguelike/run';
import {FacilityNavigation} from '../../../src/game/world/FacilityNavigation';
import {createExpeditionGeometry, createRoomTemplateGeometry, canOccupyExpedition, canTraverseExpedition, hasClearExpeditionShot} from '../../../src/game/world/expeditionGeometry';
import {ROOM_TEMPLATES} from '../../../src/game/roguelike/roomTemplates';
import {SHIP_ARCHITECTURE_PLANS} from '../../../src/game/roguelike/shipArchitectureLayouts';
import historical from '../../../tests/fixtures/l8-historical-navigation.json';
import {botWaypoint} from './bot-navigation.ts';
import {chooseMovement} from './policy.mjs';

const DIRECTIONS=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const FIXTURES = [
  {name:'Transmission Breacher2026',seed:2026,depth:9,player:{x:1086.9348987396934,y:428.99468223662575},target:{x:278.48162659838425,y:691.1328156329026},visible:false},
  {name:'Workshop Breacher65537 clear offscreen',seed:65537,depth:14,player:{x:56.18104625959782,y:822.07967737569},target:{x:667.6870201012963,y:731.9520496103099},visible:false},
  {name:'Loading Bay Cryo1729 v2',seed:1729,depth:7,player:{x:380.12897875736587,y:689.1721118138313},target:{x:410.9104939753582,y:588.194970711651},visible:true},
  {name:'Relay Arc2718 new port-to-starboard cross aisle',live:true,seed:2718,depth:8,player:{x:300,y:800},target:{x:980,y:220},visible:false},
  {name:'Interlock Cryo8675309 v1 clear offscreen',seed:8675309,depth:11,player:{x:309.23355261972523,y:447.2521363241124},target:{x:731.2435878287295,y:569.1671769509402},visible:false},
  {name:'Manual Control Arc2718 v2',seed:2718,depth:18,player:{x:1044.6664034490716,y:571.8079570673501},target:{x:459.0079805378,y:721.4548724408013},visible:false},
  {name:'Relay Breacher1729 v2',seed:1729,depth:8,player:{x:378.49390770689786,y:410.3115896845478},target:{x:410.2228147623044,y:149.00441652312293},visible:false},
  {name:'Loading Bay Cryo1729 v1',seed:1729,depth:7,player:{x:259.6700222170666,y:764.0225166543089},target:{x:410.9104939753582,y:588.194970711651},visible:true},
];
// Current architecture is covered separately from the frozen censors. Select
// actual named-space anchors, retaining the same movement policy and bounds.
const LIVE_FIXTURES=[
  ['transmission-chamber','Uplink chancel','South service chapel'],
  ['infested-workshop','Loading dock','Gantry workbay'],
  ['breached-loading-bay','Port docking apron','Starboard pressure lock'],
  ['relay-racks','Port rack aisle','Starboard rack aisle'],
  ['safety-interlock-station','Port inspection','Starboard gallery'],
  ['manual-control-chamber','Entry vestibule','Authorization booth'],
].map(([room,from,to])=>{const plan=SHIP_ARCHITECTURE_PLANS[room],node=generateRun(1729).nodes.find(n=>n.templateId===room),start=plan.spaces.find(s=>s.name===from),end=plan.spaces.find(s=>s.name===to);if(!node||!start||!end)throw new Error(`Missing live navigation fixture: ${room}: ${from} to ${to}`);return {name:`Live ${room}: ${from} to ${to}`,seed:1729,depth:node.depth,live:true,player:start.anchor,target:end.anchor,visible:false};});
function recordedFixture(fixture=FIXTURES[0], capturedSelfWaypoint=false){
  const game=new DepthGame();
  game.node=generateRun(fixture.seed).nodes[fixture.depth];
  game.geometry=fixture.live?createExpeditionGeometry(game.node):createRoomTemplateGeometry({...ROOM_TEMPLATES[game.node.templateId],boundary:undefined,voids:undefined,...historical.templates[game.node.templateId]},game.node.id+':historical');
  game.navigation=new FacilityNavigation(game.geometry);
  Object.assign(game.player,fixture.player);
  expect(canOccupyExpedition(game.geometry,game.player,16),fixture.name+' starts on its fixture legal floor').toBe(true);
  expect(canOccupyExpedition(game.geometry,fixture.target,14),fixture.name+' target on its fixture legal floor').toBe(true);
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
  it('refines the captured coarse self-waypoint for the frozen Transmission censor',()=>{
    // Rounded native sweeps now improve this old coarse leg too. Preserve the
    // captured self-waypoint condition explicitly when exercising the observer.
    const {game,target}=recordedFixture(FIXTURES[0],true);
    const ordinary=game.navigation.waypoint({...game.player,radius:16},target,1);
    expect(Math.hypot(ordinary.x-game.player.x,ordinary.y-game.player.y)).toBeLessThan(45);
    expect(hasClearExpeditionShot(game.geometry,game.player,target)).toBe(false);
    const waypoint=botWaypoint(game,target),chosen=movement(game,target);
    expect(Math.hypot(waypoint.x-game.player.x,waypoint.y-game.player.y)).toBeGreaterThan(90);
    expect(canTraverseExpedition(game.geometry,game.player,waypoint,18)).toBe(true);
    expect(Math.abs(chosen.dx)+Math.abs(chosen.dy)).toBeGreaterThan(0);
    expect(chosen.legal).toBe(true);
  });
  it('retains native rounded-sweep improvement on the frozen Transmission geometry',()=>{
    const {game,target}=recordedFixture();
    expect(hasClearExpeditionShot(game.geometry,game.player,target)).toBe(false);
    const waypoint=game.navigation.waypoint({...game.player,radius:16},target,1);
    expect(waypoint).not.toBeNull();expect(Math.hypot(waypoint.x-game.player.x,waypoint.y-game.player.y)).toBeGreaterThan(90);
    expect(canTraverseExpedition(game.geometry,game.player,waypoint,18)).toBe(true);
  });
  it.each([...FIXTURES,...LIVE_FIXTURES])('walks $name to a close firing lane using the unchanged movement policy',fixture=>{
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
  it.each([FIXTURES[0],...LIVE_FIXTURES])('keeps ordinary routes/state intact and repeats observer results for $name',fixture=>{
    const {game,target}=recordedFixture(fixture);
    const before=JSON.stringify({player:game.player,combat:game.combat.snapshot,resources:game.combat.getRunResources(),stats:game.stats,abilities:game.abilities.snapshot,run:game.expedition});
    const navigation=game.navigation,first=botWaypoint(game,target),second=botWaypoint(game,target);
    expect(first).toEqual(second);expect(game.navigation).toBe(navigation);
    expect(JSON.stringify({player:game.player,combat:game.combat.snapshot,resources:game.combat.getRunResources(),stats:game.stats,abilities:game.abilities.snapshot,run:game.expedition})).toBe(before);
    const visible=[-100,100].map(dx=>({x:game.player.x+dx,y:game.player.y})).find(p=>canTraverseExpedition(game.geometry,game.player,p,18));
    expect(visible).toBeDefined();expect(hasClearExpeditionShot(game.geometry,game.player,visible)).toBe(true);
    const ordinary=game.navigation.waypoint({...game.player,radius:16},visible,1);
    expect(botWaypoint(game,visible)).toEqual(ordinary);
  });
});
