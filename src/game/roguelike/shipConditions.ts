import {openingRoll} from '../waves/authoredEncounters';
import type {RunState} from './types';

const CONDITIONS = [
 {id:'dark',name:'Emergency lighting',icon:'target',upside:'Ambush damage and slower Spitter aim',downside:'Hostiles emerge from darkness'},
 {id:'coolant',name:'Coolant leak',icon:'cryo',upside:'Shove enemies into walls and crowds',downside:'Slick floor carries your momentum'},
 {id:'vent',name:'Hull venting',icon:'dash',upside:'Throw hostiles out the breach',downside:'The breach pulls you too'},
 {id:'conduit',name:'Overcharged conduits',icon:'arc',upside:'Arc jumps farther across live lines',downside:'Live lines shock anyone standing there'},
 {id:'brood',name:'Brood-warm deck',icon:'target',upside:'30% more credits and fewer reinforcements',downside:'Egg clusters hatch Crawler pairs'},
 {id:'sealed',name:'Sealed bulkheads',icon:'shield',upside:'Known reinforcement directions',downside:'Timed lock on the exit'},
] as const;

export type ShipCondition = typeof CONDITIONS[number];
export const CONDITION_LIGHT_RADIUS = 210;
export const BROOD_HATCH_MS = 10000;

export const JUNCTION_DESTINATIONS = [3,7,11] as const;
export const isJunction = (depth:number) => JUNCTION_DESTINATIONS.some(destination=>destination===depth);
const JUNCTION_CONSEQUENCES: Readonly<Partial<Record<number,string>>> = {
 3:'Gain 35 credits after Breached Loading Bay.',
 7:'The requisition slows later arrivals in Transmission Chamber.',
 11:'Gain Overdrive charge in Swarm Junction.',
};
export const junctionConsequence = (depth:number,salvage:boolean) => salvage ? JUNCTION_CONSEQUENCES[depth] : undefined;

const GUARDED = [5,8,12,15,18,19];
export function runHeader(run:RunState) {
 if(!run.runStructure)return undefined;
 const conditions=[9,13+openingRoll(run.seed,13)%2].map(depth=>shipCondition(run,depth)?.name.toLowerCase());
 return `Run ${String(run.seed).padStart(4,'0')} · ${conditions.join(', ')}`;
}

export function shipCondition(run:RunState,depth:number,salvage=false):ShipCondition|undefined {
 if(!run.runStructure||depth<3||GUARDED.includes(depth))return undefined;
 // Keep at least one clear sector between condition assignments.
 if(!isJunction(depth)&&depth!==9&&depth!==13+openingRoll(run.seed,13)%2&&depth!==16+openingRoll(run.seed,16)%2)return undefined;
 const index=openingRoll(run.seed,depth,0x7c1a)%CONDITIONS.length;
 return CONDITIONS[(index+(salvage?1:0))%CONDITIONS.length];
}
