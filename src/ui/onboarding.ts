import type { DepthGame } from '../DepthGame';
import type { AbilitiesSnapshot } from '../game/abilities/contract';
import type { HudEffect } from './hud/effects';
import './styles/onboarding.css';

export const ONBOARDING_STORAGE_KEY = 'containment.onboarding.v1';
export const ONBOARDING_ACTIONS = ['move', 'aim', 'fire', 'dash', 'tactical', 'power', 'overdrive', 'reload', 'grenade', 'medkit'] as const;
export type OnboardingAction = typeof ONBOARDING_ACTIONS[number];
type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem'> | null;
type Seen = Partial<Record<OnboardingAction, true>>;
type Bounds = { left: number; right: number; top: number; bottom: number };
const prompts: Record<OnboardingAction, readonly [string, string, string]> = {
  move: ['W A S D', 'Find your footing.', 'Move to keep a lane open.'],
  aim: ['MOUSE', 'Watch your aim.', 'Point toward the threat.'],
  fire: ['LMB / SPACE', 'Clear a path.', 'Fire with the mouse, or hold Space for aim assist.'],
  dash: ['SHIFT', 'Break through.', 'Dash through enemies. Two charges; walls still hold.'],
  tactical: ['Q', 'Make some room.', 'Your tactical ability recharges during combat.'],
  power: ['F', 'Change the fight.', 'Use the cursor or your facing to place your power.'],
  overdrive: ['V', 'Overdrive is charged.', 'Spend the full meter on your strongest ability.'],
  reload: ['R', 'Top up the magazine.', 'Reload before the next group closes in.'],
  grenade: ['G', 'Scatter the swarm.', 'A grenade breaks up a crowded approach.'],
  medkit: ['E', 'Patch the suit.', 'Use a medkit while you have room to breathe.'],
};

/** A tiny independent preference record; malformed and future versions are ignored. */
export function loadOnboardingSeen(storage: PreferenceStorage): Seen {
  const seen: Seen = {};
  try {
    const data: unknown = JSON.parse(storage?.getItem(ONBOARDING_STORAGE_KEY) ?? 'null');
    if (!data || typeof data !== 'object' || Array.isArray(data)) return seen;
    const record = data as { version?: unknown; seen?: unknown };
    if (record.version !== 1 || !record.seen || typeof record.seen !== 'object' || Array.isArray(record.seen)) return seen;
    for (const action of ONBOARDING_ACTIONS) if ((record.seen as Record<string, unknown>)[action] === true) seen[action] = true;
  } catch { /* Preference storage may be blocked. Learning still works for this session. */ }
  return seen;
}

/** Observes successful public actions. It never handles or consumes player input. */
export class ContextualOnboarding {
  private readonly seen: Seen;
  private readonly node = document.createElement('aside');
  private readonly key = document.createElement('kbd');
  private readonly heading = document.createElement('b');
  private readonly copy = document.createElement('span');
  private active: OnboardingAction | null = null;
  private previousAngle: number | null = null;
  private previousGrenades: number | null = null;
  private previousMedkits: number | null = null;
  private seed: number | null = null;
  private activeTime = 0;
  private cursor = 0;
  private enabled = false;
  private firstRoomSeconds = 0;
  private firstRoom = false;
  private disposed = false;
  private layoutDirty = true;
  private translation = '';
  private viewportWidth = 0;
  private viewportHeight = 0;
  private readonly bounds: Bounds = { left: 0, right: 0, top: 0, bottom: 0 };

  constructor(private readonly host: HTMLElement, private readonly storage: PreferenceStorage = null) {
    this.seen = loadOnboardingSeen(storage);
    this.node.id = 'contextual-onboarding';
    this.node.className = 'contextual-onboarding';
    this.node.hidden = true;
    this.node.setAttribute('role', 'status');
    this.node.setAttribute('aria-live', 'polite');
    this.node.append(this.key, this.heading, this.copy);
    host.append(this.node);
  }

