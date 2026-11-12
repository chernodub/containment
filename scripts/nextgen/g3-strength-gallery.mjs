#!/usr/bin/env node
/** Four-strength review from capture manifests; never launches a browser or alters source evidence. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canvas, decode, drawImage, drawText, encode } from './g2-png.mjs';

const STRENGTHS = ['OFF', 'SUBTLE', 'MEDIUM', 'BOLD'];
const CROP_SIZE = Object.freeze({ width: 600, height: 400 });
export const DEFAULT_CROPS = Object.freeze({
  'combat-kiting|awakening-bay': { x: 650, y: 120, ...CROP_SIZE, subject: 'overlapping upper enemy group' },
  'combat-heavy|armory': { x: 580, y: 350, ...CROP_SIZE, subject: 'dense enemy overlap and marine' },
  'x2-calm-motion-high|communal-atrium': { x: 1020, y: 220, ...CROP_SIZE, subject: 'planter panels, foliage and benches during camera motion' },
  'combat-calm|communal-atrium': { x: 1020, y: 220, ...CROP_SIZE, subject: 'planter panels, foliage and benches at rest' },
});
const REQUIRED = [
  ['combat-calm', 'communal-atrium', 1], ['combat-calm', 'armory', 1],
  ['combat-calm', 'awakening-bay', 1], ['combat-calm', 'overload-floor', 1],
  ['combat-kiting', 'awakening-bay', 4], ['combat-heavy', 'armory', 4],
  ['boss', 'reactor-vault', 4], ['x2-calm-motion-high', 'communal-atrium', 4],
];
const shotKey = shot => [shot.scenario, shot.room ?? '', shot.frame ?? 0].join('|');
const groupKey = shot => [shot.scenario, shot.room ?? ''].join('|');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const href = (base, path) => relative(base, path).split(sep).map(encodeURIComponent).join('/');
const safeName = value => value.replace(/[^a-zA-Z0-9_-]/g, '-');

/** Exact area reduction, including fractional source-pixel contributions. RGB output, no sharpen. */
export function areaReduce(source, width = 480, height = 270) {
  assert(width > 0 && height > 0 && width <= source.width && height <= source.height, 'Review must reduce actual source pixels');
  const output = canvas(width, height), sums = new Float64Array(3);
  const dx = source.width / width, dy = source.height / height;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    sums.fill(0);
    const x0 = x * dx, x1 = (x + 1) * dx, y0 = y * dy, y1 = (y + 1) * dy;
    for (let sy = Math.floor(y0); sy < Math.ceil(y1); sy++) for (let sx = Math.floor(x0); sx < Math.ceil(x1); sx++) {
      const weight = (Math.min(x1, sx + 1) - Math.max(x0, sx)) * (Math.min(y1, sy + 1) - Math.max(y0, sy));
      const input = (sy * source.width + sx) * source.channels;
      for (let channel = 0; channel < 3; channel++) sums[channel] += source.pixels[input + channel] * weight;
    }
    const pixel = (y * width + x) * 3;
    for (let channel = 0; channel < 3; channel++) output.pixels[pixel + channel] = Math.round(sums[channel] / (dx * dy));
  }
  return output;
}

/** Copy the requested native rectangle byte-for-byte in RGB; never resize a crop. */
export function extractRgb(source, rectangle) {
  const { x, y, width, height } = rectangle;
  for (const value of [x, y, width, height]) assert(Number.isInteger(value), 'Crop coordinates must be integer native pixels');
  assert(x >= 0 && y >= 0 && width > 0 && height > 0 && x + width <= source.width && y + height <= source.height, 'Crop exceeds source PNG');
  const output = canvas(width, height);
  for (let row = 0; row < height; row++) for (let column = 0; column < width; column++) {
    const input = ((y + row) * source.width + x + column) * source.channels;
    const target = (row * width + column) * 3;
    for (let channel = 0; channel < 3; channel++) output.pixels[target + channel] = source.pixels[input + channel];
  }
  return output;
}

