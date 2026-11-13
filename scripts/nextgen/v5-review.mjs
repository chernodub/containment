#!/usr/bin/env node
/** PNG-only V5 critique pages and native effect crops; never opens a browser. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { decode, encode, canvas, drawImage, drawText } from './g2-png.mjs';

const root = resolve(process.argv[2]);
const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
if (manifest.errors.length || manifest.failures.length) throw new Error('Capture has failures; original receipts retained.');
const out = resolve(root, 'critique'); await mkdir(out, { recursive: true });
const selected = manifest.shots.filter(s => /-04\.png$/.test(s.file));
for (let offset = 0; offset < selected.length; offset += 12) {
  const group = selected.slice(offset, offset + 12), sheet = canvas(1920, Math.ceil(group.length / 4) * 294);
  for (let i = 0; i < group.length; i++) {
    const s = group[i], thumb = decode(await readFile(resolve(root, 'review', s.file)));
    drawImage(sheet, thumb, i % 4 * 480, Math.floor(i / 4) * 294, 480, 270);
    drawText(sheet, s.file.replace('v2-', '').slice(0, 62), i % 4 * 480 + 5, Math.floor(i / 4) * 294 + 278, undefined, 1);
  }
  await writeFile(resolve(out, `impact-${Math.floor(offset / 12) + 1}.png`), encode(sheet));
}
// Native pixels only: these are source crops, never enlarged thumbnails.
for (const shot of selected) {
  const src = decode(await readFile(resolve(root, shot.file))), crop = canvas(960, 640);
  const left = Math.max(0, Math.min(src.width - 960, 300)), top = Math.max(0, Math.min(src.height - 640, 90));
  for (let y = 0; y < crop.height; y++) for (let x = 0; x < crop.width; x++) for (let c = 0; c < 3; c++)
    crop.pixels[(y * crop.width + x) * 3 + c] = src.pixels[((top + y) * src.width + left + x) * src.channels + c];
  await writeFile(resolve(out, shot.file), encode(crop));
}
console.log(`${basename(root)}: ${selected.length} impact thumbnails/native crops; original PNGs retained.`);
