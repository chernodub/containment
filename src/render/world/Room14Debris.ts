import * as T from 'three';
import type {OriginalKitInstance} from './OriginalShipKitAssets';

type Placement = readonly [asset:string, x:number, z:number, yaw:number, scale:number, height?:number];
const debris:Record<string,readonly Placement[]> = {
  'passenger-vault': [['sealed-berth',398,482,.27,1.08],['queue-barrier',431,494,-.76,.83]],
  'residential-gallery': [['glazing',425,299,.8,1.1]],
  'communal-atrium': [['crushed-bench',558,426,-.35,1.12]],
  'safety-interlock-station': [['fallen-ceiling',547,342,-.18,.92]],
  'freight-hold': [['shifted-load',327,297,-.24,1.35]],
  'relay-racks': [['relay-sled',571,422,-.62,1.25]],
  'swarm-junction': [['split-plenum',270,409,.62,1.04]],
  'manual-control-chamber': [['bypass',479,433,-.42,.92]],
  'diagnostic-gallery': [['escaped-gurney',380,341,.84,1.05],['glazing',364,366,.34,1.2]],
};
export function room14Debris(id:string): OriginalKitInstance[] {
  return (debris[id]??[]).map(([asset,x,z,yaw,scale,height=0])=>({
    pack:'p11-room14',asset,purpose:'ROOM14 / '+asset,cutaway:true,castShadow:true,
    matrix:new T.Matrix4().makeRotationY(yaw).scale(new T.Vector3(scale,scale,scale)).setPosition(x/32,height,z/32)
  }));
}
