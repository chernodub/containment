import {inflateSync} from 'node:zlib';
import assert from 'node:assert/strict';

// Chromium writes non-interlaced 8-bit RGB/RGBA PNGs. Decode the actual screenshot,
// not DOM colors, without adding a PNG dependency to the game.
export function samplePng(png){
 assert.equal(png.subarray(1,4).toString(),'PNG');
 const width=png.readUInt32BE(16),height=png.readUInt32BE(20),depth=png[24],color=png[25];
 assert(depth===8&&[2,6].includes(color)&&png[28]===0,'Unsupported screenshot PNG format');
 const chunks=[];for(let p=8;p<png.length;){const length=png.readUInt32BE(p);if(png.toString('ascii',p+4,p+8)==='IDAT')chunks.push(png.subarray(p+8,p+8+length));p+=length+12;}
 const raw=inflateSync(Buffer.concat(chunks)),channels=color===6?4:3,stride=width*channels;
 let previous=Buffer.alloc(stride),offset=0,samples=0,lit=0;const colors=new Set();
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<height;y++){
  const filter=raw[offset++],row=Buffer.from(raw.subarray(offset,offset+stride));offset+=stride;
  assert(filter<=4,'Unsupported PNG row filter');
  for(let x=0;x<stride;x++){const a=x>=channels?row[x-channels]:0,b=previous[x],c=x>=channels?previous[x-channels]:0;row[x]=(row[x]+([0,a,b,(a+b)>>1,paeth(a,b,c)][filter]))&255;}
  if(y%13===0)for(let x=0;x<width;x+=13){const p=x*channels,r=row[p],g=row[p+1],b=row[p+2];samples++;if(Math.max(r,g,b)>12)lit++;colors.add((r>>3)*1024+(g>>3)*32+(b>>3));}
  previous=row;
 }
 const result={width,height,samples,litFraction:lit/samples,colors:colors.size};
 assert(result.litFraction>.015&&result.colors>24,`Blank/black screenshot: ${JSON.stringify(result)}`);
 return result;
}
