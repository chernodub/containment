import { OverdrivePayoff } from '../OverdrivePayoff';
import type * as T from 'three';
import { ABILITY_CATALOG } from '../../../game/abilities/catalog';
import type { AbilityElement, AbilityEvent } from '../../../game/abilities/contract';
import type { DepthGame } from '../../../DepthGame';
import type { EnemySnapshot } from '../../../game/enemies/EnemySystem';
import type { ElementKit } from '../ElementKit';
import { ELEMENT_COLORS, UNIT, isContactJoint, type AbilityFrame, type AbilityPresentation } from '../types';

const FRIENDLY = 0x9fe8ff;
const WHITE = 0xe8fbff;
const GHOST_LIMIT = 3;
const RECEIPT_LIMIT = 64;
const EMPTY_ENEMIES: readonly EnemySnapshot[] = [];
const RIG_ELEMENTS = { breacher: 'kinetic', cryo: 'cryo', pyro: 'pyro', arc: 'arc' } as const;
const CAST_SLOTS = ['tactical', 'power', 'overdrive'] as const;
type Ghost = { live: boolean; x: number; z: number; angle: number; age: number; life: number; color: number; lean: number };
type Receipt = { rail: boolean; railAngle: number; railX: number; railZ: number; landed: boolean; ignition: number; live: boolean; id: number; element: AbilityElement; age: number; life: number; emitted: boolean };
type StruckTarget = Pick<EnemySnapshot, 'id' | 'x' | 'y' | 'radius' | 'velocityX' | 'velocityY' | 'baseSpeed'>;
type MarineRest = { body: T.Object3D; y: number; rx: number; rz: number; sy: number };
type Status = { frozen: boolean; burning: boolean; shocked?: boolean; chilled: boolean; chillStacks?: number };

/** Common body language and restrained, element-specific target feedback, using shared fixed pools. */
class SystemPresentation implements AbilityPresentation {
  private ghosts: Ghost[] = Array.from({ length: GHOST_LIMIT }, () => ({ live: false, x: 0, z: 0, angle: 0, age: 0, life: .18, color: FRIENDLY, lean: 0 }));
  private receipts: Receipt[] = Array.from({ length: RECEIPT_LIMIT }, () => ({ rail: false, railAngle: 0, railX: 0, railZ: 0, landed: false, ignition: -Infinity, live: false, id: 0, element: 'kinetic', age: 0, life: 0, emitted: false }));
  private readonly queen = { id: -1, x: 0, y: 0, radius: 92, velocityX: 0, velocityY: 0, baseSpeed: 0 };
  private readonly contactJoints = new WeakMap<T.Object3D, T.Object3D[]>();
  private ghostCursor = 0;
  private readonly selected = new Set<AbilityEvent['ability']>();
  private readonly previouslyFrozen = new Set<number>();
  private readonly previouslyBurning = new Set<number>();
  private receiptCursor = 0;
  private ghostClock = 0;
  private dashTime = 0;
  private readyAge = 1;
  private readyX = 0;
  private readyZ = 0;
  private readyColor = FRIENDLY;
  private castAge = 1;
  private castColor = FRIENDLY;
  private rest?: MarineRest;
  private game?: DepthGame;
  private statusFor?: (id: number) => Status;
  private disposed = false;

  private readonly payoff: OverdrivePayoff;
  constructor(private readonly kit: ElementKit) { this.payoff = new OverdrivePayoff(kit); }

