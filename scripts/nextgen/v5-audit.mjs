/** Rebuild matched PNG comparisons and the native-pixel language swatch receipt. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { canvas, decode, encode, drawImage, drawText } from './g2-png.mjs';

const before = resolve(process.argv[2] ?? 'artifacts/nextgen/v5-before');
const final = resolve(process.argv[3] ?? 'artifacts/nextgen/v5-final');
const out = resolve('artifacts/nextgen/v5');
const receipts = await Promise.all([before, final].map(async root => JSON.parse(await readFile(resolve(root, 'manifest.json')))));
for (const receipt of receipts) {
  assert.deepEqual(receipt.errors, []); assert.deepEqual(receipt.failures, []);
  assert.equal(receipt.shots.length, 280); assert.equal(receipt.sprites.length, 40);
}
await mkdir(resolve(out, 'comparisons'), { recursive: true });
const records = [];
for (const sprite of receipts[0].sprites) {
  const key = `${sprite.scenario}:${sprite.room}`;
  const frames = receipts.map(m => m.shots.filter(s => `${s.scenario}:${s.room}` === key).sort((a, b) => a.frame - b.frame));
  assert.equal(frames[0].length, 7); assert.equal(frames[1].length, 7);
  const sheet = canvas(3360, 588);
  for (let side = 0; side < 2; side++) for (let frame = 0; frame < 7; frame++) {
    const shot = frames[side][frame];
    assert.equal(shot.simulationMs, frames[0][frame].simulationMs, `${key} phase ${frame}`);
    assert.equal(shot.pixels.width, 1920); assert.equal(shot.pixels.height, 1080);
    const thumb = decode(await readFile(resolve(side ? final : before, 'review', shot.file)));
    assert.equal(thumb.width, 480); assert.equal(thumb.height, 270);
    drawImage(sheet, thumb, frame * 480, side * 294, 480, 270);
    drawText(sheet, `${side ? 'FINAL' : 'BEFORE'} ${shot.simulationMs}MS`, frame * 480 + 6, side * 294 + 278, undefined, 1);
  }
  const file = resolve(out, 'comparisons', sprite.file.replace('-sprite', ''));
  await writeFile(file, encode(sheet));
  records.push({ key, file, before: frames[0].map(s => resolve(before, s.file)), after: frames[1].map(s => resolve(final, s.file)) });
}
await writeFile(resolve(out, 'evidence-audit.json'), JSON.stringify({ matchedSheets: 40, framesPerSide: 280, simulationClocksMatch: true, nativeFrame: [1920, 1080], thumbnail: [480, 270], beforeSHA: receipts[0].gitSHA, finalBaseSHA: receipts[1].gitSHA, finalAssembly: receipts[1].sources, records }, null, 2));

// Existing authored source rectangles stay at native resolution; never enlarge or paint over.
const swatchFile = resolve(out, 'language-swatches.json');
const swatches = JSON.parse(await readFile(swatchFile));
const sheet = canvas(1440, 588);
for (const [i, record] of swatches.records.entries()) {
  const source = decode(await readFile(record.source)), crop = canvas(480, 270), { left, top, width, height } = record.crop;
  assert.equal(width, 480); assert.equal(height, 270); assert.equal(record.resized, false);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) for (let c = 0; c < 3; c++)
    crop.pixels[(y * width + x) * 3 + c] = source.pixels[((top + y) * source.width + left + x) * source.channels + c];
  drawImage(sheet, crop, i % 3 * 480, Math.floor(i / 3) * 294, 480, 270);
  drawText(sheet, record.label, i % 3 * 480 + 6, Math.floor(i / 3) * 294 + 278, undefined, 1);
}
swatches.rendererSourceSHA = receipts[1].gitSHA;
await writeFile(swatchFile, JSON.stringify(swatches, null, 2));
await writeFile(resolve(out, 'language-swatches.png'), encode(sheet));
console.log('40 matched sheets / 280 matching phase clocks / 6 native-pixel swatches verified.');
