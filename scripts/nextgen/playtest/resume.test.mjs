import {afterEach, describe, expect, it} from 'vitest';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {checkpointFromEarnedBoundary, loadEarnedBoundary} from './resume.mjs';

function fixture() {
  const state = {
    rig: 'cryo', status: 'reward', elapsed: 15.1234,
    run: {version: 3, seed: 42, currentNodeId: 'room-b', completedNodeIds: ['room-a', 'room-b'], phase: 'reward', draftRoll: 0},
    node: {id: 'room-b', templateId: 'passenger-vault'},
    build: {rig: 'cryo', mutations: ['cryogenic']},
    resources: {health: 37, armor: 5, credits: 29, grenades: 1, medkits: 0, weapon: 'rifle', ammo: {rifle: {magazine: 7, reserve: 30}}},
    abilities: {rig: 'cryo', overdrive: {charge: .73}},
    stats: {damageTaken: 45, damageDealt: {weapon: 200, ability: 100}, roomTimeMs: {'room-a': 5000, 'room-b': 10123.4}},
  };
  const parent = {
    seed: 42, rig: 'cryo', screenshots: ['r2-passenger-vault-clear.png'],
    rooms: [{nodeId: 'room-a', id: 'awakening-bay', result: 'clear'}, {nodeId: 'room-b', id: 'passenger-vault', result: 'clear'}],
  };
  return {state, parent};
}

describe('earned boundary reconstruction', () => {
  it('retains the exact recorded save fields without refilling resources or modifying its source', () => {
    const {state, parent} = fixture(), before = structuredClone(state);
    const checkpoint = checkpointFromEarnedBoundary(state, parent);
    expect(checkpoint).toEqual({version: 1, savedAt: 15123, run: state.run, build: state.build, resources: state.resources, abilities: {overdriveCharge: .73}, stats: state.stats});
    expect(Object.keys(checkpoint)).toEqual(['version', 'savedAt', 'run', 'build', 'resources', 'abilities', 'stats']);
    checkpoint.resources.health = 1; checkpoint.build.mutations.push('test');
    expect(state).toEqual(before);
  });
  it('accepts a recorded route boundary with the same earned rooms', () => {
    const {state, parent} = fixture(); state.run.phase = 'route'; state.status = 'route';
    expect(checkpointFromEarnedBoundary(state, parent).run.phase).toBe('route');
  });
  it('rejects combat, initial choices, dead resources and missing statistics', () => {
    for (const phase of ['combat', 'rig-select', 'starting-boon', 'complete']) {
      const {state, parent} = fixture(); state.run.phase = phase;
      expect(() => checkpointFromEarnedBoundary(state, parent)).toThrow('Only earned reward/route');
    }
    const {state, parent} = fixture(); state.resources.health = 0;
    expect(() => checkpointFromEarnedBoundary(state, parent)).toThrow('living');
    state.resources.health = 1; delete state.stats;
    expect(() => checkpointFromEarnedBoundary(state, parent)).toThrow('statistics');
  });
  it('rejects a future current node, missing completion or an unearned clear', () => {
    let {state, parent} = fixture(); state.node.id = 'room-c';
    expect(() => checkpointFromEarnedBoundary(state, parent)).toThrow('match current run');
    ({state, parent} = fixture()); state.run.completedNodeIds.pop();
    expect(() => checkpointFromEarnedBoundary(state, parent)).toThrow('must have been completed');
    ({state, parent} = fixture()); parent.rooms[0].result = 'stalled';
    expect(() => checkpointFromEarnedBoundary(state, parent)).toThrow('No earned room-clear proof for room-a');
    parent.rooms[0].result = 'playing';
    expect(() => checkpointFromEarnedBoundary(state, parent)).toThrow('No earned room-clear proof');
  });
  it('rejects seed/rig mismatches, duplicate rooms and fabricated future statistics', () => {
    let {state, parent} = fixture(); parent.seed = 43;
    expect(() => checkpointFromEarnedBoundary(state, parent)).toThrow('Parent seed');
    ({state, parent} = fixture()); parent.rig = 'arc';
    expect(() => checkpointFromEarnedBoundary(state, parent)).toThrow('Parent rig');
    ({state, parent} = fixture()); state.abilities.rig = 'arc';
    expect(() => checkpointFromEarnedBoundary(state, parent)).toThrow('snapshots must agree');
    ({state, parent} = fixture()); state.run.completedNodeIds.push('room-b');
    expect(() => checkpointFromEarnedBoundary(state, parent)).toThrow('unique');
    ({state, parent} = fixture()); state.stats.roomTimeMs['room-c'] = 0;
    expect(() => checkpointFromEarnedBoundary(state, parent)).toThrow('unearned rooms');
  });
});

describe('earned boundary file provenance', () => {
  const directories = [];
  afterEach(async () => { await Promise.all(directories.splice(0).map(path => rm(path, {recursive: true, force: true}))); });
  async function files() {
    const directory = await mkdtemp(resolve(tmpdir(), 'containment-earned-')); directories.push(directory);
    const {state, parent} = fixture(), source = resolve(directory, 'r2-passenger-vault-clear.json');
    await writeFile(source, JSON.stringify(state)); await writeFile(resolve(directory, 'report.json'), JSON.stringify(parent));
    return {directory, source, state, parent};
  }
  it('loads only a screenshot-registered dump and its sibling parent report', async () => {
    const {source, parent} = await files();
    const result = await loadEarnedBoundary(source);
    expect(result.source).toBe(source); expect(result.parent).toEqual(parent);
    expect(result.checkpoint.resources.health).toBe(37);
  });
  it('rejects a dump absent from parent screenshot evidence', async () => {
    const {directory, source, parent} = await files(); parent.screenshots = [];
    await writeFile(resolve(directory, 'report.json'), JSON.stringify(parent));
    await expect(loadEarnedBoundary(source)).rejects.toThrow('screenshot registered');
  });
});
