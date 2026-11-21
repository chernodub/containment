/** Node-only bridge: bundle pure TS room data, then embed plain data in page
 * fixtures. No TS import or filesystem operation runs inside the browser. */
import assert from 'node:assert/strict';
import {build} from 'vite';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {tmpdir} from 'node:os';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
async function bundle(){
 const out=await mkdtemp(resolve(tmpdir(),'l8-capture-data-'));
 try{
  const entry=resolve(out,'entry.ts');
  await writeFile(entry,`export {SHIP_ARCHITECTURE_PLANS as plans} from '${resolve(root,'src/game/roguelike/shipArchitectureLayouts.ts')}';
export {ROOM_TEMPLATES as templates} from '${resolve(root,'src/game/roguelike/roomTemplates.ts')}';
export {createEncounterPlan} from '${resolve(root,'src/game/waves/EncounterDirector.ts')}';
export {generateRun} from '${resolve(root,'src/game/roguelike/run.ts')}';
export {createRoomTemplateGeometry as geometry,canOccupyExpedition as occupy,canTraverseExpedition as traverse,hasClearExpeditionShot as shot} from '${resolve(root,'src/game/world/expeditionGeometry.ts')}';`);
  await build({configFile:false,publicDir:false,logLevel:'error',build:{ssr:entry,outDir:out,emptyOutDir:false,rollupOptions:{output:{entryFileNames:'data.mjs'}}}});
  return await import(pathToFileURL(resolve(out,'data.mjs')));
 }finally{await rm(out,{recursive:true,force:true});}
}
export const L8_CAPTURE_API=await bundle();
export const L8_CAPTURE_ROOMS=L8_CAPTURE_API.generateRun(1729,3).nodes.map(node=>{
 const template=L8_CAPTURE_API.templates[node.templateId],plan=L8_CAPTURE_API.plans[node.templateId];assert(plan,`Missing ${node.templateId} plan`);
 const geometry=L8_CAPTURE_API.geometry(template,node.id);assert(L8_CAPTURE_API.occupy(geometry,plan.arena,144),`${node.templateId}: arena lacks native9m clearance`);
 return {id:node.templateId,name:template.name,arena:{...plan.arena},spawn:{...template.spawn},exit:{...template.exit},width:template.width,height:template.height};
});
assert.equal(L8_CAPTURE_ROOMS.length,20);assert.equal(new Set(L8_CAPTURE_ROOMS.map(r=>r.id)).size,20);
export const L8_CAPTURE_ARENAS=Object.fromEntries(L8_CAPTURE_ROOMS.map(room=>[room.id,room.arena]));
