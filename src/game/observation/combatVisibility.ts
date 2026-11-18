/** Projection is supplied by the observer; viewport math has no render dependency. */
export type CombatVisibilityViewport={centerX:number;centerY:number;halfX:number;halfY:number};
export const FULL_VISIBILITY_VIEWPORT:CombatVisibilityViewport={centerX:0,centerY:0,halfX:1,halfY:1};
export function combatPointVisible(point:{x:number;y:number;z:number},viewport:CombatVisibilityViewport=FULL_VISIBILITY_VIEWPORT):boolean {
 return point.z>=-1&&point.z<=1&&Math.abs(point.x-viewport.centerX)<viewport.halfX*.9&&Math.abs(point.y-viewport.centerY)<viewport.halfY*.8;
}

/** Convert effective CSS reservations to normalized usable-camera coordinates. */
export function writeCombatViewport(width:number,height:number,insets:{left:number;right:number;top:number;bottom:number},out:CombatVisibilityViewport&{left:number;right:number;top:number;bottom:number}):void {
 out.left=insets.left/width*2-1;out.right=1-insets.right/width*2;
 out.top=1-insets.top/height*2;out.bottom=insets.bottom/height*2-1;
 out.centerX=(out.left+out.right)*.5;out.centerY=(out.top+out.bottom)*.5;
 out.halfX=(out.right-out.left)*.5;out.halfY=(out.top-out.bottom)*.5;
}
