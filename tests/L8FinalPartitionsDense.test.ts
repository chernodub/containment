import {afterAll,describe,it,expect} from 'vitest';
import {ENEMIES} from '../src/game/enemies/catalog';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';
import {canOccupyExpedition,canTraverseExpedition,createRoomTemplateGeometry} from '../src/game/world/expeditionGeometry';
import {L8_FAMILIES} from './helpers/l8SimulationHarness';
import {PARTITION_NODES as L8_STORY,partitionTemplate,writePartitionReport as writeL8Report} from './helpers/l8FinalPartitionHarness';
const rows:unknown[]=[];
afterAll(()=>writeL8Report('dense-family-navigation.json',rows));
describe('Dormant physical-partition dense family clearance and firing access',()=>{
 it.each(L8_STORY)('$templateId routes every family from every breach to the dense marine field',node=>{
  const g=createRoomTemplateGeometry(partitionTemplate(node),node.id),failures:unknown[]=[],navs=Object.fromEntries(L8_FAMILIES.map(f=>[f,new FacilityNavigation(g)])) as Record<typeof L8_FAMILIES[number],FacilityNavigation>;let marineGoals=0,routes=0,firingGoals=0;
  const firingPool:{x:number;y:number}[]=[];
  for(let y=32;y<g.bounds.height;y+=16)for(let x=32;x<g.bounds.width;x+=16)if(canOccupyExpedition(g,{x,y},ENEMIES.spitter.radius))firingPool.push({x,y});
  for(let y=48;y<g.bounds.height;y+=80)for(let x=48;x<g.bounds.width;x+=80){
   const goal={x,y};if(!canOccupyExpedition(g,goal,16))continue;marineGoals++;
   // Probe the full native180–420 projectile band on a16-unit legal-body field,
   // rather than assuming the optional240–360 AI holding ring is the attack band.
   const firing=firingPool.filter(p=>{const d=(p.x-x)**2+(p.y-y)**2;return d>=180**2&&d<=420**2&&canTraverseExpedition(g,p,goal,9);});
   if(!firing.length)failures.push({goal,reason:'no sampled legal spitter body/firing position in native180–420 band'});else firingGoals++;
   const contact=Object.fromEntries(L8_FAMILIES.map(f=>{
    const radius=ENEMIES[f].radius,points:{x:number;y:number}[]=[];
    for(let i=0;i<64;i++){const a=i*Math.PI/32,p={x:x+Math.cos(a)*(radius+16+.25),y:y+Math.sin(a)*(radius+16+.25)};if(canOccupyExpedition(g,p,radius)&&canTraverseExpedition(g,p,goal,0))points.push(p);}
    return [f,points];
   })) as Record<typeof L8_FAMILIES[number],{x:number;y:number}[]>;
   for(const family of L8_FAMILIES)for(const breach of g.breaches){
    routes++;const radius=ENEMIES[family].radius,start={x:breach.x+(breach.facing==='east'?56:-56),y:breach.y},nav=navs[family];
    // Contact/firing access is existential. A closest legal berth can be a tiny
    // rounded-corner recess while another equally valid berth has a broad entry.
    const candidates=[...(family==='spitter'?firing:contact[family])].sort((a,b)=>Math.hypot(a.x-start.x,a.y-start.y)-Math.hypot(b.x-start.x,b.y-start.y));
    let arrived=false,steps=0,end={...start,radius},lastTarget=goal;
    for(const target of candidates){
     const p={...start,radius};lastTarget=target;
     for(steps=0;steps<900;steps++){
      const d=Math.hypot(p.x-x,p.y-y);
      if(family==='spitter'?d>=180&&d<=420&&canTraverseExpedition(g,p,goal,9):d<=radius+16+.5&&canTraverseExpedition(g,p,goal,0)){arrived=true;break;}
      // Native Engagement can finish a legal berth using the actual body sweep,
      // even when the grid's extra2-unit margin cannot reach its precise center.
      const q=canTraverseExpedition(g,p,target,radius)?target:nav.waypoint(p,target,1)??target,dq=Math.hypot(q.x-p.x,q.y-p.y);if(dq<1e-6)break;
      const n={x:p.x+(q.x-p.x)/dq*Math.min(8,dq),y:p.y+(q.y-p.y)/dq*Math.min(8,dq)};
      if(!canTraverseExpedition(g,p,n,radius))break;Object.assign(p,n);
     }
     end=p;if(arrived)break;
    }
    if(!arrived)failures.push({goal,family,breach:breach.id,candidates:candidates.length,target:lastTarget,end,steps});

   }
  }
  rows.push({room:node.templateId,marineGoals,routes,firingGoals,failures});expect(marineGoals).toBeGreaterThan(0);expect(failures,JSON.stringify(failures)).toEqual([]);
 },120000);
});
