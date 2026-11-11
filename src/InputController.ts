import {hasClearExpeditionShot} from './game/world/expeditionGeometry';
import {enemyShotRadius} from './game/combat/enemyContact';
import type {DepthGame,GameInput} from './DepthGame';
import type {DepthRenderer} from './render/DepthRenderer';
const WEAPONS=['pistol','rifle','shotgun','plasma','rocket'] as const;
const LEGACY_KEY_CODES:Readonly<Record<string,string>>={
 shift:'ShiftLeft',q:'KeyQ',f:'KeyF',v:'KeyV',r:'KeyR',g:'KeyG',e:'KeyE',
 w:'KeyW',a:'KeyA',s:'KeyS',d:'KeyD',arrowup:'ArrowUp',arrowdown:'ArrowDown',
 arrowleft:'ArrowLeft',arrowright:'ArrowRight',' ':'Space',escape:'Escape',
 '1':'Digit1','2':'Digit2','3':'Digit3','4':'Digit4','5':'Digit5',
};
const GAMEPLAY_CODES=new Set([...Object.values(LEGACY_KEY_CODES),'ShiftRight']);
/** Native input uses physical positions; key-only fallback preserves synthetic callers. */
function gameplayCode(event:KeyboardEvent):string|undefined{
 if(event.code)return GAMEPLAY_CODES.has(event.code)?event.code:undefined;
 const key=event.key.toLowerCase();return Object.hasOwn(LEGACY_KEY_CODES,key)?LEGACY_KEY_CODES[key]:undefined;
}
function shortcutModifier(event:KeyboardEvent):boolean{
 return event.ctrlKey||event.metaKey||event.altKey||/^(Control|Meta|Alt)(Left|Right)$/.test(event.code)
  ||!event.code&&['control','meta','alt','altgraph'].includes(event.key.toLowerCase());
}
/** Any focusable HUD/overlay owns its native keyboard interaction. */
function uiOwnsKeys(target: HTMLElement|null): boolean {
 if(target?.tagName==='CANVAS')return false;
 return !!(target?.isContentEditable || target?.closest?.('button,a[href],input,select,textarea,summary,[contenteditable],[tabindex],[role="button"],[role="tab"],[role="slider"]') || target?.matches?.('input,select,textarea,[contenteditable="true"],[contenteditable=""]'));
}
/** Desktop keyboard movement, mouse aiming and Space aim assist. */
export class InputController {
 private keys=new Set<string>();private mouse={x:0,y:0,active:false};private shooting=false;
 constructor(private game:DepthGame,private view:DepthRenderer,private onPause:(toggle?:boolean)=>void,private gameplayReady:()=>boolean=()=>true){
  const canvas=view.canvas;canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')this.mouse={x:e.clientX,y:e.clientY,active:true};});canvas.addEventListener('pointerdown',e=>{if(!this.gameplayReady()||e.pointerType!=='mouse'||e.button!==0||game.status!=='playing')return;canvas.focus?.({preventScroll:true});this.shooting=true;this.mouse={x:e.clientX,y:e.clientY,active:true};canvas.setPointerCapture(e.pointerId);});['pointerup','pointercancel','lostpointercapture'].forEach(t=>canvas.addEventListener(t,()=>{this.shooting=false;}));
  document.addEventListener('keydown',e=>{
   if(e.defaultPrevented)return;
   if(shortcutModifier(e)){this.keys.clear();return;}
   const code=gameplayCode(e),target=e.target as HTMLElement|null;
   if(code!=='Escape'&&uiOwnsKeys(target)){this.reset();return;}
   if(!code)return;
   if(game.status==='playing'&&['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(code))e.preventDefault();
   if(code==='Escape'){if(!e.repeat){if(game.status==='playing'||game.status==='paused')e.preventDefault();this.onPause(true);}return;}
   if(!this.gameplayReady()||game.status!=='playing')return;
   if(e.repeat||this.keys.has(code))return;
   this.keys.add(code);
   const slot=({ShiftLeft:'dash',ShiftRight:'dash',KeyQ:'tactical',KeyF:'power',KeyV:'overdrive'} as const)[code as 'ShiftLeft'|'ShiftRight'|'KeyQ'|'KeyF'|'KeyV'];
   if(slot){const intent=this.read();if(intent.angle!==null)game.player.angle=intent.angle;game.setAimPoint(intent.aimPoint??null);game.abilities.setIntent(intent.x,intent.y,intent.aimPoint??null);game.useAbility(slot);}
   if(code==='KeyR')game.reload();
   if(code==='KeyG')game.grenade();
   if(code==='KeyE')game.heal();
   if(/^Digit[1-5]$/.test(code))game.switchWeapon(WEAPONS[Number(code.slice(-1))-1]);
  });
  document.addEventListener('focusin',e=>{if(uiOwnsKeys(e.target as HTMLElement|null))this.reset();});
  document.addEventListener('keyup',e=>{
   const code=gameplayCode(e);if(code)this.keys.delete(code);
   if(shortcutModifier(e))this.keys.clear();
  });
  window.addEventListener('blur',()=>{this.reset();this.onPause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){this.reset();this.onPause();}});window.addEventListener('resize',()=>this.reset());document.addEventListener('contextmenu',e=>e.preventDefault());
 }
 reset(){this.keys.clear();this.shooting=false;this.mouse.active=false;this.game.setAimPoint(null);}
 read():GameInput{if(!this.gameplayReady()){this.reset();return{x:0,y:0,fire:false,angle:null,autoAim:false};}const k=this.keys;let x=(k.has('KeyD')||k.has('ArrowRight')?1:0)-(k.has('KeyA')||k.has('ArrowLeft')?1:0),y=(k.has('KeyS')||k.has('ArrowDown')?1:0)-(k.has('KeyW')||k.has('ArrowUp')?1:0);y/=.81;let angle:number|null=null;let aimPoint:{x:number;y:number}|null=null;if(this.mouse.active){const point=this.view.pointer(this.mouse.x,this.mouse.y,this.game.targets().filter(t=>hasClearExpeditionShot(this.game.geometry,this.game.player,t)).map(t=>{const e=t.id>0?this.game.enemies.getSnapshot(t.id):undefined;return {...t,radius:e?enemyShotRadius(e.type,e.elite):t.radius};}));if(point){aimPoint=point;if(!k.has('Space'))angle=Math.atan2(point.y-this.game.player.y,point.x-this.game.player.x);}}return{x,y,angle,aimPoint,autoAim:k.has('Space'),fire:this.shooting||k.has('Space')};}
}
