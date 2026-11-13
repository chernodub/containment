import {afterEach,describe,expect,it,vi} from 'vitest';
import {Group} from 'three';
import {ROOM_STORY_ROUTE} from '../../game/roguelike/storyRooms';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import type {attachRoomKits as attachActual} from './RoomKitDressing';
import {createLazyRoomKits,KIT_STANDARD_ROOMS} from './LazyRoomKits';

function deferred<T>(){let resolve!:(value:T)=>void,reject!:(error:unknown)=>void;const promise=new Promise<T>((ok,fail)=>{resolve=ok;reject=fail;});return{promise,resolve,reject};}
function fixture(){
 const readiness=deferred<void>(),delegate={state:'loading',error:undefined as unknown,ready:readiness.promise,dispose:vi.fn(()=>{delegate.state='disposed';})};
 const attach=vi.fn(()=>delegate) as unknown as typeof attachActual;
 const code=deferred<{attachRoomKits:typeof attachActual}>(),load=vi.fn(()=>code.promise),prepare=vi.fn();
 const assets=vi.fn(async()=>({prepareKitAssets:prepare})),facade=createLazyRoomKits(load,assets);
 const args=[new Group(),ROOM_TEMPLATES['relay-racks'],'communications','relay-racks',vi.fn(),Promise.resolve()] as const;
 return{delegate,readiness,attach,code,load,assets,prepare,facade,args};
}
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});

describe('lazy room-kit code boundary',()=>{
 it('exports the story room allowlist without importing dressing or assets',()=>{
  const {facade,load,assets}=fixture();expect(facade).toBeDefined();expect(load).not.toHaveBeenCalled();expect(assets).not.toHaveBeenCalled();
  expect([...KIT_STANDARD_ROOMS]).toEqual([...ROOM_STORY_ROUTE.map(r=>r.templateId),'reactor-vault']);
 });

 it('holds readiness through module and owner preparation and preserves delegated state/error',async()=>{
  const {facade,args,delegate,code,readiness,attach}=fixture(),owner=facade.attachRoomKits(...args);
  expect(owner.state).toBe('loading');expect(owner.readyPromise).toBe(owner.ready);
  let ready=false;void owner.ready.then(()=>{ready=true;});code.resolve({attachRoomKits:attach});
  await vi.waitFor(()=>expect(attach).toHaveBeenCalledOnce());expect(attach).toHaveBeenCalledWith(...args);expect(ready).toBe(false);
  delegate.state='ready';readiness.resolve();await owner.ready;expect(owner.state).toBe('ready');
  owner.dispose();owner.dispose();expect(delegate.dispose).toHaveBeenCalledOnce();expect(owner.state).toBe('disposed');
 });

 it('settles cancellation before import and never attaches a late room',async()=>{
  const {facade,args,code,attach}=fixture(),owner=facade.attachRoomKits(...args);owner.dispose();await owner.ready;
  code.resolve({attachRoomKits:attach});await Promise.resolve();await Promise.resolve();expect(attach).not.toHaveBeenCalled();expect(owner.state).toBe('disposed');
 });

 it('cancels an existing delegate and forwards its fallback error without changing failure policy',async()=>{
  const {facade,args,code,attach,delegate,readiness}=fixture(),owner=facade.attachRoomKits(...args);code.resolve({attachRoomKits:attach});
  await vi.waitFor(()=>expect(attach).toHaveBeenCalledOnce());const error=Error('asset failed');delegate.state='fallback';delegate.error=error;readiness.resolve();
  await owner.ready;expect(owner.state).toBe('fallback');expect(owner.error).toBe(error);owner.dispose();expect(owner.error).toBe(error);expect(delegate.dispose).toHaveBeenCalledOnce();
 });

 it('bounds the total code-plus-assets hold and prevents late import attachment',async()=>{
  vi.useFakeTimers();const error=vi.spyOn(console,'error').mockImplementation(()=>{});
  const {facade,args,code,attach}=fixture(),owner=facade.attachRoomKits(...args);
  await vi.advanceTimersByTimeAsync(2500);await owner.ready;expect(owner.state).toBe('fallback');expect(String(owner.error)).toContain('timed out');
  code.resolve({attachRoomKits:attach});await Promise.resolve();await Promise.resolve();expect(attach).not.toHaveBeenCalled();expect(error).toHaveBeenCalledOnce();owner.dispose();
 });

 it('keeps the original fallback when the module request fails',async()=>{
  vi.spyOn(console,'error').mockImplementation(()=>{});const {facade,args,code}=fixture(),owner=facade.attachRoomKits(...args);
  code.reject(Error('chunk missing'));await owner.ready;expect(owner.state).toBe('fallback');expect(String(owner.error)).toContain('chunk missing');owner.dispose();
 });

 it('imports asset preparation only from the explicit idle-ahead call',async()=>{
  const {facade,load,assets,prepare}=fixture();facade.prepareKitAssets('infested');expect(prepare).not.toHaveBeenCalled();
  await vi.waitFor(()=>expect(prepare).toHaveBeenCalledWith('infested'));expect(assets).toHaveBeenCalledOnce();expect(load).not.toHaveBeenCalled();
 });
});
