/**
 * Opt-in asynchronous GPU stage timings. This function is serialized into the
 * production page so it deliberately has no module-scope dependencies.
 */
export function installGpuPassAudit(configuration = {}) {
  // Direct renderer-root input is retained for deterministic harness tests.
  const r = configuration.rendererRoot ?? (configuration.renderer ? configuration : globalThis.__containmentDebug.renderer);
  const flush = configuration.flush === true;
  if (r.__benchGpuPassAudit) throw Error('GPU pass audit already installed');
  const renderer = r.renderer, gl = renderer.getContext();
  const extension = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const undo = [], pending = [], passes = new Map();
  // Runtime adaptive feedback uses a total-frame query; stage timings own the
  // same WebGL query target for this opt-in trial and restore it afterwards.
  const runtimeTimer = r.post?.gpuTimer, runtimeEnabled = runtimeTimer?.enabled;
  runtimeTimer?.setEnabled(false);
  const diagnostics = { sampledFrames: 0, disjointEvents: 0, skippedBusy: 0, skippedCapacity: 0, abandonedQueries: 0, flushCalls: 0 };
  let frame = 0, sampling = false, active = false, disposed = false;
  let selectedStage, rotation = 0, queriedFrame = false, missedSelections = 0;
  let shadowLights = null, sceneScope = null, directQuery = null;
  const targetInventory = new Set(), trackedTargets = new WeakSet();
  function trackTarget(target){
    targetInventory.add(target);
    if(trackedTargets.has(target)||!target.addEventListener)return;
    trackedTargets.add(target);
    const release=()=>targetInventory.delete(target);
    target.addEventListener('dispose',release);undo.push(()=>target.removeEventListener('dispose',release));
  }
  const stages = [], cadence = 3, capacity = 512;

  function wrap(object, name, factory) {
    if (!object || typeof object[name] !== 'function') return;
    const own = Object.getOwnPropertyDescriptor(object, name), original = object[name];
    object[name] = factory(original);
    undo.push(() => { if (own) Object.defineProperty(object, name, own); else delete object[name]; });
  }

  function retire(query) { gl.deleteQuery(query); }
  function poll() {
    if (!extension || disposed) return;
    if (gl.isContextLost?.()) {
      diagnostics.abandonedQueries += pending.length;
      for(const entry of pending)entry.pass.frameGpu.delete(entry.frame);
      pending.length = 0;
      return;
    }
    if (gl.getParameter(extension.GPU_DISJOINT_EXT)) {
      diagnostics.disjointEvents++;
      for (const entry of pending) {retire(entry.query);entry.pass.frameGpu.delete(entry.frame);}
      pending.length = 0;
      // Completed samples from before this event are valid; none of the queries
      // whose execution might cross the disjoint interval are retained.
      return;
    }
    for (let index = 0; index < pending.length;) {
      const entry = pending[index];
      if (!gl.getQueryParameter(entry.query, gl.QUERY_RESULT_AVAILABLE)) { index++; continue; }
      const elapsed = gl.getQueryParameter(entry.query, gl.QUERY_RESULT) / 1e6;
      if (Number.isFinite(elapsed) && elapsed >= 0) entry.pass.frameGpu.set(entry.frame, (entry.pass.frameGpu.get(entry.frame) ?? 0) + elapsed);
      else entry.pass.invalidFrames.add(entry.frame);
      retire(entry.query);
      pending.splice(index, 1);
    }
  }

  function recordResolution(pass, width, height) {
    if (pass && width > 0 && height > 0 && !pass.resolutions.some(size => size.width === width && size.height === height)) pass.resolutions.push({ width, height, pixels: width * height });
  }

  function getPass(name) {
    if (!stages.includes(name)) stages.push(name);
    let pass = passes.get(name);
    if (!pass) {
      pass = { name, samplesMs: [], frameGpu: new Map(), invalidFrames: new Set(), resolutions: [], frames: new Map(), scope: name === 'sceneColor' ? 'Inclusive scene render; do not add exclusive mainOpaque/transparentVFX/shadows' : name === 'mainOpaque' || name === 'transparentVFX' ? 'Exclusive native renderBufferDirect submission groups; excludes shadows and screen post' : 'Named submission scope' };
      passes.set(name, pass);
    }
    return pass;
  }
  function count(name, target, calls, triangles, pixels) {
    const pass=getPass(name), sample=pass.frames.get(frame)??{draws:0,triangles:0,targetPixels:0};
    sample.draws+=calls;sample.triangles+=triangles;
    if(name==='mainOpaque'||name==='transparentVFX')sample.targetPixels=Math.max(sample.targetPixels,pixels);else sample.targetPixels+=pixels;
    pass.frames.set(frame,sample);
    if(name!=='shadows')recordResolution(pass,target?.width??gl.drawingBufferWidth,target?.height??gl.drawingBufferHeight);
  }
  function measure(name, target, body) {
    const pass=getPass(name), before={...renderer.info.render};
    const counted=()=>{try{return body();}finally{const after=renderer.info.render;count(name,target,Math.max(0,after.calls-before.calls),Math.max(0,after.triangles-before.triangles),name==='shadows'?0:(target?.width??gl.drawingBufferWidth)*(target?.height??gl.drawingBufferHeight));}};
    if (!extension || !sampling || name !== selectedStage || queriedFrame || disposed) return counted();
    if (active || gl.getQuery(extension.TIME_ELAPSED_EXT, gl.CURRENT_QUERY)) {
      diagnostics.skippedBusy++;
      return counted();
    }
    if (pending.length >= capacity) { diagnostics.skippedCapacity++; return counted(); }
    const query = gl.createQuery();
    if (!query) return counted();
    if (name !== 'shadows') recordResolution(pass, target?.width ?? gl.drawingBufferWidth, target?.height ?? gl.drawingBufferHeight);
    if (flush) { gl.flush(); diagnostics.flushCalls++; }
    active = true;
    queriedFrame = true;
    gl.beginQuery(extension.TIME_ELAPSED_EXT, query);
    try { return counted(); }
    finally {
      gl.endQuery(extension.TIME_ELAPSED_EXT);
      if (flush) { gl.flush(); diagnostics.flushCalls++; }
      active = false;
      pending.push({ query, pass, frame });
    }
  }

  function endDirect() {
    if(!directQuery)return;
    if(gl.isContextLost?.()){directQuery.pass.invalidFrames.add(directQuery.frame);directQuery=null;active=false;diagnostics.abandonedQueries++;return;}
    gl.endQuery(extension.TIME_ELAPSED_EXT);
    if(flush){gl.flush();diagnostics.flushCalls++;}
    pending.push(directQuery);directQuery=null;active=false;queriedFrame=true;
  }
  wrap(renderer,'renderBufferDirect',original=>function(camera,scene,geometry,material,object,group){
    const name=shadowLights?'shadows':sceneScope==='sceneColor'?(material.transparent?'transparentVFX':'mainOpaque'):null;
    if(directQuery&&directQuery.pass.name!==name)endDirect();
    if(name)getPass(name);
    if(name&&name!=='shadows'&&extension&&sampling&&selectedStage===name&&!active&&!disposed&&pending.length<capacity&&!gl.getQuery(extension.TIME_ELAPSED_EXT,gl.CURRENT_QUERY)){
      const query=gl.createQuery();if(query){if(flush){gl.flush();diagnostics.flushCalls++;}gl.beginQuery(extension.TIME_ELAPSED_EXT,query);directQuery={query,pass:getPass(name),frame};active=true;}
    }
    const before={...renderer.info.render},target=renderer.getRenderTarget();
    try{return original.call(this,camera,scene,geometry,material,object,group);}
    finally{if(name&&name!=='shadows'){const after=renderer.info.render;count(name,target,Math.max(0,after.calls-before.calls),Math.max(0,after.triangles-before.triangles),(target?.width??gl.drawingBufferWidth)*(target?.height??gl.drawingBufferHeight));}}
  });
  wrap(r, 'render', original => function (...parameters) {
    poll();
    sampling = frame++ % cadence === 0 && stages.length > 0;
    selectedStage = sampling ? stages[rotation % stages.length] : undefined;
    queriedFrame = false;
    if (sampling) diagnostics.sampledFrames++;
    try { return measure('frameTotal',null,()=>original.apply(this, parameters)); }
    finally {
      // Give intermittent shadow updates a second sampled frame of opposite
      // parity; absent transient passes cannot stall the stage rotation.
      if (sampling && (queriedFrame || ++missedSelections >= 2)) { rotation++; missedSelections = 0; }
      sampling = false;
    }
  });
  wrap(renderer.shadowMap, 'render', original => function (lights, ...parameters) {
    if (!this.enabled || !(this.autoUpdate || this.needsUpdate) || !lights.length) return original.call(this, lights, ...parameters);
    const previous = shadowLights;
    shadowLights = lights;
    try { return measure('shadows', null, () => original.call(this, lights, ...parameters)); }
    finally { shadowLights = previous; }
  });
  wrap(renderer, 'setRenderTarget', original => function (target, ...parameters) {
    // Only actual bindings to a known light-owned map enter the shadow pixel
    // metadata; the screen size or an unallocated expected map is never guessed.
    if(target)trackTarget(target);
    if (target && shadowLights?.some(light => light.shadow?.map === target)) {recordResolution(getPass('shadows'), target.width, target.height);const pass=getPass('shadows'),sample=pass.frames.get(frame)??{draws:0,triangles:0,targetPixels:0};sample.targetPixels+=target.width*target.height;pass.frames.set(frame,sample);}
    return original.call(this, target, ...parameters);
  });
  wrap(renderer, 'render', original => function (scene, ...parameters) {
    const name = scene === r.scene ? 'sceneColor' : scene === r.hudScene ? 'hud' : null;
    const previous=sceneScope;sceneScope=name;
    const body = () => original.call(this, scene, ...parameters);
    try{return name ? measure(name, renderer.getRenderTarget(), body) : body();}
    finally{endDirect();sceneScope=previous;}
  });
  wrap(r.post?.softDepth,'blit',original=>function(...parameters){endDirect();return measure('gasDepthSnapshot',this.target,()=>original.apply(this,parameters));});
  wrap(r.post, 'draw', original => function (material, target, ...parameters) {
    const resources = this.resources;
    let name = 'otherPost';
    if (material === resources?.occlusion) name = 'contactAO';
    else if (material === resources?.gtao?.material) name = 'gtao';
    else if (material === resources?.gtao?.denoiseMaterial) name = 'aoDenoise';
    else if (material === resources?.extract) name = 'bloomExtract';
    else if (material === resources?.blur) name = target === resources.bloomB ? 'bloomBlurHorizontal' : 'bloomBlurVertical';
    else if (material === resources?.distort) name = 'distortion';
    else if (material === resources?.composite) name = 'composite';
    else if (material === resources?.antialias) name = 'finalAA';
    return measure(name, target, () => original.call(this, material, target, ...parameters));
  });

  function memoryInventory() {
    const textures=new Set(),targets=new Set(targetInventory);
    if(r.post?.softDepth?.target)targets.add(r.post.softDepth.target);
    for(const value of Object.values(r.post?.resources??{}))if(value?.isWebGLRenderTarget)targets.add(value);
    const visitTexture=value=>{if(value?.isTexture)textures.add(value);};
    for(const scene of [r.scene,r.hudScene])scene?.traverse(object=>{
      visitTexture(object.skeleton?.boneTexture);
      for(const material of (Array.isArray(object.material)?object.material:[object.material]))if(material){
        for(const value of Object.values(material))visitTexture(value);
        for(const uniform of Object.values(material.uniforms??{})){visitTexture(uniform?.value);if(Array.isArray(uniform?.value))for(const value of uniform.value)visitTexture(value);}
      }
      if(object.shadow?.map)targets.add(object.shadow.map);
    });
    const rtTextures=new Set();
    for(const target of targets){for(const texture of target.textures??[target.texture]){textures.add(texture);rtTextures.add(texture);}if(target.depthTexture){textures.add(target.depthTexture);rtTextures.add(target.depthTexture);}}
    function bytes(texture,width,height){
      const image=texture.image??texture.source?.data;
      width=width??image?.width??image?.[0]?.width??0;height=height??image?.height??image?.[0]?.height??0;
      const channels=texture.format===1022||texture.format===1032?3:texture.format===1023||texture.format===1033?4:texture.format===1030||texture.format===1031?2:1;
      const component=[1011,1012,1016,1017,1018].includes(texture.type)?2:[1015,1013,1014].includes(texture.type)?4:1;
      const packed=[1017,1018].includes(texture.type)?2:[1020,35899,35902].includes(texture.type)?4:null;
      const face=texture.isCubeTexture?6:1,depth=image?.depth??1;
      let texels=width*height*depth;
      if(texture.generateMipmaps){let w=width,h=height,d=depth;while(w>1||h>1||(texture.isData3DTexture&&d>1)){w=Math.max(1,Math.floor(w/2));h=Math.max(1,Math.floor(h/2));if(texture.isData3DTexture)d=Math.max(1,Math.floor(d/2));texels+=w*h*d;}}
      return {width,height,format:texture.format,type:texture.type,bytes:Math.ceil(texels*face*(packed??channels*component))};
    }
    const entries=[...textures].map(texture=>({name:texture.name||texture.uuid,renderTarget:rtTextures.has(texture),...bytes(texture)}));
    let renderbufferBytes=0;
    for(const target of targets){if(target.depthBuffer&&!target.depthTexture)renderbufferBytes+=target.width*target.height*4;if(target.samples>0)renderbufferBytes+=target.width*target.height*4*(target.textures?.length??1)*target.samples;}
    return {scope:'Estimated resident payload of scene material textures and observed/post/shadow render targets; not driver allocation telemetry',assumptions:'Texture dimensions, Three r185 format/type and mip-chain texel counts; no driver padding, compressed-format decoding, source alias deduplication or hidden browser buffers. Only scene material references and observed/post/shadow targets are inventoried; unreferenced cached/pool assets may be absent. Visible skeleton bone textures are included. Renderbuffer estimates use 4 bytes per depth pixel and per multisample color pixel, so non-RGBA8 multisample targets are approximate. Fill is render-target pixels times named submissions; opaque/transparent groups each count one target footprint per frame. It is not measured fragment invocations or quad overdraw. Inclusive scopes overlap exclusive scopes.',textures:entries,textureBytes:entries.filter(entry=>!entry.renderTarget).reduce((sum,entry)=>sum+entry.bytes,0),renderTargetTextureBytes:entries.filter(entry=>entry.renderTarget).reduce((sum,entry)=>sum+entry.bytes,0),renderbufferBytes,renderTargets:[...targets].map(target=>({width:target.width,height:target.height,samples:target.samples,attachments:target.textures?.length??1,depth:target.depthBuffer}))};
  }

  const api = {
    supported: !!extension, cadence, capacity, flush, mode: 'one rotating stage per sampled frame', diagnostics, poll,
    snapshot() {
      poll();
      return { supported: !!extension, cadence, capacity, flush, mode: 'one rotating stage per sampled frame', stageOrder: [...stages], diagnostics: { ...diagnostics, pendingQueries: pending.length }, memory: memoryInventory(), passes: [...passes.values()].map(({frameGpu,invalidFrames,frames,...pass}) => ({ ...pass, samplesMs: [...frameGpu].filter(([id])=>!invalidFrames.has(id)&&!pending.some(entry=>entry.frame===id&&entry.pass.name===pass.name)).map(([,ms])=>ms), counts: [...frames].map(([frame,sample])=>({frame,...sample})), resolutions: pass.resolutions.map(size => ({ ...size })) })) };
    },
    dispose() {
      if (disposed) return;
      endDirect();
      for (let index = undo.length - 1; index >= 0; index--) undo[index]();
      if (!gl.isContextLost?.()) for (const entry of pending) retire(entry.query);
      diagnostics.abandonedQueries += pending.length;
      pending.length = 0;
      disposed = true;
      delete r.__benchGpuPassAudit;
      if (runtimeEnabled !== undefined) runtimeTimer.setEnabled(runtimeEnabled);
    },
  };
  r.__benchGpuPassAudit = api;
  return { supported: api.supported, cadence, capacity, flush, mode: api.mode };
}
