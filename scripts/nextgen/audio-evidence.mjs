import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createServer as createHttpServer } from 'node:http';
import { createServer } from 'vite';
import { chromium } from 'playwright';

// Run: node scripts/nextgen/audio-evidence.mjs. --reuse-recipes retains a prior measured recipe pass.
// No production entry/server changes. Reuse is explicit and recorded; use a full run after recipe edits.
const out = path.resolve('artifacts/nextgen/s2-audio');
await mkdir(out, { recursive: true });
const server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, logLevel: 'error' });
const httpServer = createHttpServer(server.middlewares);
let browser;
try {
  await new Promise((resolve, reject) => { httpServer.once('error', reject); httpServer.listen(0, '127.0.0.1', resolve); });
  const origin = `http://127.0.0.1:${httpServer.address().port}`;
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, args: ['--no-sandbox', '--disable-gpu', '--disable-webgl', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 1080 });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${origin}/scripts/nextgen/audio-audition.html`);
  await page.locator('#recipes button').last().waitFor();
  await page.screenshot({ path: path.join(out, 'audition.png') });
  await page.evaluate(async () => {
    const [{ AudioSystem, AUDIO_RECIPES }, { MixEngine, AUDIO_BUSES }, { synthesize, SYNTH_SAMPLE_RATE }, { ABILITY_CATALOG }] = await Promise.all([
      import('/src/game/audio/AudioSystem.ts'), import('/src/game/audio/MixEngine.ts'), import('/src/game/audio/synthesis.ts'), import('/src/game/abilities/catalog.ts'),
    ]);
    const rate = 24000;
    const stats = (channels, duration) => {
      let peak = 0, energy = 0, dc = 0, maxStep = 0, first = 0, last = 0, headEnergy = 0, tailEnergy = 0;
      for (const pcm of channels) {
        first = Math.max(first, Math.abs(pcm[0])); last = Math.max(last, Math.abs(pcm.at(-1)));
        for (let i = 0; i < pcm.length; i++) {
          peak = Math.max(peak, Math.abs(pcm[i])); energy += pcm[i] ** 2; dc += pcm[i];
          if (i < rate * .02) headEnergy += pcm[i] ** 2;
          if (i >= pcm.length - rate * .02) tailEnergy += pcm[i] ** 2;
          if (i) maxStep = Math.max(maxStep, Math.abs(pcm[i] - pcm[i - 1]));
        }
      }
      // Time-averaged FFT power centroid, skipping the padded silence.
      let weighted = 0, power = 0; const pcm = channels[0], n = 1024;
      for (let offset = 0; offset + n <= Math.min(pcm.length, duration * rate); offset += 512) {
        const bins = fft(pcm, offset, n);
        for (let k = 1; k < bins.length; k++) { weighted += bins[k] * k * rate / n; power += bins[k]; }
      }
      return { peak, rms: Math.sqrt(energy / (channels.length * pcm.length)), duration, renderedDuration: pcm.length / rate,
        centroid: weighted / Math.max(1e-20, power), dc: dc / (channels.length * pcm.length), first, last, maxStep,
        initial20msRms: Math.sqrt(headEnergy / (channels.length * Math.min(pcm.length, rate * .02))), final20msRms: Math.sqrt(tailEnergy / (channels.length * Math.min(pcm.length, rate * .02))) };
    };
    function fft(pcm, offset, n) {
      const re = new Float64Array(n), im = new Float64Array(n);
      for (let i = 0, j = 0; i < n; i++) {
        re[j] = (pcm[offset + i] || 0) * (.5 - .5 * Math.cos(2 * Math.PI * i / (n - 1)));
        let bit = n >> 1; while (j & bit) { j ^= bit; bit >>= 1; } j ^= bit;
      }
      for (let size = 2; size <= n; size *= 2) {
        const angle = -2 * Math.PI / size;
        for (let base = 0; base < n; base += size) for (let j = 0; j < size / 2; j++) {
          const c = Math.cos(angle * j), s = Math.sin(angle * j), a = base + j, b = a + size / 2;
          const tr = c * re[b] - s * im[b], ti = s * re[b] + c * im[b];
          re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        }
      }
      const power = new Float64Array(n / 2);
      for (let i = 0; i < power.length; i++) power[i] = re[i] ** 2 + im[i] ** 2;
      return power;
    }
    const base64 = bytes => { let result = ''; for (let i = 0; i < bytes.length; i += 0x8000) result += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(result); };
    const wav = channels => {
      const frames = channels[0].length, count = channels.length, bytes = new Uint8Array(44 + frames * count * 2), view = new DataView(bytes.buffer);
      const str = (offset, text) => { for (let i = 0; i < text.length; i++) bytes[offset + i] = text.charCodeAt(i); };
      str(0, 'RIFF'); view.setUint32(4, bytes.length - 8, true); str(8, 'WAVE'); str(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, count, true); view.setUint32(24, rate, true); view.setUint32(28, rate * count * 2, true); view.setUint16(32, count * 2, true); view.setUint16(34, 16, true); str(36, 'data'); view.setUint32(40, bytes.length - 44, true);
      let offset = 44;
      for (let i = 0; i < frames; i++) for (let channel = 0; channel < count; channel++) { const value = Math.max(-1, Math.min(1, channels[channel][i])); view.setInt16(offset, Math.round(value * (value < 0 ? 32768 : 32767)), true); offset += 2; }
      return base64(bytes);
    };
    const png = (id, channels, m, subtitle = 'Production mixer • master 1 / effects 1 / music 1 • .85 internal headroom') => {
      const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 650;
      const c = canvas.getContext('2d'), left = 82, width = 1088, waveTop = 112, waveHeight = 150, specTop = 322, specHeight = 240;
      c.fillStyle = '#101821'; c.fillRect(0, 0, canvas.width, canvas.height); c.font = 'bold 23px system-ui'; c.fillStyle = '#e5f3f7'; c.fillText(id, 30, 38);
      c.font = '13px system-ui'; c.fillStyle = '#acc6d3'; c.fillText(subtitle, 30, 65);
      c.fillText(`peak ${m.peak.toFixed(4)}   RMS ${m.rms.toFixed(4)}   duration ${m.duration.toFixed(3)}s   centroid ${m.centroid.toFixed(0)}Hz   DC ${m.dc.toExponential(2)}   max Δ ${m.maxStep.toFixed(4)}`, 30, 89);
      const pcm = channels[0];
      c.fillStyle = '#192a36'; c.fillRect(left, waveTop, width, waveHeight); c.strokeStyle = '#87d8ee'; c.beginPath();
      for (let x = 0; x < width; x++) {
        const begin = Math.floor(x / width * pcm.length), end = Math.max(begin + 1, Math.floor((x + 1) / width * pcm.length)); let lo = 1, hi = -1;
        for (let i = begin; i < end; i++) { lo = Math.min(lo, pcm[i]); hi = Math.max(hi, pcm[i]); }
        c.moveTo(left + x, waveTop + waveHeight / 2 - hi * waveHeight * .46); c.lineTo(left + x, waveTop + waveHeight / 2 - lo * waveHeight * .46);
      }
      c.stroke(); c.strokeStyle = '#536b7b'; c.beginPath(); c.moveTo(left, waveTop + waveHeight / 2); c.lineTo(left + width, waveTop + waveHeight / 2); c.stroke();
      c.fillStyle = '#afc7d4'; c.fillText('+1', 46, waveTop + 12); c.fillText('0', 54, waveTop + 79); c.fillText('−1', 46, waveTop + waveHeight); c.fillText('WAVEFORM / linear full scale', left, waveTop - 10);
      const spec = c.createImageData(width, specHeight), n = 1024;
      for (let x = 0; x < width; x++) {
        const bins = fft(pcm, Math.floor(x / width * Math.max(0, pcm.length - n)), n);
        for (let y = 0; y < specHeight; y++) {
          const frequency = 40 * Math.pow(12000 / 40, 1 - y / (specHeight - 1)), bin = Math.max(1, Math.min(bins.length - 1, Math.round(frequency / rate * n)));
          const db = 10 * Math.log10(bins[bin] / (n * n) + 1e-14), intensity = Math.max(0, Math.min(1, (db + 90) / 65));
          const index = (y * width + x) * 4;
          spec.data[index] = Math.round(12 + 240 * Math.pow(intensity, 1.8)); spec.data[index + 1] = Math.round(18 + 197 * Math.pow(intensity, .85)); spec.data[index + 2] = Math.round(30 + 120 * Math.sin(intensity * Math.PI)); spec.data[index + 3] = 255;
        }
      }
      c.putImageData(spec, left, specTop); c.fillStyle = '#afc7d4'; c.fillText('SPECTROGRAM / logarithmic frequency / −90…−25 dBFS bin power', left, specTop - 12);
      for (const frequency of [40, 100, 500, 2000, 8000, 12000]) { const y = specTop + specHeight * (1 - Math.log(frequency / 40) / Math.log(12000 / 40)); c.fillText(frequency >= 1000 ? `${frequency / 1000}k` : String(frequency), 32, y + 4); }
      for (let i = 0; i <= 4; i++) { const x = left + width * i / 4; c.fillText(`${(pcm.length / rate * i / 4).toFixed(2)}s`, Math.min(x - 12, 1130), specTop + specHeight + 23); }
      c.fillStyle = '#91acbc'; c.fillText(`First ${m.first.toExponential(1)} / last ${m.last.toExponential(1)}. Offline Chromium @ ${rate}Hz. No acoustic listening claim.`, 30, 625);
      return canvas.toDataURL('image/png').split(',')[1];
    };
    const result = (id, channels, duration, extra = {}, subtitle) => { const m = stats(channels, duration); return { id, ...m, ...extra, wav: wav(channels), png: png(id, channels, m, subtitle) }; };
    window.__evidence = {
      recipes: AUDIO_RECIPES.map(recipe => ({ id: recipe.id, family: recipe.family, bus: recipe.bus, duration: recipe.duration, loop: recipe.loop || false, layers: recipe.layers.length })),
      boundary(index) {
        const recipe = AUDIO_RECIPES[index], pcm = synthesize(recipe, SYNTH_SAMPLE_RATE), m = stats([pcm], recipe.duration);
        return { seamStep: Math.abs(pcm[0] - pcm.at(-1)), initial20msRms: m.initial20msRms, final20msRms: m.final20msRms, bodyRms: m.rms,
          seamWindowRms: Math.sqrt((m.initial20msRms ** 2 + m.final20msRms ** 2) / 2), note: 'Raw cached PCM boundary before voice ramp. Endpoint continuity is exact; the 20ms edge energy reports any periodic loop dip.' };
      },
      async recipe(index) {
        const recipe = AUDIO_RECIPES[index], context = new OfflineAudioContext(2, Math.ceil((recipe.duration + .13) * rate), rate), engine = new MixEngine(context, { master: 1, music: 1, effects: 1 });
        const begin = performance.now(), pcm = synthesize(recipe, SYNTH_SAMPLE_RATE), synthesisMs = performance.now() - begin;
        const raw = stats([pcm], recipe.duration), buffer = context.createBuffer(1, pcm.length, SYNTH_SAMPLE_RATE); buffer.getChannelData(0).set(pcm);
        engine.play(buffer, { bus: recipe.bus, priority: 90 });
        const rendered = await context.startRendering(), channels = [rendered.getChannelData(0), rendered.getChannelData(1)];
        const r = result(recipe.id, channels, recipe.duration, { family: recipe.family, bus: recipe.bus, loop: !!recipe.loop, raw, synthesisMs, loopBoundary: recipe.loop ? window.__evidence.boundary(index) : undefined, diagnostics: { admitted: engine.admitted, highWater: engine.highWater, rejected: engine.rejected } }); engine.destroy(); return r;
      },
      async layered(kind) {
        const duration = kind === 'large-explosion' ? 1.5 : kind === 'shotgun' ? 2.45 : kind === 'plasma' ? 1.85 : kind === 'rocket' ? 1.55 : .85;
        const context = new OfflineAudioContext(2, Math.ceil((duration + .16) * rate), rate), audio = new AudioSystem({ master: 1, effects: 1, music: 0 }, { context, loadSamples: true, prewarm: false });
        const start = performance.now(); await audio.unlock(); const decodeMs = performance.now() - start;
        if (kind === 'large-explosion') audio.handleEffect({ type: 'explosion', radius: 240, x: 0, y: 0 }, { x: 0, y: 0 });
        else audio.handleEffect({ type: 'shot', weapon: kind, x: 0, y: 0 }, { x: 0, y: 0 });
        const rendered = await context.startRendering(), r = result(`layered:${kind}`, [rendered.getChannelData(0), rendered.getChannelData(1)], duration, { decodeMs, diagnostics: audio.diagnostics }); audio.destroy(); return r;
      },
      async elemental(kind) {
        const duration = { freeze: .32, shatter: .24, reactor: .68 }[kind];
        const context = new OfflineAudioContext(2, Math.ceil((duration + .15) * rate), rate), audio = new AudioSystem({ master: 1, effects: 1, music: 0 }, { context, loadSamples: false, prewarm: false });
        await audio.unlock(); audio.playElemental(kind);
        const rendered = await context.startRendering(), r = result(`legacy:${kind}`, [rendered.getChannelData(0), rendered.getChannelData(1)], duration, { family: 'legacy-elemental', bus: 'impacts', diagnostics: audio.diagnostics }); audio.destroy(); return r;
      },
      async benchmark() {
        const liveStart = performance.now(), live = new AudioSystem({ master: 0, music: 0, effects: 0 }, { loadSamples: false, prewarm: false });
        const liveUnlocked = await live.unlock(), liveUnlockWithoutSamplesMs = performance.now() - liveStart; live.destroy();
        const contextStart = performance.now(), context = new OfflineAudioContext(2, rate, rate), offlineContextCreationMs = performance.now() - contextStart, start = performance.now();
        const audio = new AudioSystem({ master: 1, music: 0, effects: 1 }, { context, loadSamples: false, prewarm: true });
        const constructorMs = performance.now() - start, beforeUnlock = performance.now(); await audio.unlock(); const unlockWithoutSamplesMs = performance.now() - beforeUnlock;
        const tasks = [], copies = [], original = audio.buffer.bind(audio), originalPcm = audio.pcmBuffer.bind(audio);
        audio.buffer = (...args) => { const before = performance.now(), value = original(...args); tasks.push(performance.now() - before); return value; };
        audio.pcmBuffer = (...args) => { const before = performance.now(), value = originalPcm(...args); copies.push(performance.now() - before); return value; };
        let lastTimer = performance.now(), timerMaxDelayMs = 0;
        const timer = setInterval(() => { const now = performance.now(); timerMaxDelayMs = Math.max(timerMaxDelayMs, now - lastTimer - 16); lastTimer = now; }, 16);
        const warmStart = performance.now();
        while (audio.diagnostics.warmed < AUDIO_RECIPES.length && performance.now() - warmStart < 15000) await new Promise(resolve => setTimeout(resolve, 30));
        const warmMs = performance.now() - warmStart, diagnostics = audio.diagnostics; clearInterval(timer);
        const mainTasks = [...tasks, ...copies].sort((a, b) => a - b); audio.destroy();
        return { constructorMs, unlockWithoutSamplesMs, liveUnlocked, liveUnlockWithoutSamplesMs, offlineContextCreationMs, warmMs, warmTaskMaxMs: Math.max(0, ...mainTasks), warmTaskP95Ms: mainTasks[Math.floor(mainTasks.length * .95)] ?? 0,
          synchronousSynthesisCalls: tasks.length, workerPcmCopies: copies.length, workerPcmCopyMaxMs: Math.max(0, ...copies), timerMaxDelayMs, diagnostics,
          note: 'Main-thread wall time around synchronous buffer preparation and transferred-PCM copies, plus a 16ms responsiveness timer. Worker CPU time is excluded. Headless browser measurements are not a hardware frame-time certification.' };
      },
      async fight() {
        const seconds = 12, context = new OfflineAudioContext(16, seconds * rate, rate);
        context.destination.channelInterpretation = 'discrete';
        const audio = new AudioSystem({ master: .8, music: .65, effects: .8 }, { context, prewarm: false }); await audio.unlock();
        const merger = context.createChannelMerger(16), taps = [];
        merger.channelInterpretation = 'discrete'; merger.connect(context.destination);
        AUDIO_BUSES.forEach((bus, index) => {
          const splitter = context.createChannelSplitter(2); taps.push(splitter);
          if (bus === 'music') audio.mixer.duckMusic.connect(splitter);
          else {
            const category = context.createGain(); category.gain.value = .8; taps.push(category);
            (bus === 'ambience' ? audio.mixer.duckAmbience : audio.mixer.buses[bus]).connect(category).connect(splitter);
          }
          splitter.connect(merger, 0, index * 2 + 2); splitter.connect(merger, 1, index * 2 + 3);
        });
        let events = 0;
        const emit = effect => { audio.handleEffect(effect, { x: 0, y: 0 }); events++; };
        const ability = (id, phase, entityId, durationMs) => { const d = ABILITY_CATALOG[id]; emit({ type: 'ability', x: 80, y: -30, ability: { ability: id, phase, entityId, durationMs, slot: d.slot, rig: d.rig, element: d.element } }); };
        audio.setEnvironment('cargo'); audio.setCombatState({ intensity: .8, boss: false, danger: .2, overdrive: false, hostileTimeScale: 1, paused: false });
        const suspensions = []; for (let i = 1; i <= 64; i++) suspensions.push(context.suspend(i * .125));
        const rendering = context.startRendering();
        for (let i = 1; i <= 64; i++) {
          await suspensions[i - 1];
          if (i === 64) { audio.pauseAll(); await context.resume(); break; }
          const weapon = ['pistol', 'rifle', 'shotgun', 'plasma', 'rocket'][i % 5];
          emit({ type: 'shot', weapon, x: -70 + i % 3 * 70, y: 20 });
          emit({ type: 'hit', contact: i % 7 === 0 ? 'armor' : 'damage', lethal: i % 5 === 0, x: 140, y: 60 });
          if (i % 2 === 0) emit({ type: 'enemy-attack', family: ['crawler', 'brute', 'spitter', 'stalker', 'carrier'][i % 5], x: i % 4 * 80 - 120, y: 50, elite: i % 14 === 0 });
          if (i % 4 === 0) { audio.playUi(['confirm', 'purchase', 'checkpoint', 'ability-ready'][i / 4 % 4]); events++; }
          if (i % 7 === 0) emit({ type: 'explosion', radius: i % 14 === 0 ? 240 : 120, x: -110, y: 50 });
          if (i % 9 === 0) emit({ type: 'wall-slam', x: 200, y: -60 });
          if (i === 4) ability('bulwark', 'tick', 11, 6000);
          if (i === 8) ability('whiteout', 'tick', 12, 5000);
          if (i === 12) ability('napalm-charge', 'tick', 13, 6000);
          if (i === 16) ability('tesla-pylon', 'tick', 14, 5000);
          if (i % 6 === 0) ability(['seismic-slam', 'cryo-nova', 'flashfire', 'overload'][i / 6 % 4], 'impact', undefined, 0);
          if (i % 4 === 0 && i > 16) ability('tesla-pylon', 'link', 14, 0);
          if (i === 32) { audio.setEnvironment('reactor'); audio.setCombatState({ intensity: 1, boss: true, danger: .8, overdrive: true, hostileTimeScale: .3, paused: false }); ability('overclock', 'impact', undefined, 3000); }
          if (i === 56) { ability('overclock', 'end'); audio.setCombatState({ intensity: .9, boss: true, danger: .4, overdrive: false, hostileTimeScale: 1, paused: false }); }
          await context.resume();
        }
        const rendered = await rendering, diagnostics = audio.diagnostics, outputs = [];
        outputs.push(result('fight:master', [rendered.getChannelData(0), rendered.getChannelData(1)], 8, { events, diagnostics }, '8s deterministic director fight + 4s tail • master .8 / effects .8 / music .65 • limited master'));
        AUDIO_BUSES.forEach((bus, index) => outputs.push(result(`fight:bus:${bus}`, [rendered.getChannelData(index * 2 + 2), rendered.getChannelData(index * 2 + 3)], 8, { bus, events, diagnostics }, 'Post bus + category gain and actual music/ambience duck • before shared reverb and master • 8s fight + 4s tail')));
        for (const tap of taps) tap.disconnect(); merger.disconnect(); audio.destroy(); return outputs;
      },
    };
  });
  const recipes = await page.evaluate(() => window.__evidence.recipes), inventory = [], failures = [];
  const save = async result => {
    const { wav, png, ...metadata } = result, stem = result.id.replace(/[^a-zA-Z0-9_-]/g, '-');
    await Promise.all([writeFile(path.join(out, `${stem}.wav`), Buffer.from(wav, 'base64')), writeFile(path.join(out, `${stem}.png`), Buffer.from(png, 'base64'))]);
    inventory.push({ ...metadata, wav: `${stem}.wav`, png: `${stem}.png` });
    if (!result.id.startsWith('fight:bus:') && result.peak >= .98) failures.push(`${result.id}: clipped peak ${result.peak}`);
    if (Math.abs(result.dc) > .006) failures.push(`${result.id}: excessive DC ${result.dc}`);
    if (result.first > 1e-6 || result.last > 1e-6) failures.push(`${result.id}: non-silent edge ${result.first}/${result.last}`);
    if (!(result.rms > .000001)) failures.push(`${result.id}: silent render`);
    if (!(result.duration > 0 && result.duration <= 12)) failures.push(`${result.id}: excessive duration`);
  };
  const reuseRecipes = process.argv.includes('--reuse-recipes');
  if (reuseRecipes) {
    const previous = JSON.parse(await readFile(path.join(out, 'inventory.json'), 'utf8'));
    for (let index = 0; index < recipes.length; index++) {
      const recipe = recipes[index];
      const row = previous.inventory.find(row => row.id === recipe.id);
      if (!row) throw new Error(`Cannot reuse absent recipe ${recipe.id}; run without --reuse-recipes.`);
      if (recipe.loop) row.loopBoundary = await page.evaluate(index => window.__evidence.boundary(index), index);
      inventory.push(row);
    }
    console.log(`Retaining ${recipes.length} explicitly reused recipe measurements; rendering director samples/fight afresh.`);
  } else {
    console.log(`Rendering ${recipes.length} authored recipes through OfflineAudioContext and production MixEngine…`);
    for (let i = 0; i < recipes.length; i++) {
      await save(await page.evaluate(index => window.__evidence.recipe(index), i));
      if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${recipes.length} recipes`);
    }
  }
  for (const kind of ['pistol', 'rifle', 'shotgun', 'plasma', 'rocket', 'large-explosion']) await save(await page.evaluate(kind => window.__evidence.layered(kind), kind));
  for (const kind of ['freeze', 'shatter', 'reactor']) await save(await page.evaluate(kind => window.__evidence.elemental(kind), kind));
  const benchmark = await page.evaluate(() => window.__evidence.benchmark());
  try { for (const result of await page.evaluate(() => window.__evidence.fight())) await save(result); }
  catch (error) { failures.push(`Dense fight render: ${error.message}`); }
  if (errors.length) failures.push(...errors.map(error => `Browser error: ${error}`));
  const data = { generatedAt: new Date().toISOString(), reuseRecipes, sampleRate: 24000, measurement: 'Raw recipe metrics and actual rendered stereo output are both included. Output master=1 includes .85 headroom, compressor and waveshaper. Fight bus taps include bus/category gains and actual music/ambience ducking, before shared reverb/master; final master is the actual limited destination.', benchmark, errors, failures, inventory };
  const columns = ['id', 'family', 'bus', 'duration', 'renderedDuration', 'peak', 'rms', 'centroid', 'dc', 'first', 'last', 'maxStep', 'synthesisMs', 'wav', 'png'];
  await writeFile(path.join(out, 'inventory.json'), JSON.stringify(data, null, 2));
  await writeFile(path.join(out, 'inventory.csv'), `${columns.join(',')}\n${inventory.map(row => columns.map(column => JSON.stringify(row[column] ?? '')).join(',')).join('\n')}\n`);
  const fmt = n => typeof n === 'number' ? n.toFixed(4) : '';
  await writeFile(path.join(out, 'inventory.md'), `# S2 audio measurements\n\n${data.measurement}\n\nNo acoustic listening claim. WAVs are 24 kHz, signed 16-bit PCM; metrics use the unquantized OfflineAudioContext output. Centroid uses a Hann-windowed 1024-point FFT, 512-sample hop, averaged power. Spectrograms use logarithmic frequency 40–12000 Hz and −90…−25 dBFS bin-power mapping.\n\n## Initialization\n\n\`\`\`json\n${JSON.stringify(benchmark, null, 2)}\n\`\`\`\n\n## Cue inventory\n\n| Cue | Duration s | Peak | RMS | Centroid Hz | DC |\n|---|---:|---:|---:|---:|---:|\n${inventory.map(row => `| [${row.id}](${row.png}) | ${fmt(row.duration)} | ${fmt(row.peak)} | ${fmt(row.rms)} | ${row.centroid.toFixed(0)} | ${row.dc.toExponential(2)} |`).join('\n')}\n\n## Assertions\n\n${failures.length ? failures.map(f => `- ${f}`).join('\n') : 'All renders finite, non-silent, duration-bounded, endpoint-silent and below master clipping threshold; DC within 0.006.'}\n`);
  await writeFile(path.join(out, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><title>S2 audio evidence</title><style>body{font:15px system-ui;background:#101821;color:#dcebf2;max-width:1200px;margin:28px auto}a{color:#9bd9ed}article{margin:30px 0}img{width:100%;height:auto}audio{width:100%}summary{cursor:pointer;padding:12px;border:1px solid #425e71}</style><h1>S2 audio evidence</h1><p><a href="inventory.md">Inventory with peak/RMS/duration per cue</a> · <a href="inventory.json">Full numerical evidence</a></p><p>Original synthesis through production Web Audio graph. Bus stems include category gains and actual music/ambience ducking; shared reverb and limiting are represented in final master. Listening review remains a human acceptance step.</p>${inventory.map(row => `<details${['fight:master', 'layered:shotgun', 'ability:railbreaker:impact', 'ability:whiteout:loop', 'ambience:infested', 'ui:victory'].includes(row.id) ? ' open' : ''}><summary>${row.id} · peak ${fmt(row.peak)} / RMS ${fmt(row.rms)}</summary><article><img src="${row.png}" alt="Waveform and spectrogram of ${row.id}"><audio controls preload="none" src="${row.wav}"></audio></article></details>`).join('')}</html>`);
  console.log(`Audio evidence: ${inventory.length} WAV/PNG pairs; ${failures.length} assertion failures; ${errors.length} browser errors.`);
  console.log(`Initialization: constructor ${benchmark.constructorMs.toFixed(2)}ms; unlock without samples ${benchmark.unlockWithoutSamplesMs.toFixed(2)}ms; prewarm max ${benchmark.warmTaskMaxMs.toFixed(2)}ms / p95 ${benchmark.warmTaskP95Ms.toFixed(2)}ms.`);
  console.log(`Inventory: ${path.join(out, 'inventory.json')}`);
  for (const row of inventory.filter(row => row.id.startsWith('fight:'))) console.log(`${row.id}: peak ${row.peak.toFixed(4)}, RMS ${row.rms.toFixed(4)}, voices ${row.diagnostics.highWater}, rejected ${row.diagnostics.rejected}`);
  if (failures.length) { for (const failure of failures) console.error(failure); process.exitCode = 1; }
} finally { await browser?.close(); await new Promise(resolve => httpServer.close(resolve)); await server.close(); }
