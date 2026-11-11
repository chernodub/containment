import {uiCss} from './uiSource';
import {afterAll, beforeAll, expect, it, vi} from 'vitest';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
import {chromium, type Browser, type Page} from 'playwright';
import {AUDIO_STORAGE_KEY, loadAudioPreferences} from '../src/game/audio/preferences';
import {GRAPHICS_OPTION_LABELS, GRAPHICS_PRESETS} from '../src/render/graphicsOptions';
import {graphicsChoices, loadUiPreferences, saveUiPreferences, UI_STORAGE_KEY} from '../src/ui/settings';

function storage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => {values.set(key, value);}};
}

it('defaults old saves safely without migrating or changing legacy audio preferences', () => {
  const store = storage({[AUDIO_STORAGE_KEY]: '{"master":0.73,"muted":true}'});
  const audioBefore = store.getItem(AUDIO_STORAGE_KEY);
  expect(loadUiPreferences(store)).toEqual({version: 1, tier: 'high', graphics: GRAPHICS_PRESETS.high, combatText: true, radar: false, music: .38, effects: .8});
  expect(loadAudioPreferences(store)).toEqual({master: .73, muted: true});
  saveUiPreferences(store, loadUiPreferences(store));
  expect(store.getItem(AUDIO_STORAGE_KEY)).toBe(audioBefore);
  expect(loadUiPreferences(null, 'low').graphics).toEqual(GRAPHICS_PRESETS.low);
});

it.each(['invalid', 'null', '[]', 'true', '"settings"', '{"version":99,"tier":"low"}'])('tolerates malformed or unsupported UI storage %s', value => {
  expect(loadUiPreferences(storage({[UI_STORAGE_KEY]: value}))).toEqual(loadUiPreferences(null));
});

it('validates fields independently, rejects nonfinite/out-of-range values and ignores unknown fields', () => {
  const store = storage({[UI_STORAGE_KEY]: '{"version":1,"tier":"low","combatText":false,"radar":"true","music":-1,"effects":0.5,"unknown":true,"graphics":{"bloom":true,"ambientOcclusion":"true","resolutionScale":0.3,"screenShake":1e999,"flashIntensity":0.35,"shadows":"medium","unknown":true}}'});
  expect(loadUiPreferences(store)).toEqual({version: 1, tier: 'low', combatText: false, radar: false, music: .38, effects: .5, graphics: {...GRAPHICS_PRESETS.low, bloom: true, flashIntensity: .35}});
  expect(graphicsChoices('shadows')).toEqual(['off', 'low', 'high']);
});

it('round-trips all graphics fields and tolerates a missing version in old partial UI saves', () => {
  const store = storage({[UI_STORAGE_KEY]: '{"tier":"low","graphics":{"shadows":"low","resolutionScale":0.72,"screenShake":0,"flashIntensity":0},"radar":true,"music":0,"effects":1}'});
  const saved = loadUiPreferences(store);
  saveUiPreferences(store, saved);
  expect(loadUiPreferences(store)).toEqual(saved);
  expect(saved.graphics).toEqual({...GRAPHICS_PRESETS.low, shadows: 'low', resolutionScale: .72, screenShake: 0, flashIntensity: 0});
  expect(Object.keys(saved.graphics).sort()).toEqual(Object.keys(GRAPHICS_PRESETS.high).sort());
  expect(JSON.parse(store.getItem(UI_STORAGE_KEY)!)).not.toHaveProperty('master');
});

it('keeps settings usable when storage cannot be read or written', () => {
  const blocked = {getItem: () => {throw new Error('blocked');}, setItem: () => {throw new Error('full');}};
  expect(loadUiPreferences(blocked)).toEqual(loadUiPreferences(null));
  expect(() => saveUiPreferences(blocked, loadUiPreferences(null))).not.toThrow();
  expect(() => saveUiPreferences(null, loadUiPreferences(null))).not.toThrow();
});

