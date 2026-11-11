import { beforeAll, afterAll, expect, it } from 'vitest';
import * as T from 'three';
import { DepthRenderer } from '../src/render/DepthRenderer';
import { weaponHudSide } from '../src/WeaponHud';
import { startHudHarness, stopHudHarness, mountHud, overlap } from './HudHarness';
beforeAll(startHudHarness);
afterAll(stopHudHarness);
it('protects the actual projected marine in Room15 frame500 without changing the camera', async () => {
    const camera = new T.OrthographicCamera(-22 * 1280 / 900 / 2, 22 * 1280 / 900 / 2, 11, -11, .1, 120);
    camera.position.set(22.555555555555554, 26, 33.575871994669704);
    camera.quaternion.set(-.4527600968822728, 0, 0, .8916323764148287);
    camera.updateMatrixWorld(true);
    const root = new T.Group();
    root.position.set(1173.963838901654 / 32, 0, 771.1201346227588 / 32);
    const renderer = Object.assign(Object.create(DepthRenderer.prototype), { camera, player: { root, height: 2.2 }, canvas: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 900 }) } }) as DepthRenderer;
    const player = renderer.playerScreenBounds(16), matrix = camera.projectionMatrix.toArray(), page = await mountHud(1280, 900);
    try {
        const success = await page.evaluate(player => (window as any).__place(player, innerWidth, innerHeight), player);
        expect(success).toBe(true);
        for (const selector of ['.weapon-hud', '#weapon-picker', '.desktop-hint']) {
            const box = await page.locator(selector).evaluate(el => el.getBoundingClientRect().toJSON());
            expect(overlap(box, player)).toBe(0);
            expect(box.left).toBeGreaterThanOrEqual(0);
            expect(box.right).toBeLessThanOrEqual(1280);
        }
        expect(camera.projectionMatrix.toArray()).toEqual(matrix);
        expect(await page.locator('#magazine').innerText()).toBe('08');
        expect(await page.locator('#reserve').innerText()).toBe('/ 21');
    }
    finally {
        await page.close();
    }
});
it.each([[600, 600], [960, 540], [1280, 900], [1920, 1080]])('keeps all ammunition controls on screen and away from the marine at desktop %ix%i', async (width, height) => {
    const page = await mountHud(width, height);
    try {
        const normal = await page.locator('#action-bar').evaluate(el => el.getBoundingClientRect().toJSON());
        const player = { left: normal.left + 5, right: normal.right - 5, top: normal.top, bottom: normal.bottom };
        expect(await page.evaluate(player => (window as any).__place(player, innerWidth, innerHeight), player)).toBe(true);
        for (const selector of ['.weapon-hud', '#weapon-picker', '.desktop-hint']) {
            const box = await page.locator(selector).evaluate(el => el.getBoundingClientRect().toJSON());
            expect(overlap(box, player)).toBe(0);
            expect(box.left).toBeGreaterThanOrEqual(0);
            expect(box.right).toBeLessThanOrEqual(width);
            expect(box.top).toBeGreaterThanOrEqual(0);
            expect(box.bottom).toBeLessThanOrEqual(height);
        }
        const moved = await page.locator('#action-bar').evaluate(el => el.getBoundingClientRect().toJSON());
        expect(await page.evaluate(player => (window as any).__place(player, innerWidth, innerHeight), moved)).toBe(true);
        expect(overlap(await page.locator('#action-bar').evaluate(el => el.getBoundingClientRect().toJSON()), moved)).toBe(0);
    }
    finally {
        await page.close();
    }
});
it('retains the existing side helper hysteresis for callers using individual ammo panels', () => {
    const panel = { left: 1100, right: 1250, top: 700, bottom: 800 }, near = { left: 1060, right: 1090, top: 710, bottom: 760 };
    expect(weaponHudSide(panel, near, 1280, 'right')).toBe('left');
    expect(weaponHudSide(panel, { ...near, left: 1040, right: 1065 }, 1280, 'left')).toBe('left');
    expect(weaponHudSide(panel, { left: 600, right: 650, top: 400, bottom: 450 }, 1280, 'left')).toBe('right');
});
it('recalculates an already relocated action bar after a desktop resize', async () => {
    const page = await mountHud(1280, 900);
    try {
        const panel = page.locator('#action-bar'), original = await panel.evaluate(el => el.getBoundingClientRect().toJSON());
        expect(await page.evaluate(player => (window as any).__place(player, innerWidth, innerHeight), original)).toBe(true);
        await page.setViewportSize({ width: 600, height: 600 });
        const resized = await panel.evaluate(el => el.getBoundingClientRect().toJSON());
        const resizedPlayer = { left: resized.x + resized.width / 2 - 27, right: resized.x + resized.width / 2 + 27, top: resized.y + resized.height / 2 - 70, bottom: resized.y + resized.height / 2 + 70 };
        expect(await page.evaluate(player => (window as any).__place(player, innerWidth, innerHeight), resizedPlayer)).toBe(true);
        const final = await panel.evaluate(el => el.getBoundingClientRect().toJSON());
        expect(overlap(final, resizedPlayer)).toBe(0);
        expect(final.left).toBeGreaterThanOrEqual(0);
        expect(final.right).toBeLessThanOrEqual(600);
        expect(final.top).toBeGreaterThanOrEqual(0);
        expect(final.bottom).toBeLessThanOrEqual(600);
    }
    finally {
        await page.close();
    }
});
it('clears all lower controls at the recorded armory frame746 and mirrored/narrow desktop poses, preserving native gestures', async () => {
    for (const [width, height] of [[1280, 900], [960, 540], [600, 600]]) {
        const page = await mountHud(width, height);
        try {
            for (const player of [{ left: width - 73.7337876049503, top: height - 145.886189163229, right: width - 32.8246966958593, bottom: height - 63.3756156464713 }, { left: 33, top: height - 146, right: 74, bottom: height - 63 }, { left: width / 2 - 21, top: height - 80, right: width / 2 + 21, bottom: height - 5 }]) {
                expect(await page.evaluate(player => (window as any).__place(player, innerWidth, innerHeight), player)).toBe(true);
                for (const selector of ['.weapon-hud', '#weapon-picker', '.desktop-hint']) {
                    const box = await page.locator(selector).evaluate(el => el.getBoundingClientRect().toJSON());
                    expect(overlap(box, player)).toBe(0);
                    expect(box.left).toBeGreaterThanOrEqual(0);
                    expect(box.right).toBeLessThanOrEqual(width);
                    expect(box.top).toBeGreaterThanOrEqual(0);
                    expect(box.bottom).toBeLessThanOrEqual(height);
                }
            }
            expect(await page.locator('[data-weapon]').count()).toBe(5);
            const rifle = page.getByRole('button', { name: 'Equip rifle', exact: true }), target = (await rifle.boundingBox())!;
            await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2);
            await page.mouse.down();
            expect(await page.evaluate(() => { const picker = document.getElementById('weapon-picker')!; return (window as any).__place(picker.getBoundingClientRect().toJSON(), innerWidth, innerHeight); })).toBe(true);
            const moved = (await rifle.boundingBox())!;
            expect(moved.x !== target.x || moved.y !== target.y).toBe(true);
            await page.mouse.up();
            expect(await page.evaluate(() => (window as any).__actions.splice(0))).toEqual(['rifle']);
            await page.getByRole('button', { name: 'Equip shotgun', exact: true }).focus();
            await page.keyboard.press('Enter');
            expect(await page.evaluate(() => (window as any).__actions.splice(0))).toEqual(['shotgun']);
            await page.evaluate(() => document.body.dataset.state = 'paused');
            expect(await rifle.evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none');
        }
        finally {
            await page.close();
        }
    }
});
