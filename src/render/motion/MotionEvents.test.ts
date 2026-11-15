import {expect, it, vi} from 'vitest';
import * as T from 'three';
import {actorDeathCue, actorImpact, enemyMotionAim, MarineActionMotion} from './MotionEvents';
import type {ActorModel} from '../models';
import type {MarineMotion} from './MarineMotion';

it('uses native damage direction and weight without altering the receipt or root', () => {
  const root = new T.Group(), hit = vi.fn(), model = {root, hit} as unknown as ActorModel;
  const event = Object.freeze({type: 'hit' as const, x: 64, y: 96, sourceX: 64, sourceY: 0, damage: 42, lethal: false});
  actorImpact(model, event);
  expect(hit).toHaveBeenCalledWith(1, Math.PI / 2, true);
  expect(root.position.toArray()).toEqual([0, 0, 0]);
  expect(Object.isFrozen(event)).toBe(true);
  actorImpact(undefined, event);
});

it('locks body facing to the native spit target and charge vector while the marine moves', () => {
  const enemy = {type: 'spitter', x: 100, y: 100, targetX: 0, targetY: 0, lockX: 200, lockY: 100, pendingAttack: 'spit' as 'spit' | 'charge' | null, chargeMs: 0};
  expect(enemyMotionAim(enemy, {x: 0, y: 100})).toBe(0);
  enemy.pendingAttack = 'charge'; enemy.lockX = 0; enemy.lockY = -50;
  expect(enemyMotionAim(enemy, {x: 999, y: 999})).toBe(-Math.PI / 2);
  enemy.pendingAttack = null; enemy.chargeMs = 100;
  expect(enemyMotionAim(enemy, {x: 999, y: 999})).toBe(-Math.PI / 2);
});

it('retains only existing last-living status for death cues, with frozen priority', () => {
  const model = {root: new T.Group()} as ActorModel;
  expect(actorDeathCue(model)).toBe('none');
  model.root.userData.visualStatus = {shocked: true}; expect(actorDeathCue(model)).toBe('arc');
  model.root.userData.visualStatus = {frozen: true, burning: true, shocked: true}; expect(actorDeathCue(model)).toBe('frost');
});

it('advances accepted cast body punctuation only in presentation time and retires it', () => {
  const setAction = vi.fn(), motion = new MarineActionMotion({setAction} as unknown as MarineMotion);
  motion.update(0);
  motion.event({type: 'ability', x: 0, y: 0, ability: {ability: 'glacier', slot: 'power', rig: 'cryo', element: 'cryo', phase: 'cast', durationMs: 150}});
  motion.update(.05); const progress = setAction.mock.lastCall![1];
  motion.update(.05); expect(setAction.mock.lastCall![1]).toBe(progress);
  for (let i = 2; i <= 6; i++) motion.update(i * .05);
  expect(setAction).toHaveBeenLastCalledWith('glacier', .42);
  motion.event({type:'ability',x:0,y:0,ability:{ability:'glacier',slot:'power',rig:'cryo',element:'cryo',phase:'impact'}});
  motion.update(.35);expect(setAction.mock.lastCall![1]).toBeGreaterThan(.43);
  for(let i=8;i<=13;i++)motion.update(i*.05);
  expect(setAction).toHaveBeenLastCalledWith('',0);
});

it('uses the native melee vector through windup strike and recovery',()=>{
 const enemy={type:'crawler',x:0,y:0,targetX:100,targetY:0,lockX:0,lockY:0,pendingAttack:null,chargeMs:0,meleePhase:'windup',meleeAngle:1.2};
 for(const phase of ['windup','strike','recovery']){enemy.meleePhase=phase;expect(enemyMotionAim(enemy,{x:-100,y:0})).toBe(1.2);}
 enemy.meleePhase='approach';expect(enemyMotionAim(enemy,{x:-100,y:0})).toBe(0);
});
