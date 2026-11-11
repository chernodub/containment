import { describe, expect, it } from 'vitest';
import { runSimulation, summarizeSimulations } from './sim-core.ts';
import { compareCampaigns } from './sim-compare.mjs';
import { actorMetrics } from './sim-metrics.mjs';
describe('render-free campaign player', () => {
    it('records censored fight state and recent decisions without turning a room timeout into a death', async () => {
        const report = runSimulation({rig: 'arc', seed: 1729, rooms: 1, maxRoomSeconds: 1.4, metrics: await actorMetrics()});
        expect(report.outcome).toBe('stalled');
        expect(report.deathRoom).toBeNull();
        expect(report.final.reason).toBe('max-room-seconds');
        expect(report.final.node.depth).toBe(0);
        expect(report.final.remaining).toBeGreaterThan(0);
        expect(report.final.enemies.length).toBeGreaterThan(0);
        for (const enemy of report.final.enemies) {
            expect(Number.isFinite(enemy.x + enemy.y + enemy.health)).toBe(true);
            expect(typeof enemy.clear).toBe('boolean');
            expect(typeof enemy.visible).toBe('boolean');
        }
        expect(report.final.combat.health).toBeGreaterThan(0);
        expect(report.final.resources).toHaveProperty('ammo');
        expect(report.final.abilities.rig).toBe('arc');
        expect(report.final.recentDecisions.length).toBeGreaterThan(0);
        expect(report.final.recentDecisions.length).toBeLessThanOrEqual(20);
        expect(report.final.noCombatProgressSeconds).toBeGreaterThanOrEqual(0);
        expect(report.final.stats).toEqual(report.stats);
    });

    it('keeps native/simulation discrepancies and rejects mismatched comparison cohorts', () => {
        const stats = {kills: {total: 12}, damageDealt: {weapon: 100, ability: 50, status: 0, boon: 0}, overdrivesUsed: 0, damageTaken: 10};
        const native = {rig: 'arc', seed: 1729, outcome: 'complete', wallSeconds: 50, stats, rooms: [{nodeId: '1729:v3-r0', depth: 0, result: 'clear', seconds: 30, damageTaken: 10, overdrives: 0}]};
        const simulated = {...native, wallSeconds: 2, stats: {...stats, damageTaken: 5}, rooms: [{...native.rooms[0], seconds: 35, damageTaken: 5}]};
        const comparison = compareCampaigns(native, simulated);
        expect(comparison.exactRoomTimes).toBe(0);
        expect(comparison.rooms[0]).toMatchObject({secondsDelta: 5, nativeDamageTaken: 10, simDamageTaken: 5});
        expect(comparison.wallSpeedup).toBe(25);
        expect(() => compareCampaigns(native, {...simulated, seed: 42})).toThrow('must match');
    });
    it('repeats actual seeded opening combat with earned resources and authoritative receipts', async () => {
        const metrics = await actorMetrics(), options = { rig: 'arc', seed: 1729, rooms: 1, metrics };
        const a = runSimulation(options), b = runSimulation(options);
        expect(a.outcome).toBe('room-limit');
        expect(a.rooms).toHaveLength(1);
        expect(a.rooms[0].result).toBe('clear');
        expect(a.rooms[0].seconds).toBeGreaterThan(1);
        expect(a.rooms[0].boons).toEqual(['breacher']);
        expect(a.stats.kills.total).toBe(12);
        expect(a.stats.overdrivesUsed).toBe(0);
        expect(a.stats.damageDealt.weapon).toBeGreaterThan(0);
        expect(a.stats.damageDealt.ability).toBeGreaterThan(0);
        expect(a.stats).toEqual(b.stats);
        expect(a.rooms).toEqual(b.rooms);
        expect(a.final.stats).toEqual(a.stats);
    }, 15000);
    it('aggregates only completed campaigns while preserving deaths and depth denominators', () => {
        const r = { rig: 'arc', seed: 42, outcome: 'dead', deathRoom: 9, wallSeconds: 1, stats: { overdrivesUsed: 2, damageDealt: { weapon: 100, ability: 50, status: 10, boon: 5 } }, rooms: [{ depth: 0, result: 'clear', seconds: 30, damageTaken: 5, overdrives: 0 }, { depth: 8, result: 'dead', seconds: 20, damageTaken: 70, overdrives: 1 }] };
        const sum = summarizeSimulations([r]);
        expect(sum.total.completionPct).toBe(0);
        expect(sum.total.deaths).toEqual({ '9': 1 });
        expect(sum.total.byDepth[8]).toMatchObject({ entered: 1, cleared: 0, medianSeconds: null, medianDamageTaken: 70 });
        expect(sum.total.medianRoomSeconds).toBe(30);
        expect(sum.total.medianRoomsPerOverdrive).toBe(.5);
    });
});
