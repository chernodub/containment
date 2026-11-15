/** File-only labeled plans. Native simulation predicates supply the floor mask. */
import {build} from 'vite';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {canvas,encode,drawText,drawImage} from './g2-png.mjs';
const out=resolve(process.argv[2]??'artifacts/nextgen/l8-standard/plans');await mkdir(out,{recursive:true});
const entry=resolve(out,'entry.ts');
const candidate=process.argv[4],symbol=process.argv[5]??'SHIP_ACT2_PLANS';assert(/^[A-Z0-9_]+$/.test(symbol));
const selection=candidate?`import {STORY_ROOM_TEMPLATES as baseTemplates} from '${resolve('src/game/roguelike/storyRoomTemplates.ts')}';
import {SHIP_ARCHITECTURE_PLANS as basePlans} from '${resolve('src/game/roguelike/shipArchitectureLayouts.ts')}';
import {${symbol} as candidatePlans} from '${resolve(candidate)}';
export const standards={...basePlans,...candidatePlans};
export const templates=Object.fromEntries(Object.entries(baseTemplates).map(([id,t])=>[id,{...t,...standards[id]?.topology}]));`:
`export {STORY_ROOM_TEMPLATES as templates} from '${resolve('src/game/roguelike/storyRoomTemplates.ts')}';
export {SHIP_ARCHITECTURE_PLANS as standards} from '${resolve('src/game/roguelike/shipArchitectureLayouts.ts')}';`;
await writeFile(entry,`${selection}
export {shipSolidStatistics as stats,shipPlanOpeningErrors as openingErrors,shipBlockedOpeningErrors as blockedErrors,insidePlanPolygon as inside} from '${resolve('src/game/roguelike/shipPlanChecks.ts')}';
export {canOccupyExpedition as occupy,hasClearExpeditionShot as sight,createRoomTemplateGeometry as geometry} from '${resolve('src/game/world/expeditionGeometry.ts')}';
export {generateRun} from '${resolve('src/game/roguelike/run.ts')}';`);
await build({configFile:false,publicDir:false,logLevel:'error',build:{ssr:entry,outDir:out,emptyOutDir:false,rollupOptions:{output:{entryFileNames:'plans-runtime.mjs'}}}});
const {templates,standards,stats,openingErrors,blockedErrors,inside,occupy,sight,geometry,generateRun}=await import(pathToFileURL(resolve(out,'plans-runtime.mjs')));
const old=process.argv[3]?JSON.parse(await readFile(process.argv[3],'utf8')):templates;
await writeFile(resolve(out,'templates.json'),JSON.stringify(templates,null,2)+'\n');
const W=704,H=680,cache=new WeakMap(),nodes=generateRun(1729,3).nodes;
const colors=[[65,88,99],[89,83,69],[64,91,85],[91,71,83],[72,82,110],[92,91,64],[74,102,103],[106,80,67],[76,86,78]];
function plan(t,annotation){
 if(cache.has(t))return cache.get(t);
 const image=canvas(W,H),base=geometry(t,nodes.find(n=>n.templateId===t.id).id),g=base;
 const scale=Math.min((W-32)/t.width,500/t.height),ox=(W-t.width*scale)/2,oy=76+(500-t.height*scale)/2;
 const screen=p=>({x:Math.round(ox+p.x*scale),y:Math.round(oy+p.y*scale)});
 const dot=(p,c,r=3)=>{const a=screen(p);for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)if(x*x+y*y<=r*r){const px=a.x+x,py=a.y+y;if(px>=0&&px<W&&py>=0&&py<H)image.pixels.set(c,(py*W+px)*3);}};
 const line=(a,b,c,r=0)=>{const steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)*scale);for(let i=0;i<=steps;i++)dot({x:a.x+(b.x-a.x)*i/steps,y:a.y+(b.y-a.y)*i/steps},c,r);};
 let area=0,clearanceArea=0;
 for(let y=1;y<t.height;y+=2)for(let x=1;x<t.width;x+=2){const p={x,y};if(occupy(g,p,0)){area+=4;if(occupy(g,p,32))clearanceArea+=4;}}
 for(let py=76;py<576;py++)for(let px=0;px<W;px++){
  const p={x:(px-ox)/scale,y:(py-oy)/scale},legal=occupy(g,p,0),wide=legal&&occupy(g,p,32);
  let c=legal?wide?[47,71,77]:[31,45,53]:[12,18,25];
  if(legal&&annotation){const n=annotation.spaces.findIndex(s=>inside(p,s.outline));if(n>=0)c=colors[n%colors.length].map(v=>Math.round(v*(wide?1:.65)));}
  image.pixels.set(c,(py*W+px)*3);
 }
 for(const a of [t.spawn,t.exit])for(const b of [...t.breaches,t.exit])if(sight(g,a,b))line(a,b,[86,113,99]);
 if(annotation){
  const a=annotation.arena;for(let i=0;i<96;i++)line({x:a.x+Math.cos(i/96*Math.PI*2)*144,y:a.y+Math.sin(i/96*Math.PI*2)*144},{x:a.x+Math.cos((i+1)/96*Math.PI*2)*144,y:a.y+Math.sin((i+1)/96*Math.PI*2)*144},[105,176,211]);
  for(const o of annotation.openings)line(o.from,o.to,[124,224,180],1);
  for(const aperture of annotation.apertures??[]){line(aperture.from,aperture.to,[226,233,221]);dot(aperture.from,[226,233,221],2);dot(aperture.to,[226,233,221],2);}
  for(const s of annotation.spaces){const q=screen(s.anchor),x=Math.max(8,Math.min(W-8-s.name.length*6,Math.round(q.x-s.name.length*3))),y=q.y-3;for(let yy=y-3;yy<y+10;yy++)for(let xx=x-3;xx<x+s.name.length*6+2;xx++)if(xx>=0&&xx<W)image.pixels.set([17,25,31],(yy*W+xx)*3);drawText(image,s.name,x,y,[230,232,216],1);}
  for(const [i,f]of annotation.breachFeatures.entries()){dot(f.at,[220,120,80],3);const q=screen(f.at);drawText(image,String(i+1),q.x+5,q.y-7,[255,164,105],1);}
 }
 for(const [i,b]of t.breaches.entries()){dot(b,[246,100,67],5);const q=screen(b);drawText(image,String(i+1),q.x+7,q.y+1,[255,179,110],1);}dot(t.spawn,[114,235,237],6);dot(t.exit,[244,204,106],6);
 drawText(image,t.id,12,8,[220,232,233],2);drawText(image,`AREA ${area} / R32 ${clearanceArea}`,12,32,[167,191,196],1);
 drawText(image,'CYAN ENTRY / GOLD EXIT / ORANGE BREACH',12,50,[157,195,198],1);
 if(annotation?.apertures?.length)drawText(image,'WHITE SOLID-JAMB APERTURES / GREEN CIRCULATION',12,576,[226,233,221],1);
 drawText(image,'GREEN CLEAR ROUTE SPANS 140 MIN / BLUE CIRCLE 9M',12,592,[124,224,180],1);
 if(annotation){const s=stats(t);drawText(image,`HULL SOLID ${Math.round(s.connectedFraction*100)} PCT / FREE GROUPS ${s.freeGroups}`,12,610,[210,223,220],1);
  annotation.breachFeatures.forEach((f,i)=>drawText(image,`${i+1} ${f.name}`,12+(i%2)*340,632+Math.floor(i/2)*16,[220,160,120],1));}
 const result={image,area,clearanceArea,g};cache.set(t,result);return result;
}
const rows=[],checks={};
for(const t of Object.values(templates)){
 const annotation=standards[t.id],p=plan(t,annotation),b=plan(old[t.id]);await writeFile(resolve(out,t.id+'.png'),encode(p.image));rows.push({id:t.id,beforeArea:b.area,area:p.area,ratio:p.area/b.area,clearanceArea:p.clearanceArea});
 if(annotation)checks[t.id]={...stats(t),openingErrors:openingErrors(annotation,p.g),blockedOpeningErrors:blockedErrors(annotation,p.g),arenaClear:occupy(p.g,annotation.arena,144)};
}
const contact=canvas(W*4,H*10);
for(const [i,t]of Object.values(templates).entries()){const col=i%2*2,row=Math.floor(i/2);drawImage(contact,plan(old[t.id]).image,col*W,row*H,W,H);drawImage(contact,plan(t,standards[t.id]).image,(col+1)*W,row*H,W,H);}
await writeFile(resolve(out,'twenty-old-new.png'),encode(contact));await writeFile(resolve(out,'areas.json'),JSON.stringify(rows,null,2)+'\n');await writeFile(resolve(out,'checks.json'),JSON.stringify(checks,null,2)+'\n');console.log(checks);
