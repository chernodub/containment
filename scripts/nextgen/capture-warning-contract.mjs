import assert from 'node:assert/strict';
/** Actual rendered camera, measured HUD reservation and retained world quad. */
export function assertNativeWarning(evidence,label,{quiet=false}={}){
 const proof=evidence.warningProof;if(!proof)return;
 const framing=evidence.g6FramingProof;assert(framing?.insets&&framing.viewport,label+': warning HUD measurement missing');
 const {insets:i,viewport:v}=framing,b={left:i.left/v.width*2-1,right:1-i.right/v.width*2,top:1-i.top/v.height*2,bottom:i.bottom/v.height*2-1};
 assert(proof.panels.length>0,label+': physical warning missing');
 const panels=proof.panels.filter(p=>p.corners.length===4&&p.corners.every(c=>c.every(Number.isFinite)&&c[2]<1));
 const within=(p,b)=>p.corners.every(([x,y])=>x>=b.left&&x<=b.right&&y>=b.bottom&&y<=b.top);
 if(!quiet&&!proof.hudPanels){
  assert(panels.some(p=>within(p,b)),label+': archived warning quad must be HUD safe');
  return;
 }
 if(quiet){
  assert(panels.some(p=>within(p,b)),label+': complete quiet warning quad must be HUD safe');
  assert.equal(proof.faded,false,label+': quiet marine obscures warning');
  assert.equal(proof.opacity,.96,label+': quiet fatal text must remain readable');
  return;
 }
 assert(panels.some(p=>{
  if(!within(p,{left:-1,right:1,bottom:-1,top:1}))return false;
  const xs=p.corners.map(c=>(c[0]+1)*v.width/2),ys=p.corners.map(c=>(1-c[1])*v.height/2);
  return proof.hudPanels.every(hud=>{
   const overlap=Math.min(...xs)<hud.right&&Math.max(...xs)>hud.left&&Math.min(...ys)<hud.bottom&&Math.max(...ys)>hud.top;
   return !overlap||hud.faded&&hud.alpha<=.15;
  });
 }),label+': warning is cropped or covered by opaque HUD');
}
