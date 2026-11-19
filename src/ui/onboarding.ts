import {getAwakeningDrill} from './gameAdapter';
import {hasClearExpeditionShot} from '../game/world/expeditionGeometry';
import {meleeStrikeContains} from '../game/enemies/meleeAttacks';
import type { DepthGame } from '../DepthGame';
import type { AbilitiesSnapshot } from '../game/abilities/contract';
import type { HudEffect } from './hud/effects';
import { ABILITY_CATALOG } from '../game/abilities/catalog';
import { hudObstructs, setPresentationObstacle } from './hud/layout';
import './styles/onboarding.css';

export const ONBOARDING_STORAGE_KEY = 'containment.onboarding.v1';
export const ONBOARDING_ACTIONS = ['move', 'aim', 'fire', 'dash', 'tactical', 'power', 'overdrive', 'reload', 'switch', 'grenade', 'medkit', 'brute-evade', 'brute-punish', 'evade-punish', 'pack-tactical','priority-focus','crossfire-cover'] as const;
export type OnboardingAction = typeof ONBOARDING_ACTIONS[number];
type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem'> | null;
type Seen = Partial<Record<OnboardingAction, true>>;
type Bounds = { left: number; right: number; top: number; bottom: number };
const prompts: Record<OnboardingAction, readonly [string, string, string]> = {
  'evade-punish':['A / D / LMB','Step across the red edge, then shoot the recovering body.',''],
  'priority-focus':['LMB / Q / F','Break the escort — focus the Carrier or heavy guard first.',''],
  'crossfire-cover':['W A S D','Two firing lines — move behind cover to break one.',''],
  'pack-tactical':['Q','Pack lined up — use your tactical ability.',''],
  'brute-evade':['A / D / SHIFT','Sidestep the Brute’s committed strike.',''],
  'brute-punish':['LMB / Q','The Brute is recovering — punish the opening.',''],
  move: ['W A S D', 'Move to keep a lane open.', ''],
  switch: ['1–5', 'Switch weapons to suit the threat.', ''],
  aim: ['MOUSE', 'Watch your aim.', 'Point toward the threat.'],
  fire: ['LMB / SPACE', 'Clear a path.', 'Fire with the mouse, or hold Space for aim assist.'],
  dash: ['SHIFT', 'Step out or dash.', ''],
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
  private retryShown = false;
  private evadedTarget: number | null = null;
  private firstWindup = false;
  private firstStrike:{id:number;x:number;y:number;vitality:number;damageTaken:number}|null=null;
  private previousWeapon: string | null = null;
  private finished = false;
  private previousAngle: number | null = null;
  private previousGrenades: number | null = null;
  private previousMedkits: number | null = null;
  private seed: number | null = null;
  private activeTime = 0;
  private cursor = 0;
  private enabled = false;
  private packOpportunity=false;
  private priorityTargets:number[]=[];
  private trackedRoom=-1;
  private watchedGame:DepthGame|null=null;
  private crossfire:{ids:number[];x:number;y:number}|null=null;
  private crossfireOpportunity=false;
  private bruteWindup: {id:number;x:number;y:number;vitality:number;damageTaken:number}|null=null;
  private recoveringBruteId:number|null=null;
  private bruteWarning=false;
  private disposed = false;
  private layoutDirty = true;
  // PERF13: coalesce ordinary HUD sync invalidations; relocation/resizing stays immediate.
  private layoutAge = Infinity;
  private translation = '';
  private viewportWidth = 0;
  private viewportHeight = 0;
  private readonly bounds: Bounds = { left: 0, right: 0, top: 0, bottom: 0 };
  private preferredLeft = 0;
  private preferredTop = 0;
  private promptWidth = 0;
  private promptHeight = 0;
  private originX = 0;
  private originY = 0;

  constructor(private readonly host: HTMLElement, private readonly storage: PreferenceStorage = null) {
    this.seen = loadOnboardingSeen(storage);
    try { this.finished = storage?.getItem('containment.finished.v1') === 'true'; } catch {}
    this.node.id = 'contextual-onboarding';
    this.node.className = 'contextual-onboarding';
    this.node.hidden = true;
    this.node.setAttribute('role', 'status');
    this.node.setAttribute('aria-live', 'polite');
    this.node.append(this.key, this.heading, this.copy);
    host.append(this.node);
  }


  /** Persist once, and only after the action really occurred. */
  mark(action: OnboardingAction, observedDrill = false): void {
    if ((!this.enabled && !observedDrill) || this.seen[action] || this.disposed) return;
    this.seen[action] = true;
    try { this.storage?.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({ version: 1, seen: this.seen })); } catch { /* Session state remains valid. */ }
    if (this.active === action) { this.active = null; this.activeTime = 0; this.node.hidden = true; setPresentationObstacle('onboarding', null); }
  }

  effect(effect: HudEffect): void {
    if(effect.type==='corpse'&&effect.id!==undefined&&this.watchedGame?.roomRevision===this.trackedRoom&&this.priorityTargets.includes(effect.id))this.mark('priority-focus');
    if((effect.damage??0)>0&&effect.targetId!==undefined){
      if(effect.targetId===this.recoveringBruteId)this.mark('brute-punish');
      if(effect.targetId===this.evadedTarget)this.mark('evade-punish');
    }
    if (effect.type === 'shot') this.mark('fire');
    if (effect.type === 'ability' && effect.ability && ['cast', 'dash-start', 'impact'].includes(effect.ability.phase) && effect.ability.slot !== 'dash') {if(effect.ability.slot!=='tactical'||this.packOpportunity)this.mark(effect.ability.slot);if(effect.ability.slot==='tactical'&&this.packOpportunity)this.mark('pack-tactical');}
  }

  /** Sync at HUD cadence. The single prompt follows its action bar even when it relocates. */
  update(game: DepthGame, abilities: AbilitiesSnapshot | null, inspect = true, hints = true): void {
    if (this.disposed) return;
    // Slot visibility and labels may resize the bar during this HUD sync.
    // Refresh geometry once at HUD cadence, never on ordinary animation frames.
    this.layoutDirty = true;
    if (game.status === 'complete' && !this.finished) {this.finished=true;try {this.storage?.setItem('containment.finished.v1','true');}catch{}}
    const playing = game.status === 'playing' && hints && !this.finished;

    this.enabled = playing;
    if (this.seed !== game.expedition.run.seed) {
      this.seed = game.expedition.run.seed;
      this.firstWindup = false; this.previousWeapon = null;
      this.previousAngle = this.previousGrenades = this.previousMedkits = null;
      this.active = null; this.activeTime = 0; this.cursor = 0;
      this.bruteWindup=null;this.recoveringBruteId=null;
    }
    const drill = getAwakeningDrill(game);
    if((drill?.confirmation??0)>0)this.mark('evade-punish',true);
    const combat = game.combat.snapshot;
    this.watchedGame=game;if(this.trackedRoom!==game.roomRevision){this.trackedRoom=game.roomRevision;this.priorityTargets=[];this.crossfire=null;this.firstStrike=null;this.evadedTarget=null;this.bruteWindup=null;}
    const enemies=game.enemies.snapshot.enemies;
    this.priorityTargets=enemies.filter(enemy=>enemy.priority&&(enemy.type==='carrier'||enemy.controlResistant)).map(enemy=>enemy.id);
    const spitters=enemies.filter(enemy=>enemy.type==='spitter'&&Math.hypot(enemy.x-game.player.x,enemy.y-game.player.y)<600);
    const firing=spitters.filter(enemy=>hasClearExpeditionShot(game.geometry,enemy,game.player));this.crossfireOpportunity=firing.length>=2;
    if(this.crossfireOpportunity&&!this.crossfire)this.crossfire={ids:firing.slice(0,2).map(enemy=>enemy.id),x:game.player.x,y:game.player.y};
    if(playing&&this.crossfire&&Math.hypot(game.player.x-this.crossfire.x,game.player.y-this.crossfire.y)>24&&this.crossfire.ids.some(id=>{const enemy=spitters.find(e=>e.id===id);return enemy&&!hasClearExpeditionShot(game.geometry,enemy,game.player);}))this.mark('crossfire-cover');
    this.firstWindup=enemies.some(enemy=>enemy.meleePhase==='windup');
    const strikeWarning=enemies.find(enemy=>enemy.meleePhase==='windup');
    if(this.evadedTarget!==null&&!enemies.some(enemy=>enemy.id===this.evadedTarget&&enemy.meleePhase==='recovery'))this.evadedTarget=null;
    if(strikeWarning&&!this.firstStrike&&meleeStrikeContains(strikeWarning.meleeShape,strikeWarning.meleeOriginX,strikeWarning.meleeOriginY,strikeWarning.meleeAngle,game.player.x,game.player.y,game.player.radius))this.firstStrike={id:strikeWarning.id,x:game.player.x,y:game.player.y,vitality:combat.health+combat.armor,damageTaken:game.stats.damageTaken};
    const watchedStrike=this.firstStrike&&enemies.find(enemy=>enemy.id===this.firstStrike!.id);
    if(playing&&watchedStrike?.meleePhase==='recovery'&&this.firstStrike){if(Math.hypot(game.player.x-this.firstStrike.x,game.player.y-this.firstStrike.y)>20&&combat.health+combat.armor>=this.firstStrike.vitality&&game.stats.damageTaken===this.firstStrike.damageTaken&&!meleeStrikeContains(watchedStrike.meleeShape,watchedStrike.meleeOriginX,watchedStrike.meleeOriginY,watchedStrike.meleeAngle,game.player.x,game.player.y,game.player.radius)){this.mark('dash');this.evadedTarget=watchedStrike.id;}this.firstStrike=null;}
    if(this.firstStrike&&!watchedStrike)this.firstStrike=null;
    this.packOpportunity=enemies.filter(enemy=>Math.hypot(enemy.x-game.player.x,enemy.y-game.player.y)<=180&&Math.cos(Math.atan2(enemy.y-game.player.y,enemy.x-game.player.x)-game.player.angle)>.5).length>=3;
    const warning=enemies.find(enemy=>enemy.type==='brute'&&enemy.meleePhase==='windup');
    this.bruteWarning=!!warning;
    if(warning&&this.bruteWindup?.id!==warning.id)this.bruteWindup={id:warning.id,x:game.player.x,y:game.player.y,vitality:combat.health+combat.armor,damageTaken:game.stats.damageTaken};
    const recovering=enemies.find(enemy=>enemy.type==='brute'&&enemy.meleePhase==='recovery');
    this.recoveringBruteId=recovering?.id??null;
    if(playing&&recovering&&this.bruteWindup?.id===recovering.id&&Math.hypot(game.player.x-this.bruteWindup.x,game.player.y-this.bruteWindup.y)>20&&combat.health+combat.armor>=this.bruteWindup.vitality&&game.stats.damageTaken===this.bruteWindup.damageTaken&&!meleeStrikeContains(recovering.meleeShape,recovering.meleeOriginX,recovering.meleeOriginY,recovering.meleeAngle,game.player.x,game.player.y,game.player.radius))this.mark('brute-evade');
    if(recovering&&this.bruteWindup?.id===recovering.id)this.bruteWindup=null;

    if (playing) {
      if (this.previousWeapon !== null && combat.weaponId !== this.previousWeapon) this.mark('switch');
      this.previousWeapon = combat.weaponId;
      if (game.player.moving) this.mark('move');
      if (this.previousAngle !== null && Math.abs(Math.atan2(Math.sin(game.player.angle - this.previousAngle), Math.cos(game.player.angle - this.previousAngle))) > .04) this.mark('aim');
      if (combat.reloading) this.mark('reload');
      if (this.previousGrenades !== null && combat.grenades < this.previousGrenades) this.mark('grenade');
      if (this.previousMedkits !== null && combat.medkits < this.previousMedkits) this.mark('medkit');
      this.previousAngle = game.player.angle;
      this.previousGrenades = combat.grenades;
      this.previousMedkits = combat.medkits;
    }
    if (!playing) { this.node.hidden = true; this.active = null; setPresentationObstacle('onboarding', null); return; }
    if(drill){
      this.active='evade-punish';
      this.node.dataset.action=this.active;
      this.key.textContent=drill.confirmation>0?'+20 CR':'MOVE / LMB';
      this.heading.textContent=drill.confirmation>0?'Punished':prompts['evade-punish'][1];
      this.copy.textContent='';
      this.node.hidden=!inspect;
      return;
    }
    const eligible = (action: OnboardingAction): boolean => {
      if (this.seen[action]) return false;
      if(action==='evade-punish')return game.node.depth>=2&&enemies.length===1&&this.firstWindup&&(!this.retryShown||this.active===action);
      // Charge readiness is authoritative; the prompt retires only after a cast.
      if (action === 'overdrive') return !!abilities?.overdrive.ready;
      if(action==='brute-evade')return this.bruteWarning;
      if(action==='brute-punish')return this.recoveringBruteId!==null;
      if (action === 'medkit') return combat.health <= 65 && combat.medkits > 0;
      if (action === 'reload') return combat.magazine < combat.magazineCapacity * .6 && combat.reserve > 0;
      if (action === 'grenade') return combat.grenades > 0 && game.enemies.activeCount >= 3;
      if (action === 'dash') return this.firstWindup && !!abilities?.slots?.dash.ready;
      if (action === 'switch') return this.seen.fire === true;
      if(action==='priority-focus')return this.priorityTargets.length>0;
      if(action==='crossfire-cover')return this.crossfireOpportunity;
      if (action === 'pack-tactical') return this.packOpportunity&&!!abilities?.slots?.tactical.ready;
      if (action === 'tactical') return this.packOpportunity&&!!abilities?.slots?.tactical.ready;
      if(action==='power')return game.enemies.activeCount>=2&&!!abilities?.slots?.power.ready;
      return true;
    };
    if (this.active && eligible(this.active) && this.activeTime < 6 && (this.active === 'dash' || !eligible('dash')) && (this.active === 'medkit' || !eligible('medkit')) && (this.active==='evade-punish'||!eligible('evade-punish')) && (this.active==='brute-evade'||!eligible('brute-evade')) && (this.active==='brute-punish'||!eligible('brute-punish'))) { this.node.hidden = !inspect; return; }
    this.active = null;
    // Urgent contextual prompts can interrupt the teaching sequence.
    if(eligible('evade-punish')){this.active='evade-punish';this.retryShown=true;}
    else if(eligible('brute-evade'))this.active='brute-evade';
    else if(eligible('brute-punish'))this.active='brute-punish';
    else if (eligible('dash')) this.active = 'dash';
    else if (eligible('medkit')) this.active = 'medkit';
    else if (eligible('overdrive')) this.active = 'overdrive';
    else if(eligible('priority-focus'))this.active='priority-focus';
    else if(eligible('crossfire-cover'))this.active='crossfire-cover';
    else if(eligible('pack-tactical'))this.active='pack-tactical';
    else {
      for (let offset = 0; offset < ONBOARDING_ACTIONS.length; offset++) {
        const index = (this.cursor + offset) % ONBOARDING_ACTIONS.length;
        if (!eligible(ONBOARDING_ACTIONS[index])) continue;
        this.active = ONBOARDING_ACTIONS[index]; this.cursor = (index + 1) % ONBOARDING_ACTIONS.length; break;
      }
    }
    if (!this.active) { this.node.hidden = true; setPresentationObstacle('onboarding', null); return; }
    this.activeTime = 0;
    const [key, heading, copy] = prompts[this.active];
    this.key.textContent = key; this.heading.textContent = copy || heading; this.copy.textContent = '';
    if (this.active === 'tactical' || this.active === 'power' || this.active==='pack-tactical') {
      const ability = abilities?.slots?.[this.active==='pack-tactical'?'tactical':this.active];
      const definition = ability && ABILITY_CATALOG[ability.id];
      if (definition) { this.heading.textContent = this.active!=='power'?`Pack lined up — use ${definition.name}.`:`Use ${definition.name} to control this approach.`; this.copy.textContent = ''; }
    }
    this.layoutAge = Infinity;
    this.node.dataset.action = this.active;
    this.node.hidden = !inspect;
    this.layoutDirty = true;
  }

  /** Clock is supplied by the application, so capture stepping remains exact. */
  tick(dt: number, player: Bounds, threats: readonly Bounds[] = []): void {
    if (this.disposed) return;
    if (this.node.hidden) {setPresentationObstacle('onboarding', null); return;}
    this.activeTime += dt;
    this.layoutAge += Math.max(0,dt);
    const layoutChanged = (this.layoutDirty && this.layoutAge >= .1) || this.translation !== this.host.style.translate || this.viewportWidth !== innerWidth || this.viewportHeight !== innerHeight;
    if (layoutChanged) {
      this.layoutAge = 0;this.layoutDirty = false; this.translation = this.host.style.translate;
      this.viewportWidth = innerWidth; this.viewportHeight = innerHeight;
      const bar = this.host.getBoundingClientRect();
      const anchor = this.active === 'medkit' ? document.getElementById('medkit-count')?.parentElement : this.active === 'grenade' ? document.getElementById('grenade-count')?.parentElement : this.active && ['dash', 'tactical', 'power', 'overdrive','pack-tactical'].includes(this.active) ? this.host.querySelector<HTMLElement>(`[data-ability="${this.active==='pack-tactical'?'tactical':this.active}"]`) : this.host.querySelector<HTMLElement>('.weapon-bank');
      const target = anchor?.getBoundingClientRect();
      const size = this.node.getBoundingClientRect();
      const center = Math.max(size.width / 2 + 8, Math.min(innerWidth - size.width / 2 - 8, target ? (target.left + target.right) / 2 : (bar.left + bar.right) / 2));
      let top = (this.active === 'medkit' || this.active === 'grenade') && target ? target.bottom + 24 : bar.top - size.height - 14;
      // A relocated action bar can sit at the top edge. Flip the prompt below
      // it when there is space, then clamp without changing its input behavior.
      if (top < 8 && bar.bottom + 14 + size.height <= innerHeight - 8) top = bar.bottom + 14;
      top = Math.max(8, Math.min(innerHeight - size.height - 8, top));
      this.preferredLeft = center - size.width / 2; this.preferredTop = top;
      this.promptWidth = size.width; this.promptHeight = size.height;
      this.originX = bar.left + this.host.clientLeft; this.originY = bar.top + this.host.clientTop;
    }
    const threatened = (left: number, top: number, width: number, height: number) => threats.some(box => left < box.right + 8 && left + width > box.left - 8 && top < box.bottom + 8 && top + height > box.top - 8);
    let left = this.preferredLeft;
    const top = this.preferredTop, width = this.promptWidth, height = this.promptHeight;
    let blocked = hudObstructs(left, top, left + width, top + height) || threatened(left, top, width, height);
    if (blocked) {
      // The layout already caches toast and chrome bounds. Try nearby horizontal
      // lanes without measuring or allocating, and return to the slot when clear.
      for (let attempt = 1; attempt <= 18; attempt++) {
        const offset = Math.ceil(attempt / 2) * 96 * (attempt % 2 ? 1 : -1);
        const candidate = attempt === 17 ? 8 : attempt === 18 ? innerWidth - width - 8 : Math.max(8, Math.min(innerWidth - width - 8, this.preferredLeft + offset));
        if (candidate < player.right + 12 && candidate + width > player.left - 12 && top < player.bottom + 12 && top + height > player.top - 12) continue;
        if (hudObstructs(candidate, top, candidate + width, top + height) || threatened(candidate, top, width, height)) continue;
        left = candidate; blocked = false; break;
      }
    }
    if (layoutChanged || left !== this.bounds.left || top !== this.bounds.top) {
      this.node.style.left = `${left + width / 2 - this.originX}px`;
      this.node.style.bottom = 'auto';
      this.node.style.top = `${top - this.originY}px`;
      this.bounds.left = left; this.bounds.right = left + width; this.bounds.top = top; this.bounds.bottom = top + height;
    }
    const overlap = this.bounds.left < player.right + 12 && this.bounds.right > player.left - 12 && this.bounds.top < player.bottom + 12 && this.bounds.bottom > player.top - 12;
    this.node.style.visibility = blocked || overlap ? 'hidden' : '';
    setPresentationObstacle('onboarding', blocked || overlap ? null : this.bounds);
  }

  dispose(): void { this.disposed = true; setPresentationObstacle('onboarding', null); this.node.remove(); }
}
