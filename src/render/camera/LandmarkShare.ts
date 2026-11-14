import * as T from 'three';
import type {CombatViewport} from './HudCombatFraming';

/** Conservative clipped projected box area, not a pixel silhouette or concave hull.
 * Diagnostic/test helper only; scenery never participates in gameplay hit logic. */
export function projectedLandmarkShare(camera:T.Camera,box:T.Box3,viewport:CombatViewport):number {
 const p=new T.Vector3();let left=Infinity,right=-Infinity,top=-Infinity,bottom=Infinity;
 for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){
  p.set(x,y,z).project(camera);left=Math.min(left,p.x);right=Math.max(right,p.x);top=Math.max(top,p.y);bottom=Math.min(bottom,p.y);
 }
 return Math.max(0,Math.min(right,viewport.right)-Math.max(left,viewport.left))*Math.max(0,Math.min(top,viewport.top)-Math.max(bottom,viewport.bottom))/((viewport.right-viewport.left)*(viewport.top-viewport.bottom));
}
