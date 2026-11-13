import { GRAPHICS_OPTION_LABELS } from '../src/render/graphicsOptions';
import {uiCss} from './uiSource';
import {afterAll, beforeAll, expect, test} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
import {chromium, type Browser, type Page} from 'playwright';

// Native Chromium DOM tests run the actual screen controller, without WebGL/game simulation.
let browser: Browser;
let controller: string;
let css: string;
const root=fileURLToPath(new URL('../',import.meta.url));
const entry='\0containment-ui-screen-tests';
beforeAll(async()=>{
  const output=await build({
    configFile:false, logLevel:'silent',
    plugins:[{
      name:'ui-screen-test-entry',
      resolveId(id) {if(id===entry) return entry;},
      load(id) {
        if(id!==entry) return;
        return `import {createScreens} from ${JSON.stringify(root+'src/ui/screens/ScreenManager.ts')};
          import {createSettings} from ${JSON.stringify(root+'src/ui/settings.ts')};
          import {setUiFixture} from ${JSON.stringify(root+'src/ui/gameAdapter.ts')};
          import {generateRun} from ${JSON.stringify(root+'src/game/roguelike/run.ts')};
          import {RunStats} from ${JSON.stringify(root+'src/game/abilities/RunStats.ts')};
          import {abilityFixture} from ${JSON.stringify(root+'src/ui/fixtures.ts')};
          import {AUGMENT_BOONS} from ${JSON.stringify(root+'src/game/abilities/augmentCatalog.ts')};
          import {draftScreen} from ${JSON.stringify(root+'src/ui/screens/templates.ts')};
          import {createExpedition} from ${JSON.stringify(root+'src/game/roguelike/expedition.ts')};
          window.screenTestApi={createSettings,createScreens,setUiFixture,generateRun,createExpedition,RunStats,abilityFixture,AUGMENT_BOONS,draftScreen};`;
      },
    }],
    build:{write:false,minify:false,rollupOptions:{input:entry,output:{format:'iife'}},target:'es2022'},
  });
  const chunks=Array.isArray(output)?output:[output];
  controller=chunks.flatMap(value=>'output' in value?value.output:[]).filter(value=>value.type==='chunk').map(value=>(value as {code:string}).code).join('\n');
  css=uiCss;
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-webgl']});
},30_000);
afterAll(async()=>{await browser?.close();});

async function mount(width=1280,height=720): Promise<Page> {
  const page=await browser.newPage({viewport:{width,height}});
  await page.setContent(`<style>${css}</style><div id="app"><div id="hud"><span id="credits">785 CR</span></div><div id="room-loading"></div><div id="signature"></div><div id="shade"></div><div id="overlay"></div></div>`);
  await page.evaluate(()=>document.fonts.ready);
  await page.addScriptTag({content:controller});
  await page.evaluate(()=>{
    const api=(window as any).screenTestApi;
    const actions: string[]=[];
    const ammo=Object.fromEntries(['pistol','rifle','shotgun','plasma','rocket'].map(id=>[id,{magazine:0,reserve:0}]));
    const resources={health:100,armor:50,credits:500,grenades:2,medkits:2,weapon:'pistol',ammo};
    const expedition=api.createExpedition(1729,resources);
    const game: any={
      status:'menu', expedition, node:api.generateRun(1729,3).nodes[0],
      combat:{snapshot:resources},abilities:{snapshot:api.abilityFixture('breacher','ready')},stats:new api.RunStats().snapshot,canContinue:true,storyRoom:null,storyStatus:'Original story status',
      checkpointStatus:'saved',checkpointWarning:'',checkpointNote:'Checkpoint saved.',
      chooseMutation(id:string) {actions.push('boon:'+id);},
      chooseRig(id:string) {actions.push('rig:'+id);return true;},
      reroll() {actions.push('reroll');return true;},
      route(id:string) {actions.push('route:'+id);},
      claimResources(id?:string) {actions.push('supplies:'+(id??'standard'));},
      authorizeDestruction() {actions.push('destroy');return true;},
      menu() {game.status='menu';},
    };
    const audio={pauseAll(){},resumeAll(){},playUI(){},setMasterVolume(){},setMusicVolume(){},setEffectsVolume(){},unlock:()=>Promise.resolve()};
    const renderer={qualityTier:'high',setQuality(){}};
    let lost=false;
    const settings=api.createSettings({renderer,audio,storage:null});
    const screens=api.createScreens({game,renderer,settings,input:{reset(){}},audio,confirmation:{clear(){}},storage:null,pause:()=>actions.push('resume'),start:()=>actions.push('start'),graphicsLost:()=>lost,recovering:()=>false});
    (window as any).ui={api,game,renderer,screens,actions,setLost(value:boolean){lost=value;},phase(status:string,depth=0,version=3){
      const graph=api.generateRun(1729,version);
      const node=graph.nodes.find((value:any)=>value.depth===depth);
      const completed=graph.nodes.filter((value:any)=>value.depth<depth).map((value:any)=>value.id);
      if(['reward','route','complete'].includes(status)&&!(status==='reward'&&depth===0)) completed.push(node.id);
      game.node=node;
      game.expedition={...game.expedition,run:{version,seed:1729,currentNodeId:node.id,completedNodeIds:completed,phase:status==='menu'?'combat':status==='paused'?'combat':status==='reward'&&depth===0?'starting-boon':status,draftRoll:0}};
      game.status=status;
      api.setUiFixture(game,null);
      screens.syncScreen(true);
    }};
    screens.syncScreen();
  });
  return page;
}

