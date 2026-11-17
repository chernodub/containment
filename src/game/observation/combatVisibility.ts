/** Projection is supplied by the observer; viewport math has no render dependency. */
export type CombatVisibilityViewport={centerX:number;centerY:number;halfX:number;halfY:number};
export const FULL_VISIBILITY_VIEWPORT:CombatVisibilityViewport={centerX:0,centerY:0,halfX:1,halfY:1};
export function combatPointVisible(point:{x:number;y:number;z:number},viewport:CombatVisibilityViewport=FULL_VISIBILITY_VIEWPORT):boolean {
 return point.z>=-1&&point.z<=1&&Math.abs(point.x-viewport.centerX)<viewport.halfX*.9&&Math.abs(point.y-viewport.centerY)<viewport.halfY*.8;
}
