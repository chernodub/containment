import {BOSS_BODIES,guardianMeleeShape} from './bossDefinitions';
import type {EnemyRole} from '../waves/authoredEncounters';
import {ENEMY_ATTACK_SHAPES} from './attackShapes';
import {MELEE_ATTACKS, ELITE_MELEE_WINDUP_SCALE, ELITE_MELEE_RECOVERY_SCALE, MELEE_START_STAGGER_MS, calculateMeleeDamage, meleeStrikeContains, type MeleePhase, type MeleeStrikeShape} from './meleeAttacks';
import {
  MAX_ACTIVE_ENEMIES,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../constants';
import { ENEMIES, ENEMY_FAMILY_SCALE, ELITE_BODY_SCALE, enemyBodyRadius, STANDARD_ENEMY_IDS } from './catalog';
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
  readonly vx?:number;readonly vy?:number;
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

export type EnemySpawnOptions=Readonly<{openingVolley?:{x:number;y:number};healthScale?:number;role?:EnemyRole;priority?:boolean;controlResistant?:boolean;beat?:number;lesson?:'crawler'|'brute'|'stalker';pod?:boolean;hatchMs?:number;podOrigin?:Readonly<{x:number;y:number}>}>;

export type EnemySystemOptions = Readonly<{spitWindupMs?:number;slick?:(point:{x:number;y:number})=>boolean;openingWindup?:number;lateDifficulty?:boolean;difficulty?:()=>{rest:number;windups:number;lateRest?:number;lateWindups?:number;lateStagger?:number;lateMovement?:number};
  balance?: {health:number;damage:number;speed:number;eliteHealth:number;eliteDamage:number;specials:boolean;chargeWindupMs?:number;chargeCooldownMs?:number;chargeInitialCooldownMs?:number;championHealth?:number;championDamage?:number};
  canSeePlayer?: (from:EnemyPlayerState,to:EnemyPlayerState)=>boolean;
  launched?: (id:number)=>boolean;
  immovables?: ()=>readonly {x:number;y:number;radius:number;health:number}[];
  wardenOpeningAim?: (enemy:EnemyPlayerState,player:EnemyPlayerState)=>{x:number;y:number}|undefined;
  canCommit?: (enemy: EnemyCommitment, player: EnemyPlayerState, others: Iterable<EnemyCommitment>, attack: 'melee'|'ranged'|'charge')=>boolean;
  canAttack?: (from:EnemyPlayerState & {type:StandardEnemyId},to:EnemyPlayerState)=>boolean;
  route?: (enemy: EnemyPlayerState & {radius:number}, player:EnemyPlayerState) => EnemyPlayerState|null;
  canMove?: (context: CollisionSteeringContext) => boolean;
}>;

export type ContactAttackEvent = Readonly<{
  type: 'contact-attack';
  attack?:'charge';
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

export type EnemyDeathEvent = Readonly<{priority?:boolean;beat?:number;
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

export type EnemySpawnRequestEvent = Readonly<{pod?:boolean;hatchMs?:number;beat?:number;
  type: 'spawn-request';
  sourceEnemyId: number;
  enemyType: 'crawler';
  x: number;
  y: number;
  elite: false;
  requestIndex: number;
}>;

export type MeleeWarningEvent = Readonly<{type:'melee-warning';enemyId:number;enemyType:StandardEnemyId;x:number;y:number;angle:number;shape:MeleeStrikeShape;durationMs:number}>;
export type MeleeStrikeEvent = Readonly<{type:'melee-strike';enemyId:number;enemyType:StandardEnemyId;x:number;y:number;angle:number;shape:MeleeStrikeShape}>;

export type EnemyEvent =
  | MeleeWarningEvent
  | MeleeStrikeEvent
  | ContactAttackEvent
  | HazardAttackEvent
  | EnemyDeathEvent
  | EnemySpawnRequestEvent
  | Readonly<{type:'attack-warning';enemyId:number;enemyType:StandardEnemyId;x:number;y:number;targetX:number;targetY:number;durationMs:number}>;

export type CamouflageState = 'camouflaged' | 'revealed' | 'none';

export type PodStage = 'sealed' | 'swelling' | 'opening';
export type EnemySnapshot = Readonly<{wallStunAngle?:number;chargeWarningLength?:number;role?:EnemyRole;priority?:boolean;controlResistant?:boolean;beat?:number;pod?:boolean;podRemainingMs?:number;podStage?:PodStage;podProgress?:number;stunRemainingMs?:number;broodRemainingMs?:number;lesson?:'crawler'|'brute'|'stalker';
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
  meleeDamage: number;
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
  meleePhase:MeleePhase;meleeProgress:number;meleeAngle:number;meleeFacingLocked:boolean;
  meleeShape:MeleeStrikeShape;meleeOriginX:number;meleeOriginY:number;meleeRemainingMs:number;meleeDurationMs:number;
}>;

export const WARDEN_WALL_STUN_MS=1500;

export type EnemyCommitment = Pick<EnemySnapshot,'id'|'type'|'role'|'beat'|'meleePhase'|'meleeAngle'|'x'|'y'|'champion'|'stunRemainingMs'|'wallStunAngle'|'meleeShape'|'pendingAttack'|'chargeMs'>;

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

type EnemyState = {firstWardenCharge?:true;openingVolley?:{x:number;y:number};wallStunAngle?:number;rushing?:boolean;role?:EnemyRole;priority:boolean;controlResistant:boolean;beat?:number;lesson?:'crawler'|'brute'|'stalker';pod:boolean;podRemainingMs:number;podDurationMs:number;podWarned:boolean;stunRemainingMs:number;broodRemainingMs:number;broodDamage:number;slowMultiplier:number;chargeHit:boolean;repositionRemainingMs:number;repositionX:number;repositionY:number;
  blockedMs?: number; yieldMs?: number; yieldX?: number; yieldY?: number;
  stepStartX?: number; stepStartY?: number;
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
  meleePhase:MeleePhase;meleeProgress:number;meleeAngle:number;meleeFacingLocked:boolean;
  meleeShape:MeleeStrikeShape;meleeOriginX:number;meleeOriginY:number;meleeRemainingMs:number;meleeDurationMs:number;
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
  readonly #wardenOpeningAim?: EnemySystemOptions['wardenOpeningAim'];
  readonly #canCommit?: EnemySystemOptions['canCommit'];
  readonly #route?: EnemySystemOptions['route'];
  readonly #balance:NonNullable<EnemySystemOptions['balance']>;readonly #canAttack?:EnemySystemOptions['canAttack'];
  readonly #engagement = new Engagement();
  readonly #nearby: SpatialEnemy[] = [];
  readonly #canSeePlayer?: EnemySystemOptions['canSeePlayer'];
  readonly #launched?: EnemySystemOptions['launched'];
  readonly #immovables?: EnemySystemOptions['immovables'];
  #nextId = 1;
  #reservedCount = 0;
  #meleeStartGapMs=0;
  #lateDifficulty=false;
  get #movement(){return this.#lateDifficulty?(this.#difficulty().lateMovement??1):1;}
  get #rest(){const d=this.#difficulty();return d.rest*(this.#lateDifficulty?(d.lateRest??1):1);}
  get #windups(){const d=this.#difficulty();return d.windups*(this.#lateDifficulty?(d.lateWindups??1):1);}
  #openingWindup=1;
  readonly #spitWindupMs:number;
  readonly #slick:EnemySystemOptions['slick'];
  readonly #slide=new Map<number,{x:number;y:number}>();
  #difficulty:()=>{rest:number;windups:number;lateRest?:number;lateWindups?:number;lateStagger?:number;lateMovement?:number}=()=>({rest:1,windups:2});
  #smallMeleeActive=0;
  #heavyMeleeActive=0;
  #solids:readonly {x:number;y:number;radius:number;health:number}[]=[];

  constructor(options: EnemySystemOptions = {}) {
    this.#spitWindupMs=options.spitWindupMs??500;this.#slick=options.slick;
    if(options.difficulty)this.#difficulty=options.difficulty;
    this.#openingWindup=options.openingWindup??1;
    this.#lateDifficulty=options.lateDifficulty??false;
    this.#canCommit=options.canCommit;
    this.#wardenOpeningAim=options.wardenOpeningAim;
    this.#canMove = options.canMove;
    this.#canSeePlayer=options.canSeePlayer;this.#launched=options.launched;this.#immovables=options.immovables;
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
  moveBy(id:number,dx:number,dy:number,cancelAttack=true):{blocked:boolean} {
    this.#cachedSnapshot=null;
    const enemy=this.#enemies.get(id);
    if(!enemy||!Number.isFinite(dx)||!Number.isFinite(dy))return {blocked:true};
    if(cancelAttack&&(dx!==0||dy!==0))this.#cancelMelee(enemy);
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
    if(enemy&&Number.isFinite(multiplier)){enemy.slowMultiplier=Math.max(0,Math.min(1,multiplier));enemy.speed=enemy.pod?0:enemy.baseSpeed*enemy.slowMultiplier;enemy.decisionCooldownRemainingMs=0;if(enemy.speed===0){enemy.velocityX=enemy.velocityY=0;this.#cancelMelee(enemy);if(enemy.broodRemainingMs>0){enemy.broodRemainingMs=0;enemy.specialCooldownMs=4000;}}}
  }

  spawn(type: StandardEnemyId, x: number, y: number, elite = false,options:EnemySpawnOptions={}): SpawnResult {
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
    const {shape} = MELEE_ATTACKS[type];
    const multiplier = elite === true ? this.#balance.eliteHealth : 1;
    const maxHealth = definition.maxHealth * multiplier * this.#balance.health * (options.healthScale??1);
    const maxArmor = type === 'brute' ? maxHealth * BRUTE_ARMOR_RATIO : 0;
    const clampedX = clamp(x, 0, WORLD_WIDTH);
    const clampedY = clamp(y, 0, WORLD_HEIGHT);
    const availableReservations =
      MAX_ACTIVE_ENEMIES - (this.activeCount + this.reservedCount + 1);
    const reservedChildren =
      type === 'carrier' ? Math.min(CARRIER_CHILD_CAP, availableReservations) : 0;
    const state: EnemyState = {
      openingVolley:options.openingVolley,role:options.role,priority:options.priority??false,controlResistant:options.controlResistant??false,beat:options.beat,lesson:options.lesson,pod:options.pod??false,podRemainingMs:options.pod?options.hatchMs??2400:0,podDurationMs:options.pod?options.hatchMs??2400:0,podWarned:false,stunRemainingMs:0,broodRemainingMs:0,broodDamage:0,slowMultiplier:1,chargeHit:false,repositionRemainingMs:0,repositionX:clampedX,repositionY:clampedY,
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
      radius: enemyBodyRadius(type, elite),
      speed: definition.speed*this.#balance.speed,baseSpeed:definition.speed*this.#balance.speed,
      windupMs:0,pendingAttack:null,lockX:0,lockY:0,specialCooldownMs:type==='brute'&&elite===true?(this.#balance.chargeInitialCooldownMs??1500):1500,chargeMs:0,
      meleePhase:'approach',meleeProgress:0,meleeAngle:0,meleeFacingLocked:false,meleeShape:shape,meleeOriginX:clampedX,meleeOriginY:clampedY,meleeRemainingMs:0,meleeDurationMs:0,
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

    if(options.lesson==='crawler'){state.speed*=.55;state.baseSpeed=state.speed;}
    if(options.pod){state.health=state.maxHealth=30;state.speed=0;state.alpha=1;}
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
   if(kind==='warden'&&this.#wardenOpeningAim){e.firstWardenCharge=true;e.specialCooldownMs=0;}
   else if(kind==='warden'&&e.type==='brute'&&e.elite&&this.#balance.chargeInitialCooldownMs!==undefined)e.specialCooldownMs=1500;
   if(kind==='matron'){this.#reservedCount-=e.reservedChildren;e.reservedChildren=0;}
   // I13 boss body tier: native contact and ordinary strike geometry match the authored rank.
   e.radius=BOSS_BODIES[kind].radius;e.meleeShape=guardianMeleeShape(kind,MELEE_ATTACKS[e.type].shape);e.controlResistant=true;e.priority=true;e.champion=kind;e.health=e.maxHealth=(kind==='warden'?760:1150)*(this.#balance.championHealth??1);e.armor=e.maxArmor=kind==='warden'?120:0;e.speed=e.baseSpeed=kind==='warden'?88:76;e.contactDamage=(kind==='warden'?28:24)*(this.#balance.championDamage??1);e.creditReward=kind==='warden'?100:150;
  }

  update(deltaMs: number, player: EnemyPlayerState): readonly EnemyEvent[] {
    this.#cachedSnapshot=null;
    if (!this.#validDelta(deltaMs) || !this.#validPlayer(player)) {
      return Object.freeze([]);
    }

    const timerDelta = Math.min(deltaMs, MAX_TIMER_DELTA_MS);
    const movementDelta = Math.min(deltaMs, MAX_MOVEMENT_DELTA_MS);
    const events: EnemyEvent[] = [];
    this.#meleeStartGapMs=Math.max(0,this.#meleeStartGapMs-timerDelta);

    this.#solids=this.#immovables?.()??[];
    this.#engagement.update(this.#enemies.values(),player,(e,x,y)=>this.#movementAllowed(e,x,y,x,y),(x,y)=>{const first=this.#enemies.values().next().value;return !first||this.#movementAllowed(first,x,y,player.x,player.y,player.radius??16);},Math.max(3,this.#windups));

    for (const enemy of this.#enemies.values()) {
      if(enemy.pod){
        if(!enemy.podWarned){enemy.podWarned=true;events.push(freezeEvent({type:'attack-warning',enemyId:enemy.id,enemyType:'crawler',x:enemy.x,y:enemy.y,targetX:enemy.x,targetY:enemy.y,durationMs:enemy.podRemainingMs}));}
        enemy.podRemainingMs=Math.max(0,enemy.podRemainingMs-timerDelta);
        if(enemy.podRemainingMs===0){enemy.pod=false;enemy.speed=enemy.baseSpeed*enemy.slowMultiplier;enemy.health=enemy.maxHealth=ENEMIES.crawler.maxHealth*this.#balance.health;enemy.contactCooldownRemainingMs=450;}
        continue;
      }
      enemy.repositionRemainingMs=Math.max(0,enemy.repositionRemainingMs-timerDelta);
      enemy.stunRemainingMs=Math.max(0,enemy.stunRemainingMs-timerDelta);
      if(enemy.stunRemainingMs>0){enemy.velocityX=enemy.velocityY=0;continue;}
      if(enemy.champion==='matron'&&enemy.speed>0&&!this.#launched?.(enemy.id)){
        enemy.specialCooldownMs=Math.max(0,enemy.specialCooldownMs-timerDelta/this.#rest);
        if(enemy.broodRemainingMs>0){enemy.broodRemainingMs=Math.max(0,enemy.broodRemainingMs-timerDelta);if(enemy.broodRemainingMs===0){const hatchDistance=(BOSS_BODIES.matron.hatchRingMin+BOSS_BODIES.matron.hatchRingMax)/2;for(const side of [-1,1])events.push(freezeEvent({type:'spawn-request',sourceEnemyId:enemy.id,enemyType:'crawler',x:enemy.x+Math.cos(enemy.id*2.399+ (side<0?0:Math.PI))*hatchDistance,y:enemy.y+Math.sin(enemy.id*2.399+(side<0?0:Math.PI))*hatchDistance,elite:false,requestIndex:side<0?0:1,pod:true,hatchMs:2400,beat:enemy.beat}));enemy.specialCooldownMs=6000;}}
        else if(enemy.specialCooldownMs===0&&this.activeCount+this.reservedCount<MAX_ACTIVE_ENEMIES-2){enemy.broodRemainingMs=1000;enemy.broodDamage=0;enemy.velocityX=enemy.velocityY=0;events.push(freezeEvent({type:'attack-warning',enemyId:enemy.id,enemyType:'carrier',x:enemy.x,y:enemy.y,targetX:enemy.x,targetY:enemy.y,durationMs:1000}));}
      }
      if(enemy.speed===0||this.#launched?.(enemy.id))this.#cancelMelee(enemy);
      if(enemy.meleePhase!=='approach'&&!enemy.attackSlot)this.#cancelMelee(enemy);

      // Control overlaps owed melee rest on the hostile clock; it does not add
      // another grace period after thaw. Legacy clocks remain suspended below.
      if(enemy.meleePhase==='approach')enemy.contactCooldownRemainingMs=Math.max(0,enemy.contactCooldownRemainingMs-timerDelta);
      if(enemy.speed===0||enemy.stunRemainingMs>0||enemy.pod||enemy.broodRemainingMs>0)continue;
      enemy.rangedCooldownRemainingMs = Math.max(
        0,
        enemy.rangedCooldownRemainingMs - timerDelta/this.#rest,
      );
      enemy.decisionCooldownRemainingMs = Math.max(
        0,
        enemy.decisionCooldownRemainingMs - timerDelta,
      );
      if(enemy.champion!=='matron')enemy.specialCooldownMs=Math.max(0,enemy.specialCooldownMs-timerDelta/this.#rest);enemy.chargeMs=Math.max(0,enemy.chargeMs-timerDelta);
      if(enemy.windupMs>0){enemy.windupMs=Math.max(0,enemy.windupMs-timerDelta);if(enemy.windupMs===0){
       if(enemy.pendingAttack==='spit'){events.push(freezeEvent({type:'hazard-attack',enemyId:enemy.id,enemyType:'spitter',damage:enemy.contactDamage,sourceX:enemy.x,sourceY:enemy.y,targetX:enemy.lockX,targetY:enemy.lockY}));this.#beginReposition(enemy,player);}
       if(enemy.pendingAttack==='charge')enemy.chargeMs=ENEMY_ATTACK_SHAPES.chargeDurationMs;enemy.pendingAttack=null;enemy.decisionCooldownRemainingMs=0;
      }}
      this.#advanceCamouflage(enemy, timerDelta);
      this.#advanceMelee(enemy,player,timerDelta,events);
    }

    this.#smallMeleeActive=this.#heavyMeleeActive=0;
    for(const enemy of this.#enemies.values())if(enemy.meleePhase==='windup'||enemy.meleePhase==='strike'){
      if(MELEE_ATTACKS[enemy.type].heavy)this.#heavyMeleeActive++;else this.#smallMeleeActive++;
    }
    for (const enemy of this.#enemies.values()) {
      if(enemy.speed===0||enemy.stunRemainingMs>0||enemy.pod||enemy.broodRemainingMs>0)continue;
      if (enemy.decisionCooldownRemainingMs === 0) {
        this.#decide(enemy, player);
      }
    }

    this.#rebuildSpatialHash();
    for (const enemy of this.#enemies.values()) {
      if(enemy.speed===0||enemy.stunRemainingMs>0||enemy.pod||enemy.broodRemainingMs>0)continue;
      enemy.stepStartX=enemy.x;enemy.stepStartY=enemy.y;
      enemy.yieldMs=Math.max(0,(enemy.yieldMs??0)-movementDelta);
      if(!this.#launched?.(enemy.id)){this.#holdReadyContact(enemy,player);this.#integrate(enemy,movementDelta,player,events);}
    }
    if(movementDelta>0){
      // I13: discover oversized boss neighbors once; ordinary-only queries retain their28-unit bound.
      let largestRadius=28;for(const enemy of this.#enemies.values())if(enemy.radius>largestRadius)largestRadius=enemy.radius;
      this.#resolveCrowd(largestRadius);this.#clearCongestion(movementDelta,largestRadius);
    }
    const candidates=[...this.#enemies.values()].sort((a,b)=>
      Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y)||a.id-b.id);
    for(const enemy of candidates){
      if(enemy.speed>0&&!enemy.pod&&enemy.stunRemainingMs===0&&enemy.broodRemainingMs===0)this.#collectAttacks(enemy, player, events);
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
    if(enemy.broodRemainingMs>0){enemy.broodDamage+=healthDamage+absorbedByArmor;if(enemy.broodDamage>=20){enemy.broodRemainingMs=0;enemy.specialCooldownMs=4000;}}
    const died = enemy.health === 0;
    // The corpse carries the lethal impulse; do not teleport it before physics starts.
    const appliedKnockback = died ? Object.freeze({x:0,y:0}) : this.#applyKnockback(enemy, knockback);
    const events: EnemyEvent[] = [];

    if (died) {
      events.push(
        freezeEvent({
          type: 'death',priority:enemy.priority,beat:enemy.beat,
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
              beat: enemy.beat,
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

  beginRush(id:number):void {
    const enemy=this.#enemies.get(id);
    if(enemy){enemy.rushing=true;enemy.decisionCooldownRemainingMs=0;}
  }

  stagger(id:number,durationMs:number):void {
    const enemy=this.#enemies.get(id);
    if(!enemy)return;
    this.#cachedSnapshot=null;
    this.#cancelMelee(enemy);
    enemy.stunRemainingMs=Math.max(enemy.stunRemainingMs,durationMs);
    if(enemy.champion!=='warden')enemy.wallStunAngle=undefined;
    enemy.windupMs=enemy.chargeMs=enemy.broodRemainingMs=0;
    enemy.pendingAttack=null;
  }

  releaseChildReservation(id: number): void {
    const enemy = this.#enemies.get(id);
    if (!enemy?.reservedChildren) return;
    this.#reservedCount -= enemy.reservedChildren;
    enemy.reservedChildren = 0;
    this.#cachedSnapshot = null;
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
    this.#nextId = 1;this.#engagement.reset();this.#meleeStartGapMs=this.#smallMeleeActive=this.#heavyMeleeActive=0;
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
      role:enemy.role,priority:enemy.priority,controlResistant:enemy.controlResistant,beat:enemy.beat,pod:enemy.pod,podRemainingMs:enemy.podRemainingMs,...(enemy.pod?{podStage:enemy.podRemainingMs<=500?'opening' as const:enemy.podRemainingMs<=enemy.podDurationMs*.65?'swelling' as const:'sealed' as const,podProgress:enemy.podRemainingMs/enemy.podDurationMs}:{}),stunRemainingMs:enemy.stunRemainingMs,broodRemainingMs:enemy.broodRemainingMs,lesson:enemy.lesson,
      wallStunAngle:enemy.stunRemainingMs>0?enemy.wallStunAngle:undefined,
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
      speed: enemy.speed*this.#movement,
      meleePhase:enemy.meleePhase,meleeProgress:enemy.meleeProgress,meleeAngle:enemy.meleeAngle,meleeFacingLocked:enemy.meleeFacingLocked,meleeShape:enemy.meleeShape,meleeOriginX:enemy.meleeOriginX,meleeOriginY:enemy.meleeOriginY,meleeRemainingMs:enemy.meleeRemainingMs,meleeDurationMs:enemy.meleeDurationMs,
      // Existing non-charge warning presentation consumes this facade; no simulated spit is scheduled for brood/pods.
      baseSpeed:enemy.baseSpeed,champion:enemy.champion,windupMs:enemy.pod?enemy.podRemainingMs:enemy.broodRemainingMs>0?enemy.broodRemainingMs:enemy.windupMs,pendingAttack:enemy.pod||enemy.broodRemainingMs>0?'spit':enemy.pendingAttack,lockX:enemy.pod||enemy.broodRemainingMs>0?enemy.x:enemy.lockX,lockY:enemy.pod||enemy.broodRemainingMs>0?enemy.y:enemy.lockY,specialCooldownMs:enemy.specialCooldownMs,chargeMs:enemy.chargeMs,...(enemy.pendingAttack==='charge'&&enemy.windupMs>0?{chargeWarningLength:ENEMY_ATTACK_SHAPES.chargeSpeed*ENEMY_ATTACK_SHAPES.chargeDurationMs/1000*this.#movement}:{}),
      contactDamage: enemy.contactDamage,
      meleeDamage: calculateMeleeDamage(enemy.type,enemy.elite||!!enemy.champion),
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
    if(enemy.lesson==='stalker'){enemy.camouflageState='revealed';enemy.alpha=1;return;}
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
    if(enemy.speed===0||enemy.stunRemainingMs>0||enemy.pod||enemy.broodRemainingMs>0||enemy.windupMs>0||enemy.meleePhase!=='approach'){enemy.velocityX=enemy.velocityY=0;return;}
    if(enemy.chargeMs>0){const d=normalized(enemy.lockX,enemy.lockY);enemy.velocityX=d.x*ENEMY_ATTACK_SHAPES.chargeSpeed*this.#movement;enemy.velocityY=d.y*ENEMY_ATTACK_SHAPES.chargeSpeed*this.#movement;return;}
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

    if(enemy.rushing){
      const aim=this.#canAttack?.(enemy,player)===false?this.#route?.(enemy,player)??player:player;
      const heading=normalized(aim.x-enemy.x,aim.y-enemy.y);
      enemy.velocityX=heading.x*enemy.speed*1.6;
      enemy.velocityY=heading.y*enemy.speed*1.6;
      return;
    }

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
      targetX = player.x + Math.max(-100,Math.min(100,(player.vx??0)*.5)) - toPlayer.y * STALKER_FLANK_DISTANCE * flankSide;
      targetY = player.y + Math.max(-100,Math.min(100,(player.vy??0)*.5)) + toPlayer.x * STALKER_FLANK_DISTANCE * flankSide;
      direction = normalized(targetX - enemy.x, targetY - enemy.y);
    }

    if(enemy.type==='spitter'&&enemy.repositionRemainingMs>0){targetX=enemy.repositionX;targetY=enemy.repositionY;direction=normalized(targetX-enemy.x,targetY-enemy.y);}
    if(enemy.type==='crawler'&&enemy.role==='screen'&&distanceToPlayer>190){
      let covered:EnemyState|undefined;
      for(const other of this.#enemies.values())if(other.id!==enemy.id&&other.beat===enemy.beat&&(other.priority||other.role==='ranged')){if(other.priority){covered=other;break;}if(!covered||enemy.id%2===1)covered=other;}
      if(covered){const front=normalized(player.x-covered.x,player.y-covered.y),side=enemy.id%2?1:-1;targetX=covered.x+front.x*130-front.y*side*55;targetY=covered.y+front.y*130+front.x*side*55;direction=normalized(targetX-enemy.x,targetY-enemy.y);}
    }
    if(enemy.type==='carrier'){
      const away=normalized(enemy.x-player.x,enemy.y-player.y);
      if(distanceToPlayer<220){targetX=player.x+away.x*260;targetY=player.y+away.y*260;}
      else if(distanceToPlayer<420){targetX=enemy.x;targetY=enemy.y;}
      direction=normalized(targetX-enemy.x,targetY-enemy.y);
    }
    if(enemy.role==='anchor'&&!enemy.priority){
      let leader:EnemyState|undefined;for(const other of this.#enemies.values())if(other.priority&&other.beat===enemy.beat&&other.id!==enemy.id){leader=other;break;}
      if(leader&&distanceToPlayer>170){const toward=normalized(player.x-leader.x,player.y-leader.y);targetX=leader.x+toward.x*100;targetY=leader.y+toward.y*100;direction=normalized(targetX-enemy.x,targetY-enemy.y);}
    }
    const engagementGoal=enemy.type==='spitter'||enemy.type==='stalker'&&distanceToPlayer>145||enemy.type==='carrier'||enemy.role==='anchor'&&distanceToPlayer>170||enemy.role==='screen'&&distanceToPlayer>190?undefined:this.#engagement.goal(enemy,player);
    if(engagementGoal){targetX=engagementGoal.x;targetY=engagementGoal.y;direction=normalized(targetX-enemy.x,targetY-enemy.y);}

    const goalLegal=enemy.type!=='spitter'||this.#firingPositionLegal(enemy,{x:targetX,y:targetY});
    const keepFiringGoal=enemy.type==='spitter'&&enemy.firingGoal&&(distanceToPlayer<SPITTER_MIN_RANGE||distanceToPlayer>SPITTER_MAX_RANGE||this.#canAttack?.(enemy,player)===false);
    // Berths use the real body sweep. The navigation grid's extra two units
    // of clearance can otherwise strand a legal berth just beyond its last cell.
    let route=engagementGoal&&this.#movementAllowed(enemy,targetX,targetY)?null:goalLegal&&!keepFiringGoal?this.#route?.(enemy,{x:targetX,y:targetY}):enemy;
    if(enemy.type==='spitter'&&(keepFiringGoal||!goalLegal||(route?.x===enemy.x&&route.y===enemy.y&&(targetX!==enemy.x||targetY!==enemy.y)))){
      const alternative=this.#alternateFiringPosition(enemy,player);
      if(alternative){targetX=alternative.goal.x;targetY=alternative.goal.y;direction=normalized(targetX-enemy.x,targetY-enemy.y);route=alternative.route;}
      else route=enemy;
    }
    // A carrier cannot occupy every marine-sized recess. Seek a reachable
    // visible holding point instead of pinning the route to that narrow goal.
    if(enemy.type==='carrier'&&(this.#canSeePlayer?this.#canSeePlayer(enemy,player):this.#canAttack?.(enemy,player))===false){
      const alternative=this.#alternateFiringPosition(enemy,player);
      if(alternative){targetX=alternative.goal.x;targetY=alternative.goal.y;direction=normalized(targetX-enemy.x,targetY-enemy.y);route=alternative.route;}
    }
    // Navigation returns the current position when the flank has no route.
    // The flank is optional; retry the real player goal rather than stand still.
    if((enemy.type==='stalker'||engagementGoal) && route && Math.hypot(route.x-enemy.x,route.y-enemy.y)<1){
      targetX=player.x;targetY=player.y;
      direction=normalized(targetX-enemy.x,targetY-enemy.y);
      route=this.#route?.(enemy,player);
    }
    if(route){targetX=route.x;targetY=route.y;direction=normalized(targetX-enemy.x,targetY-enemy.y);}

    enemy.targetX = clamp(targetX, 0, WORLD_WIDTH);
    enemy.targetY = clamp(targetY, 0, WORLD_HEIGHT);
    const distance=Math.hypot(targetX-enemy.x,targetY-enemy.y);
    const speed=engagementGoal&&distance<(enemy.attackSlot?.01:1)?0:enemy.speed*this.#movement;
    enemy.velocityX = direction.x * speed;
    enemy.velocityY = direction.y * speed;
  }

  #beginReposition(enemy:EnemyState,player:EnemyPlayerState):void {
    const toward=normalized(player.x-enemy.x,player.y-enemy.y),side=enemy.id%2?1:-1;
    enemy.repositionRemainingMs=900;enemy.repositionX=clamp(enemy.x-toward.y*side*100,enemy.radius,WORLD_WIDTH-enemy.radius);enemy.repositionY=clamp(enemy.y+toward.x*side*100,enemy.radius,WORLD_HEIGHT-enemy.radius);enemy.decisionCooldownRemainingMs=0;
  }

  #firingPositionLegal(enemy:EnemyState,goal:EnemyPlayerState):boolean {
    if(goal.x<enemy.radius||goal.y<enemy.radius||goal.x>WORLD_WIDTH-enemy.radius||goal.y>WORLD_HEIGHT-enemy.radius)return false;
    return this.#movementAllowed(enemy,goal.x,goal.y,goal.x,goal.y);
  }

  #alternateFiringPosition(enemy:EnemyState,player:EnemyPlayerState){
    const carrier=enemy.type==='carrier',minimum=carrier?140:SPITTER_MIN_RANGE,maximum=carrier?260:SPITTER_MAX_RANGE;
    const usable=(goal:EnemyPlayerState)=>{
      const range=Math.hypot(goal.x-player.x,goal.y-player.y);
      if(range<minimum||range>maximum||!this.#firingPositionLegal(enemy,goal))return null;
      const visible=carrier?(this.#canSeePlayer?this.#canSeePlayer(goal,player):this.#canAttack?.({...goal,type:'carrier'},player)):this.#canAttack?.({...goal,type:'spitter'},player);
      if(visible===false)return null;
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
    for(const radius of (carrier?[170,220]:[280,340]))for(let i=0;i<16;i++){const angle=i*Math.PI/8;candidates.push({x:player.x+Math.cos(angle)*radius,y:player.y+Math.sin(angle)*radius});}
    candidates.sort((a,b)=>Math.hypot(a.x-enemy.x,a.y-enemy.y)-Math.hypot(b.x-enemy.x,b.y-enemy.y));
    for(const goal of candidates){const result=usable(goal);if(result){enemy.firingGoal={...goal,playerX:player.x,playerY:player.y};enemy.firingSearch=undefined;return result;}}
    enemy.firingSearch={decision:enemy.decisionVersion,playerX:player.x,playerY:player.y};
    return null;
  }

  /** Jacobi projections: all pair corrections read the same positions, then
   * apply together. Frozen bodies are anchors; launches retain swept contacts.
   * A small skin and dead band prevent contact/steering chatter. */
  #resolveCrowd(largestRadius:number): void {
    const solids=this.#solids;
    for(let iteration=0;iteration<SEPARATION_ITERATIONS;iteration++){
      this.#rebuildSpatialHash();
      let corrections=0;
      for(const entry of this.#spatialEnemies.values()){entry.correctionX=entry.correctionY=entry.contacts=0;}
      for(const a of this.#spatialEnemies.values()){
        const enemy=a.enemy;
        if(this.#launched?.(enemy.id))continue;
        this.#spatialHash.queryRadiusInto(enemy.x,enemy.y,enemy.radius+largestRadius+1,this.#nearby);
        for(const b of this.#nearby){
          const other=b.enemy;
          if(enemy.id>=other.id||this.#launched?.(other.id))continue;
          const dx=enemy.x-other.x,dy=enemy.y-other.y,d=Math.hypot(dx,dy);
          const overlap=enemy.radius+other.radius+SEPARATION_SKIN-d;
          if(overlap<=SEPARATION_SLOP)continue;
          const movableA=enemy.speed>0&&!this.#meleeAnchored(enemy),movableB=other.speed>0&&!this.#meleeAnchored(other);
          if(!movableA&&!movableB)continue;
          // ID-derived axis resolves exact coincident spawns without randomness.
          const angle=((enemy.id*73+other.id*37)%360)*Math.PI/180;
          const nx=d>1e-9?dx/d:Math.cos(angle),ny=d>1e-9?dy/d:Math.sin(angle);
          const correction=(overlap-SEPARATION_SLOP)*(movableA && movableB ? .5 : 1);
          if(movableA){a.correctionX+=nx*correction;a.correctionY+=ny*correction;a.contacts++;}
          if(movableB){b.correctionX-=nx*correction;b.correctionY-=ny*correction;b.contacts++;}
        }
        if(enemy.speed===0||this.#meleeAnchored(enemy))continue;
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
        if(this.#project(enemy,dx,dy)||this.#project(enemy,dx,0)||this.#project(enemy,0,dy))corrections++;
      }
      if(corrections===0)break;
    }
  }

  /** Only a stalled follower yields at a shared choke point. Stable numeric
   * priority breaks symmetric two-body jams without constant crowd jitter. */
  #clearCongestion(deltaMs:number,largestRadius:number):void {
    for(const enemy of this.#enemies.values()){
      if(enemy.speed===0||enemy.meleePhase!=='approach'||this.#launched?.(enemy.id)||(enemy.yieldMs??0)>0)continue;
      const stopped=Math.hypot(enemy.x-enemy.stepStartX!,enemy.y-enemy.stepStartY!)<.5;
      const trying=Math.hypot(enemy.velocityX,enemy.velocityY)>3&&Math.hypot(enemy.targetX-enemy.x,enemy.targetY-enemy.y)>8;
      enemy.blockedMs=stopped&&trying?(enemy.blockedMs??0)+deltaMs:0;
      if(enemy.blockedMs<600)continue;
      this.#spatialHash.queryRadiusInto(enemy.x,enemy.y,enemy.radius+largestRadius+12,this.#nearby);
      for(const entry of this.#nearby){const other=entry.enemy;
        if(other.id>=enemy.id||other.speed===0||Math.hypot(other.velocityX,other.velocityY)<3||Math.hypot(enemy.targetX-other.targetX,enemy.targetY-other.targetY)>64)continue;
        const distance=Math.hypot(enemy.x-other.x,enemy.y-other.y);
        if(distance>enemy.radius+other.radius+12||distance<1e-8)continue;
        enemy.yieldMs=800;enemy.yieldX=(enemy.x-other.x)/distance;enemy.yieldY=(enemy.y-other.y)/distance;enemy.blockedMs=0;break;
      }
    }
  }

  #project(enemy:EnemyState,dx:number,dy:number):boolean {
    if(this.#meleeAnchored(enemy)||dx===0&&dy===0)return false;
    const x=enemy.x+dx,y=enemy.y+dy;
    if(x<enemy.radius||y<enemy.radius||x>WORLD_WIDTH-enemy.radius||y>WORLD_HEIGHT-enemy.radius||!this.#movementAllowed(enemy,x,y))return false;
    enemy.x=x;enemy.y=y;return true;
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

  #integrate(enemy: EnemyState, deltaMs: number,player:EnemyPlayerState,events:EnemyEvent[]): void {
    if(deltaMs===0||enemy.windupMs>0||enemy.meleePhase!=='approach')return;
    const distance=Math.hypot(enemy.targetX-enemy.x,enemy.targetY-enemy.y);
    const velocity=Math.hypot(enemy.velocityX,enemy.velocityY);
    const scale = Math.min(deltaMs / 1_000,enemy.chargeMs>0?Infinity:distance/(velocity||1));
    const yielding=(enemy.yieldMs??0)>0&&enemy.chargeMs===0;
    let movementX = yielding?enemy.yieldX!*enemy.speed*this.#movement*deltaMs/1000:enemy.velocityX * scale;
    let movementY = yielding?enemy.yieldY!*enemy.speed*this.#movement*deltaMs/1000:enemy.velocityY * scale;
    if(this.#slick?.(enemy)&&!enemy.chargeMs){
      const old=this.#slide.get(enemy.id);
      const keep=Math.exp(-deltaMs/155);
      movementX=old?old.x*keep*deltaMs+movementX*(1-keep):movementX;
      movementY=old?old.y*keep*deltaMs+movementY*(1-keep):movementY;
      this.#slide.set(enemy.id,{x:movementX/deltaMs,y:movementY/deltaMs});
    }else this.#slide.delete(enemy.id);
    if (movementX === 0 && movementY === 0) return;

    if(enemy.champion==='warden'&&enemy.chargeMs>0&&!this.#movementAllowed(enemy,enemy.x+movementX,enemy.y+movementY)){enemy.wallStunAngle=Math.atan2(movementY,movementX);enemy.chargeMs=0;enemy.stunRemainingMs=WARDEN_WALL_STUN_MS;enemy.specialCooldownMs=5000;enemy.velocityX=enemy.velocityY=0;this.#cancelMelee(enemy);return;}
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
      if(enemy.chargeMs>0&&!enemy.chargeHit){
        const dx=toX-enemy.x,dy=toY-enemy.y,den=dx*dx+dy*dy,t=den?clamp(((player.x-enemy.x)*dx+(player.y-enemy.y)*dy)/den,0,1):0;
        if(Math.hypot(enemy.x+dx*t-player.x,enemy.y+dy*t-player.y)<=enemy.radius+(player.radius??DEFAULT_PLAYER_RADIUS)){enemy.chargeHit=true;events.push(freezeEvent({type:'contact-attack',enemyId:enemy.id,enemyType:enemy.type,damage:enemy.contactDamage,attack:'charge'}));}
      }
      enemy.x = toX;
      enemy.y = toY;
      return;
    }
  }

  #movementAllowed(enemy: EnemyState, toX: number, toY: number, fromX=enemy.x, fromY=enemy.y, probeRadius=enemy.radius): boolean {
    if(!this.#launched?.(enemy.id))for(const solid of this.#solids){
      if(solid.health<=0)continue;
      const radius=probeRadius+solid.radius,before=Math.hypot(fromX-solid.x,fromY-solid.y),after=Math.hypot(toX-solid.x,toY-solid.y);
      if(before<radius){if(after<=before+1e-9)return false;continue;}
      const dx=toX-fromX,dy=toY-fromY,den=dx*dx+dy*dy;
      const t=den?clamp(((solid.x-fromX)*dx+(solid.y-fromY)*dy)/den,0,1):0;
      if(Math.hypot(fromX+dx*t-solid.x,fromY+dy*t-solid.y)<radius-1e-7)return false;
    }
    if (!this.#canMove) return true;
    const context: CollisionSteeringContext = Object.freeze({
      enemyId: enemy.id,
      enemyType: enemy.type,
      radius: probeRadius,
      fromX,
      fromY,
      toX,
      toY,
    });
    try {
      return this.#canMove(context) === true;
    } catch {
      return false;
    }
  }

  /** Do not route an already-touching eligible attacker away before collection. */
  #holdReadyContact(enemy:EnemyState,player:EnemyPlayerState):void {
    if(enemy.meleePhase!=='approach'||enemy.windupMs>0||enemy.chargeMs>0||!enemy.attackSlot||enemy.contactCooldownRemainingMs>0||this.#meleeStartGapMs>0)return;
    const profile=MELEE_ATTACKS[enemy.type];
    if(this.#canCommit?.(enemy,player,this.#enemies.values(),'melee')===false)return;
    if((profile.heavy?this.#heavyMeleeActive>=1:this.#smallMeleeActive>=this.#windups)||Math.hypot(enemy.x-player.x,enemy.y-player.y)>enemy.radius+(player.radius??DEFAULT_PLAYER_RADIUS)+.5||this.#canAttack?.(enemy,player)===false)return;
    enemy.targetX=enemy.x;enemy.targetY=enemy.y;enemy.velocityX=enemy.velocityY=0;
    enemy.yieldMs=0;enemy.decisionCooldownRemainingMs=0;
  }

  #meleeAnchored(enemy:EnemyState):boolean {return enemy.meleePhase==='windup'||enemy.meleePhase==='strike';}

  #yieldMeleeBerth(enemy:EnemyState):void {
    enemy.attackSlot=undefined;
    enemy.engagement=enemy.type==='spitter'||enemy.type==='carrier'?'ranged':'waiting';
  }

  /** Control breaks an anticipated hit; thawing must earn a fresh warning. */
  #cancelMelee(enemy:EnemyState):void {
    if(enemy.meleePhase==='approach')return;
    // Control releases the berth immediately. A resolved hit still owes its
    // remaining strike/recovery and full rest, without replaying that strike.
    const profile=MELEE_ATTACKS[enemy.type];
    const recovery=profile.recoveryMs*(enemy.elite?ELITE_MELEE_RECOVERY_SCALE:1)*this.#rest;
    const stabilization=enemy.meleePhase==='windup'?120:enemy.meleeRemainingMs+
      (enemy.meleePhase==='strike'?recovery:0)+profile.cooldownMs;
    enemy.meleePhase='approach';enemy.meleeProgress=0;enemy.meleeRemainingMs=enemy.meleeDurationMs=0;enemy.meleeFacingLocked=false;
    enemy.contactCooldownRemainingMs=Math.max(enemy.contactCooldownRemainingMs,stabilization);
    enemy.decisionCooldownRemainingMs=0;
    this.#yieldMeleeBerth(enemy);
  }

  #aimMelee(enemy:EnemyState,player:{x:number;y:number},starting=false) {
    // Advance the footprint by the body clearance added to the authored strike.
    const advance=enemy.champion?0:enemy.radius-(enemy.type==='brute'?28:ENEMIES[enemy.type].radius);
    const x=starting?enemy.x:enemy.meleeOriginX-Math.cos(enemy.meleeAngle)*advance;
    const y=starting?enemy.y:enemy.meleeOriginY-Math.sin(enemy.meleeAngle)*advance;
    enemy.meleeAngle=Math.atan2(player.y-y,player.x-x);
    enemy.meleeOriginX=x+Math.cos(enemy.meleeAngle)*advance;
    enemy.meleeOriginY=y+Math.sin(enemy.meleeAngle)*advance;
  }

  #advanceMelee(enemy:EnemyState,player:EnemyPlayerState,deltaMs:number,events:EnemyEvent[]):void {
    if(enemy.meleePhase==='approach')return;
    const profile=MELEE_ATTACKS[enemy.type];
    if(enemy.meleePhase==='windup'&&!enemy.meleeFacingLocked){
      this.#aimMelee(enemy,player);
      if(enemy.meleeRemainingMs-deltaMs<=profile.lockLeadMs)enemy.meleeFacingLocked=true;
    }
    let remaining=deltaMs;
    while(enemy.meleePhase!=='approach'){
      const step=Math.min(remaining,enemy.meleeRemainingMs);
      enemy.meleeRemainingMs=Math.max(0,enemy.meleeRemainingMs-step);remaining-=step;
      enemy.meleeProgress=enemy.meleeDurationMs?Math.min(1,1-enemy.meleeRemainingMs/enemy.meleeDurationMs):1;
      if(enemy.meleeRemainingMs>0)break;
      if(enemy.meleePhase==='windup'){
        enemy.meleePhase='strike';enemy.meleeProgress=0;enemy.meleeFacingLocked=true;
        enemy.meleeDurationMs=enemy.meleeRemainingMs=profile.strikeMs;
        events.push(freezeEvent({type:'melee-strike',enemyId:enemy.id,enemyType:enemy.type,x:enemy.meleeOriginX,y:enemy.meleeOriginY,angle:enemy.meleeAngle,shape:enemy.meleeShape}));
        if(meleeStrikeContains(enemy.meleeShape,enemy.meleeOriginX,enemy.meleeOriginY,enemy.meleeAngle,player.x,player.y,player.radius??DEFAULT_PLAYER_RADIUS)&&this.#canAttack?.(enemy,player)!==false){
          events.push(freezeEvent({type:'contact-attack',enemyId:enemy.id,enemyType:enemy.type,damage:calculateMeleeDamage(enemy.type,enemy.elite||!!enemy.champion)}));
        }
      }else if(enemy.meleePhase==='strike'){
        enemy.meleePhase='recovery';enemy.meleeProgress=0;
        enemy.meleeDurationMs=enemy.meleeRemainingMs=profile.recoveryMs*(enemy.elite?ELITE_MELEE_RECOVERY_SCALE:1)*this.#rest;
      }else{
        enemy.meleePhase='approach';enemy.meleeProgress=0;enemy.meleeDurationMs=enemy.meleeRemainingMs=0;enemy.meleeFacingLocked=false;enemy.decisionCooldownRemainingMs=0;enemy.contactCooldownRemainingMs=profile.cooldownMs*this.#rest;
        this.#yieldMeleeBerth(enemy);
      }
      if(remaining<=0)break;
    }
  }

  #collectAttacks(
    enemy: EnemyState,
    player: EnemyPlayerState,
    events: EnemyEvent[],
  ): void {
    const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    const playerRadius = player.radius ?? DEFAULT_PLAYER_RADIUS;
    if(enemy.windupMs>0||enemy.meleePhase!=='approach'||this.#meleeStartGapMs>0)return;
    if(enemy.openingVolley){if(this.#canCommit?.(enemy,player,this.#enemies.values(),'ranged')===false)return;const target=enemy.openingVolley;enemy.openingVolley=undefined;this.#windUpSpit(enemy,target,events);return;}
    if(this.#balance.specials&&(enemy.champion==='warden'||enemy.role===undefined&&enemy.type==='brute'&&enemy.elite)&&enemy.specialCooldownMs===0&&distance>110&&distance<420&&this.#canAttack?.(enemy,player)!==false){
     if(this.#canCommit?.(enemy,player,this.#enemies.values(),'charge')===false)return;
     if(enemy.firstWardenCharge&&distance>240)return;
     const openingAim=enemy.firstWardenCharge?this.#wardenOpeningAim?.(enemy,player):undefined;
     if(enemy.firstWardenCharge&&!openingAim&&distance>200)return;
     const windup=enemy.champion==='warden'?850:this.#balance.chargeWindupMs??850,cooldown=enemy.champion==='warden'?4600:this.#balance.chargeCooldownMs??4600;
     const aim=openingAim??player;enemy.firstWardenCharge=undefined;
     this.#meleeStartGapMs=250;enemy.chargeHit=false;enemy.windupMs=windup;enemy.pendingAttack='charge';enemy.lockX=aim.x-enemy.x;enemy.lockY=aim.y-enemy.y;enemy.specialCooldownMs=cooldown;enemy.velocityX=enemy.velocityY=0;events.push(freezeEvent({type:'attack-warning',enemyId:enemy.id,enemyType:enemy.type,x:enemy.x,y:enemy.y,targetX:aim.x,targetY:aim.y,durationMs:windup}));return;
    }
    if(enemy.meleePhase!=='approach'||this.#launched?.(enemy.id))return;
    const melee=MELEE_ATTACKS[enemy.type];
    const pressureAvailable=melee.heavy?this.#heavyMeleeActive<1:this.#smallMeleeActive<this.#windups;
    if(distance<=melee.engageRange*(enemy.champion?BOSS_BODIES[enemy.champion].rankScale:1)+(enemy.champion?0:enemy.radius-ENEMIES[enemy.type].radius)+playerRadius&&enemy.attackSlot&&enemy.chargeMs===0&&enemy.contactCooldownRemainingMs===0&&this.#meleeStartGapMs===0&&pressureAvailable&&this.#canCommit?.(enemy,player,this.#enemies.values(),'melee')!==false&&this.#canAttack?.(enemy,player)!==false){
      enemy.meleePhase='windup';enemy.meleeProgress=0;enemy.meleeFacingLocked=false;
      this.#aimMelee(enemy,player,true);
      enemy.meleeDurationMs=enemy.meleeRemainingMs=melee.windupMs*(enemy.elite?ELITE_MELEE_WINDUP_SCALE:1)*(enemy.lesson?1.65:enemy.id<=4?this.#openingWindup:1);
      if(enemy.meleeDurationMs<=melee.lockLeadMs)enemy.meleeFacingLocked=true;
      enemy.contactCooldownRemainingMs=0;enemy.velocityX=enemy.velocityY=0;enemy.yieldMs=0;enemy.blockedMs=0;
      this.#meleeStartGapMs=250;
      if(melee.heavy)this.#heavyMeleeActive++;else this.#smallMeleeActive++;
      events.push(freezeEvent({type:'melee-warning',enemyId:enemy.id,enemyType:enemy.type,x:enemy.meleeOriginX,y:enemy.meleeOriginY,angle:enemy.meleeAngle,shape:enemy.meleeShape,durationMs:enemy.meleeDurationMs}));
      return;
    }

    if (
      enemy.type === 'spitter' &&
      distance >= SPITTER_ATTACK_MIN_RANGE &&
      distance <= SPITTER_ATTACK_MAX_RANGE &&
      enemy.rangedCooldownRemainingMs === 0 && this.#canAttack?.(enemy,player)!==false
    ) {
      if(this.#canCommit&& !this.#canCommit(enemy,player,this.#enemies.values(),'ranged'))return;
      if(this.#balance.specials||this.#canCommit){this.#windUpSpit(enemy,player,events);return;}
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
      this.#beginReposition(enemy,player);enemy.rangedCooldownRemainingMs = ENEMIES.spitter.attackCooldownMs;
    }
  }

  #windUpSpit(enemy:EnemyState,target:{x:number;y:number},events:EnemyEvent[]):void {
    this.#meleeStartGapMs=250;
    enemy.windupMs=this.#spitWindupMs;
    enemy.pendingAttack='spit';
    enemy.lockX=target.x;enemy.lockY=target.y;
    enemy.rangedCooldownRemainingMs=ENEMIES.spitter.attackCooldownMs+this.#spitWindupMs;
    enemy.velocityX=enemy.velocityY=0;
    events.push(freezeEvent({type:'attack-warning',enemyId:enemy.id,enemyType:enemy.type,
      x:enemy.x,y:enemy.y,targetX:target.x,targetY:target.y,durationMs:this.#spitWindupMs}));
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
    this.#cancelMelee(enemy);
    if(enemy.broodRemainingMs>0){enemy.broodRemainingMs=0;enemy.specialCooldownMs=4000;}
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
