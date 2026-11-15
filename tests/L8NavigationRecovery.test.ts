import {describe,it,expect} from 'vitest';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';
import {createRoomTemplateGeometry,canTraverseExpedition} from '../src/game/world/expeditionGeometry';
import {clearRectSweep} from '../src/game/world/facilityGeometry';
import {FacilityNavigation} from '../src/game/world/FacilityNavigation';
describe('native-clear navigation legs',()=>{
 it('escapes the real rounded bed corner that the old square expansion stranded',()=>{
  const g=createRoomTemplateGeometry(ROOM_TEMPLATES['residential-gallery'],'corner'),nav=new FacilityNavigation(g),body={x:515.1500765728059,y:167.78745550451606,radius:28};
  const next=nav.waypoint(body,{x:984,y:740},1)!;expect(next).not.toEqual(body);expect(canTraverseExpedition(g,body,next,28)).toBe(true);
 });
 it('retains a single-cell fallback leg while the native contact berth moves beside a rounded corner',()=>{
  const g=createRoomTemplateGeometry(ROOM_TEMPLATES['awakening-bay'],'berth'),nav=new FacilityNavigation(g),body={x:144,y:624,radius:28},marine={x:128,y:688};
  const first=nav.waypoint(body,marine,1)!;expect(first).toEqual({x:112,y:624});body.x=141;
  const berth={x:132.3589716677784,y:643.9652198143388};expect(nav.waypoint(body,berth,1)).toEqual(first);expect(canTraverseExpedition(g,body,first,28)).toBe(true);
 });
 it('matches production continuous rectangle sweeps, including tangent corners and thin solids',()=>{
  const rect={x:200,y:200,width:160,height:80},g={...createRoomTemplateGeometry(ROOM_TEMPLATES['residential-gallery'],'sweep'),bounds:{x:0,y:0,width:1200,height:960},boundary:undefined,voids:undefined,blockers:[rect]};
  for(const radius of [0,9,16,28,38])for(let x=140;x<420;x+=14)for(let y=140;y<340;y+=17){const a={x,y},b={x:280+(x-280)*.3,y:240+(y-240)*1.7};expect(clearRectSweep(a,b,radius,rect),JSON.stringify({a,b,radius})).toBe(canTraverseExpedition(g,a,b,radius));}
 });
 it('keeps a clear leg while a nearby moving flank changes its grid cell, and replans for a moved goal',()=>{
  const g=createRoomTemplateGeometry(ROOM_TEMPLATES['awakening-bay'],'flank'),nav=new FacilityNavigation(g),body={x:480,y:784,radius:17},goal={x:475,y:367};
  const first=nav.waypoint(body,goal,1)!;expect(first).not.toEqual(body);expect(canTraverseExpedition(g,body,first,17)).toBe(true);
  for(const x of [477,481,470,479])expect(nav.waypoint(body,{x,y:367},1)).toEqual(first);
  const moved=nav.waypoint(body,{x:1000,y:440},1);expect(moved).not.toEqual(first);
  const fresh=new FacilityNavigation(g);expect(nav.waypoint(body,{x:1000,y:440},2)).toEqual(fresh.waypoint({...body},{x:1000,y:440},2));
 });
});
