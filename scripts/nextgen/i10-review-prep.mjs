#!/usr/bin/env node
/** File-only exact area review preparation and explicit actual-open witness recording. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {canvas,decode,encode} from './g2-png.mjs';
const [command,batch,...files]=process.argv.slice(2);
assert(['prepare','witness','bridge'].includes(command)&&batch,'Usage: i10-review-prep.mjs prepare|witness <batch-dir> [explicitly-opened-files...] OR bridge <new-batch> <actually-opened-old-batch>');
const root=resolve(batch),out=resolve('artifacts/nextgen/i10/license-review',basename(root));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');await mkdir(resolve(out,'480'),{recursive:true});
function reduce(source){
 const width=480,height=270,horizontal=new Float64Array(width*source.height*3),sxScale=source.width/width,syScale=source.height/height;
 for(let y=0;y<source.height;y++)for(let x=0;x<width;x++){
  const a=x*sxScale,b=(x+1)*sxScale,target=(y*width+x)*3;
  for(let sx=Math.floor(a);sx<Math.ceil(b);sx++){const weight=Math.min(b,sx+1)-Math.max(a,sx),offset=(y*source.width+Math.min(source.width-1,sx))*source.channels;for(let c=0;c<3;c++)horizontal[target+c]+=source.pixels[offset+c]*weight/sxScale;}
 }
 const result=canvas(width,height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const a=y*syScale,b=(y+1)*syScale,target=(y*width+x)*3;let red=0,green=0,blue=0;
  for(let sy=Math.floor(a);sy<Math.ceil(b);sy++){const weight=Math.min(b,sy+1)-Math.max(a,sy),offset=(Math.min(source.height-1,sy)*width+x)*3;red+=horizontal[offset]*weight/syScale;green+=horizontal[offset+1]*weight/syScale;blue+=horizontal[offset+2]*weight/syScale;}
  result.pixels[target]=Math.round(red);result.pixels[target+1]=Math.round(green);result.pixels[target+2]=Math.round(blue);
 }
 return result;
}
if(command==='prepare'){
 const manifest=JSON.parse(await readFile(resolve(root,'manifest.json'))),rows=[];
 for(const shot of manifest.shots){const source=resolve(root,shot.file),bytes=await readFile(source),image=decode(bytes),small=encode(reduce(image)),reduction=resolve(out,'480',shot.file);await writeFile(reduction,small);rows.push({file:shot.file,source,sourceSHA256:hash(bytes),width:image.width,height:image.height,reduction,reductionSHA256:hash(small),captureSourceSHA:manifest.distSnapshot?.sourceSHA??null,appAssets:manifest.appAssets??null});}
 await writeFile(resolve(out,'prepared.json'),JSON.stringify({note:'Prepared images only; no looked/reviewed claim. Actual-open witnesses are explicit separate records.',batch:root,at:new Date().toISOString(),rows},null,2)+'\n');console.log(`${rows.length} exact480 derivatives: ${out}`);
}else if(command==='bridge'){
 assert(files.length===1,'Bridge requires exactly one historical batch with actual-open witnesses');
 const priorOut=resolve('artifacts/nextgen/i10/license-review',basename(resolve(files[0])));
 const prior=JSON.parse(await readFile(resolve(priorOut,'actual-opens.json'))),prepared=JSON.parse(await readFile(resolve(out,'prepared.json')));
 let ledger;try{ledger=JSON.parse(await readFile(resolve(out,'actual-opens.json')));}catch(error){if(error.code!=='ENOENT')throw error;ledger={reviewer:'/root/license_audit',rows:[]};}
 const carried=[],needFresh=[];
 for(const row of prepared.rows){
  const witness=prior.rows.find(old=>old.file===row.file);
  if(!witness){needFresh.push(row.file);continue;}
  assert.equal(hash(await readFile(witness.source)),witness.sourceSHA256,'Historical original changed after actual open');
  assert.equal(hash(await readFile(witness.reduction)),witness.reductionSHA256,'Historical reduction changed after actual open');
  assert.equal(hash(await readFile(row.source)),row.sourceSHA256,'New original changed after preparation');
  assert.equal(hash(await readFile(row.reduction)),row.reductionSHA256,'New reduction changed after preparation');
  if(row.sourceSHA256!==witness.sourceSHA256||row.reductionSHA256!==witness.reductionSHA256){needFresh.push(row.file);continue;}
  const receipt={...row,bridgedAt:new Date().toISOString(),nativeWitness:'Byte-identical bridge to an actual original-detail native open',reductionWitness:'Byte-identical bridge to an actual original-detail exact480 open',priorActualOpen:witness};
  ledger.rows.push(receipt);carried.push(row.file);
 }
 await writeFile(resolve(out,'actual-opens.json'),JSON.stringify(ledger,null,2)+'\n');
 await writeFile(resolve(out,'bridge-history.json'),JSON.stringify({historical:resolve(files[0]),newBatch:root,at:new Date().toISOString(),carried,needFresh,note:'Every carried original and exact480 derivative was independently rehashed against an explicit historical actual-open witness. NeedFresh files have no review claim from this bridge.'},null,2)+'\n');
 console.log(JSON.stringify({carried,needFresh}));
}else{
 assert(files.length>0,'Name each PNG actually opened at native and480 before recording a witness');
 const prepared=JSON.parse(await readFile(resolve(out,'prepared.json')));let ledger;try{ledger=JSON.parse(await readFile(resolve(out,'actual-opens.json')));}catch(error){if(error.code!=='ENOENT')throw error;ledger={reviewer:'/root/license_audit',rows:[]};}
 for(const file of files){const row=prepared.rows.find(row=>row.file===file);assert(row,`Not prepared: ${file}`);assert.equal(hash(await readFile(row.source)),row.sourceSHA256,'Native bytes changed after open');assert.equal(hash(await readFile(row.reduction)),row.reductionSHA256,'Reduction bytes changed after open');ledger.rows.push({...row,openedAt:new Date().toISOString(),nativeWitness:'Actual original-detail view_image open',reductionWitness:'Actual original-detail view_image open, exact480 area reduction'});}
 await writeFile(resolve(out,'actual-opens.json'),JSON.stringify(ledger,null,2)+'\n');console.log(`${files.length} explicit native+480 witnesses appended`);
}
