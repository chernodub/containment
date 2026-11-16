import assert from 'node:assert/strict';
import {L8_CAPTURE_API as api, L8_CAPTURE_ROOMS} from './l8-capture-data.mjs';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const inside = (point, polygon) => {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) result = !result;
  }
  return result;
};

/** Five legal native marks, with named-space marks chosen for spatial coverage.
 * The inspection teleports the marine only; room geometry and camera are native. */
export const E9_ROOM_TOURS = Object.fromEntries(L8_CAPTURE_ROOMS.map(room => {
  const plan = api.plans[room.id], template = api.templates[room.id];
  const geometry = api.geometry(template, 'e9-tour-' + room.id);
  const legal = point => api.occupy(geometry, point, 32);
  assert(legal(room.spawn), room.id + ': illegal native spawn');
  assert(legal(room.exit), room.id + ': illegal native exit');
  const fixed = [room.spawn, room.arena, room.exit];
  const candidates = plan.spaces.map(space => {
    const points = [space.anchor];
    const xs = space.outline.map(p => p.x), ys = space.outline.map(p => p.y);
    for (let y = Math.min(...ys) + 16; y < Math.max(...ys); y += 16) {
      for (let x = Math.min(...xs) + 16; x < Math.max(...xs); x += 16) points.push({x, y});
    }
    const point = points.filter(p => inside(p, space.outline) && legal(p) && fixed.every(mark => distance(p, mark) >= 96))
      .sort((a, b) => distance(a, space.anchor) - distance(b, space.anchor))[0];
    return point ? {label: space.name, x: point.x, y: point.y, desired: {...space.anchor}} : null;
  }).filter(Boolean);
  let selected = null, best = -Infinity;
  for (let i = 0; i < candidates.length; i++) for (let j = i + 1; j < candidates.length; j++) {
    const a = candidates[i], b = candidates[j];
    const separation = Math.min(distance(a, b), ...fixed.map(p => distance(a, p)), ...fixed.map(p => distance(b, p)));
    if (separation < 96) continue;
    const score = separation * 4 + distance(a, b);
    if (score > best) { best = score; selected = [a, b]; }
  }
  assert(selected, room.id + ': two named-space inspection marks required');
  return [room.id, [
    {label: 'Spawn', ...room.spawn},
    {label: 'Fight circle', ...room.arena},
    ...selected,
    {label: 'Exit', ...room.exit},
  ]];
}));

export const E9_TOUR_SCENARIO = {
  id: 'room-tour', rooms: true, state: 'playing', phase: 'combat',
  burst: true, frameCount: 5, roomTour: true, nativePointerHover: '#pause',
  setup: new Function('room', `return (async () => {
    const d = window.__containmentDebug, g = d.game;
    const marks = ${JSON.stringify(E9_ROOM_TOURS)}[room];
    if (!marks || marks.length !== 5) throw Error('No five-position room tour for ' + room);
    await d.gotoRoom(room); d.invulnerable(true); d.measureLuminance = true;
    g.enemies.reset();
    d.e9TourMarks = marks;
    d.setInput({x: 0, y: 0, fire: false, angle: 0, autoAim: false});
    d.refresh();
  })();`),
};

/** Serialized into the page; native presentation settles without simulating time. */
export function advanceRoomTour(frame) {
  const d = window.__containmentDebug, g = d.game, mark = d.e9TourMarks?.[frame];
  if (!mark || !d.canStand(mark.x, mark.y, 32)) throw Error('Illegal room tour mark ' + frame);
  Object.assign(g.player, {x: mark.x, y: mark.y, vx: 0, vy: 0, angle: 0});
  d.setInput({x: 0, y: 0, fire: false, angle: 0, autoAim: false});
  const simulationBefore = g.elapsed, gl = d.renderer.renderer.getContext(), createProgram = gl.createProgram;
  let preparedShaderCompiles = 0;
  gl.createProgram = function () { preparedShaderCompiles++; return createProgram.call(gl); };
  try { d.settlePresentation(120); } finally { gl.createProgram = createProgram; }
  if (preparedShaderCompiles) throw Error('Prepared room tour compiled ' + preparedShaderCompiles + ' new programs');
  if (g.elapsed !== simulationBefore) throw Error('Room tour presentation advanced simulation');
  d.e9RoomTourProof = {
    frame: frame + 1, mark, marks: d.e9TourMarks, nativePresentation: true,
    presentationTicks: 120, preparedShaderCompiles, simulationBefore, simulationAfter: g.elapsed,
    cameraOverride: false,
    scope: 'Five legal staged room inspections; native camera, frozen simulation. Not a campaign or timing measurement.',
  };
  d.refresh();
}

/** Shared by capture and final assembly, in addition to unchanged body/HUD guards. */
export function assertRoomTour(evidence, frame, name) {
  const proof = evidence.e9RoomTourProof;
  assert.equal(evidence.enemies, 0, name + ': quiet room tour contains enemies');
  assert(proof?.nativePresentation && proof.presentationTicks === 120 && proof.simulationBefore === proof.simulationAfter && proof.cameraOverride === false,
    name + ': native presentation-only room tour proof missing');
  assert.equal(proof.frame, frame + 1, name + ': wrong tour position');
  assert.equal(proof.marks.length, 5, name + ': incomplete tour marks');
  assert.equal(proof.preparedShaderCompiles, 0, name + ': prepared tour compiled new programs');
  assert.deepEqual({x: evidence.player.x, y: evidence.player.y}, {x: proof.mark.x, y: proof.mark.y}, name + ': room tour left its legal mark');
}
