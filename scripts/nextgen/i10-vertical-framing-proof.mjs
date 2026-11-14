#!/usr/bin/env node
/** File-only polynomial necessary-condition audit; never runs a browser. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const source=process.argv[2]||'artifacts/nextgen/i10/720-atrium01-focus-camera-feasibility.json';
const raw=fs.readFileSync(source),fixture=JSON.parse(raw),{camera,hero,contacts,viewport}=fixture.inputs;
const a=camera.world[5],b=-camera.world[6],S=a*a+b*b,C=camera.position[1],H=viewport.height,L=viewport.insets.top,U=H-viewport.insets.bottom,P=100*H/1080;
if(Math.abs(camera.world[0]-1)>1e-12||Math.abs(camera.world[1])>1e-12||Math.abs(camera.world[2])>1e-12)throw Error('Requires fixed no-yaw tilt');
const add=(p,q)=>Array.from({length:Math.max(p.length,q.length)},(_,i)=>(p[i]||0)+(q[i]||0));
const scale=(p,s)=>p.map(x=>x*s),mul=(p,q)=>{const r=Array(p.length+q.length-1).fill(0);p.forEach((x,i)=>q.forEach((y,j)=>r[i+j]+=x*y));return r};
const ev=(p,t)=>p.reduceRight((s,x)=>s*t+x,0);
function roots(p){p=[...p];while(p.length>1&&Math.abs(p.at(-1))<1e-13)p.pop();if(p.length===1)return[];if(p.length===2)return[-p[0]/p[1]];
 const critical=roots(p.slice(1).map((x,i)=>x*(i+1))),B=1+Math.max(...p.slice(0,-1).map(x=>Math.abs(x/p.at(-1)))),points=[-B,...critical.filter(x=>x>-B&&x<B),B].sort((x,y)=>x-y),out=[];
 for(const x of points)if(Math.abs(ev(p,x))<1e-9*Math.max(1,...p.map(Math.abs)))out.push(x);
 for(let i=1;i<points.length;i++){let l=points[i-1],r=points[i],fl=ev(p,l),fr=ev(p,r);if(fl*fr>=0)continue;for(let n=0;n<100;n++){const m=(l+r)/2,fm=ev(p,m);if(fl*fm<=0){r=m;fr=fm}else{l=m;fl=fm}}out.push((l+r)/2)}
 return out.sort((x,y)=>x-y).filter((x,i,ar)=>i===0||Math.abs(x-ar[i-1])>1e-7);
}
const vertices=[hero,...contacts].flatMap(actor=>[-1,1].flatMap(zs=>[0,1].map(ys=>({id:actor.id,y:actor.height*ys,z:actor.z+zs*actor.radius}))));
const frontThreshold=Math.max(...vertices.map(v=>v.z-b*(C-v.y)/a+camera.near/a));
const D0=[b*C-a*hero.z,a],Dh=[b*(C-hero.height)-a*hero.z,a];
const direct=(t)=>{const d0=ev(D0,t),dh=ev(Dh,t),factor=P*d0*dh/(hero.height*S*Math.abs(t-hero.z));const ys=vertices.map(v=>({id:v.id,y:v.y,z:v.z,pixel:H/2-factor*(a*(v.y-C)+b*(t-v.z))/(b*(C-v.y)+a*(t-v.z))}));return{min:Math.min(...ys.map(v=>v.pixel)),max:Math.max(...ys.map(v=>v.pixel)),overflow:Math.max(L-Math.min(...ys.map(v=>v.pixel)),Math.max(...ys.map(v=>v.pixel))-U),vertices:ys};};
const branches=[];
for(const sign of [-1,1]){const lo=sign===-1?frontThreshold:Math.max(frontThreshold,hero.z),hi=sign===-1?hero.z:Infinity;if(lo>=hi)continue;
 const absE=[-sign*hero.z,sign],constraints=vertices.flatMap(v=>{const Dv=[b*(C-v.y)-a*v.z,a],Yv=[a*(v.y-C)-b*v.z,b],den=scale(mul(absE,Dv),hero.height*S),num=scale(mul(mul(D0,Dh),Yv),P);return[{id:v.id,y:v.y,z:v.z,side:'top',poly:add(scale(den,H/2-L),scale(num,-1))},{id:v.id,y:v.y,z:v.z,side:'bottom',poly:add(scale(den,U-H/2),num)}];});
 const cut=[lo,...constraints.flatMap(c=>roots(c.poly)).filter(t=>t>lo+1e-8&&t<hi-1e-8),...(Number.isFinite(hi)?[hi]:[])].sort((x,y)=>x-y).filter((t,i,ar)=>i===0||Math.abs(t-ar[i-1])>1e-7);
 const candidates=cut.filter(t=>t>lo+1e-8&&t<hi-1e-8);const intervals=[];for(let i=0;i<cut.length;i++){const left=cut[i],right=cut[i+1]??hi;if(left===right)continue;const t=Number.isFinite(right)?(left+right)/2:left+Math.max(1,Math.abs(left));const failed=constraints.filter(c=>ev(c.poly,t)<0);intervals.push({left,right:Number.isFinite(right)?right:'Infinity',sample:t,failedCount:failed.length,firstFailure:failed[0]&&{id:failed[0].id,side:failed[0].side}});candidates.push(t)}
 const feasible=candidates.filter(t=>constraints.every(c=>ev(c.poly,t)>=-1e-7)).map(t=>({cameraZ:t,...direct(t)}));
 branches.push({sign,domain:{lo,hi:Number.isFinite(hi)?hi:'Infinity'},constraints,roots:cut,intervals,feasible});}
const room=fixture.inputs.roomBounds;
const backsideFloor={cameraZUpper:hero.z,maxFloorViewY:a*(-C)+b*(hero.z-room.top),minFloorDepthAtPhysicalLower:b*C+a*(frontThreshold-room.bottom),outsideLowerBound:(H/2-L)/(U-L)};
const backsideRuledOut=backsideFloor.maxFloorViewY<0&&backsideFloor.minFloorDepthAtPhysicalLower>0&&backsideFloor.outsideLowerBound>.18;
const gameplayFeasible=branches.some(branch=>branch.feasible.length&&(branch.sign>0||!backsideRuledOut));
const receipt={backsideFloor,backsideRuledOut,gameplayFeasible,source,sourceSHA256:createHash('sha256').update(raw).digest('hex'),captureSourceSHA:fixture.captureSourceSHA,method:'Fixed captured height/orientation; cameraX cannot affect vertical projection. At each cameraZ the exact minimum zoom for 100 reference pixels is substituted into every eight-corner body Y inequality, producing cubic polynomials on both sides of heroZ. All real-root intervals plus isolated roots checked; any violation at this zoom moves farther outside at higher zoom because usable vertical interval contains optical center. Near-plane-positive domain only; omitting AABB/far/side/padding constraints broadens feasible set. Numerical polynomial root isolation with derivative splitting and 100 bisections; not a formal interval-arithmetic proof.',parameters:{a,b,S,C,H,L,U,P,heroZ:hero.z,frontThreshold},branches,verticalFeasible:branches.some(b=>b.feasible.length),scanBest:fixture.verticalDiagnostic.best};
const out=source.replace('.json','-vertical-proof.json');fs.writeFileSync(out,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({out,parameters:receipt.parameters,branches:branches.map(b=>({sign:b.sign,domain:b.domain,rootCount:b.roots.length,intervalCount:b.intervals.length,feasible:b.feasible})),verticalFeasible:receipt.verticalFeasible,backsideFloor,backsideRuledOut,gameplayFeasible,scanBest:receipt.scanBest},null,2));
