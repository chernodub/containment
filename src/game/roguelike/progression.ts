import type {RunNode} from './types';
export function progressionFor(node:RunNode){
 const story=node.id.includes(':v3-'),modern=story||node.id.includes(':v2-');
 const depth=story?node.depth*11/19:node.depth,act=Math.min(2,Math.floor(depth/4));
 // Keep basic health and the legacy recovery economy stable. Story pressure grows
 // through pursuit/contact danger after the welcoming first five rooms.
 const pressure=story&&node.depth!==9?Math.max(0,node.depth-4)/15:0;
 const guardianKind: 'warden'|'matron'|null=story?(node.depth===15?'matron':[5,8,12,18].includes(node.depth)?'warden':null):modern?(node.depth===3?'warden':node.depth===7?'matron':null):null;
 return Object.freeze({act,health:modern?1+depth*.045+act*.10:1,damage:(modern?1+depth*.014+act*.035:1)*(1+pressure*.28),speed:(modern?Math.min(1.14,1+depth*.008+act*.018):1)*(1+pressure*.07),eliteHealth:story&&node.depth>=5?1.25:modern?1.65:2,eliteDamage:modern?1.2:2,specials:modern,guardian:guardianKind!==null,guardianKind});
}
