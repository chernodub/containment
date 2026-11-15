import assert from 'node:assert/strict';
import {test} from 'vitest';
import {L8_CAPTURE_API as api,L8_CAPTURE_ROOMS} from './l8-capture-data.mjs';
import {stageGraphicsKiting,SCENARIOS} from './scenarios.mjs';

test('all20 G6 fixtures use a real native arena and pack the unchanged ten-threat spread',async()=>{
 const previous=globalThis.window;
 try{for(const room of L8_CAPTURE_ROOMS){
  const geometry=api.geometry(api.templates[room.id],'offline-'+room.id),actors=[],inputs=[],game={geometry,player:{...room.spawn,radius:16},stats:{shotsFired:0},bullets:[],enemies:{reset(){}},switchWeapon(){},grenade(){this.bullets.push({kind:'grenade'});}};
  const debug={game,gotoRoom:async()=>{},prepare:async()=>{},invulnerable(){},measureLuminance:false,renderer:{setQuality(){}},canStand:(x,y,r)=>api.occupy(geometry,{x,y},r),clearShot:(x,y,from=game.player)=>api.shot(geometry,from,{x,y}),setInput:i=>inputs.push(i),step(){if(inputs.at(-1)?.fire)game.stats.shotsFired++;},spawn:(kind,x,y)=>{if(!api.occupy(geometry,{x,y},28))return false;const id=actors.length+1;actors.push({kind,x,y,id});return id;}};
  globalThis.window={__containmentDebug:debug};
  await stageGraphicsKiting(room.id,{tier:'high',arena:room.arena});
  assert.deepEqual(debug.l8FixtureProof.arena,room.arena);assert.deepEqual({x:game.player.x,y:game.player.y},room.arena);assert(actors.length>=10,room.id);assert(inputs.at(-1).fire);assert.equal(debug.l8FixtureProof.cameraOverride,false);
  for(let i=0;i<actors.length;i++)for(let j=0;j<i;j++)assert(Math.hypot(actors[i].x-actors[j].x,actors[i].y-actors[j].y)>=55-1e-6,room.id+' native spacing');
 }}finally{globalThis.window=previous;}
});
test('G6 remains a native self-contained browser function without a camera override',()=>{
 const g6=SCENARIOS.find(s=>s.id==='g6-kiting');assert(g6);assert(!/cameraZoom|\.zoom\s*[=*]|cameraRig\.reset/.test(g6.setup.toString()));assert(!/import\s*\(/.test(g6.setup.toString()));assert.match(g6.setup.toString(),/Authored fight arena/);
});
