/**
 * Serialized opt-in browser harness. It has no module-scope dependencies and
 * allocates no materials or targets. Queue-only access shares its actual query
 * lifecycle with the pure mock tests below.
 */
export function runGpuMicro(configuration = {}) {
  function makeQueue(gl, extension, options = {}) {
    const maximumPending = Math.max(1, Math.min(8, options.maximumPending ?? 4));
    const maximumAgeFrames = Math.max(1, Math.min(240, options.maximumAgeFrames ?? 120));
    const maximumAgeMs = Math.max(1, Math.min(10000, options.maximumAgeMs ?? 3000));
    const pending = [];
    let active = null, disposed = false;
    const diagnostics = { started: 0, resolved: 0, disjoint: 0, stale: 0, abandoned: 0, busy: 0, capacity: 0, peakPending: 0 };
    const retire = (entry, status, time) => {
      entry.sample.status = status;
      entry.sample.resolvedAtMs = time;
      if (!gl.isContextLost()) gl.deleteQuery(entry.query);
    };
    return {
      diagnostics,
      get pendingCount() { return pending.length; },
      begin(sample, frame, time) {
        if (disposed || !extension || gl.isContextLost()) { sample.status = 'unavailable'; return false; }
        if (active || gl.getQuery(extension.TIME_ELAPSED_EXT, gl.CURRENT_QUERY)) { diagnostics.busy++; sample.status = 'busy'; return false; }
        if (gl.getParameter(extension.GPU_DISJOINT_EXT)) { diagnostics.disjoint++; sample.status = 'disjoint'; return false; }
        if (pending.length >= maximumPending) { diagnostics.capacity++; sample.status = 'capacity'; return false; }
        const query = gl.createQuery();
        if (!query) { sample.status = 'query-allocation-failed'; return false; }
        active = { query, sample, frame, time };
        sample.status = 'active'; sample.submittedAtMs = time; sample.submittedFrame = frame;
        try { gl.beginQuery(extension.TIME_ELAPSED_EXT, query); }
        catch (error) { retire(active, 'query-begin-failed', time); active = null; throw error; }
        diagnostics.started++;
        return true;
      },
      end(time) {
        if (!active) return;
        const entry = active; active = null;
        if (gl.isContextLost()) { entry.sample.status = 'context-lost'; diagnostics.abandoned++; return; }
        gl.endQuery(extension.TIME_ELAPSED_EXT);
        entry.sample.submissionEndedAtMs = time;
        entry.sample.status = 'pending'; pending.push(entry);
        diagnostics.peakPending = Math.max(diagnostics.peakPending, pending.length);
      },
      poll(frame, time) {
        if (disposed || !extension) return;
        if (gl.isContextLost()) {
          for (const entry of pending) { entry.sample.status = 'context-lost'; diagnostics.abandoned++; }
          pending.length = 0; return;
        }
        if (gl.getParameter(extension.GPU_DISJOINT_EXT)) {
          for (const entry of pending) { retire(entry, 'disjoint', time); diagnostics.disjoint++; }
          pending.length = 0; return;
        }
        for (let index = 0; index < pending.length;) {
          const entry = pending[index];
          if (frame - entry.frame > maximumAgeFrames || time - entry.time > maximumAgeMs) {
            retire(entry, 'stale', time); diagnostics.stale++; pending.splice(index, 1); continue;
          }
          if (!gl.getQueryParameter(entry.query, gl.QUERY_RESULT_AVAILABLE)) { index++; continue; }
          const value = gl.getQueryParameter(entry.query, gl.QUERY_RESULT) / 1e6;
          if (Number.isFinite(value) && value >= 0) { entry.sample.gpuMs = value; diagnostics.resolved++; retire(entry, 'resolved', time); }
          else retire(entry, 'invalid-result', time);
          pending.splice(index, 1);
        }
      },
      dispose(time = 0) {
        if (disposed) return;
        if (active) {
          if (!gl.isContextLost()) gl.endQuery(extension.TIME_ELAPSED_EXT);
          retire(active, 'abandoned', time); diagnostics.abandoned++; active = null;
        }
        for (const entry of pending) { retire(entry, 'abandoned', time); diagnostics.abandoned++; }
        pending.length = 0; disposed = true;
      },
    };
  }
  if (configuration.queueOnly) return makeQueue(configuration.gl, configuration.extension, configuration.queueOptions);
  return (async () => {
    const d = configuration.root ?? globalThis.__containmentDebug;
    const r = d.renderer, renderer = r.renderer, post = r.post, game = d.game;
    const gl = renderer.getContext(), extension = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    const resources = post.resources;
    const requested = [...new Set(configuration.stages ?? ['gtao', 'aoDenoise', 'bloomExtract', 'bloomBlurHorizontal', 'bloomBlurVertical', 'composite', 'finalAA'])].slice(0, 10);
    const sampleCount = Math.max(2, Math.min(4, Math.trunc(configuration.samples ?? 2)));
    const counts = [1, 8, 32];
    const now = configuration.now ?? (() => performance.now());
    const requestFrame = configuration.requestFrame ?? requestAnimationFrame;
    const started = now();
    const result = {
      timingAcceptanceEligible: false,
      kind: 'amplified same-target post throughput; not isolated pass latency or game FPS',
      counts, samplesPerCount: sampleCount, stages: [],
      bounds: { maximumPostStages: 7, maximumRequestedScopes: 10, maximumSamplesPerCount: 4, maximumPendingQueries: 4, maximumFrames: 600, maximumWallMs: 30000 },
      unsupportedScopes: { sceneColor: 'Scene/shadow orchestration is not repeated by this post-only diagnostic.', shadows: 'Scene and shadow scopes overlap; unsupported here.', hud: 'HUD is excluded from synthetic post repeats.' },
      programCreations: 0, programKeys: [],
      notes: ['Every sampled frame executes regular post order with dt0; only one selected draw repeats inside one elapsed query.', 'Inputs, camera and simulation remain frozen. Repeated output targets/cache behavior differ from the ordinary pipeline.', 'Raw elapsed time can retain command-buffer and scheduling effects. A supported slope is throughput only, never ordinary pass latency.'],
    };
    if (!extension || !resources || typeof post.draw !== 'function' || typeof post.render !== 'function') {
      result.unsupportedReason = !extension ? 'timer-extension-unavailable' : 'prepared-post-resources-unavailable';
      result.wallMs = now() - started; return result;
    }
    const known = new Set(['gtao', 'aoDenoise', 'bloomExtract', 'bloomBlurHorizontal', 'bloomBlurVertical', 'composite', 'finalAA']);
    const enabled = name => {
      if (name === 'composite') return true;
      if (name === 'finalAA') return !!resources.antialias;
      if (post.tier !== 'high') return false;
      if (name === 'gtao' || name === 'aoDenoise') return !!post.options?.ambientOcclusion && post.occlusionAlgorithm === 'gtao';
      return !!post.options?.bloom;
    };
    const jobs = [];
    for (const name of requested) {
      const stage = { name, timingAcceptanceEligible: false, samples: [], sameInputs: true };
      result.stages.push(stage);
      if (!known.has(name) || !enabled(name)) { stage.unsupportedReason = result.unsupportedScopes[name] ?? 'stage-not-enabled-or-present-in-selected-prepared-path'; continue; }
      for (let sample = 0; sample < sampleCount; sample++) {
        // Reverse alternate sequences so simple time drift is not always aligned
        // with increasing repeat count. Every raw observation remains retained.
        for (const repeats of sample % 2 ? [...counts].reverse() : counts) jobs.push({ stage, sample, repeats });
      }
    }
    if (typeof post.ensureGpuTimer === 'function' && !post.gpuTimer) { result.unsupportedReason = 'runtime-timer-not-prepared'; result.wallMs = now() - started; return result; }
    if (!jobs.length) { result.unsupportedReason = 'no-enabled-requested-post-stage'; result.wallMs = now() - started; return result; }
    const snapshotVector = name => typeof renderer[name] === 'function' ? renderer[name]({ copy(value) { return value.clone(); } }) : undefined;
    const state = {
      render: r.render, draw: post.draw, createProgram: gl.createProgram,
      renderDescriptor: Object.getOwnPropertyDescriptor(r, 'render'), drawDescriptor: Object.getOwnPropertyDescriptor(post, 'draw'), createDescriptor: Object.getOwnPropertyDescriptor(gl, 'createProgram'),
      target: renderer.getRenderTarget(), mapping: renderer.toneMapping, exposure: renderer.toneMappingExposure,
      autoClear: renderer.autoClear, clearColor: snapshotVector('getClearColor'), clearAlpha: renderer.getClearAlpha?.(),
      viewport: snapshotVector('getViewport'), scissor: snapshotVector('getScissor'), scissorTest: renderer.getScissorTest?.(),
      info: renderer.info?.render ? { ...renderer.info.render } : undefined,
      shadowAuto: renderer.shadowMap?.autoUpdate, shadowDirty: renderer.shadowMap?.needsUpdate,
      timer: post.gpuTimer, timerEnabled: post.gpuTimer?.enabled,
      status: game.status, wasPlaying: game.status === 'playing', moving: game.player?.moving,
      elapsed: game.elapsed,
    };
    const restoreProperty = (object, key, descriptor) => { if (descriptor) Object.defineProperty(object, key, descriptor); else delete object[key]; };
    const restoreStep = (label, body) => { try { body(); } catch (error) { const message = `${label}: ${String(error)}`; result.restoreError ??= message; (result.restoreErrors ??= []).push(message); } };
    const restoreRendererState = () => {
      if (gl.isContextLost()) return;
      renderer.setRenderTarget(state.target);
      renderer.toneMapping = state.mapping; renderer.toneMappingExposure = state.exposure; renderer.autoClear = state.autoClear;
      if (state.clearColor) renderer.setClearColor(state.clearColor, state.clearAlpha);
      if (state.viewport) renderer.setViewport(state.viewport);
      if (state.scissor) renderer.setScissor(state.scissor);
      if (state.scissorTest !== undefined) renderer.setScissorTest(state.scissorTest);
    };
    const queue = makeQueue(gl, extension);
    const created = [], maximumFrames = 600, deadlineMs = 30000;
    let selected = null, frame = 0, cursor = 0;
    const identify = (material, target) => {
      if (material === resources.gtao?.material) return 'gtao';
      if (material === resources.gtao?.denoiseMaterial) return 'aoDenoise';
      if (material === resources.extract) return 'bloomExtract';
      if (material === resources.blur) return target === resources.bloomB ? 'bloomBlurHorizontal' : 'bloomBlurVertical';
      if (material === resources.composite) return 'composite';
      if (material === resources.antialias) return 'finalAA';
      return null;
    };
    try {
      if (state.wasPlaying) game.pause();
      if (state.wasPlaying && game.status !== 'paused') throw Error('Public pause did not freeze simulation');
      state.timer?.setEnabled(false);
      r.render = function () {};
      if (renderer.shadowMap) { renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = false; }
      gl.createProgram = function () { result.programCreations++; const program = state.createProgram.call(gl); if (program) created.push(program); return program; };
      post.draw = function (material, target, ...parameters) {
        if (!selected || selected.used || identify(material, target) !== selected.stage.name) return state.draw.call(this, material, target, ...parameters);
        selected.used = true;
        const sample = selected.observation;
        sample.width = target?.width ?? gl.drawingBufferWidth;
        sample.height = target?.height ?? gl.drawingBufferHeight;
        sample.targetPixels = sample.width * sample.height;
        sample.material = material.name;
        const dimensions = selected.stage.dimensions;
        if (dimensions && (dimensions.width !== sample.width || dimensions.height !== sample.height)) throw Error('Post target dimensions changed during fixed-input micro profile');
        selected.stage.dimensions ??= { width: sample.width, height: sample.height };
        if (!queue.begin(sample, frame, now())) return state.draw.call(this, material, target, ...parameters);
        const cpuStarted = now();
        try { for (let index = 0; index < selected.repeats; index++) state.draw.call(this, material, target, ...parameters); }
        finally { sample.cpuSubmissionMs = now() - cpuStarted; queue.end(now()); }
      };
      while ((cursor < jobs.length || queue.pendingCount) && frame < maximumFrames && now() - started < deadlineMs) {
        await new Promise(resolve => requestFrame(resolve));
        frame++; queue.poll(frame, now());
        if (gl.isContextLost()) throw Error('Context lost during amplified micro profile');
        if (post.resources !== resources) throw Error('Prepared post resources changed during frozen micro profile');
        if (cursor >= jobs.length || queue.pendingCount >= 4) continue;
        const job = jobs[cursor++];
        const observation = { repeats: job.repeats, sample: job.sample, status: 'not-rendered', frame };
        job.stage.samples.push(observation);
        selected = { ...job, observation, used: false };
        const frameStarted = now();
        try { post.render(0); }
        finally { observation.cpuWholePostMs = now() - frameStarted; selected = null; }
      }
      if (cursor < jobs.length || queue.pendingCount) result.boundedStop = { submittedJobs: cursor, plannedJobs: jobs.length, frame, maximumFrames, deadlineMs };
    } catch (error) {
      result.error = String(error);
    } finally {
      restoreStep('query retirement', () => queue.dispose(now()));
      restoreStep('post draw ownership', () => restoreProperty(post, 'draw', state.drawDescriptor));
      restoreStep('renderer ownership', () => restoreProperty(r, 'render', state.renderDescriptor));
      // Logical simulation/timer state restores even if GPU recovery prevents a
      // final screen refresh. No gameplay time is stepped by this harness.
      restoreStep('public pause state', () => { if (state.wasPlaying && game.status === 'paused') game.resume(); });
      restoreStep('moving flag', () => { if (game.player && state.moving !== undefined) game.player.moving = state.moving; });
      restoreStep('cached shadow state', () => { if (renderer.shadowMap) { renderer.shadowMap.autoUpdate = state.shadowAuto; renderer.shadowMap.needsUpdate = state.shadowDirty; } });
      restoreStep('frozen screen refresh', () => {
        if (!gl.isContextLost()) { restoreRendererState(); d.refresh?.(); }
      });
      restoreStep('renderer state', restoreRendererState);
      restoreStep('program hook ownership', () => restoreProperty(gl, 'createProgram', state.createDescriptor));
      restoreStep('shadow state', () => { if (renderer.shadowMap) { renderer.shadowMap.autoUpdate = state.shadowAuto; renderer.shadowMap.needsUpdate = state.shadowDirty; } });
      restoreStep('ordinary draw counters', () => { if (state.info) Object.assign(renderer.info.render, state.info); });
      restoreStep('runtime timer enablement', () => { if (state.timerEnabled !== undefined) state.timer.setEnabled(state.timerEnabled); });
    }
    result.queryLifecycle = { ...queue.diagnostics };
    result.programKeys = (renderer.info?.programs ?? []).filter(program => created.includes(program.program)).map(program => ({ name: program.name, cacheKey: program.cacheKey }));
    result.simulation = { beforeStatus: state.status, afterStatus: game.status, elapsedBefore: state.elapsed, elapsedAfter: game.elapsed, unchanged: game.elapsed === state.elapsed };
    result.glError = gl.getError(); result.contextLost = gl.isContextLost();
    result.wallMs = now() - started;
    return result;
  })();
}

/** Same queue code used by the browser harness, exposed for GPU-free lifecycle tests. */
export function createGpuMicroQueryQueue(gl, extension, options) {
  return runGpuMicro({ queueOnly: true, gl, extension, queueOptions: options });
}
