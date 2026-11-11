import { describe, expect, it } from 'vitest';
import { AbilitySystem, ABILITY_LIMITS, segmentDistance, type AbilityHost, type AbilityPoint } from '../src/game/abilities/AbilitySystem';
import { ABILITY_CATALOG, RIG_CATALOG } from '../src/game/abilities/catalog';
import type { AbilityEvent, AbilityId, AbilitySlot, RigId } from '../src/game/abilities/contract';
import type { MutationId } from '../src/game/roguelike/types';
type Target = {
  id: number;
  x: number;
  y: number;
  radius: number;
  health: number;
};
function world(rig: RigId = 'breacher', mutations: MutationId[] = [], charge = 0) {
  const player = { x: 0, y: 0, angle: 0, radius: 16, vx: 0, vy: 0 };
  const targets: Target[] = [];
  const hits: Array<{
    id: number;
    amount: number;
  }> = [];
  const controls: Array<{
    id: number;
    kind: string;
    amount: number;
  }> = [];
  const launches: Array<{
    id: number;
    x: number;
    y: number;
  }> = [];
  const arcs: Array<{
    from: number;
    to: number[];
  }> = [];
  const events: Array<AbilityEvent & AbilityPoint> = [];
  const order: string[] = [];
  const status = new Map<number, {
    chilled: boolean;
    frozen: boolean;
  }>();
  const hidden = new Set<number>();
  let reloads = 0, wallX = Infinity;
  let traversable = (_from: AbilityPoint, _to: AbilityPoint, _radius: number) => true;
  let visible = (_from: AbilityPoint, to: AbilityPoint) => !hidden.has((to as Target).id);
  const owned = new Set(mutations);
  const host: AbilityHost = {
    player: () => player,
    targets: () => targets.filter(t => t.health > 0),
    visible: (from, to) => visible(from, to),
    traverse: (from, to, radius) => traversable(from, to, radius),
    movePlayer: (dx, dy) => {
      player.x = Math.min(wallX, Math.max(-5000, Math.min(5000, player.x + dx)));
      player.y = Math.max(-5000, Math.min(5000, player.y + dy));
    },
    damage: (t, amount) => {
      const live = targets.find(x => x.id === t.id)!;
      if (live.health <= 0) return false;
      hits.push({ id: t.id, amount });
      order.push(`damage:${t.id}`);
      live.health -= amount;
      return live.health <= 0;
    },
    statuses: id => status.get(id) ?? { chilled: false, frozen: false },
    status: (t, kind, amount) => {
      controls.push({ id: t.id, kind, amount });
      order.push(`${kind}:${t.id}`);
      const previous = status.get(t.id) ?? { chilled: false, frozen: false };
      status.set(t.id, {
        chilled: previous.chilled || kind === 'chill' || kind === 'freeze',
        frozen: previous.frozen || kind === 'freeze',
      });
    },
    launch: (t, x, y) => launches.push({ id: t.id, x, y }),
    arc: (from, to) => arcs.push({ from: from.id, to: to.map(t => t.id) }),
    has: id => owned.has(id), reload: () => { reloads++; }, emit: (event, x, y) => events.push({ ...event, x, y }),
  };
  const system = new AbilitySystem(host);
  system.setRig(rig, charge);
  const add = (x: number, y = 0) => {
    const t = { id: targets.length + 1, x, y, radius: 14, health: 1_000_000 };
    targets.push(t);
    return t;
  };
  const advance = (ms: number) => {
    for (let t = 0; t < ms; t += 50) system.update(Math.min(50, ms - t));
  };
  const use = (slot: AbilitySlot) => {
    expect(system.use(slot)).toBe(true);
    advance(ABILITY_CATALOG[RIG_CATALOG[rig].abilities[slot]].castMs);
  };
  return { system, player, targets, hits, controls, launches, arcs, events, order, status, hidden, owned, add, advance, use,
    blockAt: (x: number) => { wallX = x; }, traversal: (fn: typeof traversable) => { traversable = fn; }, visibility: (fn: typeof visible) => { visible = fn; }, get reloads() { return reloads; } };
}
const phases = (w: ReturnType<typeof world>, id: AbilityId) => w.events.filter(e => e.ability === id).map(e => e.phase);
describe('Combat Rig deterministic state and controls', () => {
  it('uses finite segment geometry including endpoints and zero length', () => {
    expect(segmentDistance({ x: 12, y: 4 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(Math.sqrt(20));
    expect(segmentDistance({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBe(5);
  });
  it('keeps immutable snapshot identity until actual simulation state changes', () => {
    const w = world(), first = w.system.snapshot;
    expect(w.system.snapshot).toBe(first);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.slots!.dash)).toBe(true);
    w.system.setIntent(1, 0, { x: 300, y: 0 });
    expect(w.system.snapshot).toBe(first);
    w.system.update(0);
    w.system.update(NaN);
    w.system.update(-1);
    expect(w.system.snapshot).toBe(first);
    w.advance(100);
    expect(w.system.snapshot).toBe(first);
    w.system.use('dash');
    expect(w.system.snapshot).not.toBe(first);
    expect(first.dashing).toBe(false);
    expect(w.system.snapshot.dashing).toBe(true);
  });
  for (const rig of ['breacher', 'cryo', 'pyro', 'arc'] as const)
    for (const slot of ['dash', 'tactical', 'power', 'overdrive'] as const) {
      it(`${rig} ${slot} exposes its catalog timing and emits matching cast/impact events`, () => {
        const w = world(rig, [], 1), id = RIG_CATALOG[rig].abilities[slot], d = ABILITY_CATALOG[id];
        expect(w.system.use(slot)).toBe(true);
        expect(w.events[0]).toMatchObject({ ability: id, slot, rig, phase: 'cast', durationMs: d.castMs });
        expect(w.system.snapshot.slots![slot].castRemainingMs).toBe(d.castMs);
        if (slot !== 'overdrive')
          expect(w.system.snapshot.slots![slot].cooldownRemainingMs).toBe(d.cooldownMs);
        if (d.castMs) {
          w.advance(d.castMs - 1);
          expect(phases(w, id)).not.toContain('impact');
          w.advance(1);
        }
        expect(phases(w, id)).toContain('impact');
        expect(w.events.every(e => Number.isFinite(e.x + e.y))).toBe(true);
      });
    }
  it('denies disabled/casting/cooldown actions without consuming extra charges', () => {
    const w = world();
    expect(w.system.use('tactical', false)).toBe(false);
    expect(w.events.at(-1)).toMatchObject({ phase: 'denied', denial: 'blocked' });
    expect(w.system.snapshot.slots!.tactical.ready).toBe(true);
    expect(w.system.use('tactical')).toBe(true);
    expect(w.system.use('power')).toBe(false);
    expect(w.events.at(-1)).toMatchObject({ phase: 'denied', denial: 'casting' });
    w.advance(220);
    expect(w.system.use('tactical')).toBe(false);
    expect(w.events.at(-1)).toMatchObject({ phase: 'denied', denial: 'cooldown' });
    w.advance(7780);
    expect(w.system.snapshot.slots!.tactical.ready).toBe(true);
    expect(phases(w, 'seismic-slam').filter(p => p === 'ready')).toHaveLength(1);
  });
  it('resets transient room state while retaining earned Overdrive charge', () => {
    const w = world('pyro');
    w.system.addCharge(1200, 2);
    w.use('power');
    w.use('dash');
    expect(w.system.snapshot.zones.length).toBeGreaterThan(0);
    w.system.resetRoom();
    expect(w.system.snapshot).toMatchObject({ zones: [], deployables: [], dashing: false, invulnerable: false, overdrive: { charge: .25 } });
    expect(w.system.snapshot.slots!.dash.charges).toBe(2);
    expect(w.system.snapshot.slots!.power.ready).toBe(true);
  });
  it('fills Overdrive once per full meter, rejects invalid receipts, and spends the complete meter', () => {
    const w = world('arc');
    for (const damage of [NaN, Infinity, -1])
      w.system.addCharge(damage, 1);
    w.system.addCharge(0, -1);
    expect(w.system.snapshot.overdrive.charge).toBe(0);
    w.system.addCharge(3000, 10);
    expect(w.system.snapshot.overdrive.charge).toBe(.75);
    w.system.addCharge(3000, 10);
    w.system.addCharge(6000, 40);
    expect(phases(w, 'overclock').filter(p => p === 'overdrive-ready')).toHaveLength(1);
    w.use('overdrive');
    expect(w.system.snapshot.overdrive.charge).toBe(0);
    expect(w.system.use('overdrive')).toBe(false);
    w.advance(6000);
    w.system.addCharge(6000);
    expect(phases(w, 'overclock').filter(p => p === 'overdrive-ready')).toHaveLength(2);
  });
});
describe('all four rig dashes', () => {
  it('uses movement direction before aim, recharges independently and preserves exactly 220ms of invulnerability', () => {
    const w = world();
    w.player.angle = Math.PI;
    w.system.setIntent(0, 1, null);
    w.use('dash');
    expect(w.system.invulnerable).toBe(true);
    w.advance(140);
    expect(w.player.x).toBeCloseTo(0);
    expect(w.player.y).toBeCloseTo(150);
    expect(w.system.dashing).toBe(false);
    expect(w.system.invulnerable).toBe(true);
    w.advance(79);
    expect(w.system.invulnerable).toBe(true);
    w.advance(1);
    expect(w.system.invulnerable).toBe(false);
    w.use('dash');
    w.advance(140);
    expect(w.system.snapshot.slots!.dash.charges).toBe(0);
    expect(w.system.use('dash')).toBe(false);
    w.advance(2240);
    expect(w.system.snapshot.slots!.dash.charges).toBe(1);
    w.advance(220);
    expect(w.system.snapshot.slots!.dash.charges).toBe(2);
    expect(phases(w, 'ram').filter(p => p === 'dash-start')).toHaveLength(2);
    expect(phases(w, 'ram').filter(p => p === 'dash-end')).toHaveLength(2);
  });
  it('follows aim when idle and stops against host collision without crossing the wall', () => {
    const w = world();
    w.blockAt(60);
    w.add(30);
    w.add(90);
    w.visibility((_from, to) => to.x <= 60);
    w.use('dash');
    w.advance(140);
    expect(w.player.x).toBe(60);
    expect(w.system.dashing).toBe(false);
    expect(w.hits).toEqual([{ id: 1, amount: 18 }]);
    expect(w.launches[0].y).toBe(350);
    expect(w.controls).toContainEqual({ id: 1, kind: 'shock', amount: 180 });
    expect(w.events.find(e => e.phase === 'dash-end')).toMatchObject({ targetX: 60, targetY: 0 });
  });
  it('Ram hits a swept target once and excludes targets outside its exact 44-unit strip and LOS', () => {
    const w = world();
    w.add(60, 22);
    w.add(60, 22.01);
    const hidden = w.add(60, -10);
    w.hidden.add(hidden.id);
    w.use('dash');
    w.advance(140);
    expect(w.hits).toEqual([{ id: 1, amount: 18 }]);
  });
  for (const [rig, id, kind] of [['cryo', 'frost-trail', 'chill'], ['pyro', 'afterburn', 'burn']] as const) {
    it(`${id} leaves the actual traveled strip and affects visible enemies only`, () => {
      const w = world(rig);
      w.use('dash');
      w.advance(140);
      const zone = w.system.snapshot.zones[0];
      expect(zone).toMatchObject({ ability: id, shape: 'strip', x: 0, y: 0, x2: 150, y2: 0, width: 44, durationMs: 2500 });
      w.add(60, 22);
      w.add(60, 22.01);
      const hidden = w.add(70, 0);
      w.hidden.add(hidden.id);
      w.advance(250);
      expect(w.controls).toEqual([{ id: 1, kind, amount: 1 }]);
      expect(w.hits).toEqual([]);
      w.advance(2500);
      expect(w.system.snapshot.zones).toEqual([]);
      expect(phases(w, id)).toContain('end');
    });
  }
  it('Static Step shocks only the three nearest visible enemies at the landing point', () => {
    const w = world('arc');
    for (const x of [150, 170, 190, 210, 311])
      w.add(x);
    w.hidden.add(w.targets[0].id);
    w.use('dash');
    w.advance(140);
    expect(w.hits).toEqual([{ id: 2, amount: 22 }, { id: 3, amount: 22 }, { id: 4, amount: 22 }]);
    expect(w.controls.every(c => c.kind === 'shock' && c.amount === 250)).toBe(true);
    expect(phases(w, 'static-step').filter(p => p === 'link')).toHaveLength(3);
  });
});
describe('tactical ability shape, line of sight and wind-up', () => {
  it('Seismic Slam waits 220ms, then damages and launches only visible targets within 230 radius', () => {
    const w = world();
    w.add(230);
    w.add(230.01);
    const hidden = w.add(100);
    w.hidden.add(hidden.id);
    expect(w.system.use('tactical')).toBe(true);
    w.advance(219);
    expect(w.hits).toEqual([]);
    w.advance(1);
    expect(w.hits).toEqual([{ id: 1, amount: 90 }]);
    expect(w.launches).toEqual([{ id: 1, x: 700, y: 0 }]);
    expect(w.events.find(e => e.phase === 'impact')).toMatchObject({ radius: 230, targetIds: [1] });
  });
  it('Cryo Nova freezes already chilled enemies, applies chill before damage and uses its exact visible radius', () => {
    const w = world('cryo');
    w.add(210);
    w.add(210.01);
    w.add(50);
    w.add(100);
    w.hidden.add(4);
    w.status.set(3, { chilled: true, frozen: false });
    w.use('tactical');
    expect(w.hits).toEqual([{ id: 3, amount: 30 }, { id: 1, amount: 30 }]);
    expect(w.controls.filter(c => c.kind === 'freeze')).toEqual([{ id: 3, kind: 'freeze', amount: 1800 }]);
    expect(w.order.indexOf('chill:1')).toBeLessThan(w.order.indexOf('damage:1'));
    expect(w.events.find(e => e.phase === 'impact')).toMatchObject({ radius: 210, targetIds: [3, 1] });
  });
  it('Flashfire uses an exact 300 range / 1.22 rad cone, including angle wrapping and walls', () => {
    const w = world('pyro');
    w.player.angle = Math.PI;
    w.add(-300);
    w.add(-300.01);
    w.add(Math.cos(Math.PI + .61) * 200, Math.sin(Math.PI + .61) * 200);
    w.add(Math.cos(Math.PI + .6101) * 200, Math.sin(Math.PI + .6101) * 200);
    w.add(-100);
    w.hidden.add(5);
    expect(w.system.use('tactical')).toBe(true);
    w.advance(79);
    expect(w.hits).toEqual([]);
    w.advance(1);
    expect(w.hits.map(h => h.id).sort()).toEqual([1, 3]);
    expect(w.hits.every(h => h.amount === 40)).toBe(true);
    expect(w.controls.every(c => c.kind === 'burn')).toBe(true);
    expect(w.events.find(e => e.phase === 'impact')).toMatchObject({ length: 300, arcRadians: 1.22 });
  });
  it('Overload starts at the aim target, chains through visible 200-range hops and never revisits a target', () => {
    const w = world('arc');
    for (let x = 100; x <= 450; x += 50)
      w.add(x);
    w.add(800);
    w.system.setIntent(0, 0, { x: 100, y: 0 });
    w.use('tactical');
    expect(w.hits.map(h => h.id)).toEqual([1, 2, 3, 4, 5, 6]);
    w.hits.forEach((h, n) => expect(h.amount).toBeCloseTo(60 * .85 ** n));
    expect(w.controls.every(c => c.kind === 'shock')).toBe(true);
    expect(phases(w, 'overload').filter(p => p === 'link')).toHaveLength(6);
    expect(w.arcs.flatMap(a => a.to).every(id => w.hits.some(h => h.id === id))).toBe(true);
    const blocked = world('arc');
    blocked.add(100);
    blocked.add(150);
    blocked.visibility((from, to) => from.x === 0 || to.x <= 100);
    blocked.system.setIntent(0, 0, { x: 100, y: 0 });
    blocked.use('tactical');
    expect(blocked.hits).toEqual([{ id: 1, amount: 60 }]);
  });
});
describe('power placement, deployable collision and lifetimes', () => {
  for (const [rig, id, range, castMs] of [['cryo', 'glacier', 420, 150], ['pyro', 'napalm-charge', 480, 350], ['arc', 'tesla-pylon', 440, 100]] as const) {
    it(`${id} clamps cursor range and rejects blocked placement before consuming cooldown`, () => {
      const w = world(rig);
      w.system.setIntent(0, 0, { x: 10000, y: 0 });
      w.traversal(() => false);
      expect(w.system.use('power')).toBe(false);
      expect(w.system.snapshot.slots!.power).toMatchObject({ready:false,charges:1,cooldownRemainingMs:0});
      expect(w.events.at(-1)).toMatchObject({ phase: 'denied', denial: 'blocked' });
      w.traversal(() => true);
      expect(w.system.use('power')).toBe(true);
      w.advance(castMs);
      expect(w.events.find(e => e.phase === 'cast')).toMatchObject({ targetX: range, targetY: 0, durationMs: castMs });
      expect(id === 'napalm-charge' ? w.system.snapshot.zones[0].x : w.system.snapshot.deployables[0].x).toBe(range);
    });
  }
  it('Bulwark blocks swept hostile motion and projectiles, takes damage and releases its footprint on destruction', () => {
    const w = world();
    w.use('power');
    expect(w.system.snapshot.deployables[0]).toMatchObject({ kind: 'barrier', x: 70, y: 0, length: 220, thickness: 18, health: 240, remainingMs: 6000 });
    expect(w.system.blocksMovement({ x: 0, y: 0 }, { x: 150, y: 0 }, 14)).toBe(true);
    expect(w.system.blocksMovement({ x: 0, y: 124.01 }, { x: 150, y: 124.01 }, 14)).toBe(false);
    expect(w.system.interceptProjectile({ x: 0, y: 0 }, { x: 150, y: 0 }, 2, 40)).toBe(true);
    expect(w.system.snapshot.deployables[0].health).toBe(200);
    expect(w.system.interceptProjectile({ x: 0, y: 0 }, { x: 150, y: 0 }, 2, 200)).toBe(true);
    expect(w.system.snapshot.deployables).toEqual([]);
    expect(w.system.blocksMovement({ x: 0, y: 0 }, { x: 150, y: 0 }, 14)).toBe(false);
    expect(w.system.interceptProjectile({ x: 0, y: 0 }, { x: 150, y: 0 }, 2, 1)).toBe(false);
  });
  it('Bulwark can be attacked by touching enemies and expires so it cannot leave enemies stuck', () => {
    const w = world();
    w.add(70);
    w.use('power');
    w.advance(3000);
    expect(w.system.snapshot.deployables).toEqual([]);
    expect(phases(w, 'bulwark')).toContain('end');
    const expiry = world();
    expiry.use('power');
    expiry.advance(5999);
    expect(expiry.system.snapshot.deployables).toHaveLength(1);
    expiry.advance(1);
    expect(expiry.system.snapshot.deployables).toEqual([]);
  });
  for (const destroy of [false, true])
    it(`Glacier shatters exactly once on ${destroy ? 'destruction' : 'expiry'} with visible 150-radius damage/chill`, () => {
      const w = world('cryo');
      w.system.setIntent(0, 0, { x: 300, y: 0 });
      w.use('power');
      w.add(450);
      w.add(450.01);
      w.add(350);
      w.hidden.add(3);
      if (destroy)
        expect(w.system.interceptProjectile({ x: 0, y: 0 }, { x: 600, y: 0 }, 1, 160)).toBe(true);
      else
        w.advance(5000);
      expect(w.hits).toEqual([{ id: 1, amount: 80 }]);
      expect(w.controls).toEqual([{ id: 1, kind: 'chill', amount: 2 }]);
      expect(phases(w, 'glacier').filter(p => p === 'burst')).toHaveLength(1);
      w.advance(1000);
      expect(w.hits).toHaveLength(1);
      expect(w.system.blocksMovement({ x: 0, y: 0 }, { x: 600, y: 0 }, 14)).toBe(false);
    });
  it('rejects walls whose full length cannot fit the authored geometry without spending cooldown', () => {
    const w = world('cryo');
    w.system.setIntent(0, 0, { x: 300, y: 0 });
    w.traversal((from, to) => Math.abs(to.y - from.y) < 100);
    expect(w.system.use('power')).toBe(false);
    expect(w.system.snapshot.slots!.power).toMatchObject({ready:false,charges:1,cooldownRemainingMs:0});
    expect(w.events.at(-1)).toMatchObject({ phase: 'denied', denial: 'blocked' });
    expect(w.system.snapshot.deployables).toEqual([]);
  });
  it('Napalm ticks exactly every 250ms inside its visible 120-radius pool for six seconds', () => {
    const w = world('pyro');
    w.system.setIntent(0, 0, { x: 300, y: 0 });
    w.use('power');
    w.add(420);
    w.add(420.01);
    w.add(350);
    w.hidden.add(3);
    w.advance(249);
    expect(w.hits).toEqual([]);
    w.advance(1);
    expect(w.hits).toEqual([{ id: 1, amount: 4.5 }]);
    w.advance(5750);
    expect(w.hits).toHaveLength(24);
    expect(w.controls.every(c => c.kind === 'burn')).toBe(true);
    expect(w.system.snapshot.zones).toEqual([]);
  });
  it('Tesla Pylon zaps the nearest visible enemy and its live link only while the marine is close', () => {
    const w = world('arc');
    w.system.setIntent(0, 0, { x: 200, y: 0 });
    w.use('power');
    w.add(100);
    w.add(200, 200);
    w.add(150, 14.01);
    w.add(230);
    w.hidden.add(4);
    w.advance(499);
    expect(w.hits).toEqual([{ id: 1, amount: 12 }]);
    w.advance(1);
    expect(w.hits).toEqual([{ id: 1, amount: 12 }, { id: 3, amount: 26 }]);
    expect(w.system.blocksMovement({ x: 0, y: 0 }, { x: 400, y: 0 }, 14)).toBe(false);
    w.player.x = -100;
    w.advance(500);
    expect(w.hits.slice(2)).toEqual([{ id: 3, amount: 26 }]);
    w.advance(8000);
    expect(w.system.snapshot.deployables).toEqual([]);
  });

  it('damages an enemy crossing the pylon link between zap pulses, with a per-target 500ms cooldown', () => {
    const w=world('arc');w.system.setIntent(0,0,{x:200,y:0});w.use('power');
    const target=w.add(100,-60);w.advance(50);
    target.y=60;w.advance(50);
    expect(w.hits).toEqual([{id:target.id,amount:12}]);
    expect(w.events.at(-1)).toMatchObject({phase:'link',width:28,targetIds:[target.id]});
    target.y=-60;w.advance(50);
    expect(w.hits.filter(h=>h.amount===12)).toHaveLength(1);
    w.advance(400);target.y=0;w.advance(50);
    expect(w.hits.filter(h=>h.amount===12)).toHaveLength(2);
  });

  it('detects a marine-swept link even when the target is outside both endpoint links', () => {
    const w=world('arc');w.system.setIntent(0,0,{x:200,y:0});w.use('power');
    w.add(100,40);w.advance(50);expect(w.hits).toEqual([]);
    w.player.y=160;w.advance(50);
    expect(w.hits).toEqual([{id:1,amount:12}]);
    const snapshot=w.system.snapshot;
    expect(snapshot.links).toEqual([{id:snapshot.deployables[0].id,ability:'tesla-pylon',element:'arc',x:200,y:0,targetX:0,targetY:160,width:28}]);
    expect(Object.isFrozen(snapshot.links)).toBe(true);expect(Object.isFrozen(snapshot.links![0])).toBe(true);
    expect(snapshot.deployables[0]).not.toHaveProperty('linkCooldowns');
    expect(snapshot.deployables[0]).not.toHaveProperty('tick');
    expect(w.system.snapshot).toBe(snapshot);
    w.player.x=-100;expect(w.system.snapshot.links).toEqual([]);
  });

  it('does not sweep a disconnected link on reconnection or hit through world occlusion', () => {
    const w=world('arc');w.system.setIntent(0,0,{x:200,y:0});w.use('power');
    w.player.x=-100;w.add(100,40);w.advance(50);
    w.player.x=0;w.player.y=160;w.advance(50);expect(w.hits).toEqual([]);
    w.hidden.add(1);w.player.y=0;w.advance(50);expect(w.hits).toEqual([]);
    w.visibility(()=>false);w.advance(1);expect(w.system.snapshot.links).toEqual([]);
  });

  it('bounds and prunes pylon target histories and cooldowns without exposing mutable maps', () => {
    const w=world('arc');w.system.setIntent(0,0,{x:200,y:0});w.use('power');
    for(let i=0;i<200;i++)w.add(100,-60);
    w.advance(50);for(const t of w.targets)t.y=60;w.advance(50);
    expect(w.hits).toHaveLength(ABILITY_LIMITS.targets);
    expect(w.system['previousTargets'].size).toBe(ABILITY_LIMITS.targets);
    expect(w.system['deployables'][0].linkCooldowns.size).toBe(ABILITY_LIMITS.targets);
    w.targets.length=0;w.advance(50);
    expect(w.system['previousTargets'].size).toBe(0);expect(w.system['deployables'][0].linkCooldowns.size).toBe(0);
    w.system.resetRoom();expect(w.system.snapshot.links).toEqual([]);
  });
});
describe('Overdrive effects and exact bounds', () => {
  it('Railbreaker chooses the nearer collision wall rather than the target’s side of the aim line', () => {
    const w=world('breacher',[],1);w.add(100,1);
    w.traversal((_from,to)=>to.y>=-100&&to.y<=1000);
    w.use('overdrive');
    expect(w.launches[0].y).toBe(-4800);
    expect(w.hits).toEqual([{id:1,amount:420}]);
  });
  it('Railbreaker waits 600ms, pierces the 900x44 aim line and launches affected targets sideways', () => {
    const w = world('breacher', [], 1);
    w.add(900, 22);
    w.add(900.01);
    w.add(100, 22.01);
    w.add(-1);
    w.add(100, -20);
    w.add(200);
    w.hidden.add(6);
    expect(w.system.use('overdrive')).toBe(true);
    w.advance(599);
    expect(w.hits).toEqual([]);
    w.advance(1);
    expect(w.hits).toEqual([{ id: 1, amount: 420 }, { id: 5, amount: 420 }]);
    expect(w.launches).toEqual([{ id: 1, x: -0, y: 4800 }, { id: 5, x: 0, y: -4800 }]);
    expect(w.events.find(e => e.ability === 'railbreaker' && e.phase === 'link')).toMatchObject({ length: 900, width: 44, targetX: 900, targetY: 0 });
  });
  it('Whiteout follows the marine, chills visible targets, freezes every two seconds and shatters frozen kills', () => {
    const w = world('cryo', [], 1);
    w.use('overdrive');
    w.player.x = 500;
    w.add(800);
    w.add(800.01);
    w.add(600);
    w.hidden.add(3);
    w.advance(2000);
    expect(w.hits).toHaveLength(8);
    expect(w.hits.every(h => h.id === 1 && h.amount === 4)).toBe(true);
    expect(w.controls.filter(c => c.kind === 'freeze')).toEqual([{ id: 1, kind: 'freeze', amount: 1000 }]);
    const victim = w.add(750);
    victim.health = 0;
    w.system.onKill(victim, true);
    expect(w.hits.slice(8)).toEqual([{ id: 1, amount: 40 }, { id: 2, amount: 40 }]);
    expect(phases(w, 'whiteout')).toContain('burst');
    w.advance(6000);
    expect(w.system.snapshot.zones).toEqual([]);
  });
  it('Meltdown gives eight seconds of speed/igniting shots, exact aura damage and bounded kill bursts', () => {
    const w = world('pyro', [], 1);
    w.add(130);
    w.add(130.01);
    w.use('overdrive');
    expect(w.system.moveSpeedMultiplier).toBe(1.25);
    expect(w.system.ignitingShots).toBe(true);
    w.advance(250);
    expect(w.hits).toEqual([{ id: 1, amount: 4 }]);
    const victim = w.add(130);
    victim.health = 0;
    w.system.onKill(victim, false);
    expect(w.hits.filter(h => h.amount === 20).map(h => h.id)).toEqual([1, 2]);
    w.advance(7750);
    expect(w.system.moveSpeedMultiplier).toBe(1);
    expect(w.system.ignitingShots).toBe(false);
  });
  it('Overclock exposes hostile-only time scale for six seconds while friendly cooldowns advance normally', () => {
    const w = world('arc', [], 1);
    w.use('tactical');
    w.use('overdrive');
    expect(w.system.hostileTimeScale).toBe(.3);
    expect(w.system.overclocked).toBe(true);
    w.advance(1000);
    expect(w.system.snapshot.slots!.tactical.cooldownRemainingMs).toBe(6000);
    expect(w.system.snapshot.overdrive.activeRemainingMs).toBe(5000);
    w.advance(5000);
    expect(w.system.hostileTimeScale).toBe(1);
    expect(w.system.overclocked).toBe(false);
    expect(phases(w, 'overclock').filter(p => p === 'end')).toHaveLength(1);
  });
});
describe('all twelve augment runtime effects', () => {
  it('Reserve Thruster stores three independently recharging dash charges', () => {
    const w = world('arc', ['reserve-thruster']);
    expect(w.system.snapshot.slots!.dash.maxCharges).toBe(3);
    for (let n = 0; n < 3; n++) {
      w.use('dash');
      w.advance(140);
    }
    expect(w.system.snapshot.slots!.dash.charges).toBe(0);
    w.advance(2180);
    expect(w.system.snapshot.slots!.dash.charges).toBe(1);
    w.advance(140);
    expect(w.system.snapshot.slots!.dash.charges).toBe(2);
    w.advance(140);
    expect(w.system.snapshot.slots!.dash.charges).toBe(3);
  });
  it('Tactical Salvage refunds 350ms per kill, updates snapshots and emits ready once without banking excess', () => {
    const w = world('arc', ['tactical-salvage']);
    const victim = w.add(100);
    w.use('tactical');
    const before = w.system.snapshot;
    w.system.onKill(victim);
    expect(w.system.snapshot).not.toBe(before);
    expect(w.system.snapshot.slots!.tactical.cooldownRemainingMs).toBe(6650);
    for (let n = 0; n < 30; n++)
      w.system.onKill(victim);
    expect(w.system.snapshot.slots!.tactical.cooldownRemainingMs).toBe(0);
    expect(phases(w, 'overload').filter(p => p === 'ready')).toHaveLength(1);
    w.advance(7000);
    w.use('tactical');
    expect(w.system.snapshot.slots!.tactical.cooldownRemainingMs).toBe(7000);
  });
  it('Drive Dynamo multiplies damage and kill charge by 1.3 and caps at a full meter', () => {
    const w = world('arc', ['drive-dynamo']);
    w.system.addCharge(600, 2);
    expect(w.system.snapshot.overdrive.charge).toBeCloseTo(.195);
    w.system.addCharge(6000, 40);
    expect(w.system.snapshot.overdrive.charge).toBe(1);
  });
  it('Slide Loader reloads exactly once per accepted dash and never on rejected presses', () => {
    const w = world('arc', ['slide-loader']);
    w.use('dash');
    expect(w.reloads).toBe(1);
    expect(w.system.use('dash')).toBe(false);
    expect(w.reloads).toBe(1);
    w.advance(140);
    w.use('dash');
    expect(w.reloads).toBe(2);
  });
  it('Afterquake adds exactly one 35-damage pulse 450ms later at the original Slam impact point', () => {
    const w = world('breacher', ['afterquake']);
    w.add(230);
    w.use('tactical');
    w.player.x = 1000;
    w.advance(449);
    expect(w.hits).toEqual([{ id: 1, amount: 90 }]);
    w.advance(1);
    expect(w.hits).toEqual([{ id: 1, amount: 90 }, { id: 1, amount: 35 }]);
    w.advance(1000);
    expect(w.hits).toHaveLength(2);
    expect(w.events.filter(e => e.phase === 'impact').every(e => e.x === 0 && e.radius === 230)).toBe(true);
  });
  it('Reinforced Bulwark doubles health and adds exactly two seconds of lifetime', () => {
    const w = world('breacher', ['reinforced-bulwark']);
    w.use('power');
    expect(w.system.snapshot.deployables[0]).toMatchObject({ health: 480, maxHealth: 480, durationMs: 8000 });
    w.advance(7999);
    expect(w.system.snapshot.deployables).toHaveLength(1);
    w.advance(1);
    expect(w.system.snapshot.deployables).toEqual([]);
  });
  it('Spreading Nova counts only visible pre-chilled targets in the original radius and caps added radius at 100', () => {
    const w = world('cryo', ['spreading-nova']);
    for (let n = 0; n < 6; n++) {
      const t = w.add(100 + n * 10);
      w.status.set(t.id, { chilled: true, frozen: false });
    }
    w.add(310);
    w.add(310.01);
    w.use('tactical');
    expect(w.events.find(e => e.phase === 'impact')).toMatchObject({ radius: 310 });
    expect(w.hits.map(h => h.id)).toContain(7);
    expect(w.hits.map(h => h.id)).not.toContain(8);
    const one = world('cryo', ['spreading-nova']);
    one.add(200);
    one.status.set(1, { chilled: true, frozen: false });
    one.add(230);
    one.status.set(2, { chilled: true, frozen: false });
    one.add(250);
    one.use('tactical');
    expect(one.events.find(e => e.phase === 'impact')).toMatchObject({ radius: 230 });
    expect(one.hits.map(h => h.id)).toEqual([1, 2]);
  });
  it('Twin Glacier creates two parallel full-health walls 40 units along either side of placement', () => {
    const w = world('cryo', ['twin-glacier']);
    w.system.setIntent(0, 0, { x: 300, y: 0 });
    w.use('power');
    expect(w.system.snapshot.deployables.map(d => ({ x: d.x, y: d.y, health: d.health, angle: d.angle }))).toEqual([{ x: 260, y: 0, health: 160, angle: 0 }, { x: 340, y: 0, health: 160, angle: 0 }]);
  });
  it('Scorched Fan adds one 120-radius pool 180 forward for 2500ms', () => {
    const w = world('pyro', ['scorched-fan']);
    w.use('tactical');
    expect(w.system.snapshot.zones).toHaveLength(1);
    expect(w.system.snapshot.zones[0]).toMatchObject({ x: 180, y: 0, radius: 120, durationMs: 2500 });
    w.advance(2500);
    expect(w.system.snapshot.zones).toEqual([]);
  });
  it('Napalm Triplet replaces the original with three radius-80 pools offset 100 laterally for 6s', () => {
    const w = world('pyro', ['napalm-triplet']);
    w.system.setIntent(0, 0, { x: 300, y: 0 });
    w.use('power');
    expect(w.system.snapshot.zones.map(z => ({ x: z.x, y: z.y, radius: z.radius, durationMs: z.durationMs }))).toEqual([-100, 0, 100].map(y => ({ x: 300, y, radius: 80, durationMs: 6000 })));
  });
  it('Napalm Triplet skips blocked side pools while retaining the clear center and opposite side', () => {
    const w = world('pyro', ['napalm-triplet']);
    w.system.setIntent(0, 0, { x: 300, y: 0 });
    w.traversal((_from, to) => to.y <= 0);
    w.use('power');
    expect(w.system.snapshot.zones.map(z => z.y)).toEqual([-100, 0]);
  });
  it('Forked Overload raises the distinct target cap from six to eight', () => {
    const w = world('arc', ['forked-overload']);
    for (let n = 0; n < 10; n++)
      w.add(50 + n * 40);
    w.system.setIntent(0, 0, { x: 50, y: 0 });
    w.use('tactical');
    expect(w.hits.map(h => h.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
  it('Twin Glacier skips an obstructed additional wall without moving its clear partner', () => {
    const w = world('cryo', ['twin-glacier']);
    w.system.setIntent(0, 0, { x: 300, y: 0 });
    w.traversal((_from, to) => to.x < 330);
    w.use('power');
    expect(w.system.snapshot.deployables.map(d => d.x)).toEqual([260]);
  });
  it('a hostile projectile crossing twin walls damages the first wall along its swept direction', () => {
    const w = world('cryo', ['twin-glacier']);
    w.system.setIntent(0, 0, { x: 300, y: 0 });
    w.use('power');
    expect(w.system.interceptProjectile({ x: 600, y: 0 }, { x: 0, y: 0 }, 1, 10)).toBe(true);
    expect(w.system.snapshot.deployables.map(d => ({ x: d.x, health: d.health }))).toEqual([{ x: 260, health: 160 }, { x: 340, health: 150 }]);
  });
  it('Twin Pylon deploys two normal pylons offset 50 laterally from the cursor', () => {
    const w = world('arc', ['twin-pylon']);
    w.system.setIntent(0, 0, { x: 300, y: 0 });
    w.use('power');
    expect(w.system.snapshot.deployables.map(d => ({ x: d.x, y: d.y, health: d.health, durationMs: d.durationMs }))).toEqual([{ x: 300, y: -50, health: 100, durationMs: 9000 }, { x: 300, y: 50, health: 100, durationMs: 9000 }]);
  });
});
describe('deterministic ability replay and bounded soak', () => {
  function replay(rig: RigId) {
    const w = world(rig, ['reserve-thruster', 'tactical-salvage', 'drive-dynamo', 'slide-loader', 'twin-glacier', 'twin-pylon', 'napalm-triplet', 'scorched-fan', 'afterquake'], 1);
    for (let n = 0; n < 70; n++)
      w.add(100 + (n % 10) * 30, Math.floor(n / 10) * 30 - 90);
    for (let ms = 0; ms < 120000; ms += 50) {
      if (ms % 500 === 0) {
        w.system.setIntent(ms % 1000 ? 1 : 0, ms % 1000 ? 0 : 1, { x: 200, y: 0 });
        for (const slot of ['dash', 'tactical', 'power', 'overdrive'] as const)
          w.system.use(slot);
        w.system.addCharge(120, 1);
      }
      w.system.update(50);
      const s = w.system.snapshot;
      expect(s.zones.length).toBeLessThanOrEqual(ABILITY_LIMITS.zones);
      expect(s.deployables.length).toBeLessThanOrEqual(ABILITY_LIMITS.deployables);
      expect(Number.isFinite(w.player.x + w.player.y + s.overdrive.charge)).toBe(true);
      for (const e of [...s.zones, ...s.deployables])
        expect(Number.isFinite(e.x + e.y + e.remainingMs)).toBe(true);
    }
    return { snapshot: w.system.snapshot, hits: w.hits, events: w.events, controls: w.controls, player: w.player };
  }
  for (const rig of ['breacher', 'cryo', 'pyro', 'arc'] as const)
    it(`${rig} stays finite and bounded and replays identically through two minutes of spam`, () => {
      expect(replay(rig)).toEqual(replay(rig));
    });
});


describe('fractional fixed-step ability boundaries', () => {
  it('keeps every 60Hz zone pulse, including the exact final pulse and freeze boundary', () => {
    const pyro=world('pyro',[],1);pyro.add(50);pyro.use('overdrive');
    for(let i=0;i<30;i++)pyro.system.update(1000/60);
    expect(pyro.hits).toHaveLength(2);
    for(let i=30;i<480;i++)pyro.system.update(1000/60);
    expect(pyro.hits).toHaveLength(32);
    expect(pyro.system.snapshot.zones).toHaveLength(0);
    expect(phases(pyro,'meltdown').filter(p=>p==='end')).toHaveLength(1);
    const cryo=world('cryo',[],1);cryo.add(50);cryo.use('overdrive');
    for(let i=0;i<120;i++)cryo.system.update(1000/60);
    expect(cryo.controls.filter(c=>c.kind==='freeze')).toHaveLength(1);
  });
  it('starts dash trails with their full catalog lifetime and clears slot activity with the last zone', () => {
    const w=world('cryo');w.use('dash');w.advance(140);
    expect(w.system.snapshot.zones[0].remainingMs).toBe(2500);
    expect(w.system.snapshot.slots!.dash.activeRemainingMs).toBe(2500);
    w.advance(2499);expect(w.system.snapshot.zones[0].remainingMs).toBe(1);
    w.advance(1);expect(w.system.snapshot.zones).toHaveLength(0);
    expect(w.system.snapshot.slots!.dash.activeRemainingMs).toBe(0);
  });
  it('resolves casts, restores charges and ends Overclock without an extra fractional frame', () => {
    const ram=world();ram.use('dash');
    for(let i=0;i<156;i++)ram.system.update(1000/60);
    expect(ram.system.snapshot.slots!.dash.charges).toBe(2);
    expect(phases(ram,'ram').filter(p=>p==='ready')).toHaveLength(1);
    const slam=world();slam.add(50);slam.system.use('tactical');
    for(let i=0;i<6;i++)slam.system.update(220/6);
    expect(slam.hits).toHaveLength(1);expect(slam.system.snapshot.slots!.tactical.castRemainingMs).toBe(0);
    const arc=world('arc',[],1);arc.use('overdrive');
    for(let i=0;i<360;i++)arc.system.update(1000/60);
    expect(arc.system.snapshot.overdrive.activeRemainingMs).toBe(0);
    expect(arc.system.hostileTimeScale).toBe(1);
    expect(phases(arc,'overclock').filter(p=>p==='end')).toHaveLength(1);
  });
});


describe('snapshot reads by synchronous presentation subscribers', () => {
  for(const [rig,slot,mutations] of [['pyro','overdrive',[]],['cryo','dash',[]],['arc','power',['twin-pylon']]] as const)
    it(`keeps ${rig} ${slot} activation and entities fresh after subscriber reads`, () => {
      const w=world(rig,[...mutations],1),emit=w.system['host'].emit;
      w.system['host'].emit=(event,x,y)=>{emit(event,x,y);void w.system.snapshot;};
      w.system.setIntent(0,0,{x:300,y:0});
      expect(w.system.use(slot)).toBe(true);
      if(slot==='dash')expect(w.system.snapshot.dashing).toBe(true);
      if(slot==='overdrive')expect(w.system.snapshot.overdrive.active).toBe(true);
      if(slot==='power'){
        expect(w.system.snapshot.slots!.power.castRemainingMs).toBe(100);
        w.advance(100);expect(w.system.snapshot.deployables).toHaveLength(2);
      }
      const snapshot=w.system.snapshot;expect(w.system.snapshot).toBe(snapshot);
    });
  it('does not retain another slot’s old cooldown from a ready-event read', () => {
    const w=world(),emit=w.system['host'].emit;
    w.system['host'].emit=(event,x,y)=>{emit(event,x,y);void w.system.snapshot;};
    w.use('dash');w.advance(140);w.use('tactical');w.advance(2240);
    expect(w.system.snapshot.slots!.dash.charges).toBe(2);
    expect(w.system.snapshot.slots!.tactical.cooldownRemainingMs).toBe(3540);
  });
});


it('power readiness predicts the current legal placement and preserves charges on blocked input', () => {
  const w=world('pyro');w.traversal((_from,to)=>to.x<300);
  w.system.setIntent(0,0,{x:100,y:0});
  expect(w.system.snapshot.slots!.power.ready).toBe(true);
  const ready=w.system.snapshot;expect(w.system.snapshot).toBe(ready);
  w.system.setIntent(0,0,{x:400,y:0});
  expect(w.system.snapshot.slots!.power).toMatchObject({ready:false,charges:1,cooldownRemainingMs:0});
  const blocked=w.system.snapshot;expect(w.system.use('power')).toBe(false);
  expect(w.system.snapshot).toBe(blocked);
  w.system.setIntent(0,0,{x:200,y:0});expect(w.system.snapshot.slots!.power.ready).toBe(true);
});
