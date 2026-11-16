#!/usr/bin/env node
/** Assemble complete guarded E9 captures without changing raw parent evidence. */
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, copyFile} from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {canvas, decode, encode, drawImage, drawText} from './g2-png.mjs';
import {review480} from './l8-review-images.mjs';
import {L8_CAPTURE_ROOMS} from './l8-capture-data.mjs';
import {E9_ROOM_TOURS, assertRoomTour} from './e9-room-tour.mjs';
import {assertPlayingMarine} from './capture-marine-contract.mjs';
import {assertNativeWarning} from './capture-warning-contract.mjs';

const args = process.argv.slice(2);
const option = (name, fallback) => args.find(a => a.startsWith('--' + name + '='))?.slice(name.length + 3) ?? fallback;
const output = resolve(option('out', 'artifacts/nextgen/e9-final'));
const history = resolve(option('before', '/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/l8-final/converged/native'));
const roomIds = option('rooms', '').split(',').filter(Boolean);
const rooms = roomIds.length ? roomIds.map(id => {
  const room = L8_CAPTURE_ROOMS.find(r => r.id === id); assert(room, 'Unknown room ' + id); return room;
}) : L8_CAPTURE_ROOMS;
const tourOnly = args.includes('--tour-only');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const loadParent = async (directory, rejectedOnly = false) => {
  directory = resolve(directory);
  const bytes = await readFile(resolve(directory, 'manifest.json'));
  return {directory, manifest: JSON.parse(bytes), manifestSHA256: hash(bytes), rejectedOnly};
};
const parents = [
  ...await Promise.all(args.filter(a => !a.startsWith('--')).map(directory => loadParent(directory))),
  ...await Promise.all(args.filter(a => a.startsWith('--failed-parent=')).map(arg => loadParent(arg.slice(16), true))),
];
assert(parents.length, 'Supply raw capture directories');
const reference = parents[0].manifest, sourceSHA = option('sha', reference.distSnapshot?.sourceSHA ?? reference.gitSHA);
assert.match(sourceSHA, /^[a-f0-9]{40}$/, 'Supply full source --sha');
assert.deepEqual(reference.viewport, {width: 1920, height: 1080});
assert.equal(reference.deviceScaleFactor, 1);
assert(Object.keys(reference.appAssets ?? {}).length, 'Capture has no application asset hashes');
const selected = new Map(), key = (scenario, room) => scenario + ':' + room;
const expectedScenarios = tourOnly ? ['room-tour'] : ['room-tour', 'combat-calm', 'g6-kiting'];
for (const parent of parents) {
  const m = parent.manifest;
  if (parent.rejectedOnly) {
    assert(m.fatalError || m.failures?.length || m.errors?.length, 'Explicit failed parent has no recorded failure');
    continue;
  }
  for (const field of ['viewport', 'deviceScaleFactor', 'seed', 'burstStepMs']) {
    assert.deepEqual(m[field], reference[field], parent.directory + ': mismatched ' + field);
  }
  const actualSource = m.distSnapshot?.sourceSHA ?? m.gitSHA;
  assert.match(actualSource??'', /^[a-f0-9]{40}$/, parent.directory + ': missing source identity');
  const failed = new Set((m.failures ?? []).map(f => key(f.scenario, f.room)));
  const knownErrors = (m.failures ?? []).flatMap(f => f.errors ?? []).map(e => JSON.stringify(e));
  for (const error of m.errors ?? []) assert(knownErrors.includes(JSON.stringify(error)), 'Unattributed parent error');
  if (m.fatalError) assert(failed.size, 'Unattributed fatal parent failure');
  for (const room of rooms) for (const scenario of expectedScenarios) {
    const id = key(scenario, room.id);
    if (failed.has(id)) continue;
    const shots = m.shots.filter(s => s.scenario === scenario && s.room === room.id).sort((a, b) => (a.frame ?? 0) - (b.frame ?? 0));
    if (!shots.length) continue;
    const frames = scenario === 'room-tour' ? [1, 2, 3, 4, 5] : scenario === 'g6-kiting' ? [1, 2, 3, 4] : [null];
    assert.deepEqual(shots.map(s => s.frame), frames, id + ': incomplete guarded scenario');
    for (const shot of shots) {
      assert.match(shot.file, /^[\w.-]+\.png$/);
      assert.deepEqual(shot.errors ?? [], []);
      const e = shot.evidence;
      assert.equal(e.state, 'playing'); assert.equal(e.phase, 'combat'); assert.equal(e.templateId, room.id);
      assert.deepEqual(e.hudOverlaps, []); assertPlayingMarine(e, m.viewport, id);
      assertNativeWarning(e, id, {quiet: scenario !== 'g6-kiting'});
      if (scenario === 'room-tour') {
        assertRoomTour(e, shot.frame - 1, id);
        assert.deepEqual(e.e9RoomTourProof.marks, E9_ROOM_TOURS[room.id]);
      } else if (scenario === 'combat-calm') assert.equal(e.enemies, 0);
      else {
        const p = e.l8FixtureProof;
        assert(p, id + ': missing authored G6 receipt');
        assert.deepEqual(p.arena, room.arena); assert.equal(p.cameraOverride, false);
        assert.equal(p.minimumSpreadActors, 10); assert(p.actors.length >= 10);
        assert.equal(new Set(p.actors.map(a => a.family)).size, 5);
        assert(p.grenadeThrown && p.shotsAfter > p.shotsBefore && e.stats.shotsFired >= p.shotsAfter);
      }
    }
    if (scenario === 'g6-kiting') {
      assert(shots.some(s => s.evidence.playerBullets > 0), id + ': no real projectile');
      assert(shots.some(s => s.evidence.muzzle > 0), id + ': no real muzzle feedback');
    }
    selected.set(id, {parent, shots});
  }
}
for (const room of rooms) {
  const parent=selected.get(key('room-tour',room.id))?.parent;
  for (const scenario of expectedScenarios) {
    const source=selected.get(key(scenario,room.id));
    assert(source, 'No complete source for ' + key(scenario, room.id));
    // A targeted room correction may supersede that room's complete capture
    // set. Keep its tour/calm/combat on one bundle; retain exact source receipts
    // for other, visually unchanged rooms rather than relabelling their PNGs.
    assert.deepEqual(source.parent.manifest.appAssets,parent.manifest.appAssets,room.id+': mixed room bundles');
    assert.equal(source.parent.manifest.distSnapshot?.sourceSHA??source.parent.manifest.gitSHA,
      parent.manifest.distSnapshot?.sourceSHA??parent.manifest.gitSHA,room.id+': mixed room sources');
  }
}

