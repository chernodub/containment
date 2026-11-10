import { afterAll, beforeAll, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { chromium, type Browser, type Page } from 'playwright';

let browser: Browser;
let controller = '';
const root = fileURLToPath(new URL('../', import.meta.url));
const entry = '\0containment-radar-test';

beforeAll(async () => {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    plugins: [{
      name: 'radar-test-entry',
      resolveId(id) { if (id === entry) return entry; },
      load(id) {
        if (id === entry) return `import {Radar} from ${JSON.stringify(root + 'src/ui/hud/Radar.ts')}; window.Radar=Radar;`;
      },
    }],
    build: {
      write: false,
      minify: false,
      target: 'es2022',
      rollupOptions: { input: entry, output: { format: 'iife' } },
    },
  });
  for (const bundle of Array.isArray(result) ? result : [result]) {
    if ('output' in bundle) {
      controller += bundle.output.filter(item => item.type === 'chunk').map(item => item.code).join('\n');
    }
  }
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-gpu', '--disable-webgl'],
  });
}, 30_000);

afterAll(async () => { await browser?.close(); });

async function mount(withRenderer = true): Promise<Page> {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const css = readFileSync(new URL('../src/ui/styles/radar.css', import.meta.url), 'utf8');
  await page.setContent(`<style>${css}</style><div id="hud"><aside id="radar-hud"><div class="radar-label"><span>LOCAL SCAN</span></div><svg id="radar-map"></svg></aside></div>`);
  await page.addScriptTag({ content: controller });
  await page.evaluate(withRenderer => {
    const game = {
      roomRevision: 1,
      geometry: {
        bounds: { x: 100, y: 200, width: 1000, height: 500 },
        boundary: [{ x: 100, y: 200 }, { x: 1100, y: 200 }, { x: 1100, y: 700 }, { x: 100, y: 700 }],
        voids: [[{ x: 300, y: 300 }, { x: 400, y: 300 }, { x: 400, y: 400 }, { x: 300, y: 400 }]],
        blockers: [{ x: 200, y: 250, width: 100, height: 50 }],
        breaches: [{ x: 100, y: 450 }, { x: 1100, y: 450 }],
        exitPoint: { x: 1050, y: 450 },
      },
      player: { x: 600, y: 450, angle: Math.PI / 2 },
      enemies: { snapshot: { enemies: [
        { x: 500, y: 300, health: 10, alpha: 1, elite: false },
        { x: 550, y: 300, health: 10, alpha: 1, elite: true },
        { x: 650, y: 300, health: 10, alpha: 1, elite: true, champion: 'warden' },
        { x: 750, y: 300, health: 0, alpha: 1, elite: false },
        { x: 800, y: 300, health: 10, alpha: .1, elite: false },
      ] } },
      boss: { snapshot: { active: false, x: 600, y: 400 } },
    };
    const renderer = {
      canvas: { clientWidth: 1280, clientHeight: 720 },
      pointer(x: number, y: number) { return { x: 400 + x / 1280 * 400, y: 300 + y / 720 * 300 }; },
    };
    const radar = new (window as any).Radar(document.getElementById('radar-hud'), document.getElementById('radar-map'), withRenderer ? renderer : undefined);
    (window as any).radarTest = { game, radar, renderer };
    radar.update(game, true);
  }, withRenderer);
  return page;
}

it('centers true north-up geometry uniformly, preserving bounds origin and voids', async () => {
  const page = await mount();
  try {
    const evidence = await page.evaluate(() => {
      const wall = document.querySelector('.radar-wall')!;
      return {
        width: Number(wall.getAttribute('width')),
        height: Number(wall.getAttribute('height')),
        floor: document.querySelector('.radar-floor')!.getAttribute('d'),
        fillRule: document.querySelector('.radar-floor')!.getAttribute('fill-rule'),
        player: document.querySelector('.radar-player')!.getAttribute('transform'),
        breaches: document.querySelectorAll('.radar-breach').length,
        exit: document.querySelectorAll('.radar-exit').length,
      };
    });
    expect(evidence.width / evidence.height).toBe(2);
    expect(evidence.floor).toContain('M8 18');
    expect(evidence.floor?.match(/M/g)).toHaveLength(2);
    expect(evidence.fillRule).toBe('evenodd');
    expect(evidence.player).toBe('translate(72 50) rotate(90)');
    expect(evidence.breaches).toBe(2);
    expect(evidence.exit).toBe(1);
    expect(await page.locator('.radar-label').textContent()).toBe('DECK RADAR');
  } finally { await page.close(); }
});

