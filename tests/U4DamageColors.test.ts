import {describe, expect, it} from 'vitest';
import {DAMAGE_ELEMENT_TOKENS, DAMAGE_TOKENS, damageToken} from '../src/ui/damageTokens';
import {getCombatDamageElement} from '../src/ui/gameAdapter';
import type {DepthGame} from '../src/DepthGame';
import type {HudEffect} from '../src/ui/hud/effects';

const game = (status: Partial<{burning: boolean; poisoned: boolean; chillStacks: number}> = {}, mutations: string[] = [], rig = 'pyro') => ({
  boonStatuses: () => ({burning: false, poisoned: false, chillStacks: 0, ...status}),
  expedition: {build: {mutations}}, abilities: {snapshot: {rig}},
}) as unknown as DepthGame;
const hit = (patch: Partial<HudEffect> = {}): HudEffect => ({type: 'hit', x: 0, y: 0, targetId: 1, damage: 5, ...patch});

describe('U4 combat semantic colors', () => {
  it('maps every native accounting source, status and boon visual explicitly', () => {
    const expected = {
      weapon: 'neutral', ability: 'neutral', status: 'neutral', boon: 'neutral',
      ice: 'cryo', frost: 'cryo', chill: 'cryo', freeze: 'cryo', shatter: 'cryo', field: 'cryo',
      fire: 'pyro', burn: 'pyro', combustion: 'pyro',
      poison: 'acid', acid: 'acid', arc: 'arc', shock: 'arc', overload: 'arc',
      impact: 'kinetic', blast: 'kinetic', charge: 'kinetic', 'wall-slam': 'kinetic',
      leech: 'healing', shield: 'healing',
    };
    for (const [source, token] of Object.entries(expected)) expect(damageToken(source), source).toBe(token);
    expect(Object.values(DAMAGE_ELEMENT_TOKENS).every(token => token in DAMAGE_TOKENS)).toBe(true);
    expect(damageToken('future-unknown')).toBe('neutral');
  });

  it('keeps reward gold, kinetic amber, fire orange and healing distinct', () => {
    expect(new Set(['reward', 'kinetic', 'pyro', 'healing'].map(key => DAMAGE_TOKENS[key as keyof typeof DAMAGE_TOKENS].color)).size).toBe(4);
    expect(DAMAGE_TOKENS.pyro).toEqual({variable: '--pyro', color: '#ff7a2e'});
    expect(DAMAGE_TOKENS.kinetic).toEqual({variable: '--kinetic', color: '#ffb454'});
    expect(DAMAGE_TOKENS.reward).toEqual({variable: '--gold', color: '#ffd27a'});
    for (const [element, token] of Object.entries(DAMAGE_ELEMENT_TOKENS)) {
      if (token === 'acid') expect(['poison', 'poisoned', 'acid']).toContain(element);
    }
  });

  it('uses authoritative element receipts and leaves direct weapon hits white', () => {
    expect(getCombatDamageElement(game(), hit({source: 'weapon', elements: ['fire']}))).toBe('weapon');
    expect(getCombatDamageElement(game(), hit({source: 'status', damageElement: 'burn'}))).toBe('burn');
    expect(getCombatDamageElement(game(), hit({source: 'boon', element: 'shatter'}))).toBe('shatter');
    expect(getCombatDamageElement(game(), hit({source: 'ability'}))).toBe('pyro');
    expect(getCombatDamageElement(game({}, [], 'breacher'), hit({source: 'ability'}))).toBe('kinetic');
  });

  it('resolves legacy receipts only when the build has one possible status producer, including lethal ticks', () => {
    expect(getCombatDamageElement(game({burning: true}), hit({source: 'status'}))).toBe('burn');
    expect(getCombatDamageElement(game({poisoned: true}, ['caustic-rounds'], 'breacher'), hit({source: 'status'}))).toBe('poison');
    expect(getCombatDamageElement(game({chillStacks: 3}, ['frostbite'], 'cryo'), hit({source: 'status'}))).toBe('frost');
    expect(getCombatDamageElement(game({burning: true, poisoned: true}, ['caustic-rounds']), hit({source: 'status'}))).toBeUndefined();
    expect(getCombatDamageElement(game({burning: true, chillStacks: 3}, ['frostbite']), hit({source: 'status'}))).toBeUndefined();
    expect(getCombatDamageElement(game({}, [], 'breacher'), hit({source: 'status'}))).toBeUndefined();
    expect(getCombatDamageElement(game({}, [], 'pyro'), hit({source: 'status', lethal: true}))).toBe('burn');
    // An expired poison producer must not be mistaken for the still-active burn.
    expect(getCombatDamageElement(game({burning: true}, ['caustic-rounds']), hit({source: 'status'}))).toBeUndefined();
    expect(getCombatDamageElement(game({chillStacks: 3}, [], 'cryo'), hit({source: 'status'}))).toBeUndefined();
  });
});
