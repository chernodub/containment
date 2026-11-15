/** File-only authoring plans; game collision predicates supply the walkable mask. */
import {build} from 'vite';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {canvas,encode,drawText,drawImage} from './g2-png.mjs';
const out=resolve(process.argv[2]??'artifacts/nextgen/l8-standard/plans');
await mkdir(out,{recursive:true});
const entry=resolve(out,'entry.ts');
await writeFile(entry,`export {STORY_ROOM_TEMPLATES as templates} from '${resolve('src/game/roguelike/storyRoomTemplates.ts')}';\nexport {canOccupyExpedition as occupy,hasClearExpeditionShot as sight,createExpeditionGeometry as geometry} from '${resolve('src/game/world/expeditionGeometry.ts')}';\nexport {generateRun} from '${resolve('src/game/roguelike/run.ts')}';`);
await build({configFile:false,publicDir:false,logLevel:'error',build:{ssr:entry,outDir:out,emptyOutDir:false,rollupOptions:{output:{entryFileNames:'plans-runtime.mjs'}}}});
const {templates,occupy,sight,geometry,generateRun}=await import(pathToFileURL(resolve(out,'plans-runtime.mjs')));
const old=process.argv[3]?JSON.parse(await readFile(process.argv[3],'utf8')):templates;
await writeFile(resolve(out,'templates.json'),JSON.stringify(templates,null,2)+'\n');
const U=2,W=600,H=440;
const cache=new WeakMap();
function plan(t){
 if(cache.has(t))return cache.get(t);
 const image=canvas(W,H+44),g=geometry({...generateRun(1729,3).nodes.find(n=>n.templateId===t.id)});
 const templateGeometry={...g,boundary:t.boundary,voids:t.voids,blockers:[...g.boundaryWalls,...t.obstacles]};
 let area=0,clearanceArea=0;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const p={x:x*U+1,y:y*U+1},legal=occupy(templateGeometry,p,0),wide=legal&&occupy(templateGeometry,p,32);
  if(legal)area+=4;if(wide)clearanceArea+=4;
  image.pixels.set(legal?wide?[47,71,77]:[31,45,53]:[12,18,25],((y+44)*W+x)*3);
 }
 const dot=(p,c,r=4)=>{for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)if(x*x+y*y<=r*r){const px=Math.round(p.x/U)+x,py=Math.round(p.y/U)+y+44;if(px>=0&&px<W&&py>=44&&py<H+44)image.pixels.set(c,(py*W+px)*3);}};
 const line=(a,b,c)=>{const steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/U);for(let i=0;i<=steps;i++)dot({x:a.x+(b.x-a.x)*i/steps,y:a.y+(b.y-a.y)*i/steps},c,0);};
 for(const a of [t.spawn,t.exit])for(const b of [...t.breaches,t.exit])if(sight(templateGeometry,a,b))line(a,b,[78,101,95]);
 for(const b of t.breaches)dot(b,[246,100,67],5);dot(t.spawn,[114,235,237],6);dot(t.exit,[244,204,106],6);
 drawText(image,t.id,8,4,[220,232,233],1);drawText(image,`AREA ${area} / R32 ${clearanceArea}`,8,22,[167,191,196],1);
 const result={image,area,clearanceArea};cache.set(t,result);return result;
}
const rows=[];
for(const [i,t]of Object.values(templates).entries()){
 const p=plan(t),b=plan(old[t.id]);await writeFile(resolve(out,t.id+'.png'),encode(p.image));rows.push({id:t.id,beforeArea:b.area,area:p.area,ratio:p.area/b.area,clearanceArea:p.clearanceArea});
 // Twenty old/new pairs across four columns.
}
const contact=canvas(W*4,(H+44)*10);
for(const [i,t]of Object.values(templates).entries()){const col=i%2*2,row=Math.floor(i/2);drawImage(contact,plan(old[t.id]).image,col*W,row*(H+44),W,H+44);drawImage(contact,plan(t).image,(col+1)*W,row*(H+44),W,H+44);}
await writeFile(resolve(out,'twenty-old-new.png'),encode(contact));await writeFile(resolve(out,'areas.json'),JSON.stringify(rows,null,2)+'\n');console.log(rows);
