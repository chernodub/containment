/** Designed sub-deck permits a room-edge camera to follow past the playable hull.
 * This is a presentation envelope, never a walkable/collision boundary. */
export const ROOM_CAMERA_OVERSCAN = .8;

function softRoomAxis(target:number,size:number,view:number,bias:number):number {
 const bounded=Math.max(-ROOM_CAMERA_OVERSCAN,Math.min(size+ROOM_CAMERA_OVERSCAN,target));
 const region=Math.min(size*.5,Math.max(0,view)*.5);
 if(region<=0)return bounded;
 const distance=Math.min(bounded,size-bounded),weight=Math.max(0,Math.min(1,1-distance/region));
 const direction=bounded<size*.5?1:bounded>size*.5?-1:0;
 return bounded+direction*Math.min(Math.max(0,view)*bias,size*.24)*weight;
}

/** Soft interior bias uses the safe inset rather than the former half-view clamp.
 * The nearest edge adds at most23% of the horizontal view or13% vertically;
 * the bias reaches zero in the interior. Actual projected-body protection remains
 * authoritative, including spring/dash settling and very small desktop windows. */
export function roomFocus(x:number,z:number,width:number,depth:number,viewWidth:number,viewHeight:number,templateId?:string,out={x:0,z:0}){
 out.x=softRoomAxis(x,width,viewWidth,.23);
 // The raised Room19 observation aperture needs additional north headroom.
 const verticalBias=templateId==='manual-control-chamber'&&z<depth*.5?.065:.13;
 out.z=softRoomAxis(z,depth,viewHeight*Math.hypot(26,19)/26,verticalBias);
 return out;
}
