import {afterAll,describe,it,expect} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
import type {Point,RoomTemplate} from '../src/game/roguelike/types';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {SHIP_ARCHITECTURE_PLANS} from '../src/game/roguelike/shipArchitectureLayouts';
import {paritySafeVoids} from '../src/game/world/voidParity';
import {canOccupyExpedition,canTraverseExpedition,hasClearExpeditionShot,createRoomTemplateGeometry} from '../src/game/world/expeditionGeometry';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';
import {wallContact} from '../src/game/world/wallContact';

type Polygon=readonly Point[];
const polygon=(rows:readonly (readonly [number,number])[])=>Object.freeze(rows.map(([x,y])=>Object.freeze({x,y})));
const rect=(x:number,y:number,w:number,h:number)=>polygon([[x,y],[x+w,y],[x+w,y+h],[x,y+h]]);
function inside(p:Point,poly:Polygon){let value=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)value=!value;}return value;}
const parity=(p:Point,polys:readonly Polygon[])=>polys.reduce((v,poly)=>v!==inside(p,poly),false);
function edgeDistance(p:Point,poly:Polygon){let best=Infinity;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/d)):0;best=Math.min(best,Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy));}return best;}
const templates=Object.keys(SHIP_ARCHITECTURE_PLANS).map(id=>ROOM_TEMPLATES[id as keyof typeof ROOM_TEMPLATES]);
const report:{rooms:unknown[];navigationControls:number;navigationSteps:number}={rooms:[],navigationControls:0,navigationSteps:0};
afterAll(()=>{const path=process.env.L8_VOID_PARITY_REPORT;if(path){mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(report,null,2)+'\n');}});

