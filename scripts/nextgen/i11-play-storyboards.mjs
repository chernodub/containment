#!/usr/bin/env node
/** File-only real-play storyboards; source PNGs and snapshots remain unchanged. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {constants} from 'node:fs';
import {readFile, writeFile, mkdir, copyFile} from 'node:fs/promises';
import {resolve, basename} from 'node:path';
import {canvas, decode, encode, drawImage, drawText} from './g2-png.mjs';
import {selectStoryboardFrames} from './playtest/storyboard.mjs';

const args = process.argv.slice(2);
if (args.includes('--help') || args.length < 2) {
  console.log('node scripts/nextgen/i11-play-storyboards.mjs <output-directory> <campaign-directory> [campaign-directory ...]');
  console.log('Requires --storyboard-room captures from ordinary unassisted native campaigns, with a real room clear and at least ten fight observations.');
  process.exit(args.includes('--help') ? 0 : 1);
}
const output = resolve(args[0]);
const directories = args.slice(1).map(directory => resolve(directory));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const safe = value => assert(typeof value === 'string' && /^[\w.-]+\.(png|json)$/.test(value), `Unsafe evidence filename ${value}`);

/** Exact pixel-area box reduction in PNG code values, matching I10. */
function reduceArea(source) {
  const width = 480, height = 270;
  const horizontal = new Float64Array(width * source.height * 3);
  const scaleX = source.width / width, scaleY = source.height / height;
  for (let y = 0; y < source.height; y++) for (let x = 0; x < width; x++) {
    const a = x * scaleX, b = (x + 1) * scaleX, target = (y * width + x) * 3;
    for (let sx = Math.floor(a); sx < Math.ceil(b); sx++) {
      const weight = Math.min(b, sx + 1) - Math.max(a, sx);
      const offset = (y * source.width + Math.min(source.width - 1, sx)) * source.channels;
      for (let channel = 0; channel < 3; channel++) horizontal[target + channel] += source.pixels[offset + channel] * weight / scaleX;
    }
  }
  const result = canvas(width, height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const a = y * scaleY, b = (y + 1) * scaleY, target = (y * width + x) * 3;
    const sum = [0, 0, 0];
    for (let sy = Math.floor(a); sy < Math.ceil(b); sy++) {
      const weight = Math.min(b, sy + 1) - Math.max(a, sy);
      const offset = (Math.min(source.height - 1, sy) * width + x) * 3;
      for (let channel = 0; channel < 3; channel++) sum[channel] += horizontal[offset + channel] * weight / scaleY;
    }
    for (let channel = 0; channel < 3; channel++) result.pixels[target + channel] = Math.round(sum[channel]);
  }
  return result;
}

