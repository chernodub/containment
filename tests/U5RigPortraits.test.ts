import {describe, expect, test} from 'vitest';
import {readFileSync} from 'node:fs';
import {RIG_IDS} from '../src/game/abilities/catalog';
import {rigPortrait, RIG_FANTASIES} from '../src/ui/screens/rigPortraits';
import {rigScreen} from '../src/ui/screens/templates';

const css = readFileSync(new URL('../src/ui/styles/rig-portraits.css', import.meta.url), 'utf8');

describe('authored rig identities', () => {
  test.each(RIG_IDS)('%s keeps one focal marine, a three-word fantasy and all four mechanical previews', rig => {
    const markup = rigScreen(rig);
    expect(RIG_FANTASIES[rig].split(/\s+/)).toHaveLength(3);
    expect(markup).toContain(`<h3>${RIG_FANTASIES[rig]}</h3>`);
    expect(markup.match(/class="rig-portrait"/g)).toHaveLength(1);
    expect(markup).toContain(`data-portrait="${rig}"`);
    expect(markup.match(/class="ability-detail"/g)).toHaveLength(4);
    expect(markup.match(/class="ability-shape ability-vignette"/g)).toHaveLength(4);
    expect(markup).toContain('id="equip-rig"');
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain('rig-footnote');
  });

  test('signature equipment is authored per rig rather than a recolored shared icon', () => {
    expect(rigPortrait('breacher')).toContain('rig-shield-field');
    expect(rigPortrait('breacher')).toContain('rig-heavy-plate');
    expect(rigPortrait('cryo')).toContain('rig-coolant-tanks');
    expect(rigPortrait('cryo')).toContain('rig-coolant-vapor');
    expect(rigPortrait('pyro')).toContain('rig-fuel-tanks');
    expect(rigPortrait('pyro')).toContain('rig-nozzle');
    expect(rigPortrait('arc')).toContain('rig-coils');
    expect(rigPortrait('arc')).toContain('rig-capacitors');
    for (const rig of RIG_IDS) {
      expect(rigPortrait(rig)).toContain('role="img" aria-label=');
      expect(rigPortrait(rig)).toContain('rig-helmet');
      expect(rigPortrait(rig)).not.toMatch(/<image|https?:\/\//);
    }
  });

  test('equipment has static reduced-motion poses and compact desktop layout rules', () => {
    expect(css).toContain('@media(prefers-reduced-motion:reduce)');
    expect(css).toContain('animation:none!important');
    expect(css).toContain('@media(max-height:820px)');
    expect(css).toContain('@media(max-height:650px)');
    expect(css).not.toContain('overflow:auto');
    expect(css).not.toContain('overflow-y:scroll');
  });
});
