import {readFile,writeFile,readdir,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {decode,canvas,drawText,drawImage,encode} from './g2-png.mjs';

// Analyze actual screenshots in the same sRGB Rec.709 domain as the G1 review.

function stats(values){if(!values.length)return null;values.sort((a,b)=>a-b);const q=f=>Math.round(values[Math.min(values.length-1,Math.floor(values.length*f))]*10)/10;const bins=Array(16).fill(0);for(const n of values)bins[Math.min(15,Math.floor(n/16))]++;return{samples:values.length,mean:Math.round(values.reduce((a,b)=>a+b,0)/values.length*10)/10,p5:q(.05),median:q(.5),p95:q(.95),bins};}
function transform(m,x,y,z){const w=m[3]*x+m[7]*y+m[11]*z+m[15];return[(m[0]*x+m[4]*y+m[8]*z+m[12])/w,(m[1]*x+m[5]*y+m[9]*z+m[13])/w,(m[2]*x+m[6]*y+m[10]*z+m[14])/w];}
function inside(polygon,x,y){let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
function supported(projection,x,y,width,height){
 if(!projection)return true;const nx=x/width*2-1,ny=1-y/height*2;
 const a=transform(projection.world,...transform(projection.inverseProjection,nx,ny,-1)),b=transform(projection.world,...transform(projection.inverseProjection,nx,ny,1));const t=-a[1]/(b[1]-a[1]);
 return t>=0&&inside(projection.boundary,(a[0]+(b[0]-a[0])*t)*32,(a[2]+(b[2]-a[2])*t)*32);
}
const dir=resolve(process.argv[2]??'artifacts/nextgen/g2-final'),manifest=JSON.parse(await readFile(resolve(dir,'manifest.json'),'utf8'));
const report=[];for(const shot of manifest.shots){const png=decode(await readFile(resolve(dir,shot.file))),all=[],masked=[];
 for(let y=Math.ceil(png.height*.2);y<png.height*.8;y+=4)for(let x=Math.ceil(png.width*.15);x<png.width*.85;x+=4){const n=png.luma(x,y);all.push(n);if(supported(shot.evidence.playfieldProjection,x,y,png.width,png.height))masked.push(n);}
 const local=(shot.evidence.marineLocalSamples??[]).map(([x,y])=>png.luma(x,y));report.push({file:shot.file,room:shot.room,scenario:shot.scenario,roi:stats(masked),unmasked:stats(all),local:stats(local),performance:shot.evidence.kitingProof?.performance??shot.performance});
}
await writeFile(resolve(dir,'luminance.json'),JSON.stringify({method:'sRGB Rec.709; ROI x15–85%,y20–80%; grid4px; actual-boundary mask via inverse camera; local legal samples within3m',shots:report},null,2)+'\n');
const groups=new Map();for(const shot of manifest.shots){if(shot.frame&&shot.frame!==2)continue;const name=shot.scenario;const list=groups.get(name)??[];list.push(shot);groups.set(name,list);}
const out=resolve(dir,'review');await mkdir(out,{recursive:true});const sheets=[];
for(const [name,shots]of groups)for(let i=0;i<shots.length;i+=10){
 const entries=shots.slice(i,i+10),sheet=canvas(1280,Math.ceil(entries.length/2)*400);
 for(let n=0;n<entries.length;n++){const shot=entries[n],r=report.find(r=>r.file===shot.file),x=(n%2)*640,y=Math.floor(n/2)*400;
  drawText(sheet,shot.file.replace('.png',''),x+6,y+4,undefined,1);
  drawText(sheet,`P5 ${r.roi?.p5} MED ${r.roi?.median} P95 ${r.roi?.p95} LOCAL ${r.local?.median??0}`,x+6,y+18,[148,184,198],1);
  drawImage(sheet,decode(await readFile(resolve(dir,shot.file))),x+4,y+40,632,356);
 }
 const file=resolve(out,`${name}-${i/10+1}.png`);await writeFile(file,encode(sheet));sheets.push(file);
}
await writeFile(resolve(dir,'review-sheets.txt'),sheets.join('\n')+'\n');console.log(`${report.length} screenshots measured; ${sheets.length} review sheets generated`);for(const s of sheets)console.log(s);
