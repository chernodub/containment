#!/usr/bin/env node
// HEAVY47 previous | now pairs. node pair.mjs out.png width height previous.png now.png [crop=left,top,w,h]
import sharp from 'sharp';
const [out,w,h,a,b,crop]=process.argv.slice(2);const W=+w,H=+h;
const load=f=>{let s=sharp(f);if(crop){const [left,top,width,height]=crop.split(',').map(Number);s=s.extract({left,top,width,height});}return s.resize(W,H,{fit:'contain',background:'#101820'}).toBuffer();};
const [x,y]=await Promise.all([load(a),load(b)]);
await sharp({create:{width:W*2+8,height:H,channels:3,background:'#f0f0f0'}}).composite([{input:x,left:0,top:0},{input:y,left:W+8,top:0}]).png().toFile(out);
