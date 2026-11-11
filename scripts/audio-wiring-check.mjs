import assert from 'node:assert/strict';
import {observeAudio} from './sound-controls-check.mjs';

const count = page => page.evaluate(() => window.__soundQA.starts.length);
const starts = (page, from) => page.evaluate(from => window.__soundQA.starts.slice(from), from);

async function routed(page, from, bus, label) {
  await page.waitForFunction(({from,bus}) => window.__soundQA.starts.slice(from).some(voice => voice.bus === bus), {from,bus});
  const voices = await starts(page, from);
  const matching = voices.filter(voice => voice.bus === bus);
  assert.ok(matching.length, `${label} schedules ${bus}`);
  for (const voice of matching) {
    assert.ok(voice.path.length >= 6, `${label} reaches the destination through the real graph`);
    assert.ok(voice.master > 0 && voice.effects > 0 && voice.busGain > 0, `${label} has live category and bus faders`);
  }
  return matching;
}

async function ready(page) {
  await page.waitForFunction(() => document.body.dataset.state === 'playing'
    && document.querySelector('#world')?.getAttribute('aria-busy') === 'false'
    && document.querySelector('#room-loading')?.hidden);
  await page.waitForLoadState('networkidle');
}

async function start(page) {
  await page.locator('#start').click();
  await page.waitForFunction(() => document.body.dataset.state === 'rig-select');
  await page.locator('[data-rig="cryo"]').click();
  await page.locator('#equip-rig').click();
  await page.waitForFunction(() => document.body.dataset.state === 'reward');
  await page.locator('[data-mutation]').first().click();
  await ready(page);
}

