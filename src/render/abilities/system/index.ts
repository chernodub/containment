import type * as T from 'three';
import { ABILITY_CATALOG } from '../../../game/abilities/catalog';
import type { AbilityElement, AbilityEvent } from '../../../game/abilities/contract';
import type { DepthGame } from '../../../DepthGame';
import type { EnemySnapshot } from '../../../game/enemies/EnemySystem';
import type { ElementKit } from '../ElementKit';
import { ELEMENT_COLORS, UNIT, type AbilityFrame, type AbilityPresentation } from '../types';

const FRIENDLY = 0x9fe8ff;
const WHITE = 0xe8fbff;
const GHOST_LIMIT = 3;
const RECEIPT_LIMIT = 64;
const EMPTY_ENEMIES: readonly EnemySnapshot[] = [];
const RIG_ELEMENTS = { breacher: 'kinetic', cryo: 'cryo', pyro: 'pyro', arc: 'arc' } as const;
const CAST_SLOTS = ['tactical', 'power', 'overdrive'] as const;
type Ghost = { live: boolean; x: number; z: number; angle: number; age: number; life: number; color: number; lean: number };
type Receipt = { id: number; element: AbilityElement; age: number; life: number; emitted: boolean };
type MarineRest = { body: T.Object3D; y: number; rx: number; rz: number; sy: number };
type Status = { frozen: boolean; burning: boolean; shocked?: boolean; chilled: boolean };

/** Common body language and restrained, element-specific target feedback, using shared fixed pools. */
class SystemPresentation implements AbilityPresentation {
  private ghosts: Ghost[] = Array.from({ length: GHOST_LIMIT }, () => ({ live: false, x: 0, z: 0, angle: 0, age: 0, life: .18, color: FRIENDLY, lean: 0 }));
  private receipts: Receipt[] = Array.from({ length: RECEIPT_LIMIT }, () => ({ id: -1, element: 'kinetic', age: 0, life: 0, emitted: false }));
  private ghostCursor = 0;
  private receiptCursor = 0;
  private ghostClock = 0;
  private dashTime = 0;
  private readyAge = 1;
  private readyX = 0;
  private readyZ = 0;
  private readyColor = FRIENDLY;
  private rest?: MarineRest;
  private game?: DepthGame;
  private statusFor?: (id: number) => Status;
  private disposed = false;

  constructor(private readonly kit: ElementKit) {}

  event(event: AbilityEvent, x: number, y: number): void {
    if (this.disposed || !Number.isFinite(x) || !Number.isFinite(y)) return;
    const k = this.kit, color = ELEMENT_COLORS[event.element];
    if (event.phase === 'denied' || event.phase === 'ready') return;
    if (event.phase === 'dash-start') {
      this.dashTime = .22;
      this.ghostClock = .035;
      if (!k.reducedMotion) this.ghost(x / UNIT, y / UNIT, event.angle ?? 0, color, .2);
      k.camera(.07, event.angle ?? 0);
    } else if (event.phase === 'dash-end') {
      this.dashTime = Math.max(this.dashTime, .07);
      const px = (event.targetX ?? x) / UNIT, pz = (event.targetY ?? y) / UNIT;
      if (!k.reducedMotion) this.ghost(px, pz, event.angle ?? 0, color, .14);
    } else if (event.phase === 'overdrive-ready') {
      this.readyAge = 0; this.readyX = x / UNIT; this.readyZ = y / UNIT; this.readyColor = color;
      k.flash(this.readyX, this.readyZ, color, 2.5, 2.6, 2, .18);
      k.burst(this.readyX, 1.2, this.readyZ, event.element, 8, .65, .45);
    }
    if (event.phase !== 'impact' && event.phase !== 'tick' && event.phase !== 'link' && event.phase !== 'burst' && event.phase !== 'dash-end') return;
    if (!event.targetIds) return;
    let count = 0;
    for (const id of event.targetIds) {
      if (count++ >= RECEIPT_LIMIT || !Number.isFinite(id)) break;
      let receipt: Receipt | undefined;
      for (const candidate of this.receipts) if (candidate.id === id) { receipt = candidate; break; }
      receipt ??= this.receipts[this.receiptCursor++ % RECEIPT_LIMIT];
      receipt.id = id; receipt.element = event.element; receipt.age = 0;
      receipt.life = event.element === 'kinetic' ? .38 : .26; receipt.emitted = false;
    }
  }

