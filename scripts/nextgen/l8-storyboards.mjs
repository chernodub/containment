/** File-only L8 storyboards from individually validated native room observations. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {selectStoryboardFrames,blitStoryboardFrame} from './playtest/storyboard.mjs';
import {decode,encode,canvas,drawText} from './g2-png.mjs';
const source=resolve(process.argv[2]),out=resolve(process.argv[3]??'artifacts/nextgen/l8-standard/play');
const report=JSON.parse(await readFile(resolve(source,'report.json'),'utf8'));
assert.deepEqual(report.errors,[]);assert.deepEqual(report.defects,[]);assert.equal(report.assisted,false);assert.equal(report.fastRendering,false);
const hash=b=>createHash('sha256').update(b).digest('hex');
await mkdir(out,{recursive:true});
const receipts=[],selected=(report.storyboards??[report.storyboard]).filter(board=>!process.argv[4]||process.argv[4].split(',').includes(board.room));
for(const board of selected){
 const frames=selectStoryboardFrames(board.frames),dir=resolve(out,board.room);await mkdir(dir,{recursive:true});
 const color=canvas(1920,888),gray=canvas(1920,888);
 for(const [i,f]of frames.entries()){
  const path=resolve(source,f.file),bytes=await readFile(path),native=decode(bytes);assert.equal(native.width,1920);assert.equal(native.height,1080);
  const small=canvas(480,270),mono=canvas(480,270);
  for(let y=0;y<270;y++)for(let x=0;x<480;x++){
   const rgb=[0,0,0];for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++)for(let c=0;c<3;c++)rgb[c]+=native.pixels[((y*4+dy)*1920+x*4+dx)*native.channels+c]/16;
   const n=Math.round(.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]);small.pixels.set(rgb.map(Math.round),(y*480+x)*3);mono.pixels.set([n,n,n],(y*480+x)*3);
  }
  const filename=String(i).padStart(2,'0')+'.png';await copyFile(path,resolve(dir,filename));await writeFile(resolve(dir,'480-'+filename),encode(small));await writeFile(resolve(dir,'gray480-'+filename),encode(mono));
  const x=i%4*480,y=Math.floor(i/4)*296;for(const sheet of [color,gray])drawText(sheet,`${f.beat} ${f.roomSeconds.toFixed(1)}s`,x+5,y+5,undefined,1);
  blitStoryboardFrame(color,small,x,y+24);blitStoryboardFrame(gray,mono,x,y+24);
  receipts.push({room:board.room,...f,source:path,sha256:hash(bytes),native:resolve(dir,filename)});
 }
 await writeFile(resolve(out,board.room+'-storyboard.png'),encode(color));await writeFile(resolve(out,board.room+'-grayscale.png'),encode(gray));
}
await writeFile(resolve(out,'receipts.json'),JSON.stringify({source,reportSHA256:hash(await readFile(resolve(source,'report.json'))),application:report.distributionSourceSHA,assets:report.distributionAssets,method:'Twelve unique native entry/fight/clear observations per room; exact4x4 PNG-code area average, no normalization or retouching.',frames:receipts},null,2)+'\n');
console.log(`${receipts.length} native observations retained across ${selected.length} real clears`);
