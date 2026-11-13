#!/usr/bin/env node
/** Read-only native crops and exact area-reduced design evidence; never launches a browser. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,basename} from 'node:path';
import {decode,encode,canvas,drawImage,drawText} from './g2-png.mjs';
const root=resolve(process.argv[2]);
const manifest=JSON.parse(await readFile(resolve(root,'manifest.json'),'utf8'));
const out=resolve(root,'review');await mkdir(out,{recursive:true});
function crop(image,x,y,w,h){const result=canvas(w,h);for(let py=0;py<h;py++)for(let px=0;px<w;px++){const sx=Math.max(0,Math.min(image.width-1,x+px)),sy=Math.max(0,Math.min(image.height-1,y+py));for(let c=0;c<3;c++)result.pixels[(py*w+px)*3+c]=image.pixels[(sy*image.width+sx)*image.channels+c];}return result;}
function area(source,w=480,h=270){const image=canvas(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++)for(let c=0;c<3;c++){let sum=0,count=0;for(let sy=Math.floor(y*source.height/h);sy<Math.floor((y+1)*source.height/h);sy++)for(let sx=Math.floor(x*source.width/w);sx<Math.floor((x+1)*source.width/w);sx++){sum+=source.pixels[(sy*source.width+sx)*source.channels+c];count++;}image.pixels[(y*w+x)*3+c]=Math.round(sum/count);}return image;}
const groups=new Map();
for(const shot of manifest.shots){
 const image=decode(await readFile(resolve(root,shot.file)));await writeFile(resolve(out,'480-'+shot.file),encode(area(image)));
 const proof=shot.evidence?.g5Proof;if(!proof?.projected)continue;
 const key=shot.file.replace(/-\d\d.png$/,'.png');if(!groups.has(key))groups.set(key,[]);groups.get(key).push({shot,image,proof});
}
for(const [key,frames]of groups){
 const actorCount=frames[0].proof.projected.length;
 const sheet=canvas(320*frames.length,290*Math.min(3,actorCount));
 for(let f=0;f<frames.length;f++)for(let actor=0;actor<Math.min(3,actorCount);actor++){
  const {image,proof}=frames[f],p=proof.projected[actor],native=crop(image,Math.round(p.x)-160,Math.round(p.y)-135,320,260);
  drawImage(sheet,native,f*320,actor*290,320,260);drawText(sheet,p.name+' F'+(f+1),f*320+8,actor*290+268,undefined,1);
 }
 await writeFile(resolve(out,'native-'+key),encode(sheet));
 for(let actor=0;actor<actorCount;actor++){
  const strip=canvas(320*frames.length,290),label=frames[0].proof.projected[actor].name;
  for(let f=0;f<frames.length;f++){const{image,proof}=frames[f],p=proof.projected[actor];drawImage(strip,crop(image,Math.round(p.x)-160,Math.round(p.y)-135,320,260),f*320,0,320,260);drawText(strip,label+' F'+(f+1),f*320+8,268,undefined,1);}
  await writeFile(resolve(out,'native-'+key.replace('.png','')+'-'+label+'-'+actor+'.png'),encode(strip));
 }

}
const thumbs=manifest.shots.filter(s=>/-04.png$/.test(s.file)||!/-\d\d.png$/.test(s.file));
const board=canvas(480*3,300*Math.ceil(thumbs.length/3));for(let i=0;i<thumbs.length;i++){drawImage(board,decode(await readFile(resolve(out,'480-'+thumbs[i].file))),i%3*480,Math.floor(i/3)*300,480,270);drawText(board,thumbs[i].file.slice(0,64),i%3*480+5,Math.floor(i/3)*300+278,undefined,1);}await writeFile(resolve(out,'review-board.png'),encode(board));
console.log(`${basename(root)}: ${manifest.shots.length} 480 frames, ${groups.size} native motion sheets`);

// Identity-derived masks contain actual visible actor pixels and preserve native scale.
for(const shot of manifest.shots.filter(s=>s.evidence?.g5Proof?.masks)){
 const masks=shot.evidence.g5Proof.masks,full=canvas(masks.width,masks.height);full.pixels.fill(255);
 for(const actor of masks.actors)for(const [x,y,length]of actor.spans)for(let px=x;px<x+length;px++)for(let c=0;c<3;c++)full.pixels[(y*full.width+px)*3+c]=0;
 const stem=shot.file.replace('.png','');await writeFile(resolve(out,stem+'-black-native.png'),encode(full));await writeFile(resolve(out,stem+'-black480.png'),encode(area(full)));
 if(!/-04.png$/.test(shot.file))continue;
 const families=['crawler','spitter','brute','carrier','stalker'],sheet=canvas(1920,1080);sheet.pixels.fill(255);drawText(sheet,'G5 ACTUAL ACTOR SILHOUETTES - NATIVE COMBAT SCALE',28,22,[0,0,0],2);
 for(let family=0;family<families.length;family++){
  const actors=masks.actors.filter(a=>a.name===families[family]);
  for(let rank=0;rank<actors.length;rank++){
   const actor=actors[rank];if(!actor.spans.length)continue;
   const x0=Math.min(...actor.spans.map(s=>s[0])),x1=Math.max(...actor.spans.map(s=>s[0]+s[2])),y0=Math.min(...actor.spans.map(s=>s[1])),y1=Math.max(...actor.spans.map(s=>s[1]));
   const tile=canvas(x1-x0+8,y1-y0+9);tile.pixels.fill(255);
   for(const[x,y,length]of actor.spans)for(let px=x;px<x+length;px++)for(let c=0;c<3;c++)tile.pixels[((y-y0+4)*tile.width+px-x0+4)*3+c]=0;
   const x=family*384+Math.round((384-tile.width)/2),y=100+rank*300+Math.round((240-tile.height)/2);drawImage(sheet,tile,x,y,tile.width,tile.height);
   drawText(sheet,families[family]+' '+(actor.champion??(actor.elite?'ELITE':'NORMAL')),family*384+22,100+rank*300+252,[0,0,0],2);
   await writeFile(resolve(out,`${stem}-${families[family]}-${rank}-native.png`),encode(tile));
  }
 }
 await writeFile(resolve(out,stem+'-silhouette-sheet-native.png'),encode(sheet));await writeFile(resolve(out,stem+'-silhouette-sheet480.png'),encode(area(sheet)));
}

// Native crowd crops are copied 1:1 around the actual projected marine bounds.
const motion=new Map();for(const shot of manifest.shots.filter(s=>/combat-kiting|g5-body-only/.test(s.file))){const key=shot.file.replace(/-\d\d.png$/,'.png');if(!motion.has(key))motion.set(key,[]);motion.get(key).push(shot);}
for(const[key,shots]of motion){const sheet=canvas(600*shots.length,430);for(let i=0;i<shots.length;i++){const shot=shots[i],bounds=shot.evidence.marineBounds;const x=Math.round((bounds.left+bounds.right)/2)-300,y=Math.round((bounds.top+bounds.bottom)/2)-200;const source=decode(await readFile(resolve(root,shot.file))),native=crop(source,x,y,600,400);drawImage(sheet,native,i*600,0,600,400);drawText(sheet,'FRAME '+(i+1)+' NATIVE PIXELS',i*600+8,408,undefined,1);await writeFile(resolve(out,'crop-'+shot.file),encode(native));}await writeFile(resolve(out,'motion-'+key),encode(sheet));}
const queenPhases=['boss-reactor-vault-01.png','x2-queen-opening-high-reactor-vault-04.png','g2-queen-exposed-reactor-vault-04.png','x2-queen-closing-high-reactor-vault-04.png'];
if(queenPhases.every(file=>manifest.shots.some(s=>s.file===file))){
 const native=canvas(700*4,680),thumbs=canvas(480*4,300),receipt=[];
 for(let i=0;i<queenPhases.length;i++){const file=queenPhases[i],shot=manifest.shots.find(s=>s.file===file),source=decode(await readFile(resolve(root,file)));const p=shot.evidence.queenProjected??{x:900,y:485};const x=Math.round(p.x)-350,y=Math.round(p.y)-325;drawImage(native,crop(source,x,y,700,650),i*700,0,700,650);drawText(native,shot.evidence.queenPhase+' '+shot.evidence.elapsed.toFixed(2)+'S',i*700+8,660,undefined,2);drawImage(thumbs,area(source),i*480,0,480,270);drawText(thumbs,shot.evidence.queenPhase,i*480+8,278,undefined,1);receipt.push({file,phase:shot.evidence.queenPhase,elapsed:shot.evidence.elapsed,nativeCrop:{x,y,width:700,height:650}});}
 await writeFile(resolve(out,'queen-phases-native.png'),encode(native));await writeFile(resolve(out,'queen-phases480.png'),encode(thumbs));await writeFile(resolve(out,'queen-phases.json'),JSON.stringify(receipt,null,2));
}
