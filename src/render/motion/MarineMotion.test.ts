import {beforeAll, expect, it} from 'vitest';
import * as T from 'three';
import {loadModels} from '../../../tests/loadModels';
import {instantiateAsset} from '../assets';
import {disposeModel} from '../models';
import {MarineMotion, MARINE_FOOT_CORRECTION, MARINE_HIT_PAUSE} from './MarineMotion';

beforeAll(loadModels);

/** Sample fixed bottom vertices actually weighted to each rendered shoe. */
function soleSampler(root: T.Object3D) {
  root.updateMatrixWorld(true);
  const point = new T.Vector3(), skins: T.SkinnedMesh[] = [];
  const selected: Array<Array<{mesh: T.SkinnedMesh; index: number; y: number}>> = [[], []];
  root.traverse(mesh => {
    if (!(mesh instanceof T.SkinnedMesh)) return;
    skins.push(mesh);mesh.skeleton.update();
    const indices = mesh.geometry.getAttribute('skinIndex'), weights = mesh.geometry.getAttribute('skinWeight');
    for (let index = 0; index < indices.count; index++) for (let side = 0; side < 2; side++) {
      let footWeight = 0;
      for (let lane = 0; lane < 4; lane++) {
        const bone = mesh.skeleton.bones[indices.getComponent(index, lane)].name;
        if (bone === `foot${side ? 'L' : 'R'}` || bone === `toe${side ? 'L' : 'R'}` || bone === `ankle${side ? 'L' : 'R'}`) footWeight += weights.getComponent(index, lane);
      }
      if (footWeight > .99) {
        mesh.getVertexPosition(index, point).applyMatrix4(mesh.matrixWorld);
        selected[side].push({mesh, index, y: point.y});
      }
    }
  });
  for (let side = 0; side < 2; side++) {
    selected[side].sort((a, b) => a.y - b.y);
    selected[side] = selected[side].slice(0, Math.max(3, Math.ceil(selected[side].length * .15)));
    expect(selected[side].length).toBeGreaterThanOrEqual(3);
  }
  return () => {
    root.updateMatrixWorld(true);
    for (const mesh of skins) mesh.skeleton.update();
    return selected.map(vertices => {
      const center = new T.Vector3();
      for (const {mesh, index} of vertices) {
        mesh.getVertexPosition(index, point).applyMatrix4(mesh.matrixWorld);center.add(point);
      }
      return center.multiplyScalar(1 / vertices.length);
    });
  };
}

