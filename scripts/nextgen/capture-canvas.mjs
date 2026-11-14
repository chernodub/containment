import assert from 'node:assert/strict';

const count=value=>Number.isSafeInteger(value)&&value>=0;

/** Keep normal palette checks; only the isolated void fixture can prove low-palette liveness. */
export function assertCaptureCanvas(evidence,{scenarioId,viewport,dpr=1,name=scenarioId??'capture'}={}){
  const canvas=evidence?.canvas;
  assert(canvas&&typeof canvas==='object',`${name}: missing canvas evidence`);
  assert(canvas.contextLost===false&&canvas.error===0,`${name}: invalid canvas context/GL state ${JSON.stringify(canvas)}`);
  assert(count(canvas.colors),`${name}: invalid canvas color count`);
  if(scenarioId!=='g3-void-contours'){
    assert(canvas.colors>8,`${name}: missing/invalid canvas pixels ${JSON.stringify(canvas)}`);
    return;
  }

  // This fixture deliberately hides the world and compares native before/after
  // contours. Its full pixel proof is stronger than counting eight palette bins.
  const proof=evidence.voidContourProof;
  assert(proof&&typeof proof==='object',`${name}: missing native void contour proof`);
  const width=viewport?.width*dpr,height=viewport?.height*dpr;
  assert(count(viewport?.width)&&viewport.width>0&&count(viewport?.height)&&viewport.height>0&&Number.isFinite(dpr)&&dpr>0&&count(width)&&width>0&&count(height)&&height>0,
    `${name}: invalid native viewport/DPR dimensions`);
  for(const field of ['width','height','actorPixels','darkenedActorPixels','backgroundPixels','compiled']){
    assert(count(proof[field]),`${name}: invalid void contour ${field}`);
  }
  assert(proof.width===width&&proof.height===height,`${name}: void proof dimensions do not match viewport times DPR`);
  const pixels=width*height;
  assert(Number.isSafeInteger(pixels),`${name}: invalid native pixel area`);
  assert(proof.compiled===0,`${name}: void contours compiled after preparation`);
  assert(proof.actorPixels>=100&&proof.darkenedActorPixels>=30&&proof.darkenedActorPixels<=proof.actorPixels,
    `${name}: missing native actor or contour pixels`);
  assert(proof.backgroundPixels>=pixels*.5&&proof.actorPixels+proof.backgroundPixels<=pixels,
    `${name}: inconsistent native void/actor pixel coverage`);
  assert(canvas.colors>=2&&count(canvas.litSamples)&&canvas.litSamples>0,
    `${name}: blank isolated void canvas ${JSON.stringify(canvas)}`);
}
