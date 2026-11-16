/** Run tuning only; player ability contracts never depend on difficulty. */
export type DifficultyId = 'story'|'standard'|'veteran';
export const DIFFICULTIES = Object.freeze({
 story:Object.freeze({damage:.75,rest:1.15,windups:2,waves:.9,elites:.7,pickups:1.15,overdrive:1.15,lateWaves:1,lateElites:1,lateOverdrive:1,lateRest:1,lateWindups:1,lateStagger:1,lateMovement:1}),
 standard:Object.freeze({damage:1,rest:1,windups:2,waves:1,elites:1,pickups:1,overdrive:1,lateWaves:1,lateElites:1,lateOverdrive:1,lateRest:1,lateWindups:1,lateStagger:1,lateMovement:1}),
 veteran:Object.freeze({damage:1.3,rest:1.4,windups:2,waves:.8,elites:1.2,pickups:1.15,overdrive:1,lateWaves:1,lateElites:1,lateOverdrive:1,lateRest:.6,lateWindups:2,lateStagger:.5,lateMovement:1}),
});
export function difficultyId(value:unknown):DifficultyId{return value==='story'||value==='veteran'?value:'standard';}
