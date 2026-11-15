import {beforeAll, expect, it} from 'vitest';
import * as T from 'three';
import {loadModels} from '../../../tests/loadModels';
import {alien, disposeModel} from '../models';
import {ACTOR_OFFSET_FRACTION, ACTOR_IMPULSE_SECONDS, HEAVY_HOLD_SECONDS} from './EnemyMotion';

beforeAll(loadModels);
const families = ['crawler', 'spitter', 'brute', 'stalker', 'carrier', 'queen'];

it('keeps all living roots exact and directional offsets bounded through impact, warning and recovery', () => {
  for (const family of families) {
    const model = alien(family, true);
    model.root.position.set(3, 0, 5);
    const state = model.root.userData.motion;
    const restBodyY = model.body.position.y;
    try {
      for (let i = 0; i < 240; i++) {
        if (i % 30 === 0) model.hit!(1, i / 30 * Math.PI / 4, true);
        model.setThreat!(i < 60 ? 1000 - i * 16 : 0, i < 60 ? 'spit' : null);
        model.animate(i / 60, 1, .7);
        expect(model.root.position.toArray()).toEqual([3, 0, 5]);
        expect(Math.hypot(state.offsetX, state.offsetZ)).toBeLessThanOrEqual(model.root.userData.colliderRadius * ACTOR_OFFSET_FRACTION + 1e-10);
        // Small actors may lift on heavy impact for the same <=250ms window;
        // legacy Queen emergence retains its conservative .19m depth.
        expect(model.body.position.y - restBodyY).toBeLessThanOrEqual(.24);
        expect(restBodyY - model.body.position.y).toBeLessThanOrEqual(.19 + 1e-10);
        expect(state.holdMs).toBeLessThanOrEqual(HEAVY_HOLD_SECONDS * 1000);
        expect(model.body.scale.y).toBeGreaterThanOrEqual(.59);
        expect(model.body.quaternion.toArray().every(Number.isFinite)).toBe(true);
      }
    } finally { disposeModel(model.root); }
  }
});

it('has an unmistakable held native warning through its last millisecond without replay-clock drift', () => {
  for (const family of ['brute', 'spitter']) {
    const model = alien(family);
    const state = model.root.userData.motion;
    try {
      model.animate(0, 0, 0);
      for (const [i, remaining] of [850, 600, 300, 1].entries()) {
        model.setThreat!(remaining, family === 'brute' ? 'charge' : 'spit');
        model.animate((i + 1) / 60, 0, 0);
        expect(state.anticipation).toBeCloseTo(1 - remaining / 850, 10);
        expect(Math.abs(model.body.rotation.x)).toBeGreaterThan(.09);
        const q = model.body.quaternion.clone();
        model.animate((i + 1) / 60, 0, 0);
        expect(model.body.quaternion.angleTo(q)).toBeLessThan(1e-7);
      }
      model.setThreat!(0, null); model.attack!(); model.animate(.1, 0, 0);
      expect(state.anticipation).toBe(0);
    } finally { disposeModel(model.root); }
  }
});

it('prevents heavy holds from stacking and clears secondary impulses for reduced motion while paused', () => {
  const model = alien('crawler'), state = model.root.userData.motion;
  try {
    model.animate(0, 1, 0);
    for (let i = 0; i < 8; i++) { model.hit!(1, 0, true); model.animate((i + 1) / 60, 1, 0); }
    expect(state.holdMs).toBe(0);
    model.setMotionOptions!(0, true); model.animate(8 / 60, 0, 0);
    expect(state.holdMs).toBe(0); expect(Math.hypot(state.offsetX, state.offsetZ)).toBe(0);
    model.setThreat!(400, 'spit'); model.animate(9 / 60, 0, 0);
    expect(Math.abs(model.body.rotation.x)).toBe(0); expect(Math.abs(model.body.rotation.z)).toBe(0);
  } finally { disposeModel(model.root); }
});

it('seeds source clips by native actor id and reuses all geometry/materials through status and pool reset', () => {
  const a = alien('crawler'), b = alien('crawler');
  const resources = (m: typeof a) => { const out: unknown[] = []; m.root.traverse(o => {if (o instanceof T.Mesh) out.push(o.geometry, o.material);}); return out; };
  const before = resources(a);
  try {
    a.setMotionSeed!(12); b.setMotionSeed!(13);
    for (let i = 0; i < 20; i++) { a.animate(i / 60, 1, 0); b.animate(i / 60, 1, 0); }
    expect(a.root.getObjectByName('leg0_lower')!.quaternion.angleTo(b.root.getObjectByName('leg0_lower')!.quaternion)).toBeGreaterThan(.01);
    a.setAffliction!({chilled: true, frozen: true, burning: false}); a.animate(.5, 0, 0);
    const q = a.root.getObjectByName('leg0_lower')!.quaternion.clone(); a.animate(.6, 1, 0);
    expect(a.root.getObjectByName('leg0_lower')!.quaternion.toArray()).toEqual(q.toArray());
    a.reset!(); expect(resources(a)).toEqual(before);
  } finally { disposeModel(a.root); disposeModel(b.root); }
});

