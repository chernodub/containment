import {afterEach, describe, expect, it, vi} from 'vitest';
import {InputController} from '../src/InputController';
import type {DepthGame} from '../src/DepthGame';
import type {DepthRenderer} from '../src/render/DepthRenderer';

class Surface extends EventTarget {
  setPointerCapture = vi.fn();
}
type KeyOptions = {
  type?: 'keydown' | 'keyup';
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  repeat?: boolean;
  typing?: boolean;
};
afterEach(()=>vi.unstubAllGlobals());

function fixture() {
  const doc=Object.assign(new Surface(),{hidden:false});
  const win=new Surface(), canvas=new Surface();
  vi.stubGlobal('document',doc);
  vi.stubGlobal('window',win);
  const game={
    status:'playing',
    player:{x:0,y:0,angle:0},
    abilities:{setIntent:vi.fn()},
    setAimPoint:vi.fn(),
    useAbility:vi.fn(()=>true),
    reload:vi.fn(),
    grenade:vi.fn(),
    heal:vi.fn(),
    switchWeapon:vi.fn(),
    targets:()=>[],
  };
  const pause=vi.fn();
  let ready=true;
  const input=new InputController(game as unknown as DepthGame,
    {canvas,pointer:()=>null} as unknown as DepthRenderer,pause,()=>ready);
  const key=(name:string,code?:string,options:KeyOptions={})=>{
    const {type='keydown',typing=false,...flags}=options;
    const event=Object.assign(new Event(type,{cancelable:true}),{
      key:name,repeat:false,ctrlKey:false,metaKey:false,altKey:false,shiftKey:false,
      ...(code===undefined?{}:{code}),...flags,
    });
    Object.defineProperty(event,'target',{value:{matches:()=>typing,isContentEditable:false}});
    doc.dispatchEvent(event);
    return event;
  };
  const pointer=(type:string,button=0)=>canvas.dispatchEvent(Object.assign(new Event(type),{
    pointerType:'mouse',button,pointerId:7,clientX:100,clientY:200,
  }));
  return {game,doc,win,canvas,pause,input,key,pointer,loading:()=>{ready=false;}};
}

const bindings=[
  ['Shift','ShiftLeft'],['Shift','ShiftRight'],['q','KeyQ'],['f','KeyF'],['v','KeyV'],
  ['r','KeyR'],['g','KeyG'],['e','KeyE'],
  ['1','Digit1'],['2','Digit2'],['3','Digit3'],['4','Digit4'],['5','Digit5'],
  ['w','KeyW'],['a','KeyA'],['s','KeyS'],['d','KeyD'],
  ['ArrowUp','ArrowUp'],['ArrowDown','ArrowDown'],['ArrowLeft','ArrowLeft'],['ArrowRight','ArrowRight'],
  [' ','Space'],['Escape','Escape'],
] as const;

function expectNoActions(f:ReturnType<typeof fixture>) {
  for(const action of [f.game.useAbility,f.game.reload,f.game.grenade,f.game.heal,f.game.switchWeapon,f.pause]) {
    expect(action).not.toHaveBeenCalled();
  }
  expect(f.input.read()).toMatchObject({x:0,y:0,autoAim:false,fire:false});
}

describe('review: physical desktop bindings',()=>{
  it('switches every weapon by physical digit while Shift changes the printed character',()=>{
    const f=fixture();
    f.key('Shift','ShiftLeft',{shiftKey:true});
    ['!','@','#','$','%'].forEach((printed,index)=>f.key(printed,`Digit${index+1}`,{shiftKey:true}));
    expect(f.game.switchWeapon.mock.calls).toEqual([
      ['pistol'],['rifle'],['shotgun'],['plasma'],['rocket'],
    ]);
    expect(f.game.useAbility).toHaveBeenCalledExactlyOnceWith('dash');
  });

  it.each([
    ['й','KeyQ','tactical'],['а','KeyF','power'],['м','KeyV','overdrive'],
    ['Shift','ShiftLeft','dash'],['Shift','ShiftRight','dash'],
  ] as const)('uses physical %s / %s for %s regardless of layout', (name,code,slot)=>{
    const f=fixture();
    f.key(name,code);f.key(name,code);f.key(name,code,{repeat:true});
    expect(f.game.useAbility).toHaveBeenCalledExactlyOnceWith(slot);
    f.key(name,code,{type:'keyup'});f.key(name,code);
    expect(f.game.useAbility).toHaveBeenCalledTimes(2);
  });

  it('uses physical non-Latin movement, reload, grenade and healing keys',()=>{
    const f=fixture();
    f.key('ц','KeyW');expect(f.input.read().y).toBeLessThan(0);
    f.key('Ц','KeyW',{type:'keyup'});expect(f.input.read().y).toBe(0);
    f.key('ф','KeyA');expect(f.input.read().x).toBe(-1);f.key('ф','KeyA',{type:'keyup'});
    f.key('ы','KeyS');expect(f.input.read().y).toBeGreaterThan(0);f.key('ы','KeyS',{type:'keyup'});
    f.key('в','KeyD');expect(f.input.read().x).toBe(1);f.key('В','KeyD',{type:'keyup'});
    f.key('к','KeyR');f.key('п','KeyG');f.key('у','KeyE');
    expect(f.game.reload).toHaveBeenCalledTimes(1);
    expect(f.game.grenade).toHaveBeenCalledTimes(1);
    expect(f.game.heal).toHaveBeenCalledTimes(1);
  });

  it('treats a supplied physical code as authoritative and falls back only when it is missing',()=>{
    const f=fixture();
    f.key('q','KeyX');f.key('f','Unidentified');f.key('d','Numpad6');f.key('1','Numpad1');
    expectNoActions(f);
    f.key('q');expect(f.game.useAbility).toHaveBeenCalledExactlyOnceWith('tactical');
    f.key('d','');expect(f.input.read().x).toBe(1);
    f.key('d','',{type:'keyup'});expect(f.input.read().x).toBe(0);
  });

  it('keeps arrow and Space prevention and Escape pause semantics for unmodified physical events',()=>{
    const f=fixture();
    for(const code of ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight']) {
      expect(f.key('Unidentified',code).defaultPrevented).toBe(true);
      f.key('Unidentified',code,{type:'keyup'});
    }
    expect(f.key('Unidentified','Space').defaultPrevented).toBe(true);
    expect(f.input.read()).toMatchObject({autoAim:true,fire:true});
    f.key('Unidentified','Space',{type:'keyup'});
    f.key('Unidentified','Escape');f.key('Unidentified','Escape',{repeat:true});
    expect(f.pause).toHaveBeenCalledExactlyOnceWith(true);
  });
});

