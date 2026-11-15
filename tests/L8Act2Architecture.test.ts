import {describe,it,expect} from 'vitest';
import {SHIP_ACT2_PLANS} from '../src/game/roguelike/shipArchitectureAct2';
import {STORY_ROOM_TEMPLATES} from '../src/game/roguelike/storyRoomTemplates';
import {shipSolidStatistics,shipPlanOpeningErrors,shipBlockedOpeningErrors,shipNavigationErrors} from '../src/game/roguelike/shipPlanChecks';
import {createRoomTemplateGeometry,canOccupyExpedition} from '../src/game/world/expeditionGeometry';
import baseline from './fixtures/l8-walkable-baseline.json';
import type {StoryTemplateId} from '../src/game/roguelike/storyRooms';

describe('L8 Act2 complete prospective architecture',()=>{
 for(const [id,plan]of Object.entries(SHIP_ACT2_PLANS)){
  const t={...STORY_ROOM_TEMPLATES[id as StoryTemplateId],...plan.topology},g=createRoomTemplateGeometry(t,'prospective-'+id);
  it(`${id}: structure, crowd arena, every threshold and physically sealed alternatives`,()=>{
   const s=shipSolidStatistics(t),old=baseline.areas[id as keyof typeof baseline.areas];
   expect(s.connectedFraction).toBeGreaterThanOrEqual(.6);expect(s.freeGroups).toBeLessThanOrEqual(2);expect(s.walkableArea/old).toBeGreaterThanOrEqual(.8);expect(s.walkableArea/old).toBeLessThanOrEqual(1.2);
   expect(canOccupyExpedition(g,plan.arena,144)).toBe(true);
   expect(shipPlanOpeningErrors(plan,g)).toEqual([]);expect(shipBlockedOpeningErrors(plan,g)).toEqual([]);
   expect(plan.holdout??false).toBe(id==='transmission-chamber');
   for(const q of [g.playerSpawn,g.exitPoint,...g.breaches,...g.breaches.map(b=>({x:b.x+(b.facing==='east'?56:-56),y:b.y}))])expect(canOccupyExpedition(g,q,32)).toBe(true);
   expect(plan.breachFeatures).toHaveLength(4);
   for(const [i,b]of t.breaches.entries()){const f=plan.breachFeatures[i];expect(f.name).toMatch(/vent|door|tear/);expect(Math.hypot(f.at.x-b.x,f.at.y-b.y)).toBeLessThanOrEqual(145);expect(canOccupyExpedition(g,f.at,0)).toBe(false);}
  });
  it(`${id}: dense marine positions admit native contact paths at R14/18/24/28`,()=>{expect(shipNavigationErrors(g)).toEqual([]);},60000);
 }
});
