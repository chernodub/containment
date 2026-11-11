/** Deterministic decision helpers; these never call game actions. */
export {BOT_POLICY_VERSION} from './bot-navigation-version.mjs';
export const RIGS = ['breacher', 'cryo', 'pyro', 'arc'];
const PATHS = {
  breacher: ['breacher', 'heavy-pellets', 'chain-reaction', 'seismic-impact', 'afterquake', 'reinforced-bulwark'],
  cryo: ['cryogenic', 'cold-snap', 'absolute-zero', 'shattershot', 'ice-lance', 'permafrost', 'frostbite', 'frost-armor', 'glacial-wake', 'spreading-nova', 'twin-glacier'],
  pyro: ['incendiary', 'scavenger', 'combustion', 'thermal-shock', 'scorched-fan', 'napalm-triplet'],
  arc: ['hot-reload', 'magnetic-feed', 'reactor-cascade', 'last-shell', 'rapid-cycle', 'crossfire', 'forked-overload', 'twin-pylon'],
};
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
/** Prefer own augments, then path enablers, universal cooldown/charge, survival. */
export function chooseBoon(ids, rig, owned = []) {
  const score = id => {
    const path = PATHS[rig] ?? [];
    if (path.slice(-2).includes(id)) return 130;
    if (id === path[0] && !owned.includes(path[0])) return 120;
    if (path.includes(id)) return 100;
    if (['reserve-thruster', 'drive-dynamo', 'tactical-salvage', 'slide-loader'].includes(id)) return 90;
    if (/plating|armor|vital|scavenger|vamp|recovery/.test(id)) return 60;
    return 10;
  };
  return [...ids].sort((a, b) => score(b) - score(a) || a.localeCompare(b))[0];
}
/** Safe routes before elites; prefer medical over supplies at low health. */
export function chooseRoute(routes, health = 100) {
  return [...routes].sort((a, b) => {
    const score = r => (r.kind === 'elite' ? -100 : 0) + (r.kind === 'medical' && health < 75 ? 50 : 0) + (r.kind === 'armory' ? 10 : 0);
    return score(b) - score(a) || a.id.localeCompare(b.id);
  })[0];
}
/** Focus a visible spitter/champion; never aim at a dead or occluded target. */
export function chooseTarget(enemies, player) {
  return enemies.filter(e => e.health > 0 && e.clear && e.visible && e.vulnerable !== false).sort((a, b) => {
    const score = e => (e.id === -1 ? 1000 : e.champion || e.id < 0 ? 600 : 0) + (e.type === 'spitter' ? 400 : 0) + (e.elite ? 180 : 0) - distance(e, player);
    return score(b) - score(a) || a.id - b.id;
  })[0];
}
/** Score legal movement endpoints for spacing, fire lanes and hazard avoidance. */
export function chooseMovement(s, previous = {x: 0, y: 0}) {
  const target = chooseTarget(s.enemies, s.player);
  const chase = !target && s.enemies.length ? [...s.enemies].sort((a, b) => distance(a, s.player) - distance(b, s.player))[0] : null;
  let best = null, highest = -Infinity;
  for (const c of s.candidates.filter(c => c.legal)) {
    const nearest = Math.min(800, ...s.enemies.map(e => distance(c, e)));
    const desired = s.combat.weapon === 'shotgun' ? 220 : 360;
    let score = Math.min(nearest, desired) * .6;
    if (target) score -= Math.abs(distance(c, target) - desired) * .3;
    if (chase && c.waypoint) score -= distance(c, c.waypoint) * 1.5;
    for (const h of s.hazards) score -= Math.max(0, h.radius + 100 - distance(c, h)) * 5;
    score += (c.dx * previous.x + c.dy * previous.y) * 14;
    if (c.clear) score += 45;
    if (score > highest) { highest = score; best = c; }
  }
  return best ?? {dx: 0, dy: 0, x: s.player.x, y: s.player.y};
}
/** Slots with an actual tactical opportunity; normal input remains authoritative. */
export function chooseActions(s) {
  const near = Math.min(Infinity, ...s.enemies.map(e => distance(e, s.player)));
  const danger = near < 105 || s.hazards.some(h => distance(s.player, h) < h.radius + 50);
  const slots = s.abilities.slots;
  const keys = [];
  if (s.combat.health < 40 && s.combat.medkits > 0) keys.push('e');
  if (danger && slots?.dash?.ready) keys.push('Shift');
  if (slots?.tactical?.ready && near < (s.rig === 'arc' ? 500 : 240)) keys.push('q');
  if ((slots?.power?.ready || s.abilityAims?.power && slots?.power?.charges > 0 && !s.abilities.dashing && !Object.values(slots).some(slot => slot.castRemainingMs > 0)) && s.enemies.length >= 2) keys.push('f');
  if (s.abilities.overdrive.ready && (s.enemies.length >= 6 || s.enemies.some(e => e.champion || e.id < 0))) keys.push('v');
  if (s.combat.magazine < s.combat.magazineCapacity * .25 && !s.combat.reloading && near > 300) keys.push('r');
  if (s.combat.grenades > 0 && s.enemies.filter(e => distance(e, s.player) < 400).length >= 5) keys.push('g');
  return keys.filter(key => {
    const slot = {q:'tactical', f:'power', v:'overdrive'}[key];
    return !slot || !s.abilityAims || !(slot in s.abilityAims) || !!s.abilityAims[slot];
  });
}
/** Exact sample quantiles, avoiding averages-of-percentiles. */
export function quantiles(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  const at = q => sorted[Math.max(0, Math.ceil(sorted.length * q) - 1)] ?? null;
  return {samples: sorted.length, p50: at(.5), p95: at(.95), max: at(1)};
}

/** Begin a mouse hold over the marine's unobstructed canvas, then aim anywhere. */
export function pointerFirePlan(target, marine, alreadyHeld) {
  const aim = {type:'move',x:target.x,y:target.y};
  if (alreadyHeld) return [aim];
  return [
    {type:'move',x:(marine.left+marine.right)/2,y:(marine.top+marine.bottom)/2},
    {type:'down'}, aim,
  ];
}

/** A long preparation is evidence; only the separately bounded timeout aborts play. */
export function assessLoading(elapsedMs, recorded = false) {
  return {record:elapsedMs>5000&&!recorded,timeout:elapsedMs>120000};
}

/** Include every inspectable map destination, not only the currently selected departure. */
export function routeOptions(actions) {
  const choices = new Map();
  for (const action of actions) {
    const id = action.inspect ?? action.route;
    if (!id) continue;
    const kind = /medical/.test(id) ? 'medical' : /elite/.test(id) ? 'elite' : /armory/.test(id) ? 'armory' : 'combat';
    choices.set(id, {id, kind});
  }
  return [...choices.values()];
}
