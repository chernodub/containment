/** Screenshot-domain deck values. Legal floor grid, not black exterior or obstacle footprints. */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {decode} from './g2-png.mjs';
const dir=resolve(process.argv[2]),manifest=JSON.parse(await readFile(resolve(dir,'manifest.json'),'utf8'));
const stats=values=>{if(!values.length)return null;values.sort((a,b)=>a-b);const q=p=>Math.round(values[Math.min(values.length-1,Math.floor(values.length*p))]*10)/10;return{n:values.length,p5:q(.05),median:q(.5),p95:q(.95)};};
const shots=[];
for(const shot of manifest.shots){const png=decode(await readFile(resolve(dir,shot.file)));const sample=points=>stats((points??[]).filter(([x,y])=>x>=0&&x<png.width&&y>=0&&y<png.height).map(([x,y])=>png.luma(x,y)));
 shots.push({file:shot.file,room:shot.room,scenario:shot.scenario,frame:shot.frame,deck:sample(shot.evidence.visibleFloorSamples??shot.evidence.playfieldSamples),hero:sample(shot.evidence.visibleHeroFloorSamples??shot.evidence.marineLocalSamples),includingOccluders:sample(shot.evidence.playfieldSamples)});
}
const selected=shots.filter(s=>!s.frame||s.frame===2);
const method='sRGB Rec.709 code values 0–255; 70×70 uniform world grid; canStand radius12 excludes obstacle/void footprints; projected deck y=.04m within canvas x15–85%,y20–80%; hero legal floor within3m. World-mesh raycast excludes occluding surfaces above.085m; PNG samples retain shadows, flush marks, ink and effects. Raw legal-grid histogram including occluders is retained separately. Calm simulation0ms; kiting frame02 same native fixture clocks. No exposure normalization.';
await writeFile(resolve(dir,'deck-luminance.json'),JSON.stringify({method,shots},null,2)+'\n');
const lines=['| Room / scenario | Floor p5 | Floor median | Floor p95 | Hero median | Samples |','|---|---:|---:|---:|---:|---:|',...selected.map(s=>`| ${s.room} / ${s.scenario} | ${s.deck?.p5??'missing'} | ${s.deck?.median??'missing'} | ${s.deck?.p95??'missing'} | ${s.hero?.median??'missing'} | ${s.deck?.n??0} |`)];
await writeFile(resolve(dir,'deck-luminance.md'),method+'\n\n'+lines.join('\n')+'\n');console.log(lines.join('\n'));
if(selected.some(s=>!s.deck||!s.hero))process.exitCode=1;
