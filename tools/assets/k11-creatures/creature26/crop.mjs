#!/usr/bin/env node
/** CREATURE26: side-by-side crops for before/after review.
 * node crop.mjs --out=sheet.png --box=x,y,w,h [--scale=2] [--grey] img1 img2 ...  (each image cropped to box, laid in a row) */
import sharp from 'sharp';
const arg=(k,f)=>process.argv.find(a=>a.startsWith(`--${k}=`))?.slice(k.length+3)??f;
const files=process.argv.slice(2).filter(a=>!a.startsWith('--'));
const [x,y,w,h]=arg('box','0,0,1920,1080').split(',').map(Number),s=+arg('scale','1'),grey=process.argv.includes('--grey');
const tiles=await Promise.all(files.map(async f=>{let p=sharp(f).extract({left:x,top:y,width:w,height:h});if(grey)p=p.grayscale();return p.resize(Math.round(w*s),Math.round(h*s),{kernel:'nearest'}).png().toBuffer();}));
const W=Math.round(w*s),H=Math.round(h*s);
await sharp({create:{width:(W+6)*tiles.length,height:H,channels:3,background:'#ff00ff'}}).composite(tiles.map((t,i)=>({input:t,left:i*(W+6),top:0}))).png().toFile(arg('out','sheet.png'));
