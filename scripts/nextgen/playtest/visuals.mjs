import {decodePng} from '../sprites.mjs';

function bounds(value) {
  const rect = value?.bounds ?? value;
  if (!rect || rect.hidden) return null;
  const left = rect.left ?? rect.x, top = rect.top ?? rect.y;
  const right = rect.right ?? left + rect.width, bottom = rect.bottom ?? top + rect.height;
  return [left, top, right, bottom].every(Number.isFinite) && right > left && bottom > top ? {left, top, right, bottom} : null;
}

/**
 * Sample world pixels on a 13px grid after excluding visible opaque UI bounds.
 * Bounds must be in screenshot pixels (scale CSS rectangles by DPR when DPR is not 1).
 * A null litFraction means no world pixels remained; this never declares a blank frame.
 */
export function sampleWorldPng(png, excludedRects = []) {
  const {width, height, pixels} = decodePng(png);
  const excluded = excludedRects.map(bounds).filter(Boolean), colors = new Set();
  let samples = 0, lit = 0;
  for (let y = 0; y < height; y += 13) {
    for (let x = 0; x < width; x += 13) {
      if (excluded.some(rect => x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom)) continue;
      const offset = (y * width + x) * 4, alpha = pixels[offset + 3] / 255;
      // Transparent screenshot pixels are evaluated against black rather than hidden RGB data.
      const r = Math.round(pixels[offset] * alpha), g = Math.round(pixels[offset + 1] * alpha), b = Math.round(pixels[offset + 2] * alpha);
      samples++;
      if (Math.max(r, g, b) > 12) lit++;
      colors.add((r >> 3) * 1024 + (g >> 3) * 32 + (b >> 3));
    }
  }
  const litFraction = samples ? lit / samples : null;
  return {samples, colors: colors.size, litFraction, likelyBlank: samples > 100 && litFraction < .01 && colors.size < 12};
}
