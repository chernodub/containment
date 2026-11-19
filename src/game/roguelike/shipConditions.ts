import {openingRoll} from '../waves/authoredEncounters';
import type {RunState} from './types';

export type ShipCondition = {
 readonly name:string;readonly reason:string;readonly upside:string;readonly downside:string;
 readonly cap?:number;readonly lull?:number;readonly charge?:number;readonly cadence?:number;
 readonly reflection?:number;readonly haze?:number;readonly movement?:number;readonly credits?:number;
};

const CONDITIONS = [
 {name:'Sealed bulkheads', reason:'Blast doors are cycling on backup power.', upside:'Two fewer hostiles can enter at once.', downside:'Each regroup lasts 0.5 s less.', cap:-2, lull:-500, reflection:.96},
 {name:'Breach alarms', reason:'The alarm draws nearby packs to the hatches.', upside:'Regroup for an extra second.', downside:'Up to two more hostiles can enter at once.', cap:2, lull:1000, reflection:1.08},
 {name:'Auxiliary power', reason:'The backup bus feeds both the hatches and your suit.', upside:'Convert 3,000 damage worth of charge on entry.', downside:'Regular arrivals are spaced 10% closer together.', charge:3000, cadence:.9, reflection:1.12},
 {name:'Emergency lighting', reason:'The deck is running on reserve lighting.', upside:'Regular arrivals are spaced 10% farther apart.', downside:'Suit speed drops 5% in the dark.', cadence:1.1, reflection:.92, movement:.95},
 {name:'Pressure purge', reason:'Venting air disperses the packs and pushes against the suit.', upside:'Regular arrivals are spaced 10% farther apart.', downside:'Suit speed drops 5% against the airflow.', cadence:1.1, movement:.95, haze:1.16},
 {name:'Salvage beacon', reason:'A recovery beacon marks valuable scrap and draws hostiles.', upside:'Earn 25 credits for clearing the room.', downside:'Regular arrivals are spaced 10% closer together.', credits:25, cadence:.9, reflection:1.05},
] satisfies readonly ShipCondition[];

export const JUNCTION_DESTINATIONS = [3,7,11] as const;
export const isJunction = (depth:number) => JUNCTION_DESTINATIONS.some(destination=>destination===depth);
const JUNCTION_CONSEQUENCES: Readonly<Partial<Record<number,string>>> = {
 3:'The recovery beacon pays 35 additional credits after Breached Loading Bay.',
 7:'The requisition diverts security power. Transmission Chamber regular arrivals are spaced 10% farther apart.',
 11:'The workshop transfers a spare capacitor. Gain charge on entering Swarm Junction.',
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
