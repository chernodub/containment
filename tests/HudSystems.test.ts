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
        let hud: any;
        const game = new DepthGame((event: unknown) => hud?.effect(event));
        game.expedition = { ...game.expedition, build: { mutations: ['breacher'] } };
        game.status = 'playing';
        const canvas = document.getElementById('world')!;
        const renderer = { canvas, playerScreenBounds: () => ({ left: innerWidth / 2 - 27, right: innerWidth / 2 + 27, top: innerHeight / 2 - 70, bottom: innerHeight / 2 + 70 }), worldToScreen: (x: number, y: number) => ({ x: x / 4 + innerWidth / 2, y: y / 4 + innerHeight / 2 }) };
        (window as any).__hudPrefs = { combatText: true, radar: false };
        hud = createHud(game, renderer, () => { (window as any).__place(renderer.playerScreenBounds(), innerWidth, innerHeight); }, () => (window as any).__hudPrefs);
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
        expect(await page.locator('[data-ability="tactical"]').getAttribute('data-flash')).toBe('false');
        expect(await page.locator('[data-ability="tactical"] .ability-value').textContent()).toBe('Unavailable');
        await page.evaluate(() => (window as any).__live.hud());
        expect(await page.locator('[data-ability="tactical"] .ability-value').textContent()).toBe('Unavailable');
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
            hud.effect({ type: 'hurt', x: game.player.x, y: game.player.y, sourceX:-10000,sourceY:0 });
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
it('makes ready rigs elemental, fills Overdrive energy, marks low ammunition and replaces the permanent hint with optional contextual coaching', async () => {
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
        expect(full.edge).toBe('none');
        await page.evaluate(() => { const { game, hud } = (window as any).__live; const resources = game.combat.getRunResources(); resources.ammo.pistol.magazine = 1; game.combat.restoreRunResources(resources); hud(); game.combat.startReload(); game.combat.update(300); hud(); });
        expect(await page.locator('.weapon-hud').getAttribute('data-ammo')).toBe('low');
        expect(await page.locator('.weapon-hud').getAttribute('data-reloading')).toBe('true');
        await page.waitForFunction(()=>parseFloat(getComputedStyle(document.getElementById('magazine')!,'::after').width)>0);
        const ammo = await page.locator('#magazine').evaluate(el => ({ progress: parseFloat(getComputedStyle(el).getPropertyValue('--reload-progress')), stripe: parseFloat(getComputedStyle(el, '::after').width) }));
        expect(ammo.progress).toBeGreaterThan(0);
        expect(ammo.stripe).toBeGreaterThan(0);
        expect(await page.locator('.desktop-hint').count()).toBe(0);
        expect(await page.locator('#contextual-onboarding').count()).toBe(1);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        expect(await page.locator('[data-ability=overdrive]').evaluate(el => getComputedStyle(el, '::after').animationName)).toBe('none');
    }
    finally {
        await page.close();
    }
});

