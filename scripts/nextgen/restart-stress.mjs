#!/usr/bin/env node
/** Native desktop restart/Continue stress with retained blob/decode diagnostics. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';

const args = process.argv.slice(2);
const option = (name, fallback) => args.find(value => value.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const cycles = Number(option('cycles', '20'));
const cpuRate = Number(option('cpu-rate', '2'));
const latency = Number(option('latency', '100'));
const throughput = Number(option('throughput', String(8 * 1024 * 1024)));
assert(Number.isInteger(cycles) && cycles > 0 && cycles <= 100, 'cycles must be 1..100');
assert(cpuRate >= 1 && latency >= 0 && throughput > 0, 'invalid throttle');
const dist = resolve(option('dist', 'dist'));
const out = resolve('artifacts/nextgen', option('label', 'restart-stress'));
const prefix = '/containment/';
await mkdir(out, {recursive:true});
const report = {sha:execFileSync('git', ['rev-parse', 'HEAD'], {encoding:'utf8'}).trim(), startedAt:new Date().toISOString(), cycles, throttle:{cpuRate, latency, throughput}, runs:[], errors:[], requests:[]};
const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = resolve(dist, pathname.slice(prefix.length) || 'index.html');
  if (!pathname.startsWith(prefix) || !file.startsWith(dist + '/')) return response.writeHead(404).end();
  try {
    response.setHeader('Content-Type', ({'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.glb':'model/gltf-binary', '.png':'image/png', '.jpg':'image/jpeg', '.woff2':'font/woff2'})[extname(file)] ?? 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.writeHead(404).end(); }
});
let browser, page;
try {
  await new Promise((accept, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', accept); });
  browser = await chromium.launch({channel:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? undefined : 'chromium', executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, headless:!args.includes('--headed'), args:['--no-sandbox', `--use-angle=${process.platform === 'darwin' ? 'metal' : 'gl'}`, '--enable-gpu', '--ignore-gpu-blocklist']});
  const context = await browser.newContext({viewport:{width:1920, height:1080}, deviceScaleFactor:1});
  // Observe the unmodified loader, including blob ownership and actual decode errors.
  await context.addInitScript(() => {
    const state = {urls:[], decodes:[], failures:[]};
    Object.defineProperty(window, '__textureLifecycle', {value:state});
    const urls = new Map(), bitmaps = new WeakMap(), create = URL.createObjectURL, revoke = URL.revokeObjectURL;
    if (typeof ImageBitmap !== 'undefined') {
      const close = ImageBitmap.prototype.close;
      ImageBitmap.prototype.close = function() {
        const entry = bitmaps.get(this); if (entry) entry.closes.push(performance.now());
        return close.call(this);
      };
    }
    URL.createObjectURL = function(blob) {
      const url = create.call(this, blob), entry = {url, size:blob.size, type:blob.type, created:performance.now(), revoked:null};
      state.urls.push(entry); urls.set(url, entry); return url;
    };
    URL.revokeObjectURL = function(url) {
      const entry = urls.get(url); if (entry) entry.revoked = performance.now();
      return revoke.call(this, url);
    };
    const fetchOriginal = window.fetch;
    window.fetch = async function(input, init) {
      try { return await fetchOriginal.call(this, input, init); }
      catch (error) {
        const url = String(input instanceof Request ? input.url : input);
        state.failures.push({stage:'fetch', url, owner:urls.get(url), error:String(error), at:performance.now()});
        throw error;
      }
    };
    const bitmap = window.createImageBitmap;
    if (bitmap) window.createImageBitmap = async function(...parameters) {
      const input = parameters[0], entry = {size:input instanceof Blob ? input.size : null, type:input instanceof Blob ? input.type : null, started:performance.now(), ended:null, error:null, width:null, height:null, closes:[]};
      state.decodes.push(entry);
      try {
        const image = await bitmap.apply(this, parameters);
        entry.width = image.width; entry.height = image.height; bitmaps.set(image, entry); return image;
      }
      catch (error) { entry.error = String(error); state.failures.push({stage:'bitmap', ...entry}); throw error; }
      finally { entry.ended = performance.now(); }
    };
  });
  page = await context.newPage(); page.setDefaultTimeout(180000);
  let cycle = -1;
  page.on('pageerror', error => report.errors.push({cycle, type:'page', message:error.message}));
  page.on('console', message => { if (message.type() === 'error') report.errors.push({cycle, type:'console', message:message.text()}); });
  page.on('requestfailed', request => report.requests.push({cycle, url:request.url(), failure:request.failure()}));
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', {cacheDisabled:true});
  await cdp.send('Network.emulateNetworkConditions', {offline:false, latency, downloadThroughput:throughput, uploadThroughput:throughput});
  await cdp.send('Emulation.setCPUThrottlingRate', {rate:cpuRate});
  await page.goto(`http://127.0.0.1:${server.address().port}${prefix}?debug=1&seed=1729`);
  await page.waitForFunction(() => !!window.__containmentDebug && document.body.dataset.state === 'menu');
  report.gpu = await page.evaluate(() => {
    const gl = window.__containmentDebug.renderer.renderer.getContext(), extension = gl.getExtension('WEBGL_debug_renderer_info');
    return extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  });
  assert(!/swiftshader|software|llvmpipe/i.test(report.gpu), 'Hardware renderer required');
  const settled = () => page.waitForFunction(() => document.querySelector('#world')?.getAttribute('aria-busy') === 'false' && document.querySelector('#room-loading')?.hidden && !window.__containmentDebug.renderer.roomLoading);
  const selectBoon = async () => {
    await page.waitForFunction(() => document.body.dataset.state === 'reward');
    await page.locator('[data-mutation]').first().click();
    await page.waitForFunction(() => document.body.dataset.state === 'playing');
  };
  const title = async () => {
    await page.locator('#pause').click();
    await page.waitForFunction(() => document.body.dataset.state === 'paused');
    await page.locator('#menu').click();
    await page.waitForFunction(() => document.body.dataset.state === 'menu');
  };
  for (cycle = 0; cycle < cycles; cycle++) {
    const started = Date.now();
    await page.locator('#start').click();
    await page.waitForFunction(() => document.body.dataset.state === 'rig-select');
    await page.locator('#equip-rig').click();
    await selectBoon();
    // Alternate immediate retirement and fully settled retirement of the same room.
    // Continue then creates a fresh owner from the native saved starting draft.
    if (cycle % 2) await settled();
    await title();
    await page.locator('#continue').click();
    await selectBoon();
    await settled();
    const evidence = await page.evaluate(() => {
      const d = window.__containmentDebug, r = d.renderer, gl = r.renderer.getContext();
      const owners = {}, closedMaps = [];
      for (const scene of [r.scene, r.hudScene]) scene.traverse(object => {
        const materials = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
        for (const material of materials) for (const [slot, texture] of Object.entries(material)) {
          if (texture?.isTexture && typeof ImageBitmap !== 'undefined' && texture.image instanceof ImageBitmap && (!texture.image.width || !texture.image.height)) closedMaps.push({object:object.name, material:material.name, slot});
        }
      });
      for (const name of ['sealedBank', 'releasedBerth', 'recoveryKit']) {
        const owner = r[name]; owners[name] = {state:owner?.state, error:owner?.error ? String(owner.error) : null};
      }
      return {closedMaps, state:document.body.dataset.state, room:d.game.node.templateId, owners, memory:{...r.renderer.info.memory}, programs:r.renderer.info.programs.length, glError:gl.getError(), contextLost:gl.isContextLost(), blobUrls:window.__textureLifecycle.urls.length, bitmapDecodes:window.__textureLifecycle.decodes.length};
    });
    report.runs.push({cycle, durationMs:Date.now() - started, ...evidence});
    assert.equal(evidence.room, 'awakening-bay');
    assert.equal(evidence.state, 'playing');
    assert.deepEqual(evidence.closedMaps, [], 'A live scene retained a closed ImageBitmap');
    assert(!evidence.contextLost && evidence.glError === 0, 'Graphics failure');
    for (const [name, owner] of Object.entries(evidence.owners)) assert.equal(owner.state, 'ready', `${name} fell back`);
    assert.equal(report.errors.length, 0, JSON.stringify(report.errors));
    await title();
    await writeFile(resolve(out, 'restart-stress.json'), JSON.stringify(report, null, 2));
    console.log(`Restart/Continue ${cycle + 1}/${cycles}: ${Date.now() - started}ms; textures ${evidence.memory.textures}, programs ${evidence.programs}`);
  }
  await settled();
  report.lifecycle = await page.evaluate(() => window.__textureLifecycle);
  assert.equal(report.lifecycle.failures.length, 0, 'Texture fetch/decode failures');
  assert.equal(report.lifecycle.decodes.filter(entry => entry.closes.length > 1).length, 0, 'ImageBitmap closed by multiple owners');
  assert.equal(report.lifecycle.urls.filter(entry => entry.revoked === null).length, 0, 'Unreleased GLTF blob URLs');
  // Expected aborts may cancel an obsolete room HTTP transfer, never an embedded texture.
  assert.equal(report.requests.filter(request => request.url.startsWith('blob:')).length, 0, 'Embedded texture request failed');
  console.log(`Restart stress passed: ${cycles} native Start/title/Continue cycles, CPU ${cpuRate}x, network ${latency}ms / ${throughput}Bps, no texture errors or leaked blob URLs.`);
} catch (error) {
  report.errors.push({type:'runner', message:String(error)});
  if (page) {
    report.lifecycle = await page.evaluate(() => window.__textureLifecycle).catch(() => null);
    await page.screenshot({path:resolve(out, 'failure.png')}).catch(() => {});
  }
  throw error;
} finally {
  report.finishedAt = new Date().toISOString();
  await writeFile(resolve(out, 'restart-stress.json'), JSON.stringify(report, null, 2));
  await browser?.close();
  await new Promise(accept => server.close(accept));
}
