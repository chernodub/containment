#!/usr/bin/env node
import {readFile, writeFile, mkdir, readdir} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {median} from './aggregate.mjs';

const cleared = room => ['clear', 'complete'].includes(room.result);
const total = values => values.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
const distribution = values => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  const at = q => sorted[Math.max(0, Math.ceil(sorted.length * q) - 1)] ?? null;
  return {n: sorted.length, median: median(sorted), p10: at(.1), p90: at(.9), min: sorted[0] ?? null, max: sorted.at(-1) ?? null};
};

/** Compare complete campaign attempts; keep deaths, censoring and assistance visible. */
export function balanceSummary(reports) {
  const groups = [...new Set(reports.map(r => `${r.assisted ? 'assisted' : 'organic'}:${r.legacy ? 'v2' : 'v3'}:${r.rig}`))].sort().map(key => {
    const runs = reports.filter(r => `${r.assisted ? 'assisted' : 'organic'}:${r.legacy ? 'v2' : 'v3'}:${r.rig}` === key);
    const rooms = runs.flatMap(r => r.rooms ?? []);
    const stats = runs.map(r => r.final?.stats ?? r.stats);
    const deaths = {}, outcomes = {};
    for (const r of runs) {
      outcomes[r.outcome] = (outcomes[r.outcome] ?? 0) + 1;
      if (r.outcome === 'dead') {
        const depth = r.rooms.at(-1)?.depth + 1;
        deaths[depth] = (deaths[depth] ?? 0) + 1;
      }
    }
    const damage = Object.fromEntries(['weapon', 'ability', 'status', 'boon'].map(k => [k, total(stats.map(s => s?.damageDealt[k]))]));
    const allDamage = total(Object.values(damage));
    const cadence = runs.map(r => {
      const uses = (r.final?.stats ?? r.stats)?.overdrivesUsed;
      return uses ? r.rooms.filter(cleared).length / uses : null;
    });
    const byDepth = Array.from({length: runs[0].legacy ? 12 : 20}, (_, depth) => {
      const attempts = rooms.filter(r => r.depth === depth);
      return {room: depth + 1, attempts: attempts.length, clears: attempts.filter(cleared).length,
        seconds: distribution(attempts.filter(cleared).map(r => r.seconds)),
        damageTaken: distribution(attempts.map(r => r.damageTaken)),
        overdrives: distribution(attempts.map(r => r.overdrives)),
      };
    });
    const ordinary = rooms.filter(r => cleared(r) && ![9, 19].includes(r.depth));
    return {key, runs: runs.length, seeds: runs.map(r => r.seed), heads: [...new Set(runs.map(r => r.head))],
      completion: runs.filter(r => r.outcome === 'complete').length / runs.length,
      outcomes, deaths, roomsPerOverdrive: distribution(cadence),
      pooledRoomsPerOverdrive: rooms.filter(cleared).length / total(stats.map(s => s?.overdrivesUsed)),
      ordinarySeconds: distribution(ordinary.map(r => r.seconds)),
      transmissionSeconds: distribution(rooms.filter(r => cleared(r) && r.depth === 9).map(r => r.seconds)),
      damageShare: Object.fromEntries(Object.entries(damage).map(([k, v]) => [k, allDamage ? v / allDamage : 0])),
      // The full-kit harness isolates rig-attributable status/procs; campaign columns do not establish control causality.
      abilityPlusStatusAndBoonShare: allDamage ? (damage.ability + damage.status + damage.boon) / allDamage : 0,
      ordinaryRoomsWithMultipleOverdrives: ordinary.filter(r => r.overdrives > 1).length,
      byAct: Array.from({length: runs[0].legacy ? 3 : 4}, (_, act) => {
        const attempts = rooms.filter(r => Math.floor(r.depth / (runs[0].legacy ? 4 : 5)) === act);
        return {act: act + 1, attempts: attempts.length, seconds: distribution(attempts.filter(cleared).map(r => r.seconds)), damageTaken: distribution(attempts.map(r => r.damageTaken))};
      }), byDepth};
  });
  return {selectedRuns: reports.length, groups,
    caveats: ['Simulation and native-browser cohorts stay explicitly labeled; only matching policy/source snapshots are comparable.',
      'Times pool cleared-room observations; damage includes death-room attempts. Completion uses all selected attempts, with censored outcomes visible.',
      'Rooms/Overdrive is a per-run distribution of cleared rooms divided by accepted uses; pooled cadence is also supplied.',
      'Campaign direct ability/status/boon sources do not isolate all control and Overclock value. The deterministic full-kit harness retains the 30–45% invariant.']};
}

async function main() {
  const paths = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const out = process.argv.find(a => a.startsWith('--out='))?.slice(6) ?? 'artifacts/nextgen/i5/balance-summary.json';
  if (!paths.length) throw Error('Supply explicit report files or batch directories.');
  const reports = [];
  for (const path of paths) {
    if (path.endsWith('.json')) reports.push(JSON.parse(await readFile(path, 'utf8')));
    else for (const f of (await readdir(path)).filter(f => f.endsWith('.json') && !['summary.json', 'campaign-summary.json'].includes(f))) {
      const r = JSON.parse(await readFile(join(path, f), 'utf8'));
      if (r.rig && Array.isArray(r.rooms)) reports.push(r);
    }
  }
  const summary = balanceSummary(reports);
  await mkdir(resolve(out, '..'), {recursive: true});
  await writeFile(out, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary.groups.map(({byDepth, ...group}) => group), null, 2));
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) main().catch(error => {console.error(error); process.exitCode = 1;});
