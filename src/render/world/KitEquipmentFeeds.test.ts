import {describe,expect,it} from 'vitest';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {ROOM_STORY_ROUTE} from '../../game/roguelike/storyRooms';
import type {RoomTemplate} from '../../game/roguelike/types';
import {equipmentReservations} from './WorldDressing';
import {kitEquipmentFeeds} from './KitEquipmentFeeds';
const base:RoomTemplate={id:'receiving',name:'Feed proof',width:1000,height:800,spawn:{x:100,y:400},exit:{x:900,y:400},obstacles:[],breaches:[]};
describe('architecture-owned equipment feeds',()=>{
 it('uses actual shared partition chains rather than point-touching or remote equipment',()=>{
  const t={...base,obstacles:[{x:0,y:200,width:80,height:100},{x:80,y:200,width:80,height:100},{x:160,y:200,width:80,height:100},{x:240,y:300,width:80,height:80},{x:450,y:300,width:80,height:100}]},route=kitEquipmentFeeds(t);
  expect(t.obstacles.slice(0,3).map(r=>route(r).reason)).toEqual(['hull-fed','hull-fed','hull-fed']);
  expect(route(t.obstacles[3]).reason).toBe('remote-hull');expect(route(t.obstacles[4]).reason).toBe('remote-hull');
 });
 it('connects a nearby free machine edge to its nearest actual hull with no zero legs',()=>{
  const r={x:60,y:300,width:80,height:100},feed=kitEquipmentFeeds({...base,obstacles:[r]})(r);
  expect(feed).toEqual({reason:'local-feed',path:[{x:60,y:300},{x:0,y:300}]});
  expect(feed.path.every((p,i)=>!i||Math.hypot(p.x-feed.path[i-1].x,p.y-feed.path[i-1].y)>0)).toBe(true);
 });
 it('does not invent floor feeds for tiles reserved on a sealed machine bay',()=>{
  const t={...base,voids:[[{x:0,y:200},{x:200,y:200},{x:200,y:500},{x:0,y:500}]]};
  expect(kitEquipmentFeeds(t)({x:30,y:250,width:48,height:42})).toEqual({reason:'structural-reservation',path:[]});
 });
 it.each(ROOM_STORY_ROUTE.map(r=>r.templateId))('%s keeps every admitted spur short and physically hull-rooted',id=>{
  const t=ROOM_TEMPLATES[id],route=kitEquipmentFeeds(t),before=JSON.stringify(t);
  for(const r of equipmentReservations(t,id)){
   const feed=route(r);if(feed.reason!=='local-feed'){expect(feed.path).toHaveLength(0);continue;}
   const hull=t.boundary??[{x:0,y:0},{x:t.width,y:0},{x:t.width,y:t.height},{x:0,y:t.height}],last=feed.path.at(-1)!;
   expect(hull.some((a,i)=>{const b=hull[(i+1)%hull.length];return Math.abs((b.x-a.x)*(last.y-a.y)-(b.y-a.y)*(last.x-a.x))<1e-6&&last.x>=Math.min(a.x,b.x)&&last.x<=Math.max(a.x,b.x)&&last.y>=Math.min(a.y,b.y)&&last.y<=Math.max(a.y,b.y);})).toBe(true);
   expect(feed.path.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-feed.path[i].x,p.y-feed.path[i].y),0)).toBeLessThanOrEqual(128);
  }
  expect(JSON.stringify(t)).toBe(before);
 });
 it('Workshop hull-built reservations carry no cross-room run',()=>{
  const t=ROOM_TEMPLATES['infested-workshop'],route=kitEquipmentFeeds(t),feeds=equipmentReservations(t,t.id).slice(0,8).map(route);
  expect(feeds.every(f=>f.path.length===0)).toBe(true);expect(feeds.some(f=>f.reason==='hull-fed')).toBe(true);
 });
});
