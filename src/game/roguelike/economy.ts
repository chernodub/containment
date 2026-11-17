import type {BuildState,RunState} from './types';
import {AUGMENT_IDS,AUGMENT_UPGRADE_RULES} from '../abilities/augmentCatalog';
export const SUPPLY_DEPTHS = [3,7,11,14,18] as const;
export const DETOUR_DEPTHS = [2,6,10,14,17] as const;
export type DetourChoice = 'direct'|'salvage';
export const DETOUR_OFFERS = Object.freeze([
 Object.freeze({id:'direct' as const,name:'Stay on mission',risk:'Standard encounter',reward:'Keep your current supplies'}),
 Object.freeze({id:'salvage' as const,name:'Recover the sealed cache',risk:'An extra escorted priority group in the next room',reward:'+150 credits after clearing the next room'}),
]);
export function detourOffers(run:RunState){return run.version===3&&DETOUR_DEPTHS.includes(run.completedNodeIds.length-1 as typeof DETOUR_DEPTHS[number])?DETOUR_OFFERS:[];}
export type ServiceId='heal'|'armor'|'ammo'|'medkit'|'grenade'|'reroll'|'upgrade';
export const SERVICE_CATALOG=Object.freeze({
 heal:Object.freeze({name:'Repair health',description:'Restore up to 35 health.',cost:90,stock:2}),
 armor:Object.freeze({name:'Patch armor',description:'Restore up to 30 armor.',cost:80,stock:2}),
 ammo:Object.freeze({name:'Refill reserves',description:'A substantial ammunition pack for every weapon.',cost:95,stock:2}),
 medkit:Object.freeze({name:'Medkit',description:'One medkit for your next fight (capacity 6).',cost:110,stock:1}),
 grenade:Object.freeze({name:'Grenades',description:'Up to two grenades to break a crowded approach (capacity 6).',cost:90,stock:1}),
 reroll:Object.freeze({name:'Draft reroll',description:'Bank one free reroll for a later boon choice.',cost:100,stock:1}),
 upgrade:Object.freeze({name:'Upgrade an augment',description:'Upgrade the first supported installed augment not already upgraded. Its combat rule improves immediately.',cost:240,stock:1}),
});
export const SERVICE_IDS=Object.freeze(Object.keys(SERVICE_CATALOG) as ServiceId[]);
export function serviceCost(id:ServiceId,depth:number){return SERVICE_CATALOG[id].cost+Math.floor(depth/4)*10;}
export function serviceStock(run:RunState,id:ServiceId){return Math.max(0,SERVICE_CATALOG[id].stock-(run.service?.nodeId===run.currentNodeId?run.service.purchases.filter(x=>x===id).length:0));}
export function nextAugmentUpgrade(build:BuildState){return build.mutations.find(id=>Object.hasOwn(AUGMENT_UPGRADE_RULES,id)&&!build.augmentUpgrades?.includes(id as typeof AUGMENT_IDS[number])) as typeof AUGMENT_IDS[number]|undefined;}
