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
          import {setUiFixture} from ${JSON.stringify(root+'src/ui/gameAdapter.ts')};
          import {generateRun} from ${JSON.stringify(root+'src/game/roguelike/run.ts')};
          import {RunStats} from ${JSON.stringify(root+'src/game/abilities/RunStats.ts')};
          import {abilityFixture} from ${JSON.stringify(root+'src/ui/fixtures.ts')};
          import {AUGMENT_BOONS} from ${JSON.stringify(root+'src/game/abilities/augmentCatalog.ts')};
          import {draftScreen} from ${JSON.stringify(root+'src/ui/screens/templates.ts')};
          import {createExpedition} from ${JSON.stringify(root+'src/game/roguelike/expedition.ts')};
          window.screenTestApi={createScreens,setUiFixture,generateRun,createExpedition,RunStats,abilityFixture,AUGMENT_BOONS,draftScreen};`;
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
  await page.setContent(`<style>${css}</style><div id="app"><div id="hud"></div><div id="room-loading"></div><div id="signature"></div><div id="shade"></div><div id="overlay"></div></div>`);
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
    const audio={pauseAll(){},resumeAll(){},playUI(){},setMasterVolume(){},unlock:()=>Promise.resolve()};
    const renderer={qualityTier:'high',setQuality(){}};
    let lost=false;
    const screens=api.createScreens({game,renderer,input:{reset(){}},audio,confirmation:{clear(){}},storage:null,pause:()=>actions.push('resume'),start:()=>actions.push('start'),graphicsLost:()=>lost,recovering:()=>false});
    (window as any).ui={api,game,screens,actions,setLost(value:boolean){lost=value;},phase(status:string,depth=0,version=3){
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
    await page.locator('#credits').click();
    expect(await page.locator('.credits-drawer').count()).toBe(1);
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
    expect(await page.locator('#resume').isDisabled()).toBe(true);
    expect(await page.locator('h2').innerText()).toBe('Restoring graphics…');
  } finally {await page.close();}
});

test.each([[1280,720],[960,540]])('long loadouts scroll inside pause while Resume stays visible at %i × %i',async(width,height)=>{
  const page=await mount(width,height);
  try {
    await page.evaluate(()=>{
      const ui=(window as any).ui;
      ui.game.expedition={...ui.game.expedition,build:{mutations:['incendiary','breacher','cryogenic','permafrost','arc-filament','pressure-point','heavy-pellets','absolute-zero']}};
    });
    await phase(page,'paused');
    await page.locator('[data-pause-tab=loadout]').click();
    const content=await page.locator('#pause-tabpanel').evaluate(element=>({scroll:element.scrollHeight,height:element.clientHeight,overflow:getComputedStyle(element).overflowY}));
    expect(content.scroll).toBeGreaterThan(content.height);
    expect(content.overflow).toBe('auto');
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
    expect(await page.locator('[data-route]').count()).toBe(2);
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
    expect(await page.locator('.result-stats>div').count()).toBe(16);
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
    expect(await page.locator('.ability-detail h3').allTextContents()).toEqual(['Frost Trail','Cryo Nova','Glacier','Whiteout']);
    expect(await page.locator('.owned-boon[data-augment=true]').count()).toBe(12);
    const icons=await page.locator('.owned-boon').evaluateAll(nodes=>nodes.map(node=>({id:node.getAttribute('data-boon'),icon:node.querySelector('svg')?.getAttribute('data-icon')})));
    for(const entry of icons) expect(entry.icon).toBe(entry.id);
    expect(await page.locator('.owned-boon[data-boon=twin-glacier]').innerText()).toContain('Cryo augment');
    expect(await page.locator('.owned-boon[data-boon=reserve-thruster]').innerText()).toContain('Universal augment');
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

test.each([[1280,720],[1920,1080],[2560,1440]])('screen content stays inside a scrollable desktop viewport at %i × %i',async(width,height)=>{
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
      if(layout.scrollHeight>layout.clientHeight) expect(['auto','scroll']).toContain(layout.overflow);
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