  event(event: AbilityEvent, x: number, y: number): void {
    if (this.disposed || !Number.isFinite(x) || !Number.isFinite(y)) return;
    const k = this.kit, color = ELEMENT_COLORS[event.element];
    if (event.phase === 'denied' || event.phase === 'ready') return;
    if (event.phase === 'cast') this.selected.delete(event.ability);
    this.payoff.event(event, x, y);
    if (event.phase === 'cast' || event.phase === 'dash-start') { this.castAge = 0; this.castColor = color; }
    if (event.phase === 'dash-start') {
      this.dashTime = event.ability === 'static-step' ? 0 : .22;
      if (event.ability === 'static-step') for (const ghost of this.ghosts) ghost.live = false;
      this.ghostClock = .035;
      if (!k.reducedMotion && event.ability !== 'static-step') this.ghost(x / UNIT, y / UNIT, event.angle ?? 0, color, .2);
      k.camera(.07, event.angle ?? 0);
    } else if (event.phase === 'dash-end') {
      this.dashTime = event.ability === 'static-step' ? 0 : Math.max(this.dashTime, .07);
      const px = (event.targetX ?? x) / UNIT, pz = (event.targetY ?? y) / UNIT;
      if (!k.reducedMotion && event.ability !== 'static-step') this.ghost(px, pz, event.angle ?? 0, color, .14);
    } else if (event.phase === 'overdrive-ready') {
      this.readyAge = 0; this.readyX = x / UNIT; this.readyZ = y / UNIT; this.readyColor = color;
      k.flash(this.readyX, this.readyZ, color, 2.5, 2.6, 2, .18);
      k.burst(this.readyX, 1.2, this.readyZ, event.element, 8, .65, .45);
    }
    if (event.phase !== 'impact' && event.phase !== 'tick' && event.phase !== 'link' && event.phase !== 'burst' && event.phase !== 'dash-end') return;
    if (!event.targetIds) return;
    let slamVictim: number | undefined;
    if (event.ability === 'seismic-slam' && event.phase === 'impact') {
      let bestMargin = -Infinity;
      for (const id of event.targetIds.slice(0, RECEIPT_LIMIT)) {
        const body = k.statusActor(id);
        const enemy = this.game?.enemies.getSnapshot(id);
        if (!body || !enemy || enemy.health <= 0) continue;
        const margin = k.landingMargin((enemy.x + enemy.velocityX * .2) / UNIT,
          body.height + .18, (enemy.y + enemy.velocityY * .2) / UNIT);
        if (margin > bestMargin) { bestMargin = margin; slamVictim = id; }
      }
    }
    let count = 0;
    for (const id of event.targetIds) {
      if (count++ >= RECEIPT_LIMIT || !Number.isFinite(id)) break;
      const actor = k.statusActor(id);
      const secondaryHeat = event.ability === 'meltdown' && event.phase === 'tick' && id !== k.heatVictim;
      if (!secondaryHeat) actor?.elementContact?.(event.element);
      let receipt: Receipt | undefined;
      for (const candidate of this.receipts) if (candidate.live && candidate.id === id) { receipt = candidate; break; }
      if (!receipt) {
        receipt = this.receipts[this.receiptCursor++ % RECEIPT_LIMIT];
        receipt.ignition = -Infinity;
      }

      const firstBurn = event.ability === 'napalm-charge' && !this.previouslyBurning.has(id) && this.statusFor?.(id).burning;
      const firstFreeze = event.ability === 'whiteout' && this.game?.enemies.getSnapshot(id)?.type === 'crawler' && !this.previouslyFrozen.has(id) && this.statusFor?.(id).frozen;
      const impact = event.phase === 'impact' && (event.ability === 'seismic-slam' && id === slamVictim || event.ability === 'cryo-nova')
        && (this.game?.enemies.getSnapshot(id)?.health ?? 0) > 0;
      if (actor && !this.selected.has(event.ability) && (firstBurn || firstFreeze || impact)) {
        this.selected.add(event.ability);
        const bearing = Math.atan2(actor.root.position.z - y / UNIT, actor.root.position.x - x / UNIT);
        actor.powerAccent?.(event.element, bearing);
        if (impact) {
          const foot = actor.root.position;
          for (let i = -1; i <= 1; i++) {
            const a = bearing + i * .42;
            k.mote('shard', foot.x, .08, foot.z, Math.cos(a)*2, 1.2, Math.sin(a)*2,
              .18, .36, color);
          }
        }
        actor.reactToElement?.(event.element === 'pyro' ? 'fire' : event.element === 'cryo' ? 'ice' : 'kinetic', bearing);
        if (firstBurn) receipt.ignition = k.time;
        if (firstFreeze) { this.kit.frostVictim = id; k.frostUntil = k.time + .59; }
      }
      receipt.rail = event.ability === 'railbreaker';
      if (receipt.rail) {
        const position = actor?.root.position;
        receipt.railAngle = event.angle ?? 0;
        const c = Math.cos(receipt.railAngle), s = Math.sin(receipt.railAngle);
        const along = position ? (position.x - x / UNIT) * c + (position.z - y / UNIT) * s : 0;
        receipt.railX = x / UNIT + c * along;
        receipt.railZ = y / UNIT + s * along;
        receipt.landed = false;
      }
      receipt.live = true; receipt.id = id; receipt.element = event.element; receipt.age = 0;
      receipt.life = receipt.rail ? .85 : event.element === 'pyro' ? .65 : event.element === 'kinetic' ? .48 : .54; receipt.emitted = secondaryHeat;
    }
  }

