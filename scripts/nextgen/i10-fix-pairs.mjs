#!/usr/bin/env node
/** File-only review pairs; source clocks/cameras and failed evidence stay explicit. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {canvas,decode,encode,drawImage,drawText} from './g2-png.mjs';
const base=resolve('artifacts/nextgen'),out=resolve(base,'i10');await mkdir(out,{recursive:true});
const pairs=[
 ['URGENT CONTACT / SAME NATIVE FIXTURE','i10-round1/c6-kiting-containment-annulus-04.png','i10-round2/c6-kiting-containment-annulus-04.png','Joint framing retains hero floor; compare saved matrices, not timing.'],
 ['FROZEN / CHILLED ANATOMY','i10-round1/v6-open-whiteout-containment-annulus-containment-annulus-04.png','i10-final-focused/v6-open-whiteout-containment-annulus-containment-annulus-04.png','Same native ultimate; camera correction also integrated.'],
 ['OVERCLOCK / SAME PHASE','i10-round1/v6-open-overclock-containment-annulus-containment-annulus-04.png','i10-final-focused/v6-open-overclock-containment-annulus-containment-annulus-04.png','Existing stamp feathered and echo scanned; generic silhouette remains.'],
 ['DETACHED DEPTH / MATCHED CAMERA COHORT','i10-round1/v2-flashfire-containment-annulus-containment-annulus-04.png','i10-soft-depth/v2-flashfire-containment-annulus-containment-annulus-04.png','Existing draws/pools; new depth blit, no opaque redraw.'],
 ['QUEEN / EXPLICITLY DIFFERENT LEGAL VIEWING MARKS','i10-round1/g2-queen-exposed-reactor-vault-04.png','i10-round2/g2-queen-exposed-reactor-vault-04.png','Native exposure; closer legal side mark is staging, not a matched camera claim.'],
 ['ENTERING BODY / LOST THEN RETAINED BEARING','i10-round3-retry/i9-remote-stalker-swarm-junction-failure.png','i10-final-focused/i9-remote-stalker-swarm-junction-04.png','Failed original phase retained; public-body projection now owns warning suppression.'],
];
const sheet=canvas(1920,pairs.length*586),receipts=[];
for(let n=0;n<pairs.length;n++){
 const [title,before,after,note]=pairs[n];drawText(sheet,title,12,n*586+8,undefined,2);drawText(sheet,note,12,n*586+32,undefined,1);
 const sources=[];
 for(const [column,path]of [before,after].entries()){
  const file=resolve(base,path),bytes=await readFile(file),image=decode(bytes);drawImage(sheet,image,column*960,n*586+46,960,540);
  sources.push({file,sha256:createHash('sha256').update(bytes).digest('hex'),native:{width:image.width,height:image.height},display:{width:960,height:540}});
 }
 receipts.push({title,note,sources});
}
await writeFile(resolve(out,'fix-pairs.png'),encode(sheet));await writeFile(resolve(out,'fix-pairs.json'),JSON.stringify({note:'Image pairs are visual evidence, not hardware comparisons; originals remain unchanged.',pairs:receipts},null,2)+'\n');
console.log(resolve(out,'fix-pairs.png'));