  update(frame: AbilityFrame): void {
    if (this.disposed) return;
    this.restorePose();
    const k = this.kit, dt = frame.dt;
    if (!frame.visible) return;
    const g = frame.game;
    if (g && this.game !== g) { this.game = g; this.statusFor = g.boonStatuses; }
    const dead = g?.combat.snapshot.dead ?? false;
    if (dead) { this.clear(); return; }
    this.dashTime = Math.max(0, this.dashTime - dt);
    this.readyAge += dt;
    for (const receipt of this.receipts) {
      if (receipt.id < 0) continue;
      receipt.age += dt;
      if (receipt.age >= receipt.life) receipt.id = -1;
    }
    const snapshot = frame.snapshot;
    const p = g?.player;
    if (p) {
      const x = p.x / UNIT, z = p.y / UNIT;
      const color = snapshot?.rig ? ELEMENT_COLORS[RIG_ELEMENTS[snapshot.rig]] : FRIENDLY;
      const overclock = snapshot?.rig === 'arc' && snapshot.overdrive.active;
      const trailing = snapshot?.dashing || this.dashTime > .07 || overclock;
      this.ghostClock -= dt;
      if (trailing && dt > 0 && this.ghostClock <= 0 && !k.reducedMotion) {
        this.ghost(x, z, p.angle, color, snapshot?.dashing ? .22 : .06);
        this.ghostClock = snapshot?.dashing ? .045 : .085;
      } else if (!trailing) this.ghostClock = 0;
      if (snapshot?.invulnerable) this.invulnerability(x, z, p.angle);
      this.pose(frame, !!snapshot?.dashing);
      if (this.readyAge < .5) this.readyVents(x, z, p.angle);
    } else if (this.readyAge < .5) this.readyVents(this.readyX, this.readyZ, 0);
    for (const ghost of this.ghosts) {
      if (!ghost.live) continue;
      ghost.age += dt;
      if (ghost.age >= ghost.life) { ghost.live = false; continue; }
      this.drawGhost(ghost, (1 - ghost.age / ghost.life) * (k.low ? .12 : .22));
    }
    let drawn = 0;
    for (const enemy of g?.enemies.snapshot.enemies ?? EMPTY_ENEMIES) {
      if (drawn >= (k.low ? 24 : 40) || enemy.health <= 0) continue;
      if (p && Math.hypot(enemy.x - p.x, enemy.y - p.y) > 720) continue;
      const status = this.statusFor?.(enemy.id);
      let receipt: Receipt | undefined;
      for (const item of this.receipts) if (item.id === enemy.id) { receipt = item; break; }
      if (!receipt && !status?.frozen && !status?.burning && !status?.shocked) continue;
      drawn++;
      const x = enemy.x / UNIT, z = enemy.y / UNIT, radius = Math.max(.3, enemy.radius / UNIT);
      const height = enemy.type === 'crawler' ? .55 : enemy.type === 'brute' || enemy.type === 'carrier' ? 1.5 : .95;
      if (status?.frozen) this.frozenShell(x, z, radius, height, enemy.id, receipt?.element === 'cryo' ? 1 - receipt.age / receipt.life : 0);
      if (status?.burning) this.burning(x, z, radius, height, enemy.id);
      if (status?.shocked) this.stunned(x, z, radius, height, enemy.id);
      if (receipt) {
        if (!receipt.emitted && dt > 0) {
          receipt.emitted = true;
          k.burst(x, height * .45, z, receipt.element, k.low ? 3 : 7, receipt.element === 'kinetic' ? 2.1 : 1.2, .3);
        }
        if (receipt.element === 'kinetic') this.launched(enemy, radius, height, receipt);
        else if (receipt.element === 'cryo' && !status?.frozen) this.frozenShell(x, z, radius, height, enemy.id, (1 - receipt.age / receipt.life) * .35);
      }
    }
  }

  private ghost(x: number, z: number, angle: number, color: number, lean: number): void {
    const ghost = this.ghosts[this.ghostCursor++ % GHOST_LIMIT];
    ghost.live = true; ghost.x = x; ghost.z = z; ghost.angle = angle; ghost.color = color; ghost.age = 0; ghost.life = .18; ghost.lean = lean;
  }

