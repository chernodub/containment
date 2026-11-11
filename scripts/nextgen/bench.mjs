#!/usr/bin/env node
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

/** Opt-in browser probe; all wrappers and retained counters are removed after each trial. */
function installCostAudit(r = globalThis.__containmentDebug.renderer) {
 if(r.__benchCostAudit)throw Error('Cost audit already installed');
 const renderer=r.renderer,gl=renderer.getContext(),undo=[];
 const keys=['glDriverCalls','glUseProgramCalls','glProgramSwitches','glStateCalls','glUniformUploads','matrixComposes','localMatrixComposes','worldMatrixRecomputes','shadowMapsRendered','shadowDraws','shadowPixels','postPasses','postPixels','attackParticlesAdvanced','abilityParticlesAdvanced','abilityParticleSlotsScanned','particlesAdvanced'];
 const postNames=['sceneColor','contactAO','gtao','aoDenoise','bloomExtract','bloomBlurHorizontal','bloomBlurVertical','distortion','composite','other'];
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
 let lastProgram=typeof gl.getParameter==='function'?gl.getParameter(gl.CURRENT_PROGRAM):undefined;
 for(const name of methods)wrap(gl,name,original=>function(...parameters){
  counters.glDriverCalls++;
  if(name==='useProgram'){counters.glUseProgramCalls++;if(lastProgram!==parameters[0]){counters.glProgramSwitches++;lastProgram=parameters[0];}}
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
 let shadowLights=null,insidePost=false;
 wrap(renderer.shadowMap,'render',original=>function(lights,...parameters){const previous=shadowLights;shadowLights=lights;try{return original.call(this,lights,...parameters);}finally{shadowLights=previous;}});
 wrap(renderer,'setRenderTarget',original=>function(target,...parameters){
  if(shadowLights&&target&&shadowLights.some(light=>light.shadow?.map===target)){counters.shadowMapsRendered++;counters.shadowPixels+=target.width*target.height;}
  return original.call(this,target,...parameters);
 });
 wrap(renderer,'renderBufferDirect',original=>function(...parameters){if(shadowLights)counters.shadowDraws++;return original.apply(this,parameters);});
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
 const material={},resources={extract:material},post={resources,draw(){},render(){renderer.render(scene);post.draw(material,target);}};
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
  assert.equal(probe.counters.postPasses,2);assert.equal(probe.counters.post_sceneColor,1);assert.equal(probe.counters.post_bloomExtract,1);assert.equal(probe.counters.postPixels,1920*1080+256*128);
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

const args=process.argv.slice(2),baseline=args.includes('--baseline'),heavyScan=!args.includes('--scan-calm');
const option=(name,fallback)=>args.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3)??fallback;
const label=option('label','integration-4-bench');
assert(/^[\w.-]+$/.test(label));
const seconds=Number(option('seconds',20)), repeats=Number(option('repeat',3));
assert(seconds>=1&&seconds<=120&&repeats>=1&&repeats<=10);
const out=resolve('artifacts/nextgen',label), dist=resolve(option('dist','dist'));
const tiers=option('tiers','high,low').split(','), rigs=option('rigs','breacher,cryo,pyro,arc').split(',');
const storyRooms=['awakening-bay','passenger-vault','residential-gallery','communal-atrium','crew-checkpoint','armory','freight-hold','breached-loading-bay','relay-racks','transmission-chamber','diagnostic-gallery','safety-interlock-station','coolant-plant','service-shaft-landing','infested-workshop','swarm-junction','shielding-gate','containment-annulus','manual-control-chamber','overload-floor'];
await mkdir(out,{recursive:true});
if(!args.includes('--no-build'))execFileSync('npm',['run','build'],{stdio:'inherit'});
const host=()=>({at:new Date().toISOString(),load:loadavg(),cores:cpus().length});
const report={distSnapshot:{path:dist,sourceSHA:option('dist-source-sha','unrecorded')},baseline,auditCosts:args.includes('--audit-costs'),sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),seconds,repeats,host:host(),scan:[],runs:[],errors:[],budgetFailures:[],notes:['25 legal enemies replenished through native spawns; deaths/corpses retained; native ability cooldowns, Overdrive recharged only by actual damage after initial fill. Invulnerable marine is fixture-only.','Audio is main-thread scheduling time; audio render callback timing is unavailable. GPU time uses EXT_disjoint_timer_query_webgl2 when supported.','Timing runs use retained numeric arrays; instrumentation allocates samples intentionally. Heap/CPU sampling runs are flagged and are not quiet budget certification.']};
if(report.auditCosts)report.notes.push('Cost audit wraps GL driver methods and matrix/particle/post/shadow operations. Counts are per observed RAF interval; timing includes intentional probe overhead and is not quiet performance certification.');
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
   if(heavyScan)await page.evaluate(stageV2,{rig:'arc',room,tier:'high',heavy:true,setupOnly:true});
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
    return {calls,triangles,programs,initialEnemies:25,remainingEnemies:g.enemies.activeCount,fixture:'25 legal actors + native full Arc kit, fixed-step draw inventory'};
   },heavyScan);
   report.scan.push({room,...counts,host:host()});console.log(`scan ${room}: ${counts.calls} draws`);
  }
  const ranked=[...report.scan].sort((a,b)=>b.calls-a.calls);rooms=[ranked[0].room,ranked[Math.floor(ranked.length/2)].room];
  await writeFile(resolve(out,'room-ranking.json'),JSON.stringify(report.scan,null,2));
 }
 report.rooms=rooms;
 for(const room of (args.includes('--scan-only')?[]:rooms))for(const rig of rigs)for(const tier of tiers)for(let repeat=0;repeat<repeats;repeat++){
  const name=`${room}-${rig}-${tier}-${repeat}`, before=host();console.log(`bench ${name}, load ${before.load.map(x=>x.toFixed(2)).join('/')}`);
  const profile=args.includes('--profile'),cdp=await page.context().newCDPSession(page);
  const audioContexts=new Map(),audioSamples=[];let audioError=null;
  {
   cdp.on('WebAudio.contextCreated',e=>audioContexts.set(e.context.contextId,e.context));
   cdp.on('WebAudio.contextChanged',e=>audioContexts.set(e.context.contextId,e.context));
   cdp.on('WebAudio.contextWillBeDestroyed',e=>audioContexts.delete(e.contextId));
  }
  try{await cdp.send('WebAudio.enable');}catch(error){audioError=String(error);}
  await reset();
  // The actual Start handler owns audio.unlock(). A canvas click cannot unlock it.
  await page.locator('#start').click();
  await page.waitForTimeout(500);
  await page.evaluate(stageV2,{rig,room,tier,heavy:true,setupOnly:true});
  assert([...audioContexts.values()].some(c=>c.contextType==='realtime'&&c.contextState==='running'),'Native audio context was not unlocked by Start');
  await cdp.send('Performance.enable');
  const traceEvents=[];if(profile)cdp.on('Tracing.dataCollected',event=>traceEvents.push(...event.value));
  if(profile){await cdp.send('Tracing.start',{categories:'v8,disabled-by-default-v8.gc',transferMode:'ReportEvents'});await cdp.send('Profiler.enable');await cdp.send('Profiler.start');await cdp.send('HeapProfiler.startSampling',{samplingInterval:32768,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true});}
  if(args.includes('--audit-costs'))await page.evaluate(installCostAudit);
  const initial=await cdp.send('Performance.getMetrics');
  let audioPollWork=Promise.resolve();
  const audioPoll=profile?setInterval(()=>{audioPollWork=audioPollWork.then(async()=>{for(const context of audioContexts.values())if(context.contextType==='realtime'){try{const {realtimeData}=await cdp.send('WebAudio.getRealtimeData',{contextId:context.contextId});audioSamples.push({contextId:context.contextId,...realtimeData});}catch(error){audioError=String(error);}}});},500):null;
  if(audioPoll)timers.add(audioPoll);
  const data=await page.evaluate(async ({seconds,audit,auditCosts})=>{
   const d=window.__containmentDebug,g=d.game,r=d.renderer,gl=r.renderer.getContext();
   const capacity=Math.ceil(seconds*240), samples={frame:[],update:[],render:[],hud:[],audio:[],draws:[],triangles:[],lights:[],instances:[],gpu:[],driver:[],enemies:[],sceneInstances:[],sceneLights:[]};
   const costAudit=auditCosts?r.__benchCostAudit:null;
   if(auditCosts&&!costAudit)throw Error('Cost audit was not installed');
   if(costAudit)for(const key of costAudit.keys)samples[key]=[];
   const values={};for(const key of Object.keys(samples))values[key]=new Float64Array(capacity);
   let count=0,programs=0,peakInstances=0,driverMs=0;const create=gl.createProgram;
   gl.createProgram=function(){programs++;return create.call(gl);};
   const ext=gl.getExtension('EXT_disjoint_timer_query_webgl2'),pending=[];let frame=0;
   const original=r.render,direct=r.renderer.renderBufferDirect,drawObjects=new Map();let peakDrawReport=null,peakDrawCalls=0;
   if(audit)r.renderer.renderBufferDirect=function(camera,scene,geometry,material,object,group){const result=direct.call(this,camera,scene,geometry,material,object,group);drawObjects.set(object,(drawObjects.get(object)??0)+1);return result;};
   r.render=function(...args){
    if(audit)drawObjects.clear();
    const query=ext&&frame++%15===0?gl.createQuery():null;
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
    values.driver[count]=driverMs;values.update[count]+=driverMs;driverMs=0;values.enemies[count]=g.enemies.activeCount;
    values.draws[count]=r.renderer.info.render.calls;values.triangles[count]=r.renderer.info.render.triangles;
    let lights=0;for(const l of r.lighting.pool.lights)if(l.intensity>0)lights++;
    values.lights[count]=lights;
    let instances=0;const visit=o=>{if(!o.visible)return;if(o.isInstancedMesh)instances+=o.count;for(const c of o.children)visit(c);};visit(r.interimAbilities.root);values.instances[count]=instances;peakInstances=Math.max(peakInstances,instances);
    let sceneInstances=0,sceneLights=0;
    for(const mesh of allInstanceMeshes)if(shown(mesh))sceneInstances+=mesh.count;
    for(const light of allSceneLights)if(light.intensity>0&&shown(light))sceneLights++;
    values.sceneInstances[count]=sceneInstances;values.sceneLights[count]=sceneLights;
    if(costAudit)costAudit.sample(values,count);
    count++;
   });
   const sceneLightInventory=allSceneLights.length,instanceMeshInventory=allInstanceMeshes.length;
   const lane=d.benchmarkLane,refillPoints=[];
   for(let radius=180;radius<=480;radius+=60)for(let i=0;i<32;i++){const a=i*Math.PI/16,x=lane.x+Math.cos(a)*radius,y=lane.y+Math.sin(a)*radius;if(d.canStand(x,y,40))refillPoints.push({x,y});}
   const refillTypes=['brute','spitter','crawler','stalker','carrier'];
   let refillCursor=0,refillSerial=0,replenished=0;
   const refill=()=>{
    if(g.enemies.activeCount>=25)return;
    const enemies=g.enemies.snapshot.enemies;
    for(let attempt=0;attempt<refillPoints.length;attempt++){
     const point=refillPoints[refillCursor++%refillPoints.length],distance=Math.hypot(point.x-g.player.x,point.y-g.player.y);
     if(distance<180||distance>620||!d.clearShot(point.x,point.y))continue;
     let clear=true;for(const e of enemies)if(e.health>0&&Math.hypot(e.x-point.x,e.y-point.y)<e.radius+52){clear=false;break;}
     if(!clear)continue;
     if(d.spawn(refillTypes[refillSerial%5],point.x,point.y,refillSerial%6===0)){replenished++;refillSerial++;break;}
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
   d.realtime(true);
   try{
    while(performance.now()-start<seconds*1000){
     const driverStarted=performance.now(),elapsed=(driverStarted-start)/1000;
     if(elapsed>=nextRefill){refill();nextRefill=elapsed+.02;}
     // Reverse a short, legal kiting vector. Collision remains authoritative.
     const side=Math.sin(elapsed*1.2)>0?1:-1;
     d.setInput({fire:true,x:-Math.sin(lane.angle)*side*.25,y:Math.cos(lane.angle)*side*.25,angle:null,autoAim:true});
     if(elapsed>=nextPowerTry){tryPower();nextPowerTry=elapsed+.25;}
     for(const slot of ['tactical','dash','overdrive'])if(g.abilities.snapshot.slots[slot].ready&&g.useAbility(slot))uses[slot]++;
     driverMs+=performance.now()-driverStarted;
     await new Promise(requestAnimationFrame);
    }
   }finally{d.realtime(false);d.observePerformance(undefined);gl.createProgram=create;r.render=original;r.renderer.renderBufferDirect=direct;costAudit?.dispose();}
   const gpu=[];for(const q of pending){if(gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE)&&!gl.getParameter(ext.GPU_DISJOINT_EXT))gpu.push(gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6);gl.deleteQuery(q);}
   for(const key of Object.keys(samples))samples[key]=Array.from(values[key].subarray(0,count));samples.gpu=gpu;
   let finalLightInventory=0,finalInstanceMeshInventory=0;
   r.scene.traverse(o=>{if(o.isLight)finalLightInventory++;if(o.isInstancedMesh)finalInstanceMeshInventory++;});r.hudScene.traverse(o=>{if(o.isInstancedMesh)finalInstanceMeshInventory++;});
   return {initialStatus,initialPhase,finalStatus:g.status,finalPhase:g.expedition.run.phase,roomLoading:r.roomLoading,bodyState:document.body.dataset.state,roomLoadingIndicatorHidden:document.getElementById('room-loading')?.hidden,costAudit:costAudit?{instrumented:true,postPasses:costAudit.postPasses,particleScope:'CPU AttackEffects.drawParticles lists and live ElementKit particles; ability slot scans retained separately; GPU atmosphere excluded',stateScope:'GL state setter API calls; program switches count changed useProgram handles'}:null,instanceMeshInventory,finalInstanceMeshInventory,finalLightInventory,peakDrawReport,replenished,build:g.expedition.build,glError:gl.getError(),contextLost:gl.isContextLost(),samples,count,programs,uses,initialEnemies,remainingEnemies:g.enemies.activeCount,simulationSeconds:g.elapsed-initialElapsed,initialPlayer,finalPlayer:{x:g.player.x,y:g.player.y},sceneLightInventory,wallSeconds:(performance.now()-start)/1000,programInventory:r.renderer.info.programs.length,abilityPool:r.interimAbilities.kit.counts,gpuSupported:!!ext,heap:performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize}:null};
  },{seconds,audit:args.includes('--audit-draws'),auditCosts:args.includes('--audit-costs')});
  if(audioPoll){clearInterval(audioPoll);timers.delete(audioPoll);}await audioPollWork;
  const final=await cdp.send('Performance.getMetrics');
  let profiling=null;
  if(profile){const cpu=await cdp.send('Profiler.stop'),heap=await cdp.send('HeapProfiler.stopSampling');
   const complete=new Promise(ok=>cdp.once('Tracing.tracingComplete',ok));await cdp.send('Tracing.end');await complete;
   await writeFile(resolve(out,name+'.trace.json'),JSON.stringify({traceEvents}));
   const outerGC=traceEvents.filter(e=>e.ph==='X'&&/^(MinorGC|MajorGC)$/.test(e.name));
   const gcEvents=outerGC.length?outerGC:traceEvents.filter(e=>e.ph==='X'&&/V8.GC_SCAVENGER$|V8.GC_MARK_COMPACTOR$/.test(e.name));
   const gc=gcEvents.map(e=>(e.dur??0)/1000),gcEventNames=[...new Set(traceEvents.filter(e=>/gc|garbage/i.test(e.name)).map(e=>e.name))];
   const allocated=heap.profile.samples.reduce((n,s)=>n+s.size,0);profiling={audioContexts:[...audioContexts.values()],audioSamples,audioError,gcEventNames,sampledAllocationBytes:allocated,sampledAllocationBytesPerSecond:allocated/data.wallSeconds,gcPausesMs:gc};await writeFile(resolve(out,name+'.cpuprofile'),JSON.stringify(cpu.profile));await writeFile(resolve(out,name+'.heapprofile'),JSON.stringify(heap.profile));}
  await cdp.detach();
  const stats=values=>{if(!values.length)return null;const s=[...values].sort((a,b)=>a-b);return {min:s[0],p50:s[Math.floor((s.length-1)*.5)],p95:s[Math.ceil(s.length*.95)-1],max:s.at(-1),average:s.reduce((a,b)=>a+b,0)/s.length};};
  const summary=Object.fromEntries(Object.entries(data.samples).map(([k,v])=>[k,stats(k==='frame'?v.slice(1):v)]));
  // The first RAF interval begins before the measurement window; retain it raw, exclude it only from frame statistics.
  if(profile){summary.audioGraphCapacityPercent=stats(audioSamples.map(s=>s.renderCapacity));summary.audioCallbackIntervalMean=stats(audioSamples.map(s=>s.callbackIntervalMean));}
  summary.updateRender=stats(data.samples.update.map((v,i)=>v+data.samples.render[i]));
  // HUD synchronization runs after render; include it in the conservative main-thread total.
  summary.cpu=stats(data.samples.update.map((v,i)=>v+data.samples.render[i]+data.samples.hud[i]));
  const budget={cpuP95:summary.cpu.p95<=8,frameP95:summary.frame.p95<=16.6,draws:summary.draws.max<=350,headroomDraws:summary.draws.max<=330,programs:data.programs===0};
  const run={name,room,rig,tier,repeat,nativeAudioContexts:[...audioContexts.values()],before,after:host(),profile,profiling,summary,budget,...data,cdp:{initial:initial.metrics,final:final.metrics}};
  report.runs.push(run);await writeFile(resolve(out,'benchmark.json'),JSON.stringify(report,null,2));
  console.log(`${name}: frame ${summary.frame.p50.toFixed(2)}/${summary.frame.p95.toFixed(2)}ms CPU ${summary.cpu.p50.toFixed(2)}/${summary.cpu.p95.toFixed(2)}ms draws ${summary.draws.max}, compiles ${data.programs}`);
  assert.equal(data.programs,0,'Mid-combat shader compile');
  assert(!data.glError&&!data.contextLost,'WebGL error or lost context during combat');
  assert.equal(data.finalLightInventory,data.sceneLightInventory,'Combat allocated new scene lights');assert.equal(data.finalInstanceMeshInventory,data.instanceMeshInventory,'Combat allocated new instance meshes');
  if(!baseline&&!budget.draws)report.budgetFailures.push({scenario:name,metric:'draws',observed:summary.draws.max,limit:350});
  if(!baseline&&!budget.headroomDraws)report.budgetFailures.push({scenario:name,metric:'headroomDraws',observed:summary.draws.max,limit:330});
  assert(summary.lights.max<=(tier==='high'?9:2),'Shared light budget exceeded');
  assert(summary.instances.max<=4096,'Fixed ability instance inventory exceeded');
  assert(Object.values(data.uses).every(n=>n>0),'Full kit lacks accepted native slot receipts');
  assert(data.initialEnemies===25&&data.simulationSeconds>0,'Benchmark did not run the live encounter');
  assert(summary.enemies.average>=22&&summary.enemies.p50>=24,'Combat population fell below sustained stress threshold');
 }
 if(report.auditCosts){
  console.log('Cost audit columns are per-frame p50 / p95 / max counts; timings include probe overhead.');
  console.table(report.runs.map(r=>({scenario:r.name,driverCalls:tripleCost(r.summary.glDriverCalls),useProgram:tripleCost(r.summary.glUseProgramCalls),programSwitches:tripleCost(r.summary.glProgramSwitches),stateCalls:tripleCost(r.summary.glStateCalls),uniformUploads:tripleCost(r.summary.glUniformUploads),localComposes:tripleCost(r.summary.localMatrixComposes),worldRecomputes:tripleCost(r.summary.worldMatrixRecomputes),shadowMaps:tripleCost(r.summary.shadowMapsRendered),shadowDraws:tripleCost(r.summary.shadowDraws),postPasses:tripleCost(r.summary.postPasses),postPixels:tripleCost(r.summary.postPixels),particlesAdvanced:tripleCost(r.summary.particlesAdvanced)})));
  console.table(report.runs.flatMap(r=>r.costAudit.postPasses.filter(pass=>pass.resolutions.length).map(pass=>({scenario:r.name,pass:pass.name,resolutions:pass.resolutions.map(size=>`${size.width}x${size.height}`).join(','),calls:tripleCost(r.summary['post_'+pass.name])}))));
 }
 function tripleCost(s){return s?`${s.p50}/${s.p95}/${s.max}`:'unavailable';}
 const triple=s=>s?`${s.p50.toFixed(2)}/${s.p95.toFixed(2)}/${s.max.toFixed(2)}`:'unavailable';
 console.log('Timing columns are p50 / p95 / max milliseconds');
 console.table(report.runs.map(r=>({scenario:r.name,load:r.before.load[0].toFixed(1),frame:triple(r.summary.frame),update:triple(r.summary.update),render:triple(r.summary.render),hud:triple(r.summary.hud),audioSync:triple(r.summary.audio),cpu:triple(r.summary.cpu),gpu:triple(r.summary.gpu)})));
 console.table(report.runs.map(r=>({scenario:r.name,draws:r.summary.draws.max,triangles:r.summary.triangles.max,lights:r.summary.lights.max,instances:r.summary.instances.max,programs:r.programInventory,compiles:r.programs,allocationBytesPerSecond:r.profiling?.sampledAllocationBytesPerSecond??'not sampled',gcMaxMs:r.profiling?Math.max(0,...r.profiling.gcPausesMs):'not traced'})));
 assert.equal(report.errors.length,0,report.errors.join('\n'));
 if(report.budgetFailures.length){console.error('Final resource budget misses:',JSON.stringify(report.budgetFailures));process.exitCode=2;}
}catch(error){report.errors.push({type:'runner',message:String(error)});throw error;}finally{for(const timer of timers)clearInterval(timer);await writeFile(resolve(out,'benchmark.json'),JSON.stringify(report,null,2));await browser?.close();await new Promise(ok=>server.close(ok));}
