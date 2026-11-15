/** Prospective plan validation without activating candidate room geometry. */
import assert from 'node:assert/strict';
import {build} from 'vite';
import {mkdtemp,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
const module=process.argv[2]??'src/game/roguelike/shipArchitectureLayouts.ts',symbol=process.argv[3]??'SHIP_ARCHITECTURE_PLANS';
assert(/^[A-Z0-9_]+$/.test(symbol));
const out=await mkdtemp(resolve(tmpdir(),'l8-check-')),entry=resolve(out,'entry.ts');
await writeFile(entry,`export {${symbol} as plans} from '${resolve(module)}';
export {STORY_ROOM_TEMPLATES as templates} from '${resolve('src/game/roguelike/storyRoomTemplates.ts')}';
export * from '${resolve('src/game/roguelike/shipPlanChecks.ts')}';
export {createRoomTemplateGeometry as geometry,canOccupyExpedition as occupy} from '${resolve('src/game/world/expeditionGeometry.ts')}';`);
await build({configFile:false,publicDir:false,logLevel:'error',build:{ssr:entry,outDir:out,emptyOutDir:false,rollupOptions:{output:{entryFileNames:'check.mjs'}}}});
const api=await import(pathToFileURL(resolve(out,'check.mjs'))),baseline=JSON.parse(await readFile('tests/fixtures/l8-walkable-baseline.json','utf8')),reports=[];
for(const [id,p]of Object.entries(api.plans)){
 const t={...api.templates[id],...p.topology},g=api.geometry(t,'l8-check-'+id),s=api.shipSolidStatistics(t),errors=[];
 if(s.connectedFraction<.6)errors.push('Hull-connected solid area below60%');if(s.freeGroups>2)errors.push('More than two freestanding components');
 const ratio=s.walkableArea/baseline.areas[id];if(ratio<.8||ratio>1.2)errors.push('Walkable area outside±20%');
 if(!api.occupy(g,p.arena,144))errors.push('No9m crowd circle');
 if(p.holdout&&!['transmission-chamber','overload-floor'].includes(id))errors.push('Unauthorized holdout exception');
 errors.push(...api.shipPlanOpeningErrors(p,g),...api.shipBlockedOpeningErrors(p,g),...api.shipNavigationErrors(g));
 for(const q of [g.playerSpawn,g.exitPoint,...g.breaches,...g.breaches.map(b=>({x:b.x+(b.facing==='east'?56:-56),y:b.y}))])if(!api.occupy(g,q,32))errors.push('Illegal radius32 anchor '+JSON.stringify(q));
 if(p.breachFeatures.length!==t.breaches.length)errors.push('Missing breach feature');
 for(const [i,b]of t.breaches.entries()){
  const f=p.breachFeatures[i];if(!f||!/vent|door|tear/.test(f.name)||Math.hypot(b.x-f.at.x,b.y-f.at.y)>145||api.occupy(g,f.at,0))errors.push('Unbound breach '+i);
 }
 reports.push({id,...s,areaRatio:ratio,errors});
}
console.log(JSON.stringify(reports,null,2));if(reports.some(r=>r.errors.length))process.exitCode=1;
