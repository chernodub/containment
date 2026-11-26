export const perf46Arms=[
 'bloom','ao','distortion','lens','ink','grade','softDepth','gas','atmosphere',
 'shadows','resolution75','poolOff','lowParticles','lowRagdolls','finalAA',
 'timerOff','lowPoolOn','lowPostOn',
];
export function installPerf46Arm(arm){
 const r=window.__containmentDebug.renderer;
 const overrides={
  bloom:{bloom:false},ao:{ambientOcclusion:false},distortion:{distortion:false},lens:{lensEffects:false},
  ink:{inkOutlines:'off'},atmosphere:{atmosphere:false},shadows:{shadows:'off'},
  resolution75:{resolutionScale:.75},lowPoolOn:{dynamicLights:true},
 };
 const select=r.setQuality.bind(r);
 const apply=r.applyQuality.bind(r);
 r.applyQuality=()=>{
  apply();
  if(arm==='poolOff')r.lighting.pool.setQuality('high',false);
  if(arm==='lowPoolOn'){r.lighting.pool.setQuality('high',true);r.muzzle.visible=false;r.lighting.blast.visible=false;}
  if(arm==='lowParticles'){
   r.effects.setOptions({...r.graphicsOptions,tier:'low'});
   r.interimAbilities.setOptions(r.graphicsOptions,'low',false);
   r.afflictions.setOptions({...r.graphicsOptions,tier:'low'});
  }
  if(arm==='lowRagdolls')r.ragdolls.setQuality('low');
  if(arm==='timerOff')r.post.gpuTimer?.setEnabled(false);
 };
 if(arm==='lowPostOn'){
  const set=r.post.setOptions.bind(r.post);
  r.post.setOptions=(options,tier)=>set({...options,bloom:true,ambientOcclusion:true,
   distortion:true,lensEffects:true,inkOutlines:'full'},tier==='low'?'high':tier);
 }
 if(arm==='grade'){
  const ensure=r.post.ensureResources.bind(r.post),applied=new WeakSet();
  r.post.ensureResources=()=>{
   const resources=ensure(),material=resources.composite;
   if(!applied.has(material)){
    applied.add(material);
    const shader=material.fragmentShader;
    material.fragmentShader=shader
     .replace('color = max((color + lift) * gain, 0.0);','')
     .replace('color = mix(vec3(luminance), color, saturation);','')
     .replace(/  color = pow\(max\(color, vec3\(0\.0\)\), vec3\(contrast\)\);\n  color \+= \(shadowTint[^\n]*\n  color \+= \(highlightTint[^\n]*\n/,'');
    material.needsUpdate=true;
   }
   return resources;
  };
 }
 r.setQuality=tier=>{
  select(tier);
  if(overrides[arm])r.setGraphicsOptions(overrides[arm]);
  if(arm==='resolution75'){r.post.adaptive.minimumScale=1;r.post.adaptive.reset();r.resize();}
  if(arm==='softDepth'||arm==='finalAA'||arm==='gas')r.setGraphicsAblation(arm==='gas'?'softDepth':arm);
 };
}

export function finishPerf46Arm(arm){
 const r=window.__containmentDebug.renderer;
 if(arm==='gas')r.interimAbilities.kit.batches.smoke.mesh.layers.disable(0);
}
