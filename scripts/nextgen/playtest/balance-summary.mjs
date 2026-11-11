#!/usr/bin/env node
import {readFile, writeFile, mkdir, readdir} from 'node:fs/promises';
import {resolve, join, dirname, basename} from 'node:path';
import {pathToFileURL} from 'node:url';
import {median} from './aggregate.mjs';

const cleared = room => ['clear', 'complete'].includes(room.result);
const total = values => values.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
const known = value => typeof value === 'string' && value.length > 0;
const unique = values => [...new Set(values.filter(known))].sort();
const cohortName = report => report.summaryCohort ?? report.cohort ?? 'selected';
const backend = report => {
  if (/^(sim|simulation|node)(?:-|$)/.test(report.backend ?? report.mode ?? '')) return 'simulation';
  if (/^(native|browser|playwright)(?:-|$)/.test(report.backend ?? report.mode ?? '')
    || report.harnessHashes || report.distributionDirectory || /^native\b/.test(report.clock ?? '')) return 'native-browser';
  return known(report.backend) ? report.backend : undefined;
};
const policyFiles = ['policy.mjs', 'ability-aim.ts', 'bot-navigation.ts', 'bot-navigation-version.mjs'];
const sourceIdentity = reports => ({
  backends: unique(reports.map(backend)), modes: unique(reports.map(r => r.mode)),
  policyVersions: unique(reports.map(r => r.policyVersion)), policyHashes: unique(reports.map(r => r.policyHash)),
  gameHashes: unique(reports.map(r => r.gameHash)), bundleHashes: unique(reports.map(r => r.bundleHash)),
  heads: unique(reports.map(r => r.head)), gameRefs: unique(reports.map(r => r.gameRef)),
  distributionDirectories: unique(reports.map(r => r.distributionDirectory)), clocks: unique(reports.map(r => r.clock)),
  policySourceHashes: Object.fromEntries(policyFiles.map(file => [file, unique(reports.map(r => r.harnessHashes?.[file]))])),
  unknownBackendReports: reports.filter(r => !backend(r)).length,
  unknownPolicyHashReports: reports.filter(r => !known(r.policyHash)).length,
  unknownGameHashReports: reports.filter(r => !known(r.gameHash)).length,
});
const holdout = (room, legacy) => !legacy && (typeof room.holdout === 'boolean' ? room.holdout : [9, 19].includes(room.depth));
const category = (room, legacy) => {
  if (holdout(room, legacy)) return 'holdout';
  const kind = room.nodeKind ?? room.kind;
  if (known(kind) && kind !== 'combat') return kind;
  if (room.guardian != null && room.guardian !== false) return 'guardian';
  if (kind === 'combat' && Object.hasOwn(room, 'guardian')) return 'ordinary';
  // Historical reports did not distinguish ordinary combat from optional guardians.
  return 'unknown';
};
const distribution = values => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  const at = q => sorted[Math.max(0, Math.ceil(sorted.length * q) - 1)] ?? null;
  return {n: sorted.length, median: median(sorted), p10: at(.1), p90: at(.9), min: sorted[0] ?? null, max: sorted.at(-1) ?? null};
};

