import {beforeAll,afterAll,it,expect} from 'vitest';
import {startHudHarness,stopHudHarness,mountHud} from './HudHarness';
beforeAll(startHudHarness);afterAll(stopHudHarness);
it('every fan-out candidate yields to onboarding and beat rectangles',async()=>{
  const page=await mountHud(1280,720);try{
    const result=await page.evaluate(async()=>{
      const load=new Function('p','return import(p)') as (p:string)=>Promise<any>;
      const {CombatText}=await load('/src/ui/hud/CombatText.ts');const {setPresentationObstacle}=await load('/src/ui/hud/layout.ts');
      const renderer={canvas:document.getElementById('world'),worldToScreen:()=>({x:600,y:400})};
      const text=new CombatText(document.getElementById('combat-text'),renderer);
      const obstacles=[{left:490,right:565,top:345,bottom:400},{left:650,right:720,top:300,bottom:400}];
      obstacles.forEach((box,i)=>setPresentationObstacle('f2-'+i,box));
      for(const targetId of [1,2,3])text.effect({type:'hit',x:100,y:100,targetId,damage:10,source:'weapon'});
      text.tick(0,{left:0,right:10,top:0,bottom:10});
      const receipts=text.pool.filter((p:any)=>p.life>0).map((p:any)=>({hidden:p.node.hidden,left:p.placedX,right:p.placedX+p.width,top:p.placedY,bottom:p.placedY+p.height}));
      obstacles.forEach((_,i)=>setPresentationObstacle('f2-'+i,null));text.dispose();return {receipts,obstacles};
    });
    expect(result.receipts).toHaveLength(3);
    for(const receipt of result.receipts){expect(receipt.hidden).toBe(false);for(const b of result.obstacles)expect(receipt.left<b.right+6&&receipt.right>b.left-6&&receipt.top<b.bottom+6&&receipt.bottom>b.top-6).toBe(false);}
  }finally{await page.close();}
});
it('pointer movement never measures ability anchors or tooltip layout',async()=>{
  const page=await mountHud(1280,720);try{
    const result=await page.evaluate(async()=>{
      const load=new Function('p','return import(p)') as (p:string)=>Promise<any>;
      const {AbilityHints}=await load('/src/ui/hud/AbilityHints.ts');
      document.getElementById('ability-bar')!.hidden=false;
      const entries=['dash','tactical','power','overdrive'].map(slot=>({slot,node:document.querySelector(`[data-ability="${slot}"]`)!}));
      const hints=new AbilityHints(entries);hints.tick({left:0,right:10,top:0,bottom:10},true);
      const box=entries[0].node.getBoundingClientRect();let reads=0;
      const original=Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect=function(){reads++;return original.call(this);};
      let passiveVisible=false;
      try{for(let i=0;i<100;i++)document.dispatchEvent(new PointerEvent('pointermove',{pointerType:'mouse',clientX:box.left+1,clientY:box.top+1}));
        passiveVisible=entries[0].node.querySelector('.ability-tooltip')?.hasAttribute('hidden')===false;
        document.dispatchEvent(new KeyboardEvent('keydown',{code:'AltLeft',key:'Alt'}));
      }finally{Element.prototype.getBoundingClientRect=original;}
      const visible=entries[0].node.querySelector('.ability-tooltip')?.hasAttribute('hidden')===false;
      hints.dispose();return {reads,visible,passiveVisible};
    });
    expect(result).toEqual({reads:0,passiveVisible:false,visible:true});
  }finally{await page.close();}
});
