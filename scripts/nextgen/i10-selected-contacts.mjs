import assert from 'node:assert/strict';

/** HudCombatFraming has six retained slots. Only diagnostics.contacts is live.
 * -1 is both the inactive padding value and the real Queen ID: position/count,
 * never sign, determines whether it represents a selected contact.
 */
export function activeSelectedContactIds(framing,label='framing') {
 assert(framing&&typeof framing==='object',`${label}: missing framing diagnostics`);
 const {contacts,selectedIds,focusedPair,focusContactId}=framing;
 assert(Number.isSafeInteger(contacts)&&contacts>=0&&contacts<=6,`${label}: malformed active contact count`);
 assert(Array.isArray(selectedIds)&&contacts<=selectedIds.length,`${label}: active contact count exceeds selected slots`);
 assert(typeof focusedPair==='boolean',`${label}: malformed focusedPair flag`);
 const active=selectedIds.slice(0,contacts);
 assert(active.every(id=>Number.isSafeInteger(id)&&id>=-1),`${label}: malformed active contact ID`);
 if(!focusedPair)return active;
 assert(contacts>0&&Number.isSafeInteger(focusContactId)&&focusContactId>=-1&&active.includes(focusContactId),`${label}: focused contact is absent from active slots`);
 return[focusContactId];
}

/** Missing active IDs remain evidence failures, including the real Queen -1. */
export function missingSelectedContactIds(selectedIds,contacts) {
 return selectedIds.filter(id=>!contacts.some(contact=>contact.id===id));
}
