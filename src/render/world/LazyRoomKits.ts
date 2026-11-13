import {ROOM_STORY_ROUTE} from '../../game/roguelike/storyRooms';
import type {ShipEnvironment} from '../ShipEnvironments';
import type * as Dressing from './RoomKitDressing';

type DressingModule=Pick<typeof Dressing,'attachRoomKits'>;
type AssetModule=Pick<typeof import('./RoomKitAssets'),'prepareKitAssets'>;
type AttachArguments=Parameters<typeof Dressing.attachRoomKits>;
type Delegate=ReturnType<typeof Dressing.attachRoomKits>;
export const KIT_STANDARD_ROOMS=new Set<string>([...ROOM_STORY_ROUTE.map(room=>room.templateId),'reactor-vault']);

export type LazyRoomKitOwner={
  readonly state:string;
  readonly error:unknown;
  readonly ready:Promise<void>;
  readonly readyPromise:Promise<void>;
  dispose():void;
};

/** A small dependency boundary; injected loaders allow CPU lifecycle contracts. */
export function createLazyRoomKits(
  loadDressing:()=>Promise<DressingModule>=()=>import('./RoomKitDressing'),
  loadAssets:()=>Promise<AssetModule>=()=>import('./RoomKitAssets'),
){
  function attachRoomKits(...args:AttachArguments):LazyRoomKitOwner{
    let delegate:Delegate|undefined,active=true,state='loading',error:unknown;
    let finish!:()=>void;
    const ready=new Promise<void>(resolve=>{finish=resolve;});
    const settle=()=>{clearTimeout(timer);finish();};
    const fail=(reason:unknown)=>{
      if(!active)return;active=false;state='fallback';error=reason;delegate?.dispose();
      console.error('CC0 room dressing failed',reason);settle();
    };
    // Keep the original2.5s total deadline, including the new code request.
    const timer=setTimeout(()=>fail(Error('CC0 room dressing preparation timed out')),2500);
    const owner:LazyRoomKitOwner={
      get state(){return active&&delegate?delegate.state:state;},
      get error(){return active&&delegate?delegate.error:error;},
      ready,readyPromise:ready,
      dispose(){if(state==='disposed')return;error=delegate?.error??error;active=false;state='disposed';delegate?.dispose();settle();},
    };
    void Promise.resolve().then(loadDressing).then(module=>{
      if(!active)return;
      delegate=module.attachRoomKits(...args);
      return delegate.ready.then(()=>{if(active)settle();});
    }).catch(fail);
    return owner;
  }

  /** Called only by existing idle route preparation; never by module evaluation. */
  function prepareKitAssets(environment:ShipEnvironment):void{
    void Promise.resolve().then(loadAssets).then(module=>module.prepareKitAssets(environment)).catch(()=>{});
  }
  return{attachRoomKits,prepareKitAssets};
}

const lazy=createLazyRoomKits();
export const attachRoomKits=lazy.attachRoomKits;
export const prepareKitAssets=lazy.prepareKitAssets;
