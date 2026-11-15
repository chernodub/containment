import fixtures from '../fixtures/l8-presentation-source-plans.json';
import{ROOM_TEMPLATES}from'../../src/game/roguelike/roomTemplates';
import type{RoomTemplate}from'../../src/game/roguelike/types';
/** Original source-kit manufacture controls, separate from active ship plans. */
export function l8PresentationSource(id:keyof typeof fixtures.plans):RoomTemplate {
 return {...ROOM_TEMPLATES[id],boundary:undefined,voids:undefined,...fixtures.plans[id]} as RoomTemplate;
}