function rgbStatistics(image) {
  const min = [255, 255, 255], max = [0, 0, 0], sum = [0, 0, 0];
  let luma = 0, squaredLuma = 0;
  for (let pixel = 0; pixel < image.pixels.length; pixel += 3) {
    for (let channel = 0; channel < 3; channel++) {
      const value = image.pixels[pixel + channel];
      min[channel] = Math.min(min[channel], value); max[channel] = Math.max(max[channel], value); sum[channel] += value;
    }
    const value = image.pixels[pixel] * .2126 + image.pixels[pixel + 1] * .7152 + image.pixels[pixel + 2] * .0722;
    luma += value; squaredLuma += value * value;
  }
  const samples = image.width * image.height, mean = luma / samples;
  return { width: image.width, height: image.height, channels: 3, color: 'RGB8', samples, rgbMin: min, rgbMax: max,
    rgbMean: sum.map(value => value / samples), lumaMean: mean, lumaStandardDeviation: Math.sqrt(Math.max(0, squaredLuma / samples - mean * mean)), decodedRgbSHA256: hash(image.pixels) };
}

export function validateManifest(manifest, label) {
  assert(Array.isArray(manifest.errors) && Array.isArray(manifest.failures) && Array.isArray(manifest.shots), `${label}: invalid capture manifest`);
  assert.equal(manifest.errors.length, 0, `${label}: console/page errors cannot enter accepted evidence`);
  assert.equal(manifest.failures.length, 0, `${label}: failed captures cannot enter accepted evidence`);
  assert(manifest.shots.length > 0, `${label}: empty capture`);
  const byKey = new Map();
  for (const shot of manifest.shots) {
    assert(!byKey.has(shotKey(shot)), `${label}: duplicate shot ${shotKey(shot)}`);
    assert(!shot.errors?.length && !shot.evidence?.drawErrors?.length, `${label}: shot errors ${shotKey(shot)}`);
    assert(typeof shot.file === 'string' && shot.file.endsWith('.png'), `${label}: PNG file required`);
    byKey.set(shotKey(shot), shot);
  }
  for (const [scenario, room, count] of REQUIRED) {
    const shots = manifest.shots.filter(shot => shot.scenario === scenario && shot.room === room);
    assert.equal(shots.length, count, `${label}: ${scenario}/${room} requires ${count} frames`);
    if (count === 4) assert.deepEqual(shots.map(shot => shot.frame).sort((a, b) => a - b), [1, 2, 3, 4], `${label}: burst frames must be 1–4`);
  }
  return byKey;
}

async function exists(path) { try { await access(path); return true; } catch { return false; } }

