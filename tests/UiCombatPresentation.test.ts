import {afterAll, beforeAll, expect, it} from 'vitest';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
import {chromium, type Browser, type Page} from 'playwright';
import {uiCss} from './uiSource';

let browser: Browser;
let controller = '';
let css = '';
const rootPath = fileURLToPath(new URL('../', import.meta.url));
const entry = '\0containment-combat-presentation-tests';
beforeAll(async () => {
  const result = await build({configFile: false, logLevel: 'silent', plugins: [{
    name: 'combat-presentation-test-entry',
    resolveId: id => id === entry ? entry : undefined,
    load: id => id === entry ? `import {HitConfirmation} from ${JSON.stringify(rootPath + 'src/ui/hud/HitConfirmation.ts')};
      import {CombatText} from ${JSON.stringify(rootPath + 'src/ui/hud/CombatText.ts')};
      import {positionHudPanels} from ${JSON.stringify(rootPath + 'src/ui/hud/layout.ts')};
      import ${JSON.stringify(rootPath + 'src/ui/styles/reticle.css')};
      import ${JSON.stringify(rootPath + 'src/ui/styles/combat-text.css')};
      window.combatPresentation={HitConfirmation,CombatText,positionHudPanels};` : undefined,
  }], build: {write: false, minify: false, rollupOptions: {input: entry, output: {format: 'iife'}}, target: 'es2022'}});
  for (const item of Array.isArray(result) ? result : [result]) {
    if (!('output' in item)) continue;
    for (const file of item.output) {
      if (file.type === 'chunk') controller += file.code;
      else if (file.fileName.endsWith('.css')) css += String(file.source);
    }
  }
  browser = await chromium.launch({executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, args: ['--no-sandbox', '--disable-gpu', '--disable-webgl']});
}, 30_000);
afterAll(async () => {await browser?.close();});