let browser: Browser;
let controller = '';
let css = '';
const rootPath = fileURLToPath(new URL('../', import.meta.url));
const entry = '\0containment-settings-tests';
beforeAll(async () => {
  const result = await build({configFile: false, logLevel: 'silent', plugins: [{
    name: 'settings-test-entry',
    resolveId: id => id === entry ? entry : undefined,
    load: id => id === entry ? `import {createSettings} from ${JSON.stringify(rootPath + 'src/ui/settings.ts')}; window.createSettings=createSettings;` : undefined,
  }], build: {write: false, minify: false, rollupOptions: {input: entry, output: {format: 'iife'}}, target: 'es2022'}});
  for (const item of Array.isArray(result) ? result : [result]) {
    if (!('output' in item)) continue;
    for (const file of item.output) {
      if (file.type === 'chunk') controller += file.code;
      else if (file.fileName.endsWith('.css')) css += String(file.source);
    }
  }
  browser = await chromium.launch({executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, args: ['--no-sandbox', '--disable-gpu', '--disable-webgl']});
}, 30_000);
afterAll(async () => {await browser?.close(); vi.unstubAllGlobals();});

async function mount({reduced = false, blocked = false, legacy = false}: {reduced?: boolean; blocked?: boolean; legacy?: boolean} = {}): Promise<Page> {
  const page = await browser.newPage({viewport: {width: 960, height: 540}});
  await page.emulateMedia({reducedMotion: reduced ? 'reduce' : 'no-preference'});
  await page.setContent(`<style>${uiCss}#overlay{position:static;display:block;background:none;padding:0}body{background:#071016;color:#e8fbff;margin:0;font:14px Arial}#settings-host{width:min(520px,calc(100vw - 64px));padding:24px;margin:0 auto;height:calc(100vh - 48px);overflow:auto;box-sizing:border-box}*{box-sizing:border-box}${css}</style><div id="overlay"><main id="settings-host"></main></div>`);
  await page.addScriptTag({content: controller});
  await page.evaluate(({blocked, legacy}) => {
    const calls: unknown[][] = [];
    const values = new Map<string, string>(legacy ? [['containment.audio.v1', '{"master":0.73,"muted":true}']] : []);
    const storage = {getItem(key: string) {if (blocked) throw Error('blocked'); return values.get(key) ?? null;}, setItem(key: string, value: string) {if (blocked) throw Error('full'); values.set(key, value);}};
    const renderer: any = {qualityTier: 'high', setQuality(tier: string) {renderer.qualityTier = tier; calls.push(['tier', tier]);}, setGraphicsOptions(options: unknown) {renderer.graphicsOptions = options; calls.push(['graphics', options]);}};
    const audio = {setMasterVolume: (value: number) => calls.push(['master', value]), setMusicVolume: (value: number) => calls.push(['music', value]), setEffectsVolume: (value: number) => calls.push(['effects', value]), unlock: async () => true};
    const create = () => (window as any).createSettings({renderer, audio, storage});
    let settings = create();
    const host = document.getElementById('settings-host')!;
    const render = () => {host.innerHTML = settings.render(); settings.bind(host);};
    (window as any).settingsTest = {get settings() {return settings;}, calls, values, renderer, reload() {settings.dispose(); settings = create(); settings.apply(); render();}};
    settings.apply(); render();
  }, {blocked, legacy});
  return page;
}

it('renders every graphics contract option with its metadata and complete shadow choices', async () => {
  const page = await mount();
  try {
    await page.locator('.settings-advanced summary').click();
    expect(await page.locator('#settings-graphics-heading').evaluate(element => getComputedStyle(element).fontSize)).toBe('17px');
    for (const [key, metadata] of Object.entries(GRAPHICS_OPTION_LABELS)) {
      const input = page.locator(`[data-setting="graphics.${key}"]`);
      expect(await input.count(), key).toBe(1);
      expect(await page.getByLabel(metadata.label, {exact: true}).count(), key).toBe(1);
      expect(await page.locator(`#${await input.getAttribute('aria-describedby')}`).textContent(), key).toBe(metadata.hint);
    }
    expect(await page.locator('#setting-graphics-shadows option').allTextContents()).toEqual(['Off', 'Low', 'High']);
    expect(await page.locator('#quality option').allTextContents()).toEqual(['High', 'Low']);
    expect(await page.locator('.settings-credits').getAttribute('href')).toBe('/audio-credits.html');
    const invalid = await page.locator('[data-ui-settings]').evaluate(root => [...root.querySelectorAll('input,select,button,summary,a')].filter(element => {const rect = element.getBoundingClientRect(); return rect.width > 0 && (rect.left < 0 || rect.right > innerWidth);}).map(element => element.id));
    expect(invalid).toEqual([]);
  } finally {await page.close();}
});

