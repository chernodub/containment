import type { DifficultyId } from '../difficulty';
import type { RunState } from './types';
import type { DetourChoice } from './economy';

const junctions = [
 { depth: 5, rooms: ['Freight Hold', 'Breached Loading Bay'], threats: ['Crawler rush', 'Spitter crossfire'], openings: [0, 1], consequence: ['Relay Racks · a loader crosses the shutter lane', 'Relay Racks · the shutter gunner holds its perch'] },
 { depth: 13, rooms: ['Infested Workshop', 'Swarm Junction'], threats: ['Crawler rush', 'Spitter and heavy hold'], openings: [0, 2], consequence: ['Shielding Gate · the first flank comes from inspection', 'Shielding Gate · the first flank comes from sterilization'] },
] as const;

export type RoomOrder = Readonly<Partial<Record<number, DetourChoice>>>;

export function orderJunction(run: RunState, depth = run.completedNodeIds.length - 1) {
 return run.roomOrder && junctions.find(junction => junction.depth === depth);
}

export function orderRoom(order: RoomOrder | undefined, position: number) {
 const junction = junctions.find(entry => order?.[entry.depth] && (position === entry.depth + 1 || position === entry.depth + 2));
 if (!junction) return { depth: position };
 const second = position === junction.depth + 2;
 const room = Number(second !== (order![junction.depth] === 'salvage'));
 return { depth: junction.depth + 1 + room, opening: junction.openings[room], second };
}

const standardOrderRecovery=Object.freeze({hp:0,armor:10});
const storyOrderRecovery=Object.freeze({hp:20,armor:0});
export function orderRecovery(difficulty:DifficultyId){
 return difficulty==='standard'?standardOrderRecovery:storyOrderRecovery;
}
