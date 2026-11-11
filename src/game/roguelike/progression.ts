import type {RunNode} from './types';
import {I5_ENCOUNTER_TUNING_ENABLED} from './i5Tuning';
export function progressionFor(node:RunNode){
 const story=node.id.includes(':v3-'),modern=story||node.id.includes(':v2-'),tuning=story&&I5_ENCOUNTER_TUNING_ENABLED;
 const depth=story?node.depth*11/19:node.depth,act=Math.min(2,Math.floor(depth/4));
 // Basic health and the legacy economy stay stable. Additional story pressure
 // belongs to the story encounter profile; legacy graphs retain their shipped numbers.
 const pressure=tuning&&node.depth!==9?Math.max(0,node.depth-4)/15:0;
 const guardianKind: 'warden'|'matron'|null=story?(node.depth===15?'matron':(tuning?[5,8,12,18]:[5]).includes(node.depth)?'warden':null):modern?(node.depth===3?'warden':node.depth===7?'matron':null):null;
 return Object.freeze({act,health:modern?1+depth*.045+act*.10:1,damage:(modern?1+depth*.014+act*.035:1)*(1+pressure*.18)*(tuning&&node.depth>=10?(node.depth===19?1.0:.72):1),speed:(modern?Math.min(1.14,1+depth*.008+act*.018):1)*(1+pressure*.05),eliteHealth:tuning&&node.depth>=5?1.08:modern?1.65:2,eliteDamage:tuning&&node.depth>=5&&node.depth<10?1.05:modern?1.2:2,specials:modern,guardian:guardianKind!==null,guardianKind,...(tuning&&node.depth>=10?{chargeWindupMs:1150,chargeCooldownMs:6500,chargeInitialCooldownMs:5000,championHealth:1,championDamage:1}:{})});
}
