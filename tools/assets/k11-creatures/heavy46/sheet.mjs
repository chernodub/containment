// node sheet.mjs out.png cols w h files...
import sharp from 'sharp';
const [out,cols,w,h,...files]=process.argv.slice(2);const C=+cols,W=+w,H=+h;
const rows=Math.ceil(files.length/C);
const imgs=await Promise.all(files.map(f=>sharp(f).resize(W,H,{fit:'contain',background:'#101820'}).toBuffer()));
await sharp({create:{width:W*C,height:H*rows,channels:3,background:'#101820'}}).composite(imgs.map((b,i)=>({input:b,left:W*(i%C),top:H*Math.floor(i/C)}))).png().toFile(out);