async function mount(reduced = false): Promise<Page> {
  const page = await browser.newPage({viewport: {width: 1280, height: 720}});
  await page.emulateMedia({reducedMotion: reduced ? 'reduce' : 'no-preference'});
  await page.setContent(`<style>${uiCss}${css}#world{position:fixed;inset:0;width:100vw;height:100vh}body{background:#edf7fc}</style><body data-state="playing"><div id="world"></div><div id="hit-confirmation" hidden></div><div id="combat-text"></div></body>`);
  await page.addScriptTag({content: controller});
  await page.evaluate(() => {
    const api = (window as any).combatPresentation;
    const marker = new api.HitConfirmation(document.getElementById('hit-confirmation'));
    const renderer = {canvas: document.getElementById('world'), worldToScreen: (x: number, y: number) => ({x, y})};
    const combat = new api.CombatText(document.getElementById('combat-text'), renderer);
    (window as any).combatTest = {marker, combat, player: {left: 610, right: 670, top: 300, bottom: 440}};
    marker.snapshot({playing: true, spreadRadians: .08}); marker.point(900, 300); marker.update(0, true);
  });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

it('uses a closed keyed silhouette and independent continuous spread ring with a fixed luminous core, with reload progress independent of confirmation', async () => {
  const page = await mount();
  try {
    const marker = page.locator('#hit-confirmation');
    expect(await marker.locator('.reticle-core circle.reticle-arc').count()).toBe(1);
    expect(await marker.locator('.reticle-spread circle.reticle-spread-ring').count()).toBe(1);
    expect(await marker.locator('.reticle-core .reticle-outline').count()).toBe(1);
    expect(await marker.locator('.reticle-spread .reticle-outline').count()).toBe(1);
    const styles = await marker.evaluate(element => ({
      border: getComputedStyle(element).borderTopWidth,
      pointer: getComputedStyle(element).pointerEvents,
      core: getComputedStyle(element.querySelector('.reticle-dot')!).backgroundColor,
      coreOutline: getComputedStyle(element.querySelector('.reticle-dot')!).boxShadow,
      stroke: getComputedStyle(element.querySelector('.reticle-arc')!).stroke,
      outline: getComputedStyle(element.querySelector('.reticle-outline')!).stroke,
    }));
    expect(styles).toMatchObject({border: '0px', pointer: 'none', core: 'rgb(255, 255, 255)', stroke: 'rgb(223, 248, 255)', outline: 'rgb(3, 16, 24)'});
    expect(styles.coreOutline).toContain('rgb(3, 16, 24)');
    const initialCore = (await marker.locator('.reticle-dot').boundingBox())!;
    const nodes = await marker.locator('*').count();
    await page.evaluate(() => {(window as any).combatTest.marker.snapshot({spreadRadians: .24, bloomRadians: .04, reloading: true, reloadProgress: .5});});
    expect((await marker.boundingBox())!.width).toBe(40);
    expect((await marker.locator('.reticle-spread').boundingBox())!.width).toBe(62);
    expect(await marker.evaluate(el=>Number(getComputedStyle(el).zIndex))).toBeGreaterThan(100);
    expect((await marker.locator('.reticle-dot').boundingBox())!.width).toBe(initialCore.width);
    expect(await marker.locator('.reticle-reload-progress').evaluate(element => (element as SVGElement).style.strokeDashoffset)).toBe('50');
    await page.evaluate(() => {(window as any).combatTest.marker.confirm('damage', true);});
    expect(await marker.getAttribute('data-kill')).toBe('true');
    await page.evaluate(() => {(window as any).combatTest.marker.update(.3, true);});
    expect(await marker.isVisible()).toBe(true);
    expect(await marker.locator('.reticle-contact').evaluate(element => getComputedStyle(element).opacity)).toBe('0');
    expect(await marker.getAttribute('data-kill')).toBe('false');
    expect(await marker.locator('*').count()).toBe(nodes);
    await page.evaluate(() => {(window as any).combatTest.marker.snapshot({reloading: true, reloadProgress: 1});});
    expect(await marker.locator('.reticle-reload-progress').evaluate(element => (element as SVGElement).style.strokeDashoffset)).toBe('0');
    await page.evaluate(() => {(window as any).combatTest.marker.clear(); (window as any).combatTest.marker.snapshot({playing: true});});
    expect(await marker.isHidden()).toBe(true);
  } finally {await page.close();}
});

it('keeps aim legible on bright and dark surfaces, honors screen state and disables motion emphasis', async () => {
  const page = await mount(true);
  try {
    for (const color of ['#edf7fc', '#050b10']) {
      await page.evaluate(color => document.body.style.background = color, color);
      expect(await page.locator('#hit-confirmation').evaluate(element => getComputedStyle(element).opacity)).toBe('1');
      expect(await page.locator('.reticle-dot').isVisible()).toBe(true);
    }
    await page.evaluate(() => {(window as any).combatTest.marker.confirm('damage', true);});
    expect(await page.locator('.reticle-contact').evaluate(element => getComputedStyle(element).transform)).toBe('none');
    for (const state of ['paused', 'menu', 'reward', 'dead']) {
      await page.evaluate(state => document.body.dataset.state = state, state);
      expect(await page.locator('#hit-confirmation').isVisible()).toBe(false);
    }
    await page.evaluate(() => {document.body.dataset.state = 'playing'; (window as any).combatTest.marker.update(0, false);});
    expect(await page.locator('#hit-confirmation').isVisible()).toBe(false);
  } finally {await page.close();}
});

it('renders element damage as outlined condensed numerals and makes critical/lethal events larger', async () => {
  const page = await mount();
  try {
    await page.evaluate(() => {
      const {combat, player} = (window as any).combatTest;
      combat.effect({type: 'hit', x: 350, y: 300, targetId: 1, damage: 24, elements: ['ice']});
      combat.effect({type: 'hit', x: 500, y: 300, targetId: 2, damage: 48, critical: true, elements: ['fire']});
      combat.effect({type: 'acid', contact: 'damage', x: 850, y: 300, targetId: 3, damage: 96, lethal: true});
      combat.tick(.05, player);
    });
    const normal = page.locator('.combat-float[data-kind=damage][data-element=ice]:not([hidden])');
    const critical = page.locator('.combat-float[data-kind=damage][data-critical=true]:not([hidden])');
    const lethal = page.locator('.combat-float[data-kind=damage][data-lethal=true]:not([hidden])');
    expect(await normal.textContent()).toBe('24');
    expect(await critical.textContent()).toBe('48');
    expect(await lethal.textContent()).toBe('96 ×');
    const normalStyle = await normal.evaluate(element => {const style = getComputedStyle(element); return {size: style.fontSize, color: style.color, background: style.backgroundColor, shadow: style.textShadow, font: style.fontFamily, pointer: style.pointerEvents};});
    expect(normalStyle).toMatchObject({size: '34px', color: 'rgb(127, 214, 255)', background: 'rgba(0, 0, 0, 0)', pointer: 'none'});
    expect(normalStyle.font).toContain('Barlow Condensed');
    expect(normalStyle.shadow).not.toBe('none');
    expect(await critical.evaluate(element => getComputedStyle(element).fontSize)).toBe('40px');
    expect(await lethal.evaluate(element => getComputedStyle(element).fontSize)).toBe('42px');
    expect(await page.locator('.combat-float[data-kind=status]:not([hidden])').allTextContents()).toEqual(['CHILLED', 'BURNING']);
  } finally {await page.close();}
});

it('preserves same-element merges and separates acid from neutral totals, with bounded pooling, projection culling and player clearance', async () => {
  const page = await mount();
  try {
    await page.evaluate(() => {
      const {combat, player} = (window as any).combatTest;
      for (let i = 0; i < 5; i++) combat.effect({type: i < 2 ? 'acid' : 'hit', contact: 'damage', x: 640, y: 360, id: 1, damage: 12});
      combat.tick(.13, player);
    });
    const visible = page.locator('.combat-float:not([hidden])');
    expect(await visible.count()).toBe(2);
    expect(await visible.allTextContents()).toEqual(['24', '36']);
    for (const entry of await visible.all()) {
      const number = (await entry.boundingBox())!;
      expect(number.y + number.height).toBeLessThan(300);
    }
    await page.evaluate(() => {
      const {combat, player} = (window as any).combatTest;
      combat.clear();
      combat.effect({type: 'hit', x: -10000, y: 360, id: 2, damage: 100});
      combat.effect({type: 'hit', x: 300, y: 300, id: 3});
      combat.tick(.01, player);
    });
    expect(await visible.count()).toBe(0);
    await page.evaluate(() => {
      const {combat, player} = (window as any).combatTest;
      for (let i = 0; i < 100; i++) combat.effect({type: 'hit', x: 100 + i * 5, y: 500, id: i + 10, damage: 5});
      combat.tick(.01, player);
    });
    expect(await page.locator('.combat-float').count()).toBe(12);
    expect(await visible.count()).toBeLessThanOrEqual(12);
    await page.evaluate(() => {(window as any).combatTest.combat.setEnabled(false);});
    expect(await visible.count()).toBe(0);
    await page.evaluate(() => {(window as any).combatTest.combat.dispose();});
    expect(await page.locator('.combat-float').count()).toBe(0);
    await page.evaluate(() => {(window as any).combatTest.combat.effect({type: 'hit', x: 350, y: 350, damage: 100});});
    expect(await page.locator('.combat-float').count()).toBe(0);
  } finally {await page.close();}
});

it('rises and fades quickly while reduced motion holds positions and lifecycle remains bounded', async () => {
  const page = await mount();
  try {
    const add = () => page.evaluate(() => {const {combat, player} = (window as any).combatTest; combat.clear(); combat.effect({type: 'hit', x: 350, y: 450, id: 1, damage: 28}); combat.tick(.01, player);});
    await add();
    const visible = page.locator('.combat-float:not([hidden])');
    const first = (await visible.boundingBox())!;
    await page.evaluate(() => {const {combat, player} = (window as any).combatTest; combat.tick(.15, player);});
    expect((await visible.boundingBox())!.y).toBeLessThan(first.y - 8);
    await page.emulateMedia({reducedMotion: 'reduce'});
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await add();
    const reduced = (await visible.boundingBox())!;
    await page.evaluate(() => {const {combat, player} = (window as any).combatTest; combat.tick(.6, player);});
    expect((await visible.boundingBox())!.y).toBe(reduced.y);
    expect(Number(await visible.evaluate(element => getComputedStyle(element).opacity))).toBeLessThan(1);
    await page.evaluate(() => {const {combat, player} = (window as any).combatTest; combat.tick(.2, player);});
    expect(await visible.count()).toBe(0);
  } finally {await page.close();}
});


it('keeps large critical and lethal numerals clear of the marine at desktop edges', async () => {
  const page = await mount();
  try {
    for (const box of [
      {left: 610, right: 670, top: 300, bottom: 440},
      {left: 20, right: 100, top: 0, bottom: 110},
      {left: 1180, right: 1260, top: 610, bottom: 720},
    ]) {
      await page.evaluate(player => {
        const {combat} = (window as any).combatTest;
        combat.clear();
        combat.effect({type: 'hit', x: (player.left + player.right) / 2, y: (player.top + player.bottom) / 2, id: 1, damage: 12345, critical: true, lethal: true});
        combat.tick(.01, player);
      }, box);
      const number = (await page.locator('.combat-float:not([hidden])').boundingBox())!;
      expect(number.x >= 0 && number.y >= 0 && number.x + number.width <= 1280 && number.y + number.height <= 720).toBe(true);
      expect(number.x < box.right && number.x + number.width > box.left && number.y < box.bottom && number.y + number.height > box.top).toBe(false);
    }
  } finally {await page.close();}
});

it('keeps damage feedback from painting over opaque ship furniture', async () => {
  const page=await mount();
  try {
    await page.evaluate(()=>{
      const {combat,player}=(window as any).combatTest;
      const header=document.createElement('div');header.id='status-hud';header.style.cssText='position:fixed;right:32px;top:32px;width:300px;height:160px';document.body.append(header);
      (window as any).combatPresentation.positionHudPanels(player,innerWidth,innerHeight);
      combat.effect({type:'hit',x:1100,y:135,id:1,damage:24});
      combat.effect({type:'hit',x:800,y:260,id:2,damage:78});
      combat.tick(.01,player);
    });
    expect(await page.locator('.combat-float:not([hidden])').allTextContents()).toEqual(['78']);
  } finally {await page.close();}
});

it('styles confirmed damage by source, merges receipts per target/source, and preserves kill emphasis', async () => {
  const page = await mount();
  try {
    await page.evaluate(() => {
      const {combat, player} = (window as any).combatTest;
      for (const [index, source] of ['weapon', 'ability', 'status', 'boon'].entries()) {
        for (let receipt = 0; receipt < 20; receipt++) combat.effect({type:'acid',contact:'damage',x:200+index*200,y:260,targetId:index,damage:2,source,lethal:source==='boon'&&receipt===19});
      }
      combat.tick(.13,player);
    });
    expect(await page.locator('.combat-float[data-kind=damage]:not([hidden])').count()).toBe(4);
    for (const source of ['weapon','ability','status','boon']) {
      const node = page.locator(`.combat-float[data-source=${source}]:not([hidden])`);
      expect(await node.textContent()).toBe(source==='boon'?'40 ×':'40');
      expect(await node.getAttribute('data-element')).toBe(source === 'weapon' ? 'weapon' : '');
      expect(await node.getAttribute('data-damage-token')).toBe('neutral');
      expect(await node.evaluate(element => getComputedStyle(element).color)).toBe('rgb(240, 251, 255)');
    }
    expect(await page.locator('[data-source=ability]:not([hidden])').evaluate(node=>getComputedStyle(node).textDecorationLine)).toBe('underline');
    expect(await page.locator('[data-source=status]:not([hidden])').evaluate(node=>getComputedStyle(node).fontStyle)).toBe('italic');
    expect(await page.locator('[data-source=boon]:not([hidden])').evaluate(node=>getComputedStyle(node).fontSize)).toBe('42px');
  } finally {await page.close();}
});

it('keeps one most-relevant compact status chip per target while preserving independent damage receipts', async () => {
  const page=await mount();
  try {
    await page.evaluate(()=>{
      const {combat,player}=(window as any).combatTest;
      for(const elements of [['ice'],['fire'],['freeze'],['poison']])combat.effect({type:'hit',x:380,y:300,targetId:1,damage:12,elements});
      combat.effect({type:'hit',x:800,y:300,targetId:2,damage:18,elements:['fire']});
      combat.tick(.01,player);
    });
    const chips=page.locator('.combat-float[data-kind=status]:not([hidden])');
    expect(await chips.allTextContents()).toEqual(['FROZEN','BURNING']);
    expect(await chips.first().getAttribute('aria-label')).toBe('FROZEN');
    expect((await chips.first().boundingBox())!.width).toBeLessThanOrEqual(12);
    expect(await chips.locator('svg:not([hidden])').count()).toBe(2);
    expect(await page.locator('.combat-float[data-kind=damage]:not([hidden])').allTextContents()).toEqual(['12','12','12','12','18']);
  } finally {await page.close();}
});

it('coalesces sustained zone pulses and spatial status labels until a quiet gap', async () => {
  const page = await mount();
  try {
    await page.evaluate(() => {
      const {combat,player}=(window as any).combatTest;
      for(let pulse=0;pulse<20;pulse++) {
        combat.effect({type:'hit',x:350,y:300,targetId:1,damage:4,source:'ability'});
        combat.effect({type:'boon',x:350+(pulse%2)*30,y:300,boon:'ice'});
        combat.tick(.25,player);
      }
    });
    expect(await page.locator('.combat-float[data-kind=damage]:not([hidden])').allTextContents()).toEqual(['80']);
    expect(await page.locator('.combat-float[data-kind=status]:not([hidden])').allTextContents()).toEqual(['CHILLED']);
    await page.evaluate(() => {const {combat,player}=(window as any).combatTest;combat.tick(.8,player);});
    expect(await page.locator('.combat-float:not([hidden])').count()).toBe(0);
  } finally {await page.close();}
});

it('fans clustered target receipts into separate readable boxes and gives statuses an icon chip', async () => {
  const page = await mount();
  try {
    await page.evaluate(() => {
      const {combat,player}=(window as any).combatTest;
      for(let id=0;id<8;id++) combat.effect({type:'hit',x:350+id*3,y:500+id*2,targetId:id,damage:30+id,source:'weapon'});
      combat.effect({type:'boon',x:350,y:500,boon:'ice'});
      combat.tick(.01,player);
    });
    const receipts=page.locator('.combat-float:not([hidden])');
    expect(await receipts.count()).toBe(9);
    const boxes=await receipts.evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};}));
    for(let a=0;a<boxes.length;a++) for(let b=a+1;b<boxes.length;b++) {
      const x=boxes[a],y=boxes[b];
      expect(x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top).toBe(false);
    }
    const status=page.locator('.combat-float[data-kind=status]:not([hidden])');
    expect(await status.locator('svg:not([hidden])').count()).toBe(1);
    expect(await status.locator(':scope > span:last-child').textContent()).toBe('CHILLED');
    expect(await status.evaluate(node=>getComputedStyle(node).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
    expect(await status.evaluate(node=>getComputedStyle(node).pointerEvents)).toBe('none');
  } finally {await page.close();}
});