async function phase(page:Page,status:string,depth=0,version=3) {
  await page.evaluate(({status,depth,version})=>(window as any).ui.phase(status,depth,version),{status,depth,version});
}

test('title uses native actions and settings input never triggers menu shortcuts',async()=>{
  const page=await mount();
  try {
    expect(await page.locator('h1').getAttribute('aria-label')).toBe('Containment Depth');
    await page.locator('#start').click();
    expect(await page.evaluate(()=>(window as any).ui.actions)).toEqual(['start']);
    await page.locator('#settings').click();
    await page.locator('#master-volume').focus();
    await page.keyboard.press('r');
    expect(await page.evaluate(()=>(window as any).ui.actions)).toEqual(['start']);
    await page.locator('#menu-credits').click();
    expect(await page.locator('.credits-drawer').count()).toBe(1);
  } finally {await page.close();}
});

test('title Credits opens independently of the real HUD credit counter and both close actions return focus',async()=>{
  // mount includes the production HUD #credits before the title controller binds native actions.
  const page=await mount();
  try {
    expect(await page.locator('#credits').count()).toBe(1);
    expect(await page.locator('#hud #credits').textContent()).toBe('785 CR');
    await page.locator('#menu-credits').click();
    expect(await page.locator('.credits-drawer').isVisible()).toBe(true);
    expect(await page.locator('#credits').count()).toBe(1);
    expect(await page.locator('#hud #credits').textContent()).toBe('785 CR');
    await page.locator('#close-drawer').click();
    expect(await page.locator('.credits-drawer').count()).toBe(0);
    expect(await page.evaluate(()=>document.activeElement?.id)).toBe('menu-credits');
    await page.locator('#menu-credits').click();
    expect(await page.locator('.credits-drawer').isVisible()).toBe(true);
    await page.locator('#close-credits').click();
    expect(await page.locator('.credits-drawer').count()).toBe(0);
    expect(await page.evaluate(()=>document.activeElement?.id)).toBe('menu-credits');
    expect(await page.locator('#hud #credits').textContent()).toBe('785 CR');
  } finally {await page.close();}
});

test('rig selection is catalog-driven, keyboard navigable, and dispatches the public action once',async()=>{
  const page=await mount();
  try {
    await page.evaluate(()=>{const ui=(window as any).ui;ui.api.setUiFixture(ui.game,{phase:'rig-select'});ui.screens.syncScreen();});
    expect(await page.locator('body').getAttribute('data-state')).toBe('rig-select');
    expect(await page.locator('[data-rig]').count()).toBe(4);
    await page.keyboard.press('3');
    expect(await page.locator('[data-rig="pyro"]').getAttribute('aria-pressed')).toBe('true');
    expect(await page.locator('.ability-detail h3').allTextContents()).toEqual(['Afterburn','Flashfire','Napalm Charge','Meltdown']);
    await page.keyboard.press('Enter');
    expect(await page.evaluate(()=>(window as any).ui.actions)).toEqual(['rig:pyro']);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    expect(await page.evaluate(()=>(window as any).ui.actions)).toEqual(['rig:pyro','rig:arc']);
    await page.evaluate(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'1',repeat:true,bubbles:true})));
    expect(await page.locator('[data-rig="arc"]').getAttribute('aria-pressed')).toBe('true');
  } finally {await page.close();}
});

test.each([[1280,720],[1920,1080]])('all four rigs retain element accents and a visible footnote at %i × %i',async(width,height)=>{
  const page=await mount(width,height);
  try {
    await page.evaluate(()=>{const ui=(window as any).ui;ui.api.setUiFixture(ui.game,{phase:'rig-select'});ui.screens.syncScreen();});
    for(const [rig,element] of [['breacher','kinetic'],['cryo','cryo'],['pyro','pyro'],['arc','arc']]) {
      await page.locator(`[data-rig="${rig}"]`).click();
      expect(await page.locator('.rig-panel').getAttribute('data-element')).toBe(element);
      expect(await page.locator(`[data-rig="${rig}"] .rig-profile`).getAttribute('aria-label')).toContain('Control');
      const footer=await page.locator('.rig-footnote').boundingBox();
      expect(footer!.y).toBeGreaterThanOrEqual(0);
      expect(footer!.y+footer!.height).toBeLessThanOrEqual(height);
      const manifest=await page.locator('.rig-panel>.ability-preview').evaluate(element=>({height:element.clientHeight,scroll:element.scrollHeight,overflow:getComputedStyle(element).overflowY}));
      expect(manifest.height).toBeGreaterThan(70);
      if(manifest.scroll>manifest.height) expect(manifest.overflow).toBe('auto');
    }
  } finally {await page.close();}
});

