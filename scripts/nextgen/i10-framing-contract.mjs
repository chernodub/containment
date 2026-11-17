import assert from 'node:assert/strict';

/** C6 trades impossible remote pair pullback for hero scale and a native danger bearing. */
export function assertPriorityPair(evidence, viewport, name='priority pair') {
 const proof=evidence.g6FramingProof,room=evidence.roomFraming;
 assert(proof?.framing,`${name}: missing native framing receipt`);
 const ids=proof.framing.focusedPair?[proof.framing.focusContactId]:proof.framing.selectedIds.filter(id=>id>=0);
 assert(ids.length>0,`${name}: missing organic priority contact`);
 assert(room&&room.heroPixels>=(room.emergencyPullback?85:100)*viewport.height/1080-.1,`${name}: hero size floor lost`);
 assert((room.smallX?room.centeredX:room.outsideX<=.18001)&&(room.smallZ?room.centeredZ:room.outsideZ<=.18001),`${name}: room-area constraint lost`);
 assert(room.smallX||room.smallZ||room.outside<=.18001,`${name}: outside room area exceeds18%`);
 for(const id of ids){
  const contact=proof.contacts.find(c=>c.id===id);assert(contact,`${name}: missing selected contact ${id}`);
  if(contact.insideUsable)continue;
  const marker=evidence.ui.threatMarkers?.find(m=>m.enemyId===id||m.enemyIds?.includes(id));
  assert(marker&&marker.opacity>=((marker.attacking||marker.approaching)? .84 : .30)&&marker.bounds.left>=0&&marker.bounds.top>=0&&marker.bounds.right<=viewport.width&&marker.bounds.bottom<=viewport.height,`${name}: remote contact ${id} has no readable native danger bearing`);
 }
 assert(evidence.marineBounds.bottom-evidence.marineBounds.top>=viewport.height*.065,`${name}: organic marine became too small`);
}
