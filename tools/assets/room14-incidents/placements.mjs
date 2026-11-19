// Run from the worktree root to inspect shipping incident art and native navigation.
import {fixtureTriangles} from './mesh-footprints.mjs';
import {rolldown} from 'rolldown';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import * as T from 'three';
import {L8_CAPTURE_API as api,L8_CAPTURE_ROOMS as rooms} from '../../../scripts/nextgen/l8-capture-data.mjs';
const scratch=mkdtempSync(resolve('node_modules/.room14-'));
const modules=['Room14Mounts','Room14Debris','Room14Fittings','Inc13Manual','Inc13StoryIncidents','Dress13EarlyIncidents','Dress13ServiceIncidents','Dress13ServiceDetails','P11InfestedPlacements','P11MaintenancePlacements','P11ClinicalSecurityPlacements','P11CargoPlacements','P11ControlPlacements','P11HabitationPlacements','P11ServicePlacements','P11IncidentPlacements'];
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
const paths={'p11-comms':'p11/comms-engineering','p11-habitation':'p11/habitation','p11-infested':'p11/infested','p11-reactor':'p11/reactor','p11-clinical-security':'p11/clinical-security','p11-cargo':'p11/cargo','p11-maintenance':'p11/maintenance-containment','p11-room14':'room14','p11-inc13-manual':'inc13/manual','p11-inc13-residential':'inc13/residential','p11-service':'p11/service-kit',clinical:'e9-ship-kit/clinical',security:'e9-ship-kit/security','p11-brood':'brood-growth','p11-inc13-workshop':'inc13/workshop','p11-inc13-coolant':'inc13/coolant','p11-inc13-awakening':'inc13/awakening','p11-control':'p11/control','p11-incidents':'p11/incidents'};
function inside(x,y,poly){
 let hit=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];
  if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)hit=!hit;
 }
 return hit;
}
function containsTriangle(poly,triangle){
 const side=(a,b,p)=>(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
 if(!triangle.every(p=>inside(p.x,p.y,poly)))return false;
 for(let i=0;i<3;i++){
  const a=triangle[i],b=triangle[(i+1)%3];
  for(let j=0;j<poly.length;j++){
   const c=poly[j],d=poly[(j+1)%poly.length];
   if(side(a,b,c)*side(a,b,d)<0&&side(c,d,a)*side(c,d,b)<0)return false;
  }
 }
 return true;
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
let violations=0,placed=0,flush=0;
const baselineExceptions=[];
for(const {id} of rooms){
 const room=api.templates[id],geo=api.geometry(room,id);
 const supports=[...(room.voids??[]),...geo.blockers.map(r=>rect(r.x,r.y,r.x+r.width,r.y+r.height))];
 const root=new T.Group(),parts=[];
 art.addStoryIncident(root,room);for(const o of root.children)o.applyMatrix4(art.incidentTransform(id));art.addRoom14Fittings(root,id);
 art.addDress13ServiceDetails(root,id);art.addDress13EarlyDetails(root,id);
 root.updateMatrixWorld(true);
 root.traverse(o=>{if(o.isMesh&&o.name!=='inc13-ground-vapour')parts.push([o.name||o.material.name,new T.Box3().setFromObject(o),o]);});
 const kits=[...art.room14Debris(id),...art.p11IncidentPlacements(id),...art.p11HabitationPlacements(id),...art.p11ControlPlacements(id),...art.p11CargoPlacements(id),...art.p11InfestedPlacements(id),...art.p11MaintenancePlacements(id),...art.p11ClinicalSecurityPlacements(id),...art.p11ServicePlacements(room)];
 for(const i of kits){
  const {models}=JSON.parse(readFileSync('public/assets/'+paths[i.pack]+'/manifest.json'));
  const {bounds}=models.find(m=>m.name===i.asset);
  art.alignIncidentInstance(id,i);
  const box=new T.Box3(new T.Vector3(...bounds.min),new T.Vector3(...bounds.max));
  if(art.placeLooseInstance(room,i,box.clone().applyMatrix4(i.matrix)))parts.push([i.asset,box.applyMatrix4(i.matrix),null,i]);
 }
 for(const [key,box,mesh,instance] of parts){
  if(box.isEmpty())continue;
  if(box.max.y<=.022001){flush++;continue;}
  placed++;
  const b=[box.min.x*32,box.min.z*32,box.max.x*32,box.max.z*32];
  // The colliding core is inset by one native unit from bevelled art. Body
  // radii start at 14, so no actor centre can stand in this edge allowance.
  const inset=room.incidentObstacles.some(r=>b[0]>=r.x-1.6&&b[1]>=r.y-1.6&&b[2]<=r.x+r.width+1.6&&b[3]<=r.y+r.height+1.6);
  if(!inset&&!supports.some(p=>fits(b,p))){
    // Merged batches may contain both a raised piece on support and walkable
    // marks several metres away. Inspect the emitted triangles in that case.
    if(mesh){
      const pos=mesh.geometry.attributes.position,idx=mesh.geometry.index;
      let unsupported=false;
      for(let i=0;i<(idx?.count??pos.count);i+=3){
        const tri=new T.Box3();
        for(let j=0;j<3;j++)tri.expandByPoint(new T.Vector3().fromBufferAttribute(pos,idx?idx.getX(i+j):i+j).applyMatrix4(mesh.matrixWorld));
        if(tri.max.y<=.022001)continue;
        const bounds=[tri.min.x*32,tri.min.z*32,tri.max.x*32,tri.max.z*32];
        if(!supports.some(p=>fits(bounds,p))&&!room.incidentObstacles.some(r=>bounds[0]>=r.x-1.6&&bounds[1]>=r.y-1.6&&bounds[2]<=r.x+r.width+1.6&&bounds[3]<=r.y+r.height+1.6)){unsupported=true;break;}
      }
      if(!unsupported)continue;
    }
    if(instance&&await fixtureTriangles('public/assets/'+paths[instance.pack],instance,points=>{
      if(points.every(p=>p.y<=.022001))return true;
      const footprint=points.map(p=>({x:p.x*32,y:p.z*32}));
      const supported=supports.some(poly=>containsTriangle(poly,footprint));
      if(!supported&&process.argv.includes('--details'))console.log(id,key,'unsupported triangle',points.map(p=>[p.x*32,p.y,p.z*32].map(v=>v.toFixed(2))).join(' / '));
      return supported;
    }))continue;
    violations++;console.log(id,key,b.map(Math.round).join(','));
  }
 }
}
console.log(rooms.length+' rooms, '+placed+' raised parts, '+flush+' flush surfaces, '+violations+' overlaps.');

const {roomClearance,chargeLanes,deckLaneWidth}=await import('./clearance.mjs');
console.log('Room | body radius | reachable before/after/total | breach markers before/after | minimum authored opening before | narrowed below minimum | Warden bait rays shortened/checked | minimum sampled deck lane before/after | role-specific targets before/after');
for(const [index,{id}] of rooms.entries()){
  // Warden detour in Swarm can exceed the planned radius-46 Matron.
  const radius=[5,8,12,15,18].includes(index)?64:index===0?16:28;
  const r=roomClearance(api,api.templates[id],api.plans[id],radius);
  const charge=radius===64?chargeLanes(api,api.templates[id],api.plans[id]):{shortened:0,checked:0};
  const t=api.templates[id];
  const distance=(p,r)=>Math.hypot(Math.max(r.x-p.x,0,p.x-r.x-r.width),Math.max(r.y-p.y,0,p.y-r.y-r.height));
  const fixedAnchors=[t.spawn,t.exit,...api.geometry(t,id).breaches];
  if(id==='safety-interlock-station')fixedAnchors.push({x:t.spawn.x+48,y:t.spawn.y});
  if(t.incidentObstacles.length>2||t.incidentObstacles.some(rect=>
    distance(api.plans[id].arena,rect)<144||fixedAnchors.some(anchor=>distance(anchor,rect)<radius))){
    console.log(id,'incident cover encroaches on a reserved position or exceeds two obstacles');
    violations++;
  }
  const widths=[{...t,incidentObstacles:[]},t].map(room=>deckLaneWidth(api,api.geometry(room,id)));
  console.log([id,radius,[r.base.reachable,r.head.reachable,r.head.total].join('/'),[r.base.marker,r.head.marker].join('/'),r.oldMinimum,r.loss,[charge.shortened,charge.checked].join('/'),widths.map(w=>w.toFixed(1)).join('/'),[r.base,r.head].map(s=>s.nativeReached.filter(Boolean).length).join('/')].join(' | '));
  if(r.head.reachable<r.head.total||r.head.marker<4)baselineExceptions.push(id);
  if(r.anchorsLost||r.loss||charge.shortened||widths[1]<widths[0]-.01)violations++;
}
if(baselineExceptions.length){
  console.log('Existing largest-body reachability exceptions: '+baselineExceptions.join(', '));
  if(!process.argv.includes('--compare-baseline'))violations++;
}
if(violations)process.exitCode=1;
