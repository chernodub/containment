import {expect,it} from 'vitest';
import * as T from 'three';
import {AttackEffects} from '../AttackEffects';
import {DepthGame} from '../../DepthGame';
import {MELEE_ATTACKS} from '../../game/enemies/meleeAttacks';

it.each(['crawler','stalker','brute','spitter','carrier'] as const)('%s shares the exact native strike footprint at lowest hostile weight',family=>{
  const game=new DepthGame(),scene=new T.Scene(),fx=new AttackEffects(scene);
  const spawned=game.enemies.spawn(family,500,500,false);if(!spawned.spawned)throw Error('spawn');
  const event=game.enemies.update(0,{x:520,y:500,radius:16}).find(e=>e.type==='melee-warning');
  if(event?.type!=='melee-warning')throw Error('native warning');
  fx.event({type:'enemy-warning',id:event.enemyId,family,x:event.x,y:event.y,angle:event.angle,meleeShape:event.shape,dangerWeight:'low',durationMs:event.durationMs});
  fx.syncEnemyWarnings(game.enemies.snapshot.enemies,game.geometry);fx.update(.001,new T.Camera(),[]);
  const mesh=scene.getObjectByName('hostile-warning-fills') as T.InstancedMesh;
  const matrix=new T.Matrix4(),scale=new T.Vector3(),position=new T.Vector3();mesh.getMatrixAt(0,matrix);scale.setFromMatrixScale(matrix);position.setFromMatrixPosition(matrix);
  const shape=MELEE_ATTACKS[family].shape;
  expect(mesh.count).toBe(1);expect(mesh.geometry.getAttribute('effectAlpha').getX(0)).toBeLessThanOrEqual(.48);
  if(shape.kind==='line'){
    expect(scale.x).toBeCloseTo((shape.range+shape.width)/64);expect(scale.y).toBeCloseTo(shape.width/64);
    expect(position.x).toBeCloseTo((500+shape.range*.5)/32);
  }else{
    expect(scale.x).toBeCloseTo(shape.range/32);expect(scale.y).toBeCloseTo(shape.range/32);
    expect(mesh.geometry.getAttribute('effectShape').getZ(0)).toBeCloseTo(shape.halfAngle);
    expect(position.x).toBeCloseTo(500/32);
  }
  const footprint:any[]=[];fx.forEachHostilePriority(s=>footprint.push(s));expect(footprint).toHaveLength(1);
  game.enemies.setSlow(event.enemyId,0);game.enemies.update(1,{x:520,y:500,radius:16});fx.syncEnemyWarnings(game.enemies.snapshot.enemies,game.geometry);fx.update(.001,new T.Camera(),[]);
  expect(mesh.count).toBe(0);fx.dispose();
});
