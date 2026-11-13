import {describe, expect, it} from 'vitest';
import {titleKeyArt} from './keyArt';

// The artwork is trusted markup, but its only variable input can come from a save label.
describe('authored title key art', () => {
  it('keeps a closed palette and never interpolates untrusted rig labels', () => {
    for (const [rig, color] of Object.entries({Breacher: '#ffb454', Cryo: '#7fd6ff', Pyro: '#ff7a2e', Arc: '#b79cff'})) {
      expect(titleKeyArt(rig)).toContain(`--suit-accent:${color}`);
    }
    const malicious = titleKeyArt('"><script>alert(1)</script>');
    expect(malicious).not.toContain('<script>');
    expect(malicious).toContain('--suit-accent:#9fe8ff');
  });
  it('retains capture-only gesture evidence without exposing it in the shipped composition', () => {
    const art = titleKeyArt();
    expect(art).toContain('data-key-art-scaffold="true" style="display:none"');
    for (const contact of ['CHEEK / STOCK', 'GRIP', 'SUPPORT', 'LOAD → REAR FOOT']) expect(art).toContain(contact);
    expect(art).toContain('7.5 HEADS / OPPOSED AXES');
    expect(art).toContain('translate(1190 350)');
    expect(art).toContain('ka-eyes-main');
    expect(art).not.toMatch(/<filter|<canvas|<script|onload=|onclick=/);
    for (const tag of art.match(/<[a-zA-Z][^>]*>/g) ?? []) {
      const attributes = [...tag.matchAll(/\s([\w:-]+)=/g)].map(match => match[1]);
      expect(new Set(attributes).size).toBe(attributes.length);
    }
  });
  it('ships local vector planes, a safe aspect ratio, and a static loading variant', () => {
    const art = titleKeyArt();
    for (const plane of ['far', 'middle', 'threat', 'marine', 'front']) expect(art).toContain(`ka-${plane}`);
    expect(art).toContain('viewBox="0 0 1600 900"');
    expect(art).toContain('preserveAspectRatio="xMaxYMid meet"');
    expect(art).toContain('aria-hidden="true"');
    expect(art).not.toMatch(/<image|<foreignObject|(?:src|href)="https?:/);
    expect(titleKeyArt(undefined, true)).toContain('key-art-still');
    expect(titleKeyArt(undefined, false, false)).toContain('key-art-revealed');
  });
});
