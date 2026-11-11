import type {DepthGame, GameEffect} from '../../../DepthGame';
import type {UiCue} from '../../../game/audio/contract';
import {ROOM_TEMPLATES} from '../../../game/roguelike/roomTemplates';
import {runLength} from '../../../game/roguelike/run';
import {getAbilities} from '../../gameAdapter';
import {icon} from '../../icons';
import '../../styles/beats.css';

export type BeatKind = 'room-enter' | 'room-clear' | 'boss-intro' | 'boss-defeated' | 'death' | 'victory' | 'overdrive-ready';
const durations: Record<BeatKind, number> = {'room-enter': 1.6, 'room-clear': 1.1, 'boss-intro': 2.2, 'boss-defeated': 1.5, death: .85, victory: 1.2, 'overdrive-ready': 1.8};

/** A single passive presentation plane. Authored story text and checkpoint timing remain untouched. */
export class PresentationBeats {
  private readonly node = document.createElement('aside');
  private readonly edge = document.createElement('div');
  private readonly glyph = document.createElement('span');
  private readonly eyebrow = document.createElement('span');
  private readonly headline = document.createElement('strong');
  private readonly detail = document.createElement('p');
  private remaining = 0;
  private hold = 0;
  private revision = -1;
  private previousStatus = '';
  private bossSeen = false;
  private bossAlive = false;
  private ready = false;
  private low = false;
  private enabled = true;
  private roomKills = 0;
  private kind: BeatKind | '' = '';
  private media = matchMedia('(prefers-reduced-motion: reduce)');
  private skip = (event: KeyboardEvent) => {
    if (event.repeat || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Escape' || event.key === 'Enter') this.dismiss();
  };
  constructor(private game: DepthGame, host: HTMLElement, private cue: (cue: UiCue) => void) {
    this.node.id = 'presentation-beat'; this.node.hidden = true;
    this.node.setAttribute('role', 'status'); this.node.setAttribute('aria-live', 'polite');
    this.glyph.className = 'beat-glyph'; this.eyebrow.className = 'beat-eyebrow';
    this.node.append(this.glyph, this.eyebrow, this.headline, this.detail);
    this.edge.id = 'critical-edge'; this.edge.hidden = true; this.edge.setAttribute('aria-hidden', 'true');
    host.append(this.edge, this.node); document.addEventListener('keydown', this.skip);
  }
  get blocking(): boolean { return this.enabled && this.hold > 0; }
  setEnabled(value: boolean): void { if (this.enabled !== value) {this.dismiss(); this.revision = -1; this.previousStatus = this.game.status;} this.enabled = value; if (!value) this.edge.hidden = true; }
  reset(): void {this.dismiss(); this.revision = -1; this.bossSeen = this.bossAlive = this.ready = this.low = false; this.previousStatus = this.game.status;}
  dismiss(): void {this.remaining = this.hold = 0; this.node.hidden = true; this.kind = '';}
  show(kind: BeatKind): void {
    if (!this.enabled) return;
    const game = this.game;
    this.kind = kind; this.remaining = durations[kind];
    this.hold = ['room-clear', 'death', 'victory', 'boss-defeated'].includes(kind) ? this.media.matches ? .15 : .55 : 0;
    const room = ROOM_TEMPLATES[game.node.templateId];
    const data: Record<BeatKind, [string, string, string, string]> = {
      'room-enter': [game.node.kind, `SECTOR ${String(game.node.depth + 1).padStart(2, '0')} / ${runLength(game.expedition.run.version)} · ${game.storyRoom?.environment.toUpperCase() ?? 'COLONY VESSEL'}`, room.name.toUpperCase(), game.storyRoom?.objective ?? 'Clear the sector. Reach the next deck.'],
      'room-clear': ['check', 'THREAT SIGNAL / ZERO', 'SECTOR CLEAR', `${Math.max(0, game.stats.kills.total - this.roomKills)} HOSTILES ELIMINATED · ${((game.stats.roomTimeMs[game.node.id] ?? 0) / 1000).toFixed(1)} s`],
      'boss-intro': ['boss', 'PRIORITY THREAT', 'THE QUEEN', 'ARMORED → EXPOSED → NESTS · Strike when the core opens.'],
      'boss-defeated': ['boss', 'PRIORITY THREAT / SILENCED', 'QUEEN NEUTRALIZED', 'The deck is yours.'],
      death: ['warning', 'SUIT TELEMETRY / SIGNAL LOST', 'MARINE DOWN', 'Expedition record secured.'],
      victory: ['check', 'EXPEDITION / FINAL TRANSMISSION', 'PROTOCOL COMPLETE', 'Archiving expedition record.'],
      'overdrive-ready': [getAbilities(game)?.slots?.overdrive.id ?? 'arc', 'COMBAT SYSTEMS / FULL CHARGE', 'OVERDRIVE READY', 'V · Release the rig.'],
    };
    const [glyph, eyebrow, headline, detail] = data[kind];
    this.glyph.innerHTML = icon(glyph); this.eyebrow.textContent = eyebrow; this.headline.textContent = headline; this.detail.textContent = detail;
    this.node.dataset.beat = kind; this.node.dataset.reducedMotion = String(this.media.matches); this.node.hidden = false;
    const cue: UiCue = kind === 'boss-defeated' ? 'room-clear' : kind;
    this.cue(cue);
  }
  effect(event: GameEffect): void {
    if (!this.enabled) return;
    if (this.kind === 'room-enter' && (event.type === 'shot' || event.type === 'ability' && event.ability?.phase === 'cast')) this.remaining = Math.min(this.remaining, .22);
    if (event.type === 'ability' && event.ability?.phase === 'overdrive-ready' && !this.ready) {
      this.ready = true;
      // The HUD owns the near-slot ready callout; audio answers the same event.
      this.cue('overdrive-ready');
    }
    if (event.type === 'ability' && event.ability?.slot === 'overdrive' && ['cast', 'impact'].includes(event.ability.phase)) this.ready = false;
  }
  sync(): void {
    const game = this.game;
    if (!this.enabled) {this.previousStatus = game.status; return;}
    if (game.status === 'playing' && this.revision !== game.roomRevision) {
      this.revision = game.roomRevision; this.roomKills = game.stats.kills.total;
      this.bossSeen = this.bossAlive = false; this.show('room-enter');
    }
    if (game.status !== this.previousStatus) {
      if (this.previousStatus === 'playing' && game.status === 'reward') this.show(this.bossAlive ? 'boss-defeated' : 'room-clear');
      else if (this.previousStatus === 'playing' && game.status === 'dead') this.show('death');
      else if (this.previousStatus === 'playing' && game.status === 'complete') this.show(this.bossAlive ? 'boss-defeated' : 'victory');
      else if (['menu', 'rig-select', 'paused'].includes(game.status)) this.dismiss();
      this.previousStatus = game.status;
    }
    if (game.status === 'playing' && game.boss.snapshot.active && !this.bossSeen) {
      this.bossSeen = this.bossAlive = true; this.show('boss-intro');
    }
    const low = game.status === 'playing' && game.combat.snapshot.health > 0 && game.combat.snapshot.health <= 25;
    this.edge.hidden = !low;
    if (low && !this.low) this.cue('low-health');
    this.low = low;
  }
  tick(dt: number): void {
    if (!this.enabled) return;
    const elapsed = Number.isFinite(dt) ? Math.max(0, Math.min(.1, dt)) : 0;
    this.hold = Math.max(0, this.hold - elapsed); this.remaining = Math.max(0, this.remaining - elapsed);
    this.node.dataset.leaving = String(this.remaining > 0 && this.remaining < .2);
    if (!this.remaining) this.node.hidden = true;
    // Never carry the tail of a transition card over a newly focused blocking menu.
    if (!this.hold && this.game.status !== 'playing' && this.kind) this.dismiss();
  }
  dispose(): void {document.removeEventListener('keydown', this.skip); this.node.remove(); this.edge.remove();}
}
