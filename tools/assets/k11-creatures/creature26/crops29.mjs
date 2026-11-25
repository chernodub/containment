// CREATURE29: native crops of the same window from several capture folders, rows = folders, columns = frames.
// node crops29.mjs out.png left,top,w,h scale prefix folder1 folder2 ...   (prefix = capture PNG stem without -NN.png)
import sharp from 'sharp';
const [out,box,scale,prefix,...dirs]=process.argv.slice(2);const [l,t,w,h]=box.split(',').map(Number);const S=+scale;
const frames=['01','02','03','04'];const tiles=[];
for(const [r,d] of dirs.entries())for(const [c,f] of frames.entries()){try{tiles.push({input:await sharp(`${d}/${prefix}-${f}.png`).extract({left:l,top:t,width:w,height:h}).resize(Math.round(w*S)).toBuffer(),left:c*Math.round(w*S),top:r*Math.round(h*S)});}catch{}}
await sharp({create:{width:frames.length*Math.round(w*S),height:dirs.length*Math.round(h*S),channels:3,background:'#000'}}).composite(tiles).png().toFile(out);
