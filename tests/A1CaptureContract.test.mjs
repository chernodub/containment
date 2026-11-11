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