it('uses optional projected actor height to scale feedback while preserving the same bounded pool', async () => {
  const page=await mount();
  try {
    await page.evaluate(()=>{
      const {combat,player}=(window as any).combatTest;
      combat.renderer.worldToScreen=(x:number,y:number,height=0)=>({x,y:y-height*60});
      combat.effect({type:'hit',x:350,y:450,targetId:1,damage:28});combat.tick(.01,player);
    });
    const receipt=page.locator('.combat-float:not([hidden])');
    expect(await receipt.evaluate(node=>parseFloat(getComputedStyle(node).fontSize))).toBe(42.5);
    expect(await receipt.evaluate(node=>(node as HTMLElement).style.getPropertyValue('--actor-scale'))).toBe('1.25');
    expect(await page.locator('.combat-float').count()).toBe(12);
  } finally {await page.close();}
});

it('reuses preallocated status icon children throughout repeated elemental pulses', async () => {
  const page=await mount();
  try {
    const result=await page.evaluate(()=>{
      const {combat,player}=(window as any).combatTest;
      combat.effect({type:'boon',x:350,y:450,boon:'ice'});combat.tick(.01,player);
      const glyph=document.querySelector('.combat-float[data-kind=status] svg:not([hidden])');
      const count=document.querySelectorAll('#combat-text *').length;
      for(let i=0;i<20;i++){combat.effect({type:'boon',x:350,y:450,boon:'ice'});combat.tick(.1,player);}
      return {reused:glyph===document.querySelector('.combat-float[data-kind=status] svg:not([hidden])'),before:count,after:document.querySelectorAll('#combat-text *').length};
    });
    expect(result.reused).toBe(true);expect(result.after).toBe(result.before);
  } finally {await page.close();}
});


