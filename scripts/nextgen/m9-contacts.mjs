#!/usr/bin/env node
/** Derivative review contacts; original native pixels and hashes stay unchanged. */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {decodePng,encodePng} from './sprites.mjs';
const root=resolve(process.argv[2]),manifest=JSON.parse(await readFile(resolve(root,'manifest.json'),'utf8'));
const font={A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',E:'111100110100111',F:'111100110100100',G:'011100101101011',H:'101101111101101',I:'111010010010111',J:'001001001101010',K:'101101110101101',L:'100100100100111',M:'101111111101101',N:'101111111111101',O:'010101101101010',P:'110101110100100',Q:'010101101111011',R:'110101110101101',S:'011100010001110',T:'111010010010010',U:'101101101101111',V:'101101101101010',W:'101101111111101',X:'101101010101101',Y:'101101010010010',Z:'111001010100111','0':'111101101101111','1':'010110010010111','2':'110001010100111','3':'110001010001110','4':'101101111001001','5':'111100110001110','6':'011100111101111','7':'111001010010010','8':'111101111101111','9':'111101111001110','-':'000000111000000','/':'001001010100100',' ':'000000000000000'};
let pages=0;
for(const subject of new Set(manifest.shots.map(s=>s.subject))){
 const shots=manifest.shots.filter(s=>s.subject===subject);
 for(let start=0;start<shots.length;start+=7){
  const selected=shots.slice(start,start+7),width=Math.max(...selected.map(s=>s.cellWidth))*4,height=selected.reduce((n,s)=>n+s.cellHeight+26,0),pixels=Buffer.alloc(width*height*4);
  for(let i=0;i<pixels.length;i+=4){pixels[i]=17;pixels[i+1]=24;pixels[i+2]=29;pixels[i+3]=255;}
  const dot=(x,y)=>{if(x<width&&y<height){const i=(y*width+x)*4;pixels[i]=230;pixels[i+1]=240;pixels[i+2]=248;}};
  let top=0;
  for(const shot of selected){
   [...`${subject}/${shot.action}`.toUpperCase()].forEach((c,k)=>{const glyph=font[c]??font[' '];for(let y=0;y<5;y++)for(let x=0;x<3;x++)if(glyph[y*3+x]==='1')for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++)dot(6+k*8+x*2+xx,top+7+y*2+yy);});
   const source=decodePng(await readFile(resolve(root,shot.file))),count=shot.clock.length,indices=[0,Math.floor((count-1)/3),Math.floor((count-1)*2/3),count-1];
   for(let n=0;n<4;n++){
    const fromLeft=indices[n]%shot.columns*shot.cellWidth,fromTop=Math.floor(indices[n]/shot.columns)*shot.cellHeight;
    for(let y=0;y<shot.cellHeight;y++){
     const from=((fromTop+y)*source.width+fromLeft)*4,to=((top+26+y)*width+n*shot.cellWidth)*4;
     source.pixels.copy(pixels,to,from,from+shot.cellWidth*4);
    }
   }
   top+=shot.cellHeight+26;
  }
  await writeFile(resolve(root,`${subject}-contact-${Math.floor(start/7)+1}.png`),encodePng({width,height,pixels}));pages++;
 }
}
console.log(`${pages} native4-phase contact pages in ${root}`);