/** Real prepared source skin and authored clips, with the same upper-body mask. */
function fixture(enabled = true) {
  const source = instantiateAsset('marine'), root = new T.Group(), body = new T.Group();
  root.add(body);body.add(source.root);source.root.rotation.y = -Math.PI / 2;
  const upper = new Set<string>();source.root.getObjectByName('ribs')!.traverse(o => upper.add(o.name));
  const mixer = new T.AnimationMixer(source.root);
  const actions = new Map(source.clips.map(clip => [clip.name, mixer.clipAction(new T.AnimationClip(clip.name, clip.duration, clip.tracks.filter(track => clip.name.endsWith('_delta') ? upper.has(track.name.split('.')[0]) : !upper.has(track.name.split('.')[0]))))]));
  let current = actions.get('stand')!;current.play();
  const pose = actions.get('shotgun_delta')!;pose.play();pose.paused = true;
  mixer.update(0);root.updateMatrixWorld(true);
  const bounds = new T.Box3().setFromObject(root, true), factor = 2.05 / bounds.getSize(new T.Vector3()).y;
  source.root.scale.setScalar(factor);body.position.y = -bounds.min.y * factor;
  const motion = new MarineMotion(root, source.root);
  const feet = ['footR', 'footL'].map(name => source.root.getObjectByName(name)!);
  const soles = soleSampler(root);
  let time = 0, visualTime = 0;
  function step(vx: number, vy: number, dt = 1 / 60, aim = 0, recoil = 0, reload = 0) {
    time += dt;root.position.x += vx * dt / 32;root.position.z += vy * dt / 32;root.rotation.y = Math.PI / 2 - aim;
    if (enabled) motion.begin(time, vx || vy ? 1 : 0, aim, vx, vy);
    const backwards = enabled ? motion.backwards : Math.cos(Math.atan2(vy, vx) - aim) < -.22;
    const next = actions.get(Math.hypot(vx, vy) > 3 ? backwards ? 'run_back' : 'run' : 'stand')!;
    if (next !== current) {current.fadeOut(.13);current = next;current.reset().play().fadeIn(.13);}
    const nextVisual = enabled ? motion.visualTime : time;
    current.setEffectiveTimeScale(enabled ? motion.speed : Math.max(.35, Math.hypot(vx, vy) / 220));
    source.root.rotation.y = -Math.PI / 2 + (enabled ? motion.gaitYaw : Math.atan2(Math.sin(aim - Math.atan2(vy, vx) - (backwards ? Math.PI : 0)), Math.cos(aim - Math.atan2(vy, vx) - (backwards ? Math.PI : 0))));
    mixer.update(Math.max(0, nextVisual - visualTime));visualTime = nextVisual;
    const raw = feet.map(foot => foot.getWorldPosition(new T.Vector3())), rawSoles = soles();
    if (enabled) motion.finish('shotgun', recoil, reload);
    root.updateMatrixWorld(true);
    const drawn = feet.map(foot => foot.getWorldPosition(new T.Vector3()));
    return {raw, drawn, rawSoles, soles: soles(), time};
  }
  return {root, source, motion, step, dispose() {mixer.stopAllAction();mixer.uncacheRoot(source.root);disposeModel(root);}};
}

it('reduces planted-foot world drift in forward, strafe and backpedal travel at varied speeds', () => {
  const metrics: Array<Record<string, number>> = [];
  for (const speed of [65, 220, 290]) for (const angle of [0, Math.PI / 2, Math.PI]) {
    const native = fixture(false), corrected = fixture(), sums = [0, 0], counts = [0, 0], soleSums = [0, 0];
    let maxCorrection = 0, maxSoleCorrection = 0;
    const previous: Array<T.Vector3[] | undefined> = [undefined, undefined];
    const previousSoles: Array<T.Vector3[] | undefined> = [undefined, undefined];
    try {
      for (let frame = 0; frame < 180; frame++) for (const [index, rig] of [native, corrected].entries()) {
        const sample = rig.step(Math.cos(angle) * speed, Math.sin(angle) * speed);
        if (index === 1) for (let foot = 0; foot < 2; foot++) {
          const offset = sample.raw[foot].distanceTo(sample.drawn[foot]);
          maxCorrection = Math.max(maxCorrection, offset);
          const soleOffset = sample.rawSoles[foot].distanceTo(sample.soles[foot]);
          maxSoleCorrection = Math.max(maxSoleCorrection, soleOffset);
          expect(soleOffset, `rendered sole correction ${speed}/${angle}/${frame}`).toBeLessThanOrEqual(MARINE_FOOT_CORRECTION + .002);
          expect(offset, `bounded foot correction ${speed}/${angle}/${frame}`).toBeLessThanOrEqual(MARINE_FOOT_CORRECTION + .002);
        }
        if (frame > 30 && previous[index]) for (let foot = 0; foot < 2; foot++) {
          const p = previous[index]![foot], q = sample.drawn[foot];
          if (p.y < .065 && q.y < .065) {
            sums[index] += Math.hypot(q.x - p.x, q.z - p.z);counts[index]++;
            const a = previousSoles[index]![foot], b = sample.soles[foot];
            soleSums[index] += Math.hypot(b.x - a.x, b.z - a.z);
          }
        }
        previous[index] = sample.drawn;previousSoles[index] = sample.soles;
      }
      const baseline = sums[0] / counts[0], final = sums[1] / counts[1];
      metrics.push({speed, angle, baselineMetresPerTick: baseline, correctedMetresPerTick: final, baselineContacts: counts[0], correctedContacts: counts[1], baselineSoleMetresPerTick: soleSums[0] / counts[0], correctedSoleMetresPerTick: soleSums[1] / counts[1], maxCorrection, maxSoleCorrection});
      expect(maxCorrection).toBeGreaterThan(.02);expect(maxSoleCorrection).toBeGreaterThan(.02);
      expect(maxCorrection).toBeLessThanOrEqual(MARINE_FOOT_CORRECTION + 1e-6);
      expect(maxSoleCorrection).toBeLessThanOrEqual(MARINE_FOOT_CORRECTION + 1e-6);
      expect(soleSums[1] / counts[1], `actual sole drift ${speed}/${angle}`).toBeLessThan(soleSums[0] / counts[0] * .3);
      expect(counts[0]).toBeGreaterThan(10);expect(counts[1]).toBeGreaterThan(10);
      expect(final, `contact drift ${speed}/${angle}: ${baseline} → ${final}`).toBeLessThan(baseline * .8);
    } finally {native.dispose();corrected.dispose();}
  }
  if (process.env.M9_CONTACT_METRICS) console.log('M9_CONTACT_METRICS ' + JSON.stringify(metrics));
});

