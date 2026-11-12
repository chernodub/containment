#!/usr/bin/env node
/** Equal-simulation draw diagnostic. Never substitutes for native timing gates. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';
import { stageV2 } from './v2-scenarios.mjs';

const root = resolve('artifacts/nextgen/v4');
const out = resolve('artifacts/nextgen/v4-draw-inventory');
const builds = ['before-dist', 'final-perf-dist'];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const errors = [], records = [];
let activeDist, browser;
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = resolve(activeDist, path.replace(/^\/containment\//, '') || 'index.html');
  if (!file.startsWith(activeDist + '/')) return res.writeHead(404).end();
  try { res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream'); res.end(await readFile(file)); }
  catch { res.writeHead(404).end(); }
});

function inventory() {
  const d = window.__containmentDebug, g = d.game, r = d.renderer;
  const gl = r.renderer.getContext(), create = gl.createProgram, raw = r.renderer, render = raw.render, reset = raw.info.reset, direct = raw.renderBufferDirect;
  const samples = [], states = [], uses = [];
  let programs = 0, abilityCalls = 0;
  const state = () => ({ elapsed: g.elapsed, status: g.status, player: { x: g.player.x, y: g.player.y, angle: g.player.angle }, enemies: g.enemies.snapshot, bullets: g.bullets, abilities: g.abilities.snapshot, combat: g.combat.snapshot });
  const snapshot = () => states.push(JSON.parse(JSON.stringify(state())));
  gl.createProgram = function () { programs++; return create.call(this); };
  r.renderer.renderBufferDirect = function (...args) {
    let node = args[4];
    while (node) { if (node === r.interimAbilities.root) { abilityCalls++; break; } node = node.parent; }
    return direct.apply(this, args);
  };
  // Debug stepping retains a bound DepthRenderer.render; instrument its real
  // frame reset and final HUD pass instead of replacing the public method.
  raw.info.reset = function (...args) { abilityCalls = 0; return reset.apply(this, args); };
  raw.render = function (...args) {
    const result = render.apply(this, args);
    if (args[0] === r.hudScene) samples.push({ simulationMs: g.elapsed * 1000, draws: raw.info.render.calls, abilityDraws: abilityCalls });
    return result;
  };
  try {
    d.realtime(false); g.switchWeapon('rifle'); d.setInput({ x: 0, y: 0, fire: false, autoAim: true, angle: null });
    // Page focus changes can reset native point targeting between setup and
    // this evaluation. Set the same explicit public intent before comparing it.
    g.setAimPoint({ x: g.player.x + Math.cos(g.player.angle) * 150, y: g.player.y + Math.sin(g.player.angle) * 150 });
    snapshot();
    for (const slot of ['power', 'dash', 'tactical', 'overdrive']) {
      if (slot === 'overdrive') d.fillOverdrive();
      let accepted = false;
      if (slot === 'power') {
        for (const radius of [80, 120, 220, 300]) for (let i = 0; i < 16 && !accepted; i++) {
          const angle = g.player.angle + i * Math.PI / 8;
          const x = g.player.x + Math.cos(angle) * radius, y = g.player.y + Math.sin(angle) * radius;
          if (!d.canStand(x, y, 28) || !d.clearShot(x, y)) continue;
          g.setAimPoint({ x, y }); accepted = g.useAbility(slot);
        }
      } else accepted = g.useAbility(slot);
      if (!accepted) throw Error('Inventory ability denied ' + slot);
      uses.push(slot); d.step(Math.max(150, g.abilities.snapshot.slots[slot].castRemainingMs + 30)); snapshot();
    }
    d.setInput({ fire: true, autoAim: true, angle: null });
    d.step(6000); snapshot();
    return { samples, states, uses, programs, glError: gl.getError(), contextLost: gl.isContextLost() };
  } finally { gl.createProgram = create; raw.render = render; raw.info.reset = reset; raw.renderBufferDirect = direct; }
}

try {
  await mkdir(out, { recursive: true });
  await new Promise((ok, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', ok); });
  browser = await chromium.launch({ channel: 'chromium', headless: true, args: ['--no-sandbox', `--use-angle=${process.platform === 'darwin' ? 'metal' : 'gl'}`, '--enable-gpu', '--ignore-gpu-blocklist'] });
  for (const room of ['relay-racks', 'diagnostic-gallery']) for (const rig of ['breacher', 'cryo', 'pyro', 'arc']) for (const tier of ['high', 'low']) {
    const pair = [];
    for (const build of builds) {
      activeDist = resolve(root, build);
      const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
      const page = await context.newPage(); page.setDefaultTimeout(180000);
      page.on('pageerror', error => errors.push(String(error)));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      try {
        await page.goto(`http://127.0.0.1:${server.address().port}/containment/?debug=1&seed=1729`);
        await page.waitForFunction(() => !!window.__containmentDebug);
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(stageV2, { rig, room, tier, heavy: true, setupOnly: true });
        const data = await page.evaluate(inventory);
        assert.equal(data.states.length, 6);
        assert(data.samples.length >= 360, 'Missing fixed-step draw samples');
        assert(data.samples.every(sample => Number.isFinite(sample.draws) && sample.draws > 0));
        assert(data.samples.some(sample => sample.abilityDraws > 0), 'Missing actual ability draws');
        assert.equal(data.programs, 0); assert.equal(data.glError, 0); assert.equal(data.contextLost, false);
        assert.equal(data.states[0].enemies.enemies.filter(enemy => enemy.health > 0).length, 25);
        pair.push({ build, sourceSHA: (await readFile(resolve(activeDist, 'SOURCE_SHA'), 'utf8')).trim(), ...data });
      } finally { await context.close(); }
    }
    assert.deepEqual(pair[0].states, pair[1].states, `${room}/${rig}/${tier}: simulation diverged`);
    assert.deepEqual(pair[0].samples.map(s => s.simulationMs), pair[1].samples.map(s => s.simulationMs));
    const peak = (side, field) => Math.max(...pair[side].samples.map(s => s[field]));
    const record = { room, rig, tier, identicalSimulation: true, beforeDraws: peak(0, 'draws'), afterDraws: peak(1, 'draws'), beforeAbilityDraws: peak(0, 'abilityDraws'), afterAbilityDraws: peak(1, 'abilityDraws'), pair };
    records.push(record);
    console.log(`${room}/${rig}/${tier}: identical simulation, total ${record.beforeDraws}→${record.afterDraws}, ability ${record.beforeAbilityDraws}→${record.afterAbilityDraws}`);
    await writeFile(resolve(out, 'inventory.json'), JSON.stringify({ scope: 'Diagnostic fixed-step draw inventory; identical six milestone snapshots and every frame sample time; no native CPU/GPU timing claim and no replacement of native benchmark acceptance.', errors, records }, null, 2));
  }
  assert.deepEqual(errors, []);
  const misses = records.filter(r => r.afterDraws > r.beforeDraws || r.afterAbilityDraws > r.beforeAbilityDraws);
  console.log(`Equal-state draw inventory: ${records.length} matched groups, ${misses.length} peak increases, zero combat compiles, errors[].`);
  if (misses.length) process.exitCode = 1;
} finally { await browser?.close(); await new Promise(ok => server.close(ok)); }
