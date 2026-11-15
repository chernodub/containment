import {expect,it,vi} from 'vitest';
import {installDebug} from '../scripts/nextgen/debug';
import type {DepthGame} from '../src/DepthGame';
import type {DepthRenderer} from '../src/render/DepthRenderer';
it('settles the original presentation renderer without encounter, simulation or UI-effect clock advancement',()=>{
 vi.stubGlobal('window',{});vi.stubGlobal('location',{search:'?debug=1'});
 try{
  const update=vi.fn(),game={elapsed:7,status:'playing',update,hurt:vi.fn()},render=vi.fn(),renderer={render,effect:vi.fn(),roomLoading:false},sync=vi.fn(),ui=vi.fn();
  installDebug(game as unknown as DepthGame,renderer as unknown as DepthRenderer,sync,vi.fn(),undefined,ui);
  const debug=(window as unknown as {__containmentDebug:{settlePresentation:(ticks:number)=>void}}).__containmentDebug;
  debug.settlePresentation(120);expect(render).toHaveBeenCalledTimes(120);expect(render.mock.calls.every(c=>c[0]===game&&c[1]===1/60&&c[2]===false)).toBe(true);expect(game.elapsed).toBe(7);expect(update).not.toHaveBeenCalled();expect(ui).toHaveBeenCalledExactlyOnceWith(0);expect(sync).toHaveBeenCalledTimes(1);
  for(const ticks of[-1,.5,601,NaN])expect(()=>debug.settlePresentation(ticks)).toThrow('0..600');
  renderer.roomLoading=true;expect(()=>debug.settlePresentation(1)).toThrow('loading');
 }finally{vi.unstubAllGlobals();}
});