  update(frame: AbilityFrame): void {
    if (this.disposed) return;
    this.restorePose();
    const k = this.kit, dt = frame.dt;
    k.impact();
    this.payoff.update(frame);
    if (!frame.visible) return;
    const g = frame.game;
    if (g && this.game !== g) { this.game = g; this.statusFor = g.boonStatuses; }
    const dead = g?.combat.snapshot.dead ?? false;
    if (dead) { this.clear(); return; }
    this.dashTime = Math.max(0, this.dashTime - dt);
    this.readyAge += dt;
    this.castAge += dt;
    for (const receipt of this.receipts) {
      if (!receipt.live) continue;
      receipt.age += dt;
      if (receipt.rail && !receipt.landed) this.railLanding(receipt);
      if (receipt.age >= receipt.life) receipt.live = false;
    }
    const snapshot = frame.snapshot;
    const p = g?.player;
    if (p) {
      const x = p.x / UNIT, z = p.y / UNIT;
      const color = snapshot?.rig ? ELEMENT_COLORS[RIG_ELEMENTS[snapshot.rig]] : FRIENDLY;
      const electricalDash = snapshot?.rig === 'arc' && snapshot.dashing;
      const trailing = !electricalDash && (snapshot?.dashing || this.dashTime > .07);
      this.ghostClock -= dt;
      if (trailing && dt > 0 && this.ghostClock <= 0 && !k.reducedMotion) {
        this.ghost(x, z, p.angle, color, snapshot?.dashing ? .22 : .06);
        this.ghostClock = snapshot?.dashing ? .045 : .085;
      } else if (!trailing) this.ghostClock = 0;
      if (snapshot?.invulnerable) this.invulnerability(x, z, p.angle);
      this.pose(frame, !!snapshot?.dashing);
      if (this.readyAge < .5) this.readyVents(x, z, p.angle);
      if (this.castAge < .3) this.suitPulse(x, z, p.angle);
    } else if (this.readyAge < .5) this.readyVents(this.readyX, this.readyZ, 0);
    for (const ghost of this.ghosts) {
      if (!ghost.live) continue;
      ghost.age += dt;
      if (ghost.age >= ghost.life) { ghost.live = false; continue; }
      this.drawGhost(ghost, (1 - ghost.age / ghost.life) * (k.low ? .25 : .42));
    }
    this.previouslyFrozen.clear();
    this.previouslyBurning.clear();
    const whiteout = snapshot?.zones.find(zone => zone.ability === 'whiteout');
    const releaseFrost = !!whiteout && (whiteout.durationMs - whiteout.remainingMs) % 2000 >= 250;
    let drawn = 0;
    const queen = g?.boss?.snapshot;
    if (queen?.active && !queen.defeated && queen.health > 0 && (!p || Math.hypot(queen.x - p.x, queen.y - p.y) <= 720)) {
      // Queen shares the normal target budget and fixed receipt pool. Consider
      // her first so a full minion crowd cannot hide a valid boss strike.
      this.queen.x = queen.x; this.queen.y = queen.y;
      if (this.struck(this.queen, 4.5, dt, releaseFrost)) drawn++;
    }
    for (const enemy of g?.enemies.snapshot.enemies ?? EMPTY_ENEMIES) {
      if (drawn >= (k.low ? 24 : 40)) break;
      if (enemy.health <= 0) continue;
      if (p && Math.hypot(enemy.x - p.x, enemy.y - p.y) > 720) continue;
      const height = enemy.type === 'crawler' ? .55 : enemy.type === 'brute' || enemy.type === 'carrier' ? 1.5 : .95;
      if (this.struck(enemy, height, dt, releaseFrost)) drawn++;
    }
  }

