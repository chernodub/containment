import { describe, expect, it } from 'vitest';
import { endingTransmission } from './endingTransmission';

describe('original aftermath key art', () => {
  it('keeps decoration local, deterministic, and free of raster or executable content', () => {
    const markup = endingTransmission();
    expect(markup).toBe(endingTransmission());
    expect(markup).toContain('aria-hidden="true" focusable="false"');
    expect(markup).toMatch(/<figure[^>]+aria-label="[^"]+"/);
    expect(markup).not.toMatch(/<(?:image|script|foreignObject|iframe|canvas)\b/i);
    expect(markup).not.toMatch(/\son[a-z]+\s*=/i);
    expect(markup).not.toMatch(/(?:https?:|data:|javascript:|blob:)/i);
  });

  it('resolves every gradient, clipping, and reusable-shape reference to one local definition', () => {
    const markup = endingTransmission();
    const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    const definitions = new Set(ids);
    expect(ids.length).toBeGreaterThan(0);
    expect(definitions.size).toBe(ids.length);
    const references = [
      ...[...markup.matchAll(/url\(([^)]+)\)/g)].map(match => match[1]),
      ...[...markup.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(match => match[1]),
    ];
    expect(references.length).toBeGreaterThan(0);
    for (const reference of references) {
      expect(reference).toMatch(/^#[\w-]+$/);
      expect(definitions.has(reference.slice(1)), reference).toBe(true);
    }
  });

  it('retains the colony vessel, layered rupture, surviving signal, and foreground human loss', () => {
    const markup = endingTransmission();
    const sections = new Set([...markup.matchAll(/data-vessel-section="([^"]+)"/g)].map(match => match[1]));
    for (const section of ['radiators', 'engine-bells', 'reactor-aft', 'spine', 'cryo-decks', 'habitat-ring-back', 'habitat-ring-front', 'warning-transmitter', 'torn-reactor-rails']) {
      expect(sections.has(section), section).toBe(true);
    }
    for (const layer of ['shock-fronts', 'directed-ejecta', 'foreground-loss']) {
      expect(markup).toContain(`data-art-layer="${layer}"`);
    }
    expect(markup).toContain('class="ending-signal-track"');
    expect(markup).toContain('class="ending-destination"');
    expect(markup).toContain('href="#ending-pod"');
    expect(markup).not.toMatch(/<h[1-6]\b/);
  });
});
