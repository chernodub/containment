/** File-only paired480 review. Reads native harness PNGs and preserves their hashes. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {decode,encode,canvas,drawText,drawImage} from './g2-png.mjs';
const option=(key,fallback)=>process.argv.find(a=>a.startsWith(`--${key}=`))?.slice(key.length+3)??fallback;
const before=resolve(option('before','artifacts/nextgen/e6-before-all'));
const after=resolve(option('after','artifacts/nextgen/e6-final'));
const out=resolve(option('out','artifacts/nextgen/e6-final/comparison-final3'));
const rooms=['awakening-bay','passenger-vault','residential-gallery','communal-atrium','crew-checkpoint','armory','freight-hold','breached-loading-bay','relay-racks','transmission-chamber','diagnostic-gallery','safety-interlock-station','coolant-plant','service-shaft-landing','infested-workshop','swarm-junction','shielding-gate','containment-annulus','manual-control-chamber','overload-floor'];
const ledger=[];await mkdir(out,{recursive:true});
function small(src){
 const dst=canvas(480,270);
 for(let y=0;y<270;y++)for(let x=0;x<480;x++)for(let c=0;c<3;c++){
  const x0=Math.floor(x*src.width/480),x1=Math.floor((x+1)*src.width/480),y0=Math.floor(y*src.height/270),y1=Math.floor((y+1)*src.height/270);let sum=0;
  for(let sy=y0;sy<y1;sy++)for(let sx=x0;sx<x1;sx++)sum+=src.pixels[(sy*src.width+sx)*src.channels+c];
  dst.pixels[(y*480+x)*3+c]=Math.round(sum/((x1-x0)*(y1-y0)));
 }
 return dst;
}
for(const scenario of ['combat-calm','combat-kiting'])for(let page=0;page<5;page++){
 const sheet=canvas(960,4*294);
 for(let row=0;row<4;row++)for(let col=0;col<2;col++){
  const room=rooms[page*4+row],file=`${scenario}-${room}${scenario==='combat-kiting'?'-02':''}.png`,path=resolve(col?after:before,file),bytes=await readFile(path),src=decode(bytes);
  drawText(sheet,`${col?'E6 DENSITY':'FINAL3 BASELINE'} / ${room}`,col*480+3,row*294+4,undefined,1);drawImage(sheet,small(src),col*480,row*294+24,480,270);
  ledger.push({room,scenario,kind:col?'e6-density':'baseline',path,sha256:createHash('sha256').update(bytes).digest('hex'),width:src.width,height:src.height,reviewPage:`${scenario}-${page+1}.png`});
 }
 await writeFile(resolve(out,`${scenario}-${page+1}.png`),encode(sheet));
}
await writeFile(resolve(out,'source-ledger.json'),JSON.stringify({method:'Native harness PNGs, exact480x270 area averaging, no normalization or retouching.',before,after,entries:ledger},null,2)+'\n');
console.log(`${ledger.length} source hashes;20 calm and20 kiting pairs; ${out}`);