  private struck(enemy: StruckTarget, height: number, dt: number, releaseFrost: boolean): boolean {
    const k = this.kit, status = this.statusFor?.(enemy.id);
    if (status?.frozen) this.previouslyFrozen.add(enemy.id);
    if (status?.burning) this.previouslyBurning.add(enemy.id);
    let receipt: Receipt | undefined;
    for (const item of this.receipts) if (item.live && item.id === enemy.id) { receipt = item; break; }
    if (!receipt && !status?.frozen && !status?.burning && !status?.shocked && !status?.chilled) return false;
    const actor = k.statusActor(enemy.id);
    if (actor) {
      height = actor.height;
      if (status?.burning || status?.chilled || status?.frozen || status?.shocked) k.statusOwners.add(actor.root);
    }
    const x = enemy.x / UNIT, z = enemy.y / UNIT, radius = Math.max(.3, enemy.radius / UNIT);
    const secondaryFreeze = releaseFrost && !(enemy.id === k.frostVictim && k.time < k.frostUntil);
    if (status?.frozen && actor && !secondaryFreeze) {
      const joints = this.joints(actor.root);
      k.sustain();
      k.sprite('crack', x, .049, z, radius * 1.5, radius * 1.4, ELEMENT_COLORS.cryo, .62, enemy.id, 'ground');
      k.impact();
      for (let i = 0; i < Math.min(joints.length, k.low ? 2 : 4); i++) {
        const m = joints[i].matrixWorld.elements;
        k.draw('shard', m[12], m[13], m[14], .09, height * .17, .065, ELEMENT_COLORS.cryo, .78, i, .46);
      }
      for (let i = 0; i < (k.low ? 2 : 4); i++) {
        const t = k.reducedMotion ? .55 : (k.time * 1.6 + i * .31 + enemy.id * .13) % 1;
        const a = enemy.id + i * 2.4;
        const selected = enemy.id === this.kit.frostVictim && k.time < k.frostUntil;
        const width = selected ? radius * .22 : .037;
        k.draw('shard', x + Math.cos(a) * radius * (.7 + t * .2), height * (selected ? .58 + t * 1.14 : .42 * (1 - t * t)),
          z + Math.sin(a) * radius * .8, width, selected ? height * .28 : .063, width, WHITE, Math.sin(t * Math.PI) * .78, a);
      }
      k.impact();
    }
    if (status?.frozen && !secondaryFreeze) this.frozenShell(x, z, radius, height, enemy.id, receipt?.element === 'cryo' ? 1 - receipt.age / receipt.life : 0);
    else if (!status?.frozen && status?.chilled) this.chilling(x, z, radius, height, enemy.id, Math.min(1, (status.chillStacks ?? 1) / 3));
    if (status?.burning || receipt?.element === 'pyro') this.burning(actor?.root, radius, height, enemy.id);
    if (status?.shocked) this.stunned(x, z, radius, height, enemy.id);
    if (receipt) {
      if (k.heatVictim === enemy.id && k.time < k.heatUntil) {
        const fade = Math.min(1, (k.heatUntil - k.time) / .18);
        k.impact();
        k.jointEmber(x, height * .51, z, radius * 1.45, height * .48, enemy.id, fade);
      }
      if (k.time - receipt.ignition < .59) {
        k.impact();
        k.jointEmber(x, height * .53, z, radius * 1.75, height * .71, enemy.id, k.flashIntensity * Math.min(1,(.59-k.time+receipt.ignition)/.16));
      }
      if (!receipt.emitted && dt > 0) {
        receipt.emitted = true;
        k.burst(x, height * .45, z, receipt.element, k.low ? 3 : 7, receipt.element === 'kinetic' ? 2.1 : 1.2, .3);
      }
      if (receipt.element === 'kinetic') this.launched(enemy, radius, height, receipt);
      else if (receipt.element === 'cryo' && !status?.frozen) this.frozenShell(x, z, radius, height, enemy.id, (1 - receipt.age / receipt.life) * .35);
    }
    return true;
  }

