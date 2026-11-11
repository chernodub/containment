import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {canvas,decode,drawText,drawImage,encode} from './g2-png.mjs';
const final=resolve(process.argv[2]??'artifacts/nextgen/g2-final'),before=resolve('artifacts/nextgen/g2-before'),baseline='/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/baseline';
const rooms=['awakening-bay','passenger-vault','residential-gallery','communal-atrium','crew-checkpoint','armory','freight-hold','breached-loading-bay','relay-racks','transmission-chamber','diagnostic-gallery','safety-interlock-station','coolant-plant','service-shaft-landing','infested-workshop','swarm-junction','shielding-gate','containment-annulus','manual-control-chamber','overload-floor'];
const destination=resolve(final,'comparison');await mkdir(destination,{recursive:true});const sheets=[],provenance=[];
for(let act=0;act<4;act++){
 const sheet=canvas(1536,5*330+48);for(const [i,title]of ['ORIGINAL BASELINE','INTEGRATED BEFORE G2','G2 FINAL HIGH'].entries())drawText(sheet,title,i*512+10,12,undefined,2);
 for(let row=0;row<5;row++){
  const room=rooms[act*5+row],files=[resolve(baseline,`combat-calm-${room}.png`),resolve(before,`g1-exposure-calm-${room}.png`),resolve(final,`g2-calm-high-${room}.png`)];
  for(let col=0;col<3;col++){
   const x=col*512,y=row*330+48;drawText(sheet,room,x+6,y+5,undefined,1);
   try{const image=decode(await readFile(files[col]));drawImage(sheet,image,x+4,y+28,504,284);provenance.push({room,column:col,path:files[col]});}
   catch(error){if(col!==0)throw error;drawText(sheet,'NO HISTORICAL CAPTURE',x+20,y+140,[150,170,182],2);drawText(sheet,'NOT IN THE SUPPLIED BASELINE',x+20,y+165,[150,170,182],1);provenance.push({room,column:col,path:null,note:'Not present in supplied read-only baseline; never substituted from another room.'});}
  }
 }
 const path=resolve(destination,`baseline-before-after-${act+1}.png`);await writeFile(path,encode(sheet));sheets.push(path);
}
await writeFile(resolve(destination,'provenance.json'),JSON.stringify({baseline,originalSHA:JSON.parse(await readFile(resolve(baseline,'manifest.json'),'utf8')).gitSHA,beforeSHA:JSON.parse(await readFile(resolve(before,'manifest.json'),'utf8')).gitSHA,finalSHA:JSON.parse(await readFile(resolve(final,'manifest.json'),'utf8')).gitSHA,entries:provenance},null,2)+'\n');
const images=await Promise.all(sheets.map(async path=>`<img alt="Twenty-room baseline before after comparison" src="data:image/png;base64,${(await readFile(path)).toString('base64')}">`));
await writeFile(resolve(destination,'index.html'),`<!doctype html><html><meta charset="utf-8"><title>G2 / twenty-room comparison</title><style>body{margin:0;background:#10171d;color:#dae8ed;font:16px system-ui}header{padding:24px}img{display:block;width:100%;max-width:1536px;margin:12px auto}</style><header><h1>Containment G2 / twenty story rooms</h1><p>Original baseline · integrated before · G2 final. Missing original captures are explicitly labeled. Images compare presentation, including the deliberate G1 camera change; they do not imply identical framing.</p></header>${images.join('')}</html>`);console.log(sheets.join('\n'));