  /** Persist once, and only after the action really occurred. */
  mark(action: OnboardingAction): void {
    if (!this.enabled || this.seen[action] || this.disposed) return;
    this.seen[action] = true;
    try { this.storage?.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({ version: 1, seen: this.seen })); } catch { /* Session state remains valid. */ }
    if (this.active === action) { this.active = null; this.activeTime = 0; this.node.hidden = true; }
  }

  effect(effect: HudEffect): void {
    if (effect.type === 'shot') this.mark('fire');
    if (effect.type === 'ability' && effect.ability && ['cast', 'dash-start', 'impact'].includes(effect.ability.phase)) this.mark(effect.ability.slot);
  }

  /** Sync at HUD cadence. The single prompt follows its action bar even when it relocates. */
  update(game: DepthGame, abilities: AbilitiesSnapshot | null): void {
    if (this.disposed) return;
    const playing = game.status === 'playing';
    const firstRoom = game.node.depth === 0;
    this.firstRoom = firstRoom;
    this.enabled = playing;
    if (this.seed !== game.expedition.run.seed) {
      this.seed = game.expedition.run.seed;
      this.previousAngle = this.previousGrenades = this.previousMedkits = null;
      this.active = null; this.activeTime = 0; this.cursor = 0;
      this.firstRoomSeconds = 0;
    }
    const combat = game.combat.snapshot;
    if (playing) {
      if (game.player.moving) this.mark('move');
      if (this.previousAngle !== null && Math.abs(Math.atan2(Math.sin(game.player.angle - this.previousAngle), Math.cos(game.player.angle - this.previousAngle))) > .04) this.mark('aim');
      if (combat.reloading) this.mark('reload');
      if (this.previousGrenades !== null && combat.grenades < this.previousGrenades) this.mark('grenade');
      if (this.previousMedkits !== null && combat.medkits < this.previousMedkits) this.mark('medkit');
      this.previousAngle = game.player.angle;
      this.previousGrenades = combat.grenades;
      this.previousMedkits = combat.medkits;
    }
    if (!playing || (!firstRoom || this.firstRoomSeconds >= 60) && (!abilities?.overdrive.ready || this.seen.overdrive)) { this.node.hidden = true; this.active = null; return; }
    const eligible = (action: OnboardingAction): boolean => {
      if (this.seen[action]) return false;
      if (action === 'overdrive') return !!abilities?.overdrive.ready;
      if (!firstRoom || this.firstRoomSeconds >= 60) return false;
      if (action === 'medkit') return combat.health <= 65 && combat.medkits > 0;
      if (action === 'reload') return combat.magazine < combat.magazineCapacity * .6 && combat.reserve > 0;
      if (action === 'grenade') return combat.grenades > 0 && game.enemies.activeCount >= 3;
      if (action === 'dash' || action === 'tactical' || action === 'power') return !!abilities?.slots?.[action].ready;
      return true;
    };
    if (this.active && eligible(this.active) && this.activeTime < 6) { this.node.hidden = false; return; }
    this.active = null;
    // Urgent contextual prompts can interrupt the teaching sequence.
    if (eligible('medkit')) this.active = 'medkit';
    else if (eligible('overdrive')) this.active = 'overdrive';
    else {
      for (let offset = 0; offset < ONBOARDING_ACTIONS.length; offset++) {
        const index = (this.cursor + offset) % ONBOARDING_ACTIONS.length;
        if (!eligible(ONBOARDING_ACTIONS[index])) continue;
        this.active = ONBOARDING_ACTIONS[index]; this.cursor = (index + 1) % ONBOARDING_ACTIONS.length; break;
      }
    }
    if (!this.active) { this.node.hidden = true; return; }
    this.activeTime = 0;
    const [key, heading, copy] = prompts[this.active];
    this.key.textContent = key; this.heading.textContent = heading; this.copy.textContent = copy;
    this.node.dataset.action = this.active;
    this.node.hidden = false;
    this.layoutDirty = true;
  }

  /** Clock is supplied by the application, so capture stepping remains exact. */
  tick(dt: number, player: Bounds): void {
    if (this.disposed) return;
    if (this.enabled && this.firstRoom) this.firstRoomSeconds += dt;
    if (this.node.hidden) return;
    this.activeTime += dt;
    if (this.layoutDirty || this.translation !== this.host.style.translate || this.viewportWidth !== innerWidth || this.viewportHeight !== innerHeight) {
      this.layoutDirty = false; this.translation = this.host.style.translate;
      this.viewportWidth = innerWidth; this.viewportHeight = innerHeight;
      const bar = this.host.getBoundingClientRect();
      const anchor = this.active && ['dash', 'tactical', 'power', 'overdrive'].includes(this.active) ? this.host.querySelector<HTMLElement>(`[data-ability="${this.active}"]`) : this.host.querySelector<HTMLElement>('.weapon-bank');
      const target = anchor?.getBoundingClientRect();
      const center = Math.max(173, Math.min(innerWidth - 173, target ? (target.left + target.right) / 2 : (bar.left + bar.right) / 2));
      this.node.style.left = `${center - bar.left}px`;
      const rect = this.node.getBoundingClientRect();
      this.bounds.left = rect.left; this.bounds.right = rect.right; this.bounds.top = rect.top; this.bounds.bottom = rect.bottom;
    }
    const overlap = this.bounds.left < player.right + 12 && this.bounds.right > player.left - 12 && this.bounds.top < player.bottom + 12 && this.bounds.bottom > player.top - 12;
    this.node.style.visibility = overlap ? 'hidden' : '';
  }

  dispose(): void { this.disposed = true; this.node.remove(); }
}
