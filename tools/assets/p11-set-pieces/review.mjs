import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {decode,encode,canvas,drawImage,drawText} from '../../../scripts/nextgen/g2-png.mjs';
const dir=resolve(process.argv[2]);const m=JSON.parse(await readFile(resolve(dir,'manifest.json')));
const out=resolve(dir,'review480');await mkdir(out,{recursive:true});
function reduce(src){const dst=canvas(480,270);for(let y=0;y<270;y++)for(let x=0;x<480;x++){let x0=Math.floor(x*src.width/480),x1=Math.floor((x+1)*src.width/480),y0=Math.floor(y*src.height/270),y1=Math.floor((y+1)*src.height/270);for(let c=0;c<3;c++){let sum=0;for(let yy=y0;yy<y1;yy++)for(let xx=x0;xx<x1;xx++)sum+=src.pixels[(yy*src.width+xx)*src.channels+c];dst.pixels[(y*480+x)*3+c]=Math.round(sum/((x1-x0)*(y1-y0)));}}return dst;}
for(const room of [...new Set(m.shots.map(s=>s.room))]){
 const shots=m.shots.filter(s=>s.room===room&&(s.scenario==='room-tour'||s.frame===2));const board=canvas(960,Math.ceil(shots.length/2)*294);
 for(let i=0;i<shots.length;i++){const s=shots[i],small=reduce(decode(await readFile(resolve(dir,s.file))));await writeFile(resolve(out,s.file),encode(small));drawText(board,s.scenario+' '+s.frame,i%2*480+6,Math.floor(i/2)*294+6,undefined,1);drawImage(board,small,i%2*480,Math.floor(i/2)*294+24,480,270);}
 await writeFile(resolve(out,room+'.png'),encode(board));
}
const e10=resolve('/Users/chernodub/.t3/worktrees/containment-game/t3-819e67f1/artifacts/nextgen/e10-final/native');
for(const room of [...new Set(m.shots.map(s=>s.room))]){
 const shots=m.shots.filter(s=>s.room===room&&(s.scenario==='room-tour'||s.frame===2));const board=canvas(960,shots.length*294);
 for(let i=0;i<shots.length;i++){
  const s=shots[i];let before;
  try{before=decode(await readFile(resolve(e10,s.file)));}catch{continue;}
  const after=decode(await readFile(resolve(dir,s.file)));
  drawText(board,'E10 '+s.scenario+' '+s.frame,6,i*294+6,undefined,1);drawText(board,'P11 '+s.scenario+' '+s.frame,486,i*294+6,undefined,1);
  drawImage(board,reduce(before),0,i*294+24,480,270);drawImage(board,reduce(after),480,i*294+24,480,270);
 }
 await writeFile(resolve(out,'compare-'+room+'.png'),encode(board));
}
