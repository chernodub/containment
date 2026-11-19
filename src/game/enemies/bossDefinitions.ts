import type {MeleeStrikeShape} from './meleeAttacks';
/** Authored K11 third-pass body dimensions, in native simulation units (32/m). */
export const BOSS_BODIES = Object.freeze({
  warden: Object.freeze({radius:64,rankScale:2.3,minChargeSweep:38.4}),
  matron: Object.freeze({radius:46,rankScale:1.4,hatchRingMin:60.8,hatchRingMax:80}),
});
export type GuardianKind = keyof typeof BOSS_BODIES;
export function guardianRadius(kind:GuardianKind|undefined,fallback:number):number {return kind?BOSS_BODIES[kind].radius:fallback;}
/** Ordinary melee keeps its timings; only boss footprints follow the authored body tier. */
export function guardianMeleeShape(kind:GuardianKind,shape:MeleeStrikeShape):MeleeStrikeShape {
  const scale=BOSS_BODIES[kind].rankScale;
  return Object.freeze({...shape,range:shape.range*scale,width:shape.width*scale});
}
