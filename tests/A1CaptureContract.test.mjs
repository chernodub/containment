import { expect, it } from 'vitest';
import { ABILITY_CATALOG } from '../src/game/abilities/catalog';
import { readFileSync } from 'node:fs';
it('registers one self-contained production capture fixture for every catalog ability', async () => {
  // Runtime JS fixture is shared with the Node capture runner, not a source-string approximation.
  const { ABILITY_SCENARIOS } = await import('../scripts/nextgen/ability-scenarios.mjs');
  expect(ABILITY_SCENARIOS).toHaveLength(16);
  expect(new Set(ABILITY_SCENARIOS.map(s => s.id)).size).toBe(16);
  for (const definition of Object.values(ABILITY_CATALOG)) {
    const scenario = ABILITY_SCENARIOS.find(s => s.id === `ability:${definition.id}`);
    expect(scenario).toMatchObject({ state:'playing', burst:true, ability:{id:definition.id,rig:definition.rig,slot:definition.slot},setupArgument:{id:definition.id,rig:definition.rig,slot:definition.slot} });
    expect(typeof scenario.setup).toBe('function');
  }
  const driver = readFileSync(new URL('../scripts/nextgen/ability-driver.mjs', import.meta.url), 'utf8');
  expect(driver).not.toContain('createServer');
  expect(driver).not.toContain('/src/');
});

it('keeps both stream scenario sets and checks the integrated live HUD', async () => {
  const { SCENARIOS } = await import('../scripts/nextgen/scenarios.mjs');
  expect(new Set(SCENARIOS.map(s => s.id)).size).toBe(SCENARIOS.length);
  for (const id of ['ability:desktop-input', 'ability-ready', 'ability-denied', 'combat-kiting', 'pause-loadout', 'results-fixture', 'complete-fixture', 'results']) {
    expect(SCENARIOS.some(s => s.id === id)).toBe(true);
  }
  const { ABILITY_SCENARIOS } = await import('../scripts/nextgen/ability-scenarios.mjs');
  for (const scenario of ABILITY_SCENARIOS) expect(scenario.required).toContain('#ability-bar');
  expect(SCENARIOS.find(s => s.id === 'results')).toMatchObject({state: 'dead', required: ['.result-stats', '.result-panel', '#start']});
});

it('opens every rig preview through live rig-select rather than a UI phase fixture', async () => {
  const { SCENARIOS } = await import('../scripts/nextgen/scenarios.mjs');
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const starts = [], inspected = [];
  globalThis.window = {__containmentDebug: {startRun: async (...args) => {starts.push(args);}}};
  globalThis.document = {querySelector: selector => ({click: () => inspected.push(selector)})};
  try {
    for (const id of ['rig-select', 'rig-select-cryo', 'rig-select-pyro', 'rig-select-arc']) await SCENARIOS.find(s => s.id === id).setup();
    expect(starts).toEqual(Array.from({length: 4}, () => [undefined, {rigSelect: true}]));
    expect(inspected).toEqual(['[data-rig=cryo]', '[data-rig=pyro]', '[data-rig=arc]']);
  } finally {
    if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
    if (originalDocument === undefined) delete globalThis.document; else globalThis.document = originalDocument;
  }
});