// M10 replaces the old .055m/downward-only silhouette pin with the authorised
// per-body-radius impulse window while retaining the exact simulation root.
it('limits impact translation to 35 percent of the native radius and clears it within 250ms', () => {
  for (const family of families) {
    const model = alien(family);
    try {
      model.animate(0, 0, 0); model.hit!(1, Math.PI / 3, true);
      for (let frame = 1; frame <= 30; frame++) {
        model.animate(frame / 60, 0, 0);
        const state = model.root.userData.motion;
        expect(Math.hypot(state.offsetX, state.offsetZ)).toBeLessThanOrEqual(state.offsetLimit + 1e-10);
        if (frame / 60 >= ACTOR_IMPULSE_SECONDS) expect(Math.hypot(state.offsetX, state.offsetZ)).toBe(0);
        expect(model.root.position.toArray()).toEqual([0, 0, 0]);
      }
    } finally { disposeModel(model.root); }
  }
});

it('poses native melee warning, strike and cancel snapshots without inventing a strike on cancellation', () => {
  const model = alien('crawler'), shape = {kind:'arc' as const, range:48, halfAngle:.8, width:0};
  try {
    for(let frame=0; frame<20; frame++) model.animate(frame/60,0,0);
    model.setAttackState!('windup', .65, .4, shape); model.animate(.35,0,0);
    expect(model.root.userData.motion.anticipation).toBe(.65);
    const coiled = model.body.rotation.x;
    expect(coiled).toBeLessThan(-.20);
    model.setAttackState!('approach',0,.4,shape); model.animate(.37,0,0);
    expect(model.root.userData.motion.anticipation).toBe(0);
    expect(model.body.position.length()).toBeCloseTo(Math.abs(model.body.position.y));
    model.setAttackState!('strike',0,.4,shape); model.animate(.39,0,0);
    expect(model.root.userData.motion.attackPhase).toBe('strike');
    expect(model.root.userData.motion.strikeRange).toBe(1.5);
    expect(Math.hypot(model.body.position.x,model.body.position.z)).toBeGreaterThan(.02);
    model.setAttackState!('recovery',.3,.4,shape); model.animate(.48,0,0);
    expect(model.root.userData.motion.attackPhase).toBe('recovery');
    expect(model.body.quaternion.toArray().every(Number.isFinite)).toBe(true);
    model.reset!(); expect(model.root.userData.motion.attackPhase).toBe('approach');
  } finally { disposeModel(model.root); }
});

it('raises the Brute shield fists using its actual two-bone chains, then slams them down', () => {
  const model=alien('brute'), hand=model.root.getObjectByName('clawr')!, head=model.root.getObjectByName('head')!;
  const point=new T.Vector3(), headPoint=new T.Vector3();
  try {
    for(let frame=0;frame<30;frame++)model.animate(frame/60,0,0);
    model.setAttackState!('windup',.85,0,{kind:'arc',range:100,halfAngle:1,width:0});model.animate(.51,0,0);
    const raised=hand.getWorldPosition(point).y, skull=head.getWorldPosition(headPoint).y;
    expect(raised).toBeGreaterThan(skull-.1);
    model.setAttackState!('strike',0,0);model.animate(.55,0,0);model.animate(.58,0,0);
    expect(hand.getWorldPosition(point).y).toBeLessThan(raised-.15);
  } finally {disposeModel(model.root);}
});

it('gives the standard breach entrances a compressed reach and articulated climb before the settled stance', () => {
  for(const family of ['crawler','brute']){
    const model=alien(family);
    try{
      model.animate(0,0,0);const initial=model.body.scale.clone(),bone=model.root.getObjectByName(family==='crawler'?'leg0_upper':'shoulderr')!,reach=bone.quaternion.clone();
      for(let frame=1;frame<=30;frame++)model.animate(frame/60,0,0);
      expect(model.body.scale.distanceTo(initial)).toBeGreaterThan(.2);
      expect(bone.quaternion.angleTo(reach)).toBeGreaterThan(.05);
      expect(model.body.scale.toArray()).toEqual([1,1,1]);
      expect(model.root.position.toArray()).toEqual([0,0,0]);
    }finally{disposeModel(model.root);}
  }
});

it('uses the current legacy attack facing while retaining the locked angle of native melee strikes', () => {
  const model=alien('brute'),worldOffset=new T.Vector3();
  try{
    for(let frame=0;frame<30;frame++)model.animate(frame/60,0,.9);
    model.setAttackState!('approach',0,0);model.attack!();model.animate(.55,0,.9);
    const state=model.root.userData.motion;
    worldOffset.set(state.offsetX,0,state.offsetZ).applyQuaternion(model.root.quaternion).normalize();
    expect(worldOffset.dot(new T.Vector3(Math.cos(.9),0,Math.sin(.9)))).toBeGreaterThan(.99);
    model.setAttackState!('strike',0,.4,{kind:'arc',range:100,halfAngle:1,width:0});model.animate(.58,0,.9);
    worldOffset.set(state.offsetX,0,state.offsetZ).applyQuaternion(model.root.quaternion).normalize();
    expect(worldOffset.dot(new T.Vector3(Math.cos(.4),0,Math.sin(.4)))).toBeGreaterThan(.99);
  }finally{disposeModel(model.root);}
});