it('reads live dash recharge and cast/cooldown receipts, then flashes on recharge', async () => {
    const page = await mountHud(1920, 1080);
    try {
        await liveHud(page);
        await page.evaluate(async () => {
            const {game, hud, adapter} = (window as any).__live;
            const load = new Function('path', 'return import(path)');
            const {expeditionRewardOffers} = await load('/src/game/roguelike/expedition.ts');
            adapter.setUiFixture(game, null);
            game.newRun(1729, {rigSelect: true});
            adapter.chooseRig(game, 'cryo');
            game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
            hud();
            adapter.useAbility(game, 'dash');
            for (let i = 0; i < 10; i++) game.update(50, {x:0,y:0,fire:false,angle:null,autoAim:false});
            hud();
        });
        expect(await page.locator('[data-ability="dash"]').getAttribute('data-charges')).toBe('1');
        const progress = await page.locator('.dash-pips i[data-empty=true]:not([hidden])').evaluate(node => parseFloat((node as HTMLElement).style.getPropertyValue('--pip-charge')));
        expect(progress).toBeGreaterThan(0);
        expect(progress).toBeLessThan(100);
        await page.evaluate(() => {
            const {game, hud, adapter} = (window as any).__live;
            adapter.useAbility(game, 'tactical'); hud();
        });
        expect(await page.locator('[data-ability="tactical"]').getAttribute('data-state')).toBe('cooling');
        await page.evaluate(() => {
            const {game, hud, adapter} = (window as any).__live;
            adapter.useAbility(game, 'tactical'); hud();
        });
        expect(await page.locator('[data-ability="tactical"] .ability-value').textContent()).toBe('Recharging');
        await page.evaluate(() => {
            const {game, hud} = (window as any).__live;
            hud.tick(.1); hud.tick(.1); hud.tick(.1); hud.tick(.1);
            const remaining = game.abilities.snapshot.slots.tactical.cooldownRemainingMs;
            for (let ms = 0; ms < remaining + 50; ms += 50) game.abilities.update(50);
            hud();
        });
        expect(await page.locator('[data-ability="tactical"]').getAttribute('data-state')).toBe('ready');
        expect(await page.locator('[data-ability="dash"]').getAttribute('data-charges')).toBe('2');
        expect(await page.locator('[data-ability="tactical"]').getAttribute('data-flash')).toBe('true');
    } finally { await page.close(); }
});

it('dismisses the ready announcement immediately when real Overdrive starts', async () => {
    const page = await mountHud(1920, 1080);
    try {
        await liveHud(page);
        await page.evaluate(() => {
            const {game,hud}= (window as any).__live;
            game.abilities.setRig('arc'); game.abilities.addCharge(12000); hud();
        });
        expect(await page.locator('.hud-toast:not([hidden])').allTextContents()).toContain('Overdrive ready · V');
        await page.evaluate(() => {const {game,hud}=(window as any).__live;game.useAbility('overdrive');hud();});
        expect(await page.locator('.hud-toast:not([hidden])').allTextContents()).not.toContain('Overdrive ready · V');
        expect(await page.locator('[data-ability="overdrive"]').getAttribute('data-state')).toBe('active');
    } finally {await page.close();}
});

it('explains that a stored charge needs clear ground instead of showing a zero-second cooldown', async () => {
    const page=await mountHud(1920,1080);
    try {
        await liveHud(page);
        await page.evaluate(()=>{
            const {game,hud,adapter,fixtures}=(window as any).__live;
            const s=fixtures.abilityFixture('cryo','ready');
            adapter.setUiFixture(game,{abilities:{...s,slots:{...s.slots,power:{...s.slots.power,ready:false,charges:1,cooldownRemainingMs:0}}}});
            hud();
        });
        expect(await page.locator('[data-ability="power"] .ability-value').textContent()).toBe('Need clear ground');
        expect(await page.locator('[data-ability="power"]').getAttribute('data-charges')).toBe('1');
    } finally {await page.close();}
});