test('boon number and reroll keys dispatch offered native controls once, including repeat guard',async()=>{
  const page=await mount();
  try {
    await phase(page,'reward');
    expect(await page.locator('[data-mutation]').count()).toBe(3);
    const id=await page.locator('[data-mutation]').nth(1).getAttribute('data-mutation');
    await page.keyboard.press('2');
    await page.keyboard.press('r');
    await page.evaluate(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'r',repeat:true,bubbles:true})));
    expect(await page.evaluate(()=>(window as any).ui.actions)).toEqual(['boon:'+id,'reroll']);
  } finally {await page.close();}
});

test('held gameplay fire cannot accept a newly arrived reward, route or debrief',async()=>{
  const page=await mount();
  try {
    for(const status of ['reward','route','dead','complete']) {
      await phase(page,status);
      await page.keyboard.down('Space');
      await page.keyboard.press('g');
      await page.keyboard.press('Escape');
      await page.keyboard.up('Space');
      await page.keyboard.press('Enter');
      expect(await page.evaluate(()=>(window as any).ui.actions)).toEqual([]);
    }
    await phase(page,'reward');
    await page.locator('[data-mutation]').first().focus();
    await page.keyboard.press('Space');
    expect(await page.evaluate(()=>(window as any).ui.actions.length)).toBe(1);
  } finally {await page.close();}
});

test('all pause tabs preserve Resume, use accessible arrow navigation, and hold graphics recovery',async()=>{
  const page=await mount();
  try {
    await phase(page,'paused');
    await page.locator('[data-pause-tab="loadout"]').click();
    expect(await page.locator('#resume').isVisible()).toBe(true);
    await page.keyboard.press('ArrowRight');
    expect(await page.locator('[data-pause-tab="settings"]').getAttribute('aria-selected')).toBe('true');
    expect(await page.locator('#quality').count()).toBe(1);
    await page.keyboard.press('End');
    expect(await page.locator('[data-pause-tab="controls"]').getAttribute('aria-selected')).toBe('true');
    expect(await page.locator('.controls-reference').innerText()).toContain('Overdrive');
    await page.evaluate(()=>{const ui=(window as any).ui;ui.setLost(true);ui.screens.syncScreen();});
    expect(await page.locator('#resume').count()).toBe(0);
    expect(await page.locator('#graphics-continue').isDisabled()).toBe(true);
    expect(await page.locator('#hud').getAttribute('inert')).not.toBeNull();
    expect(await page.locator('h2').innerText()).toBe('Restoring graphics…');
  } finally {await page.close();}
});

test.each([[1280,720],[1920,1080]])('long loadouts fit the pause console while Resume stays visible at %i × %i',async(width,height)=>{
  const page=await mount(width,height);
  try {
    await page.evaluate(()=>{
      const ui=(window as any).ui;
      ui.game.expedition={...ui.game.expedition,build:{mutations:['incendiary','breacher','cryogenic','permafrost','arc-filament','pressure-point','heavy-pellets','absolute-zero']}};
    });
    await phase(page,'paused');
    await page.locator('[data-pause-tab=loadout]').click();
    const content=await page.locator('#pause-tabpanel').evaluate(element=>({scroll:element.scrollHeight,height:element.clientHeight,overflow:getComputedStyle(element).overflowY}));
    expect(content.scroll).toBeLessThanOrEqual(content.height+1);
    expect(content.overflow).not.toBe('auto');
    await page.locator('.owned-boon').first().focus();
    expect(await page.locator('.owned-boon').first().locator('.boon-tooltip').isVisible()).toBe(true);
    const resume=await page.locator('#resume').boundingBox();
    expect(resume!.y).toBeGreaterThanOrEqual(0);
    expect(resume!.y+resume!.height).toBeLessThanOrEqual(height);
    await page.locator('#resume').click();
    expect(await page.evaluate(()=>(window as any).ui.actions)).toEqual(['resume']);
  } finally {await page.close();}
});

test('checkpoint warnings remain visible on every noncombat screen and cache follows warning changes',async()=>{
  const page=await mount();
  try {
    for(const [status,depth] of [['menu',0],['reward',0],['reward',3],['route',0],['route',18],['dead',0],['complete',19]] as const) {
      await page.evaluate(()=>{const ui=(window as any).ui;ui.game.checkpointWarning='Checkpoint storage unavailable.';});
      await phase(page,status,depth);
      expect(await page.locator('.save-note').innerText()).toBe('Checkpoint storage unavailable.');
      await page.evaluate(()=>{const ui=(window as any).ui;ui.game.checkpointWarning='Checkpoint deletion failed.';ui.screens.syncScreen();});
      expect(await page.locator('.save-note').innerText()).toBe('Checkpoint deletion failed.');
    }
    await phase(page,'paused');
    expect(await page.locator('.save-note').innerText()).toBe('Checkpoint saved.');
    await page.evaluate(()=>{const ui=(window as any).ui;ui.game.checkpointNote='Checkpoint storage unavailable.';ui.screens.syncScreen();});
    expect(await page.locator('.save-note').innerText()).toBe('Checkpoint storage unavailable.');
  } finally {await page.close();}
});

