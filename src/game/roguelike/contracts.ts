import {openingRoll} from '../waves/authoredEncounters';

export const CONTRACT_PROFILE_KEY = 'containment.profile.expedition-finished.v1';

const CONTRACTS = [
 {name:'Field discipline', objective:'Clear every room in the sector without using a medkit.', reward:'One free boon reroll'},
 {name:'Suit integrity', objective:'Take at most 60 total health and armor damage in the sector.', reward:'Restore up to 25 armor'},
 {name:'Rapid response', objective:'Clear every room in the sector within 90 seconds per room.', reward:'Convert 6,000 damage worth of Overdrive charge'},
] as const;

export const contractFor = (seed:number) => CONTRACTS[contractIndex(seed)];
export const contractIndex = (seed:number) => openingRoll(seed,0,0x8c4b)%CONTRACTS.length;
export const contractSector = (depth:number) => depth<7?0:depth<14?1:2;
// The last payout precedes the finale so the reward can be used.
export const CONTRACT_ENDS = [6,13,18] as const;