it('uses native range keyboard/mouse and mute actions without replacing focus or audio schema', async () => {
  const page = await mount({legacy: true});
  try {
    const slider = page.locator('#master-volume');
    expect(await slider.inputValue()).toBe('73');
    expect(await page.locator('#sound').textContent()).toBe('Unmute');
    await slider.focus(); await page.keyboard.press('ArrowRight');
    expect(await slider.inputValue()).toBe('74');
    expect(await slider.evaluate(element => element === document.activeElement)).toBe(true);
    expect(await page.locator('#volume-value').textContent()).toBe('74%');
    expect(await slider.getAttribute('aria-valuetext')).toBe('74 percent, muted');
    expect(await page.evaluate(() => JSON.parse((window as any).settingsTest.values.get('containment.audio.v1')))).toEqual({master: .74, muted: true});
    const before = await slider.inputValue(); await slider.click({position: {x: 12, y: 22}});
    expect(await slider.inputValue()).not.toBe(before);
    const rect = (await slider.boundingBox())!; expect(rect.height).toBeGreaterThanOrEqual(44);
    await page.locator('#sound').focus(); await page.keyboard.press('Space');
    expect(await page.locator('#sound').textContent()).toBe('Mute');
    expect(await page.locator('#sound').getAttribute('aria-label')).toBe('Mute sound');
    expect(await page.locator('#sound').getAttribute('aria-pressed')).toBe('false');
    expect(await page.locator('#sound').evaluate(element => element === document.activeElement)).toBe(true);
    expect(await page.evaluate(() => Object.keys(JSON.parse((window as any).settingsTest.values.get('containment.audio.v1'))).sort())).toEqual(['master', 'muted']);
  } finally {await page.close();}
});

it('applies and persists tier, every graphics option and gameplay/channel controls through renderer detection', async () => {
  const page = await mount();
  try {
    await page.locator('#quality').selectOption('low');
    await page.locator('.settings-advanced summary').click();
    for (const [key, value] of Object.entries(GRAPHICS_PRESETS.low)) {
      const control = page.locator(`[data-setting="graphics.${key}"]`);
      if (typeof value === 'boolean') await control.check();
      else if (typeof value === 'string') await control.selectOption('low');
      else {await control.focus(); await page.keyboard.press('Home'); if (key === 'resolutionScale') await page.keyboard.press('ArrowRight');}
    }
    await page.locator('[data-setting="combatText"]').uncheck();
    await page.locator('[data-setting="radar"]').check();
    for (const channel of ['music', 'effects']) {await page.locator(`[data-setting="${channel}"]`).focus(); await page.keyboard.press('End');}
    const saved = await page.evaluate(() => JSON.parse((window as any).settingsTest.values.get('containment.ui.v1')));
    expect(saved).toEqual({version: 1, tier: 'low', graphics: {bloom: true, ambientOcclusion: true, lensEffects: true, distortion: true, atmosphere: true, dynamicLights: true, shadows: 'low', resolutionScale: .51, screenShake: 0, flashIntensity: 0}, combatText: false, radar: true, music: 1, effects: 1});
    await page.evaluate(() => (window as any).settingsTest.reload());
    expect(await page.locator('#quality').inputValue()).toBe('low');
    expect(await page.evaluate(() => (window as any).settingsTest.renderer.graphicsOptions)).toEqual(saved.graphics);
    expect(await page.evaluate(() => (window as any).settingsTest.settings.preferences)).toEqual({combatText: false, radar: true});
    await page.locator('#quality').selectOption('high');
    expect(await page.evaluate(() => (window as any).settingsTest.renderer.graphicsOptions)).toEqual(GRAPHICS_PRESETS.high);
    expect(await page.evaluate(() => JSON.parse((window as any).settingsTest.values.get('containment.ui.v1')).graphics)).toEqual(GRAPHICS_PRESETS.high);
  } finally {await page.close();}
});

