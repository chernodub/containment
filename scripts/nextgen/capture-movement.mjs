import assert from 'node:assert/strict';

/** Every consecutive native kiting phase must move; a legal reversal may revisit its origin. */
export function assertKitingMovement(previous, player, name = 'kiting') {
  assert(player && Number.isFinite(player.x) && Number.isFinite(player.y), `${name}: invalid marine position`);
  if (previous) {
    assert(Number.isFinite(previous.x) && Number.isFinite(previous.y), `${name}: invalid prior marine position`);
    assert(Math.hypot(player.x - previous.x, player.y - previous.y) > 1, `${name}: marine did not move between phases`);
  }
  return {x: player.x, y: player.y};
}
