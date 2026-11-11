import {beforeAll,afterAll,it,expect} from 'vitest';
import {startHudHarness,stopHudHarness,mountHud} from './HudHarness';
import {ROOM_TEMPLATES} from '../src/game/roguelike/roomTemplates';

beforeAll(startHudHarness);
afterAll(stopHudHarness);
it.each([[1280,720],[1920,1080],[960,540]])('keeps native boss radar in the camera-reserved band at %ix%i',async(width,height)=>{
 const page=await mountHud(width,height),room=ROOM_TEMPLATES['reactor-vault'];
 try{
  const result=await page.evaluate(({roomWidth,roomHeight})=>{
   const boss=document.getElementById('boss-hud')!,radar=document.getElementById('radar-hud')!,map=document.getElementById('radar-map')!;
   map.setAttribute('viewBox',`0 0 ${roomWidth} ${roomHeight}`);boss.hidden=false;radar.hidden=false;
   const protectedBox=radar.getBoundingClientRect().toJSON();
   boss.hidden=true;const ordinary=radar.getBoundingClientRect().toJSON();
   return {protectedBox,ordinary};
  },{roomWidth:room.width,roomHeight:room.height});
  expect(result.protectedBox.top).toBeGreaterThanOrEqual(height*.74);
  expect(result.protectedBox.bottom).toBeLessThanOrEqual(height-8);
  expect(result.protectedBox.left).toBeGreaterThanOrEqual(8);
  expect(result.protectedBox.right).toBeLessThanOrEqual(width-8);
  expect(result.ordinary.top).toBeLessThan(result.protectedBox.top);
 }finally{await page.close();}
});
