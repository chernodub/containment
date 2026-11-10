import { beforeAll, afterAll, expect, it } from 'vitest';
import { startHudHarness, stopHudHarness, mountHud, inspectHud, hudCopy } from './HudHarness';
// Desktop resize coverage, including the historical 640×360/600×600 windows.
const sizes = [[640, 360], [600, 600], [960, 540], [1280, 900], [1920, 1080]] as const;
const cases = sizes.flatMap(([w, h]) => [true, false].flatMap(expanded => [false, true].map(boss => [w, h, expanded, boss] as const)));
beforeAll(startHudHarness);
afterAll(stopHudHarness);
function assertClear(result: Awaited<ReturnType<typeof inspectHud>>, label: string) {
    for (const f of result.frames) {
        expect(f.success, label + ' solution').toBe(true);
        expect(f.pairs, label + ' panel overlap').toEqual([]);
        expect(f.actorHits, label + ' marine overlap').toEqual([]);
        expect(f.invalid, label + ' visible/in viewport').toEqual([]);
    }
    for (const f of result.frames.slice(1))
        expect(f.boxes, label + ' stable repeated call').toEqual(result.frames[0].boxes);
    expect(result.passThrough, label + ' read-only pass-through').toEqual([]);
    expect(result.skipAccessible, label + ' Skip access').toBe(true);
}
it.each(cases)('joint HUD is clear and stable at %ix%i expanded=%s boss=%s', async (width, height, expanded, boss) => {
    const page = await mountHud(width, height);
    try {
        await page.evaluate(({ expanded, boss }) => { document.getElementById('story-presentation')!.hidden = !expanded; document.getElementById('boss-hud')!.hidden = !boss; }, { expanded, boss });
        for (const [name, x, y] of [['NW', 40, 60], ['N', width / 2, 60], ['NE', width - 40, 60], ['W', 40, height / 2], ['C', width / 2, height / 2], ['E', width - 40, height / 2], ['SW', 40, height - 60], ['S', width / 2, height - 60], ['SE', width - 40, height - 60]] as const)
            assertClear(await inspectHud(page, x, y), `${width}x${height} ${name}`);
        for (const [id, text] of Object.entries(hudCopy))
            expect(await page.locator('#' + id).textContent()).toBe(text);
    }
    finally {
        await page.close();
    }
}, 30000);
it('reflows the same live HUD across desktop resize and dialogue changes', async () => {
    const page = await mountHud(1280, 900);
    try {
        for (const [width, height] of [...sizes, [1280, 900] as const]) {
            await page.setViewportSize({ width, height });
            for (const expanded of [true, false]) {
                await page.evaluate(expanded => { document.getElementById('story-presentation')!.hidden = !expanded; document.getElementById('boss-hud')!.hidden = false; }, expanded);
                assertClear(await inspectHud(page, width - 40, height - 60), `${width}x${height} resize expanded=${expanded}`);
            }
        }
    }
    finally {
        await page.close();
    }
}, 30000);
it('protects the larger follow-camera marine at the center of every desktop window', async () => {
    for (const [width, height] of sizes) {
        const page = await mountHud(width, height);
        try {
            assertClear(await inspectHud(page, width / 2, height / 2, 140), `${width}x${height} follow`);
        }
        finally {
            await page.close();
        }
    }
});
it('preserves native weapon, Pause and Skip gestures through relocation and keyboard use', async () => {
    const page = await mountHud(1280, 900);
    try {
        assertClear(await inspectHud(page, 640, 450), 'initial input layout');
        for (const [selector, action] of [['[data-weapon="rifle"]', 'rifle'], ['#pause', 'pause'], ['#skip-story', 'skip']] as const) {
            const target = page.locator(selector);
            await target.click();
            expect(await page.evaluate(() => (window as any).__actions.splice(0))).toEqual([action]);
            const before = (await target.boundingBox())!;
            await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
            await page.mouse.down();
            const outcome = await page.evaluate(({ selector, before }) => { const button = document.querySelector(selector)!; const player = { left: before.x, right: before.x + before.width, top: before.y, bottom: before.y + before.height }; const success = (window as any).__place(player, innerWidth, innerHeight); return { success, after: button.getBoundingClientRect().toJSON() }; }, { selector, before });
            expect(outcome.success).toBe(true);
            expect(outcome.after.x !== before.x || outcome.after.y !== before.y).toBe(true);
            await page.mouse.up();
            expect(await page.evaluate(() => (window as any).__actions.splice(0))).toEqual([action]);
            await target.focus();
            await page.keyboard.press('Enter');
            expect(await page.evaluate(() => (window as any).__actions.splice(0))).toEqual([action]);
        }
        const rifle = page.locator('[data-weapon="rifle"]');
        await rifle.evaluate(el => { el.setAttribute('draggable', 'true'); (window as any).__cancelEvents = []; for (const name of ['pointercancel', 'lostpointercapture'])
            el.addEventListener(name, e => (window as any).__cancelEvents.push({ type: e.type, trusted: e.isTrusted })); });
        const drag = (await rifle.boundingBox())!;
        await page.mouse.move(drag.x + drag.width / 2, drag.y + drag.height / 2);
        await page.mouse.down();
        await page.mouse.move(drag.x + drag.width / 2 + 100, drag.y - 80, { steps: 12 });
        await page.mouse.up();
        expect(await page.evaluate(() => (window as any).__cancelEvents)).toEqual([{ type: 'pointercancel', trusted: true }, { type: 'lostpointercapture', trusted: true }]);
        expect(await page.evaluate(() => (window as any).__actions.splice(0))).toEqual([]);
        await rifle.evaluate(el => el.removeAttribute('draggable'));
        await rifle.click();
        expect(await page.evaluate(() => (window as any).__actions.splice(0))).toEqual(['rifle']);
        for (const state of ['paused', 'route', 'dead', 'menu']) {
            await page.evaluate(state => document.body.dataset.state = state, state);
            for (const selector of ['#pause', '#skip-story', '[data-weapon="rifle"]'])
                expect(await page.locator(selector).evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none');
        }
    }
    finally {
        await page.close();
    }
}, 30000);
