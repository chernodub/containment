import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {basename, dirname, resolve} from 'node:path';

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const finite = value => typeof value === 'number' && Number.isFinite(value);

/** Reconstruct only an organically earned, recorded reward/route save boundary. */
export function checkpointFromEarnedBoundary(state, parentReport) {
  assert(record(state) && record(parentReport), 'Boundary state and parent report are required');
  const {run, build, resources, abilities, stats, node} = state;
  assert(record(run) && ['reward', 'route'].includes(run.phase), 'Only earned reward/route boundaries can resume');
  assert(['reward', 'route'].includes(state.status), 'Boundary must be outside combat and alive');
  assert(Number.isInteger(run.seed) && run.seed >= 0 && run.seed <= 0xffffffff && parentReport.seed === run.seed, 'Parent seed must match boundary seed');
  assert(record(build) && typeof build.rig === 'string' && parentReport.rig === build.rig, 'Parent rig must match boundary rig');
  assert(state.rig === build.rig && abilities?.rig === build.rig, 'Recorded rig snapshots must agree');
  assert(Array.isArray(build.mutations), 'Recorded build mutations are required');
  assert(record(resources) && finite(resources.health) && resources.health > 0, 'Boundary resources must be living');
  assert(record(stats) && record(stats.roomTimeMs), 'Recorded run statistics are required');
  assert(record(node) && typeof node.id === 'string' && node.id === run.currentNodeId, 'Boundary node must match current run node');
  assert(Array.isArray(run.completedNodeIds) && run.completedNodeIds.length > 0 && run.completedNodeIds.every(id => typeof id === 'string'), 'Completed room evidence is required');
  assert(new Set(run.completedNodeIds).size === run.completedNodeIds.length, 'Completed room IDs must be unique');
  assert(run.completedNodeIds.includes(node.id), 'Current boundary room must have been completed');
  assert(Array.isArray(parentReport.rooms), 'Parent room receipts are required');
  for (const id of run.completedNodeIds) {
    const receipt = parentReport.rooms.find(room => room.nodeId === id && ['clear', 'complete'].includes(room.result));
    assert(receipt, `No earned room-clear proof for ${id}`);
    assert(finite(stats.roomTimeMs[id]) && stats.roomTimeMs[id] >= 0, `Missing recorded room time for ${id}`);
    if (id === node.id) assert(receipt.id === node.templateId, 'Current room template must match parent receipt');
  }
  assert(Object.keys(stats.roomTimeMs).every(id => run.completedNodeIds.includes(id)), 'Statistics cannot contain unearned rooms');
  const charge = abilities?.overdrive?.charge;
  assert(finite(charge) && charge >= 0 && charge <= 1, 'Recorded Overdrive charge is required');
  assert(finite(state.elapsed) && state.elapsed >= 0 && Number.isSafeInteger(Math.round(state.elapsed * 1000)), 'Recorded elapsed time is invalid');
  const difficulty = state.difficulty ?? parentReport.difficulty;
  if (difficulty !== undefined) {
    assert(['story', 'standard', 'veteran'].includes(difficulty), 'Recorded difficulty is invalid');
    assert(parentReport.difficulty === undefined || parentReport.difficulty === difficulty, 'Parent difficulty must match boundary difficulty');
  }
  // No defaults, rewards, refills, room progression or stat edits: retain the captured values exactly.
  return structuredClone({
    version: 1,
    savedAt: Math.round(state.elapsed * 1000),
    run,
    build,
    resources,
    ...(difficulty === undefined ? {} : {difficulty}),
    abilities: {overdriveCharge: charge},
    stats,
  });
}

/** Load a registered room screenshot's state dump and its sibling campaign proof. */
export async function loadEarnedBoundary(path) {
  const source = resolve(path);
  assert(source.endsWith('.json') && basename(source) !== 'report.json', 'Expected a room-state JSON dump');
  const [state, parent] = await Promise.all([
    readFile(source, 'utf8').then(JSON.parse),
    readFile(resolve(dirname(source), 'report.json'), 'utf8').then(JSON.parse),
  ]);
  const screenshot = basename(source).replace(/\.json$/, '.png');
  assert(Array.isArray(parent.screenshots) && parent.screenshots.includes(screenshot), 'Boundary state dump must have a screenshot registered in its parent report');
  return {checkpoint: checkpointFromEarnedBoundary(state, parent), parent, source};
}