it('uses actual elemental tokens for damage and chips while weapon hits stay white and kills keep their element', async () => {
  const page = await mount();
  try {
    const receipts = [
      {element:'burn', color:'rgb(255, 122, 46)', token:'pyro'},
      {element:'shatter', color:'rgb(127, 214, 255)', token:'cryo'},
      {element:'arc', color:'rgb(183, 156, 255)', token:'arc'},
      {element:'kinetic', color:'rgb(255, 180, 84)', token:'kinetic'},
      {element:'poison', color:'rgb(157, 255, 90)', token:'acid'},
      {element:'heal', color:'rgb(140, 230, 195)', token:'healing'},
    ];
    for (const {element,color,token} of receipts) {
      await page.evaluate(element => {
        const {combat,player} = (window as any).combatTest;
        combat.clear();
        combat.effect({type:'hit', x:320, y:280, targetId:1, damage:12, source:'status', damageElement:element, lethal:true});
        combat.effect({type:'hit', x:840, y:280, targetId:2, damage:12, source:'weapon', elements:[element]});
        if (['burn','shatter','arc','poison'].includes(element)) combat.effect({type:'boon',x:320,y:280,boon:element});
        combat.tick(.01,player);
      }, element);
      const elemental = page.locator('.combat-float[data-kind=damage][data-source=status]:not([hidden])');
      expect(await elemental.getAttribute('data-damage-token')).toBe(token);
      expect(await elemental.evaluate(node=>getComputedStyle(node).color)).toBe(color);
      expect(await elemental.textContent()).toBe('12 ×');
      expect(await elemental.evaluate(node=>getComputedStyle(node).fontWeight)).toBe('800');
      expect(await page.locator('.combat-float[data-kind=damage][data-source=weapon]:not([hidden])').evaluate(node=>getComputedStyle(node).color)).toBe('rgb(240, 251, 255)');
      const chip = page.locator(`.combat-float[data-kind=status][data-element="${element}"]:not([hidden])`);
      for (const actual of await chip.evaluateAll(nodes=>nodes.map(node=>getComputedStyle(node).color))) expect(actual).toBe(color);
    }
  } finally {await page.close();}
});

