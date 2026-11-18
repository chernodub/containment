import type {GameEffect} from '../../DepthGame';

/** Camera/pose clock requests only; these never scale the authoritative game clock. */
export function combatPresentationHoldSeconds(effect:GameEffect):number {
 if(effect.type==='ability')return effect.ability?.slot==='overdrive'&&effect.ability.phase==='impact' ? .04 : 0;
 if(effect.type==='hurt')return (effect.damage??0)>=36 ? .045 : 0;
 return effect.type==='corpse'&&effect.elite ? .035 : 0;
}
