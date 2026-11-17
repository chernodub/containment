#!/usr/bin/env node
/** Offline P11 evidence gallery; links native sources, writes only HTML/thumbnails.
 * node tools/assets/p11-set-pieces/gallery.mjs <final-capture-dir> [--out=...] [--before=...] [--beauty=...]
 * --beauties-only refreshes the twenty-hero contact sheet without reading captures.
 * No server/browser, capture mutation, intermediate copying, or acceptance gates.
 */
import {readFile,writeFile,mkdir,readdir,access,stat} from 'node:fs/promises';
import {resolve,relative,sep} from 'node:path';
import {canvas,decode,encode,drawImage,drawText} from '../../../scripts/nextgen/g2-png.mjs';
import {review480} from '../../../scripts/nextgen/l8-review-images.mjs';
const args=process.argv.slice(2), option=(name,fallback)=>args.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3)??fallback;
const out=resolve(option('out','artifacts/nextgen/p11-final'));
const before=resolve(option('before',resolve(out,'before'))), beauty=resolve(option('beauty',resolve(out,'beauty')));
const captureArg=args.find(a=>!a.startsWith('--')), beautiesOnly=args.includes('--beauties-only');
if(!captureArg&&!beautiesOnly)throw Error('Supply the final capture directory, or --beauties-only.');
const rooms=[
 ['awakening-bay','Awakening Bay','awakening-berth-array'],
 ['passenger-vault','Passenger Vault','passenger-sleeper-carrier'],
 ['residential-gallery','Residential Gallery','residential-common-nook'],
 ['communal-atrium','Communal Atrium','atrium-conservatory'],
 ['crew-checkpoint','Crew Checkpoint','checkpoint-scanner-gate'],
 ['armory','Armory','armory-weapon-carousel'],
 ['freight-hold','Freight Hold','freight-suspension-gantry'],
 ['breached-loading-bay','Breached Loading Bay','loading-wedged-pod'],
 ['relay-racks','Relay Racks','relay-monolith-spine'],
 ['transmission-chamber','Transmission Chamber','uplink-tracking-dish'],
 ['diagnostic-gallery','Diagnostic Gallery','specimen-probe-cradle'],
 ['safety-interlock-station','Safety Interlock Station','key-cylinder-interlock'],
 ['coolant-plant','Coolant Plant','frost-manifold-turbines'],
 ['service-shaft-landing','Service Shaft Landing','lift-winch-machinery'],
 ['infested-workshop','Infested Workshop','engulfed-milling-machine'],
 ['swarm-junction','Swarm Junction','ruptured-brood-plenum'],
 ['shielding-gate','Shielding Gate','shield-field-emitter'],
 ['containment-annulus','Containment Annulus','containment-ring-cradle'],
 ['manual-control-chamber','Manual Control Chamber','manual-authorisation-dais'],
 ['overload-floor','Overload Floor','reactor-crown'],
];
const incidentBoards={
 'crew-checkpoint':['checkpoint-failed-barrier'],
 'relay-racks':['failed-relay-patch'],
 'service-shaft-landing':['abandoned-winch-repair'],
 'shielding-gate':['failed-shield-leaves'],
 'containment-annulus':['strained-containment-diaphragm'],
 'infested-workshop':['consuming-workstation-mantle'],
 'swarm-junction':['brood-stronghold-wall'],
};
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const href=path=>relative(out,path).split(sep).map(encodeURIComponent).join('/');
const exists=async path=>{try{await access(path);return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}};
const locate=async(dir,file)=>{for(const path of [resolve(dir,file),resolve(dir,'native',file)])if(await exists(path))return path;return null;};
const thumbDir=resolve(out,'review480','gallery');await mkdir(thumbDir,{recursive:true});
const missing=[];
async function beautySource(name){
 const candidates=[];
 for(const suffix of ['-hero.png','.png','-game.png']){
  const path=resolve(beauty,name+suffix);
  if(await exists(path))candidates.push({path,time:(await stat(path)).mtimeMs});
 }
 return candidates.sort((a,b)=>b.time-a.time)[0]?.path??null;
}
async function thumbnail(source,name){
 const image=decode(await readFile(source)),scale=Math.min(480/image.width,270/image.height);
 const width=Math.round(image.width*scale),height=Math.round(image.height*scale),small=review480(image,width,height),framed=canvas(480,270);
 drawImage(framed,small,Math.floor((480-width)/2),Math.floor((270-height)/2),width,height);
 const path=resolve(thumbDir,name+'.png');await writeFile(path,encode(framed));return {path,image:framed};
}
const contact=canvas(1920,294*5),heroCards=new Map();
for(let i=0;i<rooms.length;i++){
 const [id,title,hero]=rooms[i];const source=await beautySource(hero);
 const x=(i%4)*480,y=Math.floor(i/4)*294;drawText(contact,title,x+6,y+6,undefined,1);
 if(source){const small=await thumbnail(source,'beauty-'+id);drawImage(contact,small.image,x,y+24,480,270);heroCards.set(id,{source,thumb:small.path});}
 else {missing.push('Beauty: '+id);drawText(contact,'BEAUTY NOT AVAILABLE',x+6,y+80,undefined,1);}
}
await writeFile(resolve(out,'all-heroes-480.png'),encode(contact));
if(beautiesOnly){console.log(`Wrote ${resolve(out,'all-heroes-480.png')}; ${missing.length} missing beauties.`);}
else {
 const capture=resolve(captureArg),manifestPath=resolve(capture,'manifest.json');
 const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
 const card=(label,source,thumb)=>source?`<figure><figcaption>${esc(label)} · <a href="${href(source)}">native PNG</a></figcaption><a href="${href(source)}"><img width="480" height="270" loading="lazy" src="${href(thumb)}" alt="${esc(label)}"></a></figure>`:`<div class="missing">${esc(label)} unavailable</div>`;
 let sections='';
 for(const [id,title]of rooms){
  let pairs='';
  for(const [scenario,frame]of [...Array.from({length:5},(_,i)=>['room-tour',i+1]),['g6-kiting',2]]){
   const shot=manifest.shots?.find(s=>s.room===id&&s.scenario===scenario&&Number(s.frame)===frame);
   const filename=`${scenario}-${id}-${String(frame).padStart(2,'0')}.png`;
   const after=shot?await locate(capture,shot.file):null,old=await locate(before,filename);
   const label=scenario==='room-tour'?`Tour ${frame}${shot?.evidence?.e9RoomTourProof?.mark?.label?' · '+shot.evidence.e9RoomTourProof.mark.label:''}`:'20-enemy kiting fixture · frame 02';
   if(!after)missing.push(`${id}: ${scenario} ${frame}`);
   if(!old)missing.push(`E10: ${id}: ${scenario} ${frame}`);
   const a=after?await thumbnail(after,'after-'+filename.slice(0,-4)):null,b=old?await thumbnail(old,'before-'+filename.slice(0,-4)):null;
   pairs+=`<h3>${esc(label)}</h3><div class="pair">${card('E10 · '+title,old,b?.path)}${card('P11 · '+title,after,a?.path)}</div>`;
  }
  const hero=heroCards.get(id);
  let incidentCards='';
  for(const name of incidentBoards[id]??[]){
   const source=await beautySource(name);
   if(source){const small=await thumbnail(source,'incident-'+name);incidentCards+=card('Incident · '+name,source,small.path);}
   else {missing.push('Incident beauty: '+name);incidentCards+=card('Incident · '+name,null,null);}
  }
  sections+=`<section id="${id}"><h2>${esc(title)}</h2>${hero?`<p><a href="${href(hero.source)}">Set-piece beauty · native PNG</a></p>`:''}${incidentCards?`<h3>Incident sculpture</h3><div class="pair">${incidentCards}</div>`:''}${pairs}<p><a href="#top">Back to room list</a></p></section>`;
 }
 const beauties=(await readdir(beauty)).filter(n=>n.endsWith('.png')&&!n.endsWith('-480.png')).sort();
 const beautyLinks=beauties.map(n=>`<li><a href="${href(resolve(beauty,n))}">${esc(n.slice(0,-4))}</a></li>`).join('');
 const source=manifest.distSnapshot?.sourceSHA??manifest.gitSHA??'unrecorded';
 const notices=[...(manifest.errors??[]).map(e=>'Capture error: '+JSON.stringify(e)),...(manifest.failures??[]).map(e=>'Capture failure: '+JSON.stringify(e)),...missing];
 const evidence=[];
 for(const [file,label] of [['draw-comparison.png','Draw comparison'],['per-room-metrics.json','Per-room metrics'],['verification/p11-final-cryo-continued/index.html','Completed Cryo campaign'],['verification/p11-final-preparation/rooms.json','Room preparation'],['low/i2-low-calm-residential-gallery.png','Residential Low'],['low/i2-low-calm-relay-racks.png','Relay Low'],['low/i2-low-calm-infested-workshop.png','Workshop Low']]) {
  if(await exists(resolve(out,file)))evidence.push(`<a href="${href(resolve(out,file))}">${esc(label)}</a>`);
 }
 const evidenceNav=evidence.length?`<p>${evidence.join(' · ')}</p><p>Benchmark exception: Atrium failed sustained enemy population. Timing is uncertified on the heavily loaded host; see the report for remaining art and budget limitations.</p>`:'';
 const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>P11 · twenty-room craft review</title>
<style>body{margin:0;background:#11181e;color:#d8e2e6;font:16px/1.5 system-ui,sans-serif}main{max-width:1020px;margin:auto;padding:32px}a{color:#9cdae6}h1,h2,h3{line-height:1.2}section{border-top:1px solid #47535a;margin-top:48px;padding-top:16px}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,480px));gap:16px}figure{margin:0}figcaption{font-size:14px;margin:6px 0}img{max-width:100%;height:auto;background:#111;display:block}.rooms,.beauties{columns:2}.notice,.missing{background:#3a3030;padding:12px}.meta{overflow-wrap:anywhere;color:#aabac3}summary{cursor:pointer}code{font-size:13px}</style>
<main id="top"><h1>P11 · twenty-room craft review</h1><p>Five tour positions and kiting frame 02, matched with E10. Thumbnails are exact 480×270; beauty images preserve aspect ratio with letterboxing. Native PNGs remain in their original directories.</p><p class="meta">Source: <code>${esc(source)}</code> · seed ${esc(manifest.seed??'unrecorded')} · viewport ${esc(JSON.stringify(manifest.viewport??{}))} · <a href="${href(manifestPath)}">capture manifest</a></p><p>E10 uses the earlier actor models; P11 uses the merged marine and creature updates. These images show appearance, not timing or GPU performance.</p>${notices.length?`<details class="notice" open><summary>${notices.length} missing items or recorded capture issues</summary><ul>${notices.map(n=>`<li>${esc(n)}</li>`).join('')}</ul></details>`:''}${evidenceNav}<nav><ol class="rooms">${rooms.map(([id,title])=>`<li><a href="#${id}">${esc(title)}</a></li>`).join('')}</ol></nav><p><a href="all-heroes-480.png">Twenty-hero contact sheet · 480×270 per tile</a> · <a href="#beauties">All beauty renders</a></p>${sections}<section id="beauties"><h2>Beauty renders</h2><ul class="beauties">${beautyLinks}</ul></section></main></html>`;
 await writeFile(resolve(out,'index.html'),html);
 console.log(`Wrote ${resolve(out,'index.html')}; ${rooms.length} room sections; ${notices.length} visible notices.`);
}
