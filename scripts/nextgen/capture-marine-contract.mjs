import assert from 'node:assert/strict';

/** Physical marine visibility supersedes the renderer's conservative aim/composition predicate. */
export function assertPlayingMarine(evidence, viewport, name='playing capture') {
  assert(evidence.hud && !evidence.overlay, `${name}: HUD missing or overlay blocks scene`);
  assert(evidence.player && typeof evidence.player.visible === 'boolean', `${name}: missing native player receipt`);
  const proof=evidence.g6FramingProof, body=evidence.marineBounds, room=evidence.roomFraming;
  assert(proof?.insets && proof.viewport && body && room, `${name}: missing physical marine framing receipt`);
  assert.deepEqual(proof.viewport, viewport, `${name}: marine framing viewport differs`);
  const {left,top,right,bottom}=proof.insets;
  assert([left,top,right,bottom,viewport.width,viewport.height].every(Number.isFinite)
    && Math.min(left,top,right,bottom)>=0 && left+right<viewport.width && top+bottom<viewport.height,
  `${name}: invalid usable viewport`);
  assert(['left','top','right','bottom'].every(key=>Number.isFinite(body[key]))
    && body.right>body.left && body.bottom>body.top, `${name}: invalid marine body bounds`);
  assert.deepEqual(proof.marineBounds,body,`${name}: marine body receipts disagree`);
  // Half a CSS pixel matches the saved-PNG framing audit's projection tolerance.
  assert(body.left>=left-.5 && body.right<=viewport.width-right+.5
    && body.top>=top-.5 && body.bottom<=viewport.height-bottom+.5,
  `${name}: complete marine body leaves usable viewport`);
  assert(Number.isFinite(room.heroPixels) && room.heroPixels>=100*viewport.height/1080-.05,
    `${name}: marine reference scale below100px`);
  assert(['outside','outsideX','outsideZ','hullOutside'].every(key=>Number.isFinite(room[key]) && room[key]>=-1e-6)
    && ['smallX','smallZ','centeredX','centeredZ'].every(key=>typeof room[key]==='boolean'),
  `${name}: invalid room-area receipt`);
  assert((room.smallX?room.centeredX:room.outsideX<=.180001)
    && (room.smallZ?room.centeredZ:room.outsideZ<=.180001)
    && (room.smallX||room.smallZ||room.outside<=.180001),
  `${name}: marine framing violates C6 room-area rule`);
}
