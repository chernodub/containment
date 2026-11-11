#!/usr/bin/env node
/** Exact 480x270 review frames and seven-phase sheets from original capture PNGs. */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { decode, encode, canvas, drawText, drawImage } from './g2-png.mjs';

const root = resolve(process.argv[2]);
const out = resolve(root, 'review');
await mkdir(out, { recursive: true });
const files = (await readdir(root)).filter(f => /-\d\d\.png$/.test(f)).sort();
const groups = new Map();
for (const file of files) {
  const key = file.replace(/-\d\d\.png$/, '');
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(file);
}
const cards = [];
const overview = canvas(480 * 4, 294 * Math.ceil(groups.size / 4));
let group = 0;
for (const [key, frames] of groups) {
  const sheet = canvas(480 * Math.min(4, frames.length), 294 * Math.ceil(frames.length / 4));
  for (let i = 0; i < frames.length; i++) {
    const src = decode(await readFile(resolve(root, frames[i])));
    const thumb = canvas(480, 270);
    // Area reduction keeps subpixel lightning and crack lines honest at thumbnail scale.
    for (let y = 0; y < 270; y++) for (let x = 0; x < 480; x++) {
      const x0 = Math.floor(x * src.width / 480), x1 = Math.floor((x + 1) * src.width / 480);
      const y0 = Math.floor(y * src.height / 270), y1 = Math.floor((y + 1) * src.height / 270);
      const count = (x1 - x0) * (y1 - y0), offset = (y * 480 + x) * 3;
      for (let c = 0; c < 3; c++) {
        let value = 0;
        for (let sy = y0; sy < y1; sy++) for (let sx = x0; sx < x1; sx++) value += src.pixels[(sy * src.width + sx) * src.channels + c];
        thumb.pixels[offset + c] = Math.round(value / count);
      }
    }
    await writeFile(resolve(out, frames[i]), encode(thumb));
    const x = i % 4 * 480, y = Math.floor(i / 4) * 294;
    drawImage(sheet, thumb, x, y, 480, 270);
    drawText(sheet, `${key.replace('awakening-bay', 'cryo')} / ${i + 1}`, x + 8, y + 276, undefined, 1);
    if (i === 2) {
      const ox = group % 4 * 480, oy = Math.floor(group / 4) * 294;
      drawImage(overview, thumb, ox, oy, 480, 270);
      drawText(overview, key.replace('v2-', '').replace('-awakening-bay', ''), ox + 8, oy + 276, undefined, 1);
    }
  }
  await writeFile(resolve(out, key + '-sheet.png'), encode(sheet));
  cards.push(`<figure><h2>${key}</h2><a href="../${key}-sprite.png">Full sheet</a><br><img src="${key}-sheet.png" style="max-width:100%"></figure>`);
  group++;
}
await writeFile(resolve(out, 'overview.png'), encode(overview));
await writeFile(resolve(out, 'index.html'), `<!doctype html><meta charset="utf-8"><title>${basename(root)} V3 review</title><body style="background:#101821;color:#dceaf0;font:14px system-ui"><h1>${basename(root)} / exact 480×270 frames</h1>${cards.join('')}</body>`);
console.log(`${groups.size} sheets and ${files.length} exact 480x270 frames: ${out}`);
