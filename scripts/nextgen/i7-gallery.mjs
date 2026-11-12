#!/usr/bin/env node
/** Assemble immutable capture batches and make PNG review/contact sheets without a browser. */
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { canvas, decode, drawImage, drawText, encode } from './g2-png.mjs';
const [label, ...sources] = process.argv.slice(2);
assert(label && sources.length, 'Usage: i7-gallery.mjs <destination-label> <source-label>...');
const base = resolve('artifacts/nextgen'), out = resolve(base, label);
await mkdir(out, { recursive: true });
const manifest = { label, shots: [], sprites: [], errors: [], failures: [], sources: [] }, keys = new Set();
for (const source of sources) {
    const dir = resolve(base, source), m = JSON.parse(await readFile(resolve(dir, 'manifest.json'), 'utf8'));
    assert(!m.errors.length && !m.failures.length, `Unclean capture ${source}`);
    if (manifest.viewport) {
        assert.deepEqual(m.viewport, manifest.viewport);
        assert.deepEqual(m.appAssets, manifest.appAssets, 'Capture batches use different application bytes');
    }
    else
        for (const k of ['viewport', 'deviceScaleFactor', 'appAssets', 'gitSHA', 'renderer', 'hardwareAccelerated', 'distSnapshot'])
            manifest[k] = m[k];
    manifest.sources.push({ label: source, gitSHA: m.gitSHA, distSnapshot: m.distSnapshot, shots: m.shots.length });
    for (const kind of ['shots', 'sprites'])
        for (const shot of m[kind]) {
            assert(!keys.has(shot.file), `Duplicate image ${shot.file}`);
            keys.add(shot.file);
            await copyFile(resolve(dir, shot.file), resolve(out, shot.file));
            manifest[kind].push({ ...shot, sourceLabel: source });
        }
}
await writeFile(resolve(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
await writeFile(resolve(out, 'pngs.txt'), [...keys].map(f => resolve(out, f)).join('\n') + '\n');
const cards = manifest.sprites.concat(manifest.shots).map(s => `<figure><a href="${s.file}"><img loading="lazy" src="${s.file}" alt="${s.file}"></a><figcaption>${s.file}</figcaption></figure>`).join('');
await writeFile(resolve(out, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Containment ${label}</title><style>body{background:#081119;color:#dceaf2;font:15px system-ui;padding:24px}main{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}figure{margin:0}img{width:100%}figcaption{padding:8px}</style><h1>Containment / ${label}</h1><p>${manifest.shots.length} original ${manifest.viewport.width}×${manifest.viewport.height} frames; ${manifest.sprites.length} motion sheets. Staged visual evidence; see manifest for source provenance.</p><a href="compare-baseline.html">Baseline comparison</a><main>${cards}</main>`);
await mkdir(resolve(out, 'review'), { recursive: true });
const review = [];
for (let i = 0; i < manifest.shots.length; i += 8) {
    const shots = manifest.shots.slice(i, i + 8), sheet = canvas(960, Math.ceil(shots.length / 2) * 300);
    for (const [n, s] of shots.entries()) {
        const x = n % 2 * 480, y = Math.floor(n / 2) * 300;
        drawText(sheet, s.file.replace('.png', ''), x + 4, y + 5, [220, 235, 240], 1);
        drawImage(sheet, decode(await readFile(resolve(out, s.file))), x, y + 26, 480, 270);
    }
    const file = `review/review-${String(i / 8 + 1).padStart(3, '0')}.png`;
    await writeFile(resolve(out, file), encode(sheet));
    review.push({ file, shots: shots.map(s => s.file) });
}
await writeFile(resolve(out, 'review/coverage.json'), JSON.stringify(review, null, 2) + '\n');
console.log(`${manifest.shots.length} frames, ${manifest.sprites.length} phase sheets, ${review.length} review pages -> ${out}`);
