import {RoomModelCache,retireRoomModels} from '../RoomModelCache';
import type {ShipEnvironment} from '../ShipEnvironments';

const base=import.meta.env.BASE_URL+'assets/kits/';
export const KIT_URLS={station:base+'kenney-space-station/kit.glb',domestic:base+'kenney-furniture/kit.glb',growth:base+'kenney-nature/kit.glb',industrial:base+'quaternius-scifi-essentials/kit.glb'} as const;
/** Separate, fixed three-key session cache; no URL expansion or initial fetch. */
export const kitModelCache=new RoomModelCache([KIT_URLS.station,KIT_URLS.domestic,KIT_URLS.growth].map(url=>({url,maxBytes:180000,label:'CC0 environment kit'})));
/** The independently bounded industrial atlas does not expand the original three-key cache. */
const industrialModelCache=new RoomModelCache([{url:KIT_URLS.industrial,maxBytes:2000000,label:'CC0 industrial kit'}]);
export function acquireRoomKit(url:string,signal?:AbortSignal){return (url===KIT_URLS.industrial?industrialModelCache:kitModelCache).acquire(url,signal);}
export function roomKitURLs(environment:ShipEnvironment):string[]{
  return [KIT_URLS.station,KIT_URLS.industrial,...(environment==='habitation'?[KIT_URLS.domestic]:[]),...(environment==='infested'||environment==='reactor'||environment==='cargo'?[KIT_URLS.growth]:[])];
}
/** Use the existing prepare-ahead idle boundary; only CPU templates survive room retirement. */
export function prepareKitAssets(environment:ShipEnvironment):void {
  for(const url of roomKitURLs(environment))void acquireRoomKit(url).then(root=>retireRoomModels(root)).catch(()=>{});
}
