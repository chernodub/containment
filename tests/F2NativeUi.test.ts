import {beforeAll,afterAll,it,expect} from 'vitest';
import {build} from 'vite';
import {chromium,type Browser,type Page} from 'playwright';
import {fileURLToPath} from 'node:url';
import {uiCss} from './uiSource';
let browser:Browser,controller='';
const repo=fileURLToPath(new URL('../',import.meta.url));
beforeAll(async()=>{
  const entry='\0f2-native-ui';
  const result:any=await build({configFile:false,logLevel:'silent',plugins:[{name:'f2',resolveId:(id:string)=>id===entry?entry:undefined,load:(id:string)=>id===entry?`
    import * as templates from '${repo}src/ui/screens/templates.ts';
    import {mountShell} from '${repo}src/ui/shell.ts';
    import {createScreens} from '${repo}src/ui/screens/ScreenManager.ts';
    import {createSettings} from '${repo}src/ui/settings.ts';
    import {DepthGame} from '${repo}src/DepthGame.ts';
    import {InputController} from '${repo}src/InputController.ts';
    import {GameFeel} from '${repo}src/ui/feel.ts';
    import {generateRun} from '${repo}src/game/roguelike/run.ts';
    import {expeditionRewardOffers} from '${repo}src/game/roguelike/expedition.ts';
    window.api={templates,mountShell,createScreens,createSettings,DepthGame,InputController,GameFeel,generateRun,expeditionRewardOffers};`:undefined}],build:{write:false,minify:false,rollupOptions:{input:entry,output:{format:'iife'}},target:'es2022'}});
  for(const v of Array.isArray(result)?result:[result])for(const c of v.output)if(c.type==='chunk')controller+=c.code;
  browser=await chromium.launch({args:['--no-sandbox','--disable-gpu','--disable-webgl']});
},30000);
afterAll(async()=>browser?.close());
async function mount(width=1280,height=720):Promise<Page>{
  const page=await browser.newPage({viewport:{width,height}});
  await page.setContent(`<style>${uiCss}</style><div id="app"></div>`);await page.addScriptTag({content:controller});
  await page.evaluate(()=>{
    const a=(window as any).api;a.mountShell();const game=new a.DepthGame();
    const renderer={canvas:document.getElementById('world'),qualityTier:'high',roomLoading:false,setQuality(){},setGraphicsOptions(){},pointer:()=>null};
    const audio={pauseAll(){},resumeAll(){},playUI(){},setMasterVolume(){},setMusicVolume(){},setEffectsVolume(){},unlock:async()=>true};
    let lost=false,screens:any;
    const pause=()=>{if(game.status==='playing')game.pause();else if(game.status==='paused'&&!lost&&!screens.graphicsBlocked)game.resume();screens.syncScreen();};
    const input=new a.InputController(game,renderer,()=>pause(),()=>!lost&&!screens?.graphicsBlocked);
    const settings=a.createSettings({renderer,audio,storage:null});
    const start=()=>{game.newRun(1729,{rigSelect:true});screens.syncScreen(true);};
    screens=a.createScreens({game,renderer,input,audio,storage:null,confirmation:{clear(){}},pause,start,settings,graphicsLost:()=>lost,recovering:()=>false});
    document.getElementById('pause')!.onclick=pause;
    screens.syncScreen(true);
    (window as any).ui={game,screens,input,setLost(value:boolean){lost=value;if(value)game.pause();input.reset();screens.syncScreen(true);},play(){game.newRun(1729);game.chooseMutation(a.expeditionRewardOffers(game.expedition)[0].id);screens.syncScreen(true);},phase(name:string){
      game.newRun(1729,{rigSelect:true});
      const graph=a.generateRun(1729,3);
      const status=name==='starting-boon'||name==='draft'||name==='shop'?'reward':name==='destroy'?'route':name;
      const node=name==='shop'?graph.nodes.find((n:any)=>['healing','supplies'].includes(n.reward)):name==='draft'?graph.nodes.find((n:any)=>n.depth>0&&n.reward==='upgrade'):name==='destroy'?graph.nodes.find((n:any)=>n.templateId==='manual-control-chamber'):graph.nodes[0];
      game.node=node;
      const phase=name==='starting-boon'?'starting-boon':status==='playing'||status==='paused'?'combat':status==='menu'?'rig-select':status;
      game.expedition={...game.expedition,run:{...game.expedition.run,phase,currentNodeId:node.id,completedNodeIds:graph.nodes.filter((n:any)=>n.depth<node.depth||['draft','shop','route','destroy','complete'].includes(name)&&n.id===node.id).map((n:any)=>n.id)}};
      game.status=status;screens.resetSettings();screens.syncScreen(true);
    }};
  });return page;
}
const screens=['menu','rig-select','starting-boon','draft','shop','route','destroy','dead','complete','paused'] as const;
it.each(screens)('graphics loss blocks %s, preserves choices and requires deliberate restoration',async screen=>{
  const p=await mount();try{
    await p.evaluate(s=>(window as any).ui.phase(s),screen);
    const before=await p.evaluate(()=>JSON.stringify((window as any).ui.game.expedition));
    await p.evaluate(()=>(window as any).ui.setLost(true));
    expect(await p.locator('#recover').isVisible()).toBe(true);expect(await p.locator('#graphics-continue').isDisabled()).toBe(true);
    expect(await p.locator('#hud').getAttribute('aria-hidden')).toBe('true');
    expect(await p.locator('#hud').evaluate((e:any)=>e.inert)).toBe(true);
    await p.locator('.recovery-panel').evaluate((e:any)=>{e.tabIndex=-1;e.focus();});
    for(const key of ['1','r','Enter','Space','Escape'])await p.keyboard.press(key);
    expect(await p.evaluate(()=>JSON.stringify((window as any).ui.game.expedition))).toBe(before);
    await p.evaluate(()=>(window as any).ui.setLost(false));
    expect(await p.locator('#graphics-continue').isEnabled()).toBe(true);
    expect(await p.locator('#recover').isVisible()).toBe(true);
    await p.locator('#graphics-continue').click();
    expect(await p.locator('#recover').count()).toBe(0);
    expect(await p.evaluate(()=>JSON.stringify((window as any).ui.game.expedition))).toBe(before);
  }finally{await p.close();}
});
it('restoration from combat never resumes until the native Resume action',async()=>{
  const p=await mount();try{
    await p.evaluate(()=>(window as any).ui.play());await p.evaluate(()=>(window as any).ui.setLost(true));
    await p.evaluate(()=>(window as any).ui.setLost(false));expect(await p.evaluate(()=>(window as any).ui.game.status)).toBe('paused');
    await p.locator('#graphics-continue').click();expect(await p.evaluate(()=>(window as any).ui.game.status)).toBe('paused');
    await p.locator('#resume').click();expect(await p.evaluate(()=>(window as any).ui.game.status)).toBe('playing');
  }finally{await p.close();}
});
it.each(screens)('held Tab and Shift+Tab remain inside the %s blocking screen',async screen=>{
  const p=await mount();try{
    await p.evaluate(s=>(window as any).ui.phase(s),screen);
    for(const shift of [false,true]){
      if(shift)await p.keyboard.down('Shift');
      for(let i=0;i<30;i++){
        await p.keyboard.down('Tab');
        expect(await p.evaluate(()=>document.getElementById('overlay')!.contains(document.activeElement))).toBe(true);
      }
      await p.keyboard.up('Tab');if(shift)await p.keyboard.up('Shift');
    }
  }finally{await p.close();}
});
it.each(['settings','controls','credits'])('Escape closes title %s and restores launcher focus',async id=>{
  const p=await mount();try{
    await p.locator('#overlay #'+id).click();await p.keyboard.press('Escape');
    expect(await p.locator('.title-drawer').count()).toBe(0);expect(await p.locator('#overlay #'+id).evaluate(e=>e===document.activeElement)).toBe(true);
  }finally{await p.close();}
});
it('native focused HUD Space pauses, Shift+Tab does not dash, and canvas reclaims gameplay focus',async()=>{
  const p=await mount();try{
    await p.evaluate(()=>(window as any).ui.play());await p.locator('#pause').focus();
    const before=await p.evaluate(()=>(window as any).ui.game.stats.abilityUses.dash);
    await p.keyboard.press('Shift+Tab');expect(await p.evaluate(()=>(window as any).ui.game.stats.abilityUses.dash)).toBe(before);
    await p.locator('#pause').focus();await p.keyboard.press('Space');expect(await p.evaluate(()=>(window as any).ui.game.status)).toBe('paused');
    await p.locator('#resume').click();await p.locator('#world').click({position:{x:320,y:180}});
    expect(await p.locator('#world').evaluate(e=>e===document.activeElement)).toBe(true);
    await p.keyboard.down('Space');expect(await p.evaluate(()=>(window as any).ui.input.read().fire)).toBe(true);await p.keyboard.up('Space');
    await p.keyboard.down('d');await p.locator('#pause').focus();expect(await p.evaluate(()=>(window as any).ui.input.read().x)).toBe(0);await p.keyboard.up('d');
  }finally{await p.close();}
});
it.each([[640,360],[960,540],[1280,720],[1920,1080],[2560,1440],[3440,1440]])('all screen actions are mouse/keyboard reachable at %i × %i CSS pixels',async(width,height)=>{
  const p=await mount(width,height);try{
    for(const screen of [...screens,'settings','controls','credits']){
      const drawer=['settings','controls','credits'].includes(screen);
      await p.evaluate(s=>(window as any).ui.phase(s),drawer?'menu':screen);
      if(drawer)await p.locator('#overlay #'+screen).click();
      await p.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished)));
      const scope=drawer?'.title-drawer':'#overlay';
      const actions=p.locator(`${scope} button:not(:disabled),${scope} select,${scope} input,${scope} a[href]`);
      const count=await actions.count();expect(count).toBeGreaterThan(0);
      for(let i=0;i<count;i++){
        const action=actions.nth(i);if(!await action.isVisible())continue;
        await action.focus();await action.scrollIntoViewIfNeeded();
        const reachable=await action.evaluate(e=>{const r=e.getBoundingClientRect();const x=Math.max(1,Math.min(innerWidth-1,r.left+r.width/2)),y=Math.max(1,Math.min(innerHeight-1,r.top+r.height/2));return {focused:document.activeElement===e,left:r.left,right:r.right,top:r.top,bottom:r.bottom,mouse:e.contains(document.elementFromPoint(x,y))};});
        expect(reachable.focused,JSON.stringify({screen,i,reachable})).toBe(true);expect(reachable.left).toBeGreaterThanOrEqual(0);expect(reachable.right,JSON.stringify({screen,i,reachable})).toBeLessThanOrEqual(width);
        expect(reachable.top,JSON.stringify({screen,i,reachable})).toBeGreaterThanOrEqual(0);expect(reachable.bottom,JSON.stringify({screen,i,reachable})).toBeLessThanOrEqual(height);expect(reachable.mouse,JSON.stringify({screen,i,reachable})).toBe(true);
      }
    }
  }finally{await p.close();}
},30000);
it('replays browser-event-timed physical inputs identically across queued hit-stop frames',async()=>{
  const p=await mount();try{
    const results=[];
    for(let run=0;run<2;run++){
      await p.evaluate(()=>{
        const u=(window as any).ui;u.play();u.feel=new (window as any).api.GameFeel();u.wall=0;u.steps=0;
        u.frame=(ms:number)=>{u.wall+=ms;u.feel.advance(ms,{dashing:false,critical:false,remaining:10},(dt:number)=>{u.game.update(dt,u.input.read());u.steps++;if(u.wall===50)u.feel.effect({type:'wall-slam',x:0,y:0},{dashing:false,critical:false,remaining:10});});};
      });
      // These are browser event times, independent of which fixed simulation
      // step happens to run. D is released entirely inside the active stop.
      await p.keyboard.down('d');await p.evaluate(()=>(window as any).ui.frame(50));
      await p.keyboard.up('d');await p.keyboard.down('w');
      await p.evaluate(()=>{const u=(window as any).ui;u.frame(16);u.frame(16);});
      expect(await p.evaluate(()=>(window as any).ui.steps)).toBe(1);
      await p.keyboard.up('w');await p.keyboard.down('Space');await p.keyboard.press('q');
      await p.evaluate(()=>{const u=(window as any).ui;for(const ms of [8,16,33,12,50,16,16])u.frame(ms);});
      await p.keyboard.up('Space');
      results.push(await p.evaluate(()=>{const u=(window as any).ui;return JSON.stringify({player:u.game.player,combat:u.game.combat.snapshot,abilities:u.game.abilities.snapshot,enemies:u.game.enemies.snapshot,stats:u.game.stats,steps:u.steps,feel:u.feel.snapshot});}));
    }
    expect(results[0]).toBe(results[1]);
  }finally{await p.close();}
});
