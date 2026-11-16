// usage: node review.mjs <capture.png> <beauty.png> <out.png> [crop x,y,w,h]
import sharp from 'sharp';
const [cap,beauty,out,crop='560,200,640,440']=process.argv.slice(2);
const [x,y,w,h]=crop.split(',').map(Number);
const a=await sharp(cap).extract({left:x,top:y,width:w,height:h}).toBuffer();
// 40-px-tall creature reduction ~= whole frame at 480x270 crop upscaled nearest x2
const small=await sharp(cap).resize(480,270).toBuffer();
const b=await sharp(await sharp(small).extract({left:Math.round(x/4),top:Math.round(y/4),width:Math.round(w/4),height:Math.round(h/4)}).toBuffer()).resize(Math.round(w/2),Math.round(h/2),{kernel:'nearest'}).toBuffer();
const c=await sharp(beauty).resize(Math.round(w/2),h,{fit:'contain',background:'#1d2228'}).toBuffer();
await sharp({create:{width:w+w/2+Math.round(w/2),height:h,channels:4,background:'#1d2228'}}).composite([{input:a,left:0,top:0},{input:b,left:w,top:0},{input:c,left:w+w/2,top:0}]).png().toFile(out);