test('destruction retains exact consent and has no screen-level Enter or numeric shortcut',async()=>{
  const page=await mount();
  try {
    await phase(page,'route',18);
    expect(await page.locator('h2').innerText()).toBe('Destroy the ship?');
    expect(await page.locator('.panel-intro').innerText()).toBe('The passengers are alive. Overload will kill them and you. New Earth has received the warning.');
    await page.locator('body').click({position:{x:10,y:10}});
    await page.keyboard.press('Enter');
    await page.keyboard.press('1');
    expect(await page.evaluate(()=>(window as any).ui.actions)).toEqual([]);
    await page.locator('#destroy-ship').click();
    expect(await page.evaluate(()=>(window as any).ui.actions)).toEqual(['destroy']);
  } finally {await page.close();}
});

test('deck map includes the actual full generated branching graph and rewards',async()=>{
  const page=await mount();
  try {
    await phase(page,'route',0,2);
    const ids=await page.locator('[data-node-id]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-node-id')));
    const expected=await page.evaluate(()=>(window as any).ui.api.generateRun(1729,2).nodes.map((node:any)=>node.id));
    expect(ids).toEqual(expected);
    expect(await page.locator('[data-map-state="current"]').count()).toBe(1);
    expect(await page.locator('[data-map-state="available"]').count()).toBe(2);
    expect(await page.locator('.deck-node[data-inspect-route]').count()).toBe(2);
    expect(await page.locator('[data-route]').count()).toBe(1);
    expect(await page.locator('.deck-connections path').count()).toBeGreaterThan(12);
  } finally {await page.close();}
});

test('debrief renders nested authoritative counters, source totals and accuracy, and refreshes changes',async()=>{
  const page=await mount();
  try {
    await page.evaluate(()=>{
      const ui=(window as any).ui,stats=new ui.api.RunStats();
      stats.recordKill('crawler');stats.recordKill('brute');
      stats.recordDamage('weapon',1234);stats.recordDamage('ability',345);
      stats.recordDamage('status',67);stats.recordDamage('boon',89);
      stats.recordDamageTaken(42);stats.recordShot(true);stats.recordShot(false);
      stats.recordAbilityUse('tactical');stats.recordAbilityUse('overdrive');
      stats.recordCredits(76);stats.enterRoom('1729:v3-r0');stats.update(125000);
      ui.game.stats=stats.snapshot;
    });
    await phase(page,'dead');
    expect(await page.locator('.result-details').getAttribute('open')).toBeNull();
    expect(await page.locator('.incoming-report').isVisible()).toBe(true);
    await page.locator('.result-details>summary').click();
    expect(await page.locator('.hero-stats>div').count()).toBe(4);
    expect(await page.locator('[data-stat]').count()).toBe(16);
    expect(await page.locator('.damage-source-bar i').count()).toBe(4);
    expect(await page.locator('.result-panel').evaluate(node=>node.scrollHeight<=node.clientHeight+1)).toBe(true);
    expect(await page.locator('.result-actions').evaluate(node=>node.getBoundingClientRect().bottom<=innerHeight)).toBe(true);
    expect(await page.locator('.damage-source-legend [data-stat] b').evaluateAll(nodes=>nodes.every(node=>getComputedStyle(node).color==='rgb(240, 251, 255)'))).toBe(true);
    expect(await page.locator('.debrief-build').isVisible()).toBe(true);
    expect(await page.locator('[data-stat=kills] b').innerText()).toBe('2');
    expect(await page.locator('[data-stat=weapon] b').innerText()).toBe('1,234');
    expect(await page.locator('[data-stat=ability] b').innerText()).toBe('345');
    expect(await page.locator('[data-stat=status] b').innerText()).toBe('67');
    expect(await page.locator('[data-stat=boon] b').innerText()).toBe('89');
    expect(await page.locator('[data-stat=damage] b').innerText()).toBe('1,735');
    expect(await page.locator('[data-stat=accuracy] b').innerText()).toBe('50%');
    expect(await page.locator('[data-stat=uses] b').innerText()).toBe('2');
    expect(await page.locator('[data-stat=uses] .stat-detail').innerText()).toContain('Q 1');
    expect(await page.locator('[data-stat=overdrives] b').innerText()).toBe('1');
    expect(await page.locator('[data-stat=taken] b').innerText()).toBe('42');
    expect(await page.locator('[data-stat=time] b').innerText()).toBe('2:05');
    expect(await page.locator('[data-stat=credits] b').innerText()).toBe('76');
    await page.evaluate(()=>{const ui=(window as any).ui;ui.game.stats={...ui.game.stats,creditsEarned:78};ui.screens.syncScreen();});
    expect(await page.locator('[data-stat=credits] b').innerText()).toBe('78');
  } finally {await page.close();}
});

