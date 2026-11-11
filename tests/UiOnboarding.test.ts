import { beforeAll, afterAll, expect, it } from 'vitest';
import { loadOnboardingSeen, ONBOARDING_STORAGE_KEY } from '../src/ui/onboarding';
import { startHudHarness, stopHudHarness, mountHud } from './HudHarness';

beforeAll(startHudHarness);
afterAll(stopHudHarness);

it('reads only true known actions from the supported preference version', () => {
  const storage = (value: string) => ({getItem:() => value,setItem:() => {}});
  expect(loadOnboardingSeen(storage('{"version":1,"seen":{"move":true,"dash":1,"alien":true}}'))).toEqual({move:true});
  for (const value of ['null','[]','{','{"version":2,"seen":{"move":true}}','{"version":1,"seen":[]}']) expect(loadOnboardingSeen(storage(value))).toEqual({});
  expect(loadOnboardingSeen({getItem:() => {throw Error('Blocked');},setItem:() => {}})).toEqual({});
});

async function mount() {
  const page = await mountHud(1280,720);
  await page.evaluate(async () => {
    const load = new Function('path','return import(path)');
    const {ContextualOnboarding} = await load('/src/ui/onboarding.ts');
    const {abilityFixture} = await load('/src/ui/fixtures.ts');
    const saved: Record<string,string> = {};
    const storage = {getItem:(key:string) => saved[key] ?? null,setItem:(key:string,value:string) => {saved[key]=value;}};
    const game = {status:'playing',node:{depth:0},expedition:{run:{seed:1729}},player:{moving:false,angle:0},enemies:{activeCount:5},combat:{snapshot:{health:100,magazine:12,magazineCapacity:12,reserve:60,reloading:false,grenades:3,medkits:2}}};
    const abilities = abilityFixture('cryo','ready');
    const onboarding = new ContextualOnboarding(document.getElementById('action-bar'),storage);
    (window as any).__onboarding = {game,abilities,onboarding,saved,storage,ContextualOnboarding};
    onboarding.update(game,abilities);
    onboarding.tick(0,{left:600,right:680,top:280,bottom:420});
  });
  return page;
}

it('shows one contextual prompt and persists successful uses without intercepting pointer or keyboard', async () => {
  const page=await mount();
  try {
    expect(await page.locator('#contextual-onboarding').getAttribute('data-action')).toBe('move');
    expect(await page.locator('#contextual-onboarding').evaluate(node=>getComputedStyle(node).pointerEvents)).toBe('none');
    expect(await page.locator('#contextual-onboarding [tabindex], #contextual-onboarding button').count()).toBe(0);
    await page.evaluate(()=>{const {game,abilities,onboarding}=(window as any).__onboarding;game.player.moving=true;onboarding.update(game,abilities);onboarding.effect({type:'ability',x:0,y:0,ability:{slot:'dash',phase:'denied'}});});
    const seen=await page.evaluate(key=>JSON.parse((window as any).__onboarding.saved[key]),ONBOARDING_STORAGE_KEY);
    expect(seen.seen).toEqual({move:true});
    expect(await page.locator('#contextual-onboarding').getAttribute('data-action')).toBe('aim');
    await page.evaluate(()=>{const {game,abilities,onboarding}=(window as any).__onboarding;game.player.angle=.5;onboarding.update(game,abilities);onboarding.effect({type:'shot',x:0,y:0});onboarding.effect({type:'ability',x:0,y:0,ability:{slot:'dash',phase:'dash-start'}});onboarding.update(game,abilities);});
    const learned=await page.evaluate(key=>JSON.parse((window as any).__onboarding.saved[key]).seen,ONBOARDING_STORAGE_KEY);
    expect(learned).toEqual({move:true,aim:true,fire:true,dash:true});
    expect(await page.locator('#contextual-onboarding').getAttribute('data-action')).toBe('tactical');
  } finally {await page.close();}
});

it('teaches resource actions from successful transitions and never marks denied use as learned', async () => {
  const page=await mount();
  try {
    await page.evaluate(()=>{
      const {game,abilities,onboarding}=(window as any).__onboarding;
      game.combat.snapshot.health=40;onboarding.update(game,abilities);
    });
    // An existing tip finishes its short presentation before the urgent prompt.
    await page.evaluate(()=>{const {game,abilities,onboarding}=(window as any).__onboarding;onboarding.tick(6.1,{left:600,right:680,top:280,bottom:420});onboarding.update(game,abilities);});
    expect(await page.locator('#contextual-onboarding').getAttribute('data-action')).toBe('medkit');
    await page.evaluate(()=>{
      const {game,abilities,onboarding}=(window as any).__onboarding;
      game.combat.snapshot.medkits--;game.combat.snapshot.grenades--;game.combat.snapshot.reloading=true;onboarding.update(game,abilities);
    });
    const seen=await page.evaluate(key=>JSON.parse((window as any).__onboarding.saved[key]).seen,ONBOARDING_STORAGE_KEY);
    expect(seen).toEqual({medkit:true,grenade:true,reload:true});
  } finally {await page.close();}
});

