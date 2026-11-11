import assert from 'node:assert/strict';
import {createServer} from 'vite';

/** Real production rig flow, native keyboard receipts and live HUD synchronization. */
export async function checkCombatRig(page) {
  const url = new URL(page.url());
  url.searchParams.set('debug', '1');
  const settleRoom = async () => {
    await page.evaluate(async () => {
      if (window.__containmentDebug) await window.__containmentDebug.prepare();
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    await page.waitForFunction(() => document.querySelector('#world').getAttribute('aria-busy') === 'false');
    await page.waitForLoadState('networkidle');
  };
  await settleRoom();
  await page.goto(url.href);
  await page.waitForFunction(() => document.body.dataset.state === 'menu' && !!window.__containmentDebug);
  await page.locator('#start').click();
  await page.waitForFunction(() => document.body.dataset.state === 'rig-select');
  const uses = () => page.evaluate(() => window.__containmentDebug.game.stats.abilityUses);
  const beforeMenus = await uses();
  for (const key of ['Shift', 'q', 'f', 'v']) await page.keyboard.press(key);
  assert.deepEqual(await uses(), beforeMenus, 'Rig selection must gate gameplay keys');
  await page.locator('[data-rig="arc"]').click();
  await page.locator('#equip-rig').click();
  await page.waitForFunction(() => document.body.dataset.state === 'reward');
  assert.equal(await page.evaluate(() => window.__containmentDebug.game.abilities.snapshot.rig), 'arc');
  for (const key of ['Shift', 'q', 'f', 'v']) await page.keyboard.press(key);
  assert.deepEqual(await uses(), beforeMenus, 'Starting boon must gate gameplay keys');
  await page.locator('[data-mutation]').first().click();
  await page.waitForFunction(() => document.body.dataset.state === 'playing');
  await page.evaluate(async () => {
    const d = window.__containmentDebug, g = d.game;
    await d.prepare();
    g.skipStory(); d.invulnerable(true); g.enemies.reset();
    Object.assign(g.player, {x:320, y:440, angle:-Math.PI / 2, vx:0, vy:0});
    d.setInput({x:0, y:0, fire:false, angle:-Math.PI / 2, autoAim:false});
    d.step(600);
  });
  await page.waitForFunction(() => document.querySelector('#room-loading').hidden && !window.__containmentDebug.renderer.roomLoading);
  // Aim through the existing public floor ray helper at a legal, unobstructed lane.
  const aim = await page.evaluate(() => {
    const d = window.__containmentDebug, g = d.game;
    for (let y = 180; y < innerHeight - 160; y += 20) for (let x = 180; x < innerWidth - 180; x += 20) {
      const p = d.renderer.pointer(x, y);
      if (!p) continue;
      const range = Math.hypot(p.x - g.player.x, p.y - g.player.y);
      if (range < 180 || range > 260 || !d.canStand(p.x, p.y, 28) || !d.clearShot(p.x, p.y)) continue;
      if (![.2,.4,.6,.8,1].every(t => d.canStand(g.player.x + (p.x - g.player.x) * t, g.player.y + (p.y - g.player.y) * t, 20))) continue;
      return {x, y};
    }
    throw Error('No legal native ability lane');
  });
  await page.mouse.move(aim.x, aim.y);
  const initialCharges = await page.evaluate(() => window.__containmentDebug.game.abilities.snapshot.slots.dash.charges);
  await page.keyboard.press('Shift');
  await page.evaluate(() => window.__containmentDebug.refresh());
  const dash = await page.evaluate(() => window.__containmentDebug.game.abilities.snapshot.slots.dash);
  assert.equal(dash.charges, initialCharges - 1);
  assert.ok(dash.cooldownRemainingMs > 0);
  assert.equal(await page.locator('[data-ability="dash"] .dash-pips i[data-empty="true"]:not([hidden])').count(), 1);
  await page.evaluate(() => window.__containmentDebug.step(200));
  await page.keyboard.press('q');
  await page.evaluate(() => window.__containmentDebug.refresh());
  const tactical = await page.evaluate(() => window.__containmentDebug.game.abilities.snapshot.slots.tactical);
  assert.ok(tactical.cooldownRemainingMs > 0 || tactical.castRemainingMs > 0);
  assert.match(await page.locator('[data-ability="tactical"]').getAttribute('data-state'), /casting|cooling|active/);
  assert.notEqual(await page.locator('[data-ability="tactical"] .ability-value').textContent(), 'READY');
  await page.evaluate(() => window.__containmentDebug.step(300));
  // Pylon placement is at the current pointer; move to a fresh legal point after the dash.
  await page.mouse.move(aim.x + 30, aim.y + 60);
  await page.keyboard.press('f');
  await page.evaluate(() => window.__containmentDebug.refresh());
  const power = await page.evaluate(() => window.__containmentDebug.game.abilities.snapshot.slots.power);
  assert.ok(power.cooldownRemainingMs > 0 || power.castRemainingMs > 0, 'F must start the live power cooldown');
  assert.match(await page.locator('[data-ability="power"]').getAttribute('data-state'), /casting|cooling|active/);
  await page.evaluate(() => window.__containmentDebug.step(300));
  await page.evaluate(() => window.__containmentDebug.fillOverdrive());
  assert.equal(await page.evaluate(() => window.__containmentDebug.game.abilities.snapshot.overdrive.ready), true);
  assert.equal(await page.locator('[data-ability="overdrive"]').getAttribute('data-state'), 'ready');
  assert.equal(await page.locator('[data-ability="overdrive"] .overdrive-meter i').evaluate(node => node.style.width), '100%');
  await page.keyboard.press('v');
  await page.evaluate(() => window.__containmentDebug.step(300));
  assert.equal(await page.evaluate(() => window.__containmentDebug.game.abilities.snapshot.overdrive.active), true);
  assert.equal(await page.locator('[data-ability="overdrive"]').getAttribute('data-state'), 'active');
  assert.deepEqual(await uses(), {dash:1, tactical:1, power:1, overdrive:1});
  assert.equal(await page.evaluate(() => window.__containmentDebug.game.stats.overdrivesUsed), 1);
  await page.evaluate(() => { const d = window.__containmentDebug; d.step(20000); d.fillOverdrive(); });
  assert.equal(await page.evaluate(() => window.__containmentDebug.game.abilities.snapshot.slots.tactical.ready), true);
  assert.equal(await page.evaluate(() => window.__containmentDebug.game.abilities.snapshot.overdrive.ready), true);
  await page.locator('#pause').click();
  const beforePause = await uses();
  for (const key of ['Shift', 'q', 'f', 'v']) await page.keyboard.press(key);
  assert.deepEqual(await uses(), beforePause, 'Pause must gate ability keys');
  await page.locator('#resume').click();
  await page.evaluate(() => {
    const input = document.createElement('input'); input.id = 'ability-typing-check'; document.body.append(input); input.focus();
  });
  for (const key of ['Shift', 'q', 'f', 'v']) await page.keyboard.press(key);
  assert.deepEqual(await uses(), beforePause, 'Typing must gate ability keys');
  await page.evaluate(() => document.querySelector('#ability-typing-check').remove());

  // Resume checkpoints created by the actual Start / equip actions, including each initial phase.
  const checkpointKey = 'containment-depth:run:v1';
  for (const phase of ['rig-select', 'starting-boon']) {
    await settleRoom();
    await page.reload();
    await page.waitForFunction(() => document.body.dataset.state === 'menu' && !!window.__containmentDebug);
    await page.locator('#start').click();
    await page.waitForFunction(() => document.body.dataset.state === 'rig-select');
    if (phase === 'starting-boon') {
      await page.locator('[data-rig="pyro"]').click();
      await page.locator('#equip-rig').click();
    }
    await page.evaluate(() => window.__containmentDebug.prepare());
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), checkpointKey);
    assert.equal(saved?.run.phase, phase, `The actual ${phase} action must save its phase`);
    await settleRoom();
    await page.reload();
    await page.waitForFunction(() => document.body.dataset.state === 'menu' && !!window.__containmentDebug);
    await page.locator('#continue').click();
    await page.waitForFunction(expected => document.body.dataset.state === expected, phase === 'rig-select' ? 'rig-select' : 'reward');
    assert.equal(await page.evaluate(() => window.__containmentDebug.game.expedition.run.phase), phase);
    if (phase === 'rig-select') {
      await page.locator('[data-rig="cryo"]').click();
      await page.locator('#equip-rig').click();
    }
    assert.equal(await page.evaluate(() => window.__containmentDebug.game.abilities.snapshot.rig), phase === 'starting-boon' ? 'pyro' : 'cryo');
    await page.locator('[data-mutation]').first().click();
    await page.waitForFunction(() => document.body.dataset.state === 'playing');
    await page.evaluate(() => window.__containmentDebug.prepare());
  }

  // A genuine legacy cleared-room save has no rig or runtime extension fields.
  const ssr = await createServer({configFile:false,server:{middlewareMode:true, hmr:false},logLevel:'error'});
  try {
    const {DepthGame} = await ssr.ssrLoadModule('/src/DepthGame.ts');
    const {serializeCheckpoint,CHECKPOINT_STORAGE_KEY} = await ssr.ssrLoadModule('/src/game/roguelike/checkpoints.ts');
    const {expeditionRewardOffers} = await ssr.ssrLoadModule('/src/game/roguelike/expedition.ts');
    const game = new DepthGame();
    game.newRun(1729);
    game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
    game.clearRoom();
    const value = serializeCheckpoint({version:1,savedAt:0,run:game.expedition.run,build:{mutations:game.expedition.build.mutations},resources:game.combat.getRunResources()});
    assert.ok(value, 'Valid legacy cleared-room checkpoint');
    await page.evaluate(({key,value}) => localStorage.setItem(key,value), {key:CHECKPOINT_STORAGE_KEY,value});
    await settleRoom();
    await page.reload();
    await page.waitForFunction(() => document.body.dataset.state === 'menu' && !!window.__containmentDebug);
    await page.locator('#continue').click();
    await page.waitForFunction(() => document.body.dataset.state === 'reward');
    assert.equal(await page.evaluate(() => window.__containmentDebug.game.abilities.snapshot.rig), 'breacher');
    await page.locator('[data-mutation]').first().click();
    await page.waitForFunction(() => document.body.dataset.state === 'route');
    await page.locator('[data-route]').first().click();
    await page.waitForFunction(() => document.body.dataset.state === 'playing');
    await page.evaluate(() => window.__containmentDebug.prepare());
  } finally { await ssr.close(); }
  console.log('Combat Rig smoke passed: live Arc selection, Shift/Q/F/V receipts and HUD, Overdrive fill/active, menu/pause/typing gates, Continue rig-select/starting-boon/legacy.');
}