test('live loadout lists all catalog augments with dedicated glyphs and the four real rig rules',async()=>{
  const page=await mount();
  try {
    await page.evaluate(()=>{
      const ui=(window as any).ui;
      ui.game.abilities.snapshot=ui.api.abilityFixture('cryo','ready');
      ui.game.expedition={...ui.game.expedition,build:{rig:'cryo',mutations:Object.keys(ui.api.AUGMENT_BOONS)}};
    });
    await phase(page,'paused');
    await page.locator('[data-pause-tab=loadout]').click();
    expect(await page.locator('.ability-detail h3').evaluateAll(nodes=>nodes.map(node=>node.firstChild?.textContent))).toEqual(['Frost Trail','Cryo Nova','Glacier','Whiteout']);
    expect(await page.locator('.ability-augment-badge').count()).toBe(4);
    expect(await page.locator('.owned-boon[data-augment=true]').count()).toBe(12);
    const icons=await page.locator('.owned-boon').evaluateAll(nodes=>nodes.map(node=>({id:node.getAttribute('data-boon'),icon:node.querySelector('svg')?.getAttribute('data-icon')})));
    for(const entry of icons) expect(entry.icon).toBe(entry.id);
    expect(await page.locator('.owned-boon[data-boon=twin-glacier]').getAttribute('aria-label')).toContain('Cryo augment');
    expect(await page.locator('.owned-boon[data-boon=reserve-thruster]').getAttribute('aria-label')).toContain('Universal augment');
  } finally {await page.close();}
});

test('draft augments retain dedicated glyphs, rarity, matching rig identity and synergy rules',async()=>{
  const page=await mount();
  try {
    const evidence=await page.evaluate(()=>{
      const ui=(window as any).ui,seen=new Map();
      const doc=document.createElement('div');
      for(const rig of ['breacher','cryo','pyro','arc']) {
        for(let seed=1;seed<=1000;seed++) {
          const expedition=ui.api.createExpedition(seed,ui.game.combat.snapshot);
          ui.game.expedition={...expedition,build:{rig,mutations:['pressure-point']}};
          doc.innerHTML=ui.api.draftScreen(ui.game);
          for(const card of doc.querySelectorAll<HTMLElement>('[data-augment=true]')) {
            const id=card.dataset.mutation!,definition=ui.api.AUGMENT_BOONS[id];
            seen.set(id,{id,icon:card.querySelector('.boon-emblem')?.getAttribute('data-icon'),rig:card.dataset.augmentRig,
              family:card.dataset.family,rarity:card.querySelector('.boon-rarity')?.textContent?.trim(),hint:card.querySelector('.boon-hint')?.textContent,
              rigIcon:card.querySelector('.boon-path svg')?.getAttribute('data-icon'),expected:definition});
          }
        }
      }
      return [...seen.values()];
    });
    expect(evidence).toHaveLength(12);
    for(const entry of evidence) {
      expect(entry.icon).toBe(entry.id);
      expect(entry.rig).toBe(entry.expected.rig??'universal');
      expect(entry.rigIcon).toBe(entry.expected.rig??'loadout');
      expect(entry.family).toBe(entry.expected.family);
      expect(entry.rarity).toBe(entry.expected.rarity.toUpperCase());
      expect(entry.hint).toContain('augment');
    }
  } finally {await page.close();}
});

test.each([[1280,720],[1920,1080],[2560,1440]])('primary screen content fits the desktop viewport without an inner scroller at %i × %i',async(width,height)=>{
  const page=await mount(width,height);
  try {
    for(const [status,depth] of [['menu',0],['reward',0],['reward',3],['route',0],['paused',0],['dead',0]] as const) {
      await phase(page,status,depth);
      const layout=await page.locator('#overlay').evaluate(element=>{
        const panel=element.firstElementChild as HTMLElement;
        const rect=panel.getBoundingClientRect();
        return {width:rect.width,right:rect.right,bottom:rect.bottom,scrollWidth:panel.scrollWidth,clientWidth:panel.clientWidth,scrollHeight:panel.scrollHeight,clientHeight:panel.clientHeight,overflow:getComputedStyle(panel).overflowY};
      });
      expect(layout.right).toBeLessThanOrEqual(width+1);
      expect(layout.bottom).toBeLessThanOrEqual(height+1);
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth+1);
      expect(layout.scrollHeight).toBeLessThanOrEqual(layout.clientHeight+1);
    }
  } finally {await page.close();}
});

// The map previews choices without dispatching a route until a deliberate native action.
test('descent map arrow preview, numbered paths and Enter preserve actual route actions',async()=>{
  const page=await mount();
  try {
    await phase(page,'route',0,2);
    const choices=await page.evaluate(()=>(window as any).ui.game.node.next);
    await page.keyboard.press('ArrowRight');
    expect(await page.locator('[data-route]').getAttribute('data-route')).toBe(choices[1]);
    expect(await page.evaluate(()=>(window as any).ui.actions)).toEqual([]);
    await page.keyboard.press('Enter');
    expect(await page.evaluate(()=>(window as any).ui.actions)).toEqual(['route:'+choices[1]]);
    await phase(page,'route',0,2);
    await page.keyboard.press('1');
    expect(await page.evaluate(()=>(window as any).ui.actions)).toEqual(['route:'+choices[1],'route:'+choices[0]]);
    await phase(page,'route',0,3);
    expect(await page.locator('[data-node-id]').count()).toBe(20);
    const map=await page.locator('.deck-map').evaluate(node=>({width:node.clientWidth,scroll:node.scrollWidth,height:node.clientHeight,scrollHeight:node.scrollHeight}));
    expect(map.scroll).toBe(map.width);expect(map.scrollHeight).toBe(map.height);
  } finally {await page.close();}
});