it('displays budgeted target receipts once without treating aggregate ability ticks as extra damage', async () => {
    const page = await mountHud(1920, 1080);
    try {
        await liveHud(page);
        await page.evaluate(async () => {
            const load = new Function('path', 'return import(path)');
            const {PresentationBudget} = await load('/src/game/abilities/PresentationBudget.ts');
            const {hud} = (window as any).__live;
            const budget = new PresentationBudget((e: unknown) => hud.effect(e));
            const hit = {type:'hit',x:640,y:0,targetId:7,source:'ability',damage:4,elements:['ice']};
            budget.push(hit); budget.push(hit);
            budget.push({...hit,source:'status',damage:2});
            budget.push({type:'ability',x:640,y:0,ability:{phase:'tick',ability:'whiteout',rig:'cryo',element:'cryo',slot:'overdrive',targetIds:[7,8],totalDamage:16}});
            budget.update(250); hud.tick(.01);
            (window as any).__receiptBudget = budget;
        });
        expect(await page.locator('.combat-float[data-kind="damage"][data-source="ability"]:not([hidden])').allTextContents()).toEqual(['8']);
        expect(await page.locator('.combat-float[data-kind="damage"][data-source="status"]:not([hidden])').allTextContents()).toEqual(['2']);
        expect(await page.locator('.combat-float[data-kind="status"]:not([hidden])').allTextContents()).toEqual(['CHILLED']);
        await page.evaluate(() => {
            const {hud} = (window as any).__live;
            (window as any).__receiptBudget.push({type:'hit',x:640,y:0,targetId:7,source:'ability',damage:3,lethal:true});
            hud.tick(.01);
        });
        expect(await page.locator('.combat-float[data-source="ability"]:not([hidden])').textContent()).toBe('11 ×');
        expect(await page.locator('.combat-float[data-source="ability"]:not([hidden])').getAttribute('data-lethal')).toBe('true');
    } finally {await page.close();}
});

it('offers full ability rules on passive hover and native focus, including a live Overdrive duration ring', async () => {
    const page=await mountHud(1920,1080);
    try {
        await liveHud(page);
        await page.evaluate(()=>{const {game,hud,adapter,fixtures}=(window as any).__live;adapter.setUiFixture(game,{abilities:fixtures.abilityFixture('cryo','active')});hud();hud.tick(.01);});
        const tactical=page.locator('[data-ability=tactical]');
        expect(await tactical.getAttribute('tabindex')).toBe('0');
        await tactical.focus();
        const tooltip=page.locator('#ability-rules-tactical');
        expect(await tooltip.isVisible()).toBe(true);
        expect(await tooltip.textContent()).toContain('frozen solid for 1.8 seconds');
        expect(await tooltip.evaluate(node=>getComputedStyle(node).pointerEvents)).toBe('none');
        await page.locator('#pause').focus();
        expect(await tooltip.isHidden()).toBe(true);
        const box=(await tactical.boundingBox())!;
        await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
        expect(await tooltip.isVisible()).toBe(true);
        const hit=await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.id,{x:box.x+box.width/2,y:box.y+box.height/2});
        expect(hit).toBe('world');
        const ring=page.locator('.overdrive-duration circle');
        const offset=Number(await ring.evaluate(node=>(node as SVGCircleElement).style.strokeDashoffset));
        expect(offset).toBeGreaterThan(0);expect(offset).toBeLessThan(132);
        const dashOffset=Number(await page.locator('.dash-duration circle').evaluate(node=>(node as SVGCircleElement).style.strokeDashoffset));
        expect(dashOffset).toBeGreaterThan(0);expect(dashOffset).toBeLessThan(132);
        await page.evaluate(()=>(window as any).__live.hud.dispose());
        expect(await page.locator('.ability-tooltip,.overdrive-duration,.dash-duration,#contextual-onboarding').count()).toBe(0);
    } finally {await page.close();}
});

it('shows remaining-enemy progress and deduplicates a short multi-kill beat with a cooldown', async () => {
    const page=await mountHud(1920,1080);
    try {
        await liveHud(page);
        await page.evaluate(()=>{
            const {game,hud}=(window as any).__live;
            let remaining=20;Object.defineProperty(game,'encounterRemaining',{get:()=>remaining});hud();remaining=10;hud();
            for(let id=1;id<=4;id++){hud.effect({type:'hit',x:0,y:0,targetId:id,damage:40,lethal:true});hud.effect({type:'hit',x:0,y:0,targetId:id,damage:40,lethal:true});}
        });
        const progress=page.locator('.encounter-progress');
        expect(await progress.getAttribute('aria-valuetext')).toBe('10 enemies remaining');
        expect(Number(await progress.getAttribute('aria-valuenow'))).toBeGreaterThan(0);
        expect(await page.locator('.hud-toast[data-kind=combat]:not([hidden])').allTextContents()).toEqual(['SWARM BROKEN · 3 down']);
        await page.emulateMedia({reducedMotion:'reduce'});
        expect(await page.locator('.hud-toast[data-kind=combat]').evaluate(node=>getComputedStyle(node).animationName)).toBe('none');
    } finally {await page.close();}
});


