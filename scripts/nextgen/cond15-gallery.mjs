/** Build local review sheets from shipping capture PNGs and the original RUN15 frames. */
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,basename,join} from 'node:path';
import sharp from 'sharp';

const dir=resolve('artifacts/nextgen/cond15'),before=resolve(process.argv[2]??join(dir,'before'));
const manifest=JSON.parse(await readFile(join(dir,'manifest.json')));
await mkdir(join(dir,'before'),{recursive:true});
const figures=[];
const order=[['entry','before'],['entry','atrium'],['entry','cargo'],['active','before'],['active','atrium'],['active','cargo'],['low','atrium'],['heavy','atrium'],['heavy','cargo']];
for(const id of ['coolant','conduit','vent','dark','brood','sealed']){
 const images=[];
 for(const [stage,room] of order){
  const shot=manifest.shots.find(s=>s.scenario===`cond15-${id}-${stage}-${room}`);
  const source=room==='before'?`before/run15-${id}-${stage}-communal-atrium.png`:basename(shot.file);
  if(room==='before'&&before!==join(dir,'before'))await copyFile(join(before,basename(source)),join(dir,source));
  const small=source.replace('.png','-480.png'),i=images.length/2;
  await sharp(join(dir,source)).resize(480,270).toFile(join(dir,small));
  const name=room==='before'?'RUN15 · Atrium':room==='cargo'?'COND15 · Breached Loading Bay':'COND15 · Atrium';
  const label=`${name} · ${stage}`,left=i%3*480,top=Math.floor(i/3)*300;
  const header=Buffer.from(`<svg width="480" height="30"><text x="8" y="21" fill="white" font-size="16" font-family="sans-serif">${label}</text></svg>`);
  images.push({input:header,left,top},{input:join(dir,small),left,top:top+30});
  figures.push(`<figure><a href="${source}"><img width="480" height="270" src="${small}" loading="lazy"></a><figcaption>${id} · ${label}</figcaption></figure>`);
 }
 await sharp({create:{width:1440,height:900,channels:3,background:'#161c22'}}).composite(images).png().toFile(join(dir,id+'-comparison.png'));
}
await writeFile(join(dir,'comparison.html'),'<!doctype html><meta charset=utf-8><title>COND15 condition review</title><style>body{background:#161c22;color:#ddd;font:16px system-ui}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}figure{margin:0}img{width:100%;height:auto}</style><h1>Ship conditions</h1><p>Open a frame at native size.</p><main>'+figures.join('')+'</main>');
