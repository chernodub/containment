#!/usr/bin/env node
/** Serialize immutable three-size production captures and exact area reductions. */
import {execFileSync} from 'node:child_process';
import {cp,mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {decode,encode,canvas} from './g2-png.mjs';
const round=process.argv[2];
if(!/^[1-6]$/.test(round??''))throw Error('Use u7-review.mjs <round1..6>');
const root=resolve('artifacts/nextgen/u7'), snapshot=resolve(root,`r${round}-dist`);
await mkdir(root,{recursive:true});
await mkdir(snapshot); // Refuse to overwrite a previous critique's immutable build.
execFileSync('npm',['run','build'],{stdio:'inherit'});
await cp('dist',snapshot,{recursive:true});
for(const source of ['src/ui/screens/title/keyArt.ts','src/ui/screens/endingTransmission.ts'])await cp(source,resolve(root,`r${round}-${source.split('/').at(-1)}`));
for(const [width,height] of [[1920,1080],[1280,720],[2560,1080]]) {
 const label=`u7-round${round}-${width}`,dir=resolve('artifacts/nextgen',label);
 execFileSync('node',['scripts/nextgen/capture.mjs',`--label=${label}`,'--scenarios=title,complete-fixture','--scaffold',`--width=${width}`,`--height=${height}`,`--dist=${snapshot}`,'--dist-source-sha='+execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()+'-u7-round'+round],{stdio:'inherit'});
 const manifest=JSON.parse(await readFile(resolve(dir,'manifest.json'),'utf8'));
 await mkdir(resolve(dir,'review480'),{recursive:true});
 for(const file of manifest.shots.flatMap(shot=>[shot.file,...(shot.evidence.scaffoldFile?[shot.evidence.scaffoldFile]:[])])) {
  const src=decode(await readFile(resolve(dir,file))),thumb=canvas(480,270);
  for(let y=0;y<270;y++)for(let x=0;x<480;x++){
   const x0=Math.floor(x*src.width/480),x1=Math.floor((x+1)*src.width/480),y0=Math.floor(y*src.height/270),y1=Math.floor((y+1)*src.height/270);
   for(let c=0;c<3;c++){let sum=0;for(let sy=y0;sy<y1;sy++)for(let sx=x0;sx<x1;sx++)sum+=src.pixels[(sy*src.width+sx)*src.channels+c];thumb.pixels[(y*480+x)*3+c]=Math.round(sum/((x1-x0)*(y1-y0)));}
  }
  await writeFile(resolve(dir,'review480',file),encode(thumb));
 }
 console.log(`ROUND ${round}: ${width}x${height} native + 480x270 + scaffold ready for review from one frozen dist`);
}