it('holds only the local clip clock and caps repeated heavy-hit holds while roots keep moving', () => {
  const rig = fixture();
  try {
    rig.step(220, 0);const start = rig.motion.visualTime, nativeX = rig.root.position.x;
    for (let frame = 0; frame < 9; frame++) {rig.motion.hit(1, Math.PI, true);rig.step(220, 0);}
    const held = .15 - (rig.motion.visualTime - start);
    expect(held).toBeGreaterThan(.02);expect(held).toBeLessThanOrEqual(MARINE_HIT_PAUSE + 1e-8);
    expect(rig.root.position.x - nativeX).toBeCloseTo(.15 * 220 / 32);
    rig.motion.setOptions(0, false);const previous = rig.motion.visualTime;rig.step(220, 0);
    expect(rig.motion.visualTime - previous).toBeCloseTo(1 / 60);
    rig.motion.setOptions(1, true);rig.motion.hit(1, 0, true);const reduced = rig.motion.visualTime;rig.step(220, 0);
    expect(rig.motion.visualTime - reduced).toBeCloseTo(1 / 60);
  } finally {rig.dispose();}
});

it('keeps paused poses stable, separates cast silhouettes, and preserves original rig resources', () => {
  const rig = fixture(), ribs = rig.source.root.getObjectByName('ribs')!, arm = rig.source.root.getObjectByName('upper_armL')!;
  const topology = rig.source.root.children.slice();
  try {
    rig.step(0, 0);rig.step(0, 0);const base = ribs.quaternion.clone();
    rig.motion.setAction('glacier', .5);rig.step(0, 0);const cast = arm.quaternion.clone();
    expect(ribs.quaternion.angleTo(base)).toBeGreaterThan(.05);
    rig.motion.setAction('seismic-slam', .5);rig.step(0, 0);
    expect(arm.quaternion.angleTo(cast)).toBeGreaterThan(.2);
    const stable = ribs.quaternion.clone();
    for (let i = 0; i < 5; i++) {
      rig.step(0, 0, 0);
      ribs.quaternion.toArray().forEach((value, component) => expect(value).toBeCloseTo(stable.toArray()[component], 12));
    }
    expect(rig.source.root.children).toEqual(topology);
    for (const angle of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      for (let i = 0; i < 20; i++) rig.step(Math.cos(angle) * 220, Math.sin(angle) * 220);
      expect(Math.abs(rig.motion.gaitYaw)).toBeLessThanOrEqual(Math.PI / 2 + 1e-8);
    }
    rig.motion.reset();expect(rig.motion.gaitYaw).toBe(0);expect(rig.motion.visualTime).toBe(0);
  } finally {rig.dispose();}
});

