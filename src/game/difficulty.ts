/** Run tuning only; player ability contracts never depend on difficulty. */
export type DifficultyId = 'story'|'standard'|'veteran';
export const DIFFICULTIES = Object.freeze({
 story:Object.freeze({damage:.75,rest:1.15,windups:2,waves:.9,elites:.7,pickups:1.15,overdrive:1.15}),
 standard:Object.freeze({damage:1,rest:1,windups:2,waves:1,elites:1,pickups:1,overdrive:1}),
 veteran:Object.freeze({damage:1.15,rest:1.5,windups:1,waves:.8,elites:1.2,pickups:.4,overdrive:.9}),
});
export function difficultyId(value:unknown):DifficultyId{return value==='story'||value==='veteran'?value:'standard';}
