import {describe, expect, it} from 'vitest';
import {encodePng} from '../sprites.mjs';
import {sampleWorldPng} from './visuals.mjs';

function png(width, height, color) {
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const offset = (y * width + x) * 4, rgba = color(x, y);
    pixels[offset] = rgba[0]; pixels[offset + 1] = rgba[1]; pixels[offset + 2] = rgba[2]; pixels[offset + 3] = rgba[3] ?? 255;
  }
  return encodePng({width, height, pixels});
}

describe('world screenshot sampling', () => {
  it('detects a black world even when a bright textured HUD makes the full frame look populated', () => {
    const image = png(260, 260, (x, y) => y >= 195 ? [100 + x % 150, 100 + y % 150, (x + y) % 255] : [0, 0, 0]);
    expect(sampleWorldPng(image).likelyBlank).toBe(false);
    expect(sampleWorldPng(image, [{left: 0, top: 195, right: 260, bottom: 260}])).toEqual({samples: 300, colors: 1, litFraction: 0, likelyBlank: true});
  });

  it('retains a textured lit world after excluding HUD and optional passive overlays', () => {
    const image = png(260, 260, (x, y) => [20 + x % 120, 30 + y % 120, 15 + (x + y) % 100]);
    const sampled = sampleWorldPng(image, [
      {id: 'action-bar', bounds: {left: 0, top: 195, right: 260, bottom: 260}},
      {x: 0, y: 0, width: 65, height: 65},
    ]);
    expect(sampled.samples).toBe(275);
    expect(sampled.litFraction).toBe(1);
    expect(sampled.colors).toBeGreaterThan(12);
    expect(sampled.likelyBlank).toBe(false);
  });

  it('reports unknown coverage instead of declaring a black frame when all samples are excluded', () => {
    const image = png(260, 260, () => [0, 0, 0]);
    expect(sampleWorldPng(image, [{x: 0, y: 0, width: 260, height: 260}])).toEqual({samples: 0, colors: 0, litFraction: null, likelyBlank: false});
  });

  it('needs more than 100 observed world pixels before declaring a likely blank frame', () => {
    const image = png(130, 130, () => [0, 0, 0]);
    expect(sampleWorldPng(image)).toEqual({samples: 100, colors: 1, litFraction: 0, likelyBlank: false});
  });

  it('ignores invalid or hidden rectangles and uses half-open pixel bounds without double counting', () => {
    const image = png(260, 260, () => [0, 0, 0]);
    const result = sampleWorldPng(image, [null, {}, {left: NaN, right: 260, top: 0, bottom: 260}, {hidden: true, x: 0, y: 0, width: 260, height: 260}, {left: 0, top: 0, right: 13, bottom: 260}, {left: 0, top: 0, right: 13, bottom: 260}]);
    expect(result.samples).toBe(380);
    expect(result.likelyBlank).toBe(true);
  });

  it('does not treat transparent bright RGB values as visible world content', () => {
    const image = png(260, 260, (x, y) => [x % 255, y % 255, 255, 0]);
    expect(sampleWorldPng(image)).toEqual({samples: 400, colors: 1, litFraction: 0, likelyBlank: true});
  });
});