export async function buildStrengthGallery(labels, outputLabel = 'g3-bold-ab', cropOverrides = {}) {
  assert.equal(labels.length, 4, 'Specify OFF, subtle, medium and bold capture labels');
  const base = resolve('artifacts/nextgen'), output = resolve(base, outputLabel);
  const sources = [];
  for (let index = 0; index < labels.length; index++) {
    const label = labels[index], directory = resolve(base, label), manifestFile = resolve(directory, 'manifest.json');
    const manifestBytes = await readFile(manifestFile), manifest = JSON.parse(manifestBytes);
    sources.push({ strength: STRENGTHS[index], label, directory, manifestFile, manifest, byKey: validateManifest(manifest, label),
      manifestSHA256: hash(manifestBytes), rendererSHA: manifest.distSnapshot?.sourceSHA ?? manifest.gitSHA });
  }
  const keys = [...sources[0].byKey.keys()].sort();
  for (const source of sources.slice(1)) {
    assert.deepEqual([...source.byKey.keys()].sort(), keys, `${source.label}: source keys differ from OFF`);
    assert.equal(source.rendererSHA, sources[0].rendererSHA, `${source.label}: all strengths must use the same frozen application revision`);
    assert.deepEqual(source.manifest.viewport, sources[0].manifest.viewport, `${source.label}: capture viewport differs`);
    assert.equal(source.manifest.seed, sources[0].manifest.seed, `${source.label}: capture seed differs`);
    if (source.manifest.appAssets && sources[0].manifest.appAssets) {
      const entries = assets => Object.entries(assets).sort(([a], [b]) => a.localeCompare(b));
      assert.deepEqual(entries(source.manifest.appAssets), entries(sources[0].manifest.appAssets), `${source.label}: frozen application assets differ`);
    }
    for (const key of keys) {
      const shot = source.byKey.get(key), reference = sources[0].byKey.get(key);
      for (const clock of ['simulationMs', 'presentationMs']) assert.equal(shot[clock], reference[clock], `${source.label}: ${key} has mismatched ${clock}`);
    }
  }
  assert(!await exists(output), `Refusing to overwrite existing evidence directory ${output}; choose a new output label`);
  const rectangles = { ...DEFAULT_CROPS, ...cropOverrides };
  for (const [name, rectangle] of Object.entries(rectangles)) {
    assert.deepEqual([rectangle.width, rectangle.height], [600, 400], `${name}: native crops must be exactly 600×400`);
  }
  await mkdir(output, { recursive: true });
  await mkdir(resolve(output, 'review480'));
  await mkdir(resolve(output, 'native-crops'));
  await mkdir(resolve(output, 'motion'));
  const report = {
    method: 'Four strengths aligned by scenario/room/frame. 480×270 exact weighted area reduction; native crops are integer-coordinate RGB copies with no rescale. Burst rows are fixed simulation-time stills, not optical-flow or performance certification.',
    cropCoordinates: rectangles,
    cropCoordinateReferences: [
      resolve(base, 'g3-round3-on/combat-kiting-awakening-bay-02.png'),
      resolve(base, 'g3-round3-on/combat-heavy-armory-02.png'),
      resolve(base, 'g3-round3-on/combat-calm-communal-atrium.png'),
      '/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final/x2-calm-motion-high-communal-atrium-02.png',
    ],
    sources: sources.map(({ strength, label, directory, manifestFile, manifestSHA256, rendererSHA, manifest }) => ({
      strength, label, directory, manifestFile, manifestSHA256, rendererSHA, seed: manifest.seed, viewport: manifest.viewport,
      appAssetsSHA256: manifest.appAssets ? hash(JSON.stringify(Object.entries(manifest.appAssets).sort(([a], [b]) => a.localeCompare(b)))) : undefined,
      graphicsOverrides: manifest.graphicsOverrides, style: manifest.graphicStyle ?? manifest.style, distSnapshot: manifest.distSnapshot,
    })),
    rows: [], motion: [], cropStats: [],
  };
  const groups = new Map();
  for (const key of keys) {
    const shots = sources.map(source => source.byKey.get(key));
    const name = safeName(shots[0].file.replace(/\.png$/, ''));
    const row = canvas(480 * 4, 294), rectangle = rectangles[groupKey(shots[0])];
    const cropRow = rectangle ? canvas(600 * 4, 424) : null;
    const item = { key, scenario: shots[0].scenario, room: shots[0].room, frame: shots[0].frame, review: resolve(output, 'review480', `${name}-strengths.png`),
      cropReview: cropRow ? resolve(output, 'native-crops', `${name}-strengths-native.png`) : null, sources: [] };
    for (let index = 0; index < 4; index++) {
      const source = sources[index], shot = shots[index], path = resolve(source.directory, shot.file);
      assert(path.startsWith(source.directory + sep), `${source.label}: PNG path escaped capture directory`);
      const bytes = await readFile(path), image = decode(bytes);
      assert.deepEqual([image.width, image.height], [1920, 1080], `${source.label}/${shot.file}: native 1920×1080 required for fixed crop coordinates`);
      const small = areaReduce(image), column = index * 480;
      drawText(row, STRENGTHS[index], column + 8, 5); drawImage(row, small, column, 24, 480, 270);
      const entry = { strength: STRENGTHS[index], file: path, pngSHA256: hash(bytes), width: image.width, height: image.height,
        presentationMs: shot.presentationMs, simulationMs: shot.simulationMs, frame: shot.frame, crop: null };
      if (rectangle) {
        const crop = extractRgb(image, rectangle), file = resolve(output, 'native-crops', `${name}-${STRENGTHS[index].toLowerCase()}.png`);
        await writeFile(file, encode(crop)); entry.crop = file;
        drawText(cropRow, STRENGTHS[index], index * 600 + 8, 5); drawImage(cropRow, crop, index * 600, 24, 600, 400);
        report.cropStats.push({ key, strength: STRENGTHS[index], source: path, file, rectangle, ...rgbStatistics(crop) });
      }
      item.sources.push(entry);
    }
    await writeFile(item.review, encode(row));
    if (cropRow) await writeFile(item.cropReview, encode(cropRow));
    report.rows.push(item);
    if (shots[0].frame !== null && shots[0].frame !== undefined) {
      const name = groupKey(shots[0]), group = groups.get(name) ?? [];
      group.push(item); groups.set(name, group);
    }
  }
  for (const [group, rows] of groups) {
    rows.sort((a, b) => a.frame - b.frame);
    assert.equal(rows.length, 4, `${group}: motion review requires four frames`);
    for (let index = 0; index < 4; index++) {
      const full = canvas(1920, 294), crops = rows[0].cropReview ? canvas(2400, 424) : null;
      for (let frame = 0; frame < 4; frame++) {
        const entry = rows[frame].sources[index];
        const label = `${STRENGTHS[index]} F${rows[frame].frame} ${Math.round(entry.simulationMs ?? 0)}MS`;
        drawText(full, label, frame * 480 + 8, 5); drawImage(full, areaReduce(decode(await readFile(entry.file))), frame * 480, 24, 480, 270);
        if (crops) { drawText(crops, label, frame * 600 + 8, 5); drawImage(crops, decode(await readFile(entry.crop)), frame * 600, 24, 600, 400); }
      }
      const name = `${safeName(group)}-${STRENGTHS[index].toLowerCase()}`, file = resolve(output, 'motion', `${name}-four-frames.png`);
      const cropFile = crops ? resolve(output, 'motion', `${name}-four-native-crops.png`) : null;
      await writeFile(file, encode(full)); if (crops) await writeFile(cropFile, encode(crops));
      report.motion.push({ group, strength: STRENGTHS[index], file, cropFile, frames: rows.map(row => ({ key: row.key, frame: row.frame,
        simulationMs: row.sources[index].simulationMs, presentationMs: row.sources[index].presentationMs, original: row.sources[index].file, crop: row.sources[index].crop })) });
    }
  }
  await writeFile(resolve(output, 'stats.json'), JSON.stringify(report, null, 2) + '\n');
  const originalLinks = row => row.sources.map(source => `<a href="${href(output, source.file)}">${source.strength} full PNG</a>${source.crop ? ` · <a href="${href(output, source.crop)}">600×400 native crop</a>` : ''}`).join(' · ');
  await writeFile(resolve(output, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>G3 four-strength review</title><style>
body{margin:24px;background:#10151b;color:#dbe9ee;font:14px system-ui;line-height:1.5}a{color:#a5ddf6}h2{font-size:17px}figure{margin:24px 0}img{display:block;max-width:100%;height:auto}.native{overflow-x:auto}.native img{width:2400px;max-width:none}details{margin-top:8px}code{color:#a5ddf6}nav a{margin-right:16px}
</style><h1>G3 / OFF · subtle · medium · bold</h1><p>Each row uses the same captured scenario, room and frame. Reviews are exact area-reduced 480×270 per column; full native PNGs remain linked. Native crops copy exactly 600×400 RGB pixels and scroll horizontally at 1:1. Fixed crop coordinates remain identical across strengths and burst frames. Compare contour separation, prop/actor cohesion and hostile-warning priority. Four-frame rows reveal aliasing or crawling; they retain simulation timestamps and camera movement.</p>
<p>${sources.map(source => `${source.strength}: ${escape(source.label)} <code>${escape(source.rendererSHA)}</code>`).join('<br>')}</p><nav><a href="#matched">Matched strength rows</a><a href="#motion">Four-frame motion rows</a><a href="stats.json">Coordinates, hashes and RGB statistics</a></nav>
<h2 id="matched">Matched strength rows</h2>${report.rows.map(row => `<figure><h2>${escape(row.key)}</h2><a href="${href(output, row.review)}"><img loading="lazy" src="${href(output, row.review)}" alt="${escape(row.key)} four strengths"></a><p>${originalLinks(row)}</p>${row.cropReview ? `<details><summary>Native 600×400 crops / ${escape(rectangles[groupKey(row)]?.subject ?? '')}</summary><div class="native"><img loading="lazy" src="${href(output, row.cropReview)}" alt="Native crops"></div></details>` : ''}</figure>`).join('')}
<h2 id="motion">Four-frame motion rows / left to right</h2>${report.motion.map(item => `<figure><h2>${escape(item.group)} · ${item.strength}</h2><a href="${href(output, item.file)}"><img loading="lazy" src="${href(output, item.file)}" alt="Four-frame timeline"></a>${item.cropFile ? `<details><summary>Four native 600×400 crops at 1:1</summary><div class="native"><img loading="lazy" src="${href(output, item.cropFile)}" alt="Native crop timeline"></div></details>` : ''}</figure>`).join('')}</html>`);
  console.log(`${report.rows.length} matched strength rows, ${report.motion.length} four-frame rows, ${report.cropStats.length} native 600×400 RGB crops: ${output}`);
  return report;
}

function selfTest() {
  const image = canvas(8, 6);
  for (let y = 0; y < 6; y++) for (let x = 0; x < 8; x++) {
    const pixel = (y * 8 + x) * 3;
    image.pixels[pixel] = x * 8; image.pixels[pixel + 1] = y * 8; image.pixels[pixel + 2] = x + y;
  }
  const crop = extractRgb(image, { x: 2, y: 1, width: 3, height: 2 });
  assert.deepEqual([...crop.pixels.subarray(0, 3)], [16, 8, 3]); assert.deepEqual([...crop.pixels.subarray(-3)], [32, 16, 6]);
  assert.deepEqual(decode(encode(crop)).pixels, crop.pixels);
  const small = areaReduce(image, 4, 3);
  assert.deepEqual([...small.pixels.subarray(0, 3)], [4, 4, 1]);
  const fractional = areaReduce(canvas(7, 5), 3, 2);
  assert(fractional.pixels.every(value => value === 18));
  assert.throws(() => extractRgb(image, { x: 7, y: 0, width: 2, height: 1 }));
  const shots = REQUIRED.flatMap(([scenario, room, count]) => Array.from({ length: count }, (_, index) => ({ scenario, room, frame: count === 1 ? null : index + 1, file: `${scenario}-${room}-${index}.png` })));
  assert.equal(validateManifest({ shots, errors: [], failures: [] }, 'valid').size, 20);
  assert.throws(() => validateManifest({ shots: [...shots, shots[0]], errors: [], failures: [] }, 'duplicate'));
  assert.throws(() => validateManifest({ shots: shots.slice(1), errors: [], failures: [] }, 'missing'));
  assert.throws(() => validateManifest({ shots: [], errors: ['bad'], failures: [] }, 'bad'));
  assert.throws(() => validateManifest({ shots: [], errors: [], failures: ['bad'] }, 'bad'));
  console.log('G3 strength gallery self-test passed: exact RGB crop, lossless PNG roundtrip, integer/fractional area reduction, bounds and capture rejection.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--self-test')) selfTest();
  else {
    const args = process.argv.slice(2), positional = args.filter(value => !value.startsWith('--'));
    assert(positional.length >= 4 && positional.length <= 5, 'Usage: g3-strength-gallery.mjs OFF-label subtle-label medium-label bold-label [output-label=g3-bold-ab] [--crops=/absolute/coordinates.json]');
    const cropsPath = args.find(value => value.startsWith('--crops='))?.slice('--crops='.length);
    const crops = cropsPath ? JSON.parse(await readFile(resolve(cropsPath), 'utf8')) : {};
    await buildStrengthGallery(positional.slice(0, 4), positional[4], crops);
  }
}