it('returns stopped legs to the authored neutral stance and settles death over several frames', () => {
  const rig = fixture();
  const names = ['hips', 'thighR', 'shinR', 'footR', 'thighL', 'shinL', 'footL', 'ankleR', 'ankleL'];
  const rest = names.map(name => {
    const bone = rig.source.root.getObjectByName(name)!;
    return {bone, q: bone.quaternion.clone(), p: bone.position.clone()};
  });
  try {
    for (let frame = 0; frame < 19; frame++) rig.step(220, 0);
    const stoppedAt = rig.root.position.clone();
    rig.step(0, 0);
    expect(rest.some(state => state.bone.quaternion.clone().normalize().angleTo(state.q.clone().normalize()) > .1)).toBe(true);
    for (let frame = 0; frame < 9; frame++) rig.step(0, 0);
    for (const state of rest) {
      expect(state.bone.quaternion.clone().normalize().angleTo(state.q.clone().normalize())).toBeLessThan(1e-6);
      expect(state.bone.position.distanceTo(state.p)).toBeLessThan(1e-10);
    }
    expect(rig.root.position.toArray()).toEqual(stoppedAt.toArray());
    rig.motion.setDead(true);rig.step(0, 0);
    expect(rig.root.rotation.z).toBeGreaterThan(0);expect(rig.root.rotation.z).toBeLessThan(.2);
    const first = rig.root.rotation.z;
    for (let frame = 0; frame < 20; frame++) rig.step(0, 0);
    expect(rig.root.rotation.z).toBeGreaterThan(first + 1);expect(rig.root.rotation.z).toBeCloseTo(1.4);
    expect(rig.root.position.toArray()).toEqual(stoppedAt.toArray());
    expect(rig.source.root.getObjectByName('shinR')!.quaternion.clone().normalize().angleTo(rest[2].q.clone().normalize())).toBeGreaterThan(.3);
  } finally {rig.dispose();}
});

it('moves the magazine hand out of the firing silhouette and separates deployment from a heavy brace', () => {
  const rig = fixture(), hand = rig.source.root.getObjectByName('handL')!;
  try {
    rig.step(0, 0);const ready = hand.getWorldPosition(new T.Vector3());
    rig.step(0, 0, 1 / 60, 0, 0, .5);const reload = hand.getWorldPosition(new T.Vector3());
    expect(reload.distanceTo(ready)).toBeGreaterThan(.15);
    const receiver = rig.source.root.getObjectByName('tag_weapon')!.getWorldPosition(new T.Vector3());
    expect(reload.y).toBeLessThan(receiver.y - .10);
    rig.motion.setAction('glacier', .5);rig.step(0, 0);const deploy = hand.getWorldPosition(new T.Vector3());
    rig.motion.setAction('seismic-slam', .5);rig.step(0, 0);const brace = hand.getWorldPosition(new T.Vector3());
    expect(deploy.distanceTo(brace)).toBeGreaterThan(.15);
    expect(deploy.distanceTo(reload)).toBeGreaterThan(.2);
  } finally {rig.dispose();}
});


it('keeps secondary motion disabled when strength is zero with reduced motion enabled', () => {
  const quiet = fixture(), hit = fixture();
  try {
    quiet.motion.setOptions(0, true);hit.motion.setOptions(0, true);
    quiet.step(0, 0);hit.step(0, 0);hit.motion.hit(1, Math.PI / 2, true);
    for (let frame = 0; frame < 12; frame++) {
      quiet.step(0, 0);hit.step(0, 0, 1 / 60, 0, 1);
      for (const name of ['spine', 'ribs', 'upper_armL', 'forearmL']) {
        const a = quiet.source.root.getObjectByName(name)!, b = hit.source.root.getObjectByName(name)!;
        a.quaternion.toArray().forEach((value, component) => expect(value).toBeCloseTo(b.quaternion.toArray()[component], 12));
        expect(a.position.distanceTo(b.position)).toBeLessThan(1e-12);
      }
    }
  } finally {quiet.dispose();hit.dispose();}
});
