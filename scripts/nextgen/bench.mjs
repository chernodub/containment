import {perf46Arms,installPerf46Arm,finishPerf46Arm} from './perf46-ablations.mjs';
#!/usr/bin/env node
import {attributeCpuSelf,summarizeCpuClock} from './bench-cpu.mjs';
import {configureCaptureGraphics} from './capture-graphics.mjs';
/** Sequential production-browser benchmark. No timing assertions on a shared host. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {loadavg, cpus} from 'node:os';
import {chromium} from 'playwright';
import {stageV2} from './v2-scenarios.mjs';
import {SCENARIOS} from './scenarios.mjs';
import {installGpuPassAudit} from './gpu-pass-audit.mjs';
import {runGpuMicro} from './gpu-micro.mjs';
import {fitGpuMicro} from './gpu-micro-fit.mjs';
import {installNoSoftDepthDiagnostic} from './soft-depth-diagnostic.mjs';

/** Opt-in browser probe; all wrappers and retained counters are removed after each trial. */
function installCostAudit(r = globalThis.__containmentDebug.renderer) {
 if(r.__benchCostAudit)throw Error('Cost audit already installed');
 const renderer=r.renderer,gl=renderer.getContext(),undo=[];
 const keys=['glClearCalls','glInvalidateCalls','glBlitCalls','domStyleWrites','glDriverCalls','glUseProgramCalls','glProgramSwitches','glStateCalls','glUniformUploads','glUniform4fvUploads','opaqueListEntries','transparentListEntries','transmissiveListEntries','transparentSortMs','sceneSkinnedDraws','hudSkinnedDraws','matrixComposes','localMatrixComposes','worldMatrixRecomputes','shadowMapsRendered','shadowDraws','shadowPixels','postPasses','postPixels','attackParticlesAdvanced','abilityParticlesAdvanced','abilityParticleSlotsScanned','particlesAdvanced'];
 const postNames=['sceneColor','contactAO','gtao','aoDenoise','bloomExtract','bloomBlurHorizontal','bloomBlurVertical','distortion','composite','finalAA','other'];
 for(const name of postNames)keys.push('post_'+name);
 const counters=Object.fromEntries(keys.map(key=>[key,0]));
 const postPasses=postNames.map(name=>({name,resolutions:[]}));
 function wrap(object,name,factory){
  if(!object||typeof object[name]!=='function')return;
  const own=Object.getOwnPropertyDescriptor(object,name),original=object[name];
  object[name]=factory(original);
  undo.push(()=>{if(own)Object.defineProperty(object,name,own);else delete object[name];});
 }
 const stateMethods=new Set(['activeTexture','bindTexture','bindBuffer','bindBufferBase','bindBufferRange','bindFramebuffer','bindRenderbuffer','bindVertexArray','blendColor','blendEquation','blendEquationSeparate','blendFunc','blendFuncSeparate','clearColor','clearDepth','clearStencil','colorMask','cullFace','depthFunc','depthMask','depthRange','disable','enable','frontFace','lineWidth','pixelStorei','polygonOffset','sampleCoverage','scissor','stencilFunc','stencilFuncSeparate','stencilMask','stencilMaskSeparate','stencilOp','stencilOpSeparate','viewport','drawBuffers','readBuffer','uniformBlockBinding']);
 const methods=new Set();
 for(let prototype=gl;prototype&&prototype!==Object.prototype;prototype=Object.getPrototypeOf(prototype)){
  for(const [name,descriptor] of Object.entries(Object.getOwnPropertyDescriptors(prototype)))if(name!=='constructor'&&typeof descriptor.value==='function')methods.add(name);
 }
 for(const property of ['translate','opacity','transform','left','top','width','height','strokeDashoffset']){
  const prototype=globalThis.CSSStyleDeclaration?.prototype;if(!prototype)break;
  const descriptor=Object.getOwnPropertyDescriptor(prototype,property);
  if(descriptor?.set&&descriptor.configurable){Object.defineProperty(prototype,property,{...descriptor,set(value){counters.domStyleWrites++;descriptor.set.call(this,value);}});undo.push(()=>Object.defineProperty(prototype,property,descriptor));}
 }
 wrap(globalThis.CSSStyleDeclaration?.prototype,'setProperty',original=>function(...parameters){counters.domStyleWrites++;return original.apply(this,parameters);});
 let lastProgram=typeof gl.getParameter==='function'?gl.getParameter(gl.CURRENT_PROGRAM):undefined;
 for(const name of methods)wrap(gl,name,original=>function(...parameters){
  counters.glDriverCalls++;if(name==='clear')counters.glClearCalls++;if(name==='invalidateFramebuffer')counters.glInvalidateCalls++;if(name==='blitFramebuffer')counters.glBlitCalls++;
  if(name==='useProgram'){counters.glUseProgramCalls++;if(lastProgram!==parameters[0]){counters.glProgramSwitches++;lastProgram=parameters[0];}}
  if(name==='uniform4fv')counters.glUniform4fvUploads++;
  if(stateMethods.has(name))counters.glStateCalls++;
  if(/^uniform(?:[1234](?:f|i|ui)v?|Matrix[234](?:x[234])?fv)$/.test(name))counters.glUniformUploads++;
  return original.apply(this,parameters);
 });
 // Count actual writes to Object3D matrices, including static objects forced by ancestors.
 // Scratch/instance matrix composition is reported separately from local object matrices.
 const localMatrices=new WeakSet(),worldMatrices=new WeakSet();
 const track=object=>{if(object?.matrix)localMatrices.add(object.matrix);if(object?.matrixWorld)worldMatrices.add(object.matrixWorld);};
 for(const scene of [r.scene,r.hudScene])scene?.traverse(track);track(r.camera);
 let objectPrototype=Object.getPrototypeOf(r.scene);
 while(objectPrototype&&!Object.hasOwn(objectPrototype,'updateMatrix'))objectPrototype=Object.getPrototypeOf(objectPrototype);
 for(const name of ['updateMatrix','updateMatrixWorld','updateWorldMatrix'])wrap(objectPrototype,name,original=>function(...parameters){track(this);return original.apply(this,parameters);});
 const matrixPrototype=Object.getPrototypeOf(r.scene.matrix);
 wrap(matrixPrototype,'compose',original=>function(...parameters){counters.matrixComposes++;if(localMatrices.has(this))counters.localMatrixComposes++;return original.apply(this,parameters);});
 for(const name of ['copy','multiplyMatrices'])wrap(matrixPrototype,name,original=>function(...parameters){if(worldMatrices.has(this))counters.worldMatrixRecomputes++;return original.apply(this,parameters);});
 const wrappedLists=new WeakSet();
 wrap(renderer.renderLists,'get',original=>function(...args){
  const list=original.apply(this,args);
  if(!wrappedLists.has(list)){
   wrappedLists.add(list);
   for(const [name,entries] of [['opaque',list.opaque],['transparent',list.transparent],['transmissive',list.transmissive]]){
    wrap(entries,'sort',sort=>function(compare){
     if(name==='opaque')return sort.call(this,compare);
     const started=performance.now();
     try{return sort.call(this,compare);}
     finally{counters.transparentSortMs+=performance.now()-started;}
    });
   }
   wrap(list,'sort',sort=>function(...parameters){
    counters.opaqueListEntries+=list.opaque.length;
    counters.transparentListEntries+=list.transparent.length;
    counters.transmissiveListEntries+=list.transmissive.length;
    return sort.apply(this,parameters);
   });
  }
  return list;
 });
 let shadowLights=null,insidePost=false;
 wrap(renderer.shadowMap,'render',original=>function(lights,...parameters){const previous=shadowLights;shadowLights=lights;try{return original.call(this,lights,...parameters);}finally{shadowLights=previous;}});
 wrap(renderer,'setRenderTarget',original=>function(target,...parameters){
  if(shadowLights&&target&&shadowLights.some(light=>light.shadow?.map===target)){counters.shadowMapsRendered++;counters.shadowPixels+=target.width*target.height;}
  return original.call(this,target,...parameters);
 });
 wrap(renderer,'renderBufferDirect',original=>function(camera,scene,geometry,material,object,...parameters){
  if(shadowLights)counters.shadowDraws++;
  else if(object?.isSkinnedMesh){
   if(scene===r.scene)counters.sceneSkinnedDraws++;
   if(scene===r.hudScene)counters.hudSkinnedDraws++;
  }
  return original.call(this,camera,scene,geometry,material,object,...parameters);
 });
 function postPass(name,target){
  counters.postPasses++;counters['post_'+name]++;
  const width=target?.width??gl.drawingBufferWidth,height=target?.height??gl.drawingBufferHeight;
  counters.postPixels+=width*height;
  const descriptor=postPasses[postNames.indexOf(name)];
  if(!descriptor.resolutions.some(size=>size.width===width&&size.height===height))descriptor.resolutions.push({width,height});
 }
 wrap(r.post,'render',original=>function(...parameters){const previous=insidePost;insidePost=true;try{return original.apply(this,parameters);}finally{insidePost=previous;}});
 wrap(renderer,'render',original=>function(scene,...parameters){if(insidePost&&scene===r.scene)postPass('sceneColor',renderer.getRenderTarget());return original.call(this,scene,...parameters);});
 wrap(r.post,'draw',original=>function(material,target,...parameters){
  const resources=this.resources;
  let name='other';
  if(material===resources?.occlusion)name='contactAO';
  else if(material===resources?.gtao?.material)name='gtao';
  else if(material===resources?.gtao?.denoiseMaterial)name='aoDenoise';
  else if(material===resources?.extract)name='bloomExtract';
  else if(material===resources?.blur)name=target===resources.bloomB?'bloomBlurHorizontal':'bloomBlurVertical';
  else if(material===resources?.distort)name='distortion';
  else if(material===resources?.composite)name='composite';
  else if(material===resources?.antialias)name='finalAA';
  postPass(name,target);return original.call(this,material,target,...parameters);
 });
 // AttackEffects visits these exact lists after spawning bullet trails during update.
 wrap(r.effects,'drawParticles',original=>function(list,mesh,dt,...parameters){if(dt>0){counters.attackParticlesAdvanced+=list.length;counters.particlesAdvanced+=list.length;}return original.call(this,list,mesh,dt,...parameters);});
 wrap(r.interimAbilities?.kit,'begin',original=>function(dt,...parameters){
  counters.abilityParticleSlotsScanned+=this.particles.length;
  if(dt>0)for(const particle of this.particles)if(particle.live){counters.abilityParticlesAdvanced++;counters.particlesAdvanced++;}
  return original.call(this,dt,...parameters);
 });
 const reset=()=>{for(const key of keys)counters[key]=0;};
 const api={keys,counters,postPasses,reset,sample(values,index){for(const key of keys)values[key][index]=counters[key];reset();},dispose(){for(let index=undo.length-1;index>=0;index--)undo[index]();delete r.__benchCostAudit;}};
 r.__benchCostAudit=api;
 return {keys,postPasses};
}

