import type {ShipCondition} from '../game/roguelike/shipConditions';
import {icon} from './icons';

export function conditionChip(condition:ShipCondition,countdown=0,phase=''){
  return `<small class="condition-chip">${icon(condition.icon)}${condition.name}${countdown>0?`<em class="condition-countdown">· ${phase}${Math.ceil(countdown/1000)}s</em>`:''}</small>`;
}
