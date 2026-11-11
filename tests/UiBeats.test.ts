import {afterAll, beforeAll, expect, it} from 'vitest';
import {mountHud, startHudHarness, stopHudHarness} from './HudHarness';

beforeAll(startHudHarness);
afterAll(stopHudHarness);

it('directs nonblocking room/boss/clear/death beats without changing simulation or trapping focus', async () => {
  const page = await mountHud(1280,720);
  await page.evaluate(async () => {
    const load = new Function('p','return import(p)') as (p:string)=>Promise<any>;
    const {DepthGame} = await load('/src/DepthGame.ts');
    const {expeditionRewardOffers} = await load('/src/game/roguelike/expedition.ts');
    const {PresentationBeats} = await load('/src/ui/hud/beats/PresentationBeats.ts');
    const game = new DepthGame(); game.newRun(1729); game.chooseMutation(expeditionRewardOffers(game.expedition)[0].id);
    const cues: string[] = [];
    const beats = new PresentationBeats(game,document.getElementById('app')!, (cue:string)=>cues.push(cue));
    (window as any).__beats={beats,game,cues};
    beats.sync();
  });
  const beat=page.locator('#presentation-beat');
  await expect.poll(()=>beat.getAttribute('data-beat')).toBe('room-enter');
  expect(await beat.evaluate(node=>getComputedStyle(node).pointerEvents)).toBe('none');
  expect(await beat.locator('button,a,input,[tabindex]').count()).toBe(0);
  await page.locator('#pause').focus();
  await page.evaluate(()=>{const {beats}= (window as any).__beats; beats.show('room-clear');});
  expect(await page.evaluate(()=> (window as any).__beats.beats.blocking)).toBe(true);
  await page.keyboard.press('Enter');
  expect(await page.evaluate(()=> (window as any).__beats.beats.blocking)).toBe(false);
  expect(await page.locator('#pause').evaluate(n=>n===document.activeElement)).toBe(true);
  const result=await page.evaluate(()=>{
    const {beats,game,cues}=(window as any).__beats;
    const before=JSON.stringify(game.expedition);
    beats.show('boss-intro'); beats.tick(.1); beats.show('death'); beats.tick(.1);
    const unchanged=before===JSON.stringify(game.expedition); beats.dispose();
    return {unchanged,cues,removed:!document.getElementById('presentation-beat')};
  });
  expect(result.unchanged).toBe(true); expect(result.removed).toBe(true);
  expect(result.cues).toContain('room-enter'); expect(result.cues).toContain('room-clear'); expect(result.cues).toContain('death');
  await page.close();
});

it('keeps low-health and reduced-motion information while shortening transition holds', async () => {
  const page=await mountHud(1280,720); await page.emulateMedia({reducedMotion:'reduce'});
  const result=await page.evaluate(async()=>{
    const load=new Function('p','return import(p)') as (p:string)=>Promise<any>;
    const {DepthGame}=await load('/src/DepthGame.ts'); const {PresentationBeats}=await load('/src/ui/hud/beats/PresentationBeats.ts');
    const game=new DepthGame(),cues:string[]=[]; const beats=new PresentationBeats(game,document.getElementById('app')!, (cue:string)=>cues.push(cue));
    beats.show('death'); const reduced=document.getElementById('presentation-beat')!.dataset.reducedMotion;
    beats.tick(.1);beats.tick(.06);const blocking=beats.blocking;
    beats.setEnabled(false); beats.show('room-enter'); const hidden=document.getElementById('presentation-beat')!.hidden;beats.dispose();
    return {reduced,blocking,hidden,cues};
  });
  expect(result.reduced).toBe('true');expect(result.blocking).toBe(false);expect(result.hidden).toBe(true);
  await page.close();
});

it('keeps beat copy clear of perspective marine bounds and cached HUD at both desktop sizes', async () => {
  for (const [width,height] of [[1280,720],[1920,1080]]) {
    const page=await mountHud(width,height);
    await page.emulateMedia({reducedMotion:'reduce'});
    try {
      const result=await page.evaluate(async()=>{
        const load=new Function('p','return import(p)');
        const {DepthGame}=await load('/src/DepthGame.ts');
        const {PresentationBeats}=await load('/src/ui/hud/beats/PresentationBeats.ts');
        const {positionHudPanels,hudObstructs,presentationObstructs}=await load('/src/ui/hud/layout.ts');
        const game=new DepthGame(),beats=new PresentationBeats(game,document.getElementById('app'),()=>{});
        const player={left:innerWidth*.4,right:innerWidth*.4+90,top:innerHeight*.19,bottom:innerHeight*.19+140};
        positionHudPanels(player,innerWidth,innerHeight);
        beats.show('boss-intro');beats.position(player);
        const node=document.getElementById('presentation-beat')!,box=node.getBoundingClientRect();
        const before=JSON.stringify(game.expedition);
        const protectedBefore=presentationObstructs(box.left,box.top,box.right,box.bottom);
        const data={visible:getComputedStyle(node).visibility!=='hidden',outside:box.left<8||box.right>innerWidth-8||box.top<8||box.bottom>innerHeight-8,
          marine:box.left<player.right+10&&box.right>player.left-10&&box.top<player.bottom+10&&box.bottom>player.top-10,
          chrome:hudObstructs(box.left,box.top,box.right,box.bottom),protectedBefore};
        // An ordinary tick reuses cached dimensions without a layout read.
        node.getBoundingClientRect=()=>{throw Error('Unexpected per-frame beat measurement');};
        beats.position(player);beats.dismiss();
        return {...data,released:!presentationObstructs(box.left,box.top,box.right,box.bottom),unchanged:before===JSON.stringify(game.expedition)};
      });
      expect(result).toEqual({visible:true,outside:false,marine:false,chrome:false,protectedBefore:true,released:true,unchanged:true});
    } finally {await page.close();}
  }
});