async function costAuditSelfTest(){
 const T=await import('three');
 const scene=new T.Scene(),child=new T.Object3D();scene.add(child);
 const gl={drawingBufferWidth:1920,drawingBufferHeight:1080,useProgram(){},bindTexture(){},uniform1f(){},uniformMatrix4fv(){},getError(){return 0;}};
 const originalGL={...gl},target={width:256,height:128},light={shadow:{map:target}};
 let currentTarget=null;
 const renderer={getContext:()=>gl,getRenderTarget:()=>currentTarget,setRenderTarget(value){currentTarget=value;},renderBufferDirect(){},render(){},shadowMap:{render(lights){for(const entry of lights){renderer.setRenderTarget(entry.shadow.map);renderer.renderBufferDirect();}renderer.setRenderTarget(null);}}};
 const material={},antialias={},resources={extract:material,antialias},post={resources,draw(){},render(){renderer.render(scene);post.draw(material,target);post.draw(antialias,null);}};
 const effects={drawParticles(){}},kit={particles:[{live:true},{live:false}],begin(){}};
 const originalCompose=T.Matrix4.prototype.compose,originalUpdate=T.Object3D.prototype.updateMatrixWorld;
 const originalHooks={target:renderer.setRenderTarget,direct:renderer.renderBufferDirect,shadow:renderer.shadowMap.render,render:renderer.render,postRender:post.render,postDraw:post.draw,particles:effects.drawParticles,begin:kit.begin};
 const fixture={renderer,scene,hudScene:new T.Scene(),camera:new T.PerspectiveCamera(),post,effects,interimAbilities:{kit}};
 installCostAudit(fixture);
 const probe=fixture.__benchCostAudit;
 try{
  const program={};gl.useProgram(program);gl.useProgram(program);gl.useProgram({});gl.bindTexture(1,{});gl.uniform1f(1,2);gl.uniformMatrix4fv(1,false,[]);
  child.updateMatrix();scene.updateMatrixWorld(true);
  renderer.shadowMap.render([light]);post.render();effects.drawParticles([1,2,3],null,.01);kit.begin(.01);
  assert.equal(probe.counters.glDriverCalls,6);assert.equal(probe.counters.glUseProgramCalls,3);assert.equal(probe.counters.glProgramSwitches,2);assert.equal(probe.counters.glStateCalls,1);assert.equal(probe.counters.glUniformUploads,2);
  assert.equal(probe.counters.localMatrixComposes,3);assert.equal(probe.counters.worldMatrixRecomputes,2);
  assert.equal(probe.counters.shadowMapsRendered,1);assert.equal(probe.counters.shadowDraws,1);assert.equal(probe.counters.shadowPixels,256*128);
  assert.equal(probe.counters.postPasses,3);assert.equal(probe.counters.post_sceneColor,1);assert.equal(probe.counters.post_bloomExtract,1);assert.equal(probe.counters.post_finalAA,1);assert.equal(probe.counters.postPixels,2*1920*1080+256*128);
  assert.equal(probe.counters.particlesAdvanced,4);assert.equal(probe.counters.abilityParticleSlotsScanned,2);
  const values=Object.fromEntries(probe.keys.map(key=>[key,new Float64Array(2)]));probe.sample(values,0);
  assert.equal(values.glUniformUploads[0],2);assert.equal(probe.counters.glUniformUploads,0);
  assert.deepEqual(probe.postPasses.find(pass=>pass.name==='bloomExtract').resolutions,[{width:256,height:128}]);
 }finally{probe.dispose();}
 assert.equal(Object.hasOwn(fixture,'__benchCostAudit'),false);
 assert.equal(T.Matrix4.prototype.compose,originalCompose);assert.equal(T.Object3D.prototype.updateMatrixWorld,originalUpdate);
 assert.deepEqual({target:renderer.setRenderTarget,direct:renderer.renderBufferDirect,shadow:renderer.shadowMap.render,render:renderer.render,postRender:post.render,postDraw:post.draw,particles:effects.drawParticles,begin:kit.begin},originalHooks);
 for(const [key,value] of Object.entries(originalGL))assert.equal(gl[key],value);
 console.log('Cost audit self-test passed: driver calls, matrices, actual shadow targets, post resolutions, particles, sampling/reset, wrapper restoration.');
}

if(process.argv.includes('--self-test')){await costAuditSelfTest();process.exit(0);}