it('announces a reacquired boon after a fresh expedition clears the previous build', async () => {
    const page = await mountHud(1280, 900);
    try {
        await liveHud(page);
        const receipts = await page.evaluate(() => {
            const {game, hud} = (window as any).__live;
            const install = () => {
                game.expedition = {...game.expedition, build: {...game.expedition.build, mutations: ['reserve-thruster']}};
                hud();
                return [...document.querySelectorAll('.hud-toast:not([hidden])')].some(node => node.textContent?.includes('Reserve Thruster acquired'));
            };
            const first = install();
            for (let i = 0; i < 50; i++) hud.tick(.1);
            game.newRun(1729, {rigSelect:true}); hud();
            game.chooseRig('cryo'); hud();
            // The public start flow synchronously refreshes this empty rig-select build.
            game.status = 'playing';
            const second = install();
            hud();
            const count = [...document.querySelectorAll('.hud-toast:not([hidden])')].filter(node => node.textContent?.includes('Reserve Thruster acquired')).length;
            return {first, second, count};
        });
        expect(receipts).toEqual({first:true, second:true, count:1});
    } finally {await page.close();}
});

it('labels a held full Overdrive for the next room and preserves its visible meter and accessible status', async () => {
    const page = await mountHud(1280, 720);
    try {
        await liveHud(page);
        await page.evaluate(() => {
            const {game,hud,adapter,fixtures}=(window as any).__live;
            const base=fixtures.abilityFixture('breacher','overdrive');
            adapter.setUiFixture(game,{abilities:{...base,slots:{...base.slots,overdrive:{...base.slots.overdrive,ready:false}},overdrive:{...base.overdrive,ready:false,roomLimited:true,charge:1}}});
            hud();
        });
        const slot=page.locator('[data-ability="overdrive"]');
        expect(await slot.getAttribute('data-state')).toBe('cooling');
        expect(await slot.locator('.ability-value').textContent()).toBe('NEXT ROOM');
        expect(await slot.getAttribute('aria-label')).toContain('NEXT ROOM');
        expect(await slot.locator('.overdrive-meter i').evaluate((el:HTMLElement)=>el.style.width)).toBe('100%');
        const result=await inspectHud(page,640,360,140);
        expect(result.frames[0].success).toBe(true);
        expect(result.frames[0].invalid).toEqual([]);
        await page.evaluate(()=>{const {game,hud,adapter,fixtures}=(window as any).__live;adapter.setUiFixture(game,{abilities:fixtures.abilityFixture('breacher','overdrive')});hud();});
        expect(await slot.getAttribute('data-state')).toBe('ready');
        expect(await slot.locator('.ability-value').textContent()).toBe('READY');
    } finally { await page.close(); }
});