test('rig previews expose every catalog shape and full keyboard-readable rules without scrolling',async()=>{
  const page=await mount();
  try {
    await page.evaluate(()=>{const ui=(window as any).ui;ui.api.setUiFixture(ui.game,{phase:'rig-select'});ui.screens.syncScreen();});
    for(const rig of ['breacher','cryo','pyro','arc']) {
      await page.locator(`[data-rig="${rig}"]`).click();
      expect(await page.locator('.ability-shape[data-shape]').count()).toBe(4);
      await page.locator('.ability-detail').first().focus();
      expect(await page.locator('.ability-detail').first().locator('.ability-rules').isVisible()).toBe(true);
      expect(await page.locator('.ability-detail').first().getAttribute('aria-label')).toContain('Dash');
      if(rig==='arc') expect(await page.locator('.ability-detail').last().locator('.ability-shape').getAttribute('aria-label')).toContain('Time dilation');
    }
  } finally {await page.close();}
});

test.each([[1280,720],[1920,1080]])('settings and controls fit title and pause consoles at %i × %i',async(width,height)=>{
  const page=await mount(width,height);
  try {
    const fit=async(selector:string)=>{
      const layout=await page.locator(selector).evaluate(node=>{const r=node.getBoundingClientRect();return{top:r.top,bottom:r.bottom,width:node.clientWidth,scrollWidth:node.scrollWidth,height:node.clientHeight,scrollHeight:node.scrollHeight};});
      expect(layout.top).toBeGreaterThanOrEqual(0);expect(layout.bottom).toBeLessThanOrEqual(height+1);
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width+1);expect(layout.scrollHeight).toBeLessThanOrEqual(layout.height+1);
    };
    await page.locator('#settings').click();await fit('.configuration-drawer');
    expect(await page.locator('[data-setting]').count()).toBe(Object.keys(GRAPHICS_OPTION_LABELS).length+7);
    await page.locator('#close-drawer').click();await page.locator('#controls').click();await fit('.controls-drawer');
    expect(await page.locator('.drawn-key').count()).toBe(14);
    await phase(page,'paused');await page.locator('[data-tab=settings]').click();await fit('.pause-panel');await fit('#pause-tabpanel');
    await page.locator('[data-tab=controls]').click();await fit('.pause-panel');await fit('#pause-tabpanel');
  } finally {await page.close();}
});

test('legacy duplicate room names remain distinct by room kind and reward before selection',async()=>{
  const page=await mount();
  try {
    await phase(page,'route',1,2);
    const labels=await page.locator('.destination-choices button').evaluateAll(nodes=>nodes.map(node=>({name:node.querySelector('b')?.textContent,detail:node.querySelector('small')?.textContent,aria:node.getAttribute('aria-label')})));
    expect(labels).toHaveLength(2);
    expect(labels[0].name).toBe(labels[1].name);
    expect(labels[0].detail).not.toBe(labels[1].detail);
    expect(labels[0].aria).not.toBe(labels[1].aria);
    expect(labels.map(label=>label.detail).join(' ')).toContain('ARMORY');
    expect(labels.map(label=>label.detail).join(' ')).toContain('MEDICAL');
    expect(await page.evaluate(()=>(window as any).ui.actions)).toEqual([]);
  } finally {await page.close();}
});

test('visible build rules stay inside the viewport when focused near the right edge',async()=>{
  const page=await mount();
  try {
    await page.evaluate(()=>{const ui=(window as any).ui;ui.game.expedition={...ui.game.expedition,build:{mutations:['incendiary','breacher','cryogenic','permafrost','arc-filament','pressure-point','heavy-pellets','absolute-zero']}};});
    await phase(page,'dead');
    await page.locator('.result-details>summary').click();
    for(const card of await page.locator('.owned-boon').all()) {
      await card.focus();const tooltip=(await card.locator('.boon-tooltip').boundingBox())!;
      expect(tooltip.x).toBeGreaterThanOrEqual(8);expect(tooltip.x+tooltip.width).toBeLessThanOrEqual(1272);
    }
  } finally {await page.close();}
});

test('menu shortcuts follow physical positions and retain native modifier shortcuts',async()=>{
  const page=await mount();
  try {
    await page.evaluate(()=>{const ui=(window as any).ui;ui.api.setUiFixture(ui.game,{phase:'rig-select'});ui.screens.syncScreen();});
    await page.evaluate(()=>document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'@',code:'Digit2',shiftKey:true,bubbles:true,cancelable:true})));
    expect(await page.locator('[data-rig="cryo"]').getAttribute('aria-pressed')).toBe('true');
    await phase(page,'reward');
    const id=await page.locator('[data-mutation]').nth(1).getAttribute('data-mutation');
    const prevented=await page.evaluate(()=>{
      const keys=[{key:'к',code:'KeyR',ctrlKey:true},{key:'r',code:'KeyX'},{key:'2',code:'Numpad2'},{key:'к',code:'KeyR'},{key:'@',code:'Digit2',shiftKey:true}];
      return keys.map(key=>{const event=new KeyboardEvent('keydown',{...key,bubbles:true,cancelable:true});document.body.dispatchEvent(event);return event.defaultPrevented;});
    });
    expect(prevented).toEqual([false,false,false,true,true]);
    expect(await page.evaluate(()=>(window as any).ui.actions)).toEqual(['reroll','boon:'+id]);
    await phase(page,'route',1);
    const route=await page.locator('[data-route]').first().getAttribute('data-route');
    await page.evaluate(()=>document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'!',code:'Digit1',shiftKey:true,bubbles:true,cancelable:true})));
    expect(await page.evaluate(()=>(window as any).ui.actions)).toEqual(['reroll','boon:'+id,'route:'+route]);
  } finally {await page.close();}
});

