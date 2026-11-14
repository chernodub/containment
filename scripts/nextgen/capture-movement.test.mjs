import {expect, it} from 'vitest';
import {assertKitingMovement} from './capture-movement.mjs';

it('accepts the actual native Annulus reversal while checking all three phase transitions', () => {
  let previous = null;
  for (const x of [420, 387, 420, 453]) previous = assertKitingMovement(previous, {x, y: 140});
  expect(previous).toEqual({x: 453, y: 140});
});

it('rejects a stuck phase after the marine has already moved away from its origin', () => {
  let previous = assertKitingMovement(null, {x: 420, y: 140});
  previous = assertKitingMovement(previous, {x: 387, y: 140});
  expect(() => assertKitingMovement(previous, {x: 387, y: 140})).toThrow(/did not move between phases/);
});

it.each([0, .1, 1])('retains the strict greater-than-one native movement threshold (%s)', distance => {
  expect(() => assertKitingMovement({x: 10, y: 20}, {x: 10 + distance, y: 20})).toThrow(/did not move/);
});

it('rejects malformed positions and retains a copy of the actual preceding phase', () => {
  for (const value of [undefined, null, {x: NaN, y: 0}, {x: 0, y: Infinity}]) {
    expect(() => assertKitingMovement(null, value)).toThrow(/invalid marine/);
  }
  const player = {x: 0, y: 0}, previous = assertKitingMovement(null, player);
  player.x = 100;
  expect(previous).toEqual({x: 0, y: 0});
  expect(() => assertKitingMovement({x: undefined, y: 0}, player)).toThrow(/invalid prior/);
});
