import {expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
const probe=vi.hoisted(()=>({imports:0,rooms:vi.fn(),add:vi.fn(),dispose:vi.fn(),quality:vi.fn()}));
vi.mock('../src/render/DeathRagdolls',()=>{
  probe.imports++;
  return {initDeathPhysics:async()=>{},DeathRagdolls:class {
    setQuality=probe.quality;setRoom=probe.rooms;add=probe.add;dispose=probe.dispose;
    has(){return false;}
  }};
});
it('keeps early deaths on the existing fallback and attaches physics to the latest room only after readiness',async()=>{
  const {DeathRagdolls,warmDeathPhysics}=await import('../src/ui/loading/DeferredRagdolls');
  const ragdolls=new DeathRagdolls();expect(probe.imports).toBe(0);
  const room={width:1280,height:720,obstacles:[]} as any;
  ragdolls.setRoom(room);ragdolls.setQuality('low');ragdolls.add(1,{} as any,'crawler',{x:1,z:1});
  expect(ragdolls.has(1)).toBe(false);expect(ragdolls.snapshot().bodies).toBe(0);
  await warmDeathPhysics();expect(probe.imports).toBe(1);expect(probe.rooms).toHaveBeenCalledWith(room);
  expect(probe.quality).toHaveBeenCalledWith('low');expect(probe.add).not.toHaveBeenCalled();
  ragdolls.add(2,{} as any,'crawler',{x:1,z:1});expect(probe.add).toHaveBeenCalledTimes(1);
  ragdolls.dispose();expect(probe.dispose).toHaveBeenCalledOnce();
});
it('starts assets beside renderer/audio downloads, bypasses blocking physics, and warms only after rendering',()=>{
  const app=readFileSync(new URL('../src/ui/application.ts',import.meta.url),'utf8');
  expect(app.indexOf("import('../render/DepthRenderer')")).toBeLessThan(app.indexOf('await preloadAssets'));
  expect(app).toContain('}, async()=>{});');
  expect(app.indexOf('renderer.render(game')).toBeLessThan(app.indexOf('void warmDeathPhysics()'));
  const renderer=readFileSync(new URL('../src/render/DepthRenderer.ts',import.meta.url),'utf8');
  expect(renderer).toContain('if(this.ragdolls.has(c.id))');expect(renderer).toContain('game.moveCorpse(');expect(renderer).toContain('c.lift-=9.8*dt');
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');expect(html).toContain('href="./assets/models/marine.glb"');
});
