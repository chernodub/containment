import {it,expect} from 'vitest';
import {shipEnvironment,SHIP_ENVIRONMENTS} from './ShipEnvironments';
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import {ROOM_STORY_ROUTE} from '../game/roguelike/storyRooms';
import {ROOM_COMPOSITIONS} from './lighting/RoomCompositions';
it('assigns a real environment palette to every story and saved legacy template',()=>{
 const story=new Map(ROOM_STORY_ROUTE.map(r=>[r.templateId,r.environment]));
 for(const id of Object.keys(ROOM_TEMPLATES)){expect(SHIP_ENVIRONMENTS).toContain(shipEnvironment(id));if(story.has(id as never))expect(shipEnvironment(id)).toBe(story.get(id as never));}
 for(const id of ['unknown','constructor','toString'])expect(shipEnvironment(id)).toBeUndefined();
});
it('gives every saved template a finite authored light composition',()=>{
 for(const id of Object.keys(ROOM_TEMPLATES)){
  const composition=ROOM_COMPOSITIONS[id];expect(composition).toBeDefined();
  expect(composition.keyOffset.every(Number.isFinite)).toBe(true);
  for(const gain of [composition.keyGain,composition.fillGain,composition.practicalGain]){expect(gain).toBeGreaterThan(0);expect(gain).toBeLessThanOrEqual(4.5);}
 }
});
