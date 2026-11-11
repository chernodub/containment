import { describe, expect, it, vi } from 'vitest';
import * as T from 'three';
import { EnvironmentMaterials } from './EnvironmentMaterials';
import { readFileSync } from 'node:fs';
import { deckFinish } from '../../scripts/nextgen/g2-surfaces.mjs';
import { decode, encode } from '../../scripts/nextgen/g2-png.mjs';

describe('original G2 deck texture pack', () => {
  for (const kind of ['albedo', 'normal', 'arm']) it(`${kind} is the bounded, reproducible shipping finish`, () => {
    const bytes = readFileSync(new URL(`../../public/assets/environment/g2_deck_${kind}.png`, import.meta.url));
    const source = deckFinish(kind), image = decode(bytes);
    expect(bytes.equals(encode(source))).toBe(true);
    expect(image.width).toBe(128); expect(image.height).toBe(128);
    expect(bytes.length).toBeLessThan(12 * 1024);
    expect(image.pixels).toEqual(source.pixels);
    if (kind === 'albedo') {
      let mean = 0;
      for (let i = 0; i < image.pixels.length; i += 3) {
        expect(image.pixels[i]).toBe(image.pixels[i + 1]);
        expect(image.pixels[i]).toBe(image.pixels[i + 2]);
        const value = image.pixels[i] / 255;
        mean += ((value + .055) / 1.055) ** 2.4;
      }
      // Old photographed deck averaged .06754 linear; preserve its calibrated reflectance.
      expect(mean / (128 * 128)).toBeCloseTo(.06754, 2);
    }
  });
  it('loads the complete nine-image pack through managed texture assets and disposes every image', () => {
    const load = vi.spyOn(T.TextureLoader.prototype, 'load').mockImplementation(() => new T.Texture());
    let surfaces;
    try {
      surfaces = new EnvironmentMaterials(4);
      const urls = load.mock.calls.map(([url]) => url);
      expect(urls).toHaveLength(9);
      for (const kind of ['albedo', 'normal', 'arm']) expect(urls.some(url => url.endsWith(`/environment/g2_deck_${kind}.png`))).toBe(true);
      expect(surfaces.floor.map.colorSpace).toBe(T.SRGBColorSpace);
      expect(surfaces.floor.normalMap.colorSpace).toBe(T.NoColorSpace);
      expect(surfaces.floor.map.flipY).toBe(false);
      expect(surfaces.floor.roughnessMap).toBe(surfaces.floor.metalnessMap);
      let disposed = 0;
      for (const texture of surfaces.textures) texture.addEventListener('dispose', () => disposed++);
      surfaces.dispose(); surfaces = undefined;
      expect(disposed).toBe(9);
    } finally { surfaces?.dispose(); load.mockRestore(); }
  });
  it('rejects an unrecognized generated finish', () => {
    expect(() => deckFinish('unknown')).toThrow('Unknown deck finish');
  });
});