it('persists across restarts, hides outside the first room, and offers Overdrive on its first full meter', async () => {
  const page=await mount();
  try {
    await page.evaluate(()=>{const state=(window as any).__onboarding;state.onboarding.mark('move');state.onboarding.dispose();state.onboarding=new state.ContextualOnboarding(document.getElementById('action-bar'),state.storage);state.game.node.depth=4;state.onboarding.update(state.game,state.abilities);});
    expect(await page.locator('#contextual-onboarding').isHidden()).toBe(true);
    await page.evaluate(()=>{const {game,abilities,onboarding}=(window as any).__onboarding;abilities.overdrive.ready=true;onboarding.update(game,abilities);});
    expect(await page.locator('#contextual-onboarding').getAttribute('data-action')).toBe('overdrive');
    await page.evaluate(()=>{const {game,abilities,onboarding}=(window as any).__onboarding;onboarding.effect({type:'ability',x:0,y:0,ability:{slot:'overdrive',phase:'cast'}});onboarding.update(game,abilities);});
    expect(await page.locator('#contextual-onboarding').isHidden()).toBe(true);
    const seen=await page.evaluate(key=>JSON.parse((window as any).__onboarding.saved[key]).seen,ONBOARDING_STORAGE_KEY);
    expect(seen).toEqual({move:true,overdrive:true});
  } finally {await page.close();}
});

it('yields to the projected marine and removes its only DOM node on disposal', async () => {
  const page=await mount();
  try {
    const box=(await page.locator('#contextual-onboarding').boundingBox())!;
    await page.evaluate(box=>{const {onboarding}=(window as any).__onboarding;onboarding.tick(.1,{left:box.x,right:box.x+box.width,top:box.y,bottom:box.y+box.height});},box);
    expect(await page.locator('#contextual-onboarding').isVisible()).toBe(false);
    await page.evaluate(()=>{const {onboarding}=(window as any).__onboarding;onboarding.tick(.1,{left:600,right:680,top:280,bottom:420});});
    expect(await page.locator('#contextual-onboarding').isVisible()).toBe(true);
    await page.evaluate(()=>{const {onboarding}=(window as any).__onboarding;onboarding.dispose();});
    expect(await page.locator('#contextual-onboarding').count()).toBe(0);
  } finally {await page.close();}
});

it('stops ordinary coaching after the first minute while remembering successful uses in later rooms', async () => {
  const page=await mount();
  try {
    await page.evaluate(()=>{const {game,abilities,onboarding}=(window as any).__onboarding;onboarding.tick(61,{left:600,right:680,top:280,bottom:420});onboarding.update(game,abilities);});
    expect(await page.locator('#contextual-onboarding').isHidden()).toBe(true);
    await page.evaluate(()=>{const {game,abilities,onboarding}=(window as any).__onboarding;game.node.depth=3;onboarding.update(game,abilities);onboarding.effect({type:'ability',x:0,y:0,ability:{slot:'power',phase:'cast'}});});
    const seen=await page.evaluate(key=>JSON.parse((window as any).__onboarding.saved[key]).seen,ONBOARDING_STORAGE_KEY);
    expect(seen).toEqual({power:true});
  } finally {await page.close();}
});

it('keeps coaching inside the viewport when the action bar relocates to either vertical edge and the desktop resizes', async () => {
  const page=await mount();
  try {
    for (const [width,height] of [[1280,720],[1920,1080],[960,540],[640,360]]) {
      await page.setViewportSize({width,height});
      for (const edge of ['top','bottom']) {
        const result=await page.evaluate(edge=>{
          const {onboarding}=(window as any).__onboarding;
          const bar=document.getElementById('action-bar')!;
          bar.style.translate='0px 0px';
          const preferred=bar.getBoundingClientRect();
          bar.style.translate=`0px ${edge==='top'?8-preferred.top:innerHeight-8-preferred.bottom}px`;
          const marine={left:innerWidth-100,right:innerWidth-20,top:innerHeight*.45,bottom:innerHeight*.45+60};
          onboarding.tick(0,marine);
          const prompt=document.getElementById('contextual-onboarding')!;
          const bounds=prompt.getBoundingClientRect();
          return {left:bounds.left,right:bounds.right,top:bounds.top,bottom:bounds.bottom,visible:getComputedStyle(prompt).visibility,overlap:bounds.left<marine.right&&bounds.right>marine.left&&bounds.top<marine.bottom&&bounds.bottom>marine.top,pointer:getComputedStyle(prompt).pointerEvents,hit:document.elementFromPoint((bounds.left+bounds.right)/2,(bounds.top+bounds.bottom)/2)?.id};
        },edge);
        expect(result.top,`${width}x${height} ${edge}`).toBeGreaterThanOrEqual(0);
        expect(result.bottom,`${width}x${height} ${edge}`).toBeLessThanOrEqual(height);
        expect(result.left).toBeGreaterThanOrEqual(0);expect(result.right).toBeLessThanOrEqual(width);
        expect(result.visible).toBe('visible');expect(result.overlap).toBe(false);
        expect(result.pointer).toBe('none');expect(result.hit).toBe('world');
      }
    }
  } finally {await page.close();}
});

