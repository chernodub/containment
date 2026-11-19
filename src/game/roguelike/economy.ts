import type {BuildState,RunState} from './types';
import {AUGMENT_IDS,AUGMENT_UPGRADE_RULES} from '../abilities/augmentCatalog';
export const SUPPLY_DEPTHS = [3,7,11,14,18] as const;
export const DETOUR_DEPTHS = [2,6,10,14,17] as const;
export type DetourChoice = 'direct'|'salvage';
export const EARLY_LOCKER = Object.freeze({ health:25, grenades:1, salvageCredits:45 });
const DIRECT = {id:'direct' as const,name:'Stay on mission',risk:'Standard encounter',reward:'Keep your current supplies'};
const DETOURS = {
 2: {name:'Early salvage',risk:'Salvage approach',reward:'Collect 45 credits now'},
 6: {name:'Field requisition',risk:'Costs 70 credits',reward:'Restore 25 armor and take two grenades now'},
 10: {name:'Exposed workshop',risk:'Alternate combat approach · costs 180 credits',reward:'Upgrade an installed augment now'},
 14: {name:'Warden cache',risk:'Fight a Warden and its escort in the next room',reward:'Earn 160 credits on clear'},
 17: {name:'Secure the capacitor',risk:'Charge an extra relay under fire',reward:'Leave with a full Overdrive charge'},
} as const;
export const fieldWorkshopDepth = 10;
export function detourOffers(run:RunState){
 const depth=run.completedNodeIds.length-1;
 if(run.version!==3||!Object.hasOwn(DETOURS,depth))return [];
 const deal=DETOURS[depth as keyof typeof DETOURS];
 return [depth===2?{...DIRECT,name:'Emergency supply locker',reward:'Restore up to 25 health and take one grenade immediately'}:depth===fieldWorkshopDepth?{...DIRECT,name:'Protected infirmary',risk:'Protected approach',reward:'Keep supplies and restore 35 health immediately'}:DIRECT,{id:'salvage' as const,...deal}];
}
export type ServiceId='heal'|'armor'|'ammo'|'medkit'|'grenade'|'reroll'|'upgrade'|'revive';
export const SERVICE_CATALOG=Object.freeze({
 heal:Object.freeze({name:'Repair health',description:'Restore up to 35 health.',cost:90,stock:2}),
 armor:Object.freeze({name:'Patch armor',description:'Restore up to 30 armor.',cost:80,stock:2}),
 ammo:Object.freeze({name:'Refill reserves',description:'A substantial ammunition pack for every weapon.',cost:95,stock:2}),
 medkit:Object.freeze({name:'Medkit',description:'One medkit for your next fight (capacity 6).',cost:110,stock:1}),
 grenade:Object.freeze({name:'Grenades',description:'Up to two grenades to break a crowded approach (capacity 6).',cost:90,stock:1}),
 reroll:Object.freeze({name:'Draft reroll',description:'Bank one free reroll for a later boon choice.',cost:100,stock:1}),
 upgrade:Object.freeze({name:'Upgrade an augment',description:'Improve an installed augment immediately.',cost:240,stock:1}),
 revive:Object.freeze({name:'Emergency resuscitation',description:'Survive one lethal hit in the finale and return with 45 health.',cost:610,stock:1}),
});
export const SERVICE_IDS=Object.freeze(Object.keys(SERVICE_CATALOG) as ServiceId[]);
export function serviceCost(id:ServiceId,depth:number){if(depth===3&&id==='medkit')return 35;if(depth===3&&id==='grenade')return 20;return SERVICE_CATALOG[id].cost+Math.floor(depth/4)*10;}
export function serviceStock(run:RunState,id:ServiceId){if(id==='revive'&&(run.version!==3||run.completedNodeIds.length!==19))return 0;return Math.max(0,SERVICE_CATALOG[id].stock-(run.service?.nodeId===run.currentNodeId?run.service.purchases.filter(x=>x===id).length:0));}
export function availableAugmentUpgrades(build:BuildState){return build.mutations.filter(id=>Object.hasOwn(AUGMENT_UPGRADE_RULES,id)&&!build.augmentUpgrades?.includes(id as typeof AUGMENT_IDS[number])) as (typeof AUGMENT_IDS[number])[];}
