/** Run tuning only; player ability contracts never depend on difficulty.
 * windups/lateWindups bound small-family melee admissions, not warning duration. */
export type DifficultyId = 'story'|'standard'|'veteran';
export const DIFFICULTIES = Object.freeze({
 story:Object.freeze({meleeTokens:1,rangedTokens:1,damage:.7,rest:1.05,windups:2,waves:1.25,elites:.7,pickups:.95,overdrive:1.15,lateWaves:1.9,lateElites:1,lateOverdrive:1,lateRest:.85,lateWindups:2,lateStagger:1,lateMovement:1}),
 standard:Object.freeze({meleeTokens:2,rangedTokens:1,damage:1,rest:.72,windups:2,waves:1.5,elites:1,pickups:.42,overdrive:1,lateWaves:2,lateElites:1,lateOverdrive:1,lateRest:.54,lateWindups:2.5,lateStagger:1,lateMovement:1,finalActArrivalSpacing:.52,finalActConcurrentBonus:3}),
 veteran:Object.freeze({meleeTokens:3,rangedTokens:2,damage:1.3,rest:.75,windups:2,waves:1.5,elites:1,pickups:.45,overdrive:1,lateWaves:2.5,lateElites:1,lateOverdrive:1,lateRest:.5,lateWindups:2.5,lateStagger:1,lateMovement:1}),
});
export function difficultyId(value:unknown):DifficultyId{return value==='story'||value==='veteran'?value:'standard';}

/** Final per-contact ceilings include elite, depth and difficulty scaling. */
export function incomingDamageLimit(mode:DifficultyId,family:string):number {
 const base:Record<string,number>={crawler:12,stalker:26,spitter:12,carrier:22,brute:42};
 return Math.min(45,(base[family]??45)*(mode==='story'?.7:mode==='veteran'?1.3:1));
}

/** Depth is zero-based. Veteran and legacy expeditions retain the original step. */
export function latePressureProgress(depth: number, mode: DifficultyId, authored: boolean): number {
 if (depth < 10) return 0;
 return authored && mode === 'story' ? Math.min(1, (depth - 9) / 3) : 1;
}
