import type {Rect} from './types';
/** Room9 cooling banks with independent end cross-aisles, in game units. The central hub keeps its y514 pistol lane. */
export const RELAY_RACKS_FOOTPRINTS:readonly Rect[]=Object.freeze([
 {x:300,y:160,width:100,height:240},
 {x:300,y:550,width:100,height:190},
 {x:800,y:160,width:100,height:240},
 {x:800,y:550,width:100,height:190},
 {x:550,y:360,width:100,height:150},
].map(r=>Object.freeze(r)));