test.each([[1280,720],[1920,1080]])('authored key art covers either renderer contract while keeping the front door in the left 45 percent at %i × %i',async(width,height)=>{
  const page=await mount(width,height);
  try {
    expect(await page.locator('.title-key-art').count()).toBe(1);
    await page.evaluate(()=>{
      const ui=(window as any).ui;
      ui.renderer.menuPresentation='cinematic';ui.screens.syncScreen(true);
    });
    expect(await page.locator('.title-key-art').count()).toBe(1);
    expect(await page.locator('.title-key-art').getAttribute('aria-hidden')).toBe('true');
    expect(await page.locator('.title-key-art').evaluate(node=>getComputedStyle(node).pointerEvents)).toBe('none');
    expect(await page.locator('.title-screen').getAttribute('data-menu-presentation')).toBe('cinematic');
    const box=(await page.locator('.title-copy').boundingBox())!;
    expect(box.x+box.width).toBeLessThanOrEqual(width*.45+1);
    expect(await page.locator('#start').isVisible()).toBe(true);
    const extent=await page.locator('.title-copy').evaluate(node=>({scroll:node.scrollWidth,width:node.clientWidth}));
    expect(extent.scroll).toBeLessThanOrEqual(extent.width+1);
    await page.locator('#start').click();
    expect(await page.evaluate(()=>(window as any).ui.actions)).toEqual(['start']);
  } finally {await page.close();}
});

test.each([[1280,720],[1920,1080]])('Containment is the dominant title and Depth stays a subtitle at %i × %i',async(width,height)=>{
  const page=await mount(width,height);
  try {
    const sizes=await page.evaluate(()=>({word:parseFloat(getComputedStyle(document.querySelector('.title-word')!).fontSize),depth:parseFloat(getComputedStyle(document.querySelector('.title-depth')!).fontSize)}));
    expect(sizes.word).toBeGreaterThan(sizes.depth*3);
    expect(await page.locator('#start').isVisible()).toBe(true);
    expect(await page.locator('#continue').isVisible()).toBe(true);
  } finally {await page.close();}
});

test('boon element accents remain separate from family membership throughout draft and recap',async()=>{
  const page=await mount();
  try {
    await phase(page,'reward');
    const fire=page.locator('[data-mutation=incendiary]');
    expect(await fire.getAttribute('data-element')).toBe('pyro');
    expect(await fire.getAttribute('data-family')).toBe('Reactor');
    expect(await fire.locator('.boon-emblem').getAttribute('data-icon')).toBe('pyro');
    expect(await fire.locator('.family-progress').innerText()).toContain('Reactor set');
    expect(await fire.locator('.family-progress').getAttribute('aria-label')).toContain('Reactor family:');
    expect(await fire.locator('.boon-condition').isVisible()).toBe(false);
    await fire.focus();await page.keyboard.press('i');
    expect(await fire.locator('.boon-condition>span').innerText()).toBe('LIMIT');
    expect(await fire.locator('.boon-inspect-detail').innerText()).toContain('Repeated hits refresh the burn; damage does not stack.');
    await page.keyboard.press('i');
    await page.evaluate(()=>{const ui=(window as any).ui;ui.game.expedition={...ui.game.expedition,build:{rig:'pyro',mutations:['incendiary','caustic-rounds','field-medic']}};});
    await phase(page,'dead');
    await page.locator('.result-details>summary').click();
    expect(await page.locator('[data-boon=incendiary]').getAttribute('data-element')).toBe('pyro');
    expect(await page.locator('[data-boon=caustic-rounds]').getAttribute('data-element')).toBe('acid');
    expect(await page.locator('[data-boon=field-medic]').getAttribute('data-element')).toBe('recovery');
    await phase(page,'route',0);
    expect(await page.locator('.route-reward').innerText()).not.toMatch(/mutation/i);
  } finally {await page.close();}
});

test('unaffordable service rows explain the missing credits without fading their text',async()=>{
  const page=await mount();
  try {
    await page.evaluate(()=>{(window as any).ui.game.combat.snapshot.credits=20;});
    await phase(page,'reward',3);
    expect(await page.locator('#service-heal-reason').innerText()).toContain('Need 80 more credits');
    expect(await page.locator('#service-heal-reason').innerText()).toContain('Capped after free allocation');
    expect(await page.locator('.service-outcome').first().innerText()).toContain('Health 100 → 100 / 100');
    expect(await page.locator('[data-purchase=heal]').isDisabled()).toBe(true);
    expect(await page.locator('[data-purchase=heal]').evaluate(node=>getComputedStyle(node).opacity)).toBe('1');
    await page.evaluate(()=>{const ui=(window as any).ui;ui.game.combat.snapshot.health=62;ui.game.combat.snapshot.credits=180;ui.screens.syncScreen();});
    expect(await page.locator('.credit-balance').innerText()).toContain('180');
    expect(await page.locator('.service-outcome').first().innerText()).toContain('Health 62 → 100 / 100');
    expect(await page.locator('#service-heal-reason').innerText()).toContain('Balance after purchase: 80 CR');
    expect(await page.locator('[data-purchase=heal]').isEnabled()).toBe(true);
    expect(await page.locator('[data-purchase=heal]').evaluate(node=>getComputedStyle(node).opacity)).toBe('1');
  } finally {await page.close();}
});

