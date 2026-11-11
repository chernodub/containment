import { playerFacingText, playerFacingStat } from '../units';
import {hudLayoutRevision} from './layout';
import { ABILITY_CATALOG } from '../../game/abilities/catalog';
import type { AbilityId, AbilitySlot } from '../../game/abilities/contract';
type Bounds = { left: number; right: number; top: number; bottom: number };
type Hint = { slot: AbilitySlot; anchor: HTMLElement; node: HTMLElement; bounds: Bounds; anchorBounds: Bounds; available: boolean; ability: string };

/** Native focus and passive pointer inspection; combat clicks still reach the canvas. */
export class AbilityHints {
  private readonly hints: Hint[] = [];
  private hovered: Hint | null = null;
  private dirty = true;
  private layoutRevision = -1;
  private playing = false;
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
    for (const entry of anchors) {
      const node = document.createElement('aside');
      node.className = 'ability-tooltip'; node.id = `ability-rules-${entry.slot}`;
      node.setAttribute('role', 'tooltip'); node.hidden = true;
      entry.node.tabIndex = 0;
      entry.node.setAttribute('role', 'group');
      entry.node.setAttribute('aria-describedby', node.id);
      entry.node.append(node);
      this.hints.push({slot:entry.slot,anchor:entry.node,node,bounds:{left:0,right:0,top:0,bottom:0},anchorBounds:{left:0,right:0,top:0,bottom:0},available:false,ability:''});
    }
    for(const hint of this.hints) this.observer?.observe(hint.anchor);
    window.addEventListener('resize',this.invalidate);
    document.addEventListener('scroll',this.invalidate,true);
    document.addEventListener('pointermove', this.onPointer, {passive:true});
    document.addEventListener('focusin', this.onFocus);
    document.addEventListener('focusout', this.onFocus);
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

  private refresh(): void {
    for (const hint of this.hints) {
      const visible = hint === this.focused || hint === this.hovered;
      if(hint.node.hidden===visible) {hint.node.hidden=!visible;this.dirty=true;}
    }
  }

  /** A tooltip gives way to the marine and never opens an interactive overlay. */
  tick(player: Bounds, playing: boolean): void {
    // All measurements occur once in the presentation frame after HUD placement,
    // never in a pointer event. Steady mouse movement only reads cached bounds.
    const revision=hudLayoutRevision();
    if(revision!==this.layoutRevision||playing!==this.playing) {this.layoutRevision=revision;this.playing=playing;this.dirty=true;}
    if(this.dirty) {
      this.dirty=false;
      for(const hint of this.hints) {
        hint.available=playing&&!hint.anchor.closest('[hidden]');
        if(hint.available) this.copyBounds(hint.anchorBounds,hint.anchor);
        if(!hint.node.hidden) this.copyBounds(hint.bounds,hint.node);
      }
    }
    for (const hint of this.hints) {
      if (hint.node.hidden) continue;
      const box = hint.bounds;
      hint.node.style.visibility = !playing || box.left < player.right + 10 && box.right > player.left - 10 && box.top < player.bottom + 10 && box.bottom > player.top - 10 ? 'hidden' : '';
    }
  }

  private copyBounds(out:Bounds,node:HTMLElement): void {
    const box=node.getBoundingClientRect();out.left=box.left;out.right=box.right;out.top=box.top;out.bottom=box.bottom;
  }

  dispose(): void {
    this.observer?.disconnect();
    window.removeEventListener('resize',this.invalidate);
    document.removeEventListener('scroll',this.invalidate,true);
    document.removeEventListener('pointermove', this.onPointer);
    document.removeEventListener('focusin', this.onFocus);
    document.removeEventListener('focusout', this.onFocus);
    for (const hint of this.hints) { hint.node.remove(); hint.anchor.removeAttribute('aria-describedby'); hint.anchor.removeAttribute('tabindex'); hint.anchor.removeAttribute('role'); }
    this.hints.length = 0;
  }
}