describe('exact native-solid union in an evenodd footprint',()=>{
 it('compensates every pair/triple/four-way overlap, with immutable deterministic cache',()=>{
  const original=Object.freeze([rect(0,0,100,100),rect(40,20,100,100),rect(20,40,100,100),rect(60,-20,30,160)]),before=JSON.stringify(original),result=paritySafeVoids(original)!;
  expect(result.slice(0,4)).toEqual(original);expect(result.length).toBeGreaterThan(4);expect(paritySafeVoids(original)).toBe(result);expect(Object.isFrozen(result)).toBe(true);
  for(const p of result.slice(4)){expect(Object.isFrozen(p)).toBe(true);for(const q of p)expect(Object.isFrozen(q)).toBe(true);}
  for(let y=-29;y<150;y+=3)for(let x=-19;x<150;x+=3){const q={x:x+.13,y:y+.29};expect(parity(q,result),JSON.stringify(q)).toBe(original.some(p=>inside(q,p)));}
  expect(JSON.stringify(original)).toBe(before);
  const clone=Object.freeze(original.map(p=>polygon(p.map(v=>[v.x,v.y] as const))));expect(paritySafeVoids(clone)).toEqual(result);
 });
 it('handles concave-concave intersections and their triple-overlap pieces',()=>{
  const a=polygon([[0,0],[120,0],[120,120],[90,120],[90,30],[30,30],[30,120],[0,120]]),b=polygon([[0,0],[30,0],[30,90],[90,90],[90,0],[120,0],[120,120],[0,120]]),c=polygon([[60,-20],[140,60],[60,140],[-20,60]]),original=Object.freeze([a,b,c]),out=paritySafeVoids(original)!;
  for(let y=-9;y<139;y+=3)for(let x=-9;x<139;x+=3){const p={x:x+.37,y:y+.19};expect(parity(p,out)).toBe(original.some(poly=>inside(p,poly)));}
 });
 it('handles repeated and oppositely wound contained polygons without cancellation',()=>{
  const box=rect(0,0,100,100),original=Object.freeze([box,polygon([...box].reverse().map(p=>[p.x,p.y] as const)),rect(20,20,30,30)]),out=paritySafeVoids(original)!;
  for(let y=-3;y<105;y+=2)for(let x=-3;x<105;x+=2){const p={x:x+.31,y:y+.23};expect(parity(p,out)).toBe(original.some(poly=>inside(p,poly)));}
 });
 it('triangulates disconnected concave intersections without bridging their gap',()=>{
  const u=polygon([[0,0],[120,0],[120,120],[90,120],[90,30],[30,30],[30,120],[0,120]]),bar=rect(-10,60,140,30),original=Object.freeze([u,bar]),projected=paritySafeVoids(original)!;
  expect(projected.length).toBeGreaterThan(3);expect(parity({x:60,y:75},projected)).toBe(true);
  for(let y=-5;y<125;y+=2)for(let x=-15;x<135;x+=2){const p={x:x+.37,y:y+.19};expect(parity(p,projected)).toBe(original.some(poly=>inside(p,poly)));}
 });
 it('retains touching/disjoint/empty references and never caches mutable input',()=>{
  expect(paritySafeVoids(undefined)).toBeUndefined();const disjoint=Object.freeze([rect(0,0,10,10),rect(10,0,10,10),rect(50,50,10,10)]);expect(paritySafeVoids(disjoint)).toBe(disjoint);
  const mutable=[rect(0,0,10,10),rect(5,0,10,10)],a=paritySafeVoids(mutable)!;mutable[1]=rect(50,50,10,10);expect(paritySafeVoids(mutable)).toBe(mutable);expect(a.length).toBe(3);
 });
 it.each(['armory','breached-loading-bay'])('%s removes the known fake floor without replacing native solids',id=>{
  const t=ROOM_TEMPLATES[id as keyof typeof ROOM_TEMPLATES],g=createRoomTemplateGeometry(t,'parity-known');expect(g.voids!.length).toBeGreaterThan(t.voids!.length);
  for(let i=0;i<t.voids!.length;i++)expect(g.voids![i]).toBe(t.voids![i]);
  const overlap=id==='armory'?{x:600,y:175}:{x:600,y:250};expect(parity(overlap,t.voids!)).toBe(false);expect(parity(overlap,g.voids!)).toBe(true);expect(canOccupyExpedition(g,overlap,0)).toBe(false);
 });
 for(const t of templates)it(t.id+' preserves exact native occupancy/sweeps and projects the actual floor',()=>{
  const before=JSON.stringify(t),g=createRoomTemplateGeometry(t,'parity-grid'),original={...g,voids:t.voids};let positions=0,sweeps=0,edgeChecks=0;
  expect(paritySafeVoids(t.voids)).toEqual(g.voids);
  for(let y=11;y<t.height;y+=24)for(let x=7;x<t.width;x+=24){const p={x,y};positions++;
   for(const radius of [0,16,28,32]){
    expect(canOccupyExpedition(g,p,radius)).toBe(canOccupyExpedition(original,p,radius));
    for(const [dx,dy]of [[31,29],[65,0],[-119,173]]){const q={x:x+dx,y:y+dy};expect(canTraverseExpedition(g,p,q,radius)).toBe(canTraverseExpedition(original,p,q,radius));sweeps++;}
   }
   const hull=t.boundary??rect(0,0,t.width,t.height),polys=[hull,...t.voids??[]];
   // SVG boundary coverage is undefined on an exact mathematical edge; use
   // native off-edge points, including points outside a concave room hull.
   if(polys.every(poly=>edgeDistance(p,poly)>.001)){
    const svgFloor=parity(p,[hull,...g.voids??[]]);const nativeFloor=inside(p,hull)&&!(t.voids??[]).some(poly=>inside(p,poly));expect(svgFloor,JSON.stringify({room:t.id,p})).toBe(nativeFloor);
   }
  }
  for(const poly of t.voids??[])for(let i=0;i<poly.length;i++){
   const a=poly[i],b=poly[(i+1)%poly.length],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(!length)continue;
   for(const fraction of [.13,.5,.87])for(const radius of [0,16,28,32])for(const sign of [-1,1]){
    const p={x:a.x+dx*fraction-dy/length*radius*sign,y:a.y+dy*fraction+dx/length*radius*sign},q={x:p.x+dx/length*24,y:p.y+dy/length*24};
    expect(canOccupyExpedition(g,p,radius)).toBe(canOccupyExpedition(original,p,radius));expect(canTraverseExpedition(g,p,q,radius)).toBe(canTraverseExpedition(original,p,q,radius));edgeChecks++;
   }
  }
  expect(positions).toBeGreaterThan(1000);expect(sweeps).toBe(positions*12);expect(JSON.stringify(t)).toBe(before);
  report.rooms.push({room:t.id,originalVoids:t.voids?.length??0,projectedVoids:g.voids?.length??0,positions,occupancyRadiusChecks:positions*4,sweptRadiusChecks:sweeps,edgeTangencyChecks:edgeChecks});
 },60000);
 it('keeps deterministic navigation waypoint sequences and wall contacts in every affected room',()=>{
  const affected=templates.filter(t=>paritySafeVoids(t.voids)!==t.voids);expect(affected.length).toBeGreaterThanOrEqual(2);
  for(const t of affected){const g=createRoomTemplateGeometry(t,'parity-nav'),old={...g,voids:t.voids},plan=SHIP_ARCHITECTURE_PLANS[t.id as keyof typeof SHIP_ARCHITECTURE_PLANS]!,targets=[t.spawn,t.exit,plan.arena,...plan.spaces.map(s=>s.anchor)];
   for(const radius of [14,18,24,28,32])for(const breach of g.breaches)for(const target of targets){
    const start={x:breach.x+(breach.facing==='east'?56:-56),y:breach.y,radius},a={...start},b={...start},na=new FacilityNavigation(old),nb=new FacilityNavigation(g);
    report.navigationControls++;for(let step=0;step<80;step++){
     report.navigationSteps++;
     const goal={x:target.x+Math.sin(step*.2)*3,y:target.y+Math.cos(step*.2)*3},pa=na.waypoint(a,goal,1),pb=nb.waypoint(b,goal,1);expect(pb).toEqual(pa);
     const q=pa??goal,dx=q.x-a.x,dy=q.y-a.y,d=Math.hypot(dx,dy);if(d<1e-8)break;const next={x:a.x+dx/d*Math.min(8,d),y:a.y+dy/d*Math.min(8,d)};
     expect(canTraverseExpedition(g,b,next,radius)).toBe(canTraverseExpedition(old,a,next,radius));if(!canTraverseExpedition(old,a,next,radius))break;Object.assign(a,next);Object.assign(b,next);
    }
   }
   const rays=[{from:t.spawn,to:t.exit},{from:t.spawn,to:plan.arena}];for(const ray of rays){expect(hasClearExpeditionShot(g,ray.from,ray.to)).toBe(hasClearExpeditionShot(old,ray.from,ray.to));expect(wallContact(g,ray.from,ray.to,16)).toEqual(wallContact(old,ray.from,ray.to,16));}
  }
 },120000);
 it('leaves legacy templates and every disjoint topology reference unchanged',()=>{
  for(const t of Object.values(ROOM_TEMPLATES) as RoomTemplate[]){const normalized=paritySafeVoids(t.voids);if(!t.id.includes('armory')&&!Object.hasOwn(SHIP_ARCHITECTURE_PLANS,t.id))expect(normalized).toBe(t.voids);}
 });
});
