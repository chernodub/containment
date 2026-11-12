import {describe,expect,it} from 'vitest';
import {screenStateKey,screenProgressTimedOut} from '../scripts/nextgen/playtest/screen-progress.mjs';
const reward={node:{id:'room-3'},status:'reward',phase:'reward',loading:false};
describe('native screen progress observer',()=>{
  it('preserves the ten-second deadline for a genuinely unchanged screen',()=>{
    expect(screenProgressTimedOut(reward,{...reward},9999)).toBe(false);
    expect(screenProgressTimedOut(reward,{...reward},10000)).toBe(false);
    expect(screenProgressTimedOut(reward,{...reward},10001)).toBe(true);
    expect(screenProgressTimedOut(reward,{...reward},60000)).toBe(true);
  });
  it('observes a successful boon click before flagging its old reward screen',()=>{
    const route={...reward,status:'route',phase:'route'};
    expect(screenProgressTimedOut(reward,route,15000)).toBe(false);
    expect(screenStateKey(route)).not.toBe(screenStateKey(reward));
  });
  it('observes a successful route click before flagging the previous room',()=>{
    const route={...reward,status:'route',phase:'route'};
    const playing={node:{id:'room-4'},status:'playing',phase:'combat',loading:false};
    expect(screenProgressTimedOut(route,playing,15000)).toBe(false);
  });
  it('recognizes node progress even if the next room has the same screen phase',()=>{
    expect(screenProgressTimedOut(reward,{...reward,node:{id:'room-4'}},15000)).toBe(false);
  });
  it('delegates pending resource transitions to the independent loading deadline',()=>{
    expect(screenProgressTimedOut(reward,{...reward,loading:true},60000)).toBe(false);
    expect(screenProgressTimedOut(reward,{...reward,loading:false},60000)).toBe(true);
  });
});
