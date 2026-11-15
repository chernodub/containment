/** User-requested retirement of successful intermediate round8 PNGs only.
 * Parents, complete hashes and two review contacts survive; failed runs refuse. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,readdir,unlink,stat} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {canvas,decode,encode,drawImage,drawText} from './g2-png.mjs';
const base=resolve('artifacts/nextgen'),ledgerPath=resolve(base,'l8-standard/retired-standard8.json');
try{const old=JSON.parse(await readFile(ledgerPath,'utf8'));if(old.complete){console.log('Round8 retirement already complete');process.exit(0);}}catch(e){if(e.code!=='ENOENT')throw e;}
const captureDir=resolve(base,'l8-standard-round8'),nativeDir=resolve(base,'playtest/l8-standard-native-r8'),boardsDir=resolve(base,'l8-standard/play/af368bb');
const captureBytes=await readFile(resolve(captureDir,'manifest.json')),reportBytes=await readFile(resolve(nativeDir,'report.json')),capture=JSON.parse(captureBytes),report=JSON.parse(reportBytes);
assert.deepEqual(capture.errors,[]);assert.deepEqual(capture.failures,[]);assert.equal(capture.shots.length,15);
assert.deepEqual(report.errors,[]);assert.deepEqual(report.defects,[]);assert.equal(report.outcome,'room-limit');assert.equal(report.rooms.length,9);assert(report.rooms.every(r=>r.result==='clear'));assert.equal(report.assisted,false);assert.equal(report.fastRendering,false);
assert.equal(report.head,'af368bb6a598ada67532bf10a3c2aabe1c8fad08');assert.equal(report.distributionSourceSHA,report.head);
await stat(resolve(base,'l8-standard/round8-contact.png'));
const contact=canvas(1920,3*920);
for(const [i,id]of ['residential-gallery','crew-checkpoint','relay-racks'].entries()){
 const source=decode(await readFile(resolve(boardsDir,id+'-storyboard.png')));drawText(contact,`ROUND8 NATIVE ${id} / ${report.head}`,8,i*920+4,undefined,1);drawImage(contact,source,0,i*920+26,1920,888);
}
const contactPath=resolve(base,'l8-standard/native-round8-contact.png');await writeFile(contactPath,encode(contact));
const files=[];async function inventory(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=resolve(dir,e.name);if(e.isDirectory())await inventory(p);else if(e.name.endsWith('.png')){const b=await readFile(p);files.push({path:relative(base,p),bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});}}}
for(const dir of[captureDir,nativeDir,boardsDir])await inventory(dir);
const hash=b=>createHash('sha256').update(b).digest('hex'),ledger={reason:'Successful intermediate review superseded by final round9 standard. Retain contacts, immutable parents and complete PNG hashes; no failed raw run is eligible.',sourceSHA:report.head,captureManifestSHA256:hash(captureBytes),nativeReportSHA256:hash(reportBytes),contact:relative(base,contactPath),contactSHA256:hash(await readFile(contactPath)),files,complete:false};
// Persist the complete inventory before the first deletion.
await writeFile(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
for(const f of files)await unlink(resolve(base,f.path));
for(const dir of[captureDir,nativeDir,boardsDir])await writeFile(resolve(dir,'RETIRED.md'),'Successful intermediate PNGs retired under user disk-discipline instruction. Original reports/manifests remain unchanged. Contacts and SHA inventory: artifacts/nextgen/l8-standard/retired-standard8.json.\n');
ledger.complete=true;await writeFile(ledgerPath,JSON.stringify(ledger,null,2)+'\n');console.log(`${files.length} successful intermediate PNG hashes retained; freed ${(files.reduce((n,f)=>n+f.bytes,0)/1048576).toFixed(1)}MiB`);
