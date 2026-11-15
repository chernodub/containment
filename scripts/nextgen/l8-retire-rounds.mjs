/** Retire only successful intermediate L8 PNG runs after their contact survives.
 * Failed raw runs are never eligible. Manifests and SHA inventories stay intact. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,readdir,stat,unlink,writeFile} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
const root=resolve('artifacts/nextgen'),out=resolve(root,'l8-standard/retired-rounds.json');
let ledger;try{ledger=JSON.parse(await readFile(out,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;ledger={reason:'User-requested intermediate PNG retirement; one contact retained per round. Guard failures are never eligible.',files:[],manifests:[]};}
let bytes=0;
async function retire(dir,keep=()=>false){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const path=resolve(dir,entry.name);if(entry.isDirectory()){await retire(path,keep);continue;}
  if(!entry.name.endsWith('.png')||keep(path))continue;
  const b=await readFile(path);ledger.files.push({path:relative(root,path),bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});bytes+=b.length;await unlink(path);
 }
}
for(let round=1;round<=7;round++){
 const contact=resolve(root,`l8-standard/round${round}-contact.png`);await stat(contact);
 const dir=resolve(root,`l8-standard-round${round}`),raw=await readFile(resolve(dir,'manifest.json'),'utf8'),manifest=JSON.parse(raw);
 assert.equal(manifest.errors.length,0,`Never retire failed run ${round}`);assert.equal(manifest.failures.length,0,`Never retire failed run ${round}`);assert.equal(manifest.shots.length,15,`Incomplete run ${round}`);
 if(!ledger.manifests.some(m=>m.round===round))ledger.manifests.push({round,path:relative(root,resolve(dir,'manifest.json')),sha256:createHash('sha256').update(raw).digest('hex'),contact:relative(root,contact),source:manifest.distSnapshot?.sourceSHA??manifest.gitSHA});
 await retire(dir);
 await writeFile(resolve(dir,'RETIRED.md'),`Native/derived intermediate PNGs retired after the round contact was preserved. See ../l8-standard/round${round}-contact.png and ../l8-standard/retired-rounds.json. The original successful manifest stays unchanged.\n`);
 const plans=resolve(root,`l8-standard/round${round}-plans`);
 await retire(plans,path=>round===7&&['residential-gallery.png','crew-checkpoint.png','relay-racks.png'].some(name=>path.endsWith('/'+name)));
 if(round===4)await retire(resolve(root,'l8-standard/round4b-plans'));
}
await writeFile(out,JSON.stringify(ledger,null,2)+'\n');console.log(`${ledger.files.length} retired PNG hashes retained; freed ${(bytes/1024/1024).toFixed(1)}MiB this run`);
