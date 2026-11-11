import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

// Test-only instrumentation observes real Web Audio nodes, not production diagnostics.
export async function observeAudio(page) {
  await page.addInitScript(() => {
    const Audio = window.AudioContext;
    window.__soundQA = {contexts: [], sources: 0, starts: []};
    window.AudioContext = class extends Audio {
      constructor(...args) {
        super(...args);
        const entry = {context: this, gains: [], edges: new Map(), nodes: [], createdSources: 0};
        window.__soundQA.contexts.push(entry);
        const buses = ['music','ambience','weapons','abilities','enemies','impacts','ui'];
        const track = node => {
          entry.nodes.push(node);
          const connect = node.connect.bind(node), disconnect = node.disconnect.bind(node);
          node.connect = (...args) => {
            const result = connect(...args);
            let edges = entry.edges.get(node);
            if (!edges) entry.edges.set(node, edges = new Set());
            edges.add(args[0]); return result;
          };
          node.disconnect = (...args) => {
            const result = disconnect(...args);
            if (!args.length) entry.edges.delete(node);
            else entry.edges.get(node)?.delete(args[0]);
            return result;
          };
          return node;
        };
        // MixEngine creates master/effects/music, duck/focus, reverb input and
        // two reverb-return gains, then its seven named buses in AUDIO_BUSES order.
        // Starts retain the actual graph path, rather than inferring a bus from a sound count.
        for (const method of ['createGain','createStereoPanner','createBiquadFilter','createDynamicsCompressor','createWaveShaper','createConvolver','createBufferSource']) {
          const create = this[method].bind(this);
          this[method] = (...args) => {
            const node = track(create(...args));
            if (method === 'createGain') entry.gains.push(node);
            if (method !== 'createBufferSource') return node;
            entry.createdSources++;
            const start = node.start.bind(node), stop = node.stop.bind(node);
            let record;
            node.start = (...args) => {
              const queue = [[node]], seen = new Set(); let path;
              while (queue.length) {
                const candidate = queue.shift(), tail = candidate.at(-1);
                if (seen.has(tail)) continue;
                seen.add(tail);
                if (tail === this.destination) {path = candidate; break;}
                for (const next of entry.edges.get(tail) ?? []) queue.push([...candidate,next]);
              }
              const busIndex = path?.findIndex(value => entry.gains.indexOf(value) >= 9 && entry.gains.indexOf(value) < 16);
              const busNode = busIndex >= 0 ? path[busIndex] : null;
              record = {bus: busNode ? buses[entry.gains.indexOf(busNode)-9] : null,
                path: path?.map(value => entry.nodes.indexOf(value)) ?? [],
                busGain: busNode?.gain.value, master: entry.gains[0]?.gain.value,
                effects: entry.gains[1]?.gain.value, loop: node.loop,
                at: this.currentTime, scheduledAt: args[0] ?? this.currentTime,
                duration: args[2] ?? node.buffer?.duration, stops: []};
              const result = start(...args);
              entry.firstSourceGain ??= entry.gains[0]?.gain.value;
              window.__soundQA.sources++; window.__soundQA.starts.push(record);
              return result;
            };
            node.stop = (...args) => {record?.stops.push(args[0] ?? this.currentTime); return stop(...args);};
            return node;
          };
        }
      }
    };
  });
}
// Keep real rendering enabled, but avoid software-shadow cost during repeated
// settings interactions. Restore High before the existing gameplay smoke.
async function openSettings(page) {
  await page.locator('#settings').click();
  await page.locator('#quality').selectOption('low');
}
const slider = page => page.getByRole('slider', {name:'Master volume'});
const mute = page => page.getByRole('button', {name:'Mute sound', exact:true});
async function gainIs(page, volume) {
  await page.waitForFunction(expected => {
    const entry = window.__soundQA.contexts.at(-1);
    return entry?.context.state === 'running' && Math.abs(entry.gains[0].gain.value - expected * .85) < .0001;
  }, volume);
}
async function savedIs(page, master, muted) {
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('containment.audio.v1'))), {master, muted});
}
async function capture(page, name) {
  if(process.env.SOUND_SCREENSHOTS !== '1') return;
  await mkdir('docs/pr-screenshots/sound-controls', {recursive:true});
  await page.screenshot({path:`docs/pr-screenshots/sound-controls/${name}.png`});
}
export async function checkMenuSound(page) {
  const viewport = 'desktop';
  await openSettings(page);
  assert.equal(await slider(page).inputValue(), '30');
  assert.equal(await mute(page).getAttribute('aria-pressed'), 'false');
  await slider(page).scrollIntoViewIfNeeded();
  await capture(page, `${viewport}-menu`);
  for (const control of [slider(page), mute(page)]) {
    const box = await control.boundingBox();
    assert.ok(box.height >= 44 && box.width >= 44);
  }
  // Keyboard changes keep focus on the same native slider.
  await slider(page).focus(); await page.keyboard.press('ArrowRight');
  assert.equal(await slider(page).inputValue(), '31');
  assert.equal(await page.locator('#volume-value').textContent(), '31%');
  assert.equal(await slider(page).evaluate(node => node === document.activeElement), true);
  await savedIs(page, .31, false);
  await mute(page).focus();await page.keyboard.press('Space');
  await savedIs(page, .31, true);
  assert.equal(await mute(page).textContent(), 'Unmute');
  await page.reload(); await page.waitForFunction(() => document.body.dataset.state === 'menu');
  await openSettings(page);
  assert.equal(await slider(page).inputValue(), '31');
  assert.equal(await mute(page).getAttribute('aria-pressed'), 'true');
  // Starting a run while muted must initialize the real gain at silence.
  await page.locator('#start').click();
  await page.waitForFunction(() => document.body.dataset.state === 'rig-select');
  await gainIs(page, 0);
  await page.reload(); await page.waitForFunction(() => document.body.dataset.state === 'menu');
  await openSettings(page);
  await mute(page).click(); await gainIs(page, .31);
  await page.waitForFunction(() => window.__soundQA.sources > 0);
  await slider(page).focus(); await page.keyboard.press('Home');
  await gainIs(page, 0); await savedIs(page, 0, false);
  await page.reload(); await page.waitForFunction(() => document.body.dataset.state === 'menu');
  await openSettings(page);
  assert.equal(await slider(page).inputValue(), '0');
  assert.equal(await mute(page).getAttribute('aria-pressed'), 'false');
  await mute(page).click(); await mute(page).click(); await gainIs(page, 0);
  await slider(page).focus(); await page.keyboard.press('End');
  await gainIs(page, 1);
  // A mouse interaction exercises the native range as well.
  const box = await slider(page).boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const selected = Number(await slider(page).inputValue()) / 100;
  assert.ok(selected > .4 && selected < .6);
  await gainIs(page, selected); await savedIs(page, selected, false);
  await page.locator('#settings').click(); await openSettings(page);
  assert.equal(Number(await slider(page).inputValue()) / 100, selected);
  console.log(`Sound menu passed: ${viewport}, default 30%, native keyboard/mouse, real gain, muted reload, zero reload, channel playback.`);
  await page.locator('#quality').selectOption('high');
  return selected;
}
export async function checkPausedSound(page, selected) {
  const quality = await page.locator('#quality').inputValue();
  await page.locator('#quality').selectOption('low');
  const before = await page.evaluate(() => window.__soundQA.sources);
  assert.equal(Number(await slider(page).inputValue()) / 100, selected);
  await mute(page).click(); await gainIs(page, 0);
  await slider(page).focus(); await page.keyboard.press('End');
  await gainIs(page, 0); await savedIs(page, 1, true);
  await capture(page, `desktop-paused-muted`);
  await page.setViewportSize({width:960,height:540});
  await slider(page).scrollIntoViewIfNeeded();
  const resizedBox = await slider(page).boundingBox();
  assert.ok(resizedBox.x >= 0 && resizedBox.x + resizedBox.width <= 960 && resizedBox.y >= 0 && resizedBox.y + resizedBox.height <= 540);
  await page.setViewportSize({width:1280,height:720});

  await mute(page).click(); await gainIs(page, 1);
  await slider(page).focus(); await page.keyboard.press('Home');
  await gainIs(page, 0);
  assert.equal(await page.evaluate(() => document.body.dataset.state), 'paused');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.body.dataset.state === 'playing');
  await page.locator('#pause').click();
  await page.locator('[data-pause-tab=settings]').click();
  assert.equal(await slider(page).inputValue(), '0');
  await page.locator('#quality').selectOption(quality);
  assert.equal(await page.evaluate(() => window.__soundQA.sources), before, 'Paused controls and resuming/pausing at zero master schedule no voices');
  console.log(`Sound pause passed: desktop, retains choice, muted adjustment stays silent, unmute restores choice, live zero gain.`);
}
