import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { EnemySystem } from '../src/game/enemies/EnemySystem';
import { DepthGame } from '../src/DepthGame';
import { expeditionRewardOffers } from '../src/game/roguelike/expedition';
import { SpatialHash } from '../src/game/enemies/SpatialHash';
import { canTraverseExpedition, createExpeditionGeometry } from '../src/game/world/expeditionGeometry';
import { generateRun } from '../src/game/roguelike/run';
const player = { x: 700, y: 500, radius: 16, angle: 0 };
const step = (system: EnemySystem, n: number) => { for (let i = 0; i < n; i++)
    system.update(1000 / 60, player); };
function clearance(system: EnemySystem) { let min = Infinity; const bodies = system.snapshot.enemies; for (let i = 0; i < bodies.length; i++)
    for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i], b = bodies[j];
        min = Math.min(min, Math.hypot(a.x - b.x, a.y - b.y) - a.radius - b.radius);
    } return min; }
describe('A3 crowd constraints', () => {
    it('settles sixty coincident bodies without steering jitter', () => {
        const system = new EnemySystem({ route: e => e });
        for (let i = 0; i < 60; i++)
            system.spawn(i % 4 === 0 ? 'brute' : 'crawler', 350, 350);
        step(system, 600);
        expect(clearance(system)).toBeGreaterThanOrEqual(-.1);
        const before = system.snapshot.enemies;
        step(system, 120);
        const drift = Math.max(...system.snapshot.enemies.map((e, i) => Math.hypot(e.x - before[i].x, e.y - before[i].y)));
        expect(drift).toBeLessThan(.2);
    });
    it('keeps frozen bodies anchored and permits launch passage before settling', () => {
        let launched = true;
        const system = new EnemySystem({ route: e => e, launched: id => id === 1 && launched });
        system.spawn('crawler', 400, 400);
        system.spawn('crawler', 400, 400);
        system.setSlow(2, 0);
        step(system, 1);
        expect(system.snapshot.enemies.map(e => e.x)).toEqual([400, 400]);
        launched = false;
        step(system, 30);
        expect(system.getSnapshot(2)).toMatchObject({ x: 400, y: 400 });
        expect(clearance(system)).toBeGreaterThanOrEqual(0);
    });
    it('separates around Queen/nest anchors without moving them', () => {
        const solid = { x: 400, y: 400, radius: 92, health: 100 };
        const system = new EnemySystem({ route: e => e, immovables: () => [solid] });
        system.spawn('crawler', 410, 400);
        step(system, 60);
        const e = system.snapshot.enemies[0];
        expect(Math.hypot(e.x - solid.x, e.y - solid.y)).toBeGreaterThanOrEqual(e.radius + solid.radius);
        expect(solid).toEqual({ x: 400, y: 400, radius: 92, health: 100 });
    });
    it('retains stable radius-sized slots, ranged spacing and a marine-width escape lane', () => {
        const system = new EnemySystem();
        for (let i = 0; i < 12; i++)
            system.spawn(i % 3 === 0 ? 'brute' : i % 3 === 1 ? 'crawler' : 'stalker', 650 + i % 4 * 22, 450 + Math.floor(i / 4) * 22);
        system.spawn('spitter', 450, 500);
        system.spawn('carrier', 470, 550);
        step(system, 600);
        const engaged = system.snapshot.enemies.filter(e => e.engagement === 'engaged');
        expect(engaged.length).toBeGreaterThan(0);
        expect(engaged.length).toBeLessThanOrEqual(4);
        expect(system.snapshot.enemies.filter(e => e.engagement === 'ranged')).toHaveLength(2);
        expect(system.snapshot.enemies.some(e => e.engagement === 'waiting')).toBe(true);
        const slots = engaged.map(e => e.attackSlot);
        step(system, 30);
        for (let i = 0; i < engaged.length; i++)
            expect(system.getSnapshot(engaged[i].id)?.attackSlot).toEqual(slots[i]);
        for (const e of engaged) {
            expect(Object.isFrozen(e.attackSlot)).toBe(true);
            expect(Math.cos(e.attackSlot!.angle)).toBeLessThan(0);
        }
        // A straight forward ray swept with the marine radius clears every assigned disc.
        for (let x = 0; x < 80; x += 2)
            for (const e of system.snapshot.enemies)
                expect(Math.hypot(player.x + x - e.x, player.y - e.y)).toBeGreaterThanOrEqual(player.radius + e.radius - .3);
        expect(clearance(system)).toBeGreaterThanOrEqual(-.25);
    });
    it('never projects a packed crowd through a recorded wall corner or void', () => {
        const node = generateRun(1729, 3).nodes.find(n => n.templateId === 'shielding-gate')!, geometry = createExpeditionGeometry(node);
        const system = new EnemySystem({ route: e => e, canMove: c => canTraverseExpedition(geometry, { x: c.fromX, y: c.fromY }, { x: c.toX, y: c.toY }, c.radius) });
        for (let i = 0; i < 12; i++)
            system.spawn('spitter', 289.3859237654455, 107.50048220650496);
        for (let i = 0; i < 120; i++) {
            const before = system.snapshot.enemies;
            system.update(1000 / 60, player);
            for (const [j, e] of system.snapshot.enemies.entries())
                expect(canTraverseExpedition(geometry, before[j], e, e.radius)).toBe(true);
        }
    });
    it('keeps ordinary marine movement and dash passage through living enemies', () => {
        const game = new DepthGame();
        game.newRun(1729);
        game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
        Object.assign(game.player, { x: 300, y: 440 });
        game.enemies.reset();
        game.enemies.spawn('brute', 330, 440);
        const moved = game.moveCorpse(game.player, 80, 0);
        expect(moved.x).toBeCloseTo(380);
        game.abilities.setIntent(1, 0, { x: 500, y: 440 });
        expect(game.useAbility('dash')).toBe(true);
        game.update(50);
        expect(game.player.x).toBeGreaterThan(300);
        expect(game.abilities.invulnerable).toBe(true);
    });
    it('replays the same crowd and inputs to an identical state hash', () => {
        const run = () => { const system = new EnemySystem(); for (let i = 0; i < 60; i++)
            system.spawn(i % 7 === 0 ? 'stalker' : 'crawler', 400 + i % 8 * 9, 300 + Math.floor(i / 8) * 9); for (let i = 0; i < 360; i++)
            system.update(1000 / 60, { ...player, x: 700 + i / 3 }); return createHash('sha256').update(JSON.stringify(system.snapshot)).digest('hex'); };
        expect(run()).toBe(run());
    });
    it('provides reusable deterministic local SpatialHash queries', () => {
        const hash = new SpatialHash<{
            id: string;
            x: number;
            y: number;
        }>(32), a = { id: 'a', x: 32, y: 32 }, b = { id: 'b', x: 33, y: 32 };
        hash.insert(a);
        hash.insert(b);
        const out: typeof a[] = [];
        expect(hash.queryRadiusInto(32, 32, 4, out)).toBe(out);
        expect(out).toEqual([a, b]);
        b.x = 100;
        hash.update(b);
        hash.queryRadiusInto(32, 32, 4, out);
        expect(out).toEqual([a]);
    });
});

