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
    const resized = await page.evaluate(async () => {
      const {hud,receipts} = (window as any).__u5;
      await new Promise(requestAnimationFrame); hud();
      const before=receipts.at(-1).bottom;
      document.getElementById('action-bar')!.style.height='70px';
      await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); hud();
      return {before,after:receipts.at(-1).bottom};
    });
    expect(resized.after).toBeLessThan(resized.before);
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
      const faded = await page.locator(selector).evaluate(node=>({opacity:getComputedStyle(node).opacity,background:getComputedStyle(node).backgroundColor}));
      expect(faded.opacity).toBe('1');
      expect(faded.background).toBe('rgba(7, 17, 24, 0.094)');
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


it('reserves a top-right status column on its anchored right edge rather than its shorter dimension', async () => {
  const page = await mountHud(1920,1080);
  try {
    await liveHud(page);
    const result = await page.evaluate(() => {
      const {hud,receipts,layout}=(window as any).__u5;
      const status=document.getElementById('status-hud')!;
      status.style.width='260px';status.style.height='210px';
      layout.invalidateHudLayout();hud();
      const column=status.getBoundingClientRect(),vitals=document.querySelector('.vitals')!.getBoundingClientRect();
      return {insets:receipts.at(-1),right:Math.ceil(innerWidth-column.left+8),top:Math.ceil(vitals.bottom+8),columnBottom:column.bottom};
    });
    expect(result.insets.right).toBeGreaterThanOrEqual(result.right);
    expect(result.insets.top).toBe(result.top);
    expect(result.insets.top).toBeLessThan(result.columnBottom);
  } finally {await page.close();}
});

it('fades a panel when tall enemy anatomy overlaps even while its center projection is clear', async () => {
  const page = await mountHud(1280,720);
  try {
    await liveHud(page);
    const result = await page.evaluate(() => {
      const {game,hud,renderer,point}=(window as any).__u5;
      game.enemies.reset();game.enemies.spawn('spitter',200,200);
      point.x=innerWidth/2;point.y=innerHeight/2;
      let bodyVisible=false;
      const outputs = new Set<unknown>();
      const calls: {id:number;x:number;y:number;radius:number;context:boolean}[]=[];
      renderer.actorScreenBounds=function(id:number,x:number,y:number,radius:number,out:{left:number;right:number;top:number;bottom:number}) {
        outputs.add(out);calls.push({id,x,y,radius,context:this===renderer});
        if(!bodyVisible)return false;
        const panel=document.getElementById('status-hud')!.getBoundingClientRect();
        // The head/crest enters the panel while the old center/radius proxy remains in clear space.
        out.left=panel.left+10;out.right=panel.right-10;out.top=panel.bottom-14;out.bottom=point.y+20;
        return true;
      };
      hud();
      const panel=document.getElementById('status-hud')!,box=panel.getBoundingClientRect();
      const withoutBody=panel.dataset.obscuresThreat;
      bodyVisible=true;for(let frame=0;frame<100;frame++)hud();
      return {withoutBody,withBody:panel.dataset.obscuresThreat,centerClear:point.x+24<box.left||point.x-24>box.right||point.y+24<box.top||point.y-24>box.bottom,outputs:outputs.size,calls};
    });
    expect(result.centerClear).toBe(true);
    expect(result.withoutBody).toBe('false');
    expect(result.withBody).toBe('true');
    // Panel fading and edge warnings each reuse their one projection scratch.
    expect(result.outputs).toBe(2);
    expect(result.calls.every(call=>call.context&&call.x===200&&call.y===200&&call.radius>0)).toBe(true);
    await page.waitForTimeout(180);
    expect(await page.locator('#status-hud').evaluate(node=>getComputedStyle(node).backgroundColor)).toBe('rgba(7, 17, 24, 0.094)');
    expect(await page.locator(".hud-panel-threat[data-panel='status-hud']").isVisible()).toBe(true);
    await page.evaluate(() => {
      const {game,hud,renderer}=(window as any).__u5;
      game.enemies.reset();
      const boss={...game.boss.snapshot,active:true,x:220,y:210};
      Object.defineProperty(game.boss,'snapshot',{configurable:true,get:()=>boss});
      renderer.actorScreenBounds=function(id:number,x:number,y:number,radius:number,out:{left:number;right:number;top:number;bottom:number}) {
        if(id!==-1||x!==220||y!==210||radius!==92)throw Error('Queen body bounds did not use the public projection hook');
        const panel=document.getElementById('status-hud')!.getBoundingClientRect();
        out.left=panel.left+10;out.right=panel.right-10;out.top=panel.bottom-14;out.bottom=panel.bottom+50;return true;
      };
      hud();
    });
    expect(await page.locator('#status-hud').getAttribute('data-obscures-threat')).toBe('true');
  } finally {await page.close();}
});


it.each([[1920,1080],[1280,720]])('keeps every critical value on an opaque contrast chip while all panels yield at %i × %i', async (width,height) => {
  const page=await mountHud(width,height);
  try {
    await liveHud(page);
    for(const state of ['ready','cooling','casting','denied','overdrive']) {
      await page.evaluate(async state=>{
        const load=new Function('path','return import(path)');
        const {setUiFixture}=await load('/src/ui/gameAdapter.ts');
        const {abilityFixture}=await load('/src/ui/fixtures.ts');
        const {game,hud}=(window as any).__u5;
        setUiFixture(game,{abilities:abilityFixture('cryo',state)});hud();
        document.getElementById('reload-label')!.textContent='RELOADING';
        for(const panel of document.querySelectorAll('.vitals,#action-bar,#status-hud,#radar-hud')) (panel as HTMLElement).dataset.obscuresThreat='true';
      },state);
      await page.waitForTimeout(180);
      const rows=await page.locator('[data-hud-critical],[data-ability][data-state=ready] .ability-icon').evaluateAll(nodes=>{
        const rgb=(s:string)=>s.match(/[\d.]+/g)!.map(Number);
        const luminance=(rgb:number[])=>rgb.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
        return nodes.filter(node=>node.getClientRects().length&&(node.textContent?.trim()||node.matches('.ability-icon'))).map(node=>{
          const style=getComputedStyle(node),fg=rgb(style.color),bg=rgb(style.backgroundColor);
          let opacity=1;for(let ancestor:Element|null=node;ancestor;ancestor=ancestor.parentElement)opacity*=Number(getComputedStyle(ancestor).opacity);
          const a=luminance(fg),b=luminance(bg);
          return {name:node.id||node.textContent||'ready glyph',contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),alpha:bg[3]??1,opacity};
        });
      });
      expect(rows.length).toBeGreaterThanOrEqual(16);
      for(const row of rows){expect(row.contrast,row.name!).toBeGreaterThanOrEqual(4.5);expect(row.alpha,row.name!).toBe(1);expect(row.opacity,row.name!).toBe(1);}
    }
  } finally {await page.close();}
});
