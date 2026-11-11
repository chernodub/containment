import {describe, expect, it} from 'vitest';
import {detectSnapshotDefects, overlapArea, overlaps} from './diagnostics.mjs';

function snapshot() {
  return {
    node: {id: 'a', templateId: 'awakening-bay'}, status: 'playing', elapsed: 1, loading: false,
    player: {x: 230, y: 740, screen: {x: 600, y: 400, depth: .98}},
    combat: {health: 89.1, armor: 10, magazine: 8, magazineCapacity: 12},
    abilities: {slots: {tactical: {ready: false, cooldownRemainingMs: 1000}}, overdrive: {ready: false, charge: .5}, zones: [], deployables: [], links: []},
    enemies: [{id: 1, x: 500, y: 700, health: 25}], remaining: 1,
    hud: {health: '90', magazine: '08', slots: [{slot: 'tactical', state: 'cooling', value: '1.0'}]},
  };
}
const kinds = (s, previous) => detectSnapshotDefects(s, previous).map(defect => defect.kind);

describe('playtest snapshot diagnostics', () => {
  it('accepts ceil health, padded ammo and genuine cooldowns without mutating snapshots', () => {
    const current = snapshot(), before = structuredClone(current);
    expect(detectSnapshotDefects(current, snapshot())).toEqual([]);
    expect(current).toEqual(before);
  });
  it('allows one stale HUD frame but reports persistent authoritative mismatch', () => {
    const s = snapshot(); s.hud.slots[0].state = 'ready'; s.hud.health = '100'; s.hud.magazine = '12';
    expect(kinds(s, snapshot())).toEqual([]);
    expect(kinds(s, structuredClone(s))).toEqual(['hud-ready-authority-denied', 'hud-health-desync', 'hud-ammo-desync']);
    const otherRoom = structuredClone(s); otherRoom.node.id = 'b';
    expect(kinds(s, otherRoom)).toEqual([]);
  });
  it('uses Overdrive meter readiness rather than a slot cooldown', () => {
    const s = snapshot(); s.hud.slots = [{slot: 'overdrive', state: 'ready'}];
    s.abilities.slots.overdrive = {ready: true};
    expect(kinds(s, structuredClone(s))).toEqual(['hud-ready-authority-denied']);
    s.abilities.overdrive.ready = true;
    expect(kinds(s, structuredClone(s))).toEqual([]);
  });
  it('ignores missing/unparseable HUD text, denied feedback and paused lag', () => {
    const s = snapshot(); s.hud = {health: undefined, ammo: null, slots: [{slot: 'tactical', state: 'denied'}]};
    expect(kinds(s, structuredClone(s))).toEqual([]);
    s.status = 'paused'; s.hud.health = '100';
    expect(kinds(s, structuredClone(s))).toEqual([]);
  });
  it('checks living coordinates, projection and encounter count without treating corpses or Queen targets as standard enemies', () => {
    const s = snapshot(); s.enemies = [{id: 2, health: 0, x: NaN, y: NaN}, {id: -1, health: 10, x: 10, y: 10}]; s.remaining = 0;
    expect(kinds(s)).toEqual([]);
    s.enemies.push({id: 3, health: 10, x: Infinity, y: 0});
    s.player.screen.x = NaN;
    expect(kinds(s)).toEqual(['nonfinite-projection', 'nonfinite-position', 'encounter-counter-underflow']);
  });
  it('checks resource validity but allows the infinite reserve of a pistol', () => {
    const s = snapshot(); s.combat.reserve = Infinity;
    expect(kinds(s)).toEqual([]);
    s.combat.health = NaN; s.abilities.overdrive.charge = 1.1;
    expect(kinds(s)).toEqual(['invalid-combat-resource', 'invalid-overdrive-meter']);
  });
  it('allows paused effects but rejects simulation objects persisting into a reward/terminal screen', () => {
    const s = snapshot(); s.abilities.zones = [{id: 8, ability: 'napalm-charge', x: 0, y: 0}]; s.status = 'paused';
    expect(kinds(s)).toEqual([]);
    for (const status of ['reward', 'route', 'dead', 'complete', 'menu']) {
      s.status = status; expect(kinds(s)).toEqual(['ability-objects-after-room-exit']);
    }
  });
  it('treats paused context recovery as expected and flags active combat without loading protection', () => {
    const s = snapshot(); s.performance = {graphicsLost: true}; s.status = 'paused';
    expect(kinds(s)).toEqual([]);
    s.status = 'playing'; s.loading = true; expect(kinds(s)).toEqual([]);
    s.loading = false; expect(kinds(s)).toEqual(['context-lost-combat-active']);
  });
  it('checks only explicitly collected opaque panels against the projected marine', () => {
    const s = snapshot(); s.hud.marine = {left: 100, top: 100, right: 140, bottom: 160};
    s.hud.opaqueBounds = [{id: 'action-bar', bounds: {left: 120, top: 150, right: 300, bottom: 200}}];
    const defects = detectSnapshotDefects(s, structuredClone(s));
    expect(defects[0]).toMatchObject({kind: 'hud-covers-marine', panel: 'action-bar', overlapPixels: 200});
    s.loading=true;expect(kinds(s,structuredClone(s))).toEqual([]);
    const recovering=structuredClone(s);s.loading=false;expect(kinds(s,recovering)).toEqual([]);
    expect(kinds(s,structuredClone(s))).toEqual(['hud-covers-marine']);
  });
});

describe('rectangle overlap', () => {
  it('accepts edge or size notation and counts positive area precisely', () => {
    expect(overlapArea({x: 0, y: 0, width: 10, height: 10}, {left: 5, top: 5, right: 20, bottom: 20})).toBe(25);
    expect(overlaps({left: 0, top: 0, right: 10, bottom: 10}, {left: 10, top: 0, right: 20, bottom: 10})).toBe(false);
  });
  it('ignores hidden/empty and invalid rectangles', () => {
    for (const value of [null, {}, {x: NaN, y: 0, width: 5, height: 5}, {left: 2, top: 2, right: 1, bottom: 1}]) expect(overlapArea(value, {x: 0, y: 0, width: 10, height: 10})).toBe(0);
  });
});
