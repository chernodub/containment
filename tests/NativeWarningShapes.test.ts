import {expect,it} from 'vitest';
import * as T from 'three';
import type {DepthGame} from '../src/DepthGame';
import type {ExpeditionGeometry} from '../src/game/world/expeditionGeometry';
import {ENEMY_ATTACK_SHAPES as SHAPES} from '../src/game/enemies/attackShapes';
import {AttackEffects} from '../src/render/AttackEffects';
import type {Telegraph} from '../src/render/vfx/TelegraphBatch';
const geometry={bounds:{x:0,y:0,width:2000,height:2000},blockers:[],boundaryWalls:[]} as unknown as ExpeditionGeometry;
function enemy(kind:'charge'|'spit',windupMs=500){return {id:7,x:500,y:500,radius:28,health:100,pendingAttack:kind,windupMs,lockX:kind==='charge'?200:700,lockY:kind==='charge'?0:500} as DepthGame['enemies']['snapshot']['enemies'][number];}
it.each(['charge','spit'] as const)('uses native %s swept size and clock, then clears at resolution or cancellation',kind=>{
 const fx=new AttackEffects(new T.Scene()),camera=new T.Camera(),shapes:Telegraph[]=[];
 const read=()=>{shapes.length=0;fx.forEachHostilePriority(s=>shapes.push({...s}));};
 try{
  fx.event({type:'enemy-warning',id:7,family:kind==='charge'?'brute':'spitter',x:500,y:500,targetX:700,targetY:500,radius:32,durationMs:500});
  fx.syncEnemyWarnings([enemy(kind)],geometry);fx.update(.1,camera,[]);read();
  expect(shapes).toHaveLength(1);expect(shapes[0].shape).toBe(kind==='charge'?'line':'circle');
  expect(shapes[0].width).toBe((kind==='charge'?28:SHAPES.spitterProjectileRadius)*2/32);
  expect(shapes[0].length).toBeCloseTo(kind==='charge'?SHAPES.chargeSpeed*SHAPES.chargeDurationMs/1000/32:0);
  if(kind==='spit'){expect(shapes[0].radius).toBe(SHAPES.spitterProjectileRadius/32);expect(shapes[0].x).toBe(700/32);}
  // Presentation time alone cannot consume a slow/frozen native wind-up.
  fx.update(2,camera,[]);read();expect(shapes).toHaveLength(1);expect(shapes[0].progress).toBe(0);
  fx.syncEnemyWarnings([enemy(kind,250)],geometry);read();expect(shapes[0].progress).toBe(.5);
  fx.syncEnemyWarnings([enemy(kind,0)],geometry);fx.update(0,camera,[]);read();expect(shapes).toEqual([]);
  fx.event({type:'enemy-warning',id:7,family:'brute',x:500,y:500,durationMs:500});fx.syncEnemyWarnings([],geometry);read();expect(shapes).toEqual([]);
 }finally{fx.dispose();}
});
it('clips the warning capsule to the same authored traversal blockers as the native attack',()=>{
 const fx=new AttackEffects(new T.Scene()),shapes:Telegraph[]=[];
 try{
  fx.event({type:'enemy-warning',id:7,family:'brute',x:500,y:500,durationMs:500});
  fx.syncEnemyWarnings([enemy('charge')],{...geometry,blockers:[{x:600,y:400,width:40,height:200}]});
  fx.forEachHostilePriority(s=>shapes.push({...s}));expect(shapes[0].length!*32).toBeCloseTo(72,0);
 }finally{fx.dispose();}
});