it('keeps first-room coaching clear of real acquisition and checkpoint toasts using the native HUD layout', async () => {
  const page=await mount();
  try {
    const result=await page.evaluate(async()=>{
      const load=new Function('path','return import(path)');
      const {HudToasts}=await load('/src/ui/hud/Toasts.ts');
      const {onboarding,game,abilities}=(window as any).__onboarding;
      document.getElementById('ability-bar')!.hidden=false;
      document.getElementById('story-status')!.textContent='Passengers alive · AI promises survival';
      document.getElementById('room-objective')!.textContent='Restore communications.';
      document.getElementById('story-presentation')!.hidden=true;
      document.getElementById('build-strip')!.textContent='Reactor 1/3';
      const toasts=new HudToasts(document.getElementById('hud-toasts'));
      toasts.show('Incendiary acquired','arc','reward','boon');
      toasts.show('Checkpoint saved','check','info','checkpoint');
      const marine={left:230,right:286,top:300,bottom:420};
      onboarding.update(game,abilities);
      (window as any).__invalidate();
      const placed=(window as any).__place(marine,innerWidth,innerHeight);
      onboarding.tick(0,marine);
      const prompt=document.getElementById('contextual-onboarding')!;
      const rect=prompt.getBoundingClientRect();
      const overlaps=[...document.querySelectorAll('#hud-toasts .hud-toast:not([hidden])')].some(node=>{const r=node.getBoundingClientRect();return rect.left<r.right&&rect.right>r.left&&rect.top<r.bottom&&rect.bottom>r.top;});
      (window as any).__toastOnboarding={onboarding,toasts,marine};
      return {placed,overlaps,visible:getComputedStyle(prompt).visibility,left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,pointer:getComputedStyle(prompt).pointerEvents,hit:document.elementFromPoint((rect.left+rect.right)/2,(rect.top+rect.bottom)/2)?.id};
    });
    expect(result.placed).toBe(true);
    expect(result.overlaps).toBe(false);
    expect(result.visible).toBe('visible');expect(result.pointer).toBe('none');
    expect(result.hit).toBe('world');
    expect(result.left).toBeGreaterThanOrEqual(0);expect(result.right).toBeLessThanOrEqual(1280);
    expect(result.top).toBeGreaterThanOrEqual(0);expect(result.bottom).toBeLessThanOrEqual(720);
    const recovery=await page.evaluate(()=>{
      const {onboarding,toasts,marine}=(window as any).__toastOnboarding;
      toasts.clear();(window as any).__place(marine,innerWidth,innerHeight);onboarding.tick(0,marine);
      const host=document.getElementById('action-bar')!,prompt=document.getElementById('contextual-onboarding')!;
      const rect=prompt.getBoundingClientRect(),bank=host.querySelector('.weapon-bank')!.getBoundingClientRect();
      let measurements=0,queries=0;
      const hostMeasure=host.getBoundingClientRect,promptMeasure=prompt.getBoundingClientRect,hostQuery=host.querySelector,documentQuery=document.querySelector;
      host.getBoundingClientRect=()=>{measurements++;throw Error('Ordinary frames must reuse host bounds');};
      prompt.getBoundingClientRect=()=>{measurements++;throw Error('Ordinary frames must reuse prompt bounds');};
      host.querySelector=()=>{queries++;throw Error('Ordinary frames must reuse the anchor');};
      document.querySelector=()=>{queries++;throw Error('Ordinary frames must reuse HUD bounds');};
      try {for(let frame=0;frame<60;frame++)onboarding.tick(.001,marine);}
      finally {host.getBoundingClientRect=hostMeasure;prompt.getBoundingClientRect=promptMeasure;host.querySelector=hostQuery;document.querySelector=documentQuery;}
      return {center:(rect.left+rect.right)/2,anchor:(bank.left+bank.right)/2,measurements,queries};
    });
    expect(recovery.center).toBeCloseTo(recovery.anchor,2);
    expect(recovery.measurements).toBe(0);expect(recovery.queries).toBe(0);
  } finally {await page.close();}
});