it('U5 counts a single running total through a 600 ms window, then emphasizes and replaces the resolved receipt', async () => {
  const page = await mount();
  try {
    const values = await page.evaluate(() => {
      const {combat, player} = (window as any).combatTest;
      combat.effect({type:'hit',x:350,y:350,targetId:7,damage:10,source:'ability',damageElement:'cryo'});
      combat.tick(.2,player);
      combat.effect({type:'hit',x:350,y:350,targetId:7,damage:20,source:'ability',damageElement:'cryo'});
      combat.tick(.03,player);
      const node = document.querySelector('.combat-float[data-kind=damage]:not([hidden])') as HTMLElement;
      const during = {text:Number(node.textContent), total:node.dataset.total, settled:node.dataset.settled};
      combat.tick(.1,player);
      const counted = node.textContent;
      combat.tick(.5,player);
      const resolved = {text:node.textContent, settled:node.dataset.settled};
      combat.effect({type:'hit',x:350,y:350,targetId:7,damage:4,source:'ability',damageElement:'cryo'});
      combat.tick(.01,player);
      return {during,counted,resolved,replaced:node.textContent,count:document.querySelectorAll('.combat-float[data-kind=damage]:not([hidden])').length};
    });
    expect(values.during.total).toBe('30');
    expect(values.during.text).toBeGreaterThan(10); expect(values.during.text).toBeLessThan(30);
    expect(values.during.settled).toBe('false'); expect(values.counted).toBe('30');
    expect(values.resolved).toEqual({text:'30',settled:'true'});
    expect(values.replaced).toBe('4'); expect(values.count).toBe(1);
  } finally {await page.close();}
});

