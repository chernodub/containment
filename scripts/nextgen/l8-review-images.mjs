import {canvas} from './g2-png.mjs';
/** Same I11 pixel-area average in sRGB PNG code values; no normalization. */
export function review480(source,width=480,height=270){
 const horizontal=new Float64Array(width*source.height*3),xs=source.width/width,ys=source.height/height;
 for(let y=0;y<source.height;y++)for(let x=0;x<width;x++){
  const a=x*xs,b=(x+1)*xs,target=(y*width+x)*3;
  for(let sx=Math.floor(a);sx<Math.ceil(b);sx++){const weight=(Math.min(b,sx+1)-Math.max(a,sx))/xs,offset=(y*source.width+Math.min(source.width-1,sx))*source.channels;for(let c=0;c<3;c++)horizontal[target+c]+=source.pixels[offset+c]*weight;}
 }
 const result=canvas(width,height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const a=y*ys,b=(y+1)*ys,target=(y*width+x)*3,sums=[0,0,0];
  for(let sy=Math.floor(a);sy<Math.ceil(b);sy++){const weight=(Math.min(b,sy+1)-Math.max(a,sy))/ys,offset=(Math.min(source.height-1,sy)*width+x)*3;for(let c=0;c<3;c++)sums[c]+=horizontal[offset+c]*weight;}
  for(let c=0;c<3;c++)result.pixels[target+c]=Math.round(sums[c]);
 }
 return result;
}
/** I11 Rec.709-weighted sRGB code-value grayscale (not radiometric luminance). */
export function grayscale(source){
 const result=canvas(source.width,source.height);
 for(let i=0;i<source.width*source.height;i++){const s=i*source.channels,n=Math.round(source.pixels[s]*.2126+source.pixels[s+1]*.7152+source.pixels[s+2]*.0722);result.pixels.fill(n,i*3,i*3+3);}
 return result;
}
