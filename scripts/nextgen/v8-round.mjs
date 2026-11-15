#!/usr/bin/env node
/** Serial, unchanged seven-phase fixtures for V8's three small critique rounds. */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {loadavg} from 'node:os';

const option = (name, fallback = '') => process.argv.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const label = option('label'), dist = resolve(option('dist', 'dist'));
const sha = option('dist-source-sha');
assert(/^[\w.-]+$/.test(label)); assert(/^[a-f0-9]{40}$/.test(sha));
const room = option('room', 'containment-annulus');
assert(['containment-annulus', 'infested-workshop'].includes(room));
const abilities = ['seismic-slam','afterburn','flashfire','napalm-charge','meltdown','whiteout','overclock'];
const scenarios = abilities.map(id => `v2-${id}-${room}`);
const out = resolve('artifacts/nextgen', label);
const receipt = {label, room, sha, dist, hostStart: loadavg(), scenarios};
const result = spawnSync('npm', ['run','capture','--',`--label=${label}`,'--burst=7','--sprite-width=1920',
  `--dist=${dist}`,`--dist-source-sha=${sha}`,`--scenarios=${scenarios.join(',')}`], {stdio:'inherit'});
await mkdir(out, {recursive:true});
await writeFile(resolve(out,'round-receipt.json'), JSON.stringify({...receipt, hostEnd:loadavg(), exit:result.status},null,2));
assert.equal(result.status, 0, 'Failed raw evidence retained');
const manifest = JSON.parse(await readFile(resolve(out,'manifest.json')));
assert.equal(manifest.shots.length,49); assert.equal(manifest.sprites.length,7);
assert.deepEqual(manifest.errors,[]); assert.deepEqual(manifest.failures,[]);
for (const args of [['scripts/nextgen/v3-gallery.mjs',out],['scripts/nextgen/v7-contact.mjs',out,resolve('artifacts/nextgen/v8',label)]]) {
  assert.equal(spawnSync(process.execPath,args,{stdio:'inherit'}).status,0);
}
