import type {Point} from '../roguelike/types';

export const ARMORY_CENTER=Object.freeze({x:546,y:540});
const polar=(radius:number,degrees:number,center={x:600,y:450}):Point=>Object.freeze({x:center.x+radius*Math.cos(degrees*Math.PI/180),y:center.y+radius*Math.sin(degrees*Math.PI/180)});
export const ARMORY_COUNTER_START=152,ARMORY_COUNTER_END=388;
const counterStep=(ARMORY_COUNTER_END-ARMORY_COUNTER_START)/24;
// One continuous counter, open to the south. The ordinary floor within the U
// remains traversable; these polygons describe sealed equipment solids only.
export const ARMORY_COUNTER=Object.freeze([
 ...Array.from({length:25},(_,i)=>polar(300,ARMORY_COUNTER_START+i*counterStep)),
 ...Array.from({length:25},(_,i)=>polar(210,ARMORY_COUNTER_END-i*counterStep)),
]);
export const ARMORY_CAROUSEL=Object.freeze(Array.from({length:48},(_,i)=>polar(80,i*360/48,ARMORY_CENTER)));
export const ARMORY_SOLIDS=Object.freeze([ARMORY_COUNTER,ARMORY_CAROUSEL]);