it('compacts combat choices after inspection and restores objective details on held Tab and mouse hover without changing gameplay', async () => {
    const page=await mountHud(1280,720);
    try {
        await liveHud(page);
        await page.evaluate(()=>{const {game,hud,adapter,fixtures}=(window as any).__live;adapter.setUiFixture(game,{abilities:fixtures.abilityFixture('cryo','cooling')});hud();for(let i=0;i<45;i++)hud.tick(.1);hud();});
        const before=await page.evaluate(()=>{const {game}=(window as any).__live;return {health:game.combat.snapshot.health,charges:game.abilities.snapshot.slots,x:game.player.x,y:game.player.y};});
        expect(await page.locator('.weapon-bank').getAttribute('data-expanded')).toBe('false');
        expect(await page.locator('#status-hud').getAttribute('data-expanded')).toBe('false');
        const compact=await page.locator('#action-bar').boundingBox();
        expect(compact!.width).toBeLessThan(750);expect(compact!.height).toBeLessThan(130);
        expect(await page.locator('[data-ability=tactical] .ability-value').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(20);
        expect(await page.locator('[data-ability=tactical] kbd').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(12);
        expect(await page.locator('[data-ability=tactical]').getAttribute('data-reason')).toBe('Recharging');
        await page.keyboard.down('Tab');await page.evaluate(()=>(window as any).__live.hud());
        expect(await page.locator('#status-hud').getAttribute('data-expanded')).toBe('true');
        await page.keyboard.up('Tab');await page.evaluate(()=>(window as any).__live.hud());
        expect(await page.locator('#status-hud').getAttribute('data-expanded')).toBe('false');
        await page.keyboard.press('Digit3');await page.evaluate(()=>(window as any).__live.hud());
        expect(await page.locator('.weapon-bank').getAttribute('data-expanded')).toBe('true');
        await page.evaluate(()=>{const {hud}=(window as any).__live;for(let i=0;i<16;i++)hud.tick(.1);hud();});
        expect(await page.locator('.weapon-bank').getAttribute('data-expanded')).toBe('false');
        const room=await page.locator('#status-hud').boundingBox();
        await page.mouse.move(room!.x+room!.width/2,room!.y+room!.height/2);await page.evaluate(()=>(window as any).__live.hud());
        expect(await page.locator('#status-hud').getAttribute('data-expanded')).toBe('true');
        const after=await page.evaluate(()=>{const {game}=(window as any).__live;return {health:game.combat.snapshot.health,charges:game.abilities.snapshot.slots,x:game.player.x,y:game.player.y};});
        expect(after).toEqual(before);
        expect(await page.locator('[data-weapon]').count()).toBe(5);
    } finally {await page.close();}
});

it('explains each denied press by the pointer, clears optional placement feedback, and keeps fire decoration passive',async()=>{
    const page=await mountHud(1280,720);
    try{
        await liveHud(page);
        await page.evaluate(()=>{const {renderer}=(window as any).__live;(window as any).__placement=[];renderer.setInvalidAbilityPlacement=(...args:unknown[])=>(window as any).__placement.push(args);});
        await page.mouse.move(820,320);
        for(const [reason,expected] of [['casting','Casting'],['cooldown','Recharging'],['no-charge','No charge'],['blocked','Need clear ground'],['no-target','No target']]){
            await page.evaluate(reason=>{(window as any).__live.hud.effect({type:'ability',x:0,y:0,ability:{phase:'denied',slot:'power',ability:'glacier',rig:'cryo',element:'cryo',denial:reason,targetX:180,targetY:220}});},reason);
            const label=page.locator('#ability-denial');expect(await label.textContent()).toBe(expected);expect(await label.isVisible()).toBe(true);
            expect(await label.evaluate(el=>getComputedStyle(el).pointerEvents)).toBe('none');
            const box=await label.boundingBox();expect(box!.x).toBeGreaterThan(600);expect(box!.y).toBeGreaterThan(320);expect(box!.y).toBeLessThan(390);
        }
        await page.evaluate(()=>{const {hud}=(window as any).__live;for(let i=0;i<10;i++)hud.tick(.1);});
        expect(await page.locator('#ability-denial').isHidden()).toBe(true);
        expect((await page.evaluate(()=>(window as any).__placement)).length).toBeGreaterThan(1);
        await page.evaluate(()=>{const {hud}= (window as any).__live;hud.effect({type:'ability',x:0,y:0,ability:{phase:'denied',slot:'power',ability:'glacier',rig:'cryo',element:'cryo',denial:'blocked'}});(window as any).__live.game.status='paused';hud.tick(.1);});
        expect(await page.locator('#ability-denial').isHidden()).toBe(true);
        await page.evaluate(()=>(window as any).__live.hud.dispose());expect(await page.locator('#ability-denial').count()).toBe(0);
    }finally{await page.close();}
});
