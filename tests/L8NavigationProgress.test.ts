import {describe,it,expect} from 'vitest';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';
import {createRoomTemplateGeometry,canTraverseExpedition} from '../src/game/world/expeditionGeometry';

const goal={x:532,y:230};
function trappedLeg(){
 const geometry=createRoomTemplateGeometry(ROOM_TEMPLATES['diagnostic-gallery'],'progress'),nav=new FacilityNavigation(geometry),body={x:512,y:880,radius:28};
 expect(nav.waypoint(body,goal,1)).toEqual({x:464,y:688});
 // Exact native separation states from the failed opening-midpoint crowd.
 Object.assign(body,{x:497.05614387069994,y:890.6745678646388});expect(nav.waypoint(body,goal,1)).toEqual({x:496,y:880});
 Object.assign(body,{x:486.7594813089496,y:891.5716948694289});expect(nav.waypoint(body,goal,1)).toEqual({x:496,y:880});
 Object.assign(body,{x:482.26919657066344,y:880.407964268085});return{geometry,nav,body};
}
describe('world navigation commitment progress',()=>{
 it('releases the exact indefinitely held body-separated leg after bounded distinct observations',()=>{
  const{geometry,nav,body}=trappedLeg();let result=nav.waypoint(body,goal,1)!;
  expect(result).toEqual({x:496,y:880});
  for(let i=0;i<12&&result.y>=800;i++){
   // This is oscillation, not meaningful net progress toward496/880.
   Object.assign(body,{x:i%2?481.73193265509275:482.00262251456326,y:i%2?880.305509089219:880.3569281734837});
   result=nav.waypoint(body,goal,1)!;expect(canTraverseExpedition(geometry,body,result,28)).toBe(true);
  }
  expect(result.y).toBeLessThan(800);
 });
 it('does not count repeated identical or optional nearby-goal probes as body motion',()=>{
  const{nav,body}=trappedLeg(),first=nav.waypoint(body,goal,1)!;
  for(let i=0;i<100;i++)expect(nav.waypoint(body,{x:goal.x+(i%3),y:goal.y-(i%2)},1)).toEqual(first);
 });
 it('expires a completely stationary native body only after eight new decision versions',()=>{
  const{nav,body}=trappedLeg(),actor=Object.assign(body,{decisionVersion:10}),first=nav.waypoint(actor,goal,1)!;
  expect(first).toEqual({x:496,y:880});
  for(let i=0;i<100;i++)expect(nav.waypoint(actor,{x:goal.x+(i%3),y:goal.y-(i%2)},1)).toEqual(first);
  for(let i=1;i<8;i++){actor.decisionVersion=10+i;expect(nav.waypoint(actor,goal,1)).toEqual(first);for(let j=0;j<20;j++)expect(nav.waypoint(actor,goal,1)).toEqual(first);}
  actor.decisionVersion=18;expect(nav.waypoint(actor,goal,1)!.y).toBeLessThan(800);
 });
 it('keeps a slowly advancing visible leg instead of expiring healthy progress',()=>{
  const geometry=createRoomTemplateGeometry(ROOM_TEMPLATES['diagnostic-gallery'],'slow'),nav=new FacilityNavigation(geometry),body={x:512,y:880,radius:28},first=nav.waypoint(body,goal,1)!;
  for(let i=0;i<40;i++){
   const dx=first.x-body.x,dy=first.y-body.y,d=Math.hypot(dx,dy);body.x+=dx/d*.25;body.y+=dy/d*.25;
   expect(nav.waypoint(body,goal,1)).toEqual(first);expect(canTraverseExpedition(geometry,body,first,28)).toBe(true);
  }
 });
});
