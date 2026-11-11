import {afterEach, describe, expect, it, vi} from 'vitest';
import {DepthGame} from '../../../src/DepthGame';
import {InputController} from '../../../src/InputController';
import {expeditionRewardOffers} from '../../../src/game/roguelike/expedition';
import {applyNativeImmediateKey, recordNativeObservedEvent, nativeWarningHazards, nativePressure, nativeStallReason, nativeDiagnosticBurst} from './sim-native-emulation.ts';

class Canvas extends EventTarget {focus(){} setPointerCapture(){} }
afterEach(()=>vi.unstubAllGlobals());
function game(){const g=new DepthGame();g.newRun(1729,{rigSelect:true});g.chooseRig('breacher');g.chooseMutation(expeditionRewardOffers(g.expedition)[0].id);g.player.angle=.3;return g;}
function pair(){
 const native=game(),sim=game(),doc=Object.assign(new EventTarget(),{hidden:false}),canvas=new Canvas();
 vi.stubGlobal('document',doc);vi.stubGlobal('window',new EventTarget());
 let point={x:native.player.x+160,y:native.player.y+120};
 const pointer=vi.fn(()=>point);
 const controller=new InputController(native,{canvas,pointer},()=>{});
 canvas.dispatchEvent(Object.assign(new Event('pointermove'),{pointerType:'mouse',clientX:200,clientY:200}));
 const read=vi.fn(()=>({x:0,y:0,fire:false,angle:point?Math.atan2(point.y-sim.player.y,point.x-sim.player.x):null,aimPoint:point,autoAim:false}));
 const key=key=>{for(const type of['keydown','keyup'])doc.dispatchEvent(Object.assign(new Event(type),{key,repeat:false}));};
 const nativeThrows=[],simThrows=[];
 const ng=native.grenade.bind(native),sg=sim.grenade.bind(sim);
 native.grenade=()=>{nativeThrows.push(native.player.angle);ng();};sim.grenade=()=>{simThrows.push(sim.player.angle);sg();};
 return{native,sim,key,read,pointer,controller,nativeThrows,simThrows,setPoint:p=>{point=p;}};
}
describe('InputController immediate-key emulation, without a browser',()=>{
 it('G alone keeps previous facing; v7 eager cursor-facing demonstrably differs',()=>{
  const p=pair(),oldAngle=p.read().angle;p.read.mockClear();p.key('g');applyNativeImmediateKey(p.sim,'g',p.read);
  expect(p.nativeThrows).toEqual([.3]);expect(p.simThrows).toEqual(p.nativeThrows);expect(oldAngle).not.toBe(.3);
  expect(p.read).not.toHaveBeenCalled();expect(p.pointer).not.toHaveBeenCalled();
  expect(p.sim.bullets[0].request.angle).toBe(p.native.bullets[0].request.angle);
 });
 it('F then G retains ability facing even after the runner moves the pointer back to its weapon target',()=>{
  const p=pair();p.setPoint({x:p.sim.player.x+120,y:p.sim.player.y+160});p.key('f');applyNativeImmediateKey(p.sim,'f',p.read);
  const abilityFacing=p.native.player.angle;expect(p.sim.player.angle).toBe(abilityFacing);
  p.setPoint({x:p.sim.player.x+160,y:p.sim.player.y-120});const v7RestoredFacing=p.read().angle;p.read.mockClear();p.pointer.mockClear();
  p.key('g');applyNativeImmediateKey(p.sim,'g',p.read);
  expect(p.simThrows).toEqual(p.nativeThrows);expect(p.nativeThrows).toEqual([abilityFacing]);expect(v7RestoredFacing).not.toBe(abilityFacing);
  expect(p.read).not.toHaveBeenCalled();expect(p.pointer).not.toHaveBeenCalled();
 });
 it('Shift then G refreshes intent for Shift and preserves that immediate facing for G',()=>{
  const p=pair();p.key('Shift');applyNativeImmediateKey(p.sim,'Shift',p.read);
  expect(p.sim.abilities.dashing).toBe(true);expect(p.native.abilities.dashing).toBe(true);
  expect(p.sim.player.angle).toBe(p.native.player.angle);expect(p.read).toHaveBeenCalledTimes(1);expect(p.pointer).toHaveBeenCalledTimes(1);
  p.setPoint({x:1000,y:20});p.key('g');applyNativeImmediateKey(p.sim,'g',p.read);expect(p.simThrows).toEqual(p.nativeThrows);
  expect(p.read).toHaveBeenCalledTimes(1);expect(p.pointer).toHaveBeenCalledTimes(1);
 });
 it.each(['r','e','2'])('nonability key%s never refreshes aim',key=>{
  const p=pair();p.key(key);applyNativeImmediateKey(p.sim,key,p.read);
  expect(p.native.player.angle).toBe(.3);expect(p.sim.player.angle).toBe(.3);expect(p.read).not.toHaveBeenCalled();expect(p.pointer).not.toHaveBeenCalled();
  expect(p.sim.combat.snapshot).toEqual(p.native.combat.snapshot);
 });
 it('a null pointer still admits an ability key and retains existing facing',()=>{
  const p=pair();p.setPoint(null);p.key('q');applyNativeImmediateKey(p.sim,'q',p.read);
  expect(p.sim.player.angle).toBe(.3);expect(p.native.player.angle).toBe(.3);expect(p.sim.stats.abilityUses).toEqual(p.native.stats.abilityUses);
 });
});
describe('native observation and diagnostic stepping',()=>{
 it('retains warnings across a boundary until their exact native lifetime, including the default800ms',()=>{
  const events=[];recordNativeObservedEvent(events,{type:'enemy-warning',x:1,y:2},10);
  recordNativeObservedEvent(events,{type:'enemy-warning',x:3,y:4,targetX:7,targetY:8,radius:90,durationMs:400},10);
  expect(nativeWarningHazards(events,10.399)).toEqual([{x:1,y:2,radius:50},{x:7,y:8,radius:90}]);
  expect(nativeWarningHazards(events,10.4)).toEqual([{x:1,y:2,radius:50}]);expect(nativeWarningHazards(events,10.8)).toEqual([]);
  expect(events).toHaveLength(2); // Expiry filters the observer; ordinary route transitions do not clear its buffer.
 });
 it('excludes sync-corpse from the native300-event window and preserves its FIFO eviction',()=>{
  const events=[];recordNativeObservedEvent(events,{type:'enemy-warning',x:1,y:2},0);
  for(let i=0;i<350;i++)recordNativeObservedEvent(events,{type:'sync-corpse',x:i,y:0,id:i},0);
  expect(events).toHaveLength(1);expect(nativeWarningHazards(events,.1)).toHaveLength(1);
  for(let i=0;i<300;i++)recordNativeObservedEvent(events,{type:'shot',x:i,y:0},0);
  expect(events).toHaveLength(300);expect(events[0].x).toBe(0);expect(events.at(-1).x).toBe(299);expect(nativeWarningHazards(events,.1)).toEqual([]);
 });
 it('counts Queen and nest targets in pressure, without counting dead or duplicate positive targets',()=>{
  const g=game();vi.spyOn(g.enemies,'snapshot','get').mockReturnValue({enemies:[{health:1},{health:0}]});
  vi.spyOn(g,'targets').mockReturnValue([{id:1,health:1},{id:-1,health:2800},{id:-2,health:100},{id:-3,health:0}]);
  expect(nativePressure(g)).toBe(15); // v7 counted5 and could omit the native diagnostic burst.
 });
 it('a native deadline prevents the pressure query and diagnostic burst; a terminal burst frame stops later frames',()=>{
  const g=game(),advance=vi.fn();g.elapsed=45.001;
  const targets=vi.spyOn(g,'targets').mockImplementation(()=>{throw Error('Pressure must follow deadline');});
  expect(nativeDiagnosticBurst(g,0,0,240,-1,advance)).toEqual({reason:'no-combat-progress-45s',hardest:-1});
  expect(advance).not.toHaveBeenCalled();expect(targets).not.toHaveBeenCalled();
  g.elapsed=1;targets.mockReturnValue(Array.from({length:9},(_,i)=>({id:-i-1,health:1})));
  advance.mockImplementation(()=>g.pause());
  expect(nativeDiagnosticBurst(g,1,0,240,-1,advance)).toEqual({reason:null,hardest:45});
  expect(advance).toHaveBeenCalledExactlyOnceWith(1000/15);
 });
 it('uses strict45s/no-progress and room deadlines before any hardest-moment burst',()=>{
  expect(nativeStallReason(45,0,0,240)).toBeNull();expect(nativeStallReason(45.001,0,0,240)).toBe('no-combat-progress-45s');
  expect(nativeStallReason(240,239,0,240)).toBeNull();expect(nativeStallReason(240.001,239,0,240)).toBe('max-room-seconds');
  expect(nativeStallReason(241,0,0,240)).toBe('no-combat-progress-45s');expect(nativeStallReason(300,299,0,360)).toBeNull();
 });
});