for (const directory of ['', 'native', 'review480', 'before', 'parents']) await mkdir(resolve(output, directory), {recursive: true});
for (const [index, parent] of parents.entries()) {
  await writeFile(resolve(output, 'parents', 'capture-' + (index + 1) + '.json'), JSON.stringify(parent, null, 2) + '\n');
}
const calmSheet = canvas(2400, Math.ceil(rooms.length / 5) * 294);
const kitingSheet = canvas(2400, Math.ceil(rooms.length / 5) * 294);
const comparison = canvas(960, rooms.length * 294);
const standard = canvas(2880, rooms.length * 294);
const rows = [], receipts = [];
const residentialBytes = await readFile(resolve(history, 'combat-calm-residential-gallery.png'));
const residential = review480(decode(residentialBytes));
await writeFile(resolve(output, 'before', 'combat-calm-residential-gallery.png'), residentialBytes);
for (const [roomIndex, room] of rooms.entries()) {
  const tour = selected.get(key('room-tour', room.id)), tourSheet = canvas(2400, 294), files = [];
  const all = expectedScenarios.flatMap(scenario => selected.get(key(scenario, room.id)).shots.map(shot => ({scenario, shot, parent: selected.get(key(scenario, room.id)).parent})));
  const smallImages = new Map();
  for (const {scenario, shot, parent} of all) {
    const original = resolve(parent.directory, shot.file), bytes = await readFile(original), image = decode(bytes);
    assert.equal(image.width, 1920); assert.equal(image.height, 1080);
    const small = review480(image), native = resolve(output, 'native', shot.file);
    await copyFile(original, native, constants.COPYFILE_FICLONE);
    await writeFile(resolve(output, 'review480', shot.file), encode(small));
    smallImages.set(shot.file, small); files.push(shot.file);
    receipts.push({scenario, room: room.id, file: shot.file, source: original, native, sha256: hash(bytes), sourceSHA:parent.manifest.distSnapshot?.sourceSHA??parent.manifest.gitSHA,parentManifestSHA256: parent.manifestSHA256});
  }
  for (const shot of tour.shots) {
    const x = (shot.frame - 1) * 480, label = shot.evidence.e9RoomTourProof.mark.label;
    drawText(tourSheet, room.id + ' / ' + label, x + 5, 5, undefined, 1);
    drawImage(tourSheet, smallImages.get(shot.file), x, 24, 480, 270);
    drawText(standard, label, x + 485, roomIndex * 294 + 5, undefined, 1);
    drawImage(standard, smallImages.get(shot.file), x + 480, roomIndex * 294 + 24, 480, 270);
  }
  await writeFile(resolve(output, 'tour-' + room.id + '.png'), encode(tourSheet));
  drawText(standard, 'L8 RESIDENTIAL REFERENCE', 5, roomIndex * 294 + 5, undefined, 1);
  drawImage(standard, residential, 0, roomIndex * 294 + 24, 480, 270);
  const calm = tourOnly ? tour.shots[0] : selected.get(key('combat-calm', room.id)).shots[0];
  const oldPath = resolve(history, 'combat-calm-' + room.id + '.png'), oldBytes = await readFile(oldPath), oldSmall = review480(decode(oldBytes));
  await writeFile(resolve(output, 'before', 'combat-calm-' + room.id + '.png'), oldBytes);
  drawText(comparison, room.id + ' / L8', 5, roomIndex * 294 + 5, undefined, 1);
  drawText(comparison, room.id + ' / E9', 485, roomIndex * 294 + 5, undefined, 1);
  drawImage(comparison, oldSmall, 0, roomIndex * 294 + 24, 480, 270);
  drawImage(comparison, smallImages.get(calm.file), 480, roomIndex * 294 + 24, 480, 270);
  const sx = roomIndex % 5 * 480, sy = Math.floor(roomIndex / 5) * 294;
  drawText(calmSheet, room.id, sx + 5, sy + 5, undefined, 1);
  drawImage(calmSheet, smallImages.get(calm.file), sx, sy + 24, 480, 270);
  if (!tourOnly) {
    const fight = selected.get(key('g6-kiting', room.id)).shots[1];
    drawText(kitingSheet, room.id, sx + 5, sy + 5, undefined, 1);
    drawImage(kitingSheet, smallImages.get(fight.file), sx, sy + 24, 480, 270);
  }
  rows.push({...room,sourceSHA:tour.parent.manifest.distSnapshot?.sourceSHA??tour.parent.manifest.gitSHA,appAssets:tour.parent.manifest.appAssets,tour: 'tour-' + room.id + '.png', files, before: oldPath, beforeSHA256: hash(oldBytes),
    metrics: all.map(({scenario, shot}) => ({scenario, frame: shot.frame, ...shot.performance, preparation: shot.evidence.preparation, programs: shot.evidence.renderPrograms, interior: shot.evidence.e9InteriorProof}))});
}
await writeFile(resolve(output, 'twenty-calm.png'), encode(calmSheet));
if (!tourOnly) await writeFile(resolve(output, 'twenty-kiting.png'), encode(kitingSheet));
await writeFile(resolve(output, 'twenty-before-after.png'), encode(comparison));
await writeFile(resolve(output, 'residential-standard-comparison.png'), encode(standard));
const report = {sourceSHA, builds:parents.filter(p=>!p.rejectedOnly).map(p=>({sourceSHA:p.manifest.distSnapshot?.sourceSHA??p.manifest.gitSHA,appAssets:p.manifest.appAssets})),
  method: 'Original guarded native PNG bytes; exact pixel-area480x270 reduction. Source SHA and application bundle are recorded per room; every room uses one complete source for tour/calm/combat. Five-position tours freeze simulation and settle the native camera for120 presentation ticks. G6 is staged native movement/fire, not hardware FPS or a campaign.',
  parents: parents.map(p => ({directory: p.directory, manifestSHA256: p.manifestSHA256, rejectedOnly: p.rejectedOnly, fatalError: p.manifest.fatalError, failures: p.manifest.failures, errors: p.manifest.errors})), rooms: rows, receipts};
