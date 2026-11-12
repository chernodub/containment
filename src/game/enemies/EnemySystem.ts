import {
  MAX_ACTIVE_ENEMIES,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../constants';
import { ENEMIES, STANDARD_ENEMY_IDS } from './catalog';
import { SpatialHash } from './SpatialHash';
import {Engagement, type AttackSlot, type EngagementState} from './Engagement';
import type { StandardEnemyId } from './types';

const ELITE_MULTIPLIER = 2;
const BRUTE_ARMOR_RATIO = 0.5;
const BRUTE_KNOCKBACK_RESISTANCE = 0.2;
const CARRIER_CHILD_CAP = 3;
const DEFAULT_PLAYER_RADIUS = 16;
const NEAR_DECISION_INTERVAL_MS = 50;
const FAR_DECISION_INTERVAL_MS = 250;
const FAR_DECISION_DISTANCE = 800;
const MAX_MOVEMENT_DELTA_MS = 250;
const MAX_TIMER_DELTA_MS = 2_000;
const SEPARATION_ITERATIONS = 6;
const SEPARATION_SKIN = .5;
const SEPARATION_SLOP = .05;
const SPITTER_MIN_RANGE = 240;
const SPITTER_MAX_RANGE = 360;
const SPITTER_ATTACK_MIN_RANGE = 180;
const SPITTER_ATTACK_MAX_RANGE = 420;
const STALKER_FLANK_DISTANCE = 180;
const STALKER_CAMOUFLAGED_MS = 2_000;
const STALKER_REVEALED_MS = 1_000;
const CAMOUFLAGED_ALPHA = 0.35;
const MAX_KNOCKBACK = 120;


export type EnemyPlayerState = {
  readonly x: number;
  readonly y: number;
  readonly radius?: number;
  readonly angle?: number;
};

export type CollisionSteeringContext = Readonly<{
  enemyId: number;
  enemyType: StandardEnemyId;
  radius: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}>;

export type EnemySystemOptions = Readonly<{
  balance?: {health:number;damage:number;speed:number;eliteHealth:number;eliteDamage:number;specials:boolean;chargeWindupMs?:number;chargeCooldownMs?:number;chargeInitialCooldownMs?:number;championHealth?:number;championDamage?:number};
  launched?: (id:number)=>boolean;
  immovables?: ()=>readonly {x:number;y:number;radius:number;health:number}[];
  canAttack?: (from:EnemyPlayerState & {type:StandardEnemyId},to:EnemyPlayerState)=>boolean;
  route?: (enemy: EnemyPlayerState & {radius:number}, player:EnemyPlayerState) => EnemyPlayerState|null;
  canMove?: (context: CollisionSteeringContext) => boolean;
}>;

export type ContactAttackEvent = Readonly<{
  type: 'contact-attack';
  enemyId: number;
  enemyType: StandardEnemyId;
  damage: number;
}>;

export type HazardAttackEvent = Readonly<{
  type: 'hazard-attack';
  enemyId: number;
  enemyType: 'spitter';
  damage: number;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}>;

export type EnemyDeathEvent = Readonly<{
  type: 'death';
  impulse?: Readonly<{x:number;y:number}>;
  enemyId: number;
  enemyType: StandardEnemyId;
  elite: boolean;
  x: number;
  y: number;
  reward: number;
  dropChance: number;
}>;

export type EnemySpawnRequestEvent = Readonly<{
  type: 'spawn-request';
  sourceEnemyId: number;
  enemyType: 'crawler';
  x: number;
  y: number;
  elite: false;
  requestIndex: number;
}>;

export type EnemyEvent =
  | ContactAttackEvent
  | HazardAttackEvent
  | EnemyDeathEvent
  | EnemySpawnRequestEvent
  | Readonly<{type:'attack-warning';enemyId:number;enemyType:StandardEnemyId;x:number;y:number;targetX:number;targetY:number;durationMs:number}>;

export type CamouflageState = 'camouflaged' | 'revealed' | 'none';

export type EnemySnapshot = Readonly<{
  id: number;
  type: StandardEnemyId;
  elite: boolean;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  targetX: number;
  targetY: number;
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  radius: number;
  speed: number;
  contactDamage: number;
  creditReward: number;
  dropChance: number;
  contactCooldownRemainingMs: number;
  rangedCooldownRemainingMs: number;
  decisionIntervalMs: number;
  decisionCooldownRemainingMs: number;
  decisionVersion: number;
  camouflageState: CamouflageState;
  camouflageRemainingMs: number;
  alpha: number;
  reservedChildren: number;
  attackSlot?: AttackSlot;
  engagement?: EngagementState;
  firingGoal?: {x:number;y:number;playerX:number;playerY:number};
  firingSearch?: {decision:number;playerX:number;playerY:number};
  baseSpeed:number;champion?:'warden'|'matron';
  windupMs:number;pendingAttack:'spit'|'charge'|null;lockX:number;lockY:number;specialCooldownMs:number;chargeMs:number;
}>;

export type EnemySystemSnapshot = Readonly<{
  activeCount: number;
  reservedCount: number;
  enemies: readonly EnemySnapshot[];
}>;

export type SpawnResult =
  | Readonly<{ spawned: true; enemy: EnemySnapshot }>
  | Readonly<{
      spawned: false;
      reason: 'capacity' | 'invalid-position' | 'invalid-type';
    }>;

export type DamageResult = Readonly<{
  applied: boolean;
  absorbedByArmor: number;
  healthDamage: number;
  died: boolean;
  appliedKnockback: Readonly<{ x: number; y: number }>;
  events: readonly EnemyEvent[];
}>;

type EnemyState = {
  id: number;
  type: StandardEnemyId;
  elite: boolean;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  targetX: number;
  targetY: number;
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  radius: number;
  speed: number;
  contactDamage: number;
  creditReward: number;
  dropChance: number;
  contactCooldownRemainingMs: number;
  rangedCooldownRemainingMs: number;
  decisionIntervalMs: number;
  decisionCooldownRemainingMs: number;
  decisionVersion: number;
  camouflageState: CamouflageState;
  camouflageRemainingMs: number;
  alpha: number;
  reservedChildren: number;
  attackSlot?: AttackSlot;
  engagement?: EngagementState;
  firingGoal?: {x:number;y:number;playerX:number;playerY:number};
  firingSearch?: {decision:number;playerX:number;playerY:number};
  baseSpeed:number;champion?:'warden'|'matron';
  windupMs:number;pendingAttack:'spit'|'charge'|null;lockX:number;lockY:number;specialCooldownMs:number;chargeMs:number;
};

type Vector = { x: number; y: number };

type SpatialEnemy = {
  readonly id: string;
  x: number;
  y: number;
  enemy: EnemyState;
  correctionX: number; correctionY: number; contacts: number;
};

const freezeEvent = <T extends EnemyEvent>(event: T): T => Object.freeze(event);

const freezeEvents = (events: EnemyEvent[]): readonly EnemyEvent[] =>
  Object.freeze(events.map((event) => freezeEvent(event)));

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

const normalized = (x: number, y: number): Vector => {
  const magnitude = Math.hypot(x, y);
  if (!Number.isFinite(magnitude) || magnitude === 0) return { x: 0, y: 0 };
  return { x: x / magnitude, y: y / magnitude };
};

const isStandardEnemyId = (value: unknown): value is StandardEnemyId =>
  typeof value === 'string' && STANDARD_ENEMY_IDS.includes(value as StandardEnemyId);

export class EnemySystem {
  readonly #enemies = new Map<number, EnemyState>();
  readonly #spatialHash = new SpatialHash<SpatialEnemy>(96);
  readonly #spatialEnemies = new Map<number, SpatialEnemy>();
  readonly #listeners = new Set<(event: EnemyEvent) => void>();
  readonly #canMove?: (context: CollisionSteeringContext) => boolean;
  readonly #route?: EnemySystemOptions['route'];
  readonly #balance:NonNullable<EnemySystemOptions['balance']>;readonly #canAttack?:EnemySystemOptions['canAttack'];
  readonly #engagement = new Engagement();
  readonly #nearby: SpatialEnemy[] = [];
  readonly #launched?: EnemySystemOptions['launched'];
  readonly #immovables?: EnemySystemOptions['immovables'];
  #nextId = 1;
  #reservedCount = 0;
  #solids:readonly {x:number;y:number;radius:number;health:number}[]=[];

  constructor(options: EnemySystemOptions = {}) {
    this.#canMove = options.canMove;
    this.#launched=options.launched;this.#immovables=options.immovables;
    this.#route = options.route;this.#canAttack=options.canAttack;this.#balance=options.balance??{health:1,damage:1,speed:1,eliteHealth:2,eliteDamage:2,specials:false};
  }

  get activeCount(): number {
    return this.#enemies.size;
  }

  get reservedCount(): number {
    return this.#reservedCount;
  }

  get snapshot(): EnemySystemSnapshot {
    return this.getSystemSnapshot();
  }

  #cachedSnapshot:EnemySystemSnapshot|null=null;
  getSystemSnapshot(): EnemySystemSnapshot {
    if(this.#cachedSnapshot)return this.#cachedSnapshot;
    const enemies = Object.freeze(
      [...this.#enemies.values()].map((enemy) => this.#snapshotEnemy(enemy)),
    );
    return this.#cachedSnapshot=Object.freeze({
      activeCount: this.activeCount,
      reservedCount: this.reservedCount,
      enemies,
    });
  }

  getSnapshot(id: number): EnemySnapshot | null {
    if (!Number.isSafeInteger(id)) return null;
    const enemy = this.#enemies.get(id);
    return enemy ? this.#snapshotEnemy(enemy) : null;
  }

  /** Swept movement for mutation impulses, using the same collision policy as AI. */
  moveBy(id:number,dx:number,dy:number):{blocked:boolean} {
    this.#cachedSnapshot=null;
    const enemy=this.#enemies.get(id);
    if(!enemy||!Number.isFinite(dx)||!Number.isFinite(dy))return {blocked:true};
    const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/8));
    if(steps>128)return {blocked:true};
    for(let i=0;i<steps;i++){
      const x=enemy.x+dx/steps,y=enemy.y+dy/steps;
      if(!this.#movementAllowed(enemy,x,y))return {blocked:true};
      enemy.x=x;enemy.y=y;
    }
    return {blocked:false};
  }

  setSlow(id:number,multiplier:number):void {
    this.#cachedSnapshot=null;
    const enemy=this.#enemies.get(id);
    if(enemy&&Number.isFinite(multiplier)){enemy.speed=enemy.baseSpeed*Math.max(0,Math.min(1,multiplier));enemy.decisionCooldownRemainingMs=0;if(enemy.speed===0)enemy.velocityX=enemy.velocityY=0;}
  }

  spawn(type: StandardEnemyId, x: number, y: number, elite = false): SpawnResult {
    this.#cachedSnapshot=null;
    if (!isStandardEnemyId(type)) {
      return Object.freeze({ spawned: false, reason: 'invalid-type' });
    }
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return Object.freeze({ spawned: false, reason: 'invalid-position' });
    }
    if (this.activeCount + this.reservedCount >= MAX_ACTIVE_ENEMIES) {
      return Object.freeze({ spawned: false, reason: 'capacity' });
    }

    const definition = ENEMIES[type];
    const multiplier = elite === true ? this.#balance.eliteHealth : 1;
    const maxHealth = definition.maxHealth * multiplier * this.#balance.health;
    const maxArmor = type === 'brute' ? maxHealth * BRUTE_ARMOR_RATIO : 0;
    const clampedX = clamp(x, 0, WORLD_WIDTH);
    const clampedY = clamp(y, 0, WORLD_HEIGHT);
    const availableReservations =
      MAX_ACTIVE_ENEMIES - (this.activeCount + this.reservedCount + 1);
    const reservedChildren =
      type === 'carrier' ? Math.min(CARRIER_CHILD_CAP, availableReservations) : 0;
    const state: EnemyState = {
      id: this.#nextId++,
      type,
      elite: elite === true,
      x: clampedX,
      y: clampedY,
      velocityX: 0,
      velocityY: 0,
      targetX: clampedX,
      targetY: clampedY,
      health: maxHealth,
      maxHealth,
      armor: maxArmor,
      maxArmor,
      radius: definition.radius,
      speed: definition.speed*this.#balance.speed,baseSpeed:definition.speed*this.#balance.speed,
      windupMs:0,pendingAttack:null,lockX:0,lockY:0,specialCooldownMs:type==='brute'&&elite===true?(this.#balance.chargeInitialCooldownMs??1500):1500,chargeMs:0,
      contactDamage: definition.contactDamage * (elite?this.#balance.eliteDamage:1)*this.#balance.damage,
      creditReward: Math.round(definition.creditReward * multiplier),
      dropChance: definition.dropChance,
      contactCooldownRemainingMs: 0,
      rangedCooldownRemainingMs: 0,
      decisionIntervalMs: NEAR_DECISION_INTERVAL_MS,
      decisionCooldownRemainingMs: 0,
      decisionVersion: 0,
      camouflageState: type === 'stalker' ? 'camouflaged' : 'none',
      camouflageRemainingMs: type === 'stalker' ? STALKER_CAMOUFLAGED_MS : 0,
      alpha: type === 'stalker' ? CAMOUFLAGED_ALPHA : 1,
      reservedChildren,
    };

    this.#enemies.set(state.id, state);
    const spatialEnemy: SpatialEnemy = {
      id: String(state.id),
      x: state.x,
      y: state.y,
      enemy: state,correctionX:0,correctionY:0,contacts:0,
    };
    this.#spatialEnemies.set(state.id, spatialEnemy);
    this.#spatialHash.insert(spatialEnemy);
    this.#reservedCount += reservedChildren;
    return Object.freeze({ spawned: true, enemy: this.#snapshotEnemy(state) });
  }

  promote(id:number,kind:'warden'|'matron'){
    this.#cachedSnapshot=null;
   const e=this.#enemies.get(id);if(!e)return;
   // Promotion keeps the authored Warden opening after an ordinary elite received a longer initial delay.
   if(kind==='warden'&&e.type==='brute'&&e.elite&&this.#balance.chargeInitialCooldownMs!==undefined)e.specialCooldownMs=1500;
   e.champion=kind;e.health=e.maxHealth=(kind==='warden'?760:1150)*(this.#balance.championHealth??1);e.armor=e.maxArmor=kind==='warden'?120:0;e.speed=e.baseSpeed=kind==='warden'?88:76;e.contactDamage=(kind==='warden'?28:24)*(this.#balance.championDamage??1);e.creditReward=kind==='warden'?100:150;
  }

  update(deltaMs: number, player: EnemyPlayerState): readonly EnemyEvent[] {
    this.#cachedSnapshot=null;
    if (!this.#validDelta(deltaMs) || !this.#validPlayer(player)) {
      return Object.freeze([]);
    }

    const timerDelta = Math.min(deltaMs, MAX_TIMER_DELTA_MS);
    const movementDelta = Math.min(deltaMs, MAX_MOVEMENT_DELTA_MS);
    const events: EnemyEvent[] = [];

    this.#solids=this.#immovables?.()??[];
    this.#engagement.update(this.#enemies.values(),player,(e,x,y)=>this.#movementAllowed({...e,x,y},x,y),(x,y)=>{const first=this.#enemies.values().next().value;return !first||this.#movementAllowed({...first,x:player.x,y:player.y,radius:player.radius??16},x,y);});

    for (const enemy of this.#enemies.values()) {
      if(enemy.speed===0)continue; // Shared freeze/shock suspends hostile wind-ups as well as movement.
      enemy.contactCooldownRemainingMs = Math.max(
        0,
        enemy.contactCooldownRemainingMs - timerDelta,
      );
      enemy.rangedCooldownRemainingMs = Math.max(
        0,
        enemy.rangedCooldownRemainingMs - timerDelta,
      );
      enemy.decisionCooldownRemainingMs = Math.max(
        0,
        enemy.decisionCooldownRemainingMs - timerDelta,
      );
      enemy.specialCooldownMs=Math.max(0,enemy.specialCooldownMs-timerDelta);enemy.chargeMs=Math.max(0,enemy.chargeMs-timerDelta);
      if(enemy.windupMs>0){enemy.windupMs=Math.max(0,enemy.windupMs-timerDelta);if(enemy.windupMs===0){
       if(enemy.pendingAttack==='spit')events.push(freezeEvent({type:'hazard-attack',enemyId:enemy.id,enemyType:'spitter',damage:enemy.contactDamage,sourceX:enemy.x,sourceY:enemy.y,targetX:enemy.lockX,targetY:enemy.lockY}));
       if(enemy.pendingAttack==='charge')enemy.chargeMs=650;enemy.pendingAttack=null;enemy.decisionCooldownRemainingMs=0;
      }}
      this.#advanceCamouflage(enemy, timerDelta);
    }

    for (const enemy of this.#enemies.values()) {
      if(enemy.speed===0)continue;
      if (enemy.decisionCooldownRemainingMs === 0) {
        this.#decide(enemy, player);
      }
    }

    for (const enemy of this.#enemies.values()) {
      if(enemy.speed===0)continue;
      if(!this.#launched?.(enemy.id))this.#integrate(enemy, movementDelta);
    }
    if(movementDelta>0)this.#resolveCrowd();
    for(const enemy of this.#enemies.values()){
      if(enemy.speed>0)this.#collectAttacks(enemy, player, events);
    }

    const frozen = freezeEvents(events);
    this.#publish(frozen);
    return frozen;
  }

  applyDamage(
    id: number,
    amount: number,
    knockback?: Readonly<{ x: number; y: number }>,
  ): DamageResult {
    this.#cachedSnapshot=null;
    const enemy = Number.isSafeInteger(id) ? this.#enemies.get(id) : undefined;
    if (!enemy || !Number.isFinite(amount) || amount <= 0) {
      return this.#damageResult(false, 0, 0, false, { x: 0, y: 0 }, []);
    }

    const absorbedByArmor = Math.min(enemy.armor, amount);
    enemy.armor -= absorbedByArmor;
    const healthDamage = Math.min(enemy.health, amount - absorbedByArmor);
    enemy.health -= healthDamage;
    const died = enemy.health === 0;
    // The corpse carries the lethal impulse; do not teleport it before physics starts.
    const appliedKnockback = died ? Object.freeze({x:0,y:0}) : this.#applyKnockback(enemy, knockback);
    const events: EnemyEvent[] = [];

    if (died) {
      events.push(
        freezeEvent({
          type: 'death',
          enemyId: enemy.id,
          enemyType: enemy.type,
          elite: enemy.elite,
          x: enemy.x,
          y: enemy.y,
          reward: enemy.creditReward,
          dropChance: enemy.dropChance,
          impulse: { x: Number.isFinite(knockback?.x) ? knockback!.x * 12 : 0, y: Number.isFinite(knockback?.y) ? knockback!.y * 12 : 0 },
        }),
      );
      if (enemy.type === 'carrier') {
        for (let index = 0; index < enemy.reservedChildren; index += 1) {
          const angle = (index * Math.PI * 2) / Math.max(1, enemy.reservedChildren);
          events.push(
            freezeEvent({
              type: 'spawn-request',
              sourceEnemyId: enemy.id,
              enemyType: 'crawler',
              x: clamp(enemy.x + Math.cos(angle) * enemy.radius, 0, WORLD_WIDTH),
              y: clamp(enemy.y + Math.sin(angle) * enemy.radius, 0, WORLD_HEIGHT),
              elite: false,
              requestIndex: index,
            }),
          );
        }
      }
      this.#reservedCount -= enemy.reservedChildren;
      this.#enemies.delete(enemy.id);
      const spatialEnemy = this.#spatialEnemies.get(enemy.id);
      if (spatialEnemy) this.#spatialHash.remove(spatialEnemy);
      this.#spatialEnemies.delete(enemy.id);
    }

    const result = this.#damageResult(
      true,
      absorbedByArmor,
      healthDamage,
      died,
      appliedKnockback,
      events,
    );
    this.#publish(result.events);
    return result;
  }

  remove(id: number): boolean {
    this.#cachedSnapshot=null;
    if (!Number.isSafeInteger(id)) return false;
    const enemy = this.#enemies.get(id);
    if (!enemy) return false;
    this.#reservedCount -= enemy.reservedChildren;
    this.#enemies.delete(id);
    const spatialEnemy = this.#spatialEnemies.get(id);
    if (spatialEnemy) this.#spatialHash.remove(spatialEnemy);
    this.#spatialEnemies.delete(id);
    return true;
  }

  reset(): void {
    this.#cachedSnapshot=null;
    this.#enemies.clear();
    this.#spatialHash.clear();
    this.#spatialEnemies.clear();
    this.#reservedCount = 0;
    this.#nextId = 1;this.#engagement.reset();
  }

  subscribe(listener: (event: EnemyEvent) => void): () => void {
    this.#listeners.add(listener);
    let subscribed = true;
    return () => {
      if (!subscribed) return;
      subscribed = false;
      this.#listeners.delete(listener);
    };
  }

  #snapshotEnemy(enemy: EnemyState): EnemySnapshot {
    return Object.freeze({
      id: enemy.id,
      type: enemy.type,
      elite: enemy.elite,
      x: enemy.x,
      y: enemy.y,
      velocityX: enemy.velocityX,
      velocityY: enemy.velocityY,
      targetX: enemy.targetX,
      targetY: enemy.targetY,
      health: enemy.health,
      maxHealth: enemy.maxHealth,
      armor: enemy.armor,
      maxArmor: enemy.maxArmor,
      radius: enemy.radius,
      speed: enemy.speed,
      baseSpeed:enemy.baseSpeed,champion:enemy.champion,windupMs:enemy.windupMs,pendingAttack:enemy.pendingAttack,lockX:enemy.lockX,lockY:enemy.lockY,specialCooldownMs:enemy.specialCooldownMs,chargeMs:enemy.chargeMs,
      contactDamage: enemy.contactDamage,
      creditReward: enemy.creditReward,
      dropChance: enemy.dropChance,
      contactCooldownRemainingMs: enemy.contactCooldownRemainingMs,
      rangedCooldownRemainingMs: enemy.rangedCooldownRemainingMs,
      decisionIntervalMs: enemy.decisionIntervalMs,
      decisionCooldownRemainingMs: enemy.decisionCooldownRemainingMs,
      decisionVersion: enemy.decisionVersion,
      camouflageState: enemy.camouflageState,
      camouflageRemainingMs: enemy.camouflageRemainingMs,
      alpha: enemy.alpha,
      reservedChildren: enemy.reservedChildren,
      attackSlot:enemy.attackSlot,engagement:enemy.engagement,
    });
  }

  #validDelta(deltaMs: number): boolean {
    return Number.isFinite(deltaMs) && deltaMs >= 0;
  }

  #validPlayer(player: EnemyPlayerState): boolean {
    return (
      player !== null &&
      typeof player === 'object' &&
      Number.isFinite(player.x) &&
      Number.isFinite(player.y) &&
      (player.radius === undefined ||
        (Number.isFinite(player.radius) && player.radius >= 0))
    );
  }

  #advanceCamouflage(enemy: EnemyState, deltaMs: number): void {
    if (enemy.type !== 'stalker' || deltaMs === 0) return;
    let remainingDelta = deltaMs;
    while (remainingDelta >= enemy.camouflageRemainingMs) {
      remainingDelta -= enemy.camouflageRemainingMs;
      if (enemy.camouflageState === 'camouflaged') {
        enemy.camouflageState = 'revealed';
        enemy.camouflageRemainingMs = STALKER_REVEALED_MS;
        enemy.alpha = 1;
      } else {
        enemy.camouflageState = 'camouflaged';
        enemy.camouflageRemainingMs = STALKER_CAMOUFLAGED_MS;
        enemy.alpha = CAMOUFLAGED_ALPHA;
      }
    }
    enemy.camouflageRemainingMs -= remainingDelta;
  }

  #decide(enemy: EnemyState, player: EnemyPlayerState): void {
    if(enemy.speed===0||enemy.windupMs>0){enemy.velocityX=enemy.velocityY=0;return;}
    if(enemy.chargeMs>0){const d=normalized(enemy.lockX,enemy.lockY);enemy.velocityX=d.x*330;enemy.velocityY=d.y*330;return;}
    const distanceToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    enemy.decisionIntervalMs =
      distanceToPlayer > FAR_DECISION_DISTANCE
        ? FAR_DECISION_INTERVAL_MS
        : NEAR_DECISION_INTERVAL_MS;
    enemy.decisionCooldownRemainingMs = enemy.decisionIntervalMs;
    enemy.decisionVersion += 1;

    let targetX = player.x;
    let targetY = player.y;
    let direction = normalized(player.x - enemy.x, player.y - enemy.y);

    // Seek a clear shot before holding range or retreating.
    if (enemy.type === 'spitter' && this.#canAttack?.(enemy, player) !== false) {
      if (distanceToPlayer < SPITTER_MIN_RANGE) {
        direction = normalized(enemy.x - player.x, enemy.y - player.y);
        targetX = enemy.x + direction.x * SPITTER_MIN_RANGE;
        targetY = enemy.y + direction.y * SPITTER_MIN_RANGE;
      } else if (distanceToPlayer <= SPITTER_MAX_RANGE) {
        direction = { x: 0, y: 0 };
        targetX = enemy.x;
        targetY = enemy.y;
      }
    } else if (enemy.type === 'stalker') {
      const toPlayer = normalized(player.x - enemy.x, player.y - enemy.y);
      const flankSide = enemy.id % 2 === 0 ? -1 : 1;
      targetX = player.x - toPlayer.y * STALKER_FLANK_DISTANCE * flankSide;
      targetY = player.y + toPlayer.x * STALKER_FLANK_DISTANCE * flankSide;
      direction = normalized(targetX - enemy.x, targetY - enemy.y);
    }

    const engagementGoal=this.#engagement.goal(enemy,player);
    if(engagementGoal){targetX=engagementGoal.x;targetY=engagementGoal.y;direction=normalized(targetX-enemy.x,targetY-enemy.y);}

    const goalLegal=enemy.type!=='spitter'||this.#firingPositionLegal(enemy,{x:targetX,y:targetY});
    const keepFiringGoal=enemy.type==='spitter'&&enemy.firingGoal&&(distanceToPlayer<SPITTER_MIN_RANGE||distanceToPlayer>SPITTER_MAX_RANGE||this.#canAttack?.(enemy,player)===false);
    let route=goalLegal&&!keepFiringGoal?this.#route?.(enemy,{x:targetX,y:targetY}):enemy;
    if(enemy.type==='spitter'&&(keepFiringGoal||!goalLegal||(route?.x===enemy.x&&route.y===enemy.y&&(targetX!==enemy.x||targetY!==enemy.y)))){
      const alternative=this.#alternateFiringPosition(enemy,player);
      if(alternative){targetX=alternative.goal.x;targetY=alternative.goal.y;direction=normalized(targetX-enemy.x,targetY-enemy.y);route=alternative.route;}
      else route=enemy;
    }
    // Navigation returns the current position when the flank has no route.
    // The flank is optional; retry the real player goal rather than stand still.
    if((enemy.type==='stalker'||engagementGoal) && route?.x===enemy.x && route.y===enemy.y){
      targetX=player.x;targetY=player.y;
      direction=normalized(targetX-enemy.x,targetY-enemy.y);
      route=this.#route?.(enemy,player);
    }
    if(route){targetX=route.x;targetY=route.y;direction=normalized(targetX-enemy.x,targetY-enemy.y);}

    enemy.targetX = clamp(targetX, 0, WORLD_WIDTH);
    enemy.targetY = clamp(targetY, 0, WORLD_HEIGHT);
    const distance=Math.hypot(targetX-enemy.x,targetY-enemy.y);
    const speed=engagementGoal&&distance<(enemy.attackSlot?.01:1)?0:enemy.speed;
    enemy.velocityX = direction.x * speed;
    enemy.velocityY = direction.y * speed;
  }

  #firingPositionLegal(enemy:EnemyState,goal:EnemyPlayerState):boolean {
    if(goal.x<enemy.radius||goal.y<enemy.radius||goal.x>WORLD_WIDTH-enemy.radius||goal.y>WORLD_HEIGHT-enemy.radius)return false;
    return this.#movementAllowed({...enemy,x:goal.x,y:goal.y},goal.x,goal.y);
  }

  #alternateFiringPosition(enemy:EnemyState,player:EnemyPlayerState){
    const usable=(goal:EnemyPlayerState)=>{
      const range=Math.hypot(goal.x-player.x,goal.y-player.y);
      if(range<SPITTER_MIN_RANGE||range>SPITTER_MAX_RANGE||!this.#firingPositionLegal(enemy,goal)||this.#canAttack?.({...goal,type:'spitter'},player)===false)return null;
      const route=this.#route?.(enemy,goal);
      if(route?.x===enemy.x&&route.y===enemy.y)return null;
      return {goal,route};
    };
    const cached=enemy.firingGoal;
    if(cached&&Math.hypot(cached.playerX-player.x,cached.playerY-player.y)<32){const result=usable(cached);if(result)return result;}
    enemy.firingGoal=undefined;
    const failed=enemy.firingSearch;
    if(failed&&enemy.decisionVersion-failed.decision<5&&Math.hypot(failed.playerX-player.x,failed.playerY-player.y)<32)return null;
    const candidates:EnemyPlayerState[]=[];
    for(const radius of [280,340])for(let i=0;i<16;i++){const angle=i*Math.PI/8;candidates.push({x:player.x+Math.cos(angle)*radius,y:player.y+Math.sin(angle)*radius});}
    candidates.sort((a,b)=>Math.hypot(a.x-enemy.x,a.y-enemy.y)-Math.hypot(b.x-enemy.x,b.y-enemy.y));
    for(const goal of candidates){const result=usable(goal);if(result){enemy.firingGoal={...goal,playerX:player.x,playerY:player.y};enemy.firingSearch=undefined;return result;}}
    enemy.firingSearch={decision:enemy.decisionVersion,playerX:player.x,playerY:player.y};
    return null;
  }

  /** Jacobi projections: all pair corrections read the same positions, then
   * apply together. Frozen bodies are anchors; launches retain swept contacts.
   * A small skin and dead band prevent contact/steering chatter. */
  #resolveCrowd(): void {
    const solids=this.#solids;
    for(let iteration=0;iteration<SEPARATION_ITERATIONS;iteration++){
      this.#rebuildSpatialHash();
      let corrections=0;
      for(const entry of this.#spatialEnemies.values()){entry.correctionX=entry.correctionY=entry.contacts=0;}
      for(const a of this.#spatialEnemies.values()){
        const enemy=a.enemy;
        if(this.#launched?.(enemy.id))continue;
        this.#spatialHash.queryRadiusInto(enemy.x,enemy.y,enemy.radius+29,this.#nearby);
        for(const b of this.#nearby){
          const other=b.enemy;
          if(enemy.id>=other.id||this.#launched?.(other.id))continue;
          const dx=enemy.x-other.x,dy=enemy.y-other.y,d=Math.hypot(dx,dy);
          const overlap=enemy.radius+other.radius+SEPARATION_SKIN-d;
          if(overlap<=SEPARATION_SLOP)continue;
          const movableA=enemy.speed>0,movableB=other.speed>0;
          if(!movableA&&!movableB)continue;
          // ID-derived axis resolves exact coincident spawns without randomness.
          const angle=((enemy.id*73+other.id*37)%360)*Math.PI/180;
          const nx=d>1e-9?dx/d:Math.cos(angle),ny=d>1e-9?dy/d:Math.sin(angle);
          const correction=(overlap-SEPARATION_SLOP)*(movableA&&movableB?.5:1);
          if(movableA){a.correctionX+=nx*correction;a.correctionY+=ny*correction;a.contacts++;}
          if(movableB){b.correctionX-=nx*correction;b.correctionY-=ny*correction;b.contacts++;}
        }
        if(enemy.speed===0)continue;
        for(const solid of solids){
          if(solid.health<=0)continue;
          const dx=enemy.x-solid.x,dy=enemy.y-solid.y,d=Math.hypot(dx,dy),overlap=enemy.radius+solid.radius+SEPARATION_SKIN-d;
          if(overlap<=SEPARATION_SLOP)continue;
          const angle=enemy.id*2.399963229728653;
          a.correctionX+=(d>1e-9?dx/d:Math.cos(angle))*(overlap-SEPARATION_SLOP);
          a.correctionY+=(d>1e-9?dy/d:Math.sin(angle))*(overlap-SEPARATION_SLOP);a.contacts++;
        }
      }
      for(const entry of this.#spatialEnemies.values()){
        if(!entry.contacts)continue;
        const enemy=entry.enemy,length=Math.hypot(entry.correctionX,entry.correctionY);
        if(length<.01)continue;
        const scale=Math.min(.9,8/length),dx=entry.correctionX*scale,dy=entry.correctionY*scale;
        for(const [x,y] of [[enemy.x+dx,enemy.y+dy],[enemy.x+dx,enemy.y],[enemy.x,enemy.y+dy]]){
          if(x<enemy.radius||y<enemy.radius||x>WORLD_WIDTH-enemy.radius||y>WORLD_HEIGHT-enemy.radius||!this.#movementAllowed(enemy,x,y))continue;
          enemy.x=x;enemy.y=y;corrections++;break;
        }
      }
      if(corrections===0)break;
    }
  }

  #rebuildSpatialHash(): void {
    for (const enemy of this.#enemies.values()) {
      let spatialEnemy = this.#spatialEnemies.get(enemy.id);
      if (!spatialEnemy) {
        spatialEnemy = {
          id: String(enemy.id),
          x: enemy.x,
          y: enemy.y,
          enemy,correctionX:0,correctionY:0,contacts:0,
        };
        this.#spatialEnemies.set(enemy.id, spatialEnemy);
      } else {
        spatialEnemy.x = enemy.x;
        spatialEnemy.y = enemy.y;
      }
      this.#spatialHash.insert(spatialEnemy);
    }
  }

  #integrate(enemy: EnemyState, deltaMs: number): void {
    if (deltaMs === 0) return;
    const distance=Math.hypot(enemy.targetX-enemy.x,enemy.targetY-enemy.y);
    const velocity=Math.hypot(enemy.velocityX,enemy.velocityY);
    const scale = Math.min(deltaMs / 1_000,enemy.chargeMs>0?Infinity:distance/(velocity||1));
    const movementX = enemy.velocityX * scale;
    const movementY = enemy.velocityY * scale;
    if (movementX === 0 && movementY === 0) return;

    const candidates = [
      { x: enemy.x + movementX, y: enemy.y + movementY },
      { x: enemy.x + movementX, y: enemy.y },
      { x: enemy.x, y: enemy.y + movementY },
      { x: enemy.x - movementY, y: enemy.y + movementX },
      { x: enemy.x + movementY, y: enemy.y - movementX },
    ];
    for (const candidate of candidates) {
      const toX = clamp(candidate.x, 0, WORLD_WIDTH);
      const toY = clamp(candidate.y, 0, WORLD_HEIGHT);
      if (!this.#movementAllowed(enemy, toX, toY)) continue;
      enemy.x = toX;
      enemy.y = toY;
      return;
    }
  }

  #movementAllowed(enemy: EnemyState, toX: number, toY: number): boolean {
    if(!this.#launched?.(enemy.id))for(const solid of this.#solids){
      if(solid.health<=0)continue;
      const radius=enemy.radius+solid.radius,before=Math.hypot(enemy.x-solid.x,enemy.y-solid.y),after=Math.hypot(toX-solid.x,toY-solid.y);
      if(before<radius){if(after<=before+1e-9)return false;continue;}
      const dx=toX-enemy.x,dy=toY-enemy.y,den=dx*dx+dy*dy;
      const t=den?clamp(((solid.x-enemy.x)*dx+(solid.y-enemy.y)*dy)/den,0,1):0;
      if(Math.hypot(enemy.x+dx*t-solid.x,enemy.y+dy*t-solid.y)<radius-1e-7)return false;
    }
    if (!this.#canMove) return true;
    const context: CollisionSteeringContext = Object.freeze({
      enemyId: enemy.id,
      enemyType: enemy.type,
      radius: enemy.radius,
      fromX: enemy.x,
      fromY: enemy.y,
      toX,
      toY,
    });
    try {
      return this.#canMove(context) === true;
    } catch {
      return false;
    }
  }

  #collectAttacks(
    enemy: EnemyState,
    player: EnemyPlayerState,
    events: EnemyEvent[],
  ): void {
    const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    const playerRadius = player.radius ?? DEFAULT_PLAYER_RADIUS;
    if(this.#balance.specials&&enemy.windupMs>0)return;
    if(this.#balance.specials&&(enemy.type==='brute'&&enemy.elite||enemy.champion==='warden')&&enemy.specialCooldownMs===0&&distance>110&&distance<420&&this.#canAttack?.(enemy,player)!==false){
     const windup=enemy.champion==='warden'?850:this.#balance.chargeWindupMs??850,cooldown=enemy.champion==='warden'?4600:this.#balance.chargeCooldownMs??4600;
     enemy.windupMs=windup;enemy.pendingAttack='charge';enemy.lockX=player.x-enemy.x;enemy.lockY=player.y-enemy.y;enemy.specialCooldownMs=cooldown;enemy.velocityX=enemy.velocityY=0;events.push(freezeEvent({type:'attack-warning',enemyId:enemy.id,enemyType:enemy.type,x:enemy.x,y:enemy.y,targetX:player.x,targetY:player.y,durationMs:windup}));return;
    }
    if (
      distance <= enemy.radius + playerRadius &&
      (enemy.engagement!=='waiting'||enemy.chargeMs>0) &&
      enemy.contactCooldownRemainingMs === 0
    ) {
      events.push(
        freezeEvent({
          type: 'contact-attack',
          enemyId: enemy.id,
          enemyType: enemy.type,
          damage: enemy.contactDamage,
        }),
      );
      enemy.contactCooldownRemainingMs = ENEMIES[enemy.type].attackCooldownMs;
    }

    if (
      enemy.type === 'spitter' &&
      distance >= SPITTER_ATTACK_MIN_RANGE &&
      distance <= SPITTER_ATTACK_MAX_RANGE &&
      enemy.rangedCooldownRemainingMs === 0 && this.#canAttack?.(enemy,player)!==false
    ) {
      if(this.#balance.specials){enemy.windupMs=500;enemy.pendingAttack='spit';enemy.lockX=player.x;enemy.lockY=player.y;enemy.rangedCooldownRemainingMs=ENEMIES.spitter.attackCooldownMs+500;enemy.velocityX=enemy.velocityY=0;events.push(freezeEvent({type:'attack-warning',enemyId:enemy.id,enemyType:enemy.type,x:enemy.x,y:enemy.y,targetX:player.x,targetY:player.y,durationMs:500}));return;}
      events.push(
        freezeEvent({
          type: 'hazard-attack',
          enemyId: enemy.id,
          enemyType: 'spitter',
          damage: enemy.contactDamage,
          sourceX: enemy.x,
          sourceY: enemy.y,
          targetX: player.x,
          targetY: player.y,
        }),
      );
      enemy.rangedCooldownRemainingMs = ENEMIES.spitter.attackCooldownMs;
    }
  }

  #applyKnockback(
    enemy: EnemyState,
    knockback?: Readonly<{ x: number; y: number }>,
  ): Readonly<{ x: number; y: number }> {
    if (
      !knockback ||
      !Number.isFinite(knockback.x) ||
      !Number.isFinite(knockback.y)
    ) {
      return Object.freeze({ x: 0, y: 0 });
    }
    const magnitude = Math.hypot(knockback.x, knockback.y);
    if (magnitude === 0) return Object.freeze({ x: 0, y: 0 });
    const clampedMagnitude = Math.min(magnitude, MAX_KNOCKBACK);
    const resistance = enemy.type === 'brute' ? BRUTE_KNOCKBACK_RESISTANCE : 1;
    const appliedX = (knockback.x / magnitude) * clampedMagnitude * resistance;
    const appliedY = (knockback.y / magnitude) * clampedMagnitude * resistance;
    const previousX = enemy.x;
    const previousY = enemy.y;
    const candidates = [
      {
        x: clamp(previousX + appliedX, 0, WORLD_WIDTH),
        y: clamp(previousY + appliedY, 0, WORLD_HEIGHT),
      },
      { x: clamp(previousX + appliedX, 0, WORLD_WIDTH), y: previousY },
      { x: previousX, y: clamp(previousY + appliedY, 0, WORLD_HEIGHT) },
    ];
    for (const candidate of candidates) {
      if (
        (candidate.x === previousX && candidate.y === previousY) ||
        !this.#movementAllowed(enemy, candidate.x, candidate.y)
      ) {
        continue;
      }
      enemy.x = candidate.x;
      enemy.y = candidate.y;
      break;
    }
    return Object.freeze({ x: enemy.x - previousX, y: enemy.y - previousY });
  }

  #damageResult(
    applied: boolean,
    absorbedByArmor: number,
    healthDamage: number,
    died: boolean,
    appliedKnockback: Readonly<{ x: number; y: number }>,
    events: EnemyEvent[],
  ): DamageResult {
    this.#cachedSnapshot=null;
    return Object.freeze({
      applied,
      absorbedByArmor,
      healthDamage,
      died,
      appliedKnockback: Object.freeze({ ...appliedKnockback }),
      events: freezeEvents(events),
    });
  }

  #publish(events: readonly EnemyEvent[]): void {
    if (events.length === 0 || this.#listeners.size === 0) return;
    for (const event of events) {
      for (const listener of [...this.#listeners]) {
        try {
          listener(event);
        } catch {
          // Scene/HUD adapters cannot roll back deterministic simulation state.
        }
      }
    }
  }
}