/** Compare complete campaign attempts; keep deaths, censoring and assistance visible. */
export function balanceSummary(reports) {
  if (reports.some(r => !known(cohortName(r)))) throw Error('Cohort labels must be nonempty strings.');
  const cohorts = unique(reports.map(cohortName)).map(label => {
    const selected = reports.filter(r => cohortName(r) === label), sources = sourceIdentity(selected);
    for (const field of ['backends', 'modes', 'policyVersions', 'policyHashes', 'gameHashes', 'bundleHashes', 'distributionDirectories']) {
      if (sources[field].length > 1) throw Error(`Cohort "${label}" mixes known ${field}: ${sources[field].join(', ')}. Use separate cohort labels for comparisons.`);
    }
    for (const [file, hashes] of Object.entries(sources.policySourceHashes)) {
      if (hashes.length > 1) throw Error(`Cohort "${label}" mixes known policy source ${file}. Use separate cohort labels for comparisons.`);
    }
    return {label, runs: selected.length, sources};
  });
  const groupKey = r => `${r.assisted ? 'assisted' : 'organic'}:${r.legacy ? 'v2' : 'v3'}:${r.rig}${r.profileTransition ? ':mixed-profile' : typeof r.tuningEnabled === 'boolean' ? r.tuningEnabled ? ':tuning' : ':production' : ''}${cohorts.length > 1 ? `@${cohortName(r)}` : ''}`;
  const groups = [...new Set(reports.map(groupKey))].sort().map(key => {
    const runs = reports.filter(r => groupKey(r) === key);
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
    const legacy = !!runs[0].legacy;
    const entries = runs.flatMap(run => (run.rooms ?? []).map(room => ({room, seed: run.seed, category: category(room, legacy)})));
    const nonHoldout = rooms.filter(r => cleared(r) && !holdout(r, legacy));
    const strictOrdinary = entries.filter(e => e.category === 'ordinary');
    const unknownOrdinary = entries.filter(e => e.category === 'unknown');
    const hasRoomMetadata = rooms.some(r => known(r.nodeKind ?? r.kind) || Object.hasOwn(r, 'guardian'));
    const ordinary = hasRoomMetadata ? strictOrdinary.map(e => e.room).filter(cleared) : nonHoldout;
    const violations = strictOrdinary.filter(e => e.room.overdrives > 1).map(({room, seed}) => ({seed, room: room.depth + 1, nodeId: room.nodeId, uses: room.overdrives, result: room.result}));
    return {key, cohort: cohortName(runs[0]), rig: runs[0].rig, sources: sourceIdentity(runs), runs: runs.length, seeds: runs.map(r => r.seed), heads: [...new Set(runs.map(r => r.head))],
      completion: runs.filter(r => r.outcome === 'complete').length / runs.length,
      outcomes, deaths, roomsPerOverdrive: distribution(cadence),
      pooledRoomsPerOverdrive: rooms.filter(cleared).length / total(stats.map(s => s?.overdrivesUsed)),
      ordinarySeconds: distribution(ordinary.map(r => r.seconds)),
      ordinarySecondsDefinition: hasRoomMetadata ? 'Metadata-classified ordinary combat clears; excludes guardians, elite rooms, bosses and holdouts.' : 'Historical non-holdout pacing alias; strict ordinary classification unavailable.',
      nonHoldoutSeconds: distribution(nonHoldout.map(r => r.seconds)),
      transmissionSeconds: distribution(rooms.filter(r => !legacy && cleared(r) && r.depth === 9 && holdout(r, legacy)).map(r => r.seconds)),
      damageShare: Object.fromEntries(Object.entries(damage).map(([k, v]) => [k, allDamage ? v / allDamage : 0])),
      // The full-kit harness isolates rig-attributable status/procs; campaign columns do not establish control causality.
      abilityPlusStatusAndBoonShare: allDamage ? (damage.ability + damage.status + damage.boon) / allDamage : 0,
      ordinaryRoomsWithMultipleOverdrives: hasRoomMetadata ? violations.length : ordinary.filter(r => r.overdrives > 1).length,
      nonHoldoutRoomsWithMultipleOverdrives: rooms.filter(r => !holdout(r, legacy) && r.overdrives > 1).length,
      ordinaryCap: {ordinaryAttempts: strictOrdinary.length, unknownAttempts: unknownOrdinary.length, violations,
        unclassifiedViolations: unknownOrdinary.filter(e => e.room.overdrives > 1).map(({room, seed}) => ({seed, room: room.depth + 1, uses: room.overdrives, result: room.result})),
        passed: unknownOrdinary.length || !strictOrdinary.length ? null : violations.length === 0,
        definition: 'All metadata-classified ordinary attempts, including death/censored rooms; unknown historical rooms or zero ordinary samples cannot establish a pass.'},
      byAct: Array.from({length: runs[0].legacy ? 3 : 4}, (_, act) => {
        const attempts = rooms.filter(r => Math.floor(r.depth / (runs[0].legacy ? 4 : 5)) === act);
        return {act: act + 1, attempts: attempts.length, seconds: distribution(attempts.filter(cleared).map(r => r.seconds)), damageTaken: distribution(attempts.map(r => r.damageTaken))};
      }), byDepth};
  });
  return {selectedRuns: reports.length, cohorts, groups,
    caveats: ['Simulation and native-browser cohorts stay explicitly labeled; only matching policy/source snapshots are comparable.',
      'Production, explicit tuning and mixed-profile continuations are separate groups; historical reports retain their original keys.',
      'Each named cohort rejects mixed known backend, policy or game/bundle snapshots. Unknown historical identities remain explicitly unknown.',
      'nonHoldoutSeconds retains broad pacing, including authored elites and bosses; legacy campaigns have no holdouts. Historical ordinarySeconds is a labeled broad alias, not strict cap evidence.',
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
    const label = basename(resolve(path.endsWith('.json') ? dirname(path) : path));
    if (path.endsWith('.json')) reports.push({...JSON.parse(await readFile(path, 'utf8')), summaryCohort: label});
    else for (const f of (await readdir(path)).filter(f => f.endsWith('.json') && !['summary.json', 'campaign-summary.json'].includes(f))) {
      const r = JSON.parse(await readFile(join(path, f), 'utf8'));
      if (r.rig && Array.isArray(r.rooms)) reports.push({...r, summaryCohort: label});
    }
  }
  const summary = balanceSummary(reports);
  await mkdir(resolve(out, '..'), {recursive: true});
  await writeFile(out, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary.groups.map(({byDepth, ...group}) => group), null, 2));
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) main().catch(error => {console.error(error); process.exitCode = 1;});