  private drawGhost(g: Ghost, opacity: number): void {
    const k = this.kit, c = Math.cos(g.angle), s = Math.sin(g.angle), yaw = -g.angle;
    // Articulated helmet, vest, arms, two stepping legs and weapon: a marine silhouette, not a capsule.
    k.draw('ghost', g.x + c * g.lean, 1.74, g.z + s * g.lean, .29, .32, .32, g.color, opacity, yaw);
    k.draw('ghost', g.x + c * g.lean * .6, 1.23, g.z + s * g.lean * .6, .34, .63, .58, g.color, opacity * .75, yaw);
    for (let side = -1; side <= 1; side += 2) {
      const lateral = side * .19, step = side * .08;
      k.draw('ghost', g.x + c * step - s * lateral, .48, g.z + s * step + c * lateral, .24, .72, .21, g.color, opacity * .6, yaw, side * .08);
      if (!k.low) k.draw('ghost', g.x + c * .25 - s * side * .34, 1.26, g.z + s * .25 + c * side * .34, .43, .22, .2, g.color, opacity * .7, yaw);
    }
    k.draw('ghost', g.x + c * .55 - s * .13, 1.28, g.z + s * .55 + c * .13, .72, .12, .12, WHITE, opacity * .65, yaw);
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
      k.draw('spark', px, 1.35 + this.readyAge * .9, pz, .05 + fade * .04, .22 * fade, .05, this.readyColor, fade * .5);
      if (!k.low) k.draw('smoke', px, 1.32 + this.readyAge * .45, pz, .12, .19, .08, this.readyColor, fade * .12);
    }
  }

  private frozenShell(x: number, z: number, radius: number, height: number, seed: number, flash: number): void {
    const k = this.kit, count = k.low ? 3 : 7;
    for (let i = 0; i < count; i++) {
      const a = i * Math.PI * 2 / count + seed * .73;
      k.draw('shard', x + Math.cos(a) * radius * .76, height * (.38 + i % 3 * .16), z + Math.sin(a) * radius * .76,
        radius * .16, height * (.2 + i % 3 * .035), radius * .18, i % 3 ? ELEMENT_COLORS.cryo : WHITE, (.21 + flash * .24) * (.5 + .5 * k.flashIntensity), a, .22);
    }
  }

  private burning(x: number, z: number, radius: number, height: number, seed: number): void {
    const k = this.kit, count = k.low ? 2 : 3, time = k.reducedMotion ? 0 : k.time;
    for (let i = 0; i < count; i++) {
      const angle = i * 2.399963 + seed * .64, f = .7 + Math.sin(time * 8 + seed + i * 2.7) * .15;
      k.draw('flame', x + Math.cos(angle) * radius * .66, height * .38, z + Math.sin(angle) * radius * .66,
        radius * .18, height * .36 * f, .1, ELEMENT_COLORS.pyro, .24, angle);
    }
  }

  private stunned(x: number, z: number, radius: number, height: number, seed: number): void {
    const k = this.kit, count = k.low ? 2 : 4, time = k.reducedMotion ? 0 : k.time;
    for (let i = 0; i < count; i++) {
      const a = i * Math.PI * 2 / count + time * 3 + seed, r = radius * .82;
      const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r, h = height * .7 + Math.sin(a * 2) * .06;
      k.draw('spark', px, h, pz, .032, .08, .03, i % 2 ? WHITE : ELEMENT_COLORS.arc, .48);
      if (!k.low) k.ribbon(px, h, pz, x + Math.cos(a - .18) * r, h + .035, z + Math.sin(a - .18) * r, ELEMENT_COLORS.arc, .009, .25, false);
    }
  }

  private launched(enemy: EnemySnapshot, radius: number, height: number, receipt: Receipt): void {
    const k = this.kit, x = enemy.x / UNIT, z = enemy.y / UNIT, fade = 1 - receipt.age / receipt.life;
    const speed = Math.hypot(enemy.velocityX, enemy.velocityY);
    if (speed > Math.max(260, enemy.baseSpeed * 1.6)) {
      const length = Math.min(1.7, speed / UNIT * .065), a = Math.atan2(enemy.velocityY, enemy.velocityX), c = Math.cos(a), s = Math.sin(a);
      k.ribbon(x, height * .35, z, x - c * length, height * .3, z - s * length, ELEMENT_COLORS.kinetic, .025, fade * .4, false);
      if (!k.low) k.ribbon(x - s * radius * .4, .1, z + c * radius * .4, x - c * length - s * radius * .4, .07, z - s * length + c * radius * .4, ELEMENT_COLORS.kinetic, .012, fade * .2, false);
    }
    k.draw('spark', x, height * .6, z, radius * .22, .08, .05, ELEMENT_COLORS.kinetic, fade * .3);
  }

  clear(): void {
    this.restorePose();
    for (const ghost of this.ghosts) ghost.live = false;
    for (const receipt of this.receipts) receipt.id = -1;
    this.dashTime = 0; this.ghostClock = 0; this.readyAge = 1;
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
