import type { AugmentId } from '../abilities/augmentCatalog';
import type { AbilityEvent } from '../abilities/contract';

export const RIG_DRILL_PROMPTS: Partial<Record<AugmentId, string>> = {
  'siege-plow': 'F · Set Bulwark ahead of the targets and let it advance into them',
  'fault-line': 'Q · Aim through the targets and keep them in the fissure',
  'shard-harvest': 'Q · Freeze a target, then shoot it to send shards into its neighbor',
  'ice-road': 'F · Lay Glacier through a target to chill it along the runway',
  'ember-relay': 'F · Put one target at the edge of Napalm and let the fire spread',
  'meltdown-core': 'V · Stay in range through the fuse and detonate near the targets',
  'pilgrim-pylon': 'F · Move and re-angle until the pylon link touches a target',
  'live-wire': 'Q · Tether one target, then step sideways to sweep the other',
};

export function demonstratedAugment(augment: AugmentId, event: AbilityEvent, targets: readonly number[]): boolean {
  if (!event.targetIds?.some(id => targets.includes(id))) return false;
  switch (augment) {
    case 'siege-plow': return event.ability==='bulwark'&&event.phase==='impact'&&event.entityId!==undefined;
    case 'fault-line': return event.ability==='seismic-slam'&&event.phase==='tick';
    case 'shard-harvest': return event.ability==='cryo-nova'&&event.phase==='burst';
    case 'ice-road': return event.ability==='frost-trail'&&event.phase==='tick'&&event.width===100;
    case 'ember-relay': return event.ability==='flashfire'&&event.phase==='impact'&&event.radius===24;
    case 'meltdown-core': return event.ability==='meltdown'&&event.phase==='burst';
    case 'pilgrim-pylon': return event.ability==='tesla-pylon'&&event.phase==='link'&&event.width!==undefined;
    case 'live-wire': return event.ability==='overload'&&event.phase==='link'&&event.entityId!==undefined&&event.targetIds.length>1;
    default: return false;
  }
}
