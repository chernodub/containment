import assert from 'node:assert/strict';
/** Actual rendered camera, measured HUD reservation and retained world quad. */
export function assertNativeWarning(evidence,label,{quiet=false}={}){
 const proof=evidence.warningProof;if(!proof)return;
 const framing=evidence.g6FramingProof;assert(framing?.insets&&framing.viewport,label+': warning HUD measurement missing');
 const {insets:i,viewport:v}=framing,b={left:i.left/v.width*2-1,right:1-i.right/v.width*2,top:1-i.top/v.height*2,bottom:i.bottom/v.height*2-1};
 assert(proof.panels.length>0,label+': physical warning missing');
 assert(proof.panels.some(p=>p.corners.length===4&&p.corners.every(c=>c.every(Number.isFinite)&&c[2]<1&&c[0]>=b.left&&c[0]<=b.right&&c[1]>=b.bottom&&c[1]<=b.top)),label+': complete actual warning quad must be HUD safe');
 if(quiet){assert.equal(proof.faded,false,label+': quiet marine obscures warning');assert.equal(proof.opacity,.96,label+': quiet fatal text must remain readable');}
}
