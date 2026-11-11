/** Exercise persisted UI overrides against the actual renderer and its context owner. */
export const INTEGRATION_SETTINGS_SCENARIO = {
 id:'i2-settings-recovery',state:'playing',room:'armory',reloadAfterSetup:true,auditGraphics:true,
 setup:async()=>{
  const d=window.__containmentDebug;await d.gotoRoom('armory');d.game.pause();d.refresh();
  document.querySelector('[data-pause-tab=settings]').click();
  const change=(selector,value)=>{const input=document.querySelector(selector);if(input.type==='checkbox')input.checked=value;else input.value=value;input.dispatchEvent(new Event(input.type==='range'?'input':'change',{bubbles:true}));};
  change('#quality','high');change('[data-setting="graphics.bloom"]',false);change('[data-setting="graphics.shadows"]','low');change('[data-setting="graphics.screenShake"]','35');change('[data-setting="graphics.resolutionScale"]','75');
  const options=d.renderer.graphicsOptions;
  if(options.bloom||options.shadows!=='low'||options.screenShake!==.35||options.resolutionScale!==.75)throw Error('Native settings did not reach renderer');
 },
 afterReload:async()=>{
  const d=window.__containmentDebug,r=d.renderer;
  const expected={...r.graphicsOptions};
  if(r.qualityTier!=='high'||expected.bloom||expected.shadows!=='low'||expected.screenShake!==.35||expected.resolutionScale!==.75)throw Error('Graphics overrides did not survive reload');
  const persisted=JSON.parse(localStorage.getItem('containment.ui.v1'));
  if(persisted.tier!=='high'||JSON.stringify(persisted.graphics)!==JSON.stringify(expected))throw Error('Renderer disagrees with persisted graphics');
  await d.gotoRoom('armory');d.invulnerable(true);d.refresh();
  const gl=r.renderer.getContext(),ext=gl.getExtension('WEBGL_lose_context');if(!ext)throw Error('Context-loss extension unavailable');
  await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(Error('Settings context restoration timed out')),30000);
   r.canvas.addEventListener('webglcontextrestored',()=>{clearTimeout(timeout);resolve();},{once:true});
   r.canvas.addEventListener('webglcontextlost',()=>requestAnimationFrame(()=>ext.restoreContext()),{once:true});ext.loseContext();
  });
  for(let i=0;i<900&&r.roomLoading;i++)await new Promise(requestAnimationFrame);
  if(r.roomLoading||gl.isContextLost())throw Error('Graphics recovery did not prepare');
  if(JSON.stringify(r.graphicsOptions)!==JSON.stringify(expected))throw Error('Context recovery reset graphics overrides');
  if(r.renderer.shadowMap.enabled!==true||r.renderer.getPixelRatio()!==.75)throw Error('Recovered GPU state disagrees with overrides');
  d.settingsProof={expected,afterRestore:r.graphicsOptions,persisted,contextLost:gl.isContextLost()};
  d.refresh();document.querySelector('#graphics-continue')?.click();document.querySelector('#resume')?.click();d.refresh();
 },
};
