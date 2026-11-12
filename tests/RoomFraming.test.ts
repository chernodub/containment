import {describe,expect,it} from 'vitest';
import {roomFocus,ROOM_CAMERA_OVERSCAN} from '../src/render/roomFraming';

describe('room camera framing',()=>{
 it('keeps an interior player as the focus',()=>{expect(roomFocus(25,25,60,60,20,16)).toEqual({x:25,z:25});});
 it('biases small room edges toward the interior without returning to whole-room centering',()=>{
  const a=roomFocus(1,25,8,60,40,16),b=roomFocus(25,1,60,6,20,30);
  expect(a.x).toBeGreaterThan(1);expect(a.x).toBeLessThan(4);expect(a.z).toBe(25);
  expect(b.x).toBe(25);expect(b.z).toBeGreaterThan(1);expect(b.z).toBeLessThan(3);
 });
 it('bounds impossible targets to the finite designed overscan',()=>{
  const low=roomFocus(-100,-100,60,60,20,16),high=roomFocus(100,100,60,60,20,16);
  expect(low.x).toBeGreaterThanOrEqual(-ROOM_CAMERA_OVERSCAN);expect(low.z).toBeGreaterThanOrEqual(-ROOM_CAMERA_OVERSCAN);
  expect(high.x).toBeLessThanOrEqual(60+ROOM_CAMERA_OVERSCAN);expect(high.z).toBeLessThanOrEqual(60+ROOM_CAMERA_OVERSCAN);
  expect(high.x).toBeCloseTo(60-low.x);expect(high.z).toBeCloseTo(60-low.z);
 });
 it('adapts its soft inset to the projected desktop extents',()=>{
  expect(roomFocus(-1,100,60,60,0,0)).toEqual({x:-ROOM_CAMERA_OVERSCAN,z:60+ROOM_CAMERA_OVERSCAN});
  expect(roomFocus(0,0,60,60,1,1).x).toBeCloseTo(.23);
  const desktop=roomFocus(0,0,60,60,36,22),narrow=roomFocus(0,0,60,60,16,31);
  expect(narrow.x).toBeLessThan(desktop.x);expect(narrow.z).toBeGreaterThan(desktop.z);
 });
});