it('U5 prioritizes kills and large hits over ticks and keeps only one terminal mark per target', async () => {
  const page = await mount();
  try {
    const state = await page.evaluate(() => {
      const {combat,player} = (window as any).combatTest;
      for(let id=0;id<12;id++) combat.effect({type:'hit',x:160+id*75,y:420,targetId:id,damage:2,source:'status'});
      combat.effect({type:'hit',x:350,y:350,targetId:40,damage:70,source:'ability'});
      combat.effect({type:'hit',x:500,y:350,targetId:41,damage:3,source:'status',elements:['ice']});
      combat.effect({type:'hit',x:500,y:350,targetId:41,damage:5,source:'ability',lethal:true,damageElement:'cryo'});
      for(let id=60;id<90;id++) combat.effect({type:'hit',x:150,y:400,targetId:id,damage:1,source:'status'});
      combat.effect({type:'hit',x:500,y:350,targetId:41,damage:1,source:'status'});
      combat.tick(.13,player);
      const alive = Array.from(document.querySelectorAll('.combat-float')).filter(node=>!(node as HTMLElement).hidden) as HTMLElement[];
      return {pool:document.querySelectorAll('.combat-float').length,big:alive.some(n=>n.dataset.target==='40'),kill:alive.filter(n=>n.dataset.target==='41').map(n=>({text:n.textContent,lethal:n.dataset.lethal}))};
    });
    expect(state.pool).toBe(12); expect(state.big).toBe(true);
    expect(state.kill).toEqual([{text:'5 ×',lethal:'true'}]);
  } finally {await page.close();}
});

