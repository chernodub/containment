import {readFile} from 'node:fs/promises';
import {resolve, basename} from 'node:path';
import {createRequire} from 'node:module';

const {SourceMapConsumer} = createRequire(import.meta.url)('source-map-js');
const rules = [
  ['GC', /garbage collector/i],
  ['simulation step', /src\/DepthGame|src\/game\//],
  ['animation mixers/skinning', /AnimationMixer|AnimationAction|Skeleton|PropertyMixer|PropertyBinding/],
  ['camera framing/threat bias', /render\/camera\//],
  ['actor pose/motion', /Actor|Motion|models\.ts/],
  ['VFX/telegraph batching', /render\/(vfx|abilities)\/|Telegraph|Effects/],
  ['lighting/shadow update', /lighting\/|Shadow/],
  ['world dressing update', /render\/world\//],
  ['physics/ragdoll presentation', /DeathRagdolls|DeferredRagdolls|rapier/i],
  ['UI/HUD DOM', /src\/ui\//],
  ['fixture driver', /\b(?:refill|tryPower)\b/],
  ['renderer submission/probes', /DepthRenderer|render\/post\/|WebGL|three.*module/],
  ['idle', /\(idle\)/],
];

/** Attribute exclusive samples through build source maps; retain unknown and idle time. */
export async function attributeCpuSelf(profile, dist) {
  const maps = new Map();
  const nodes = new Map();
  const parents = new Map();
  const classLines = new Map();
  for (const node of profile.nodes) {
    for (const child of node.children ?? []) parents.set(child, node.id);
  }
  for (const node of profile.nodes) {
    const frame = node.callFrame;
    let source = '';
    if (frame.url) {
      const file = basename(new URL(frame.url).pathname);
      if (!maps.has(file)) {
        try {
          const data = await readFile(resolve(dist, 'assets', file + '.map'), 'utf8');
          maps.set(file, new SourceMapConsumer(JSON.parse(data)));
        } catch {
          maps.set(file, null);
        }
      }
      const map = maps.get(file);
      const position = map?.originalPositionFor({
        line: frame.lineNumber + 1,
        column: frame.columnNumber,
      });
      source = position?.source ?? '';
      // Three's bundled class methods often have generic names such as update.
      // Recover the containing class from the original, unminified core source.
      if (map && source && /three.*core/.test(source)) {
        const key = file + '|' + source;
        if (!classLines.has(key)) {
          const classes = [];
          map.sourceContentFor(source, true)?.split('\n').forEach((line, index) => {
            const match = /^class\s+(\w+)/.exec(line);
            if (match) classes.push({line: index + 1, name: match[1]});
          });
          classLines.set(key, classes);
        }
        let owner = '';
        for (const entry of classLines.get(key)) {
          if (entry.line > position.line) break;
          owner = entry.name;
        }
        source += ' ' + owner;
      }
    }
    const text = source + ' ' + frame.functionName;
    nodes.set(node.id, rules.find(([, pattern]) => pattern.test(text))?.[0] ?? 'unattributed');
  }
  // Native DOM/driver leaves inherit the nearest recognized subsystem caller.
  // Every sample still contributes once; this never adds inclusive stack times.
  for (const [id, category] of nodes) {
    if (category !== 'unattributed') continue;
    let parent = parents.get(id);
    while (parent !== undefined) {
      const owner = nodes.get(parent);
      if (owner && owner !== 'unattributed') {
        nodes.set(id, owner);
        break;
      }
      parent = parents.get(parent);
    }
  }
  const totals = {};
  const sampleCounts = {};
  for (let index = 0; index < (profile.samples?.length ?? 0); index++) {
    const key = nodes.get(profile.samples[index]) ?? 'unattributed';
    sampleCounts[key] = (sampleCounts[key] ?? 0) + 1;
    totals[key] = (totals[key] ?? 0) + (profile.timeDeltas?.[index] ?? 0) / 1000;
  }
  return {
    scope: 'exclusive leaf samples; source mapped where available; includes idle separately; sampled wall duration is subject to scheduling',
    milliseconds: totals,
    sampleCounts,
    sourceMaps: [...maps].filter(([, map]) => map).map(([file]) => file),
  };
}

/** Apportion measured thread CPU ticks by exclusive active samples, as estimates. */
export function summarizeCpuClock(run) {
  const metric = (phase, name) => run.cdp?.[phase]?.find(entry => entry.name === name)?.value;
  const delta = (metric('final', 'ThreadTime') - metric('initial', 'ThreadTime')) * 1000;
  const threadCpuMs = Number.isFinite(delta) && delta >= 0 ? delta : null;
  const profile = run.cpuSelf ?? run.profiling?.cpuSelf;
  const counts = profile?.sampleCounts ?? {};
  const wall = profile?.milliseconds ?? {};
  const activeSamples = Object.entries(counts).filter(([name]) => name !== 'idle')
    .reduce((sum, [, count]) => sum + count, 0);
  const activeWall = Object.entries(wall).filter(([name]) => name !== 'idle')
    .reduce((sum, [, value]) => sum + value, 0);
  const finalDraws = run.gpuPassTimings?.passes?.find(pass => pass.name === 'finalAA')
    ?.counts?.reduce((sum, row) => sum + row.draws, 0);
  const renders = run.actualRenderFrames ?? run.gpuPassTimings?.actualRenderFrames ?? finalDraws ?? run.count;
  const subsystems = Object.entries(wall).map(([name, milliseconds]) => {
    const fraction = name === 'idle' ? null : activeSamples ? (counts[name] ?? 0) / activeSamples
      : activeWall ? milliseconds / activeWall : null;
    const estimate = fraction !== null && threadCpuMs !== null ? threadCpuMs * fraction : null;
    return {
      name, milliseconds, samples: counts[name] ?? null, activeFraction: fraction,
      estimatedCpuMs: estimate,
      estimatedCpuMsPerRender: estimate !== null && renders > 0 ? estimate / renders : null,
    };
  }).sort((a, b) => (b.estimatedCpuMs ?? 0) - (a.estimatedCpuMs ?? 0));
  return {
    scope: 'Measured CDP ThreadTime; subsystem split estimated from exclusive active samples. Includes fixture/profiling overhead; not individually clocked subsystem durations.',
    threadCpuMs, renders,
    threadCpuMeanPerRenderMs: threadCpuMs !== null && renders > 0 ? threadCpuMs / renders : null,
    weighting: activeSamples ? 'sample counts' : 'sample wall weights fallback', subsystems,
  };
}
