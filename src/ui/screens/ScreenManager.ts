import type {DepthGame} from '../../DepthGame';
import type {DepthRenderer} from '../../render/DepthRenderer';
import type {InputController} from '../../InputController';
import type {AudioSystem} from '../../game/audio/AudioSystem';
import {loadAudioPreferences, saveAudioPreferences} from '../../game/audio/preferences';
import {expeditionRewardOffers} from '../../game/roguelike/expedition';
import type {MutationId} from '../../game/roguelike/types';
import {RIG_IDS} from '../../game/abilities/catalog';
import type {RigId} from '../../game/abilities/contract';
import type {HitConfirmation} from '../hud/HitConfirmation';
import {chooseRig, getAbilities, getRunStats, getUiPhase} from '../gameAdapter';
import {el} from '../shell';
import {controlsScreen, destroyScreen, draftScreen, escapeHtml, pauseScreen, resultsScreen, rigScreen, routeScreen, shopScreen, titleScreen, type PauseTab} from './templates';
import '../styles/screens.css';

export type ScreenSettings = {
  render(): string;
  bind(root: HTMLElement): void;
  reset?(): void;
  readonly quality: 'high'|'low';
};
export type ScreenContext = {
  game: DepthGame;
  renderer: DepthRenderer;
  input: InputController;
  audio: AudioSystem;
  confirmation: HitConfirmation;
  storage: Storage|null;
  pause: () => void;
  start: (resume?: boolean) => void;
  graphicsLost: () => boolean;
  recovering: () => boolean;
  settings?: ScreenSettings;
};

