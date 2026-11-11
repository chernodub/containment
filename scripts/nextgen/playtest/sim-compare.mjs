import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
/** Compare one explicitly matched native/simulation campaign without hiding divergence. */
export function compareCampaigns(native, simulation) {
    if (native.rig !== simulation.rig || native.seed !== simulation.seed || !!native.assisted !== !!simulation.assisted || !!native.legacy !== !!simulation.legacy)
        throw Error('Campaigns must match rig,seed,assistance and graph');
    const nativeStats = native.final?.stats ?? native.stats, simStats = simulation.final?.stats ?? simulation.stats;
    const damage = stats => Object.values(stats.damageDealt).reduce((a, b) => a + b, 0);
    const rooms = native.rooms.map(a => { const b = simulation.rooms.find(b => b.nodeId === a.nodeId); return { room: a.depth + 1, nativeResult: a.result, simResult: b?.result ?? null, nativeSeconds: a.seconds, simSeconds: b?.seconds ?? null, secondsDelta: b ? b.seconds - a.seconds : null, timeRelativeError: b && a.seconds ? Math.abs(b.seconds - a.seconds) / a.seconds : null, nativeDamageTaken: a.damageTaken, simDamageTaken: b?.damageTaken ?? null, nativeOverdrives: a.overdrives, simOverdrives: b?.overdrives ?? null }; });
    const errors = rooms.map(r => r.timeRelativeError).filter(Number.isFinite).sort((a, b) => a - b);
    return { rig: native.rig, seed: native.seed, nativeOutcome: native.outcome, simOutcome: simulation.outcome, matchingOutcomes: native.outcome === simulation.outcome,
        nativeKills: nativeStats.kills.total, simKills: simStats.kills.total, nativeOverdrives: nativeStats.overdrivesUsed, simOverdrives: simStats.overdrivesUsed,
        nativeDamageTaken: nativeStats.damageTaken, simDamageTaken: simStats.damageTaken, nativeTotalDamage: damage(nativeStats), simTotalDamage: damage(simStats),
        exactRoomTimes: rooms.filter(r => Math.abs(r.secondsDelta ?? Infinity) < 1e-5).length, matchedRooms: rooms.filter(r => r.simResult !== null).length,
        medianAbsoluteRelativeRoomTimeError: errors.length ? errors[Math.floor(errors.length / 2)] : null,
        wallSpeedup: native.wallSeconds / simulation.wallSeconds, rooms,
        interpretation: 'A matching campaign outcome is a validation sample, not proof of native input equivalence. Keep all room-level time/damage divergences and confirm final tuning in native browsers.' };
}
if (import.meta.url === pathToFileURL(resolve(process.argv[1] ?? '')).href) {
    const [nativePath, simPath, outPath] = process.argv.slice(2);
    if (!nativePath || !simPath)
        throw Error('Usage: node sim-compare.mjs native-report.json simulation-report.json [comparison.json]');
    const result = compareCampaigns(JSON.parse(await readFile(nativePath, 'utf8')), JSON.parse(await readFile(simPath, 'utf8')));
    if (outPath)
        await writeFile(outPath, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
}