await writeFile(resolve(output, 'gallery.json'), JSON.stringify(report, null, 2) + '\n');
await writeFile(resolve(output, 'index.html'), `<!doctype html><meta charset="utf-8"><title>E9 room interiors</title><style>body{background:#10171c;color:#dce9e8;font:16px system-ui;margin:24px}img{max-width:100%;height:auto}a{color:#9cd6dc}.room{margin:32px 0}</style><h1>E9 / room interiors</h1><p>${escape(sourceSHA)}. ${escape(report.method)}</p><p><a href="gallery.json">Source receipts and per-room draw/triangle metrics</a></p><a href="twenty-calm.png"><img src="twenty-calm.png"></a>${tourOnly ? '' : '<h2>Staged native kiting</h2><a href="twenty-kiting.png"><img src="twenty-kiting.png"></a>'}<h2>L8 / E9</h2><a href="twenty-before-after.png"><img src="twenty-before-after.png"></a>${rows.map(room => `<section class="room"><h2>${escape(room.name)}</h2><a href="${room.tour}"><img src="${room.tour}"></a><p>${room.files.map(file => `<a href="native/${file}">${escape(file)}</a>`).join(' · ')}</p></section>`).join('')}`);
console.log(`E9 gallery: ${rows.length} rooms, ${receipts.length} complete guarded native PNGs; ${output}`);