it('U5 reduced feedback suppresses chips and small status ticks, preserves totals and kills, and off clears everything', async () => {
  const page = await mount(true);
  try {
    await page.evaluate(() => {
      const {combat,player} = (window as any).combatTest;
      combat.setReduced(true);
      combat.effect({type:'hit',x:350,y:350,targetId:1,damage:4,source:'status',elements:['ice']});
      combat.effect({type:'hit',x:500,y:350,targetId:2,damage:4,source:'weapon'});
      combat.effect({type:'hit',x:850,y:350,targetId:3,damage:2,source:'status',lethal:true});
      combat.tick(.01,player);
    });
    expect(await page.locator('.combat-float[data-kind=status]:not([hidden])').count()).toBe(0);
    expect(await page.locator('.combat-float:not([hidden])').allTextContents()).toEqual(['4','2 ×']);
    await page.evaluate(() => {
      const {combat,player} = (window as any).combatTest;
      combat.effect({type:'hit',x:350,y:350,targetId:1,damage:30,source:'status'});combat.tick(.01,player);
    });
    expect(await page.locator('.combat-float[data-target="1"]:not([hidden])').textContent()).toBe('34');
    await page.evaluate(() => (window as any).combatTest.combat.setEnabled(false));
    expect(await page.locator('.combat-float:not([hidden])').count()).toBe(0);
  } finally {await page.close();}
});