test('loadout marks modified ability slots and presents their changed values',async()=>{
  const page=await mount();
  try {
    await page.evaluate(()=>{const ui=(window as any).ui;ui.game.abilities.snapshot=ui.api.abilityFixture('cryo','ready');ui.game.expedition={...ui.game.expedition,build:{rig:'cryo',mutations:['spreading-nova','twin-glacier','reserve-thruster']}};});
    await phase(page,'paused');
    await page.locator('[data-pause-tab=loadout]').click();
    expect(await page.locator('.ability-augment-badge').count()).toBe(3);
    expect(await page.locator('.ability-changed-value').allTextContents()).toEqual(['2 → 3 dash charges','+0.63 m radius per chilled enemy · max +3.13 m','1 → 2 ice walls']);
    expect(await page.locator('.ability-detail').first().locator('dl dd').first().innerText()).toBe('3');
    expect(await page.locator('.ability-preview').innerText()).not.toContain('Radius 300');
  } finally {await page.close();}
});

test('ending leads completion while every original statistic remains available through native disclosure',async()=>{
  const page=await mount();
  try {
    await phase(page,'complete',19);
    expect(await page.locator('.completion-ending').isVisible()).toBe(true);
    expect(await page.locator('.ending-exact').innerText()).toBe('Containment restored.');
    expect(await page.locator('.result-details').getAttribute('open')).toBeNull();
    expect(await page.locator('[data-stat=kills]').isVisible()).toBe(false);
    await page.locator('.result-details>summary').focus();
    await page.keyboard.press('Enter');
    expect(await page.locator('[data-stat=kills]').isVisible()).toBe(true);
    expect(await page.locator('[data-stat]').count()).toBe(16);
  } finally {await page.close();}
});


test('draft benefit cards expose exact rules only through deliberate native inspection',async()=>{
  const page=await mount();
  try {
    await phase(page,'reward');
    const card=page.locator('[data-mutation]').first();
    const detail=card.locator('.boon-inspect-detail');
    await card.hover();
    expect(await detail.isVisible()).toBe(false);
    expect((await card.locator('.boon-benefit').innerText()).length).toBeLessThanOrEqual(48);
    expect(await card.locator('.boon-numbers').innerText()).not.toBe('');
    await page.keyboard.down('Alt');
    expect(await detail.isVisible()).toBe(true);
    await page.keyboard.up('Alt');
    expect(await detail.isVisible()).toBe(false);
    await card.focus();
    await page.keyboard.press('i');
    expect(await detail.isVisible()).toBe(true);
    await detail.click();
    expect(await detail.isVisible()).toBe(true);
    await page.keyboard.press('Escape');
    expect(await detail.isVisible()).toBe(false);
    expect(await card.evaluate(node=>node===document.activeElement)).toBe(true);
    await page.keyboard.down('Tab');
    expect(await page.locator('[data-mutation]:focus .boon-inspect-detail').isVisible()).toBe(true);
    await page.keyboard.up('Tab');
    expect(await page.locator('.boon-inspect-detail:visible').count()).toBe(0);
    const actions=await page.evaluate(()=>(window as any).ui.actions);
    expect(actions.filter((action:string)=>action.startsWith('boon:'))).toEqual([]);
  } finally {await page.close();}
});

test.each([[1280,720],[1920,1080]])('reduced-motion aftermath fills the viewport and leaves the archive secondary at %i × %i',async(width,height)=>{
  const page=await mount(width,height);
  try {
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.evaluate(()=>{(window as any).ui.game.storyRoom={};});
    await phase(page,'complete',19);
    const geometry=await page.locator('.debrief-panel').evaluate(node=>{
      const box=node.getBoundingClientRect(),art=document.querySelector('.ending-space')!,headline=document.querySelector('.ending-exact')!;
      return {left:box.left,top:box.top,right:box.right,bottom:box.bottom,scroll:node.scrollHeight,height:node.clientHeight,art:art.getBoundingClientRect().height,motion:getComputedStyle(art).animationName,headlines:node.querySelectorAll('h2').length,text:headline.textContent};
    });
    expect(geometry).toMatchObject({left:0,top:0,right:width,bottom:height,motion:'none',headlines:1});
    expect(geometry.scroll).toBeLessThanOrEqual(geometry.height+1);
    expect(geometry.art).toBeGreaterThan(height*.65);
    expect(geometry.text).toBe('SHIP DESTROYED / ALL ABOARD LOST / NEW EARTH WARNED');
    expect(await page.locator('.result-details').getAttribute('open')).toBeNull();
    await page.locator('.result-details>summary').focus();await page.keyboard.press('Enter');
    expect(await page.locator('[data-stat]').count()).toBe(16);
    expect(await page.locator('#start').isVisible()).toBe(true);
  } finally {await page.close();}
});