it('keeps pair projections symmetric when spawn order changes', () => {
    const solve = (reverse: boolean) => {
        const system = new EnemySystem({route: e => e});
        for (const x of reverse ? [515, 500] : [500, 515]) system.spawn('crawler', x, 350);
        system.update(1000 / 60, {x: 2000, y: 1000});
        return system.snapshot.enemies.map(e => ({x: e.x, y: e.y})).sort((a, b) => a.x - b.x);
    };
    expect(solve(false)).toEqual(solve(true));
    expect((solve(false)[0].x + solve(false)[1].x) / 2).toBeCloseTo(507.5);
});

it('resets engagement caches and traffic state for identical seeded inputs', () => {
    const system = new EnemySystem();
    const run = () => {
        for (let i = 0; i < 18; i++) system.spawn(i % 3 ? 'crawler' : 'stalker', 500 + i % 6 * 12, 420 + Math.floor(i / 6) * 12);
        step(system, 180);
        return JSON.stringify(system.snapshot);
    };
    const before = run();
    system.reset();
    expect(run()).toBe(before);
});

it('bounds reusable spatial queries even for malformed or enormous radii', () => {
    const hash = new SpatialHash<{id:string;x:number;y:number}>();
    const item = {id: 'one', x: 30, y: 30};
    hash.insert(item);
    const out: typeof item[] = [];
    for (const radius of [NaN, Infinity, -1]) expect(hash.queryRadiusInto(30, 30, radius, out)).toEqual([]);
    expect(hash.queryRadiusInto(30, 30, Number.MAX_VALUE, out)).toEqual([item]);
});
