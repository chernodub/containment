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
  let shadowLights = null;
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
      pending.length = 0;
      return;
    }
    if (gl.getParameter(extension.GPU_DISJOINT_EXT)) {
      diagnostics.disjointEvents++;
      for (const entry of pending) retire(entry.query);
      pending.length = 0;
      // Completed samples from before this event are valid; none of the queries
      // whose execution might cross the disjoint interval are retained.
      return;
    }
    for (let index = 0; index < pending.length;) {
      const entry = pending[index];
      if (!gl.getQueryParameter(entry.query, gl.QUERY_RESULT_AVAILABLE)) { index++; continue; }
      const elapsed = gl.getQueryParameter(entry.query, gl.QUERY_RESULT) / 1e6;
      if (Number.isFinite(elapsed) && elapsed >= 0) entry.pass.samplesMs.push(elapsed);
      retire(entry.query);
      pending.splice(index, 1);
    }
  }

  function recordResolution(pass, width, height) {
    if (pass && width > 0 && height > 0 && !pass.resolutions.some(size => size.width === width && size.height === height)) pass.resolutions.push({ width, height, pixels: width * height });
  }

  function measure(name, target, body) {
    if (!stages.includes(name)) stages.push(name);
    if (!extension || !sampling || name !== selectedStage || queriedFrame || disposed) return body();
    if (active || gl.getQuery(extension.TIME_ELAPSED_EXT, gl.CURRENT_QUERY)) {
      diagnostics.skippedBusy++;
      return body();
    }
    if (pending.length >= capacity) { diagnostics.skippedCapacity++; return body(); }
    const query = gl.createQuery();
    if (!query) return body();
    let pass = passes.get(name);
    if (!pass) {
      pass = { name, samplesMs: [], resolutions: [], scope: name === 'sceneColor' ? 'Scene render including any shadow updates and HDR resolve' : name === 'shadows' ? 'Shadow update only; dimensions are actual shadow-map target bindings during measured updates' : 'One render submission' };
      passes.set(name, pass);
    }
    if (name !== 'shadows') recordResolution(pass, target?.width ?? gl.drawingBufferWidth, target?.height ?? gl.drawingBufferHeight);
    if (flush) { gl.flush(); diagnostics.flushCalls++; }
    active = true;
    queriedFrame = true;
    gl.beginQuery(extension.TIME_ELAPSED_EXT, query);
    try { return body(); }
    finally {
      gl.endQuery(extension.TIME_ELAPSED_EXT);
      if (flush) { gl.flush(); diagnostics.flushCalls++; }
      active = false;
      pending.push({ query, pass });
    }
  }

  wrap(r, 'render', original => function (...parameters) {
    poll();
    sampling = frame++ % cadence === 0 && stages.length > 0;
    selectedStage = sampling ? stages[rotation % stages.length] : undefined;
    queriedFrame = false;
    if (sampling) diagnostics.sampledFrames++;
    try { return original.apply(this, parameters); }
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
    if (active && selectedStage === 'shadows' && target && shadowLights?.some(light => light.shadow?.map === target)) recordResolution(passes.get('shadows'), target.width, target.height);
    return original.call(this, target, ...parameters);
  });
  wrap(renderer, 'render', original => function (scene, ...parameters) {
    const name = scene === r.scene ? 'sceneColor' : scene === r.hudScene ? 'hud' : null;
    const body = () => original.call(this, scene, ...parameters);
    return name ? measure(name, renderer.getRenderTarget(), body) : body();
  });
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
    return measure(name, target, () => original.call(this, material, target, ...parameters));
  });

  const api = {
    supported: !!extension, cadence, capacity, flush, mode: 'one rotating stage per sampled frame', diagnostics, poll,
    snapshot() {
      poll();
      return { supported: !!extension, cadence, capacity, flush, mode: 'one rotating stage per sampled frame', stageOrder: [...stages], diagnostics: { ...diagnostics, pendingQueries: pending.length }, passes: [...passes.values()].map(pass => ({ ...pass, samplesMs: [...pass.samplesMs], resolutions: pass.resolutions.map(size => ({ ...size })) })) };
    },
    dispose() {
      if (disposed) return;
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
