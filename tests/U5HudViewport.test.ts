import {afterAll, beforeAll, expect, it} from 'vitest';
import type {Page} from 'playwright';
import {mountHud, startHudHarness, stopHudHarness} from './HudHarness';

beforeAll(startHudHarness);
afterAll(stopHudHarness);

async function liveHud(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const load = new Function('path','return import(path)');
    const {DepthGame} = await load('/src/DepthGame.ts');
    const {createHud} = await load('/src/ui/hud/Hud.ts');
    const adapter = await load('/src/ui/gameAdapter.ts');
    const fixtures = await load('/src/ui/fixtures.ts');
    const layout = await load('/src/ui/hud/layout.ts');
    const game = new DepthGame(() => {}); game.status = 'playing';
    adapter.setUiFixture(game,{abilities:fixtures.abilityFixture('cryo','cooling')});
    const receipts: unknown[] = [];
    const point = {x:innerWidth/2,y:innerHeight/2};
    const renderer = {
      canvas:document.getElementById('world'),
      playerScreenBounds:() => ({left:innerWidth/2-27,right:innerWidth/2+27,top:innerHeight/2-70,bottom:innerHeight/2+70}),
      worldToScreen:() => point,
      setHudInsets:(insets:unknown) => receipts.push(insets),
    };
    const hud = createHud(game,renderer,() => layout.positionHudPanels(renderer.playerScreenBounds(),innerWidth,innerHeight),() => ({combatText:true,radar:true}));
    (window as any).__u5 = {game,hud,renderer,receipts,point,layout}; hud();
  });
}

it('reserves measured desktop HUD edges and keeps a shallow translucent dock through resize', async () => {
  const page = await mountHud(1920,1080);
  try {
    await liveHud(page);
    for (const [width,height,maximum] of [[1920,1080,96],[1280,720,80]]) {
      await page.setViewportSize({width,height});
      const result = await page.evaluate(() => {
        const {hud,receipts,renderer} = (window as any).__u5; hud();
        const bar = document.getElementById('action-bar')!;
        const box = bar.getBoundingClientRect();
        const count = receipts.length; hud();
        return {height:box.height,background:getComputedStyle(bar).backgroundImage,insets:receipts.at(-1),stable:receipts.length===count,marine:renderer.playerScreenBounds(),box:box.toJSON()};
      });
      expect(result.height).toBeLessThanOrEqual(maximum);
      expect(result.background).toContain('rgba(');
      expect(result.insets.bottom).toBeGreaterThanOrEqual(result.height);
      expect(result.insets.right).toBeGreaterThan(100);
      expect(result.stable).toBe(true);
      expect(result.box.top).toBeGreaterThan(result.marine.bottom);
    }
    await page.evaluate(() => {const {game,hud}=(window as any).__u5;game.status='paused';hud();});
    expect(await page.evaluate(() => (window as any).__u5.receipts.at(-1))).toEqual({top:0,right:0,bottom:0,left:0});
  } finally {await page.close();}
});

it('lets real contacts and hostile warning footprints show through each panel with passive danger edges', async () => {
  const page = await mountHud(1280,720);
  try {
    await liveHud(page);
    await page.evaluate(() => {const {game}=(window as any).__u5;game.enemies.reset();game.enemies.spawn('crawler',200,200);});
    for (const selector of ['#action-bar','.vitals','#status-hud','#radar-hud']) {
      await page.evaluate(selector => {
        const {hud,point}=(window as any).__u5;
        const box=document.querySelector(selector)!.getBoundingClientRect();point.x=box.left+box.width/2;point.y=box.top+box.height/2;hud();
      }, selector);
      expect(await page.locator(selector).getAttribute('data-obscures-threat')).toBe('true');
      await page.waitForTimeout(180);
      expect(Number(await page.locator(selector).evaluate(node=>getComputedStyle(node).opacity))).toBeLessThanOrEqual(.36);
      const marker = page.locator(`.hud-panel-threat[data-panel='${selector==='.vitals'?'vitals':selector.slice(1)}']`);
      expect(await marker.isVisible()).toBe(true);
      expect(await marker.evaluate(node=>getComputedStyle(node).pointerEvents)).toBe('none');
    }
    await page.evaluate(() => {
      const {game,hud,point}=(window as any).__u5;game.enemies.reset();
      const box=document.getElementById('action-bar')!.getBoundingClientRect();point.x=box.left+box.width/2;point.y=box.top+box.height/2;
      hud.effect({type:'enemy-warning',x:200,y:200,durationMs:600,radius:32});hud();
    });
    expect(await page.locator('#action-bar').getAttribute('data-obscures-threat')).toBe('true');
    await page.evaluate(() => {const {hud}=(window as any).__u5;for(let i=0;i<7;i++)hud.tick(.1);hud();});
    expect(await page.locator('#action-bar').getAttribute('data-obscures-threat')).toBe('false');
    await page.evaluate(() => (window as any).__u5.hud.dispose());
    expect(await page.locator('.hud-panel-threat').count()).toBe(0);
    expect(await page.evaluate(() => (window as any).__u5.receipts.at(-1))).toEqual({top:0,right:0,bottom:0,left:0});
  } finally {await page.close();}
});
