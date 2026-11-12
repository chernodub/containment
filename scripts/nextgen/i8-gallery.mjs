#!/usr/bin/env node
/** Reproducible I8 review sheets and three-generation evidence, using actual PNGs. */
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {decode,encode,canvas,drawText} from './g2-png.mjs';
/** Box-area review reduction, followed by an integer RGB copy into the sheet. */
function drawImage(target, source, x, y, width, height) {
  if(source.width===width&&source.height===height) {
    for(let row=0;row<height;row++)for(let column=0;column<width;column++)for(let channel=0;channel<3;channel++)
      target.pixels[((y+row)*target.width+x+column)*3+channel]=source.pixels[(row*width+column)*source.channels+channel];
    return;
  }
  for(let row=0;row<height;row++)for(let column=0;column<width;column++) {
    const x0=Math.floor(column*source.width/width),x1=Math.floor((column+1)*source.width/width);
    const y0=Math.floor(row*source.height/height),y1=Math.floor((row+1)*source.height/height);
    for(let channel=0;channel<3;channel++) {
      let sum=0;
      for(let sy=y0;sy<y1;sy++)for(let sx=x0;sx<x1;sx++)sum+=source.pixels[(sy*source.width+sx)*source.channels+channel];
      target.pixels[((y+row)*target.width+x+column)*3+channel]=Math.round(sum/((x1-x0)*(y1-y0)));
    }
  }
}
const mode=process.argv[2],root=resolve(process.argv[3]??'artifacts/nextgen/final2');
const read=async path=>JSON.parse(await readFile(path,'utf8'));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function png(path){return decode(await readFile(path));}
if(mode==='review'){
 const manifest=await read(resolve(root,'manifest.json'));
 const indexPath=resolve(root,'index.html'),index=await readFile(indexPath,'utf8');await writeFile(indexPath,index.replace('href="compare-baseline.html"',`href="${basename(root)==='final2-720'?'../final2/compare.html':'compare.html'}"`));
 await mkdir(resolve(root,'review-sheets'),{recursive:true});
 for(let start=0;start<manifest.shots.length;start+=40){
  const shots=manifest.shots.slice(start,start+40),sheet=canvas(480*4,294*Math.ceil(shots.length/4));
  for(const [i,s]of shots.entries()){
   const x=i%4*480,y=Math.floor(i/4)*294;
   drawText(sheet,s.file,x+4,y+4,[216,233,238],1);
   drawImage(sheet,await png(resolve(root,'review480',s.file)),x,y+24,480,270);
  }
  await writeFile(resolve(root,'review-sheets',`review-${String(start/40+1).padStart(2,'0')}.png`),encode(sheet));
 }
 console.log(`${manifest.shots.length} actual frames in ${Math.ceil(manifest.shots.length/40)} review sheets`);
}else if(mode==='compare'){
 const originals=resolve('/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/baseline');
 const previous=resolve('/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final');
 const rooms=['awakening-bay','communal-atrium','armory','relay-racks','infested-workshop','containment-annulus','overload-floor'];
 const views=['title','starting-boon','route','results',...rooms.flatMap(r=>[`combat-calm-${r}`,`combat-heavy-${r}-02`]),'combat-calm-reactor-vault','boss-reactor-vault-02'];
 const sources=[{name:'Original baseline',path:originals},{name:'Previous final',path:previous},{name:'I8 final2',path:root}];
 const sheet=canvas(480*3,300*(views.length+1));sources.forEach((s,i)=>drawText(sheet,s.name,i*480+8,10,[216,233,238],2));
 const records=[],rows=[];await mkdir(resolve(root,'comparison-sources'),{recursive:true});
 for(const [row,v]of views.entries()){
  const cells=[];
  for(const [column,s]of sources.entries()){
   const file=v+'.png',actualFile=v==='results'&&column===0?'dead.png':v==='combat-calm-reactor-vault'&&column<2?'boss-reactor-vault-01.png':file,note=actualFile===file?null:v==='results'?'Original gallery has no results capture; its original death screen is shown.':'This historical gallery has no calm boss capture; its original boss arrival frame is shown.',source=resolve(s.path,actualFile),relative=`comparison-sources/${column}-${file}`;let bytes;
   try{bytes=await readFile(source);}catch(error){throw Error(`Required comparison counterpart absent: ${source}`,{cause:error});}
   await writeFile(resolve(root,relative),bytes);
   drawText(sheet,actualFile!==file?v+' (HISTORICAL SUBSTITUTE)':v,column*480+4,(row+1)*300+4,[216,233,238],1);
   drawImage(sheet,decode(bytes),column*480,(row+1)*300+24,480,270);
   records.push({view:v,generation:s.name,source,requestedView:v,actualFile,substitution:note,file:relative,sha256:createHash('sha256').update(bytes).digest('hex')});
   cells.push(`${note?'<p>'+escape(note)+'</p>':''}<a href="${relative}"><img loading="lazy" src="${relative}" alt="${escape(s.name+' '+v)}"></a>`);
  }
  rows.push(`<section><h2>${escape(v)}</h2><div>${cells.join('')}</div></section>`);
 }
 await writeFile(resolve(root,'before-after.png'),encode(sheet));
 await writeFile(resolve(root,'comparison.json'),JSON.stringify({note:'Actual separately staged captures; composition/camera/fixture changes are retained. No hardware timings inferred.',records},null,2));
 await writeFile(resolve(root,'compare.html'),`<!doctype html><meta charset="utf-8"><title>Containment I8: three generations</title><style>body{background:#0b1118;color:#e5edf4;font:15px system-ui;margin:24px}header,section>div{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}img{width:100%;display:block}h2{font-size:17px}section{margin:28px 0}a{color:#bdefff}p{max-width:100ch}</style><h1>Containment: three generations</h1><p>Original baseline → previous final → I8 final2. Each link opens the actual native PNG. These are staged visual comparisons, with authored camera/fixture changes retained; they are not hardware performance evidence. <a href="comparison.json">Provenance and hashes</a> · <a href="before-after.png">Contact sheet</a> · <a href="index.html">Full gallery</a></p><header>${sources.map(s=>`<b>${s.name}</b>`).join('')}</header>${rows.join('')}`);
 console.log(`${views.length} views × 3 real generations: ${root}/compare.html`);
}else if(mode==='showcase'){
 const files=['title.png','starting-boon.png','route.png','x3-results-statistics.png','combat-calm-armory.png','combat-calm-diagnostic-gallery.png','combat-kiting-armory-02.png','combat-kiting-infested-workshop-03.png','i8-families-overload-floor-03.png','g2-queen-exposed-reactor-vault-04.png','v2-full-pyro-containment-annulus-containment-annulus-04.png','v2-full-arc-infested-workshop-infested-workshop-04.png'];
 const sheet=canvas(1440,1176),records=[];
 for(const [i,file] of files.entries()){
  const bytes=await readFile(resolve(root,file));
  records.push({file,source:resolve(root,file),sha256:createHash('sha256').update(bytes).digest('hex')});
  const x=i%3*480,y=Math.floor(i/3)*294;
  drawText(sheet,file,x+4,y+4,[216,233,238],1);
  drawImage(sheet,await png(resolve(root,'review480',file)),x,y+24,480,270);
 }
 await writeFile(resolve(root,'showcase.png'),encode(sheet));
 await writeFile(resolve(root,'showcase.json'),JSON.stringify({records},null,2));
 await writeFile(resolve(root,'showcase.html'),`<!doctype html><meta charset="utf-8"><title>Containment I8 showcase</title><style>body{background:#111820;color:#dce9f0;font:14px system-ui;margin:24px}main{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}img{width:100%}a{color:#bdefff}figure{margin:0}figcaption{padding:8px}</style><h1>Containment I8: twelve selected frames</h1><p><a href="index.html">Full gallery</a> · <a href="compare.html">Three generations</a> · <a href="organic/index.html">Organic campaigns</a></p><main>${files.map(file=>`<figure><a href="${file}"><img src="${file}" alt="${escape(file)}"></a><figcaption>${escape(file)}</figcaption></figure>`).join('')}</main>`);
 const index=resolve(root,'index.html'),html=await readFile(index,'utf8');
 if(!html.includes('href="showcase.html"'))await writeFile(index,html.replace('</h1>','</h1><p><a href="showcase.html">Twelve showcase frames</a> · <a href="organic/index.html">Organic campaigns</a></p>'));
 console.log(`${files.length} selected native frames: ${root}/showcase.html`);
}else if(mode==='organic'){
 const organic=resolve(root,'organic');await mkdir(organic,{recursive:true});const records=[];
 for(const rig of ['breacher','cryo','pyro','arc']){
  const source=resolve(`artifacts/nextgen/playtest/${process.argv[4]??'i8-reviewed-final'}-${rig}-1729`),report=await read(resolve(source,'report.json'));
  for(const file of report.screenshots.filter(f=>/mid\.png$/.test(f))){const target=`${rig}-${basename(file)}`;await copyFile(resolve(source,file),resolve(organic,target));records.push({rig,source:resolve(source,file),file:target,head:report.head,applicationSourceSHA:(await readFile(resolve(report.distributionDirectory,'SOURCE_SHA'),'utf8')).trim()});}
 }
 await writeFile(resolve(organic,'manifest.json'),JSON.stringify({records},null,2));
 await writeFile(resolve(organic,'index.html'),`<!doctype html><meta charset="utf-8"><style>body{background:#111820;color:#dce9f0;font:14px system-ui}main{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}img{width:100%}</style><h1>Organic campaign mid-fight captures</h1><main>${records.map(s=>`<figure><a href="${s.file}"><img loading="lazy" src="${s.file}"></a><figcaption>${escape(s.rig+' '+s.file)}</figcaption></figure>`).join('')}</main>`);
 console.log(`${records.length} organic mid-fight PNGs`);
}else throw Error('Use review | compare | showcase | organic [capture directory]');
