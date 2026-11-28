#!/usr/bin/env node
/** HEAVY47 walk settle study: sample the baked Brute m10-run (joint hierarchy and clip in the motion GLB)
 * at 60 Hz with three.js forward kinematics. Reports chest and head travel, the head's cyclic lag behind
 * the chest, head pitch relative to the chest, and each club socket's height over the chest (overlap).
 * node tools/assets/k11-creatures/heavy47/settle-study.mjs <motion.glb> [...more] */
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
for (const path of process.argv.slice(2)) {
  const bytes = await readFile(path);
  const gltf = await new Promise((ok, fail) => new GLTFLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '', ok, fail));
  const clip = gltf.animations.find(a => a.name === 'm10-run');
  const mixer = new T.AnimationMixer(gltf.scene);mixer.clipAction(clip).play();
  const bone = n => gltf.scene.getObjectByName(T.PropertyBinding.sanitizeNodeName(n));
  const chest = bone('chest'), head = bone('head'), caps = ['shoulder.r', 'shoulder.l'].map(bone);
  // Shoulder overlap: each club joint (its socket end) against the same rest point carried by the chest.
  gltf.scene.updateMatrixWorld(true);
  const rest = new Map([chest, ...caps].map(b => [b, b.matrixWorld.clone().invert()]));
  const sockets = caps.map(c => c.getWorldPosition(new T.Vector3()));
  const carried = (b, point) => point.clone().applyMatrix4(rest.get(b)).applyMatrix4(b.matrixWorld);
  const frames = Math.round(clip.duration * 60), rows = [];
  const p = new T.Vector3(), q = new T.Quaternion(), qc = new T.Quaternion();
  for (let f = 0; f < frames; f++) {
    mixer.setTime(f / 60);gltf.scene.updateMatrixWorld(true);
    const cz = chest.getWorldPosition(p).y, hz = head.getWorldPosition(p).y;
    chest.getWorldQuaternion(qc);head.getWorldQuaternion(q);
    const rel = new T.Euler().setFromQuaternion(qc.clone().invert().multiply(q));
    rows.push({f, cz, hz, pitch: rel.x, roll: rel.z, yaw: rel.y, caps: caps.map((c, i) => carried(c, sockets[i]).y - carried(chest, sockets[i]).y)});
  }
  const n = rows.length, mean = k => rows.reduce((s, r) => s + r[k], 0) / n, mc = mean('cz'), mh = mean('hz');
  let best = 0, bestScore = -Infinity;
  for (let k = -Math.floor(n/2); k < n/2; k++) {const s = rows.reduce((a, r, i) => a + (r.cz - mc) * (rows[(i + k + n) % n].hz - mh), 0);if (s > bestScore) {bestScore = s;best = k;}}
  const range = sel => [Math.min(...rows.map(sel)), Math.max(...rows.map(sel))].map(v => +v.toFixed(3));
  console.log(path);
  console.log(' chest height', range(r => r.cz), ' head height', range(r => r.hz), ` head trails chest ${best} frames (${Math.round(best / 60 * 1000)} ms)`);
  console.log(' head over chest', range(r => r.hz - r.cz), ' chest-to-head lag of the lowest point', rows.reduce((a, r) => r.hz - r.cz < a.hz - a.cz ? r : a).f - rows.reduce((a, r) => r.cz < a.cz ? r : a).f, 'frames');
  console.log(' head vs chest pitch', range(r => r.pitch), 'yaw', range(r => r.yaw), 'roll', range(r => r.roll));
  console.log(' rest socket heights', sockets.map(v => +v.y.toFixed(3)), ' club joint over the trunk-carried rest point r', range(r => r.caps[0]), 'l', range(r => r.caps[1]));
}
