import {afterEach,expect,it,vi} from 'vitest';
import {SCENARIOS} from '../scripts/nextgen/scenarios.mjs';
afterEach(()=>vi.unstubAllGlobals());

it.each(['high','low'])('G2 %s room captures call the room-aware graphics helper',async tier=>{
 const end=new Error('fixture boundary'),gotoRoom=vi.fn(async()=>{}),setQuality=vi.fn(()=>{throw end;});
 vi.stubGlobal('window',{__containmentDebug:{game:{},gotoRoom,renderer:{setQuality}}});
 await expect(SCENARIOS.find(s=>s.id===`g2-kiting-${tier}`).setup('diagnostic-gallery')).rejects.toBe(end);
 expect(gotoRoom).toHaveBeenCalledExactlyOnceWith('diagnostic-gallery',{});
 expect(setQuality).toHaveBeenCalledExactlyOnceWith(tier);
});

it('G2 champion staging retains its Armory room and six-family graphics fixture',async()=>{
 const end=new Error('fixture boundary'),gotoRoom=vi.fn(async()=>{throw end;});
 vi.stubGlobal('window',{__containmentDebug:{game:{},gotoRoom}});
 await expect(SCENARIOS.find(s=>s.id==='g2-champions').setup()).rejects.toBe(end);
 expect(gotoRoom).toHaveBeenCalledExactlyOnceWith('armory',{});
});
