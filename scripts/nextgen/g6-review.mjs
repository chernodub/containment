/** PNG-only construction critique: native grayscale, exact area thumbnails and labeled identity sheets. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {decode,encode,canvas,drawText,drawImage} from './g2-png.mjs';
const dir=resolve(process.argv[2]),manifest=JSON.parse(await readFile(resolve(dir,'manifest.json'),'utf8'));
const grayDir=resolve(dir,'grayscale'),smallDir=resolve(dir,'review480');await mkdir(grayDir,{recursive:true});await mkdir(smallDir,{recursive:true});
const entries=[];
for(const shot of manifest.shots){
 const src=decode(await readFile(resolve(dir,shot.file))),gray=canvas(src.width,src.height),small=canvas(480,270),smallGray=canvas(480,270);
 for(let y=0;y<src.height;y++)for(let x=0;x<src.width;x++){const k=(y*src.width+x)*3,n=Math.round(src.luma(x,y));gray.pixels[k]=gray.pixels[k+1]=gray.pixels[k+2]=n;}
 for(let y=0;y<270;y++)for(let x=0;x<480;x++){
  const x0=Math.floor(x*src.width/480),x1=Math.floor((x+1)*src.width/480),y0=Math.floor(y*src.height/270),y1=Math.floor((y+1)*src.height/270);
  for(let c=0;c<3;c++){let sum=0;for(let sy=y0;sy<y1;sy++)for(let sx=x0;sx<x1;sx++)sum+=src.pixels[(sy*src.width+sx)*src.channels+c];small.pixels[(y*480+x)*3+c]=Math.round(sum/((x1-x0)*(y1-y0)));}
  const k=(y*480+x)*3,n=Math.round(small.pixels[k]*.2126+small.pixels[k+1]*.7152+small.pixels[k+2]*.0722);smallGray.pixels[k]=smallGray.pixels[k+1]=smallGray.pixels[k+2]=n;
 }
 await writeFile(resolve(grayDir,shot.file),encode(gray));await writeFile(resolve(smallDir,shot.file),encode(small));await writeFile(resolve(grayDir,'480-'+shot.file),encode(smallGray));
 if(!shot.frame||shot.frame===2)entries.push({shot,small,smallGray});
}
for(const kind of ['calm','kiting']){
 const selected=entries.filter(e=>kind==='calm'?!e.shot.frame:!!e.shot.frame);
 const sheet=canvas(1440,Math.max(1,Math.ceil(selected.length/3))*296);
 selected.forEach((e,i)=>{const x=i%3*480,y=Math.floor(i/3)*296;drawText(sheet,e.shot.file,x+4,y+5,undefined,1);drawImage(sheet,e.smallGray,x,y+24,480,270);});
 await writeFile(resolve(dir,`${kind}-grayscale-identity.png`),encode(sheet));
}
const sheet=canvas(1440,Math.max(1,Math.ceil(entries.length/3))*296);entries.forEach((e,i)=>{const x=i%3*480,y=Math.floor(i/3)*296;drawText(sheet,e.shot.file,x+4,y+5,undefined,1);drawImage(sheet,e.small,x,y+24,480,270);});await writeFile(resolve(dir,'critique.png'),encode(sheet));
console.log(`${manifest.shots.length} native/480 grayscale frames; ${entries.length} identity entries; ${dir}`);
