import { afterAll, beforeAll, expect, it } from 'vitest';
import type { Page } from 'playwright';
import { startHudHarness, stopHudHarness, mountHud } from './HudHarness';
import { projectileThreatens, threatEdgePoint } from '../src/ui/hud/ThreatIndicators';
beforeAll(startHudHarness);
afterAll(stopHudHarness);
async function rig(page: Page, scale = 4) {
    await page.evaluate(async (scale) => {
        const load = new Function('path', 'return import(path)') as (path: string) => Promise<any>;
        const { ThreatIndicators } = await load('/src/ui/hud/ThreatIndicators.ts');
        const canvas = document.getElementById('world')!, bounds = { left: 613, right: 667, top: 380, bottom: 520 };
        (window as any).__place(bounds, innerWidth, innerHeight);
        const renderer = { canvas, worldToScreen: (x: number, y: number) => ({ x: 640 + x * scale, y: 450 + y * scale }) };
        const threats = new ThreatIndicators(document.getElementById('threat-indicators'), document.getElementById('damage-directions'), renderer);
        const enemy = (id: number, x: number, y: number, extra: Record<string, unknown> = {}) => ({ id, x, y, type: 'crawler', elite: false, health: 100, alpha: 1, windupMs: 0, chargeMs: 0, pendingAttack: null, ...extra });
        (window as any).__threat = { threats, enemy, bounds, player: { x: 0, y: 0 } };
    }, scale);
}
async function markers(page: Page) {
    return page.locator('.threat-marker:not([hidden])').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(), el = node as HTMLElement; return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2, width: r.width, kind: el.dataset.kind, bearing: Number(el.dataset.bearing), distance: Number(el.dataset.distance), count: Number(el.dataset.count), attacking: el.dataset.attacking, inFlight: el.dataset.inFlight, text: el.textContent, opacity: Number(getComputedStyle(el).opacity), path: el.querySelector('.threat-type path')!.getAttribute('d') }; }));
}
it('projects a marine ray to a consistently inset screen edge without changing its bearing', () => {
    const point = { x: 0, y: 0 }, ox = 710, oy = 410, angle = -.7;
    threatEdgePoint(ox, oy, angle, 1280, 900, point);
    expect(Math.atan2(point.y - oy, point.x - ox)).toBeCloseTo(angle, 8);
    expect(point.x).toBeGreaterThanOrEqual(42);expect(point.x).toBeLessThanOrEqual(1238);
    expect(point.y).toBeGreaterThanOrEqual(42);expect(point.y).toBeLessThanOrEqual(858);
    expect(Math.min(Math.abs(point.x-42),Math.abs(point.x-1238),Math.abs(point.y-42),Math.abs(point.y-858))).toBeLessThan(1e-8);
    expect(projectileThreatens({ x: -100, y: 0, kind: 'hazard', request: { angle: 0, speed: 260 } }, { x: 0, y: 0 })).toBe(true);
    expect(projectileThreatens({ x: -100, y: 0, kind: 'hazard', request: { angle: Math.PI, speed: 260 } }, { x: 0, y: 0 })).toBe(false);
    expect(projectileThreatens({ x: -100, y: 130, kind: 'hazard', request: { angle: 0, speed: 260 } }, { x: 0, y: 0 })).toBe(false);
});
it('places text-free chevrons at true outward bearings and merges nearby threats into one count', async () => {
    const page = await mountHud(1280, 900);
    try {
        await rig(page);
        await page.evaluate(() => { const { threats, enemy, player, bounds } = (window as any).__threat; threats.update([enemy(1, 250, 0), enemy(2, 270, 4), enemy(3, -250, 0)], player, bounds, []); });
        const result = await markers(page);
        expect(result).toHaveLength(2);
        const right = result.find(m => m.x > 640)!, left = result.find(m => m.x < 640)!;
        expect(right.count).toBe(2);
        expect(right.text).toBe('2');
        expect(right.bearing).toBeCloseTo(0);
        expect(left.text).toBe('');
        expect(Math.abs(left.bearing)).toBeCloseTo(Math.PI);
        expect(right.x).toBeGreaterThan(1200);
        expect(left.x).toBeLessThan(80);
        expect(right.y).toBeCloseTo(450, 1);
        expect(left.y).toBeCloseTo(450, 1);
        expect(await page.locator('.threat-label,.threat-distance').count()).toBe(0);
    }
    finally {
        await page.close();
    }
});
it('distinguishes standard, ranged, elite, champion and boss silhouettes without names', async () => {
    const page = await mountHud(1280, 900);
    try {
        await rig(page);
        await page.evaluate(() => { const { threats, enemy, player, bounds } = (window as any).__threat; threats.update([enemy(1, 300, 0), enemy(2, -300, 0, { type: 'spitter' }), enemy(3, 0, -240, { elite: true }), enemy(4, 0, 240, { champion: 'warden' })], player, bounds, [], { active: true, health: 100, x: -230, y: -230, pendingTelegraph: null }); });
        const result = await markers(page);
        expect(result.map(m => m.kind).sort()).toEqual(['boss', 'champion', 'elite', 'ranged', 'standard']);
        expect(new Set(result.map(m => m.path)).size).toBe(5);
        for (const marker of result)
            expect(marker.text).toBe('');
    }
    finally {
        await page.close();
    }
});
it('makes nearby threats bigger and brighter, and highlights real approaching spit through flight', async () => {
    const page = await mountHud(1280, 900);
    try {
        await rig(page);
        await page.evaluate(() => { const { threats, enemy, player, bounds } = (window as any).__threat; threats.update([enemy(1, 210, 0)], player, bounds, []); });
        const near = (await markers(page))[0];
        await page.evaluate(() => { const { threats, enemy, player, bounds } = (window as any).__threat; threats.update([enemy(1, 900, 0)], player, bounds, []); });
        const far = (await markers(page))[0];
        expect(near.width).toBeGreaterThan(far.width);
        expect(near.opacity).toBeGreaterThan(far.opacity);
        await page.evaluate(() => { const { threats, enemy, player, bounds } = (window as any).__threat; threats.update([enemy(2, -300, 0, { type: 'spitter' })], player, bounds, [{ x: -150, y: 0, kind: 'hazard', request: { angle: 0, speed: 260 } }]); });
        expect((await markers(page))[0]).toMatchObject({ attacking: 'true', inFlight: 'true' });
        await page.evaluate(() => { const { threats, enemy, player, bounds } = (window as any).__threat; threats.update([enemy(2, -300, 0, { type: 'spitter' })], player, bounds, [{ x: -150, y: 0, kind: 'hazard', request: { angle: Math.PI, speed: 260 } }]); });
        expect((await markers(page))[0]).toMatchObject({ attacking: 'false', inFlight: 'false' });
        await page.evaluate(() => { const { threats, enemy, player, bounds } = (window as any).__threat; threats.update([enemy(2, -300, 0, { type: 'spitter', windupMs: 120 })], player, bounds, []); });
        expect((await markers(page))[0].attacking).toBe('true');
    }
    finally {
        await page.close();
    }
});
it('slides along the inset edge around measured chrome while retaining the enemy bearing and marine clearance', async () => {
    const page = await mountHud(1280, 900);
    try {
        await rig(page);
        await page.evaluate(() => { const { threats, enemy, player, bounds } = (window as any).__threat; threats.update([enemy(1, 300, -250)], player, bounds, []); });
        const result = await markers(page);
        expect(result).toHaveLength(1);
        expect(result[0].bearing).toBeCloseTo(Math.atan2(-250, 300));
        const clear = await page.evaluate(() => { const marker = document.querySelector('.threat-marker:not([hidden])')!.getBoundingClientRect(); const actor = (window as any).__threat.bounds; const overlap = (a: any, b: any) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top; return { actor: overlap(marker, actor), chrome: ['#status-hud', '#action-bar', '.vitals'].filter(s => overlap(marker, document.querySelector(s)!.getBoundingClientRect())) }; });
        expect(clear).toEqual({ actor: false, chrome: [] });
    }
    finally {
        await page.close();
    }
});
it('caps, prioritizes attacking directions and reuses every DOM node across bursts', async () => {
    const page = await mountHud(1280, 900);
    try {
        await rig(page);
        const evidence = await page.evaluate(() => { const { threats, enemy, player, bounds } = (window as any).__threat; const nodes = Array.from(document.querySelectorAll('.threat-marker')); for (let frame = 0; frame < 30; frame++) {
            const enemies = Array.from({ length: 40 }, (_, i) => { const a = i * Math.PI * 2 / 40; return enemy(i, Math.cos(a) * 900, Math.sin(a) * 900, { windupMs: i === 19 ? 100 : 0 }); });
            threats.update(enemies, player, bounds, []);
            threats.tick(.05);
        } return { nodes: document.querySelectorAll('.threat-marker').length, same: nodes.every((node, i) => node === document.querySelectorAll('.threat-marker')[i]), count: document.querySelectorAll('.threat-marker:not([hidden])').length, attacking: document.querySelectorAll('.threat-marker[data-attacking="true"]:not([hidden])').length }; });
        expect(evidence.nodes).toBe(8);
        expect(evidence.same).toBe(true);
        expect(evidence.count).toBeLessThanOrEqual(8);
        expect(evidence.attacking).toBeGreaterThan(0);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        expect(await page.locator('.threat-marker[data-attacking="true"]:not([hidden])').first().evaluate(el => getComputedStyle(el).animationName)).toBe('none');
        await page.evaluate(() => (window as any).__threat.threats.dispose());
        expect(await page.locator('.threat-marker,.damage-direction').count()).toBe(0);
    }
    finally {
        await page.close();
    }
});
it('never reuses a cached spitter bearing for source-less damage',async()=>{
    const page=await mountHud(1280,900);
    try{
      await rig(page);
      await page.evaluate(()=>{
        const {threats,player}=(window as any).__threat;
        threats.effect({type:'enemy-attack',id:8,family:'spitter',x:-200,y:10},player);
        threats.effect({type:'hurt',x:0,y:0},player);
      });
      expect(await page.locator('.damage-direction:not([hidden])').count()).toBe(0);
      await page.evaluate(()=>{const {threats,player}=(window as any).__threat;threats.effect({type:'hurt',x:0,y:0,sourceX:200,sourceY:0},player);});
      expect(await page.locator('.damage-direction:not([hidden])').count()).toBe(1);
      expect(await page.locator('.damage-direction:not([hidden])').getAttribute('style')).toContain('1.570796');
    }finally{await page.close();}
});
