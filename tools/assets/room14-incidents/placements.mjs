// Run from the worktree root. --raw inspects source-space debris before mounting.
// --suggest prints candidate transforms for any remaining overlaps.
import {rolldown} from 'rolldown';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import * as T from 'three';
import {L8_CAPTURE_API as api,L8_CAPTURE_ROOMS as rooms} from '../../../scripts/nextgen/l8-capture-data.mjs';
const scratch=mkdtempSync(resolve('node_modules/.room14-'));
const modules=['Room14Debris','Room14Fittings','Inc13Manual','Inc13StoryIncidents','Dress13EarlyIncidents','Room14Mounts'];
const entry=scratch+'/source.ts';
writeFileSync(entry,modules.map(n=>'export * from '+JSON.stringify(resolve('src/render/world/'+n+'.ts'))).join('\n'));
const bundle=await rolldown({input:entry,external:id=>id.startsWith('three')});
await bundle.write({file:scratch+'/source.mjs',format:'esm'});
const art=await import(pathToFileURL(scratch+'/source.mjs'));
await bundle.close();rmSync(scratch,{recursive:true});
// Only geometry is measured. Stub painting so headless authors can construct the original meshes.
const noop=()=>{},brush=new Proxy({getImageData:(_x,_y,w,h)=>({data:new Uint8Array(w*h*4)}),
 createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]??noop});
globalThis.document={createElement:()=>({getContext:()=>brush})};
globalThis.Path2D=class {moveTo(){} lineTo(){} closePath(){} rect(){}};
const paths={'p11-room14':'room14','p11-inc13-manual':'inc13/manual','p11-inc13-residential':'inc13/residential','p11-service':'p11/service-kit',clinical:'e9-ship-kit/clinical'};
function inside(x,y,poly){
 let hit=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];
  if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)hit=!hit;
 }
 return hit;
}
// Check the entire conservative world-space AABB. A concave notch crossing
// the rectangle also fails, even when all four corners fit.
function fits(b,p){
 const [x,y,X,Y]=b;
 if(![[x,y],[X,y],[x,Y],[X,Y]].every(([u,v])=>inside(u,v,p)))return false;
 for(let i=0;i<p.length;i++){
  const a=p[i],c=p[(i+1)%p.length];
  if(a.x>=x&&a.x<=X&&a.y>=y&&a.y<=Y)return false;
  for(const u of [x,X]){
   const f=(u-a.x)/(c.x-a.x),v=a.y+f*(c.y-a.y);
   if(f>=0&&f<=1&&v>=y&&v<=Y)return false;
  }
  for(const v of [y,Y]){
   const f=(v-a.y)/(c.y-a.y),u=a.x+f*(c.x-a.x);
   if(f>=0&&f<=1&&u>=x&&u<=X)return false;
  }
 }
 return true;
}
const rect=(x,y,X,Y)=>[{x,y},{x:X,y},{x:X,y:Y},{x,y:Y}];
const suggestion={};
let violations=0,placed=0,flush=0;
for(const {id} of rooms){
 const room=api.templates[id],geo=api.geometry(room,id);
 const supports=[...(room.voids??[]),...geo.blockers.map(r=>rect(r.x,r.y,r.x+r.width,r.y+r.height))];
 const root=new T.Group(),parts=[];
 art.addStoryIncident(root,room);art.addRoom14Fittings(root,id);
 if(id==='manual-control-chamber')art.addInc13Manual(root);
 if(['passenger-vault','communal-atrium','crew-checkpoint','residential-gallery'].includes(id)){
  const early=new T.Group();art.addDress13EarlyDetails(early,id);
  early.traverse(o=>{if(o.isMesh&&(/nameplate|checkpoint-foot/.test(o.material.name)||o.name==='dress13-atrium-fallen-dining-tables'))parts.push([o.material.name||o.name,new T.Box3().setFromObject(o)]);});
  for(const o of early.children)if(o.name==='residential-cabin-drawings'||o.name==='dress13-residential-evacuation-evidence')parts.push([o.name,new T.Box3().setFromObject(o)]);
 }
 for(const o of root.children)parts.push([o.name,new T.Box3().setFromObject(o)]);
 const kits=[...art.room14Debris(id),...art.dress13EarlyIncidents(id).filter(i=>id==='passenger-vault'||id==='residential-gallery')];
 if(id==='manual-control-chamber')kits.push(art.inc13ManualPlacement());
 for(const i of kits){
  const {models}=JSON.parse(readFileSync('public/assets/'+paths[i.pack]+'/manifest.json'));
  const {bounds}=models.find(m=>m.name===i.asset);
  parts.push([i.asset,new T.Box3(new T.Vector3(...bounds.min),new T.Vector3(...bounds.max)).applyMatrix4(i.matrix)]);
 }
 const groups=new Map();
 for(const [key,box] of parts){
  if(box.max.y<=.022001){flush++;continue;}
  placed++;
  const group=key==='room14-landmark-worklight'?'lamp':'incident';
  const mounted=!process.argv.includes('--raw')&&group==='incident'&&art.mountMatrix(id);if(mounted)box.applyMatrix4(mounted);
  const b=[box.min.x*32,box.min.z*32,box.max.x*32,box.max.z*32];
  const valid=supports.some(p=>fits(b,p));
  if(!valid)violations++;
  if(!valid)console.error(id,key,'walkable overlap',b.map(Math.round).join(','));
  const g=groups.get(group)??{box:new T.Box3(),invalid:false};g.box.union(box);g.invalid||=!valid;groups.set(group,g);
 }
 for(const [key,{box,invalid}] of groups){
  if(!invalid)continue;
  const cx=16*(box.min.x+box.max.x),cz=16*(box.min.z+box.max.z);
  let best=Infinity,placement;
  for(const poly of supports){
   const xs=poly.map(p=>p.x),zs=poly.map(p=>p.y);
   for(const scale of [1,.85,.7,.55,.4,.3,.22]){
    const w=16*(box.max.x-box.min.x)*scale+.3,h=16*(box.max.z-box.min.z)*scale+.3;
    for(let x=Math.min(...xs)+w+1;x<Math.max(...xs)-w;x+=4)for(let z=Math.min(...zs)+h+1;z<Math.max(...zs)-h;z+=4){
     const score=Math.hypot(x-cx,z-cz)+(1-scale)*330;
     if(score>=best||!fits([x-w,z-h,x+w,z+h],poly))continue;
     best=score;placement=[scale,x-scale*cx,z-scale*cz,0].map(n=>+n.toFixed(3));
    }
   }
  }
  if(!placement)throw Error(id+' lacks suitable mount');
  (suggestion[id]??={})[key]=placement;
 }
}
console.log(process.argv.includes('--suggest')?JSON.stringify(suggestion,null,2):
 `${rooms.length} rooms, ${placed} raised placements, ${flush} flush surfaces, ${violations} overlaps.`);
