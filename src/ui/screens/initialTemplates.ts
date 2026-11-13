import type {DepthGame} from '../../DepthGame';
import {icon} from '../icons';
import {titleKeyArt} from './title/keyArt';
import {version} from '../../../package.json';

/** Initial title/recovery UI stays independent of the run-screen chunk. */
export const escapeHtml = (value: unknown): string => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
const tag=(text:string)=>`<span class="eyebrow">${text}</span>`;
const arrow=()=>icon('arrow','screen-arrow');
const serial=(value:number)=>String(value).padStart(2,'0');

export type ContinueSummary = Readonly<{rig: string; sector: number; total: number; boons: number; phase: string}>;

/** Self-contained front door, with one native action per menu row. */
export function titleScreen(game: DepthGame, settings: string, settingsOpen: boolean, creditsOpen: boolean, controlsOpen = false, continuation?: ContinueSummary | null, cinematic = false, reveal = true): string {
  const drawer = settingsOpen || creditsOpen || controlsOpen;
  return `<main class="title-screen screen-enter ${drawer?'drawer-open':''}" data-menu-presentation="${cinematic?'cinematic':'vector'}">${titleKeyArt(continuation?.rig, false, reveal)}
    <div class="title-copy"><div class="edition"><i></i> EMERGENCY WAKE PROTOCOL / HUMAN SIGNAL DETECTED</div><h1 aria-label="Containment Depth"><span class="title-word">CONTAINMENT</span><span class="title-depth">DEPTH</span></h1><p class="premise">A colony ship has gone silent.<br>Wake up. Restore the uplink. Warn New Earth.</p>
    <nav class="menu-buttons" aria-label="Main menu"><button class="primary menu-start" id="start"><span class="menu-index">01</span><span><small>BEGIN EXPEDITION</small>Wake up</span>${arrow()}</button>${game.canContinue?`<button class="secondary menu-continue" id="continue"><span class="menu-index">02</span><span><b>Continue expedition</b><small>${continuation?`${escapeHtml(continuation.rig)} · Sector ${serial(continuation.sector)} / ${continuation.total} · ${continuation.boons} boons`:'Last saved choice or room boundary'}</small></span>${arrow()}</button>`:''}<div class="title-utilities"><button id="settings" class="menu-utility" aria-expanded="${settingsOpen}">${icon('settings')}<span>Settings</span>${arrow()}</button><button id="controls" class="menu-utility" aria-expanded="${controlsOpen}">${icon('loadout')}<span>Controls</span>${arrow()}</button><button id="menu-credits" class="menu-utility" aria-expanded="${creditsOpen}">${icon('check')}<span>Credits</span>${arrow()}</button></div></nav>
    <div class="title-version"><span class="systems-dot"></span> SHIP SYSTEMS / AWAITING OPERATOR <span>BUILD ${version} · KEYBOARD & MOUSE</span></div></div>
    ${settingsOpen?`<aside class="title-drawer configuration-drawer" aria-label="Settings"><div class="drawer-heading"><div>${tag('SHIP SYSTEMS')}<h2>Configuration</h2></div><button id="close-drawer" class="secondary">Back ${icon('arrow')}</button></div>${settings}</aside>`:''}
    ${controlsOpen?`<aside class="title-drawer controls-drawer" aria-label="Controls"><div class="drawer-heading"><div>${tag('OPERATOR REFERENCE')}<h2>Keyboard & mouse</h2></div><button id="close-drawer" class="secondary">Back ${arrow()}</button></div>${controlsScreen()}</aside>`:''}
    ${creditsOpen?`<aside class="title-drawer credits-drawer" aria-label="Credits"><div class="drawer-heading"><div>${tag('ORIGINAL EXPEDITION')}<h2>Transmission credits</h2></div><button id="close-drawer" class="secondary">Back ${arrow()}</button></div><p>Containment / Depth</p><p>An original desktop action expedition.</p><p>Typography: Barlow and Barlow Condensed by Jeremy Tribby, licensed under SIL Open Font License 1.1.</p><a href="${import.meta.env.BASE_URL}fonts/OFL.txt" target="_blank" rel="noopener">Font license</a><br><a href="${import.meta.env.BASE_URL}audio-credits.html" target="_blank" rel="noopener">Audio credits ${arrow()}</a><button id="close-credits" class="secondary">Close credits</button></aside>`:''}
  </main>`;
}

export function controlsScreen(): string {
  const keys=[['ESC','Pause'],['1–5','Weapons'],['Q','Tactical'],['W','Move'],['E','Medkit'],['R','Reload'],['A','Move'],['S','Move'],['D','Move'],['F','Power'],['SHIFT','Dash'],['G','Grenade'],['V','Overdrive'],['SPACE','Aim-assisted fire']];
  return `<div class="controls-reference"><section class="keyboard-diagram">${tag('LEFT HAND / MOVE & SYSTEMS')}<div class="keyboard-drawing" aria-label="Keyboard controls">${keys.map(([key,label])=>`<div class="drawn-key key-${key==='SHIFT'?'shift':key==='SPACE'?'space':key==='ESC'?'escape':key==='1–5'?'weapons':key.toLowerCase()}"><kbd>${key}</kbd><span>${label}</span></div>`).join('')}</div></section><section class="mouse-reference">${tag('RIGHT HAND / AIM & FIRE')}<div class="mouse-diagram"><svg viewBox="0 0 120 160" role="img" aria-label="Mouse. Move to aim, left button to fire."><path d="M26 66V45a34 34 0 0 1 68 0v55a34 34 0 0 1-68 0Z"/><path d="M60 12v54H26M60 66h34"/><rect x="54" y="30" width="12" height="23" rx="6"/><path class="mouse-left" d="M30 61V45a30 30 0 0 1 25-30v46Z"/></svg><div><b>Move mouse <span>Aim</span></b><b>Left button <span>Fire weapon</span></b></div></div><dl class="menu-controls"><div><dt><kbd>Tab</kbd></dt><dd>Navigate menu controls</dd></div><div><dt><kbd>Enter / Space</kbd></dt><dd>Activate focused control</dd></div><div><dt><kbd>Esc</kbd></dt><dd>Pause / resume</dd></div></dl></section></div><p class="screen-footnote">Letter and number shortcuts use physical US keyboard positions on every layout. Weapon reserves replenish during combat and refill between rooms. Overdrive charge persists between rooms.</p>`;
}

export function systemScreen(title: string, message: string, action?: {id: string; label: string}): string {
  return `<section class="panel system-panel" role="status">${icon('warning')}${tag('SHIP SYSTEMS')}<h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p>${action?`<button class="primary" id="${escapeHtml(action.id)}">${escapeHtml(action.label)}</button>`:''}</section>`;
}
