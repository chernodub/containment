import * as T from 'three';
import type { RoomTemplate } from '../../game/roguelike/types';
import {setDeckQuality} from './E10DeckSurfaces';

/** P11: perimeter practicals and machine-mounted task lamps own illumination.
 * Repeated ceiling rafts obscured landmarks and competed with actors. */
export function addCeilingServices(root:T.Group,_t:RoomTemplate):void {
 root.userData.e10Ceiling={sourceCount:0,artDirection:'perimeter and local task lighting'};
}

/** Low retains baked decks and recessed kit hardware, without overhead extras. */
export function setCeilingQuality(world: T.Object3D, high: boolean): void {
  world.userData.e10LowTier = !high; setDeckQuality(world, high);
  world.traverse(o => { if (o.userData.e10HighDetail) o.visible = high; });
}
