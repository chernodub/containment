import {describe,expect,it,vi} from 'vitest';
import {Group,Texture} from 'three';
import {GRAPHICS_PRESETS} from '../graphicsOptions';
import type {AbilityServices} from './ElementKit';
import type {AbilityVisuals} from './AbilityVisuals';
import {LazyAbilityVisuals} from './LazyAbilityVisuals';

function deferred<T>(){let resolve!:(value:T)=>void,reject!:(error:unknown)=>void;const promise=new Promise<T>((ok,fail)=>{resolve=ok;reject=fail;});return{promise,resolve,reject};}
function fixture(){
 const scene=new Group(),atlas=deferred<void>();
 const owner={root:new Group(),kit:{atlas:{loaded:false}},priorityMask:{marker:true},
  setPlacementPreview:vi.fn(),bind:vi.fn(),setHostilePrioritySource:vi.fn(),setOptions:vi.fn(),setReducedMotion:vi.fn(),setSoftDepth:vi.fn(),
  event:vi.fn(),update:vi.fn(),clear:vi.fn(),prepare:vi.fn(()=>atlas.promise),dispose:vi.fn(()=>owner.root.removeFromParent()),
 };
 const construct=vi.fn(function(target:Group){target.add(owner.root);return owner as unknown as AbilityVisuals;});
 const module={AbilityVisuals:construct as unknown as typeof AbilityVisuals},code=deferred<typeof module>();
 const load=vi.fn(()=>code.promise),lazy=new LazyAbilityVisuals(scene,load);
 return{scene,atlas,owner,construct,module,code,load,lazy};
}

describe('lazy ability presentation boundary',()=>{
 it('keeps title geometry empty and does not import from preference, clear, event or menu updates',()=>{
  const {lazy,scene,load}=fixture();expect(lazy.root.children).toHaveLength(0);expect(scene.children).toEqual([lazy.root]);
  lazy.setOptions(GRAPHICS_PRESETS.low,'low',true);lazy.setHostilePrioritySource({});lazy.clear();lazy.update(undefined,0,false);
  expect(lazy.kit).toBeUndefined();expect(lazy.priorityMask).toBeUndefined();expect(load).not.toHaveBeenCalled();lazy.dispose();
 });

 it('coalesces first-room import/decode and applies the latest services/preferences before readiness',async()=>{
  const {lazy,scene,owner,atlas,code,module,load,construct}=fixture(),placeholder=lazy.root;
  const services={} as AbilityServices,hostile={},options={...GRAPHICS_PRESETS.low};
  lazy.bind(services);lazy.setHostilePrioritySource(hostile);lazy.setOptions(GRAPHICS_PRESETS.high,'high',false);
  const first=lazy.prepare();expect(lazy.prepare()).toBe(first);expect(load).toHaveBeenCalledOnce();
  lazy.setOptions(options,'low',true);options.bloom=true;code.resolve(module);
  await vi.waitFor(()=>expect(construct).toHaveBeenCalledOnce());
  expect(owner.bind).toHaveBeenCalledWith(services);expect(owner.setHostilePrioritySource).toHaveBeenCalledWith(hostile);
  expect(owner.setOptions).toHaveBeenCalledWith(expect.objectContaining({bloom:false}),'low',true);
  expect(placeholder.parent).toBeNull();expect(scene.children).toEqual([owner.root]);expect(lazy.root).toBe(owner.root);
  expect(lazy.kit).toBe(owner.kit);expect(lazy.priorityMask).toBe(owner.priorityMask);
  let ready=false;void first.then(()=>{ready=true;});await Promise.resolve();expect(ready).toBe(false);
  owner.kit.atlas.loaded=true;atlas.resolve();await first;expect(ready).toBe(true);
  expect(lazy.prepare()).toBe(first);lazy.dispose();
 });

 it('forwards live presentation calls without importing or accumulating pre-room events',async()=>{
  const {lazy,owner,code,module,atlas,load}=fixture();
  const event={ability:'ram',rig:'breacher',phase:'cast'} as Parameters<AbilityVisuals['event']>[0];
  lazy.event(event,3,4);const work=lazy.prepare();code.resolve(module);atlas.resolve();await work;
  expect(owner.event).not.toHaveBeenCalled();lazy.event(event,5,6);lazy.update(undefined,.016,true);lazy.clear();
  const texture=new Texture();lazy.setSoftDepth(texture,.1,160,true);
  expect(owner.event).toHaveBeenCalledWith(event,5,6);expect(owner.update).toHaveBeenCalledWith(undefined,.016,true,undefined,undefined,undefined,undefined);
  expect(owner.clear).toHaveBeenCalledOnce();expect(owner.setSoftDepth).toHaveBeenCalledWith(texture,.1,160,true);expect(load).toHaveBeenCalledOnce();lazy.dispose();texture.dispose();
 });

 it('settles disposal during import and prevents late creation',async()=>{
  const {lazy,code,module,construct,scene}=fixture(),work=lazy.prepare();lazy.dispose();await work;
  code.resolve(module);await Promise.resolve();await Promise.resolve();expect(construct).not.toHaveBeenCalled();expect(scene.children).toHaveLength(0);
  await lazy.prepare();lazy.dispose();
 });

 it('settles disposal during atlas decode and retires its owner once',async()=>{
  const {lazy,code,module,construct,owner,atlas,scene}=fixture(),work=lazy.prepare();code.resolve(module);
  await vi.waitFor(()=>expect(construct).toHaveBeenCalledOnce());lazy.dispose();lazy.dispose();await work;
  expect(owner.dispose).toHaveBeenCalledOnce();expect(scene.children).toHaveLength(0);atlas.resolve();await Promise.resolve();expect(scene.children).toHaveLength(0);
 });

 it('can retry a failed code request without constructing duplicate owners',async()=>{
  const scene=new Group(),first=deferred<never>(),load=vi.fn(()=>first.promise),lazy=new LazyAbilityVisuals(scene,load);
  const failure=lazy.prepare();first.reject(Error('code unavailable'));await expect(failure).rejects.toThrow('code unavailable');
  const second=lazy.prepare();await expect(second).rejects.toThrow('code unavailable');expect(load).toHaveBeenCalledTimes(2);lazy.dispose();
 });
});

describe('lazy placement bridge lifecycle',()=>{
 it('retains the latest pooled aim without importing and forwards it after readiness',async()=>{
  const {scene,lazy,load,owner,code,module,atlas}=fixture();
  const state={ability:'glacier' as const,x:64,y:96,angle:.3,valid:true};
  scene.userData.setPlacementPreview(state);expect(load).not.toHaveBeenCalled();
  const work=lazy.prepare();code.resolve(module);atlas.resolve();await work;
  expect(owner.setPlacementPreview).toHaveBeenCalledWith(state);
  lazy.clear();expect(owner.clear).toHaveBeenCalledOnce();lazy.dispose();
  expect(scene.userData.setPlacementPreview).toBeUndefined();
 });
 it('does not delete a successor bridge when an old graphics owner is disposed',()=>{
  const {scene,lazy}=fixture(),successor=vi.fn();scene.userData.setPlacementPreview=successor;
  lazy.dispose();expect(scene.userData.setPlacementPreview).toBe(successor);
 });
});
