/** Run tuning only; player ability contracts never depend on difficulty. */
export type DifficultyId = 'story'|'standard'|'veteran';
export const DIFFICULTIES = Object.freeze({
 story:Object.freeze({damage:1.3,rest:1.05,windups:2,waves:1.25,elites:.7,pickups:.95,overdrive:1.15,lateWaves:1,lateElites:1,lateOverdrive:1,lateRest:1,lateWindups:1,lateStagger:1,lateMovement:1}),
 standard:Object.freeze({damage:2,rest:.8,windups:2,waves:1.5,elites:1,pickups:.7,overdrive:1,lateWaves:1,lateElites:1,lateOverdrive:1,lateRest:1,lateWindups:1,lateStagger:1,lateMovement:1}),
 veteran:Object.freeze({damage:2.25,rest:.75,windups:2,waves:1.5,elites:1,pickups:.55,overdrive:1,lateWaves:1,lateElites:1,lateOverdrive:1,lateRest:1,lateWindups:1,lateStagger:1,lateMovement:1}),
});
export function difficultyId(value:unknown):DifficultyId{return value==='story'||value==='veteran'?value:'standard';}
