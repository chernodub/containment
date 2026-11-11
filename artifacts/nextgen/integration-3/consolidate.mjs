// Reassemble only successful evidence, retaining exact per-batch provenance and failed attempts.
import assert from 'node:assert/strict';
import {readFile, writeFile, copyFile, mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {DEFAULT_ROOMS} from '../../../scripts/nextgen/scenarios.mjs';
import {stitchPngFrames} from '../../../scripts/nextgen/sprites.mjs';
const base=resolve('artifacts/nextgen'),out=resolve(base,'integration-3');
const read=async label=>JSON.parse(await readFile(resolve(base,label,'manifest.json'),'utf8'));
const primary=await read('integration-3-attempt1'),kiting=await read('integration-3-kiting-final');
assert.deepEqual(primary.errors,[]);assert.deepEqual(kiting.errors,[]);assert.deepEqual(kiting.failures,[]);
assert.deepEqual(primary.failures.map(f=>`${f.scenario}:${f.room}`).sort(),['combat-kiting:communal-atrium','combat-kiting:containment-annulus']);
assert.deepEqual(primary.viewport,kiting.viewport);assert.equal(primary.renderer,kiting.renderer);
assert.equal(primary.hardwareAccelerated,true);assert.equal(kiting.hardwareAccelerated,true);
assert.deepEqual(primary.fontFallbacks,[]);assert.deepEqual(kiting.fontFallbacks,[]);
// Only harness/docs/tests changed after the primary application was captured.
const applicationDiff=execFileSync('git',['diff','--name-only',`${primary.gitSHA}..${kiting.gitSHA}`,'--','src','public','index.html','package.json','package-lock.json','vite.config.ts','tsconfig.json','scripts/nextgen/debug.ts'],{encoding:'utf8'}).trim();
assert.equal(applicationDiff,'','Capture segments must use identical production application source/assets');
assert.equal(kiting.shots.length,40);assert.equal(kiting.sprites.length,10);
for(const room of DEFAULT_ROOMS){
 const shots=kiting.shots.filter(s=>s.scenario==='combat-kiting'&&s.room===room);
 assert.equal(shots.length,4);assert.deepEqual(shots.map(s=>s.frame),[1,2,3,4]);
 for(const shot of shots){assert.equal(shot.evidence.state,'playing');assert(shot.evidence.visibleEnemies>=12);assert(shot.staging.staged>=18);assert.deepEqual(shot.evidence.hudOverlaps,[]);assert.deepEqual(shot.errors,[]);}
}
const provenance=(items,label,sha)=>items.map(item=>({...item,sourceCapture:label,sourceSHA:sha}));
const shots=[...provenance(primary.shots.filter(s=>s.scenario!=='combat-kiting'),'integration-3-attempt1',primary.gitSHA),...provenance(kiting.shots,'integration-3-kiting-final',kiting.gitSHA)];
const sprites=[...provenance(primary.sprites.filter(s=>s.scenario!=='combat-kiting'),'integration-3-attempt1',primary.gitSHA),...provenance(kiting.sprites,'integration-3-kiting-final',kiting.gitSHA)];
assert.equal(shots.length,153);assert.equal(sprites.length,33);
assert.equal(new Set([...shots,...sprites].map(s=>s.file)).size,shots.length+sprites.length);
await mkdir(out,{recursive:true});
for(const shot of [...shots,...sprites])await copyFile(resolve(base,shot.sourceCapture,shot.file),resolve(out,shot.file));
const segments=[{label:primary.label,directory:'integration-3-attempt1',gitSHA:primary.gitSHA,retainedFrames:113,retainedSprites:23,runtimeSeconds:primary.runtimeSeconds},{label:kiting.label,directory:'integration-3-kiting-final',gitSHA:kiting.gitSHA,retainedFrames:40,retainedSprites:10,runtimeSeconds:kiting.runtimeSeconds}];
const manifest={...primary,label:'integration-3',gitSHA:kiting.gitSHA,applicationSHA:primary.gitSHA,consolidated:true,shots,sprites,failures:[],errors:[],segments,
 priorAttempts:['integration-3-attempt1','integration-3-kiting','integration-3-lanes','integration-3-kiting-attempt3'],
 note:'Successful production evidence from two explicitly recorded batches with identical application source/assets. All ten kiting rooms are replaced by the final 40-frame batch; original failed attempts remain intact. Per-item sourceCapture/sourceSHA are retained. Fixed-step captures are not a performance certification.',
 runtimeSeconds:segments.reduce((sum,s)=>sum+s.runtimeSeconds,0)};
await writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
await writeFile(resolve(out,'provenance.json'),JSON.stringify({applicationDiff,segments,priorAttempts:manifest.priorAttempts,assertions:'Identical app source/assets; zero source page errors; only known superseded fixture failures; final ten rooms × four frames, >=18 legal threats and >=12 visible per frame; native movement/fire/ability checks already passed the runner.'},null,2)+'\n');
const contact=async(name,items)=>{const buffers=await Promise.all(items.map(s=>readFile(resolve(out,s.file))));await writeFile(resolve(out,name),stitchPngFrames(buffers,480).png);};
await contact('review-kiting-contact.png',DEFAULT_ROOMS.map(room=>sprites.find(s=>s.scenario==='combat-kiting'&&s.room===room)));
await contact('review-abilities-contact.png',sprites.filter(s=>s.scenario.startsWith('ability:')&&s.scenario!=='ability:desktop-input'));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const cards=[];
for(const shot of [...sprites,...shots])cards.push(`<figure><img loading="lazy" src="data:image/png;base64,${(await readFile(resolve(out,shot.file))).toString('base64')}" alt="${esc(shot.file)}"><figcaption>${esc(shot.file)}<small>${esc(shot.sourceCapture)} · ${shot.sourceSHA.slice(0,7)}</small></figcaption></figure>`);
await writeFile(resolve(out,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><title>Containment / integration-3</title><style>body{margin:0;background:#0c1015;color:#dbe7ee;font:15px system-ui}header{padding:24px}p{max-width:1100px;line-height:1.5}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(440px,1fr));gap:18px;padding:24px}figure{margin:0;background:#17202a;border:1px solid #34404c}img{display:block;width:100%;height:auto}figcaption{padding:12px}small{display:block;color:#a1b6c0;margin-top:6px}</style><header><h1>Containment / integration-3</h1><p>${esc(manifest.note)}</p><p>${shots.length} verified frames · ${sprites.length} sprite sheets · ${esc(manifest.renderer)} · ${manifest.viewport.width}×${manifest.viewport.height}</p></header><main class="grid">${cards.join('')}</main></html>`);
await writeFile(resolve(out,'pngs.txt'),[...shots,...sprites].map(s=>resolve(out,s.file)).join('\n')+'\n');
console.log(`Consolidated ${shots.length} successful frames / ${sprites.length} sheets, all ten environments, identical application source; failed attempts preserved.`);
