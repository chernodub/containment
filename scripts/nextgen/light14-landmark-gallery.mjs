import {readFile,writeFile,mkdir,copyFile,access} from 'node:fs/promises';
import {canvas,decode,encode,drawImage,drawText} from './g2-png.mjs';
import {relative} from 'node:path';
import {review480,grayscale} from './l8-review-images.mjs';
import {L8_CAPTURE_ROOMS} from './l8-capture-data.mjs';
const root=process.argv[2]??'artifacts/nextgen/light14-final/landmark-correction/raw/twenty';
const out='artifacts/nextgen/light14-final/landmark-correction';
const manualRoot=process.argv[3]??'artifacts/nextgen/light14-final/landmark-correction/raw/manual-warm';
const replacements=JSON.parse(await readFile(process.argv[4]??'artifacts/nextgen/light14-final/landmark-correction/twenty-replacements.json'));
await mkdir(out,{recursive:true});
const manifest=JSON.parse(await readFile(`${root}/manifest.json`));
const sources=[];
for(const [name,scenario,suffix] of [['twenty-calm','combat-calm',''],['twenty-kiting','g6-kiting','-02']]){
 const sheet=canvas(2400,1176),grey=canvas(2400,1176);
 for(const [i,room] of L8_CAPTURE_ROOMS.entries()){
  let file=`${scenario}-${room.id}${suffix}.png`,parent=root,note='';
  const replacement=replacements[`${scenario}:${room.id}`];
  if(replacement)({file,parent,note=''}=replacement);
  try{await access(`${parent}/${file}`);}catch(error){
   if(room.id!=='manual-control-chamber'||scenario!=='g6-kiting'||!manualRoot)throw error;
   parent=manualRoot;file='dress13-kiting-manual-control-chamber-01.png';note=' DRESS13-01';
  }
  const im=review480(decode(await readFile(`${parent}/${file}`))),x=i%5*480,y=Math.floor(i/5)*294;
  for(const [target,pixels]of [[sheet,im],[grey,grayscale(im)]]){drawText(target,room.id+note,x+4,y+4,undefined,1);drawImage(target,pixels,x,y+24,480,270);}
  sources.push({sheet:name,room:room.id,parent,file,note});
 }
 await writeFile(`${out}/${name}.png`,encode(sheet));await writeFile(`${out}/${name}-grey.png`,encode(grey));
}
const landmarks=canvas(2400,1176),landmarksGrey=canvas(2400,1176);
const tourMarks={'communal-atrium':'02','freight-hold':'03','coolant-plant':'02','infested-workshop':'02','containment-annulus':'02','manual-control-chamber':'02','overload-floor':'02'};
for(const [i,room]of L8_CAPTURE_ROOMS.entries()){
 const mark=tourMarks[room.id],file=`room-reviews/${room.id}/${mark?'room-tour':'combat-calm'}-${room.id}${mark?'-'+mark:''}.png`,im=review480(decode(await readFile(`${out}/${file}`))),x=i%5*480,y=Math.floor(i/5)*294;
 for(const [target,pixels]of [[landmarks,im],[landmarksGrey,grayscale(im)]]){drawText(target,room.id+(mark?' TOUR'+mark:' ENTRY'),x+4,y+4,undefined,1);drawImage(target,pixels,x,y+24,480,270);}
}
await writeFile(`${out}/twenty-landmarks.png`,encode(landmarks));await writeFile(`${out}/twenty-landmarks-grey.png`,encode(landmarksGrey));
for(const room of L8_CAPTURE_ROOMS){
 const beforeParent=room.id==='overload-floor'?'artifacts/nextgen/light14-final/raw/twenty-overload':'artifacts/nextgen/light14-final/raw/twenty';
 const beforeFile=`${beforeParent}/combat-calm-${room.id}.png`,source=sources.find(s=>s.sheet==='twenty-calm'&&s.room===room.id),afterFile=`${source.parent}/${source.file}`;
 const pair=canvas(960,588);
 for(const [i,file]of [beforeFile,afterFile].entries()){const im=review480(decode(await readFile(file)));drawText(pair,i?'CURRENT LANDMARK CORRECTION':'PREVIOUS LIGHT14 HISTORICAL',4,i*294+4,undefined,1);drawImage(pair,im,0,i*294+24,480,270);drawImage(pair,grayscale(im),480,i*294+24,480,270);}
 const roomRoot=`${out}/room-reviews/${room.id}`;
 await writeFile(`${roomRoot}/before-after.png`,encode(pair));
 const native=(await readFile(`${roomRoot}/index.html`,'utf8')).replace(/<section id="comparison">[\s\S]*?<\/section>/,'');
 const comparison=`<section id="comparison"><h1>${room.id}: previous / current</h1><img src="before-after.png"><p><a href="${relative(roomRoot,beforeFile)}">Native previous calm</a> · <a href="${relative(roomRoot,afterFile)}">Native current calm</a> · <a href="review480.png">Individual calm/tour/heavy review at 480</a></p></section>`;
 await writeFile(`${roomRoot}/index.html`,native.replace('</style>','</style>'+comparison));
}
const parents={};
for(const parent of new Set([root,...sources.map(s=>s.parent)])){const m=JSON.parse(await readFile(`${parent}/manifest.json`));parents[parent]={source:m.gitSHA,errors:m.errors,failures:m.failures};}
await writeFile(`${out}/twenty-source.json`,JSON.stringify({root,source:manifest.gitSHA,parents,sources},null,2));
for(const name of ['twenty-calm','twenty-kiting']){
 try{await access(`${out}/previous-${name}.png`);}catch{await copyFile(`artifacts/nextgen/light14-final/${name}.png`,`${out}/previous-${name}.png`);}
 const before=decode(await readFile(`${out}/previous-${name}.png`));
 await writeFile(`${out}/previous-${name}-grey.png`,encode(grayscale(before)));
 const final7=decode(await readFile(`artifacts/nextgen/light14-final/final7-${name}.png`));
 await writeFile(`${out}/final7-${name}-grey.png`,encode(grayscale(final7)));
}
await writeFile(`${out}/index.html`,'<!doctype html><meta charset="utf-8"><title>LIGHT14 landmark correction</title><style>body{background:#101820;color:#ddd;font:16px system-ui}img{max-width:100%}</style><h1>LIGHT14 landmark correction</h1>'+['twenty-calm','twenty-kiting'].map(n=>`<h2>${n}</h2><img src="${n}.png"><img src="${n}-grey.png"><h3>Previous LIGHT14</h3><img src="previous-${n}.png"><img src="previous-${n}-grey.png"><h3>final7 historical reference</h3><img src="../final7-${n}.png">`).join('')+'<h2>Landmark views: entry or selected tour</h2><img src="twenty-landmarks.png"><img src="twenty-landmarks-grey.png"><p><a href="twenty-source.json">Sources and retained capture failures</a></p>');
try{await access(`${out}/previous-twenty-source.json`);}catch{await copyFile('artifacts/nextgen/light14-final/twenty-source.json',`${out}/previous-twenty-source.json`);}
for(const name of ['twenty-calm','twenty-kiting'])for(const suffix of ['','-grey'])await copyFile(`${out}/${name}${suffix}.png`,`artifacts/nextgen/light14-final/${name}${suffix}.png`);
await copyFile(`${out}/twenty-source.json`,'artifacts/nextgen/light14-final/twenty-source.json');