it('distinguishes contacts and the live objective while reusing forty enemy nodes', async () => {
  const page = await mount();
  try {
    expect(await page.locator('.radar-enemy').count()).toBe(40);
    expect(await page.locator('.radar-enemy[visibility="visible"]').count()).toBe(3);
    for (const kind of ['standard', 'elite', 'champion']) {
      expect(await page.locator(`.radar-enemy[data-kind="${kind}"]`).count()).toBe(1);
    }
    expect(await page.locator('.radar-enemy[data-kind="elite"]').getAttribute('r')).toBe('2');
    expect(await page.locator('.radar-objective').getAttribute('visibility')).toBe('visible');
    expect(await page.locator('.radar-objective').getAttribute('d')).not.toBe(await page.locator('.radar-exit').getAttribute('d'));
    const result = await page.evaluate(() => {
      const { game, radar } = (window as any).radarTest;
      const first = document.querySelector('.radar-enemy');
      const floor = document.querySelector('.radar-floor');
      game.enemies.snapshot.enemies = Array.from({ length: 80 }, (_, index) => ({ x: 500 + index, y: 300, health: 10, alpha: 1, elite: false }));
      radar.update(game, true);
      const staticReused = document.querySelector('.radar-floor') === floor;
      game.roomRevision++;
      game.boss.snapshot = { active: true, x: 600, y: 450 };
      radar.update(game, true);
      return {
        staticReused,
        poolReused: document.querySelector('.radar-enemy') === first,
        staticRebuilt: document.querySelector('.radar-floor') !== floor,
        objective: document.querySelector('.radar-objective')!.getAttribute('transform'),
      };
    });
    expect(result).toEqual({ staticReused: true, poolReused: true, staticRebuilt: true, objective: 'translate(72 50)' });
    expect(await page.locator('.radar-enemy[visibility="visible"]').count()).toBe(40);
  } finally { await page.close(); }
});

it('projects the camera floor corners and hides unavailable legacy projections', async () => {
  const page = await mount();
  try {
    expect(await page.locator('.radar-camera').getAttribute('visibility')).toBe('visible');
    const points = await page.locator('.radar-camera').getAttribute('points');
    const coordinates = points!.split(/[ ,]/).map(Number);
    const expected = [46.4, 30.8, 97.6, 30.8, 97.6, 69.2, 46.4, 69.2];
    coordinates.forEach((value, index) => expect(value).toBeCloseTo(expected[index], 4));
    expect(await page.locator('.radar-camera').getAttribute('clip-path')).toMatch(/^url\(#radar-floor-/);
    await page.evaluate(() => {
      const { game, radar, renderer } = (window as any).radarTest;
      renderer.pointer = () => null;
      radar.update(game, true);
    });
    expect(await page.locator('.radar-camera').getAttribute('visibility')).toBe('hidden');
  } finally { await page.close(); }
  const legacy = await mount(false);
  try {
    expect(await legacy.locator('.radar-camera').getAttribute('visibility')).toBe('hidden');
    expect(await legacy.locator('.radar-player').count()).toBe(1);
  } finally { await legacy.close(); }
});

it('honors the setting immediately and disposes without leaving SVG nodes or animation', async () => {
  const page = await mount();
  try {
    await page.evaluate(() => {
      const { game, radar } = (window as any).radarTest;
      radar.update(game, false);
    });
    expect(await page.locator('#radar-hud').isHidden()).toBe(true);
    await page.evaluate(() => {
      const { game, radar } = (window as any).radarTest;
      radar.update(game, true);
    });
    expect(await page.locator('#radar-hud').isVisible()).toBe(true);
    expect(await page.locator('.radar-player').evaluate(node => getComputedStyle(node).animationName)).toBe('none');
    await page.evaluate(() => {
      const { game, radar } = (window as any).radarTest;
      radar.dispose();
      radar.update(game, true);
    });
    expect(await page.locator('#radar-map > *').count()).toBe(0);
    expect(await page.locator('#radar-hud').isHidden()).toBe(true);
  } finally { await page.close(); }
});