const args=process.argv.slice(2);
// F11: one explicit diagnostic mode, never eligible for timing certification.
if(args.includes('--breakdown'))args.push('--profile',...(args.includes('--cpu-only')?[]:['--gpu-passes','--audit-costs']));
const baseline=args.includes('--baseline'),heavyScan=!args.includes('--scan-calm');
const option=(name,fallback)=>args.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3)??fallback;
const seedArg=option('condition-seed',undefined);
const conditionSeed=seedArg===undefined?undefined:Number(seedArg);
const label=option('label','integration-4-bench');
assert(/^[\w.-]+$/.test(label));
const seconds=Number(option('seconds',20)), repeats=Number(option('repeat',3));
assert(seconds>=1&&seconds<=120&&repeats>=1&&repeats<=10);
const out=resolve(option('out',resolve('artifacts/nextgen',label))), dist=resolve(option('dist','dist'));
const perf46Arm=option('perf46-arm','');
assert(!perf46Arm||perf46Arms.includes(perf46Arm),'Unknown PERF46 arm');
const requestedAblation = option('ablation', '');
const graphicsAblations = { ao: { ambientOcclusion: false }, bloom: { bloom: false }, distortion: { distortion: false } };
const ablationFeatures = [...Object.keys(graphicsAblations), 'finalAA', 'softDepth', 'atmosphereLayers', 'halfLightPool', 'contacts', 'silhouette', 'prioritySampling', 'floorResidues', 'conditions', 'adaptive80'];
const surfaceAblations = ['surfacePaint', 'inkWear', 'prioritySampling', 'flameSprites', 'floorSkins'];
const loadLimit = Number(option('load-limit', '6'));
assert(Number.isFinite(loadLimit) && loadLimit > 0);
const ablationSequence = requestedAblation === 'surface-matrix' ? surfaceAblations.flatMap(feature => ['full', feature]) : requestedAblation === 'matrix' ? ablationFeatures.flatMap(feature => ['full', feature]) : args.includes('--paired-ablation') ? ['full', requestedAblation] : [requestedAblation];
if (requestedAblation) {
 assert(!args.includes('--acceptance'), 'Ablation timings are diagnostic only');
 assert(['matrix', 'surface-matrix', 'full', ...ablationFeatures, ...surfaceAblations].includes(requestedAblation), 'Unknown ablation');
}
const tiers=option('tiers',requestedAblation?'high':'high,low').split(','), rigs=option('rigs','breacher,cryo,pyro,arc').split(',');
const storyRooms=['awakening-bay','passenger-vault','residential-gallery','communal-atrium','crew-checkpoint','armory','freight-hold','breached-loading-bay','relay-racks','transmission-chamber','diagnostic-gallery','safety-interlock-station','coolant-plant','service-shaft-landing','infested-workshop','swarm-junction','shielding-gate','containment-annulus','manual-control-chamber','overload-floor'];
await mkdir(out,{recursive:true});
if(!args.includes('--no-build'))execFileSync('npm',['run','build',...(args.includes('--breakdown')?['--','--sourcemap']:[])],{stdio:'inherit'});
const host=()=>({at:new Date().toISOString(),load:loadavg(),cores:cpus().length});
const report={perf46Arm:perf46Arm||null,ablation:requestedAblation||null,distSnapshot:{path:dist,sourceSHA:option('dist-source-sha','unrecorded')},baseline,timingAcceptanceEligible:!requestedAblation&&!args.includes('--no-soft-depth')&&!args.includes('--gpu-flush')&&!args.includes('--profile')&&!args.includes('--audit-costs'),cpuOnly:args.includes('--cpu-only'),fixedResolution:args.includes('--fixed-resolution'),noSoftDepth:args.includes('--no-soft-depth'),auditCosts:args.includes('--audit-costs'),gpuPasses:args.includes('--gpu-passes'),gpuFlush:args.includes('--gpu-flush'),gpuMicro:args.includes('--gpu-micro'),sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),seconds,repeats,minimumSimulationSeconds:Math.max(0,Math.min(60,Number(option('min-simulation-seconds',0))||0)),host:host(),scan:[],runs:[],errors:[],budgetFailures:[],notes:['25 legal enemies replenished through native spawns; deaths/corpses retained; native ability cooldowns, Overdrive recharged only by actual damage after initial fill. Invulnerable marine is fixture-only.','Audio is main-thread scheduling time; audio render callback timing is unavailable. GPU time uses EXT_disjoint_timer_query_webgl2 when supported.','Timing runs use retained numeric arrays; instrumentation allocates samples intentionally. Heap/CPU sampling runs are flagged and are not quiet budget certification.']};
const microStages=option('gpu-micro-stages','gtao,aoDenoise,bloomExtract,bloomBlurHorizontal,bloomBlurVertical,composite,finalAA').split(',');
const microSamples=Number(option('gpu-micro-samples',2));
assert(!report.gpuMicro||(Number.isInteger(microSamples)&&microSamples>=2&&microSamples<=4),'--gpu-micro-samples must be2–4');
assert(!report.gpuMicro||(microStages.length<=10&&new Set(microStages).size===microStages.length),'--gpu-micro-stages must contain at most10 unique scopes');
assert(!report.gpuMicro||microStages.every(stage=>['gtao','aoDenoise','bloomExtract','bloomBlurHorizontal','bloomBlurVertical','composite','finalAA','sceneColor','shadows','hud'].includes(stage)),'Unknown --gpu-micro-stages value');
if(report.gpuMicro)report.notes.push('POST-TRIAL SYNTHETIC MICRO PROFILE: after normal fight samples, wrapper disposal and unchanged guards, freeze simulation/presentation and repeat one selected prepared post draw1/8/32 times inside one elapsed query per RAF. Minimum of2–4 raw samples/count feeds a strict linear fit. Micro observations are ineligible for FPS acceptance; any supported slope estimates same-target throughput, not ordinary isolated pass latency. Normal trial timings/counts stay separate. No new materials or targets, no readPixels/finish/completion wait.');
assert(!report.gpuFlush||report.gpuPasses,'--gpu-flush requires --gpu-passes');
if(report.gpuFlush)report.notes.push('INTRUSIVE GPU PASS PROFILE: gl.flush before beginQuery and after endQuery requests separate ANGLE command-buffer submissions. This never waits for completion, but changes submission scheduling. Frame/CPU timings from this run are ineligible for production FPS acceptance; use a separate non-flush run.');
if(report.gpuPasses)report.notes.push('Per-pass GPU queries rotate one selected stage every third rendered frame and resolve asynchronously; sceneColor includes shadow-map updates and HDR resolve. GPU queries include shared-device scheduling contention. Total-frame queries and runtime adaptive GPU queries are disabled to prevent nesting; frame-driven adaptive fallback remains active. Unresolved/disjoint queries are reported, never forced with readPixels or finish.');
if(report.auditCosts)report.notes.push('Cost audit wraps GL driver methods and matrix/particle/post/shadow operations. Counts are per observed RAF interval; timing includes intentional probe overhead and is not quiet performance certification.');
if(report.noSoftDepth)report.notes.push('DIAGNOSTIC ONLY: --no-soft-depth disables prepared softParticleBinding.enabled after normal room setup and unbinds its depth uniforms. Existing allocated targets, particles, priority masks, presets, native population and kit remain unchanged. Per-trial copy delta must be zero and original enablement is restored. Timings are ineligible for acceptance.');
let browser;const timers=new Set();
const server=createServer(async(req,res)=>{
 const file=resolve(dist,decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/containment\//,'')||'index.html');
 if(!file.startsWith(dist+'/'))return res.writeHead(404).end();
 try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'})[extname(file)]??'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404).end();}
});
try{
 await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
 browser=await chromium.launch({channel:'chromium',headless:true,args:['--no-sandbox',`--use-angle=${process.platform==='darwin'?'metal':'gl'}`,'--enable-gpu','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});page.setDefaultTimeout(180000);
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 const url=`http://127.0.0.1:${server.address().port}/containment/?debug=1&seed=1729`;
 async function reset(){await page.goto(url);await page.waitForFunction(()=>!!window.__containmentDebug);await page.evaluate(()=>document.fonts.ready);}
 await reset();
 report.gpu=await page.evaluate(()=>{const gl=window.__containmentDebug.renderer.renderer.getContext(),e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);});
 assert(!/swiftshader|software|llvmpipe/i.test(report.gpu),'Hardware renderer required');
 let rooms=option('rooms','').split(',').filter(Boolean);
 if(args.includes('--scan')||args.includes('--scan-heavy')||!rooms.length){
  for(const room of storyRooms){
   await reset();
  if(perf46Arm)await page.evaluate(installPerf46Arm,perf46Arm);
   if(heavyScan)await page.evaluate(stageV2,{rig:'arc',room,tier:'high',heavy:true,setupOnly:true,conditionSeed});
   else await page.evaluate(SCENARIOS.find(s=>s.id==='g2-calm-high').setup,room);
   const counts=await page.evaluate(heavy=>{
    const d=window.__containmentDebug,g=d.game,r=d.renderer;
    if(!heavy){d.refresh();return {...r.renderer.info.render};}
    let calls=0,triangles=0,programs=0;const render=r.renderer.render,gl=r.renderer.getContext(),createProgram=gl.createProgram;
    gl.createProgram=function(){programs++;return createProgram.call(gl);};
    r.renderer.render=function(...args){const result=render.apply(this,args);calls=Math.max(calls,this.info.render.calls);triangles=Math.max(triangles,this.info.render.triangles);return result;};
    try{
     const slots=['power','dash','tactical','overdrive'];g.switchWeapon('rifle');
     for(const slot of slots){
      if(slot==='overdrive')d.fillOverdrive();let accepted=false;
      if(slot==='power'){for(const radius of [80,120,220])for(let k=0;k<16&&!accepted;k++){const angle=g.player.angle+k*Math.PI/8,x=g.player.x+Math.cos(angle)*radius,y=g.player.y+Math.sin(angle)*radius;if(!d.canStand(x,y,28)||!d.clearShot(x,y))continue;g.setAimPoint({x,y});accepted=g.useAbility(slot);}}
      else accepted=g.useAbility(slot);
      if(!accepted)throw Error('Ranking ability denied '+slot);d.step(Math.max(150,g.abilities.snapshot.slots[slot].castRemainingMs+30));
     }
     d.setInput({fire:true,autoAim:true,angle:null});d.step(1000);
    }finally{r.renderer.render=render;gl.createProgram=createProgram;}
    if(programs)throw Error('Heavy inventory compiled '+programs+' combat programs');
    return {calls,triangles,programs,condition:g.conditionState?.condition.id,initialEnemies:25,remainingEnemies:g.enemies.activeCount,fixture:'25 legal actors + native full Arc kit, fixed-step draw inventory'};
   },heavyScan);
   report.scan.push({room,...counts,host:host()});console.log(`scan ${room}: ${counts.calls} draws`);
  }
  const ranked=[...report.scan].sort((a,b)=>b.calls-a.calls);rooms=[ranked[0].room,ranked[Math.floor(ranked.length/2)].room];
  await writeFile(resolve(out,'room-ranking.json'),JSON.stringify(report.scan,null,2));
 }
 report.rooms=rooms;
 for(const room of (args.includes('--scan-only')?[]:rooms))for(const rig of rigs)for(const tier of tiers)for(let repeat=0;repeat<repeats;repeat++)for(const [ablationIndex,ablation] of ablationSequence.entries()){
  try {
  if (requestedAblation || args.includes('--report-load')) {
   console.log(execFileSync('uptime',{encoding:'utf8'}).trim());
   while (loadavg()[0] > loadLimit) {
    console.log(`One-minute load above ${loadLimit}. Waiting 15 seconds.`);
    await new Promise(resolve=>setTimeout(resolve,15000));
    console.log(execFileSync('uptime',{encoding:'utf8'}).trim());
   }
  }
  const name=`${room}-${rig}-${tier}-${repeat}${ablation ? `-${ablationIndex}-${ablation}` : ''}`, before=host();console.log(`bench ${name}, load ${before.load.map(x=>x.toFixed(2)).join('/')}`);
  const profile=args.includes('--profile'),cdp=await page.context().newCDPSession(page);
  const audioContexts=new Map(),audioSamples=[];let audioError=null;
  {
   cdp.on('WebAudio.contextCreated',e=>audioContexts.set(e.context.contextId,e.context));
   cdp.on('WebAudio.contextChanged',e=>audioContexts.set(e.context.contextId,e.context));
   cdp.on('WebAudio.contextWillBeDestroyed',e=>audioContexts.delete(e.contextId));
  }
  try{await cdp.send('WebAudio.enable');}catch(error){audioError=String(error);}
  await reset();
  if(perf46Arm)await page.evaluate(installPerf46Arm,perf46Arm);
  if(args.includes('--fixed-resolution'))await page.evaluate(configureCaptureGraphics,{adaptiveResolution:false,resolutionScale:1});
  if (graphicsAblations[ablation]) await page.evaluate(configureCaptureGraphics, graphicsAblations[ablation]);
  else if (ablation && !['full', 'flameSprites', 'floorSkins'].includes(ablation)) {
   await page.evaluate(value => {
    const r = window.__containmentDebug.renderer;
    const selectTier = r.setQuality.bind(r);
    r.setQuality = tier => {
     selectTier(tier);
     if (tier === 'high') r.setGraphicsAblation(value);
    };
   }, ablation);
  }
  // The actual Start handler owns audio.unlock(). A canvas click cannot unlock it.
  await page.locator('#start').click();
  await page.locator('[data-difficulty="standard"]').click();await page.locator('#difficulty-begin').click();
  await page.waitForTimeout(500);
  await page.evaluate(stageV2,{rig,room,tier,heavy:true,setupOnly:true,conditionSeed});

  if (ablation === 'flameSprites' || ablation === 'floorSkins') await page.evaluate(value => {
   const r = window.__containmentDebug.renderer;
   if (value === 'flameSprites') {
    r.interimAbilities.kit.batches.flame.mesh.layers.disable(0);
   } else {
    const skins = new Set(['frame16-deck-wear', 'e10-service-lane-decks', 'e10-threshold-trims']);
    r.world.traverse(object => { if (skins.has(object.name)) object.layers.disable(0); });
   }
  }, ablation);
  if(perf46Arm)await page.evaluate(finishPerf46Arm,perf46Arm);
  if(report.noSoftDepth)await page.evaluate(installNoSoftDepthDiagnostic);
  assert([...audioContexts.values()].some(c=>c.contextType==='realtime'&&c.contextState==='running'),'Native audio context was not unlocked by Start');
  await cdp.send('Performance.enable');
  const traceEvents=[];if(profile)cdp.on('Tracing.dataCollected',event=>traceEvents.push(...event.value));
  if(profile){await cdp.send('Tracing.start',{categories:'v8,disabled-by-default-v8.gc,blink.user_timing',transferMode:'ReportEvents'});await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:100});await cdp.send('Profiler.start');await cdp.send('HeapProfiler.startSampling',{samplingInterval:32768,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true});}
  if(args.includes('--audit-costs'))await page.evaluate(installCostAudit);
  if(report.gpuPasses)await page.evaluate(installGpuPassAudit,{flush:report.gpuFlush});
  const initial=await cdp.send('Performance.getMetrics');
  let audioPollWork=Promise.resolve();
  const audioPoll=profile?setInterval(()=>{audioPollWork=audioPollWork.then(async()=>{for(const context of audioContexts.values())if(context.contextType==='realtime'){try{const {realtimeData}=await cdp.send('WebAudio.getRealtimeData',{contextId:context.contextId});audioSamples.push({contextId:context.contextId,...realtimeData});}catch(error){audioError=String(error);}}});},500):null;
  if(audioPoll)timers.add(audioPoll);
  const data=await page.evaluate(async ({seconds,audit,auditCosts,gpuPasses,deterministic,minSimulationSeconds,cpuOnly,profile})=>{
   const d=window.__containmentDebug,g=d.game,r=d.renderer,gl=r.renderer.getContext();
   // PERF13: inventory once outside the measured combat loop; logical geometry,
   // not shadow/post multiplication. Hidden rank variants are excluded.
   const geometryInventory=()=>{const rows=[];const scan=(root,owner)=>{root?.traverseVisible(object=>{if(!object.isMesh)return;const triangles=Math.min(object.geometry.index?.count??object.geometry.attributes.position?.count??0,object.geometry.drawRange.count)/3*(object.isInstancedMesh?object.count:1);let path=object.name||object.type;for(let parent=object.parent;parent&&parent!==root;parent=parent.parent)path=(parent.name||parent.type)+'/'+path;rows.push({owner,path,triangles,bones:object.skeleton?.bones.length??0,low:object.geometry.userData.perf13LOD==='low'});});};scan(r.world,'static world');scan(r.player?.root,'marine');for(const [id,actor]of r.actors)scan(actor.root,'enemy '+id);return rows.sort((a,b)=>b.triangles-a.triangles);};
   const initialGeometryInventory=geometryInventory();
   const capacity=Math.ceil(seconds*240), samples={frame:[],update:[],render:[],hud:[],audio:[],draws:[],triangles:[],lights:[],instances:[],gpu:[],driver:[],enemies:[],sceneInstances:[],sceneLights:[],adaptiveScale:[]};
   const ragdollKeys=['physicsMs','stepMs','active','bodies','joints','contacts','steps','starts'];
   if(profile)for(const key of ragdollKeys)samples['ragdoll_'+key]=[];
   let previousRagdoll=r.ragdolls.snapshot();
   if(profile){samples.updateStart=[];samples.nativeUpdate=[];}
   const costAudit=auditCosts?r.__benchCostAudit:null,gpuPassAudit=gpuPasses?r.__benchGpuPassAudit:null;
   const softDepthAudit=r.post?.__benchNoSoftDepth;let softDepthDiagnostic=null;
   if(gpuPasses&&!gpuPassAudit)throw Error('GPU pass audit was not installed');
   if(auditCosts&&!costAudit)throw Error('Cost audit was not installed');
   if(costAudit)for(const key of costAudit.keys)samples[key]=[];
   const values={};for(const key of Object.keys(samples))values[key]=new Float64Array(capacity);
   let count=0,programs=0,peakInstances=0,driverMs=0;const create=gl.createProgram,createdProgramHandles=[];
   gl.createProgram=function(){programs++;const program=create.call(gl);if(program)createdProgramHandles.push(program);return program;};
   const ext=gl.getExtension('EXT_disjoint_timer_query_webgl2'),pending=[];let frame=0;
   let actualRenderFrames=0;const resetInfo=r.renderer.info.reset,runtimeTimer=r.post.gpuTimer,timerWasEnabled=runtimeTimer?.enabled;
   if(cpuOnly){r.renderer.info.reset=function(){actualRenderFrames++;return resetInfo.call(this);};runtimeTimer?.setEnabled(false);}
   const original=r.render,direct=r.renderer.renderBufferDirect,drawObjects=new Map();let peakDrawReport=null,peakDrawCalls=0;
   if(audit)r.renderer.renderBufferDirect=function(camera,scene,geometry,material,object,group){const result=direct.call(this,camera,scene,geometry,material,object,group);drawObjects.set(object,(drawObjects.get(object)??0)+1);return result;};
   r.render=function(...args){
    if(audit)drawObjects.clear();
    const query=!cpuOnly&&!gpuPasses&&ext&&frame++%15===0&&!gl.getQuery(ext.TIME_ELAPSED_EXT,gl.CURRENT_QUERY)?gl.createQuery():null;
    if(query)gl.beginQuery(ext.TIME_ELAPSED_EXT,query);
    const result=original.apply(this,args);
    if(audit&&r.renderer.info.render.calls>peakDrawCalls){peakDrawCalls=r.renderer.info.render.calls;const groups=new Map();for(const [object,calls] of drawObjects){let part=object,path='';while(part&&part!==r.scene){if(part.name)path=part.name+(path?'/'+path:'');part=part.parent;}path||=object.material?.name||object.material?.type||'unnamed';groups.set(path,(groups.get(path)??0)+calls);}peakDrawReport=[...groups].sort((a,b)=>b[1]-a[1]);}
    if(query){gl.endQuery(ext.TIME_ELAPSED_EXT);pending.push(query);}
    return result;
   };
   const allInstanceMeshes=[],allSceneLights=[];
   r.scene.traverse(o=>{if(o.isInstancedMesh)allInstanceMeshes.push(o);if(o.isLight)allSceneLights.push(o);});
   r.hudScene.traverse(o=>{if(o.isInstancedMesh)allInstanceMeshes.push(o);});
   const shown=o=>{if(!o.layers.test(r.camera.layers))return false;for(let node=o;node;node=node.parent)if(!node.visible)return false;return true;};
   d.observePerformance(sample=>{
    if(count>=capacity)return;
    for(const key of ['frame','update','render','hud','audio'])values[key][count]=sample[key];
    if(profile){values.updateStart[count]=sample.updateStart;values.nativeUpdate[count]=sample.update;}
    if(profile){
     const ragdoll=r.ragdolls.snapshot(true);
     for(const key of ragdollKeys)values['ragdoll_'+key][count]=key==='starts'||key==='steps'?Math.max(0,ragdoll[key]-previousRagdoll[key]):ragdoll[key];
     previousRagdoll=ragdoll;
    }
    values.driver[count]=driverMs;values.update[count]+=driverMs;driverMs=0;values.enemies[count]=g.enemies.activeCount;
    values.draws[count]=r.renderer.info.render.calls;values.triangles[count]=r.renderer.info.render.triangles;
    let lights=0;for(const l of r.lighting.pool.lights)if(l.intensity>0)lights++;
    values.lights[count]=lights;
    let instances=0;const visit=o=>{if(!o.visible)return;if(o.isInstancedMesh)instances+=o.count;for(const c of o.children)visit(c);};visit(r.interimAbilities.root);values.instances[count]=instances;peakInstances=Math.max(peakInstances,instances);
    let sceneInstances=0,sceneLights=0;
    for(const mesh of allInstanceMeshes)if(shown(mesh))sceneInstances+=mesh.count;
    for(const light of allSceneLights)if(light.intensity>0&&shown(light))sceneLights++;
    values.sceneInstances[count]=sceneInstances;values.sceneLights[count]=sceneLights;
    const postDiagnostics=r.post.diagnostics??r.post.performanceDiagnostics;
    values.adaptiveScale[count]=postDiagnostics?.adaptiveScale??r.post.adaptiveScale??1;
    if(costAudit)costAudit.sample(values,count);
    count++;
   });
   const sceneLightInventory=allSceneLights.length,instanceMeshInventory=allInstanceMeshes.length;
   // Hatching retires the prepared pod primitives together. Preserve their
   // identities so removal cannot be mistaken for a new instance allocation.
   const podBatches=[];
   for(const mesh of allInstanceMeshes)mesh.traverseAncestors(parent=>{
    if(parent.userData.broodPod)podBatches.push({mesh,root:parent});
   });
   const lane=d.benchmarkLane,refillPoints=[];
   for(const radius of [110,145,180,240,300,360,420,480])for(let i=0;i<32;i++){const a=i*Math.PI/16,x=lane.x+Math.cos(a)*radius,y=lane.y+Math.sin(a)*radius;if(d.canStand(x,y,40))refillPoints.push({x,y});}
   // Fill legal gaps between polar samples in compartmentalized rooms.
   for(let y=lane.y-480;y<=lane.y+480;y+=32)for(let x=lane.x-480;x<=lane.x+480;x+=32)if(Math.hypot(x-lane.x,y-lane.y)<=480&&d.canStand(x,y,40))refillPoints.push({x,y});
   const reservePoints=[];
   for(let y=lane.y-640;y<=lane.y+640;y+=28)for(let x=lane.x-640;x<=lane.x+640;x+=28){
    if(d.canStand(x,y,40))reservePoints.push({x,y});
   }
   const refillTypes=['brute','spitter','crawler','stalker','carrier'];
   let refillCursor=0,reserveCursor=0,refillSerial=0,replenished=0;
   const refillAudit={points:refillPoints.length,reservePoints:reservePoints.length,reserveSpawns:0,passes:0,blockedPasses:0,maxDeficit:0};
   const refill=()=>{
    const deficit=25-g.enemies.activeCount;
    if(deficit<=0)return;
    refillAudit.passes++;refillAudit.maxDeficit=Math.max(refillAudit.maxDeficit,deficit);
    // A native area hit can kill several contacts in one tick. Refill the whole
    // deficit, with fresh collision snapshots after each accepted native spawn.
    // Driver cost stays inside the measured CPU window; legal spacing is unchanged.
    for(let missing=0;missing<deficit&&g.enemies.activeCount<25;missing++){
     const enemies=g.enemies.snapshot.enemies;let spawned=false;
     for(let attempt=0;attempt<refillPoints.length+reservePoints.length;attempt++){
      const reserve=attempt>=refillPoints.length;
      const point=reserve?reservePoints[reserveCursor++%reservePoints.length]:refillPoints[refillCursor++%refillPoints.length];
      const distance=Math.hypot(point.x-g.player.x,point.y-g.player.y);
      if(distance<110||distance>620)continue;
      let clear=true;for(const e of enemies)if(e.health>0&&Math.hypot(e.x-point.x,e.y-point.y)<e.radius+52){clear=false;break;}
      if(!clear||(reserve?!r.visible(point.x,point.y):!d.clearShot(point.x,point.y)))continue;
      if(d.spawn(refillTypes[refillSerial%5],point.x,point.y,refillSerial%6===0)){replenished++;refillSerial++;refillAudit.reserveSpawns+=Number(reserve);spawned=true;break;}
     }
     if(!spawned){refillAudit.blockedPasses++;break;}
    }
   };
   const start=performance.now(), initialStatus=g.status,initialPhase=g.expedition.run.phase,initialElapsed=g.elapsed,initialPlayer={x:g.player.x,y:g.player.y},initialEnemies=g.enemies.activeCount;
   g.switchWeapon('rifle');d.fillOverdrive();
   const uses={dash:0,tactical:0,power:0,overdrive:0};let nextPowerTry=0,nextRefill=0;
   const tryPower=()=>{
    const snapshot=g.abilities.snapshot,slots=snapshot.slots;
    if(slots.power.cooldownRemainingMs>0||snapshot.dashing||slots.tactical.castRemainingMs>0||slots.overdrive.castRemainingMs>0||slots.power.castRemainingMs>0)return;
    for(const radius of [80,120,220,300])for(let k=0;k<16;k++){
     const angle=g.player.angle+k*Math.PI/8,x=g.player.x+Math.cos(angle)*radius,y=g.player.y+Math.sin(angle)*radius;
     if(!d.canStand(x,y,28)||!d.clearShot(x,y))continue;g.setAimPoint({x,y});
     if(g.abilities.snapshot.slots.power.ready&&g.useAbility('power')){uses.power++;return;}
    }
   };
   costAudit?.reset();
   let fixedTicks=0;
   const profileAnchor=profile?performance.mark("containment-combat-profile").startTime:null;
   d.realtime(!deterministic);
   try{
    while(deterministic?fixedTicks<Math.round(seconds*60):(performance.now()-start<seconds*1000||(g.elapsed-initialElapsed<minSimulationSeconds&&performance.now()-start<120000))){
     const driverStarted=performance.now(),elapsed=deterministic?fixedTicks/60:(driverStarted-start)/1000;
     if(elapsed>=nextRefill){refill();nextRefill=elapsed+.02;}
     // Reverse a short, legal kiting vector. Collision remains authoritative.
     const side=Math.sin(elapsed*1.2)>0?1:-1;
     d.setInput({fire:true,x:-Math.sin(lane.angle)*side*.25,y:Math.cos(lane.angle)*side*.25,angle:null,autoAim:true});
     if(elapsed>=nextPowerTry){tryPower();nextPowerTry=elapsed+.25;}
     for(const slot of ['tactical','dash','overdrive'])if(g.abilities.snapshot.slots[slot].ready&&g.useAbility(slot))uses[slot]++;
     driverMs+=performance.now()-driverStarted;
     if(deterministic){d.step(1000/60);fixedTicks++;}
     if(!deterministic||fixedTicks%8===0)await new Promise(requestAnimationFrame);
    }
   }finally{d.realtime(false);d.observePerformance(undefined);if(cpuOnly){r.renderer.info.reset=resetInfo;if(timerWasEnabled!==undefined)runtimeTimer?.setEnabled(timerWasEnabled);}gl.createProgram=create;r.render=original;r.renderer.renderBufferDirect=direct;if(softDepthAudit){softDepthAudit.dispose();softDepthDiagnostic=softDepthAudit.snapshot();}}
   // Give submitted queries ordinary RAF opportunities to finish; never block the GPU.
   if(gpuPassAudit)for(let i=0;i<4;i++){await new Promise(requestAnimationFrame);gpuPassAudit.poll();}
   const gpuPassTimings=gpuPassAudit?.snapshot()??null;gpuPassAudit?.dispose();if(gpuPassTimings)gpuPassTimings.diagnostics.abandonedQueries=gpuPassAudit.diagnostics.abandonedQueries;costAudit?.dispose();
   const gpu=[];for(const q of pending){if(gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE)&&!gl.getParameter(ext.GPU_DISJOINT_EXT))gpu.push(gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6);gl.deleteQuery(q);}
   for(const key of Object.keys(samples))samples[key]=Array.from(values[key].subarray(0,count));samples.gpu=gpu;
   let finalLightInventory=0,finalInstanceMeshInventory=0;
   r.scene.traverse(o=>{if(o.isLight)finalLightInventory++;if(o.isInstancedMesh)finalInstanceMeshInventory++;});r.hudScene.traverse(o=>{if(o.isInstancedMesh)finalInstanceMeshInventory++;});
   const retiredPodBatches=podBatches.filter(({mesh,root})=>!root.parent&&mesh.parent).length;
   return {profileAnchor,condition:g.conditionState?.condition.id??null,retiredPodBatches,initialGeometryInventory,finalGeometryInventory:geometryInventory(),actualRenderFrames:cpuOnly?actualRenderFrames:gpuPassTimings?.actualRenderFrames??null,cpuOnly,deterministicSegment:deterministic?{ticks:fixedTicks,tickMs:1000/60,yieldEveryTicks:8,allTicksRendered:true}:null,preparation:r.preparationDiagnostics,softDepthDiagnostic,renderPipeline:r.post?.diagnostics??null,gpuPassTimings,initialStatus,initialPhase,finalStatus:g.status,finalPhase:g.expedition.run.phase,roomLoading:r.roomLoading,bodyState:document.body.dataset.state,roomLoadingIndicatorHidden:document.getElementById('room-loading')?.hidden,costAudit:costAudit?{instrumented:true,postPasses:costAudit.postPasses,particleScope:'CPU AttackEffects.drawParticles lists and live ElementKit particles; ability slot scans retained separately; GPU atmosphere excluded',stateScope:'GL state setter API calls; program switches count changed useProgram handles'}:null,instanceMeshInventory,finalInstanceMeshInventory,finalLightInventory,peakDrawReport,replenished,refillAudit,build:g.expedition.build,glError:gl.getError(),contextLost:gl.isContextLost(),samples,count,programs,combatProgramKeys:r.renderer.info.programs.filter(program=>createdProgramHandles.includes(program.program)).map(program=>({name:program.name,cacheKey:program.cacheKey})),uses,initialEnemies,remainingEnemies:g.enemies.activeCount,simulationSeconds:g.elapsed-initialElapsed,initialPlayer,finalPlayer:{x:g.player.x,y:g.player.y},sceneLightInventory,wallSeconds:(performance.now()-start)/1000,programInventory:r.renderer.info.programs.length,abilityPool:r.interimAbilities.kit.counts,gpuSupported:!!ext,heap:performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize}:null};
  },{seconds,profile,audit:args.includes('--audit-draws'),auditCosts:args.includes('--audit-costs'),gpuPasses:report.gpuPasses,deterministic:args.includes('--breakdown'),minSimulationSeconds:Math.max(0,Math.min(60,Number(option('min-simulation-seconds',0))||0)),cpuOnly:args.includes('--cpu-only')});
  if(audioPoll){clearInterval(audioPoll);timers.delete(audioPoll);}await audioPollWork;
  const final=await cdp.send('Performance.getMetrics');
  let profiling=null;
  if(profile){const cpu=await cdp.send('Profiler.stop'),heap=await cdp.send('HeapProfiler.stopSampling');
   const complete=new Promise(ok=>cdp.once('Tracing.tracingComplete',ok));await cdp.send('Tracing.end');await complete;
   await writeFile(resolve(out,name+'.trace.json'),JSON.stringify({traceEvents}));
   const outerGC=traceEvents.filter(e=>e.ph==='X'&&/^(MinorGC|MajorGC)$/.test(e.name));
   const gcEvents=outerGC.length?outerGC:traceEvents.filter(e=>e.ph==='X'&&/V8.GC_SCAVENGER$|V8.GC_MARK_COMPACTOR$/.test(e.name));
   const gc=gcEvents.map(e=>(e.dur??0)/1000),gcEventNames=[...new Set(traceEvents.filter(e=>/gc|garbage/i.test(e.name)).map(e=>e.name))];
   const allocated=heap.profile.samples.reduce((n,s)=>n+s.size,0);profiling={cpuSelf:await attributeCpuSelf(cpu.profile,dist),audioContexts:[...audioContexts.values()],audioSamples,audioError,gcEventNames,sampledAllocationBytes:allocated,sampledAllocationBytesPerSecond:allocated/data.wallSeconds,gcPausesMs:gc};await writeFile(resolve(out,name+'.cpuprofile'),JSON.stringify(cpu.profile));await writeFile(resolve(out,name+'.heapprofile'),JSON.stringify(heap.profile));}
  await cdp.detach();
  const stats=values=>{if(!values.length)return null;const s=[...values].sort((a,b)=>a-b);return {min:s[0],p50:s[Math.floor((s.length-1)*.5)],p95:s[Math.ceil(s.length*.95)-1],max:s.at(-1),average:s.reduce((a,b)=>a+b,0)/s.length};};
  const summary=Object.fromEntries(Object.entries(data.samples).map(([k,v])=>[k,stats(k==='frame'?v.slice(1):v)]));
  const frameSamples=data.samples.frame.slice(1);
  const sortedFrames=[...frameSamples].sort((a,b)=>a-b);
  Object.assign(summary.frame, {
   p90: sortedFrames[Math.ceil(frameSamples.length*.90)-1],
   p99: sortedFrames[Math.ceil(frameSamples.length*.99)-1],
   shareAbove20: frameSamples.filter(ms=>ms>20).length/frameSamples.length,
   shareAbove30: frameSamples.filter(ms=>ms>30).length/frameSamples.length,
  });
  // The first RAF interval begins before the measurement window; retain it raw, exclude it only from frame statistics.
  if(profile){summary.audioGraphCapacityPercent=stats(audioSamples.map(s=>s.renderCapacity));summary.audioCallbackIntervalMean=stats(audioSamples.map(s=>s.callbackIntervalMean));}
  summary.updateRender=stats(data.samples.update.map((v,i)=>v+data.samples.render[i]));
  // HUD synchronization runs after render; include it in the conservative main-thread total.
  summary.cpu=stats(data.samples.update.map((v,i)=>v+data.samples.render[i]+data.samples.hud[i]));
  if(data.gpuPassTimings)for(const pass of data.gpuPassTimings.passes)pass.summaryMs=stats(pass.samplesMs);
  const budget={cpuP95:summary.cpu.p95<=8,frameP95:summary.frame.p95<=20,highFrameP50:summary.frame.p50<=16.7,highFrameP95:summary.frame.p95<=20,lowFrameP50:summary.frame.p50<=16.7,adaptiveScale:summary.adaptiveScale.min>=.9&&summary.adaptiveScale.max<=1,draws:summary.draws.max<=330,headroomDraws:summary.draws.max<=330,programInventory:data.programInventory<=400,programs:data.programs===0};
  const run={name,ablation:ablation||null,ablationIndex,room,rig,tier,repeat,timingAcceptanceEligible:!ablation&&!report.gpuFlush&&!report.noSoftDepth,timingScope:ablation?'graphics ablation diagnostic':report.noSoftDepth?'detached soft-depth disabled A/B diagnostic; ineligible for acceptance':report.gpuFlush?'intrusive gl.flush pass isolation; not production frame timing':'ordinary submission; optional asynchronous query instrumentation',nativeAudioContexts:[...audioContexts.values()],before,after:host(),profile,profiling,summary,budget,...data,cdp:{initial:initial.metrics,final:final.metrics}};
  run.cpuBreakdown=summarizeCpuClock(run);
  report.runs.push(run);
  if(args.includes('--breakdown'))await writeFile(resolve(out,name+'.md'),breakdownMarkdown(run));await writeFile(resolve(out,'benchmark.json'),JSON.stringify(report,null,2));
  console.log(`${name} (load1m ${before.load[0].toFixed(2)} → ${run.after.load[0].toFixed(2)}, ${before.cores} cores): frame ${summary.frame.p50.toFixed(2)}/${summary.frame.p95.toFixed(2)}ms, p90/p99 ${summary.frame.p90.toFixed(2)}/${summary.frame.p99.toFixed(2)}ms, >20/>30ms ${(100*summary.frame.shareAbove20).toFixed(2)}%/${(100*summary.frame.shareAbove30).toFixed(2)}%, CPU ${summary.cpu.p50.toFixed(2)}/${summary.cpu.p95.toFixed(2)}ms draws ${summary.draws.max}, compiles ${data.programs}`);
  if(args.includes('--acceptance')){
   assert(!profile&&!report.auditCosts&&!report.gpuPasses&&!report.gpuFlush&&!report.noSoftDepth,'Acceptance requires ordinary production timing');
   const precision=value=>Math.round(value*10)/10;
   const misses=[];
   if(precision(summary.frame.p50)>16.7)misses.push({metric:'frameP50',observed:summary.frame.p50,limit:16.7});
   if(tier==='high'&&precision(summary.frame.p95)>20)misses.push({metric:'highFrameP95',observed:summary.frame.p95,limit:20});
   if(tier==='high'&&summary.adaptiveScale.p50<.9)misses.push({metric:'highMedianScale',observed:summary.adaptiveScale.p50,minimum:.9});
   report.budgetFailures.push(...misses.map(miss=>({scenario:name,...miss})));
   assert.equal(misses.length,0,'Requested acceptance target missed: '+JSON.stringify(misses));
  }
  assert.equal(data.programs,0,'Mid-combat shader compile');
  if(report.noSoftDepth){assert.equal(data.softDepthDiagnostic?.copyDelta,0,'Disabled soft-depth diagnostic copied depth');assert.equal(data.softDepthDiagnostic?.restored,true,'Soft-depth diagnostic did not restore its binding');}
  assert(!data.glError&&!data.contextLost,'WebGL error or lost context during combat');
  assert.equal(data.finalLightInventory,data.sceneLightInventory,'Combat allocated new scene lights');assert.equal(data.finalInstanceMeshInventory+data.retiredPodBatches,data.instanceMeshInventory,'Combat allocated new instance meshes');
  if(!baseline&&!budget.programInventory)report.budgetFailures.push({scenario:name,metric:'programInventory',observed:data.programInventory,limit:400});
  if(!baseline&&ablation!=='adaptive80'&&!budget.adaptiveScale)report.budgetFailures.push({scenario:name,metric:'adaptiveScale',observed:[summary.adaptiveScale.min,summary.adaptiveScale.max],limit:[.7,1]});
  if(!baseline&&!budget.draws)report.budgetFailures.push({scenario:name,metric:'draws',observed:summary.draws.max,limit:350});
  if(!baseline&&!budget.headroomDraws)report.budgetFailures.push({scenario:name,metric:'headroomDraws',observed:summary.draws.max,limit:330});
  assert(summary.lights.max<=(tier==='high'||perf46Arm==='lowPoolOn'?9:2),'Shared light budget exceeded');
  assert(summary.instances.max<=4096,'Fixed ability instance inventory exceeded');
  assert(Object.values(data.uses).every(n=>n>0),'Full kit lacks accepted native slot receipts');
  assert(data.initialEnemies===25&&data.simulationSeconds>0,'Benchmark did not run the live encounter');
  assert(summary.enemies.average>=22&&summary.enemies.p50>=24,'Combat population fell below sustained stress threshold');
  if(report.gpuMicro){
   const microBefore=host();
   console.log(`micro ${name}: synthetic repeated post throughput; excluded from normal frame/draw budgets`);
   const micro=await page.evaluate(runGpuMicro,{stages:microStages,samples:microSamples});
   for(const stage of micro.stages){
    stage.throughput=fitGpuMicro(stage.samples,{minimumSamples:microSamples});
    if(micro.programCreations||micro.error||micro.restoreError||micro.glError||micro.contextLost||micro.simulation?.unchanged===false){stage.throughput.supported=false;stage.throughput.estimateMsPerRepeat=null;stage.throughput.reasons.push('micro-safety-guard-failed');}
   }
   run.gpuMicro={...micro,host:{before:microBefore,after:host()}};
   await writeFile(resolve(out,'benchmark.json'),JSON.stringify(report,null,2));
   assert.equal(micro.programCreations,0,'Synthetic micro profile compiled an unprepared program');
   assert(!micro.glError&&!micro.contextLost,'WebGL error or lost context during synthetic micro profile');
   assert(!micro.error&&!micro.restoreError,micro.error??micro.restoreError??'Micro profile failed');
   if(micro.simulation)assert(micro.simulation.unchanged,'Synthetic micro profile advanced simulation');
   console.table(micro.stages.map(stage=>({scenario:name,stage:stage.name,supported:stage.throughput.supported,throughputMsPerRepeat:stage.throughput.estimateMsPerRepeat??'unsupported',rSquared:stage.throughput.gpuFit?.rSquared??'unavailable',reasons:stage.unsupportedReason??stage.throughput.reasons.join(',')})));
  }
  } catch(error) {if(!args.includes('--breakdown')&&!args.includes('--continue-on-error'))throw error;report.errors.push({room,rig,tier,repeat,message:String(error)});console.error('Trial failed; continuing matrix:',room,rig,tier,String(error));}
 }
 if(report.auditCosts){
  console.log('Cost audit columns are per-frame p50 / p95 / max counts; timings include probe overhead.');
  console.table(report.runs.map(r=>({scenario:r.name,driverCalls:tripleCost(r.summary.glDriverCalls),useProgram:tripleCost(r.summary.glUseProgramCalls),programSwitches:tripleCost(r.summary.glProgramSwitches),stateCalls:tripleCost(r.summary.glStateCalls),uniformUploads:tripleCost(r.summary.glUniformUploads),localComposes:tripleCost(r.summary.localMatrixComposes),worldRecomputes:tripleCost(r.summary.worldMatrixRecomputes),shadowMaps:tripleCost(r.summary.shadowMapsRendered),shadowDraws:tripleCost(r.summary.shadowDraws),postPasses:tripleCost(r.summary.postPasses),postPixels:tripleCost(r.summary.postPixels),particlesAdvanced:tripleCost(r.summary.particlesAdvanced)})));
  console.table(report.runs.flatMap(r=>r.costAudit.postPasses.filter(pass=>pass.resolutions.length).map(pass=>({scenario:r.name,pass:pass.name,resolutions:pass.resolutions.map(size=>`${size.width}x${size.height}`).join(','),calls:tripleCost(r.summary['post_'+pass.name])}))));
 }
 function tripleCost(s){return s?`${s.p50}/${s.p95}/${s.max}`:'unavailable';}
 const triple=s=>s?`${s.p50.toFixed(2)}/${s.p95.toFixed(2)}/${s.max.toFixed(2)}`:'unavailable';
 if(report.gpuPasses){
  console.log('Per-pass GPU columns are asynchronous p50 / p95 / max ms; sceneColor includes shadows/resolve.');
  console.table(report.runs.flatMap(run=>(run.gpuPassTimings?.passes??[]).map(pass=>({scenario:run.name,pass:pass.name,gpu:triple(pass.summaryMs),samples:pass.samplesMs.length,pixels:pass.resolutions.map(size=>`${size.width}x${size.height}`).join(','),load:run.before.load[0].toFixed(1),adaptiveScale:triple(run.summary.adaptiveScale)}))));
  report.gpuBestOfN=Object.values(report.runs.reduce((groups,run)=>{const key=`${run.room}/${run.rig}/${run.tier}`;(groups[key]??={room:run.room,rig:run.rig,tier:run.tier,trials:[]}).trials.push(run);return groups;},{})).map(group=>{const sceneP50=run=>run.gpuPassTimings?.passes.find(pass=>pass.name==='sceneColor')?.summaryMs?.p50;const valid=group.trials.filter(run=>sceneP50(run)!==undefined);const selected=valid.sort((a,b)=>sceneP50(a)-sceneP50(b))[0];return {room:group.room,rig:group.rig,tier:group.tier,repeats:group.trials.length,timingAcceptanceEligible:!report.gpuFlush&&!report.noSoftDepth,selection:'lowest sceneColor GPU p50; same trial supplies frame/load/scale; stage percentiles are never added',selectedRun:selected?.name??null,frame:selected?.summary.frame??null,load:selected?{before:selected.before,after:selected.after}:null,adaptiveScale:selected?.summary.adaptiveScale??null,passes:selected?.gpuPassTimings.passes.map(({name,summaryMs,resolutions})=>({name,summaryMs,resolutions}))??[]};});
 }
 console.log('Timing columns are p50 / p95 / max milliseconds');
 console.table(report.runs.map(r=>({scenario:r.name,load:r.before.load[0].toFixed(1),frame:triple(r.summary.frame),p90:r.summary.frame.p90,p99:r.summary.frame.p99,above20Pct:(100*r.summary.frame.shareAbove20).toFixed(2),above30Pct:(100*r.summary.frame.shareAbove30).toFixed(2),update:triple(r.summary.update),render:triple(r.summary.render),hud:triple(r.summary.hud),audioSync:triple(r.summary.audio),cpu:triple(r.summary.cpu),gpu:triple(r.summary.gpu),adaptiveScale:triple(r.summary.adaptiveScale)})));
 console.table(report.runs.map(r=>({scenario:r.name,draws:r.summary.draws.max,triangles:r.summary.triangles.max,lights:r.summary.lights.max,instances:r.summary.instances.max,programs:r.programInventory,compiles:r.programs,allocationBytesPerSecond:r.profiling?.sampledAllocationBytesPerSecond??'not sampled',gcMaxMs:r.profiling?Math.max(0,...r.profiling.gcPausesMs):'not traced'})));
 assert.equal(report.errors.length,0,report.errors.join('\n'));
 if(report.budgetFailures.length){console.error('Final resource budget misses:',JSON.stringify(report.budgetFailures));process.exitCode=2;}
}catch(error){report.errors.push({type:'runner',message:String(error)});throw error;}finally{for(const timer of timers)clearInterval(timer);await writeFile(resolve(out,'benchmark.json'),JSON.stringify(report,null,2));await browser?.close();await new Promise(ok=>server.close(ok));}

