import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import type {DepthGame} from '../src/DepthGame';
import {SACRIFICE_ENDING} from '../src/game/roguelike/storyRooms';
import {GRAPHICS_PRESETS} from '../src/render/graphicsOptions';
import {completionEnding} from '../src/ui/screens/damageReport';
import {endingTransmission} from '../src/ui/screens/endingTransmission';
import {graphicsOptionCopy, renderSettings} from '../src/ui/settingsView';
import type {UiPreferences} from '../src/ui/settings';

describe('authored final transmission', () => {
  it('retains the exact ending with distinct human-loss and warning-success landmarks', () => {
    const html = completionEnding({storyRoom: {}} as DepthGame);
    expect(html).toContain(`<h2 class="ending-exact">${SACRIFICE_ENDING}</h2>`);
    expect(html).toContain('FINAL TRANSMISSION');
    expect(html).toContain('Passengers and marine lost.');
    expect(html).toContain('NEW EARTH / SIGNAL RECEIVED');
    expect(html).toContain('class="ending-ship-aft"');
    expect(html).toContain('class="ending-ship-bow"');
    expect(html).toContain('class="ending-signal"');
  });

  it('uses a decorative vector scene and leaves the legacy ending accurate', () => {
    expect(endingTransmission()).toContain('aria-hidden="true" focusable="false"');
    expect(endingTransmission()).not.toMatch(/<image|<img|https?:/);
    const legacy = completionEnding({storyRoom: null} as unknown as DepthGame);
    expect(legacy).toContain('Containment restored.');
    expect(legacy).not.toContain('ending-transmission');
  });

  it('stops all scene animation for reduced motion and makes the signal persist', () => {
    const css = readFileSync(new URL('../src/ui/styles/results.css', import.meta.url), 'utf8');
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:reduce\)\s*\{\s*#overlay \.ending-transmission \* \{ animation: none !important;/);
    expect(css).toContain('.ending-signal { stroke-dasharray: 4 12; opacity: .7; }');
    expect(css).toContain('.debrief-panel:has(.result-details[open]) .ending-transmission { display: none; }');
  });
});

describe('additive graphics settings', () => {
  it('uses metadata for unfamiliar fields and readable fallback for missing or partial copy', () => {
    expect(graphicsOptionCopy('edgeConfidence', {label: 'Edge confidence', hint: 'Keep fine contours stable.'})).toEqual({label: 'Edge confidence', hint: 'Keep fine contours stable.'});
    expect(graphicsOptionCopy('HDRResponse')).toEqual({label: 'HDR Response', hint: 'Adjust this rendering effect.'});
    expect(graphicsOptionCopy('new_effect', {label: '', hint: 'An optional rendering feature.'})).toEqual({label: 'New effect', hint: 'An optional rendering feature.'});
  });

  it('renders new boolean, numeric and union fields as native labelled controls', () => {
    const state = {version: 1, tier: 'high', graphics: {...GRAPHICS_PRESETS.high, inkOutlines: true, adaptiveResolution: false, edgeConfidence: .65, outlineMode: 'actors-only'}, combatText: true, radar: false, music: .38, effects: .8} as UiPreferences;
    const html = renderSettings({state, sound: {master: .8, muted: false}, reducedMotion: false});
    expect(html).toContain('aria-label="Ink outlines" checked');
    expect(html).toContain('aria-label="Adaptive sharpness"');
    expect(html).toContain('data-setting="graphics.edgeConfidence" type="range" min="0" max="100" step="1" value="65"');
    expect(html).toContain('data-setting="graphics.outlineMode" aria-describedby="setting-graphics-outlineMode-hint"><option value="actors-only" selected>Actors only</option>');
    expect(html).toContain('Contours help separate actors and ship surfaces.');
  });
});
