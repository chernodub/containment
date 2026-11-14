import {describe,it,expect} from 'vitest';
import {assertPlayingMarine} from './capture-marine-contract.mjs';

const viewport={width:1920,height:1080};
function actualSafeEdgePose(){
  // Actual failed a4d Pyro/Infested assertion snapshot: the old central90% point
  // predicate is false while complete anatomy clears the actual HUD by1.06px.
  const marineBounds={left:1499.2838289772033,top:417.7471563978248,right:1626.9432603752864,bottom:582.9970774734954};
  return {hud:true,overlay:'',player:{x:692.7359999999982,y:520,visible:false},marineBounds,
    g6FramingProof:{viewport:{...viewport},insets:{left:0,top:182,right:292,bottom:120},marineBounds},
    roomFraming:{heroPixels:100.47587496678887,outside:0,outsideX:0,outsideZ:0,hullOutside:0,smallX:false,smallZ:false,centeredX:false,centeredZ:false}};
}

describe('native complete marine capture contract',()=>{
  it('accepts the actual C6-safe edge pose without changing its false composition receipt',()=>{
    const e=actualSafeEdgePose();expect(()=>assertPlayingMarine(e,viewport)).not.toThrow();expect(e.player.visible).toBe(false);
  });
  it.each([
    ['missing HUD',e=>e.hud=false],['blocking overlay',e=>e.overlay='Preparing room'],
    ['missing player',e=>delete e.player],['missing body',e=>delete e.marineBounds],
    ['missing room receipt',e=>delete e.roomFraming],['wrong viewport',e=>e.g6FramingProof.viewport.width=1280],
    ['clipped right edge',e=>e.marineBounds.right=1629],['clipped top',e=>e.marineBounds.top=180],
    ['nonfinite bounds',e=>e.marineBounds.left=NaN],['zero-height body',e=>e.marineBounds.bottom=e.marineBounds.top],
    ['undersized hero',e=>e.roomFraming.heroPixels=99],['excess AABB area',e=>e.roomFraming.outside=.19],
    ['excess X area',e=>e.roomFraming.outsideX=.19],['uncentered small axis',e=>e.roomFraming.smallX=true],
    ['missing area field',e=>delete e.roomFraming.outsideZ],
  ])('rejects %s even when the old composition point says visible',(_,change)=>{
    const e=actualSafeEdgePose();e.player.visible=true;change(e);expect(()=>assertPlayingMarine(e,viewport)).toThrow();
  });
  it('rejects divergent body receipts',()=>{
    const e=actualSafeEdgePose();e.g6FramingProof.marineBounds={...e.marineBounds,right:1500};expect(()=>assertPlayingMarine(e,viewport)).toThrow(/disagree/);
  });
  it('scales the reference-pixel floor at720 while retaining literal body clearance',()=>{
    const e=actualSafeEdgePose(),v={width:1280,height:720};e.g6FramingProof.viewport=v;
    e.marineBounds={left:700,right:800,top:300,bottom:400};e.g6FramingProof.marineBounds=e.marineBounds;e.roomFraming.heroPixels=100*720/1080;
    expect(()=>assertPlayingMarine(e,v)).not.toThrow();e.roomFraming.heroPixels=65;expect(()=>assertPlayingMarine(e,v)).toThrow(/scale/);
  });
  it('retains the centered-small-axis exception while preserving other-axis bounds',()=>{
    const e=actualSafeEdgePose();Object.assign(e.roomFraming,{smallX:true,centeredX:true,outsideX:.4,outside:.3});
    expect(()=>assertPlayingMarine(e,viewport)).not.toThrow();e.roomFraming.outsideZ=.19;expect(()=>assertPlayingMarine(e,viewport)).toThrow();
  });
});