  private ghost(x: number, z: number, angle: number, color: number, lean: number): void {
    const ghost = this.ghosts[this.ghostCursor++ % GHOST_LIMIT];
    ghost.live = true; ghost.x = x; ghost.z = z; ghost.angle = angle; ghost.color = color; ghost.age = 0; ghost.life = .18; ghost.lean = lean;
  }

  private drawGhost(g: Ghost, opacity: number): void {
    this.kit.afterImage(g.x, g.z, g.angle, g.color, opacity, g.lean);
  }

  private invulnerability(x: number, z: number, angle: number): void {
    const k = this.kit, sx = -Math.sin(angle), sz = Math.cos(angle), opacity = .26 + k.flashIntensity * .12;
    for (let side = -1; side <= 1; side += 2) {
      const px = x + sx * .33 * side, pz = z + sz * .33 * side;
      k.ribbon(px, .82, pz, px, 1.52, pz, FRIENDLY, .012, opacity, false);
      k.ribbon(px, 1.52, pz, x + sx * .2 * side, 1.69, z + sz * .2 * side, WHITE, .01, opacity, false);
    }
    k.ribbon(x + sx * .16, 1.93, z + sz * .16, x - sx * .16, 1.93, z - sz * .16, WHITE, .012, opacity, false);
    k.outline(x, z, .46, FRIENDLY, .16, 0);
  }

  private pose(frame: AbilityFrame, dashing: boolean): void {
    const marine = frame.marine;
    const body = frame.marineBody ?? marine?.children[0];
    if (!body) return;
    if (this.rest?.body !== body) {
      this.restorePose();
      this.rest = { body, y: body.position.y, rx: body.rotation.x, rz: body.rotation.z, sy: body.scale.y };
    }
    const rest = this.rest;
    let brace = 0;
    const slots = frame.snapshot?.slots;
    if (slots) for (const slot of CAST_SLOTS) {
      const state = slots[slot];
      if (state.castRemainingMs > 0) {
        const duration = Math.max(1, ABILITY_CATALOG[state.id].castMs);
        brace = Math.max(brace, .45 + .55 * (1 - state.castRemainingMs / duration));
      }
    }
    // Absolute offsets preserve the model's authored ground offset and avoid drift on paused refreshes.
    const motion = this.kit.reducedMotion ? .35 : 1;
    body.position.y = rest.y - brace * .11 * motion;
    body.scale.y = rest.sy * (1 - brace * .065 * motion);
    body.rotation.z = rest.rz + (dashing ? -.17 : brace * .045) * motion;
    body.rotation.x = rest.rx;
  }

  private restorePose(): void {
    if (!this.rest) return;
    const r = this.rest;
    r.body.position.y = r.y; r.body.rotation.x = r.rx; r.body.rotation.z = r.rz; r.body.scale.y = r.sy;
  }

