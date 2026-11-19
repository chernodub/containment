import {WEAPON_JOBS} from '../game/combat/catalog';
import { icon } from './icons';
export const app = document.getElementById('app')!;
const key = (label: string) => `<kbd data-hud-critical>${label}</kbd>`;
/** Persistent game chrome. Keeping markup a function makes DOM contracts testable. */
export function renderShell(): string {
    return `<canvas tabindex="-1" id="world" aria-label="Containment 3D game world"></canvas><div id="shade"></div><div id="hurt-flash"></div>
<div id="hud" hidden>
 <div class="hud-top"><div class="vitals" aria-label="Suit vitals">
  <div class="vital-caption"><span>SUIT INTEGRITY</span><span id="vital-state">NOMINAL</span></div>
  <div class="vital-line">${icon('health')}<b id="health" data-hud-critical>100</b><div class="meter segmented"><i id="hp-lag" class="damage-lag"></i><i id="hp-bar"></i></div></div>
  <div class="armor-line">${icon('armor')}<span>ARMOR</span><div class="meter armor segmented"><i id="armor-lag" class="damage-lag"></i><i id="armor-bar"></i></div><b id="armor" data-hud-critical>50</b></div>
  <div id="desktop-stock"><span>${key('E')}${icon('medkit')}<b id="medkit-count" data-hud-critical>2</b><span>MEDKIT</span></span><span>${key('G')}${icon('grenade')}<b id="grenade-count" data-hud-critical>3</b><span>GRENADE</span></span></div>
 </div></div>
 <div id="boss-hud" hidden><div class="boss-heading"><span>${icon('boss')} THE QUEEN</span><span id="boss-phase"></span></div><div class="meter boss-meter"><i id="boss-bar"></i></div><div class="boss-phase-track"><span data-boss-phase="armored">I · ARMORED</span><span data-boss-phase="exposed">II · EXPOSED</span><span data-boss-phase="nests">III · NESTS</span></div></div>
 <div id="status-hud" aria-label="Room objective. Full room records are available in Pause."><div class="room-heading"><div class="room-label"><span id="depth-label"></span><b id="room-name"></b></div><button id="pause" class="icon-button" aria-label="Pause game">${icon('pause')}</button></div>
  <div id="run-stock"><span id="credits" data-hud-critical></span><span id="encounter-count" data-hud-critical></span></div>
  <aside id="story-hud" hidden><p id="story-status" role="status"></p><p id="room-objective" data-hud-critical></p><div id="story-presentation"><span id="story-line"></span><button id="skip-story" aria-label="Skip dialogue">Skip ${key('↵')}</button></div></aside>
  <div id="build-strip" aria-label="Owned boon effects and sets"></div>
 </div>
 <div id="action-bar">
  <div class="weapon-bank"><div class="weapon-hud"><div class="weapon-info"><span id="current-weapon-icon">${icon('pistol')}</span><span id="weapon-name">PISTOL</span><span class="reload-key">${key('R')}</span></div><div class="ammo-line"><b id="magazine" data-hud-critical>12</b><span id="reserve" data-hud-critical>/ ∞</span><small id="reload-label" data-hud-critical></small></div><div class="reload-line"><i id="reload-bar"></i></div></div>
   <div id="weapon-picker" aria-label="Weapons">${(['pistol', 'rifle', 'shotgun', 'plasma', 'rocket'] as const).map((id, i) => `<button data-weapon="${id}" aria-label="Equip ${id}. ${WEAPON_JOBS[id]}" title="${WEAPON_JOBS[id]}"><small data-hud-critical>${i + 1}</small>${icon(id)}<span>${WEAPON_JOBS[id]}</span></button>`).join('')}</div>
  </div>
  <div id="ability-bar" hidden><div class="dash-slot" data-ability="dash"><span class="ability-icon"></span><div><span class="ability-title">DASH</span><div class="dash-pips"><i></i><i></i><i hidden></i></div><span class="ability-value" data-hud-critical>READY</span></div>${key('SHIFT')}</div>
   ${(['tactical', 'power'] as const).map((slot, i) => `<div class="ability-slot" data-ability="${slot}"><div class="cooldown-dial"><span class="ability-icon"></span><svg viewBox="0 0 48 48" aria-hidden="true"><circle class="dial-track" cx="24" cy="24" r="21"/><circle class="dial-progress" cx="24" cy="24" r="21"/></svg><b class="ability-value" data-hud-critical>READY</b></div><div class="ability-caption">${key(i === 0 ? 'Q' : 'F')}<span class="ability-title"></span><span class="ability-charges"></span></div></div>`).join('')}
   <div class="overdrive-slot" data-ability="overdrive"><div class="overdrive-top">${key('V')}<span>OVERDRIVE</span><b class="ability-value" data-hud-critical>0%</b></div><div class="overdrive-body"><span class="ability-icon"></span><span class="ability-title"></span></div><div class="overdrive-meter"><i></i></div></div>
  </div>
 </div>
 <div id="combat-text" aria-hidden="true"></div><div id="threat-indicators" aria-hidden="true"></div><div id="damage-directions" aria-hidden="true"></div><div id="hud-toasts" role="status" aria-live="polite" aria-atomic="true"></div>
 <aside id="radar-hud" aria-label="Room radar" hidden><div class="radar-label">${icon('combat')}<span data-hud-critical>LOCAL SCAN</span></div><svg id="radar-map" viewBox="0 0 144 100" aria-hidden="true"></svg></aside>
</div>
<div id="application-notice" role="status" aria-live="polite" aria-atomic="true" hidden></div><div id="room-loading" role="status" aria-live="polite" hidden><b>Preparing room…</b><span>Combat is on hold.</span></div><div id="overlay"></div><div id="signature">CONTAINMENT <span>/</span> DEPTH</div>`;
}
export function mountShell(): void { app.innerHTML = renderShell(); }
export const el = (id: string) => document.getElementById(id)!;