describe('review: native modifier shortcuts and held key transitions',()=>{
  it.each(['ctrlKey','metaKey','altKey'] as const)('ignores every gameplay binding with %s and never cancels the browser shortcut', modifier=>{
    const f=fixture();
    for(const [name,code] of bindings) {
      const event=f.key(name,code,{[modifier]:true});
      expect(event.defaultPrevented,`${modifier}+${code}`).toBe(false);
      f.key(name,code,{type:'keyup',[modifier]:true});
    }
    expectNoActions(f);
  });

  it.each([
    ['Control','ControlLeft','ctrlKey'],['Meta','MetaRight','metaKey'],['Alt','AltLeft','altKey'],
  ] as const)('clears held gameplay keys when %s is pressed and never resurrects them on release', (name,code,modifier)=>{
    const f=fixture();f.key('в','KeyD');f.key(' ','Space');
    expect(f.input.read()).toMatchObject({x:1,fire:true});
    expect(f.key(name,code,{[modifier]:true}).defaultPrevented).toBe(false);
    expect(f.input.read()).toMatchObject({x:0,y:0,fire:false,autoAim:false});
    f.key('d','KeyD',{type:'keyup',[modifier]:true});
    f.key(' ','Space',{type:'keyup',[modifier]:true});
    f.key(name,code,{type:'keyup'});
    expect(f.input.read()).toMatchObject({x:0,fire:false});
    f.key('в','KeyD');f.key(' ','Space');expect(f.input.read()).toMatchObject({x:1,fire:true});
  });

  it('clears stale held keys when only a modified keyup reaches the document',()=>{
    const f=fixture();f.key('ц','KeyW');f.key(' ','Space');
    f.key('ц','KeyW',{type:'keyup',ctrlKey:true});
    expect(f.input.read()).toMatchObject({x:0,y:0,autoAim:false,fire:false});
    f.key(' ','Space',{type:'keyup',ctrlKey:true});
    f.key(' ','Space');expect(f.input.read().fire).toBe(true);
  });

  it('does not let ignored shortcut keydowns block a later fresh ability press',()=>{
    const f=fixture();
    f.key('f','KeyF',{ctrlKey:true});f.key('f','KeyF',{type:'keyup',ctrlKey:true});
    f.key('а','KeyF');expect(f.game.useAbility).toHaveBeenCalledExactlyOnceWith('power');
  });

  it('preserves native mouse fire independently of keyboard modifier clearing',()=>{
    const f=fixture();
    f.pointer('pointerdown');expect(f.input.read().fire).toBe(true);
    expect(f.canvas.setPointerCapture).toHaveBeenCalledWith(7);
    f.key('Control','ControlLeft',{ctrlKey:true});expect(f.input.read().fire).toBe(true);
    f.pointer('pointerup');expect(f.input.read().fire).toBe(false);
    f.pointer('pointerdown',2);expect(f.input.read().fire).toBe(false);
  });

  it('preserves typing, loading, phase and blur guards with physical key events',()=>{
    const f=fixture();
    for(const [name,code] of bindings.filter(([,code])=>code!=='Escape')) f.key(name,code,{typing:true});
    expectNoActions(f);
    f.key('Escape','Escape',{typing:true});expect(f.pause).toHaveBeenCalledWith(true);
    f.game.status='paused';f.key('а','KeyF');expect(f.game.useAbility).not.toHaveBeenCalled();
    f.game.status='playing';f.key('в','KeyD');f.pointer('pointerdown');
    f.win.dispatchEvent(new Event('blur'));expect(f.input.read()).toMatchObject({x:0,y:0,fire:false});
    f.loading();f.key('а','KeyF');f.key(' ','Space');
    expect(f.game.useAbility).not.toHaveBeenCalled();expect(f.input.read()).toMatchObject({x:0,y:0,fire:false});
  });
});