  private readyVents(x: number, z: number, angle: number): void {
    const k = this.kit, fade = Math.max(0, 1 - this.readyAge / .5), c = Math.cos(angle), s = Math.sin(angle);
    for (let side = -1; side <= 1; side += 2) {
      const px = x - c * .18 - s * side * .28, pz = z - s * .18 + c * side * .28;
      k.draw('spark', px, 1.35 + this.readyAge * .9, pz, .1 + fade * .09, .48 * fade, .05, this.readyColor, fade * .8);
      if (!k.low) k.draw('smoke', px, 1.32 + this.readyAge * .45, pz, .22, .36, .08, this.readyColor, fade * .3);
    }
  }

  private frozenShell(x: number, z: number, radius: number, height: number, seed: number, flash: number): void {
    // One low foot shell complements actor-owned frost without encasing anatomy.
    this.kit.iceShell(x, z, radius * .84, height, .19 + flash * .09);
  }

  /** Chill stacks thicken the foot fringe; actor materials retain upper-body identity. */
  private chilling(x: number, z: number, radius: number, height: number, seed: number, progress: number): void {
    const k = this.kit, count = k.low ? 2 : 4;
    for (let i = 0; i < count; i++) {
      const a = seed * .73 + i * 2.39996323, r = radius * (.72 + i % 2 * .11);
      const h = height * (.035 + progress * (.025 + i * .015));
      k.draw('shard', x + Math.cos(a) * r, h, z + Math.sin(a) * r,
        radius * (.13 + progress * .09), h * (.4 + progress * .3), radius * .13,
        i % 2 ? WHITE : ELEMENT_COLORS.cryo, .3 + progress * .35, a, .2 + progress * .15);
    }
  }

  private burning(root: T.Object3D | undefined, radius: number, height: number, seed: number): void {
    if (!root) return;
    const joints = this.joints(root);
    const anchor = joints.find(joint => /shin|calf|back_mid|leg[45]_lower/i.test(joint.name)) ?? joints[Math.abs(seed) % joints.length];
    if (!anchor) return;
    const m = anchor.matrixWorld.elements, k = this.kit;
    const flicker = k.reducedMotion ? .6 : .55 + .45 * Math.sin(k.time * 21 + seed);
    // Lift the wick onto the outer skin of the joint. A bone origin sits
    // inside the opaque mesh, particularly on the crawler's bent rear leg.
    const wick = m[13] + height * .10;
    k.impact();
    k.jointEmber(m[12], wick, m[14], radius, Math.max(.24, height * (.18 + .17 * flicker)), seed);
  }

  private joints(root: T.Object3D): T.Object3D[] {
    let joints = this.contactJoints.get(root);
    if (!joints) {
      const found: T.Object3D[] = [];
      root.traverse(node => {
        if (found.length < 4 && isContactJoint(node)) found.push(node);
      });
      this.contactJoints.set(root, found);
      joints = found;
    }
    return joints;
  }

  private stunned(x: number, z: number, radius: number, height: number, seed: number): void {
    const k = this.kit, actor = k.statusActor(seed);
    const joint = actor && this.joints(actor.root)[0];
    const tip = joint?.matrixWorld.elements, base = joint?.parent?.matrixWorld.elements;
    const ax = base?.[12] ?? x, ay = base?.[13] ?? height * .58, az = base?.[14] ?? z;
    const bx = tip?.[12] ?? x + radius * .72, by = tip?.[13] ?? height * .26, bz = tip?.[14] ?? z;
    const flicker = k.reducedMotion ? .8 : .66 + .26 * Math.sin(k.time * 23 + seed);
    k.ribbon(ax, ay, az, bx, by, bz, ELEMENT_COLORS.arc, .065, flicker, false);
    k.ribbon(ax, ay + .02, az, bx, by + .02, bz, WHITE, .019, flicker, false);
    k.draw('spark', bx, by, bz, .08, .09, 1, WHITE, flicker);
  }