function breakdownMarkdown(run){
 const clock=run.cpuBreakdown??summarizeCpuClock(run),format=value=>typeof value==='number'?value.toFixed(3):'unavailable';
 const cpuRows=clock.subsystems.map(row=>`| ${row.name} | ${format(row.estimatedCpuMsPerRender)} | ${format(row.activeFraction===null?null:row.activeFraction*100)} | ${format(row.milliseconds)} |`).join('\n');
 const mean=(pass,key)=>pass.counts?.length?pass.counts.reduce((sum,row)=>sum+row[key],0)/pass.counts.length:0;
 const rows=(run.gpuPassTimings?.passes??[]).map(pass=>`| ${pass.name} | ${pass.summaryMs?.p50??'unavailable'} | ${pass.summaryMs?.p95??'unavailable'} | ${pass.samplesMs.length} | ${mean(pass,'draws')} | ${mean(pass,'triangles')} | ${mean(pass,'targetPixels')} |`);
 return `# ${run.name}\n\nHost load: ${run.before.load.join(', ')}; CPU cores: ${run.before.cores}. Instrumented diagnostic; shared GPU contention can affect timer queries too.\n\n| GPU scope | p50 ms | p95 ms | samples | draws/submission | triangles/submission | target pixels/submission |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: |\n${rows.join('\n')}\n\nMemory estimates: textures ${run.gpuPassTimings?.memory?.textureBytes??'unavailable'} bytes; render-target textures ${run.gpuPassTimings?.memory?.renderTargetTextureBytes??'unavailable'} bytes.\n\nCPU phase: ${run.cpuOnly?'CPU-only; pass/count probes and timers disabled':'counter-instrumented; use --cpu-only for a separate profile'}. Measured thread CPU total: ${format(clock.threadCpuMs)} ms; mean per actual render: ${format(clock.threadCpuMeanPerRenderMs)} ms. Subsystem split is estimated from exclusive active samples.\n\n| subsystem | estimated CPU ms/render | active sample % | raw sampled wall ms |\n| --- | ---: | ---: | ---: |\n${cpuRows}\n\nScene GPU scopes may include shadow work; percentiles must not be summed. Raw counts, pass resolutions, host load and frame statistics are in benchmark.json.\n`;
}
