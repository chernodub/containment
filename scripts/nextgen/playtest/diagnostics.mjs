/** Pure snapshot checks. They observe authoritative state and never call game methods. */
const finite = value => typeof value === 'number' && Number.isFinite(value);
const sameRoom = (a, b) => !!a && !!b && (a.node?.id ?? a.run?.currentNodeId) === (b.node?.id ?? b.run?.currentNodeId);
const integerText = value => typeof value === 'string' && /^\s*\d+\s*$/.test(value) ? Number(value.trim()) : undefined;
const alive = s => (s.enemies ?? []).filter(enemy => enemy.health > 0);

function rectangle(value) {
  if (!value) return null;
  const left = value.left ?? value.x, top = value.top ?? value.y;
  const right = value.right ?? (finite(left) && finite(value.width) ? left + value.width : undefined);
  const bottom = value.bottom ?? (finite(top) && finite(value.height) ? top + value.height : undefined);
  return [left, top, right, bottom].every(finite) && right > left && bottom > top ? {left, top, right, bottom} : null;
}

/** Positive overlap only; touching edges, hidden/empty and invalid bounds do not overlap. */
export function overlapArea(first, second) {
  const a = rectangle(first), b = rectangle(second);
  if (!a || !b) return 0;
  return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
}

/** Whether two visible rectangles cover any common pixel area. */
export function overlaps(first, second) {
  return overlapArea(first, second) > 0;
}

function readyMismatch(s, slot) {
  const hud = s.hud?.slots?.find(entry => entry.slot === slot);
  const authoritative = slot === 'overdrive' ? s.abilities?.overdrive : s.abilities?.slots?.[slot];
  return hud?.state === 'ready' && authoritative?.ready === false;
}

function healthMismatch(s) {
  const shown = integerText(s.hud?.health);
  return shown !== undefined && finite(s.combat?.health) && shown !== Math.ceil(s.combat.health);
}

function ammoMismatch(s) {
  const shown = integerText(s.hud?.magazine ?? s.hud?.ammo);
  return shown !== undefined && finite(s.combat?.magazine) && shown !== s.combat.magazine;
}

/**
 * Detect definite structural failures and persistent HUD desyncs.
 * HUD comparisons need consecutive playing samples in one room to tolerate one RAF of refresh lag.
 * Optional hud.opaqueBounds entries are {id,bounds}; the collector decides which panels are opaque.
 */
export function detectSnapshotDefects(s, previous) {
  const defects = [];
  const add = (kind, area, severity, details) => defects.push({kind, area, severity, room: s.node?.templateId, elapsed: s.elapsed, ...details});
  const points = [
    ['player', s.player],
    ...alive(s).map(enemy => [`enemy:${enemy.id}`, enemy]),
    ...(s.hazards ?? []).map((hazard, i) => [`hazard:${i}`, hazard]),
    ...(s.abilities?.zones ?? []).map(zone => [`ability-zone:${zone.id}`, zone]),
    ...(s.abilities?.deployables ?? []).map(deployable => [`deployable:${deployable.id}`, deployable]),
  ];
  for (const [entity, point] of points) {
    if (point && (!finite(point.x) || !finite(point.y))) add('nonfinite-position', 'sim', 'high', {entity, position: {x: point.x, y: point.y}});
    if (point?.screen && (!finite(point.screen.x) || !finite(point.screen.y) || !finite(point.screen.depth))) add('nonfinite-projection', 'render', 'high', {entity, projection: point.screen});
  }
  for (const key of ['health', 'armor', 'magazine', 'magazineCapacity']) {
    if (s.combat && key in s.combat && (!finite(s.combat[key]) || s.combat[key] < 0)) add('invalid-combat-resource', 'sim', 'high', {resource: key, value: s.combat[key]});
  }
  const charge = s.abilities?.overdrive?.charge;
  if (charge !== undefined && (!finite(charge) || charge < 0 || charge > 1)) add('invalid-overdrive-meter', 'sim', 'high', {charge});
  const standardEnemies = alive(s).filter(enemy => enemy.id > 0);
  if (s.status === 'playing' && finite(s.remaining) && s.remaining < standardEnemies.length) add('encounter-counter-underflow', 'sim', 'high', {remaining: s.remaining, livingEnemies: standardEnemies.length});
  if (['reward', 'route', 'dead', 'complete', 'menu'].includes(s.status)) {
    const lingering = ['zones', 'deployables', 'links'].flatMap(key => (s.abilities?.[key] ?? []).map(value => ({kind: key, id: value.id, ability: value.ability})));
    if (lingering.length) add('ability-objects-after-room-exit', 'sim', 'medium', {status: s.status, lingering});
  }
  if (s.performance?.graphicsLost === true && s.status === 'playing' && !s.loading) add('context-lost-combat-active', 'render', 'high', {});
  const settled = s.status === 'playing' && previous?.status === 'playing' && sameRoom(s, previous) && !s.loading && !previous.loading;
  if (settled) {
    for (const slot of ['dash', 'tactical', 'power', 'overdrive']) {
      if (readyMismatch(s, slot) && readyMismatch(previous, slot)) add('hud-ready-authority-denied', 'ui', 'medium', {slot, hud: s.hud.slots.find(entry => entry.slot === slot), authoritative: slot === 'overdrive' ? s.abilities.overdrive : s.abilities.slots[slot]});
    }
    if (healthMismatch(s) && healthMismatch(previous)) add('hud-health-desync', 'ui', 'medium', {shown: s.hud.health, actual: s.combat.health});
    if (ammoMismatch(s) && ammoMismatch(previous)) add('hud-ammo-desync', 'ui', 'medium', {shown: s.hud.magazine ?? s.hud.ammo, actual: s.combat.magazine});
  }
  if (settled) {
    for (const panel of s.hud?.opaqueBounds ?? []) {
      const area = overlapArea(s.hud.marine, panel.bounds);
      if (area > 0) add('hud-covers-marine', 'ui', 'medium', {panel: panel.id, overlapPixels: area, marine: s.hud.marine, bounds: panel.bounds});
    }
  }
  return defects;
}