  private railLanding(receipt: Receipt): void {
    const k = this.kit, actor = k.statusActor(receipt.id);
    if (!actor) return;
    const {x, z} = actor.root.position;
    const dx = x - receipt.railX, dz = z - receipt.railZ;
    const angle = Math.hypot(dx, dz) > .04 ? Math.atan2(dz, dx) : receipt.railAngle;
    const size = Math.min(1.3, Math.max(.45, actor.height * .56));
    if (receipt.age < .1) {
      k.impact();
      k.sprite('impact', x, actor.height * .54, z, size * 1.45, size, WHITE,
        (1 - receipt.age / .1) * k.flashIntensity, receipt.id, 'light');
    }
    if (receipt.age < .26) return;
    k.sustain();
    receipt.landed = true;
    k.impact();
    k.mote('spark', x, .18, z, 0, .42, 0, size * .50, .13, WHITE);
    k.mote('spark', x, .11, z, -Math.cos(angle) * 2, .2, -Math.sin(angle) * 2,
      size * .33, .19, 0xffda95);
    const halfLength = Math.min(size * .82, Math.hypot(dx, dz) * .5);
    if (halfLength > .04)
      k.scar('skid', x - Math.cos(angle) * halfLength, z - Math.sin(angle) * halfLength,
        halfLength, 0xc2a17a, .85, angle, size * .18);
    for (let i = 0, count = k.low ? 5 : 10; i < count; i++) {
      const a = angle + i * Math.PI * 2 / count, c = Math.cos(a), s = Math.sin(a);
      k.mote('smoke', x + c * size * .36, .13, z + s * size * .36,
        c * 1.7, .46, s * 1.7, size * .26, .42, 0xc2b197);
    }
    k.impact();
  }

  private launched(enemy: StruckTarget, radius: number, height: number, receipt: Receipt): void {
    const k = this.kit, x = enemy.x / UNIT, z = enemy.y / UNIT, fade = 1 - receipt.age / receipt.life;
    const speed = Math.hypot(enemy.velocityX, enemy.velocityY);
    if (speed > Math.max(260, enemy.baseSpeed * 1.6)) {
      const length = Math.min(1.7, speed / UNIT * .065), a = Math.atan2(enemy.velocityY, enemy.velocityX), c = Math.cos(a), s = Math.sin(a);
      k.ribbon(x, height * .35, z, x - c * length, height * .3, z - s * length, ELEMENT_COLORS.kinetic, .025, fade * .4, false);
      if (!k.low) k.ribbon(x - s * radius * .4, .1, z + c * radius * .4, x - c * length - s * radius * .4, .07, z - s * length + c * radius * .4, ELEMENT_COLORS.kinetic, .012, fade * .2, false);
      k.draw('smoke', x - c * length * .55, .23, z - s * length * .55, .3 + length * .18, .24, .1, 0x968673, fade * .5);
    }
    k.draw('spark', x, height * .6, z, radius * .22, .08, .05, ELEMENT_COLORS.kinetic, fade * .3);
  }

  clear(): void {
    this.kit.frostVictim = this.kit.frostUntil = -1;
    this.selected.clear(); this.previouslyFrozen.clear(); this.previouslyBurning.clear();
    this.payoff.clear();
    this.restorePose();
    for (const ghost of this.ghosts) ghost.live = false;
    for (const receipt of this.receipts) receipt.live = false;
    this.dashTime = 0; this.ghostClock = 0; this.readyAge = 1; this.castAge = 1;
  }

  private suitPulse(x: number, z: number, angle: number): void {
    const fade = Math.max(0, 1 - this.castAge / .3), sx = -Math.sin(angle), sz = Math.cos(angle);
    for (let side = -1; side <= 1; side += 2) {
      this.kit.draw('spark', x + sx * .32 * side, 1.28, z + sz * .32 * side, .07, .2, .05, this.castColor, fade * .75);
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.clear(); this.rest = undefined; this.game = undefined; this.statusFor = undefined; this.disposed = true;
  }
}

/** Register once with AbilityVisuals; shared kit retains ownership of every GPU resource. */
export function createSystemPresentation(kit: ElementKit): AbilityPresentation {
  return new SystemPresentation(kit);
}
