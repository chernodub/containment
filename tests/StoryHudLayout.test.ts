import { afterAll, beforeAll, expect, test } from 'vitest';
import type { Page } from 'playwright';
import { startHudHarness, stopHudHarness, mountHud, overlap } from './HudHarness';
beforeAll(startHudHarness);
afterAll(stopHudHarness);
const witness = { left: 86.05780838287984, top: 118.83017102549077, right: 126.96689929197085, bottom: 201.34074454224842 };
async function rect(page: Page, selector: string) { return page.locator(selector).evaluate(el => el.getBoundingClientRect().toJSON()); }
async function position(page: Page, box = witness) { return page.evaluate(box => { (window as any).__invalidate(); return (window as any).__place(box, innerWidth, innerHeight); }, box); }
test('keeps status clear of recorded Room6 frame199 and preserves native Skip access and focus', async () => {
    const page = await mountHud(1280, 900);
    try {
        for (const box of [witness, { ...witness, left: 1280 - witness.right, right: 1280 - witness.left }]) {
            expect(await position(page, box)).toBe(true);
            for (const id of ['status-hud', 'story-hud', 'run-stock', 'build-strip'])
                expect(overlap(await rect(page, '#' + id), box)).toBe(0);
            const skip = page.locator('#skip-story');
            await skip.focus();
            await page.keyboard.press('Enter');
            expect(await page.evaluate(() => (window as any).__actions.splice(0))).toEqual(['skip']);
            await skip.click();
            expect(await page.evaluate(() => (window as any).__actions.splice(0))).toEqual(['skip']);
            const panel = await rect(page, '#status-hud');
            await position(page, panel);
            expect(await skip.evaluate(el => el === document.activeElement)).toBe(true);
            expect(overlap(await rect(page, '#status-hud'), panel)).toBe(0);
        }
    }
    finally {
        await page.close();
    }
});
test('stays stable near the marine and reflows all status rows after desktop resize and dialogue changes', async () => {
    const page = await mountHud(1280, 900);
    try {
        for (const [width, height] of [[1280, 900], [640, 900], [960, 480]]) {
            await page.setViewportSize({ width, height });
            const actor = { left: 40, right: 80, top: 120, bottom: 200 };
            for (const expanded of [true, false]) {
                await page.locator('#story-presentation').evaluate((el, expanded) => (el as HTMLElement).hidden = !expanded, expanded);
                expect(await position(page, actor)).toBe(true);
                const a = await rect(page, '#status-hud');
                expect(await position(page, actor)).toBe(true);
                expect(await rect(page, '#status-hud')).toEqual(a);
                const build = await rect(page, '#build-strip'), stock = await rect(page, '#run-stock'), story = await rect(page, '#story-hud');
                expect(stock.bottom).toBeLessThanOrEqual(story.top);
                expect(story.bottom).toBeLessThanOrEqual(build.top);
                expect(story.left).toBeGreaterThanOrEqual(0);
                expect(story.right).toBeLessThanOrEqual(width);
                expect(story.bottom).toBeLessThan(height);
                expect(overlap(a, actor)).toBe(0);
                if (expanded)
                    await page.locator('#skip-story').click();
            }
        }
    }
    finally {
        await page.close();
    }
});
test('status copy preserves real canvas mouse aim and fire while Skip remains clickable', async () => {
    const page = await mountHud(1280, 900);
    try {
        await position(page);
        await page.evaluate(() => { const canvas = document.getElementById('world')!; canvas.addEventListener('mousemove', () => document.body.dataset.aimed = 'yes'); canvas.addEventListener('mousedown', () => document.body.dataset.fired = 'yes'); });
        for (const selector of ['#story-status', '#room-objective', '#story-line', '.room-label']) {
            const box = await rect(page, selector);
            await page.mouse.click(box.x + 2, box.y + 2);
            expect(await page.locator('body').getAttribute('data-aimed')).toBe('yes');
            expect(await page.locator('body').getAttribute('data-fired')).toBe('yes');
            await page.evaluate(() => { delete document.body.dataset.aimed; delete document.body.dataset.fired; });
        }
        await page.locator('#skip-story').click();
        expect(await page.evaluate(() => (window as any).__actions.splice(0))).toEqual(['skip']);
    }
    finally {
        await page.close();
    }
});
test('moves vitals clear of Room12 frame495 and safely relocates when either position becomes occupied', async () => {
    const page = await mountHud(1280, 900), body = { left: 136.76889616257478, right: 177.6779870716657, top: 32.91517519581806, bottom: 115.42574871257571 };
    try {
        for (const [width, height] of [[1280, 900], [640, 900], [960, 480]]) {
            await page.setViewportSize({ width, height });
            expect(await position(page, body)).toBe(true);
            const vital = await rect(page, '.vitals');
            expect(overlap(vital, body)).toBe(0);
            expect(vital.left).toBeGreaterThanOrEqual(0);
            expect(vital.right).toBeLessThanOrEqual(width);
            expect(vital.bottom).toBeLessThanOrEqual(height);
            expect(await page.locator('#health').textContent()).toBe('100');
            expect(await page.locator('#armor').textContent()).toBe('50');
            await page.evaluate(() => document.getElementById('world')!.addEventListener('mousedown', () => document.body.dataset.fired = 'yes'));
            await page.mouse.click(vital.left + 10, vital.top + 10);
            expect(await page.locator('body').getAttribute('data-fired')).toBe('yes');
            expect(await position(page, vital)).toBe(true);
            expect(overlap(await rect(page, '.vitals'), vital)).toBe(0);
        }
    }
    finally {
        await page.close();
    }
});
test('keeps the room heading and Pause clear of north-east marine poses, usable by mouse and keyboard', async () => {
    const page = await mountHud(1280, 900);
    try {
        for (const [width, height] of [[1280, 900], [640, 900], [960, 480]]) {
            await page.setViewportSize({ width, height });
            for (const box of [{ left: width - 90, right: width - 50, top: 30, bottom: 115 }, { left: 1018.6609690645946, top: 49.77284403710499, right: 1059.5700599736856, bottom: 132.2834175538627 }]) {
                expect(await position(page, box)).toBe(true);
                for (const selector of ['.room-label', '#pause'])
                    expect(overlap(await rect(page, selector), box)).toBe(0);
                const heading = await rect(page, '.room-label'), pause = await rect(page, '#pause'), build = await rect(page, '#build-strip');
                expect(heading.right).toBeLessThanOrEqual(pause.left);
                expect(Math.max(heading.bottom, pause.bottom)).toBeLessThanOrEqual(build.top);
                await page.locator('#pause').click();
                expect(await page.evaluate(() => (window as any).__actions.splice(0))).toEqual(['pause']);
                await page.locator('#pause').focus();
                await page.keyboard.press('Enter');
                expect(await page.evaluate(() => (window as any).__actions.splice(0))).toEqual(['pause']);
            }
        }
        for (const state of ['paused', 'route', 'dead', 'menu']) {
            await page.evaluate(state => document.body.dataset.state = state, state);
            expect(await page.locator('#pause').evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none');
        }
    }
    finally {
        await page.close();
    }
});
