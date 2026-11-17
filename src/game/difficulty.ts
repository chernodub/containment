/** Run tuning only; player ability contracts never depend on difficulty. */
export type DifficultyId = 'story'|'standard'|'veteran';
export const DIFFICULTIES = Object.freeze({
 story:Object.freeze({damage:.7,rest:1.05,windups:2,waves:1.25,elites:.7,pickups:.95,overdrive:1.15,lateWaves:1,lateElites:1,lateOverdrive:1,lateRest:1,lateWindups:1,lateStagger:1,lateMovement:1}),
 standard:Object.freeze({damage:1,rest:.8,windups:2,waves:1.5,elites:1,pickups:.7,overdrive:1,lateWaves:1,lateElites:1,lateOverdrive:1,lateRest:1,lateWindups:1,lateStagger:1,lateMovement:1}),
 veteran:Object.freeze({damage:1.3,rest:.75,windups:2,waves:1.5,elites:1,pickups:.55,overdrive:1,lateWaves:1,lateElites:1,lateOverdrive:1,lateRest:1,lateWindups:1,lateStagger:1,lateMovement:1}),
});
export function difficultyId(value:unknown):DifficultyId{return value==='story'||value==='veteran'?value:'standard';}

/** Final per-contact ceilings include elite, depth and difficulty scaling. */
export function incomingDamageLimit(mode:DifficultyId,family:string):number {
 const base:Record<string,number>={crawler:12,stalker:26,spitter:12,carrier:22,brute:42};
 return Math.min(45,(base[family]??45)*(mode==='story'?.7:mode==='veteran'?1.3:1));
}
