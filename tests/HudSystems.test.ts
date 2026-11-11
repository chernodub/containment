import { beforeAll, afterAll, expect, it } from 'vitest';
import type { Page } from 'playwright';
import { startHudHarness, stopHudHarness, mountHud, inspectHud } from './HudHarness';
beforeAll(startHudHarness);
afterAll(stopHudHarness);
async function liveHud(page: Page) {
    await page.evaluate(async () => {
        const load = new Function('path', 'return import(path)') as (p: string) => Promise<any>;
        const { DepthGame } = await load('/src/DepthGame.ts');
        const { createHud } = await load('/src/ui/hud/Hud.ts');
        const adapter = await load('/src/ui/gameAdapter.ts'), fixtures = await load('/src/ui/fixtures.ts');
        const game = new DepthGame();
        game.expedition = { ...game.expedition, build: { mutations: ['breacher'] } };
        game.status = 'playing';
        const canvas = document.getElementById('world')!;
        const renderer = { canvas, playerScreenBounds: () => ({ left: innerWidth / 2 - 27, right: innerWidth / 2 + 27, top: innerHeight / 2 - 70, bottom: innerHeight / 2 + 70 }), worldToScreen: (x: number, y: number) => ({ x: x / 4 + innerWidth / 2, y: y / 4 + innerHeight / 2 }) };
        (window as any).__hudPrefs = { combatText: true, radar: false };
        const hud = createHud(game, renderer, () => { (window as any).__place(renderer.playerScreenBounds(), innerWidth, innerHeight); }, () => (window as any).__hudPrefs);
        (window as any).__live = { game, hud, adapter, fixtures, renderer };
        hud();
    });
}
it('renders all rig ability states and protects the centered follow marine through desktop resizing', async () => {
    const page = await mountHud(1280, 900);
    try {
        await liveHud(page);
        for (const [width, height] of [[1280, 720], [1920, 1080], [960, 540], [640, 360], [600, 600]]) {
            await page.setViewportSize({ width, height });
            for (const state of ['ready', 'cooling', 'casting', 'overdrive']) {
                await page.evaluate(state => { const { game, hud, adapter, fixtures } = (window as any).__live; adapter.setUiFixture(game, { abilities: fixtures.abilityFixture('breacher', state) }); hud(); }, state);
                expect(await page.locator('#ability-bar').isVisible()).toBe(true);
                const result = await inspectHud(page, width / 2, height / 2, 140);
                expect(result.frames[0].success, `${width}x${height} ${state}`).toBe(true);
                expect(result.frames[0].actorHits).toEqual([]);
                expect(result.frames[0].invalid).toEqual([]);
                for (const slot of ['dash', 'tactical', 'power', 'overdrive'])
                    expect(await page.locator(`[data-ability="${slot}"] .ability-title`).textContent()).not.toBe('');
                if (state === 'cooling') {
                    expect(await page.locator('[data-ability="tactical"]').getAttribute('data-state')).toBe('cooling');
                    expect(await page.locator('.dash-pips i[data-empty="true"]').count()).toBeGreaterThan(0);
                }
                if (state === 'casting')
                    expect(await page.locator('[data-ability="tactical"]').getAttribute('data-state')).toBe('casting');
                if (state === 'overdrive')
                    expect(await page.locator('[data-ability="overdrive"]').getAttribute('data-state')).toBe('ready');
            }
        }
        await page.evaluate(() => { const { hud } = (window as any).__live; hud.effect({ type: 'ability', x: 0, y: 0, ability: { phase: 'denied', slot: 'tactical', ability: 'seismic-slam', rig: 'breacher', element: 'kinetic', denial: 'blocked' } }); });
        expect(await page.locator('[data-ability="tactical"]').getAttribute('data-state')).toBe('denied');
        expect(await page.locator('[data-ability="tactical"] .ability-value').textContent()).toBe('BLOCKED');
        await page.evaluate(() => { const { hud, game, adapter } = (window as any).__live; adapter.setUiFixture(game, { abilities: null }); hud(); });
        expect(await page.locator('#ability-bar').isHidden()).toBe(true);
    }
    finally {
        await page.close();
    }
});
it('merges real damage per target, pools burst events, honors combat text preference and disposes nodes', async () => {
    const page = await mountHud(1280, 900);
    try {
        await liveHud(page);
        await page.evaluate(() => {
            const { hud } = (window as any).__live;
            for (let i = 0; i < 5; i++)
                hud.effect({ type: i < 2 ? 'acid' : 'hit', contact: 'damage', x: 80, y: 0, id: 1, damage: 12 });
            hud.tick(.01);
        });
        expect(await page.locator('.combat-float:not([hidden])').count()).toBe(1);
        expect(await page.locator('.combat-float:not([hidden])').textContent()).toBe('60');
        await page.evaluate(() => {
            const { hud } = (window as any).__live;
            for (let i = 2; i < 100; i++)
                hud.effect({ type: 'hit', x: i * 10, y: 40, id: i, damage: 3, lethal: i === 99 });
            hud.tick(.01);
        });
        expect(await page.locator('.combat-float').count()).toBe(28);
        expect(await page.locator('.combat-float:not([hidden])').count()).toBeLessThanOrEqual(28);
        await page.evaluate(() => { (window as any).__hudPrefs.combatText = false; (window as any).__live.hud(); });
        expect(await page.locator('.combat-float:not([hidden])').count()).toBe(0);
        await page.evaluate(() => { const { hud } = (window as any).__live; hud.effect({ type: 'hit', x: 0, y: 0, id: 3, damage: 40 }); hud.effect({ type: 'pickup', x: 0, y: 0 }); });
        expect(await page.locator('.combat-float:not([hidden])').count()).toBe(0);
        expect(await page.locator('.hud-toast:not([hidden])').count()).toBe(1);
        await page.evaluate(() => (window as any).__live.hud.dispose());
        for (const selector of ['.combat-float', '.hud-toast', '.threat-marker', '.damage-direction'])
            expect(await page.locator(selector).count()).toBe(0);
    }
    finally {
        await page.close();
    }
});
it('shows segmented damage lag and distinct low-health feedback without changing resources', async () => {
    const page = await mountHud(1280, 900);
    try {
        await liveHud(page);
        await page.evaluate(() => { const { game, hud } = (window as any).__live; game.combat.applyDamage(130); hud(); hud.tick(.05); });
        const health = Number(await page.locator('#health').textContent());
        expect(health).toBeLessThanOrEqual(25);
        expect(await page.locator('#hud').getAttribute('class')).toContain('low-health');
        expect(await page.locator('#vital-state').textContent()).toBe('CRITICAL');
        const actual = await page.locator('#hp-bar').evaluate(el => parseFloat((el as HTMLElement).style.width)), lag = await page.locator('#hp-lag').evaluate(el => parseFloat((el as HTMLElement).style.width));
        expect(lag).toBeGreaterThan(actual);
        await page.evaluate(() => {
            const { hud } = (window as any).__live;
            for (let i = 0; i < 50; i++)
                hud.tick(.1);
        });
        expect(await page.locator('#hp-lag').evaluate(el => parseFloat((el as HTMLElement).style.width))).toBe(actual);
        expect(Number(await page.locator('#health').textContent())).toBe(health);
    }
    finally {
        await page.close();
    }
});
it('has a projection-checked layout fast path without DOM measurement on ordinary frames', async () => {
    const page = await mountHud(1280, 900);
    try {
        await inspectHud(page, 640, 450, 140);
        const result = await page.evaluate(() => {
            let measurements = 0;
            const originals: Array<[
                Element,
                any
            ]> = [];
            for (const selector of ['#status-hud', '#action-bar', '.vitals']) {
                const node = document.querySelector(selector)!;
                const original = node.getBoundingClientRect;
                originals.push([node, original]);
                node.getBoundingClientRect = () => { measurements++; return original.call(node); };
            }
            let success = true;
            for (let i = 0; i < 60; i++)
                success = (window as any).__place({ left: 613, right: 667, top: 380, bottom: 520 }, innerWidth, innerHeight) && success;
            for (const [node, original] of originals)
                node.getBoundingClientRect = original;
            return { measurements, success };
        });
        expect(result.success).toBe(true);
        expect(result.measurements).toBe(0);
    }
    finally {
        await page.close();
    }
});
it('hides offscreen damage while keeping bounded elite attack threats and directional hurt', async () => {
    const page = await mountHud(1280, 900);
    try {
        await liveHud(page);
        await page.evaluate(() => {
            const { game, hud } = (window as any).__live;
            const enemies = Array.from({ length: 40 }, (_, id) => ({ id, type: id % 2 ? 'brute' : 'spitter', elite: id % 3 === 0, x: id % 2 ? -10000 : 10000, y: id * 10, health: 100, alpha: 1, windupMs: 120, chargeMs: 0, pendingAttack: 'spit' }));
            Object.defineProperty(game.enemies, 'snapshot', { get: () => ({ enemies, activeCount: 40, reservedCount: 0 }) });
            hud.effect({ type: 'hit', x: -10000, y: 0, id: 1000, damage: 35 });
            hud.tick(.05);
            hud();
            hud.effect({ type: 'enemy-attack', x: -10000, y: 0 });
            hud.effect({ type: 'hurt', x: game.player.x, y: game.player.y });
            hud.tick(.05);
        });
        expect(await page.locator('.combat-float:not([hidden])').count()).toBe(0);
        expect(await page.locator('.threat-marker').count()).toBe(8);
        const threats = page.locator('.threat-marker:not([hidden])');
        expect(await threats.count()).toBeGreaterThan(0);
        expect(await threats.count()).toBeLessThanOrEqual(8);
        for (const content of await threats.allTextContents())
            expect(content).toMatch(/^\d*$/);
        expect(await page.locator('.threat-marker[data-attacking="true"]:not([hidden])').count()).toBeGreaterThan(0);
        expect(await page.locator('.threat-marker[data-elite="true"]:not([hidden])').count()).toBeGreaterThan(0);
        expect(await page.locator('.damage-direction:not([hidden])').count()).toBe(1);
        await page.evaluate(() => {
            for (let i = 0; i < 10; i++)
                (window as any).__live.hud.tick(.1);
        });
        expect(await page.locator('.damage-direction:not([hidden])').count()).toBe(0);
    }
    finally {
        await page.close();
    }
});
it('renders optional radar with native room aspect, breaches and exit, and preserves checkpoint warning text', async () => {
    const page = await mountHud(1280, 900);
    try {
        await liveHud(page);
        expect(await page.locator('#radar-hud').isHidden()).toBe(true);
        const evidence = await page.evaluate(() => {
            const { game, hud } = (window as any).__live;
            (window as any).__hudPrefs.radar = true;
            hud();
            const wall = document.querySelector('#radar-map .radar-wall')!, original = game.geometry.blockers[0];
            const sx = Number(wall.getAttribute('width')) / original.width, sy = Number(wall.getAttribute('height')) / original.height;
            const warning = 'Progress could not be saved. Leaving or reloading may lose progress or restore an older checkpoint.';
            Object.defineProperty(game, 'checkpointStatus', { get: () => 'save-failed' });
            Object.defineProperty(game, 'checkpointWarning', { get: () => warning });
            hud();
            return { sx, sy, breaches: game.geometry.breaches.length, warning };
        });
        expect(await page.locator('#radar-hud').isVisible()).toBe(true);
        expect(evidence.sx).toBeCloseTo(evidence.sy);
        expect(await page.locator('.radar-breach').count()).toBe(evidence.breaches);
        expect(await page.locator('.radar-exit').count()).toBe(1);
        expect(await page.locator('.radar-player').count()).toBe(1);
        expect(await page.locator('.hud-toast:not([hidden])').textContent()).toBe(evidence.warning);
        await page.evaluate(() => { (window as any).__hudPrefs.radar = false; (window as any).__live.hud(); });
        expect(await page.locator('#radar-hud').isHidden()).toBe(true);
    }
    finally {
        await page.close();
    }
});
it('groups owned boon glyphs by family with full accessible rules, capped stacks and set bonus', async () => {
    const page = await mountHud(600, 600);
    page.setDefaultTimeout(1500);
    try {
        await liveHud(page);
        await page.evaluate(() => { const { game, hud } = (window as any).__live; game.expedition = { ...game.expedition, build: { mutations: ['breacher', 'heavy-pellets', 'piercing-rounds', 'pressure-point', 'cryogenic'] } }; hud(); });
        expect(await page.locator('.boon-group[data-family="Kinetic"]').getAttribute('data-bonus')).toBe('true');
        expect(await page.locator('.boon-group[data-family="Kinetic"] [data-boon]').count()).toBe(3);
        expect(await page.locator('.boon-group[data-family="Kinetic"] .boon-more').textContent()).toBe('+1');
        expect(await page.locator('.boon-group[data-family="Cryo"] [data-boon="cryogenic"]').count()).toBe(1);
        const glyph = page.locator('[data-boon="breacher"]');
        expect(await glyph.getAttribute('title')).toContain('Shotgun hits launch bodies');
        expect(await glyph.getAttribute('aria-label')).toContain('Breacher');
        expect(await glyph.evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none');
        const result = await inspectHud(page, 300, 300, 140);
        expect(result.frames[0].success).toBe(true);
        expect(result.frames[0].actorHits).toEqual([]);
        expect(result.frames[0].invalid).toEqual([]);
    }
    finally {
        await page.close();
    }
});
it('makes ready rigs elemental, fills Overdrive energy, marks low ammunition and keeps the hint in the lower lip', async () => {
    const page = await mountHud(1920, 1080);
    try {
        await liveHud(page);
        await page.evaluate(() => { const { game, hud, adapter, fixtures } = (window as any).__live; adapter.setUiFixture(game, { abilities: fixtures.abilityFixture('cryo', 'ready') }); hud(); });
        const ready = await page.locator('[data-ability=tactical]').evaluate(el => { const node = el as HTMLElement; return { color: getComputedStyle(node.querySelector('.ability-icon')!).color, opacity: Number(getComputedStyle(node.querySelector('.ability-icon')!).opacity), border: getComputedStyle(node.querySelector('.cooldown-dial')!).boxShadow }; });
        expect(ready.color).toBe('rgb(127, 214, 255)');
        expect(ready.opacity).toBe(1);
        expect(ready.border).not.toBe('none');
        await page.evaluate(() => { const { game, hud, adapter, fixtures } = (window as any).__live; adapter.setUiFixture(game, { abilities: fixtures.abilityFixture('cryo', 'cooling') }); hud(); });
        const cooling = await page.locator('[data-ability=tactical] .ability-icon').evaluate(el => Number(getComputedStyle(el).opacity));
        expect(cooling).toBeLessThan(ready.opacity);
        expect(await page.locator('[data-ability=tactical] .ability-value').textContent()).toMatch(/s$/);
        await page.evaluate(() => { const { game, hud, adapter, fixtures } = (window as any).__live; adapter.setUiFixture(game, { abilities: fixtures.abilityFixture('arc', 'overdrive') }); hud(); });
        const full = await page.locator('[data-ability=overdrive]').evaluate(el => ({ background: getComputedStyle(el).backgroundImage, key: getComputedStyle(el.querySelector('kbd')!).backgroundColor, edge: getComputedStyle(el, '::after').animationName }));
        expect(full.background).not.toBe('none');
        expect(full.key).toBe('rgb(183, 156, 255)');
        expect(full.edge).toBe('overdrive-energy');
        await page.evaluate(() => { const { game, hud } = (window as any).__live; const resources = game.combat.getRunResources(); resources.ammo.pistol.magazine = 1; game.combat.restoreRunResources(resources); hud(); game.combat.startReload(); game.combat.update(300); hud(); });
        expect(await page.locator('.weapon-hud').getAttribute('data-ammo')).toBe('low');
        expect(await page.locator('.weapon-hud').getAttribute('data-reloading')).toBe('true');
        await page.waitForFunction(()=>parseFloat(getComputedStyle(document.getElementById('magazine')!,'::after').width)>0);
        const ammo = await page.locator('#magazine').evaluate(el => ({ progress: parseFloat(getComputedStyle(el).getPropertyValue('--reload-progress')), stripe: parseFloat(getComputedStyle(el, '::after').width) }));
        expect(ammo.progress).toBeGreaterThan(0);
        expect(ammo.stripe).toBeGreaterThan(0);
        const hint = await page.evaluate(() => { const hint = document.querySelector('.desktop-hint')!.getBoundingClientRect(), bar = document.getElementById('action-bar')!.getBoundingClientRect(); return { inside: hint.left >= bar.left && hint.right <= bar.right && hint.top >= bar.top && hint.bottom <= bar.bottom }; });
        expect(hint.inside).toBe(true);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        expect(await page.locator('[data-ability=overdrive]').evaluate(el => getComputedStyle(el, '::after').animationName)).toBe('none');
    }
    finally {
        await page.close();
    }
});
