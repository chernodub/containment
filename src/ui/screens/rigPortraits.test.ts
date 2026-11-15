import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import type {RigId} from '../../game/abilities/contract';
import {rigPortrait, RIG_FANTASIES} from './rigPortraits';

const rigs = Object.keys(RIG_FANTASIES) as RigId[];

describe('equipment-readable marine portraits', () => {
  it('names the physical equipment for assistive technology without creating focus stops', () => {
    const equipment = {
      breacher: ['ram shoulder', 'forearm shield'],
      cryo: ['coolant vessel', 'pressure hose', 'shoulder frost vent'],
      pyro: ['fuel reservoirs', 'exhaust fins', 'fuel nozzle'],
      arc: ['induction coils', 'antenna masts', 'capacitor bank'],
    };
    for (const rig of rigs) {
      const markup = rigPortrait(rig);
      const label = markup.match(/aria-label="([^"]+)"/)?.[1];
      expect(markup).toContain('role="img"');
      expect(markup).toContain('aria-hidden="true" focusable="false"');
      for (const noun of equipment[rig]) expect(label).toContain(noun);
      expect(markup).not.toMatch(/tabindex|<button|<a\s/);
    }
  });

  it('retains the same marine helmet while giving each rig physical modules and its own stance', () => {
    const helmetPaths = new Set<string>();
    const stances = new Set<string>();
    for (const rig of rigs) {
      const markup = rigPortrait(rig);
      helmetPaths.add(markup.match(/class="rig-helmet" d="([^"]+)"/)![1]);
      stances.add(markup.match(/data-pose="[^"]+" transform="([^"]+)"/)![1]);
      expect(markup).toContain('class="rig-portrait-marine"');
    }
    expect(helmetPaths.size).toBe(1);
    expect(stances.size).toBe(4);
    expect(rigPortrait('breacher')).toContain('data-equipment="ram-shoulder"');
    expect(rigPortrait('cryo')).toContain('data-equipment="coolant-vessel"');
    expect(rigPortrait('pyro')).toContain('data-equipment="twin-fuel-reservoirs"');
    expect(rigPortrait('pyro')).toContain('data-equipment="fuel-nozzle"');
    expect(rigPortrait('arc')).toContain('data-equipment="induction-array"');
    // Arc loops remain open structural strokes when elemental lighting is absent.
    const css = readFileSync(new URL('../styles/rig-portraits.css', import.meta.url), 'utf8');
    expect(css).toMatch(/\.rig-coil-frames\s*\{fill:none;stroke:#[\da-f]+;stroke-width:10;/);
    expect(css).toMatch(/\.rig-antenna\s*\{fill:none;stroke:#[\da-f]+;stroke-width:6;/);
  });

  it('uses local vector art with well-formed attributes and stable review framing', () => {
    for (const rig of rigs) {
      const markup = rigPortrait(rig);
      expect(markup).toContain('viewBox="0 0 440 300"');
      expect(markup).not.toMatch(/<image|<foreignObject|<script|<filter|on\w+=|(?:href|src)="https?:/);
      for (const tag of markup.match(/<[a-zA-Z][^>]*>/g) ?? []) {
        const attributes = [...tag.matchAll(/\s([\w:-]+)=/g)].map(match => match[1]);
        expect(new Set(attributes).size).toBe(attributes.length);
      }
    }
  });
});