/** Owns blocking screens and native actions; simulation remains behind public methods. */
export function createScreens(context: ScreenContext) {
  const {game, renderer, input, audio, confirmation, storage, pause, start} = context;
  let settingsOpen = false;
  let creditsOpen = false;
  let screenKey = '';
  let previousStatus = '';
  let selectedRig: RigId = 'breacher';
  let pauseTab: PauseTab = 'resume';
  let legacyQuality: 'high'|'low' = 'high';
  let audioPreferences = loadAudioPreferences(storage);

  // Retain the original audio controls until the persisted settings view is supplied.
  function legacySettings(): string {
    return `<div class="settings"><label>Graphics<select id="quality"><option value="high" ${legacyQuality==='high'?'selected':''}>High</option><option value="low" ${legacyQuality==='low'?'selected':''}>Low</option></select></label><div class="sound-settings"><div class="sound-heading"><label for="master-volume">Master volume</label><output id="volume-value" for="master-volume">${Math.round(audioPreferences.master*100)}%</output></div><div class="sound-controls"><input id="master-volume" type="range" min="0" max="100" step="1" value="${Math.round(audioPreferences.master*100)}" aria-valuetext="${Math.round(audioPreferences.master*100)} percent${audioPreferences.muted?', muted':''}"><button id="sound" class="text-button" aria-label="Mute sound" aria-pressed="${audioPreferences.muted}">${audioPreferences.muted?'Unmute':'Mute'}</button></div></div>${controlsScreen()}<a href="${import.meta.env.BASE_URL}audio-credits.html" target="_blank" rel="noopener">Credits ↗</a></div>`;
  }

  function listen(id: string, callback: () => void): void {
    el(id)?.addEventListener('click', callback);
  }

  function updateSound(): void {
    audio.setMasterVolume(audioPreferences.muted?0:audioPreferences.master);
    saveAudioPreferences(storage,audioPreferences);
    const percent=Math.round(audioPreferences.master*100);
    el('volume-value').textContent=`${percent}%`;
    el('master-volume').setAttribute('aria-valuetext',`${percent} percent${audioPreferences.muted?', muted':''}`);
    el('sound').textContent=audioPreferences.muted?'Unmute':'Mute';
    el('sound').setAttribute('aria-pressed',String(audioPreferences.muted));
  }

  function inspectRig(id: RigId, focusCard = false): void {
    selectedRig = id;
    syncScreen(true);
    if (focusCard) el('overlay').querySelector<HTMLButtonElement>(`[data-rig="${id}"]`)?.focus();
  }

  function setPauseTab(tab: PauseTab, focusTab = false): void {
    pauseTab = tab;
    syncScreen(true);
    if (focusTab) el(`tab-${tab}`).focus();
  }

  function bindActions(root: HTMLElement): void {
    listen('destroy-ship',()=>{
      if(game.authorizeDestruction()) { input.reset(); audio.playUI(); syncScreen(); }
    });
    listen('recover',()=>location.reload());
    listen('start',()=>start());
    listen('continue',()=>start(true));
    listen('settings',()=>{settingsOpen=!settingsOpen; creditsOpen=false; syncScreen(true);});
    listen('credits',()=>{creditsOpen=!creditsOpen; settingsOpen=false; syncScreen(true);});
    listen('close-credits',()=>{creditsOpen=false; syncScreen(true); el('credits')?.focus();});
    listen('resume',pause);
    listen('menu',()=>{
      game.menu(); settingsOpen=false; creditsOpen=false; pauseTab='resume';
      audio.pauseAll(); syncScreen(true);
    });
    listen('reroll',()=>{if(game.reroll()) {audio.playUI(); syncScreen(true);}});
    listen('claim',()=>{game.claimResources(); syncScreen();});
    listen('equip-rig',()=>{if(chooseRig(game,selectedRig)) {audio.playUI(); syncScreen(true);}});
    root.querySelectorAll<HTMLButtonElement>('[data-purchase]').forEach(button=>button.addEventListener('click',()=>{
      game.claimResources(button.dataset.purchase as 'heal'|'armor'|'ammo'); syncScreen();
    }));
    root.querySelectorAll<HTMLButtonElement>('[data-mutation]').forEach(button=>button.addEventListener('click',()=>{
      game.chooseMutation(button.dataset.mutation as MutationId); audio.playUI(); syncScreen();
    }));
    root.querySelectorAll<HTMLButtonElement>('[data-route]').forEach(button=>button.addEventListener('click',()=>{
      game.route(button.dataset.route!); audio.playUI(); syncScreen();
    }));
    root.querySelectorAll<HTMLButtonElement>('[data-rig]').forEach(button=>{
      const id=button.dataset.rig as RigId;
      button.addEventListener('click',()=>inspectRig(id,true));
      button.addEventListener('focus',()=>{if(selectedRig!==id) inspectRig(id,true);});
    });
    root.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(button=>button.addEventListener('click',()=>setPauseTab(button.dataset.tab as PauseTab,true)));
    if (context.settings) context.settings.bind(root);
    else {
      el('quality')?.addEventListener('change',event=>{
        legacyQuality=(event.target as HTMLSelectElement).value==='low'?'low':'high';
        renderer.setQuality(legacyQuality);
      });
      el('master-volume')?.addEventListener('input',event=>{
        audioPreferences={...audioPreferences,master:(event.target as HTMLInputElement).valueAsNumber/100}; updateSound();
      });
      listen('sound',()=>{
        audioPreferences={...audioPreferences,muted:!audioPreferences.muted}; updateSound();
        if(!audioPreferences.muted) void audio.unlock();
      });
    }
  }

  function syncScreen(force = false): void {
    el('room-loading').hidden=game.status!=='playing'||!context.recovering();
    const phase=getUiPhase(game);
    const status=phase==='rig-select'||String(game.status)==='rig-select'?'rig-select':game.status;
    const run=game.expedition.run;
    const blocked=status!=='playing';
    // Snapshot values appear in the key only on their relevant screen, never at combat frequency.
    const key=JSON.stringify([status,phase,game.node.id,settingsOpen,creditsOpen,pauseTab,selectedRig,
      game.checkpointStatus,game.checkpointWarning,game.checkpointNote,context.graphicsLost(),
      blocked?game.storyStatus:null,status==='menu'?game.canContinue:null,
      blocked?game.combat.snapshot.credits:0,blocked?run.draftRoll:0,
      blocked?game.expedition.build.mutations:[],status==='rig-select'||status==='paused'?getAbilities(game)?.rig:null,
      status==='complete'||status==='dead'?getRunStats(game):null]);
    if(!force&&key===screenKey) return;
    screenKey=key;
    if(status!==previousStatus||blocked) confirmation.clear();
    const isMenu=status==='menu';
    document.body.dataset.state=status;
    el('hud').hidden=isMenu||status==='rig-select';
    el('signature').hidden=!isMenu;
    el('shade').classList.toggle('visible',blocked);
    el('overlay').className=isMenu?'menu-overlay':'modal-overlay';
    const root=el('overlay');
    if(!blocked) {root.innerHTML='';audio.resumeAll();previousStatus=status;return;}
    input.reset();
    if(!isMenu) audio.pauseAll();
    const settings = () => context.settings?.render()??legacySettings();
    let html: string;
    if(isMenu) html=titleScreen(game,settingsOpen?settings():'',settingsOpen,creditsOpen);
    else if(status==='rig-select') html=rigScreen(selectedRig);
    else if(status==='paused') html=pauseScreen(game,pauseTab,pauseTab==='settings'?settings():'',context.graphicsLost());
    else if(status==='reward') html=expeditionRewardOffers(game.expedition).length?draftScreen(game):shopScreen(game);
    else if(status==='route') html=game.node.templateId==='manual-control-chamber'?destroyScreen():routeScreen(game);
    else html=resultsScreen(game);
    if(game.checkpointWarning&&status!=='paused') html=html.replace(/<\/(main|section)>$/,`<p class="save-note" role="status">${escapeHtml(game.checkpointWarning)}</p></$1>`);
    const active=document.activeElement as HTMLElement|null;
    const focusId=root.contains(active)?active?.id:'';
    root.innerHTML=html;
    bindActions(root);
    const focusReplacement=focusId?root.querySelector<HTMLElement>(`[id="${focusId}"]`):null;
    if(focusReplacement) focusReplacement.focus({preventScroll:true});
    else if(status!==previousStatus) {
      // A held fire key must never activate a newly arrived choice or restart.
      // Keyboard users can deliberately Tab to a native action or use its number key.
      if(['reward','route','dead','complete'].includes(status)) {
        const panel=root.firstElementChild as HTMLElement|null;
        if(panel) {panel.tabIndex=-1;panel.focus({preventScroll:true});}
      } else {
        root.querySelector<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]')?.focus({preventScroll:true});
      }
    }
    previousStatus=status;
    const current=root.querySelector<HTMLElement>('.deck-node.current');
    const map=root.querySelector<HTMLElement>('.deck-map-scroll');
    if(current&&map) map.scrollLeft=Math.max(0,current.offsetLeft-80);
  }

  function onKeyDown(event: KeyboardEvent): void {
    if(event.defaultPrevented||event.repeat||event.altKey||event.ctrlKey||event.metaKey) return;
    const target=event.target as HTMLElement|null;
    const root=el('overlay');
    if(!root.children.length) return;
    const status=document.body.dataset.state;
    if(event.key==='Tab') {
      const focusable=[...root.querySelectorAll<HTMLElement>('button:not(:disabled):not([tabindex="-1"]), a[href], input:not(:disabled), select:not(:disabled), summary, [tabindex="0"]')];
      const first=focusable[0],last=focusable.at(-1);
      if(event.shiftKey&&(document.activeElement===first||!root.contains(document.activeElement))) {event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&(document.activeElement===last||!root.contains(document.activeElement))) {event.preventDefault();first?.focus();}
      return;
    }
    if(target?.matches('input, select, textarea, [contenteditable="true"]')) return;
    if(target?.getAttribute('role')==='tab'&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
      event.preventDefault();
      const tabs: PauseTab[]=['resume','loadout','settings','controls'];
      const index=event.key==='Home'?0:event.key==='End'?3:(tabs.indexOf(pauseTab)+(event.key==='ArrowRight'?1:3))%4;
      setPauseTab(tabs[index],true); return;
    }
    if(status==='rig-select') {
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) {
        event.preventDefault(); const delta=event.key==='ArrowLeft'||event.key==='ArrowUp'?3:1;
        inspectRig(RIG_IDS[(RIG_IDS.indexOf(selectedRig)+delta)%4],true);
      } else if(/^[1-4]$/.test(event.key)) {
        event.preventDefault(); inspectRig(RIG_IDS[Number(event.key)-1],true);
      } else if(event.key==='Enter'&&!target?.closest('#equip-rig')) {
        event.preventDefault(); el('equip-rig')?.click();
      }
      return;
    }
    if(status==='reward'&&/^[1-3]$/.test(event.key)) {
      const choice=root.querySelectorAll<HTMLButtonElement>('[data-mutation]')[Number(event.key)-1];
      if(choice) {event.preventDefault();choice.click();}
    } else if(status==='reward'&&event.key.toLowerCase()==='r') {
      const reroll=root.querySelector<HTMLButtonElement>('#reroll:not(:disabled)');
      if(reroll) {event.preventDefault();reroll.click();}
    } else if(status==='route'&&/^[1-9]$/.test(event.key)) {
      const route=root.querySelectorAll<HTMLButtonElement>('[data-route]')[Number(event.key)-1];
      if(route) {event.preventDefault();route.click();}
    }
  }
  document.addEventListener('keydown',onKeyDown);
  return {
    syncScreen,
    resetSettings() {settingsOpen=false;creditsOpen=false;pauseTab='resume';context.settings?.reset?.();},
    get quality() {return context.settings?.quality??legacyQuality;},
    dispose() {document.removeEventListener('keydown',onKeyDown);},
  };
}
