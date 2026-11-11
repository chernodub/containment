import type {Object3D} from 'three';
import type {SceneLighting} from './SceneLighting';
export const CINEMATIC_LAYER=1;
/** Isolate staged title content while retaining the live checkpoint scene. */
export function configureCinematicLayers(title:Object3D,actors:Object3D,lighting:Pick<SceneLighting,'root'|'pool'|'blast'>,contacts:Object3D){
 title.traverse(object=>object.layers.set(CINEMATIC_LAYER));
 actors.traverse(object=>object.layers.set(CINEMATIC_LAYER));
 lighting.root.traverse(object=>object.layers.enable(CINEMATIC_LAYER));
 lighting.pool.root.traverse(object=>object.layers.disable(CINEMATIC_LAYER));
 lighting.blast.layers.disable(CINEMATIC_LAYER);
 contacts.layers.enable(CINEMATIC_LAYER);
}
