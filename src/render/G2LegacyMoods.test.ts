import {it,expect} from 'vitest';
import {shipEnvironment,SHIP_ENVIRONMENTS} from './ShipEnvironments';
import {ROOM_TEMPLATES} from '../game/roguelike/roomTemplates';
import {ROOM_STORY_ROUTE} from '../game/roguelike/storyRooms';
it('assigns a real environment palette to every story and saved legacy template',()=>{
 const story=new Map(ROOM_STORY_ROUTE.map(r=>[r.templateId,r.environment]));
 for(const id of Object.keys(ROOM_TEMPLATES)){expect(SHIP_ENVIRONMENTS).toContain(shipEnvironment(id));if(story.has(id as never))expect(shipEnvironment(id)).toBe(story.get(id as never));}
 for(const id of ['unknown','constructor','toString'])expect(shipEnvironment(id)).toBeUndefined();
});