/** Production application proof: observe native Web Audio starts and actual node routes. */
export async function checkAudioWiring(browser, origin) {
  const context = await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  const errors = [];
  const pending = new Set();
  page.on('request', request => pending.add(request.url()));
  page.on('requestfinished', request => pending.delete(request.url()));
  page.on('requestfailed', request => {pending.delete(request.url());errors.push(`${request.url()}: ${request.failure()?.errorText}`);});
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {if (message.type() === 'error') errors.push(message.text());});
  await observeAudio(page);
  await page.addInitScript(() => {
    localStorage.setItem('containment.audio.v1', JSON.stringify({master:.6,muted:false}));
    localStorage.setItem('containment.ui.v1', JSON.stringify({version:1,tier:'low',music:.38,effects:.8}));
  });
  try {
    const url = new URL(origin); url.searchParams.delete('debug');
    await page.goto(url.href);
    await page.waitForFunction(() => document.body.dataset.state === 'menu');
    assert.equal(await page.evaluate(() => '__containmentDebug' in window), false);
    await page.locator('#settings').click();
    await routed(page,0,'ui','Native menu settings');
    let from = await count(page);
    await page.locator('#master-volume').focus(); await page.keyboard.press('ArrowRight');
    await routed(page,from,'ui','Native menu slider');
    await page.locator('#settings').click();
    from = await count(page);
    await start(page);
    await routed(page, from, 'ui', 'Real Start / rig / draft');
    const graph = await page.evaluate(() => {
      const entry = window.__soundQA.contexts.at(-1), buses = entry.gains.slice(9,16);
      return {count:buses.length, parents:buses.map(node => [...entry.edges.get(node)].map(target => entry.gains.indexOf(target)))};
    });
    assert.deepEqual(graph, {count:7,parents:[[2],[4],[1,6],[1,6],[1,6],[1,6],[1]]}, 'Named bus identities match the real mixer graph');

    from = await count(page);
    const magazine = await page.locator('#magazine').textContent();
    await page.keyboard.down('Space');
    try {
      await page.waitForFunction(before => document.querySelector('#magazine').textContent !== before, magazine);
      await routed(page, from, 'weapons', 'Native Space firing');
    } finally {await page.keyboard.up('Space');}

    from = await count(page);
    await page.keyboard.press('q');
    await routed(page, from, 'abilities', 'Native Cryo Nova');

    from = await count(page);
    await page.locator('#pause').click();
    await page.waitForFunction(() => document.body.dataset.state === 'paused');
    const opening = (await starts(page, from)).filter(voice => voice.bus === 'ui');
    assert.equal(opening.length, 1, 'Opening pause schedules exactly one interface cue before all-stop');
    assert.ok(opening[0].stops.some(at => at <= opening[0].at + .04), 'Pause stops the opening cue and all existing voices');
    assert.ok((await starts(page,0)).filter(voice => voice.loop).every(voice => voice.stops.length), 'Pause stops every real loop source');
    from = await count(page);
    await page.locator('[data-pause-tab=settings]').click();
    await page.locator('#master-volume').focus(); await page.keyboard.press('ArrowRight');
    await page.locator('#sound').click(); await page.locator('#sound').click();
    await page.evaluate(() => document.activeElement?.blur());
    for (const key of ['Space','q','f','v']) await page.keyboard.press(key);
    await page.waitForTimeout(250);
    assert.equal(await count(page), from, 'Paused settings and native gameplay keys schedule zero voices');

    await page.locator('#sound').click();
    await page.locator('#resume').click();
    await ready(page);
    from = await count(page);
    const beforeMuted = await page.locator('#magazine').textContent();
    await page.keyboard.down('Space');
    try {await page.waitForFunction(before => document.querySelector('#magazine').textContent !== before, beforeMuted);}
    finally {await page.keyboard.up('Space');}
    const emptyPips = () => page.locator('[data-ability="dash"] .dash-pips i[data-empty="true"]:not([hidden])').count();
    const beforeDash = await emptyPips();
    await page.keyboard.press('Shift');
    await page.waitForFunction(before => document.querySelectorAll('[data-ability="dash"] .dash-pips i[data-empty="true"]:not([hidden])').length > before, beforeDash);
    await page.waitForTimeout(250);
    assert.equal(await count(page), from, 'Muted native fire and ability retain gameplay while scheduling zero voices');

    // The supported debug hook stages real simulation transitions, without an audio API/global.
    await page.waitForLoadState('networkidle');
    url.searchParams.set('debug','1');
    await page.goto(url.href);
    await page.waitForFunction(() => document.body.dataset.state === 'menu' && !!window.__containmentDebug);
    await start(page);
    from = await count(page);
    await page.evaluate(() => {window.__containmentDebug.game.clearRoom();window.__containmentDebug.refresh();});
    await routed(page, from, 'ui', 'Real room clear / checkpoint');
    await page.waitForTimeout(150);
    const clear = (await starts(page, from)).filter(voice => voice.bus === 'ui' && Math.abs(voice.duration - 1.05) < .01);
    assert.equal(clear.length, 1, 'Room-clear stinger is scheduled once');
    assert.equal(clear[0].stops.length, 0, 'Cleared-room screen leaves the stinger audible');

    await page.evaluate(async () => {await window.__containmentDebug.startRun(1729, {rigSelect:true});});
    await page.locator('[data-rig="cryo"]').click(); await page.locator('#equip-rig').click();
    await page.locator('[data-mutation]').first().click();
    await ready(page);
    from = await count(page);
    await page.evaluate(() => {window.__containmentDebug.game.hurt(10000);window.__containmentDebug.refresh();});
    await page.waitForFunction(() => document.body.dataset.state === 'dead');
    await routed(page, from, 'ui', 'Real lethal damage');
    await page.waitForTimeout(200);
    const death = (await starts(page, from)).filter(voice => voice.bus === 'ui' && Math.abs(voice.duration - 1.5) < .01);
    assert.equal(death.length, 1, 'Death has one stinger across beats, HUD and syncCombat');
    assert.equal(death[0].stops.length, 0, 'Results leave the death stinger audible');
    assert.deepEqual(errors, []);
    console.log('Audio wiring passed: production Start, native firing/ability, named live bus paths, one opening pause cue, zero paused/muted scheduling, real clear/checkpoint/death stingers.');
  } catch (error) {
    const state = await page.evaluate(() => ({state:document.body.dataset.state,progress:document.querySelector('#asset-track')?.getAttribute('aria-valuenow'),text:document.body.innerText.slice(0,800)})).catch(() => null);
    throw new Error(`Audio wiring failed: ${JSON.stringify({errors,pending:[...pending],state})}`, {cause:error});
  } finally {await context.close();}
}