it('responds to reduced motion changes without overwriting desired values and detaches on disposal', async () => {
  const page = await mount({reduced: true});
  try {
    expect(await page.evaluate(() => (window as any).settingsTest.renderer.graphicsOptions.screenShake)).toBe(0);
    expect(await page.evaluate(() => (window as any).settingsTest.renderer.graphicsOptions.flashIntensity)).toBe(0);
    expect(await page.locator('[data-reduced-motion]').isVisible()).toBe(true);
    expect(await page.locator('[data-setting="graphics.screenShake"]').inputValue()).toBe('100');
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.waitForFunction(() => (window as any).settingsTest.renderer.graphicsOptions.screenShake === 1);
    expect(await page.locator('[data-reduced-motion]').isVisible()).toBe(false);
    await page.evaluate(() => {(window as any).settingsTest.settings.dispose(); (window as any).settingsTest.calls.length = 0;});
    await page.emulateMedia({reducedMotion: 'reduce'});
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    expect(await page.evaluate(() => (window as any).settingsTest.calls)).toEqual([]);
  } finally {await page.close();}
});

it('survives denied storage, repeated binds and the legacy renderer without duplicate native actions', async () => {
  const page = await mount({blocked: true});
  try {
    await page.evaluate(() => {const test = (window as any).settingsTest; delete test.renderer.setGraphicsOptions; test.settings.bind(document.getElementById('settings-host')); test.settings.bind(document.getElementById('settings-host'));});
    await page.locator('#sound').click();
    expect(await page.locator('#sound').textContent()).toBe('Unmute');
    await page.locator('#quality').selectOption('low');
    expect(await page.evaluate(() => (window as any).settingsTest.settings.quality)).toBe('low');
    await page.locator('[data-setting="combatText"]').uncheck();
    expect(await page.evaluate(() => (window as any).settingsTest.settings.preferences.combatText)).toBe(false);
    expect(await page.evaluate(() => (window as any).settingsTest.values.size)).toBe(0);
  } finally {await page.close();}
});


it('keeps the title scroll cue and gives roomy pause settings two columns without changing native controls', async () => {
  const page = await mount();
  try {
    await page.evaluate(() => document.getElementById('settings-host')!.classList.add('title-drawer'));
    expect(await page.locator('.settings-scroll-hint').isVisible()).toBe(true);
    const titlePositions = await page.locator('.settings-layout').evaluate(element => getComputedStyle(element).display);
    expect(titlePositions).toBe('block');
    await page.setViewportSize({width: 1280, height: 720});
    await page.evaluate(() => {
      const host = document.getElementById('settings-host')!;
      host.classList.replace('title-drawer', 'pause-panel');
      host.style.width = '1040px';
    });
    expect(await page.locator('.settings-scroll-hint').isVisible()).toBe(false);
    expect(await page.locator('.settings-layout').evaluate(element => getComputedStyle(element).display)).toBe('grid');
    const graphics = (await page.locator('#settings-graphics-heading').boundingBox())!;
    const accessibility = (await page.locator('#settings-accessibility-heading').boundingBox())!;
    expect(accessibility.y).toBe(graphics.y);
    expect(accessibility.x).toBeGreaterThan(graphics.x + graphics.width);
    const music = (await page.locator('[data-setting="music"]').boundingBox())!;
    const effects = (await page.locator('[data-setting="effects"]').boundingBox())!;
    expect(effects.y).toBe(music.y);
    expect(effects.x).toBeGreaterThan(music.x + music.width);
    await page.setViewportSize({width: 960, height: 540});
    await page.evaluate(() => {document.getElementById('settings-host')!.style.width = '520px';});
    expect(await page.locator('.settings-layout').evaluate(element => getComputedStyle(element).display)).toBe('block');
    const slider = page.locator('#master-volume');
    await slider.focus(); await page.keyboard.press('ArrowRight');
    expect(await slider.inputValue()).toBe('31');
    expect(await slider.evaluate(element => element === document.activeElement)).toBe(true);
  } finally {await page.close();}
});
