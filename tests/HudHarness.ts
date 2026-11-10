import { readFileSync } from 'node:fs';
import { chromium, type Browser, type Page } from 'playwright';
import { createServer, type ViteDevServer } from 'vite';
import ts from 'typescript';
let browser: Browser, server: ViteDevServer, origin: string;
/** Real shell/styles + production registration, without WebGL or simulation. */
export async function startHudHarness() {
    server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
    await server.listen();
    origin = `http://127.0.0.1:${(server.httpServer!.address() as {
        port: number;
    }).port}`;
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, args: ['--no-sandbox', '--disable-gpu', '--disable-webgl'] });
}
export async function stopHudHarness() { await browser?.close(); await server?.close(); }
export const hudCopy = { health: '100', armor: '50', 'depth-label': 'ENGINEERING · 12 / 20', 'room-name': 'Safety-interlock station', credits: '1250 CR', 'encounter-count': '26 remaining', 'story-status': 'New Earth warned · Passengers alive · Purge kills everyone · AI knew before awakening', 'room-objective': 'Clear the interlock station. Review the pre-awakening safety record.', 'story-line': 'LOCAL RECORD, BEFORE AWAKENING: Rescue impossible. AI acknowledged. Survival promise issued afterward.', 'weapon-name': 'SHOTGUN', magazine: '08', reserve: '/ 21', 'reload-label': 'RELOADING', 'boss-phase': 'ARMORED · 12s' };
export async function mountHud(width: number, height: number): Promise<Page> {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.route('**/__hud-test', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><link rel="stylesheet" href="/src/style.css"><link rel="stylesheet" href="/src/ui/styles/hud.css"></head><body data-state="playing"><div id="app"></div></body></html>' }));
    await page.goto(origin + '/__hud-test');
    await page.evaluate(async (copy) => {
        const load = new Function('path', 'return import(path)') as (p: string) => Promise<any>;
        const shell = await load('/src/ui/shell.ts');
        shell.mountShell();
        const layout = await load('/src/HudLayout.ts');
        (window as any).__place = layout.positionHudPanels;
        (window as any).__invalidate = layout.invalidateHudLayout;
        (window as any).__weapon = await load('/src/WeaponHud.ts');
        (window as any).__actions = [];
        for (const id of ['hud', 'story-hud'])
            document.getElementById(id)!.hidden = false;
        for (const [id, text] of Object.entries(copy))
            document.getElementById(id)!.textContent = text;
        document.getElementById('build-strip')!.innerHTML = ['Kinetic', 'Cryo', 'Reactor', 'Recovery'].map(f => `<span class="boon-group"><span>${f}</span><b>4</b><span class="boon-set">◆ SET</span></span>`).join('');
    }, hudCopy);
    await page.evaluate(() => document.fonts.ready);
    const application = readFileSync(new URL('../src/ui/application.ts', import.meta.url), 'utf8');
    const start = application.indexOf("captureWeaponPointer(el('pause')");
    const registration = application.slice(start, application.indexOf('// END HUD INPUT'));
    if (start < 0 || !registration.includes("el('skip-story').addEventListener"))
        throw new Error('HUD production registration moved: update harness explicitly.');
    const listeners = ts.transpileModule(`
 const el=(id:string)=>document.getElementById(id)!;
 const captureWeaponPointer=(window as any).__weapon.captureWeaponPointer;
 const game={roomRevision:1,switchWeapon:(id:string)=>{(window as any).__actions.push(id);},skipStory:()=>{(window as any).__actions.push('skip');}};
 const roomRecovering=false,lastRoom=1,renderer={roomLoading:false},graphicsLost=false;
 const pause=()=>{(window as any).__actions.push('pause');};const hud=()=>{};
 ${registration}`, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
    await page.addScriptTag({ content: listeners });
    return page;
}
export const overlap = (a: {
    left: number;
    top: number;
    right: number;
    bottom: number;
}, b: typeof a) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
export async function inspectHud(page: Page, x: number, y: number, height = 80) {
    return page.evaluate(({ x, y, height }) => {
        const actor = { left: x - 27, right: x + 27, top: y - height / 2, bottom: y + height / 2 };
        const selectors = ['.vitals', '.room-label', '#pause', '#build-strip', '#run-stock', '#story-hud', '.weapon-hud', '#weapon-picker', '.desktop-hint', ...(!document.getElementById('boss-hud')!.hidden ? ['#boss-hud'] : [])];
        (window as any).__invalidate();
        const frames: any[] = [];
        for (let i = 0; i < 8; i++) {
            const success = (window as any).__place(actor, innerWidth, innerHeight);
            const boxes = Object.fromEntries(selectors.map(s => [s, document.querySelector(s)!.getBoundingClientRect().toJSON()]));
            const overlap = (a: any, b: any) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
            const pairs: string[] = [];
            for (let a = 0; a < selectors.length; a++)
                for (let b = a + 1; b < selectors.length; b++)
                    if (overlap(boxes[selectors[a]], boxes[selectors[b]]) > 0)
                        pairs.push(selectors[a] + ' / ' + selectors[b]);
            const actorHits = selectors.filter(s => overlap(boxes[s], actor) > 0);
            const invalid = selectors.filter(s => { const b = boxes[s], el = document.querySelector(s)!; return !el.getClientRects().length || getComputedStyle(el).visibility === 'hidden' || b.width <= 0 || b.height <= 0 || b.left < 0 || b.top < 0 || b.right > innerWidth + .01 || b.bottom > innerHeight + .01; });
            frames.push({ success, boxes, pairs, actorHits, invalid });
        }
        const passThrough: string[] = [];
        for (const s of ['.vitals', '.room-label', '#build-strip', '#run-stock', '.weapon-hud', '.desktop-hint', '#story-status', '#room-objective']) {
            const r = document.querySelector(s)!.getBoundingClientRect();
            const hit = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
            if (hit?.id !== 'world')
                passThrough.push(s + ' -> ' + (hit?.id || hit?.tagName));
        }
        const skip = document.getElementById('skip-story')!, sr = skip.getBoundingClientRect(), story = document.getElementById('story-hud')!.getBoundingClientRect();
        const skipAccessible = document.getElementById('story-presentation')!.hidden || (sr.width > 0 && sr.height > 0 && sr.left >= story.left && sr.right <= story.right + .01 && sr.top >= story.top && sr.bottom <= story.bottom + .01 && document.elementFromPoint((sr.left + sr.right) / 2, (sr.top + sr.bottom) / 2) === skip);
        return { frames, passThrough, skipAccessible };
    }, { x, y, height });
}
