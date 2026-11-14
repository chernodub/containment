#!/usr/bin/env node
/** File-only ten-composition boards, using the I10 exact area and code-value method. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {canvas, decode, drawImage, drawText, encode} from './g2-png.mjs';

const root = resolve(process.argv[2] ?? 'artifacts/nextgen/final5');
if (process.argv.includes('--help')) {
  console.log('node scripts/nextgen/i11-sheets.mjs <assembled-gallery>');
  process.exit(0);
}
const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
assert.deepEqual(manifest.errors ?? [], [], 'Capture errors must remain resolved');
assert.deepEqual(manifest.failures ?? [], [], 'Capture failures must remain resolved');
const rooms = [
  'awakening-bay', 'residential-gallery', 'crew-checkpoint', 'freight-hold',
  'relay-racks', 'diagnostic-gallery', 'service-shaft-landing',
  'infested-workshop', 'shielding-gate', 'overload-floor',
];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

/** Identical fractional pixel-area box average to i10-gallery.mjs; no gamma/exposure change. */
function reduceArea(source, width = 480, height = 270) {
  const horizontal = new Float64Array(width * source.height * 3);
  const sxScale = source.width / width, syScale = source.height / height;
  for (let y = 0; y < source.height; y++) for (let x = 0; x < width; x++) {
    const a = x * sxScale, b = (x + 1) * sxScale, target = (y * width + x) * 3;
    for (let sx = Math.floor(a); sx < Math.ceil(b); sx++) {
      const weight = Math.min(b, sx + 1) - Math.max(a, sx);
      const offset = (y * source.width + Math.min(source.width - 1, sx)) * source.channels;
      for (let c = 0; c < 3; c++) horizontal[target + c] += source.pixels[offset + c] * weight / sxScale;
    }
  }
  const result = canvas(width, height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const a = y * syScale, b = (y + 1) * syScale, target = (y * width + x) * 3;
    const value = [0, 0, 0];
    for (let sy = Math.floor(a); sy < Math.ceil(b); sy++) {
      const weight = Math.min(b, sy + 1) - Math.max(a, sy);
      const offset = (Math.min(source.height - 1, sy) * width + x) * 3;
      for (let c = 0; c < 3; c++) value[c] += horizontal[offset + c] * weight / syScale;
    }
    for (let c = 0; c < 3; c++) result.pixels[target + c] = Math.round(value[c]);
  }
  return result;
}

/** Rec.709 weights on sRGB PNG code values; this is deliberately not linear luminance. */
function grayscale(source) {
  const result = canvas(source.width, source.height);
  for (let n = 0; n < source.width * source.height; n++) {
    const sourceOffset = n * source.channels, target = n * 3;
    const value = Math.round(source.pixels[sourceOffset] * .2126 + source.pixels[sourceOffset + 1] * .7152 + source.pixels[sourceOffset + 2] * .0722);
    result.pixels[target] = result.pixels[target + 1] = result.pixels[target + 2] = value;
  }
  return result;
}

const boards = {color: canvas(2400, 592), grayscale: canvas(2400, 592)};
const receipts = [];
await mkdir(root, {recursive: true});
for (const [index, room] of rooms.entries()) {
  const shot = manifest.shots.find(s => s.room === room && s.scenario === 'x2-calm-motion-high' && s.frame === 2)
    ?? manifest.shots.find(s => s.file === `combat-calm-${room}.png`)
    ?? manifest.shots.find(s => s.room === room && s.scenario === 'combat-calm');
  assert(shot, `Missing calm composition: ${room}`);
  const original = resolve(root, shot.file), bytes = await readFile(original), source = decode(bytes);
  const small = reduceArea(source), gray = grayscale(small);
  const x = index % 5 * 480, y = Math.floor(index / 5) * 296;
  for (const [kind, image] of [['color', small], ['grayscale', gray]]) {
    drawText(boards[kind], room, x + 4, y + 4, undefined, 1);
    drawImage(boards[kind], image, x, y + 24, 480, 270);
  }
  receipts.push({room, file: shot.file, original, sha256: hash(bytes), scenario: shot.scenario,
    simulationMs: shot.simulationMs, frame: shot.frame, nativeWidth: source.width,
    nativeHeight: source.height, evidenceSource: shot.evidenceSource ?? null});
}
const outputs = [];
for (const [kind, board] of Object.entries(boards)) {
  const file = kind === 'color' ? 'lighting-ten-color.png' : 'lighting-ten-grayscale.png';
  const bytes = encode(board);
  await writeFile(resolve(root, file), bytes);
  outputs.push({file, sha256: hash(bytes), width: board.width, height: board.height});
}
await writeFile(resolve(root, 'lighting-ten.json'), JSON.stringify({
  method: 'Ten native calm compositions; exact 480×270 pixel-area reduction. Rec.709 grayscale uses sRGB PNG code values, not linear luminance. No exposure normalization. Different native room cameras remain explicit.',
  sourceSHA: manifest.distSnapshot?.sourceSHA ?? null, appAssets: manifest.appAssets ?? null,
  note: 'Prepared boards are not an assertion that a reviewer opened them. Full floor percentile sampling is a separate I10 luminance audit.',
  sources: receipts, outputs,
}, null, 2) + '\n');
console.log(`Ten lighting compositions: ${root}/lighting-ten-{color,grayscale}.png`);
