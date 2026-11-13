import { playerFacingText, playerFacingStat } from '../units';
import {hudLayoutRevision} from './layout';
import { ABILITY_CATALOG } from '../../game/abilities/catalog';
import type { AbilityId, AbilitySlot } from '../../game/abilities/contract';
type Bounds = { left: number; right: number; top: number; bottom: number };
type Hint = { slot: AbilitySlot; anchor: HTMLElement; node: HTMLElement; bounds: Bounds; anchorBounds: Bounds; available: boolean; ability: string };

/** Deliberate held-key inspection; combat clicks still reach the canvas. */
export class AbilityHints {
  private readonly hints: Hint[] = [];
  private hovered: Hint | null = null;
  private dirty = true;
  private layoutRevision = -1;
  private playing = true;
  private inspecting = false;
  private readonly inspectKeys = new Set<string>();
  private readonly onKey = (event: KeyboardEvent) => {
    if (!['Tab','AltLeft','AltRight'].includes(event.code)) return;
    if (event.type === 'keydown') this.inspectKeys.add(event.code);
    else this.inspectKeys.delete(event.code);
    this.inspecting = this.inspectKeys.size > 0;
    this.refresh();
  };
  private readonly onBlur = () => {
    this.inspectKeys.clear();this.inspecting=false;this.hovered=null;this.focused=null;this.refresh();
  };
  private readonly invalidate = () => {this.dirty = true;};
  private readonly observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(this.invalidate);
  private focused: Hint | null = null;
  private readonly onPointer = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    this.hovered = null;
    for (const hint of this.hints) {
      if (!hint.available) continue;
      const box = hint.anchorBounds;
      if (event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom) this.hovered = hint;
    }
    this.refresh();
  };
  private readonly onFocus = (event: FocusEvent) => {
    this.focused = this.hints.find(hint => hint.anchor === (event.type === 'focusout' ? event.relatedTarget : event.target)) ?? null;
    this.refresh();
  };

  constructor(anchors: readonly { slot: AbilitySlot; node: HTMLElement }[]) {
    // Inspect copy must stay opaque when threats fade its anchor's dock.
    const host = document.getElementById('hud') ?? document.body;
    for (const entry of anchors) {
      const node = document.createElement('aside');
      node.className = 'ability-tooltip'; node.id = `ability-rules-${entry.slot}`;
      node.setAttribute('role', 'tooltip'); node.hidden = true;
      entry.node.tabIndex = 0;
      entry.node.setAttribute('role', 'group');
      entry.node.setAttribute('aria-describedby', node.id);
      host.append(node);
      this.hints.push({slot:entry.slot,anchor:entry.node,node,bounds:{left:0,right:0,top:0,bottom:0},anchorBounds:{left:0,right:0,top:0,bottom:0},available:false,ability:''});
    }
    for(const hint of this.hints) this.observer?.observe(hint.anchor);
    window.addEventListener('resize',this.invalidate);
    document.addEventListener('scroll',this.invalidate,true);
    document.addEventListener('pointermove', this.onPointer, {passive:true});
    document.addEventListener('focusin', this.onFocus);
    document.addEventListener('focusout', this.onFocus);
    document.addEventListener('keydown',this.onKey);document.addEventListener('keyup',this.onKey);window.addEventListener('blur',this.onBlur);
  }

  update(slot: AbilitySlot, id: AbilityId): void {
    const hint = this.hints.find(item => item.slot === slot);
    if (!hint || hint.ability === id) return;
    const definition = ABILITY_CATALOG[id];
    hint.ability = id;
    const name = document.createElement('b'); name.textContent = definition.name;
    const rules = document.createElement('span'); rules.textContent = playerFacingText(definition.description);
    const stats = document.createElement('small'); stats.textContent = definition.stats.map(stat => `${stat.label}: ${playerFacingStat(stat.label, stat.value)}`).join(' · ');
    hint.node.replaceChildren(name, rules, stats);
    this.dirty=true;
  }

  /** A single explanation owns the inspect space above the dock. */
  get visible(): boolean { return this.hints.some(hint => !hint.node.hidden); }

  private refresh(): void {
    for (const hint of this.hints) {
      const visible = hint.available && (!this.playing || this.inspecting) && (hint === this.focused || hint === this.hovered);
      if(hint.node.hidden===visible) {hint.node.hidden=!visible;this.dirty=true;}
    }
  }

  /** A tooltip gives way to the marine and never opens an interactive overlay. */
  tick(player: Bounds, playing: boolean): void {
    // All measurements occur once in the presentation frame after HUD placement,
    // never in a pointer event. Steady mouse movement only reads cached bounds.
    const revision=hudLayoutRevision();
    if(revision!==this.layoutRevision||playing!==this.playing) {this.layoutRevision=revision;this.playing=playing;this.dirty=true;this.refresh();}
    if(this.dirty) {
      for(const hint of this.hints) {
        hint.available=!hint.anchor.closest('[hidden]');
        if(hint.available) {
          this.copyBounds(hint.anchorBounds,hint.anchor);
          hint.node.style.setProperty('--ability-color',getComputedStyle(hint.anchor).getPropertyValue('--ability-color').trim() || '#9fe8ff');
          // Cache CSS-pixel placement even while hidden, so held-key inspection
          // can open immediately without measuring in its input event.
          hint.node.style.left=`${(hint.anchorBounds.left+hint.anchorBounds.right)/2}px`;
          hint.node.style.bottom=`${window.innerHeight-hint.anchorBounds.top+16}px`;
        }
      }
      this.refresh();
      for(const hint of this.hints) if(!hint.node.hidden) this.measureAndClamp(hint);
      this.dirty=false;
    }
    for (const hint of this.hints) {
      if (hint.node.hidden) continue;
      const box = hint.bounds;
      hint.node.style.visibility = playing && box.left < player.right + 10 && box.right > player.left - 10 && box.top < player.bottom + 10 && box.bottom > player.top - 10 ? 'hidden' : '';
    }
  }

  private copyBounds(out:Bounds,node:HTMLElement): void {
    const box=node.getBoundingClientRect();out.left=box.left;out.right=box.right;out.top=box.top;out.bottom=box.bottom;
  }

  private measureAndClamp(hint:Hint): void {
    this.copyBounds(hint.bounds,hint.node);
    const box=hint.bounds;
    const dx=Math.max(8-box.left,Math.min(0,window.innerWidth-8-box.right));
    const dy=Math.max(8-box.top,Math.min(0,window.innerHeight-8-box.bottom));
    if(dx) hint.node.style.left=`${(hint.anchorBounds.left+hint.anchorBounds.right)/2+dx}px`;
    if(dy) hint.node.style.bottom=`${window.innerHeight-hint.anchorBounds.top+16-dy}px`;
    box.left+=dx;box.right+=dx;box.top+=dy;box.bottom+=dy;
  }

  dispose(): void {
    this.observer?.disconnect();
    window.removeEventListener('resize',this.invalidate);
    document.removeEventListener('scroll',this.invalidate,true);
    document.removeEventListener('pointermove', this.onPointer);
    document.removeEventListener('focusin', this.onFocus);
    document.removeEventListener('focusout', this.onFocus);
    document.removeEventListener('keydown',this.onKey);document.removeEventListener('keyup',this.onKey);window.removeEventListener('blur',this.onBlur);
    for (const hint of this.hints) { hint.node.remove(); hint.anchor.removeAttribute('aria-describedby'); hint.anchor.removeAttribute('tabindex'); hint.anchor.removeAttribute('role'); }
    this.hints.length = 0;
  }
}
