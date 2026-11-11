import {describe, expect, it} from 'vitest';
import {runSimulation} from '../scripts/nextgen/playtest/sim-core.ts';
import {actorMetrics} from '../scripts/nextgen/playtest/sim-metrics.mjs';

// A real, fixed-seed earned campaign catches meter/health/encounter changes that arithmetic-only pins cannot.
// Full acceptance uses the separately archived ten-seed/rig distributions; these are representative regressions.
describe('I5 earned Overdrive cadence', () => {
  it.each(['breacher','cryo','pyro','arc'])('%s preserves welcoming starts and room-scale earned power spikes', async rig => {
    const report=runSimulation({rig,seed:1729,metrics:await actorMetrics()});
    expect(['complete','dead']).toContain(report.outcome);
    expect(report.rooms.slice(0,5)).toHaveLength(5);
    expect(report.rooms.slice(0,5).every(room=>room.result==='clear')).toBe(true);
    if(report.outcome==='dead')expect(report.deathRoom).toBeGreaterThanOrEqual(9);
    const clears=report.rooms.filter(room=>room.result==='clear'||room.result==='complete').length;
    expect(report.stats.overdrivesUsed).toBeGreaterThan(0);
    const cadence=clears/report.stats.overdrivesUsed;
    // One deterministic campaign is quantized by deaths/carry; the cohort's median gate is 1.2–1.7.
    expect(cadence).toBeGreaterThanOrEqual(1.2);
    expect(cadence).toBeLessThanOrEqual(1.8);
    const ordinary=report.rooms.filter(room=>room.nodeKind==='combat'&&!room.guardian&&!room.holdout);
    expect(ordinary.length).toBeGreaterThan(5);
    for(const room of ordinary)expect(room.overdrives,`${rig} room ${room.depth+1}`).toBeLessThanOrEqual(1);
    for(const room of report.rooms)expect(Number.isFinite(room.damageTaken)).toBe(true);
  },60_000);
});
