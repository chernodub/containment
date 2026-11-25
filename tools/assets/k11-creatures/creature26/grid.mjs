// node grid.mjs out.png cols width img...
import sharp from 'sharp';
const [out,cols,w,...imgs]=process.argv.slice(2);const C=+cols,W=+w;
const meta=await Promise.all(imgs.map(async f=>{const b=await sharp(f).resize(W).png().toBuffer();const m=await sharp(b).metadata();return{b,h:m.height};}));
const H=Math.max(...meta.map(m=>m.h));const rows=Math.ceil(imgs.length/C);
await sharp({create:{width:W*C,height:H*rows,channels:3,background:'#111'}}).composite(meta.map((m,i)=>({input:m.b,left:(i%C)*W,top:Math.floor(i/C)*H}))).png().toFile(out);
