import assert from 'node:assert/strict';
import {test} from 'vitest';
import {L8_CAPTURE_API as api, L8_CAPTURE_ROOMS} from './l8-capture-data.mjs';
import {E9_ROOM_TOURS, E9_TOUR_SCENARIO, advanceRoomTour, assertRoomTour} from './e9-room-tour.mjs';

test('all twenty room tours use five legal marks including two named spaces', () => {
  assert.equal(Object.keys(E9_ROOM_TOURS).length, 20);
  for (const room of L8_CAPTURE_ROOMS) {
    const marks = E9_ROOM_TOURS[room.id], geometry = api.geometry(api.templates[room.id], 'tour-test');
    assert.equal(marks.length, 5);
    assert.deepEqual({x: marks[0].x, y: marks[0].y}, room.spawn);
    assert.deepEqual({x: marks[1].x, y: marks[1].y}, room.arena);
    assert.deepEqual({x: marks[4].x, y: marks[4].y}, room.exit);
    assert.notEqual(marks[2].label, marks[3].label);
    for (const mark of marks) assert(api.occupy(geometry, mark, 32), room.id + ': ' + mark.label);
    for (const mark of marks.slice(2, 4)) assert(api.plans[room.id].spaces.some(space => space.name === mark.label));
    for (const [index, mark] of marks.entries()) for (const other of marks.slice(0, index)) {
      assert(Math.hypot(mark.x - other.x, mark.y - other.y) >= 64, room.id + ': duplicate inspection windows');
    }
  }
});

test('tour frames settle only native presentation, retain marks and reject program compilation', async () => {
  const previous = globalThis.window;
  try {
    for (const room of L8_CAPTURE_ROOMS) {
      const geometry = api.geometry(api.templates[room.id], 'tour-test'), steps = [], gl = {createProgram() { return {}; }};
      const game = {elapsed: 7, player: {...room.spawn}, enemies: {reset() {}}};
      const debug = {game, renderer: {renderer: {getContext: () => gl}}, gotoRoom: async () => {}, invulnerable() {}, refresh() {},
        canStand: (x, y, r) => api.occupy(geometry, {x, y}, r), setInput(input) { assert.equal(input.fire, false); },
        step() { throw Error('A tour must not advance simulation'); }, settlePresentation: ticks => steps.push(ticks)};
      globalThis.window = {__containmentDebug: debug};
      await E9_TOUR_SCENARIO.setup(room.id);
      for (let frame = 0; frame < 5; frame++) {
        advanceRoomTour(frame);
        const evidence = {enemies: 0, player: game.player, e9RoomTourProof: debug.e9RoomTourProof};
        assertRoomTour(evidence, frame, room.id);
      }
      assert.deepEqual(steps, [120, 120, 120, 120, 120]);
      assert.equal(game.elapsed, 7);
      debug.settlePresentation = () => gl.createProgram();
      assert.throws(() => advanceRoomTour(0), /new programs/);
    }
  } finally { globalThis.window = previous; }
});

test('tour capture is fixed at five frames and never overrides the camera', () => {
  assert.equal(E9_TOUR_SCENARIO.frameCount, 5);
  assert.equal(E9_TOUR_SCENARIO.nativePointerHover, '#pause');
  for (const source of [E9_TOUR_SCENARIO.setup.toString(), advanceRoomTour.toString()]) {
    assert(!/cameraZoom|\.zoom\s*[=*]|cameraRig\.reset/.test(source));
  }
});
