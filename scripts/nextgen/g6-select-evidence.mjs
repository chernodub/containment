/** Select unchanged native PNG bytes from complete production captures, retaining every source receipt. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const [baseArg,revisionArg,outArg]=process.argv.slice(2);assert(baseArg&&revisionArg&&outArg,'primary revision output directories required');
const dirs=[resolve(baseArg),resolve(revisionArg)],out=resolve(outArg);assert(!dirs.includes(out),'Output must be separate');
const captures=await Promise.all(dirs.map(async dir=>({dir,manifest:JSON.parse(await readFile(resolve(dir,'manifest.json'),'utf8'))})));
for(const {manifest:m} of captures){assert.equal(m.errors.length,0);assert.equal(m.failures.length,0);}
const [a,b]=captures.map(c=>c.manifest);for(const key of ['viewport','deviceScaleFactor','seed','hudInsets','burstStepMs'])assert.deepEqual(a[key],b[key],`Capture contract differs: ${key}`);
const selected=new Map(),sprites=new Map();
for(const {dir,manifest:m} of captures){for(const shot of m.shots){const prior=selected.get(shot.file);if(prior){for(const key of ['scenario','room','frame','simulationMs','presentationMs'])assert.equal(prior.shot[key],shot[key],`Mismatched ${key}: ${shot.file}`);}selected.set(shot.file,{dir,shot});}for(const sprite of m.sprites)sprites.set(sprite.file,{dir,sprite});}
await mkdir(out,{recursive:true});const receipts=[],shots=[];
for(const {dir,shot} of selected.values()){const original=resolve(dir,shot.file),bytes=await readFile(original),sha256=createHash('sha256').update(bytes).digest('hex');await copyFile(original,resolve(out,shot.file));const source={original,sha256,capture:dir};shots.push({...shot,evidenceSource:source});receipts.push({file:shot.file,...source});}
for(const {dir,sprite} of sprites.values())await copyFile(resolve(dir,sprite.file),resolve(out,sprite.file));
const manifest={...a,label:out.split('/').at(-1),gitSHA:b.gitSHA,distSnapshot:{selection:true,sources:captures.map(c=>({directory:c.dir,gitSHA:c.manifest.gitSHA,dist:c.manifest.distSnapshot})),note:'Copied original native PNG bytes; no rendered pixels modified. Affected final rooms supersede matching primary frames. This is an evidence selection, not a third browser run.'},shots,sprites:[...sprites.values()].map(s=>s.sprite),runtimeSeconds:null};
await writeFile(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');await writeFile(resolve(out,'source-receipts.json'),JSON.stringify(receipts,null,2)+'\n');console.log(`${shots.length} byte-exact native frames selected; ${out}`);
