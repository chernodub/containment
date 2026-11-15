/** File-only bridge: receipts establish actual opens; this script never invents visual review. */
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,dirname,basename,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {decode} from './g2-png.mjs';
const root=process.cwd(),hash=b=>createHash('sha256').update(b).digest('hex');
const ledgerPaths=['artifacts/nextgen/i11/parent-review-opens.json','artifacts/nextgen/i11/independent-review/final-opened.json','artifacts/nextgen/i11/gallery-review-opens.json','artifacts/nextgen/i11/odd720-actual-opens.json','artifacts/nextgen/i11/campaign-review-opens.json'];
const ledgers=[],native=new Map(),pages=[],issues=[];
for(const path of ledgerPaths){const bytes=await readFile(path),data=JSON.parse(bytes);ledgers.push({path,bytes,sha256:hash(bytes)});for(const record of data.opens??data.records??[]){
 const p=resolve(record.path),scope=record.scope??record.kind??'',isPage=/\/review480\//.test(p)&&/review-\d+\.png$/.test(p),exact=(/exact/i.test(scope)&&!/nonexact|not an exact|before/i.test(scope))||(path.includes('odd720')&&p.includes('-exact/'));
 if(isPage&&!exact)continue;
 if(!isPage&&!/native/i.test(scope)&&!(path.includes('odd720')&&!p.includes('/review')))continue;
 let b;try{b=await readFile(p);}catch{issues.push({path:p,issue:'opened file missing before archive'});continue;}
 const sha=hash(b);if(sha!==record.sha256){issues.push({path:p,issue:'actual-open hash mismatch',recordSHA256:record.sha256,currentSHA256:sha});continue;}
 const witness={ledger:path,path:relative(root,p),sha256:sha,scope:scope||'explicit original open'};
 if(isPage&&exact){const metadata=resolve(dirname(p),'pages.json');let list;try{list=JSON.parse(await readFile(metadata));}catch{issues.push({path:p,issue:'page metadata missing'});continue;}const page=list.find(x=>x.file===basename(p));if(!page){issues.push({path:p,issue:'page metadata entry missing'});continue;}pages.push({...witness,bytes:b,metadata,metadataBytes:await readFile(metadata),entries:page.entries,image:null});}
 else if([720,1080].includes(b.readUInt32BE(20))){const arr=native.get(sha)??[];arr.push(witness);native.set(sha,arr);}
}}
// Duplicate actual opens remain in their source ledgers; a page needs archiving only once.
const uniquePages=[...new Map(pages.map(p=>[p.sha256,p])).values()];
for(const label of ['final5','final5-720']){
 const gallery=resolve('artifacts/nextgen',label),archive=resolve(gallery,'review-witnesses');await mkdir(resolve(archive,'pages'),{recursive:true});await mkdir(resolve(archive,'metadata'),{recursive:true});await mkdir(resolve(archive,'ledgers'),{recursive:true});
 for(const l of ledgers)await writeFile(resolve(archive,'ledgers',basename(l.path)),l.bytes);
 const manifestBytes=await readFile(resolve(gallery,'manifest.json')),manifest=JSON.parse(manifestBytes);await writeFile(resolve(archive,'gallery-manifest.json'),manifestBytes);
 const frames=[],usedPages=new Map(),sourceManifests=new Map();
 for(const shot of manifest.shots){
  const finalPath=resolve(gallery,shot.file),finalBytes=await readFile(finalPath),sha256=hash(finalBytes),source=shot.evidenceSource;
  let sourceCurrentSHA256=null;try{sourceCurrentSHA256=hash(await readFile(source.original));}catch{}
  const sourceCopyEqual=source?.sha256===sha256&&(sourceCurrentSHA256===null||sourceCurrentSHA256===sha256);
  const witnesses=native.get(sha256)??[],entry={file:shot.file,sha256,source,sourceCurrentSHA256,sourceCopyEqual,nativeStatus:witnesses.length?'actually-opened-identical-native':'unreviewed',nativeWitnesses:witnesses,reductionStatus:'unreviewed',reductionWitness:null};
  if(source?.directory&&!sourceManifests.has(source.directory)){try{const b=await readFile(resolve(source.directory,'manifest.json'));const h=hash(b);await writeFile(resolve(archive,'metadata',h+'.json'),b);sourceManifests.set(source.directory,{sha256:h,archive:'metadata/'+h+'.json'});}catch{sourceManifests.set(source.directory,{missing:true});}}
  const candidates=uniquePages.filter(p=>p.entries.some(e=>e.file===shot.file&&e.nativeSHA256===sha256));
  for(const page of candidates){const cell=page.entries.findIndex(e=>e.file===shot.file&&e.nativeSHA256===sha256),x=cell%3*480,y=Math.floor(cell/3)*296+24;page.image??=decode(page.bytes);let smallBytes;try{smallBytes=await readFile(resolve(gallery,'review480',shot.file));}catch{continue;}const small=decode(smallBytes),pi=page.image;let equal=small.width===480&&small.height===270;
   outer:for(let yy=0;equal&&yy<270;yy++)for(let xx=0;xx<480;xx++)for(let c=0;c<3;c++)if(small.pixels[(yy*480+xx)*small.channels+c]!==pi.pixels[((y+yy)*pi.width+x+xx)*pi.channels+c]){equal=false;break outer;}
   if(!equal)continue;
   const mh=hash(page.metadataBytes);usedPages.set(page.sha256,page);entry.reductionStatus='actually-opened-exact480-page-cell';entry.reductionWitness={ledger:page.ledger,openedPage:page.path,pageSHA256:page.sha256,archivedPage:'pages/'+page.sha256+'.png',metadataSHA256:mh,archivedMetadata:'metadata/'+mh+'.json',cell,bounds:{x,y,width:480,height:270},final480SHA256:hash(smallBytes),pixelEqual:true,comparedRGBChannels:480*270*3};break;
  }
  frames.push(entry);
 }
 for(const p of usedPages.values()){await writeFile(resolve(archive,'pages',p.sha256+'.png'),p.bytes);await writeFile(resolve(archive,'metadata',hash(p.metadataBytes)+'.json'),p.metadataBytes);}
 const summary={frames:frames.length,nativeActuallyOpened:frames.filter(f=>f.nativeWitnesses.length).length,exact480ActuallyOpened:frames.filter(f=>f.reductionWitness).length,bothActuallyOpened:frames.filter(f=>f.nativeWitnesses.length&&f.reductionWitness).length,sourceCopyMismatches:frames.filter(f=>!f.sourceCopyEqual).length,archivedOpenedPages:usedPages.size};
 const receipt={generatedAt:new Date().toISOString(),method:'No visual opens performed by this bridge. Full native identity requires matching actual-open ledger SHA256. Reduced identity requires an actually opened corrected page, matching entry nativeSHA256, and every RGB channel of its cell equal to final480. Missing coverage stays unreviewed; no crop substitutes for full original.',gallery:label,manifestSHA256:hash(manifestBytes),summary,ledgers:ledgers.map(({path,sha256})=>({path,sha256,archive:'ledgers/'+basename(path)})),sourceManifests:[...sourceManifests].map(([directory,proof])=>({directory,...proof})),issues,unreviewed:frames.filter(f=>!f.nativeWitnesses.length||!f.reductionWitness).map(f=>({file:f.file,native:f.nativeStatus,reduction:f.reductionStatus})),frames};
 await writeFile(resolve(archive,'witness-bridge.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({label,...summary,issues:issues.length,receipt:relative(root,resolve(archive,'witness-bridge.json'))}));
}