const campaigns = [];
for (const directory of directories) {
  const reportPath = resolve(directory, 'report.json'), reportBytes = await readFile(reportPath);
  const report = JSON.parse(reportBytes);
  assert(['breacher', 'cryo', 'pyro', 'arc'].includes(report.rig), 'Unknown campaign rig');
  assert(!campaigns.some(campaign => campaign.rig === report.rig), `Duplicate rig ${report.rig}`);
  assert.equal(report.seed, 1729, 'Expected the acceptance seed');
  assert.equal(report.assisted, false, 'Storyboard must retain unassisted damage');
  assert.equal(report.fastRendering, false, 'Storyboard must render every fixed tick');
  assert.equal(report.legacy, false, 'Story showcase must use the twenty-room story');
  assert.match(report.clock, /native fixed 60Hz.*render every fixed tick/, 'Expected the ordinary native fixed clock');
  assert(report.storyboard, `No opt-in storyboard receipts in ${directory}`);
  const frames = selectStoryboardFrames(report.storyboard.frames);
  const recordedRoom = report.rooms.find(room => room.nodeId === frames[0].nodeId);
  assert(recordedRoom && ['clear', 'complete'].includes(recordedRoom.result), 'Room outcome does not prove a real clear');
  if (campaigns.length) {
    assert.equal(report.distributionSourceSHA, campaigns[0].applicationSourceSHA, 'Campaign application sources differ');
    assert.deepEqual(report.distributionAssets, campaigns[0].applicationAssets, 'Campaign application assets differ');
  }
  campaigns.push({
    rig:report.rig, label:report.label, directory, reportPath, reportSHA256:hash(reportBytes),
    applicationSourceSHA:report.distributionSourceSHA, applicationAssets:report.distributionAssets,
    room:recordedRoom.id, nodeId:recordedRoom.nodeId, roomResult:recordedRoom.result,
    campaignOutcome:report.outcome, campaignErrors:report.errors, campaignDefects:report.defects,
    totalObservations:report.storyboard.frames.length, frames,
  });
}
await mkdir(output, {recursive:true});
const receipts = [];
for (const campaign of campaigns) {
  const directory = resolve(output, campaign.rig);
  await mkdir(directory, {recursive:true});
  await mkdir(resolve(directory, 'review480'), {recursive:true});
  const sheet = canvas(1920, 3 * 304);
  const frames = [];
  for (const [index, frame] of campaign.frames.entries()) {
    safe(frame.file); safe(frame.snapshot);
    const sourcePNG = resolve(campaign.directory, frame.file), sourceSnapshot = resolve(campaign.directory, frame.snapshot);
    const bytes = await readFile(sourcePNG), snapshotBytes = await readFile(sourceSnapshot);
    const snapshot = JSON.parse(snapshotBytes), image = decode(bytes);
    assert.equal(image.width, 1920, 'Native storyboard must be 1920 pixels wide');
    assert.equal(image.height, 1080, 'Native storyboard must be 1080 pixels high');
    assert.equal(snapshot.node.id, campaign.nodeId, 'Snapshot belongs to another room');
    assert.equal(snapshot.elapsed, frame.elapsed, 'Snapshot clock disagrees with observation');
    assert.equal(snapshot.status, frame.status, 'Snapshot state disagrees with observation');
    assert.equal(snapshot.remaining, frame.remaining, 'Snapshot remaining count disagrees with observation');
    assert(snapshot.stats, 'Authoritative native action counters required');
    const file = `${String(index + 1).padStart(2, '0')}-${basename(frame.file)}`;
    const snapshotFile = file.replace(/\.png$/, '.json');
    await copyFile(sourcePNG, resolve(directory, file), constants.COPYFILE_FICLONE);
    await copyFile(sourceSnapshot, resolve(directory, snapshotFile), constants.COPYFILE_FICLONE);
    const small = reduceArea(image), smallBytes = encode(small);
    await writeFile(resolve(directory, 'review480', file), smallBytes);
    const x = index % 4 * 480, y = Math.floor(index / 4) * 304;
    drawText(sheet, `${index + 1}/12 ${frame.beat.toUpperCase()} ${frame.roomSeconds.toFixed(2)}s`, x + 5, y + 4, undefined, 1);
    drawImage(sheet, small, x, y + 22, 480, 270);
    drawText(sheet, `LEFT ${frame.remaining} KILLS ${frame.kills} ${frame.shooting ? 'FIRING' : ''}`, x + 5, y + 294, undefined, 1);
    frames.push({
      ...frame, file:`${campaign.rig}/${file}`, snapshot:`${campaign.rig}/${snapshotFile}`,
      review480:`${campaign.rig}/review480/${file}`, sourcePNG, sourceSnapshot,
      pngSHA256:hash(bytes), snapshotSHA256:hash(snapshotBytes), review480SHA256:hash(smallBytes),
      stats:snapshot.stats, abilities:snapshot.abilities, lastInput:frame.input??null,
      framing:snapshot.framingEvidence ?? snapshot.hud ?? null,
    });
  }
  const sheetFile = `${campaign.rig}-storyboard.png`, sheetBytes = encode(sheet);
  await writeFile(resolve(output, sheetFile), sheetBytes);
  const {frames:unused, ...source} = campaign;
  receipts.push({...source, sheet:sheetFile, sheetSHA256:hash(sheetBytes), frames});
  console.log(`${campaign.rig}: 12 real ${campaign.room} frames, ${campaign.totalObservations} candidates, ${frames.at(-1).roomSeconds.toFixed(2)} simulated seconds`);
}
const manifest = {
  method:'Twelve strictly ordered actual native PNG observations: entry, ten distributed fight frames and real clear. Exact pixel-area 480×270 PNG code-value reductions; native originals and snapshots copied byte-for-byte. No pose, simulation, policy or camera intervention.',
  note:'Fixed-step campaign timings are CPU submission evidence, not hardware FPS. Campaign errors/defects and missing rigs remain explicit.',
  rigs:receipts.map(receipt => receipt.rig), missingRigs:['breacher','cryo','pyro','arc'].filter(rig => !receipts.some(receipt => receipt.rig === rig)),
  campaigns:receipts,
};
await writeFile(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
await writeFile(resolve(output, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><title>I11 real bot-played room storyboards</title><style>body{background:#101820;color:#e0edf5;font:15px system-ui;margin:24px}a{color:#a0e6ff}img{display:block;width:100%;height:auto}figure{margin:16px 0}p{line-height:1.5}.frames{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}figcaption{padding:7px}</style><h1>I11 real bot-played room storyboards</h1><p>${escape(manifest.method)}</p><p>${escape(manifest.note)} Missing rigs: ${escape(manifest.missingRigs.join(', ') || 'none')}. <a href="manifest.json">Source hashes, clocks and native receipts</a></p>${receipts.map(receipt => `<section><h2>${escape(receipt.rig)} / ${escape(receipt.room)}</h2><p>Actual room result: ${escape(receipt.roomResult)}. Campaign: ${escape(receipt.campaignOutcome)}; ${receipt.campaignErrors.length} errors; ${receipt.campaignDefects.length} defects. Entry → clear in ${receipt.frames.at(-1).roomSeconds.toFixed(2)} simulated seconds.</p><figure><a href="${receipt.sheet}"><img src="${receipt.sheet}" alt="${escape(receipt.rig)} twelve-frame actual fight flow"></a></figure><div class="frames">${receipt.frames.map((frame, index) => `<figure><a href="${frame.file}"><img src="${frame.review480}" loading="lazy" alt="${index + 1} ${escape(frame.beat)}"></a><figcaption>${index + 1}/12 · ${escape(frame.beat)} · ${frame.roomSeconds.toFixed(2)}s · ${frame.remaining} left<br><a href="${frame.snapshot}">Original snapshot</a></figcaption></figure>`).join('')}</div></section>`).join('')}</html>`);
console.log(`${receipts.length} storyboard(s): ${output}/index.html`);
