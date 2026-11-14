import {describe,it,expect} from 'vitest';
import {canvas,drawImage} from './g2-png.mjs';

describe('evidence image copies',()=>{
 it('preserves every nonuniform native pixel at contact-sheet offsets for RGB and RGBA sources',()=>{
  for(const channels of [3,4]){
   const source={width:480,height:270,channels,pixels:Buffer.alloc(480*270*channels)};
   for(let i=0;i<source.pixels.length;i++)source.pixels[i]=(i*37+(i>>7))%256;
   const target=canvas(1440,592);
   for(const [x,y]of [[0,24],[480,24],[960,320]]){
    drawImage(target,source,x,y,480,270);
    const expected=Buffer.alloc(480*270*3),actual=Buffer.alloc(expected.length);
    for(let row=0;row<270;row++)for(let column=0;column<480;column++){
     const pixel=row*480+column;
     source.pixels.copy(expected,pixel*3,pixel*channels,pixel*channels+3);
     target.pixels.copy(actual,pixel*3,((y+row)*target.width+x+column)*3,((y+row)*target.width+x+column)*3+3);
    }
    expect(actual.equals(expected)).toBe(true);
   }
  }
 });
 it('retains nearest-neighbor scaling for non-native image sizes',()=>{
  const source={width:3,height:2,channels:3,pixels:Buffer.from([10,11,12,20,21,22,30,31,32,40,41,42,50,51,52,60,61,62])};
  const target=canvas(6,4);drawImage(target,source,0,0,6,4);
  expect([...target.pixels]).toEqual([
   10,11,12,10,11,12,20,21,22,20,21,22,30,31,32,30,31,32,
   10,11,12,10,11,12,20,21,22,20,21,22,30,31,32,30,31,32,
   40,41,42,40,41,42,50,51,52,50,51,52,60,61,62,60,61,62,
   40,41,42,40,41,42,50,51,52,50,51,52,60,61,62,60,61,62,
  ]);
 });
});
