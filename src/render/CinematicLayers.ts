import type {Object3D} from 'three';
import type {SceneLighting} from './SceneLighting';
export const CINEMATIC_LAYER=1;
/** Isolate title meshes; zero-energy combat slots retain the prepared light topology. */
export function configureCinematicLayers(title:Object3D,actors:Object3D,lighting:Pick<SceneLighting,'root'|'pool'|'blast'>,contacts:Object3D,muzzle?:Object3D){
 title.traverse(object=>object.layers.set(CINEMATIC_LAYER));
 actors.traverse(object=>object.layers.set(CINEMATIC_LAYER));
 lighting.root.traverse(object=>object.layers.enable(CINEMATIC_LAYER));
 muzzle?.layers.enable(CINEMATIC_LAYER);
 contacts.layers.enable(CINEMATIC_LAYER);
}
