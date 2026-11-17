import type {DepthGame} from '../../DepthGame';
import type {DepthRenderer} from '../../render/DepthRenderer';
import type {InputController} from '../../InputController';
import type {AudioSystem} from '../../game/audio/AudioSystem';
import {loadAudioPreferences, saveAudioPreferences} from '../../game/audio/preferences';
import {expeditionRewardOffers} from '../../game/roguelike/expedition';
import type {MutationId} from '../../game/roguelike/types';
import {RIG_CATALOG, RIG_IDS} from '../../game/abilities/catalog';
import {loadCheckpoint} from '../../game/roguelike/checkpoints';
import {generateRun, runLength} from '../../game/roguelike/run';
import type {RigId} from '../../game/abilities/contract';
import type {HitConfirmation} from '../hud/HitConfirmation';
import {chooseRig, getAbilities, getRunStats, getUiPhase, hasAudioDirector, playUiCue} from '../gameAdapter';
import {el} from '../shell';
import {controlsScreen,escapeHtml,titleScreen,systemScreen} from './initialTemplates';
import type {PauseTab} from './templates';
import '../styles/screens.css';
import {EFFECT_SET_LESSON, EFFECT_SET_LESSON_KEY, needsEffectSetLesson} from '../boonPresentation';
import {clearRoomRecord} from '../storyPresentation';
import {revealTitleLayers} from './title/keyArt';
import {preloadRigPortraits} from './rigPortraits';
import {installBoonInspection} from './boonInspection';

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
  const warmPortraits = () => preloadRigPortraits();
  el('overlay').addEventListener('pointerover', warmPortraits, {once:true});
  el('overlay').addEventListener('focusin', warmPortraits, {once:true});
  const portraitWarmup = window.setTimeout(warmPortraits, 1200);
  const disposeBoonInspection = installBoonInspection(el('overlay'));
  let secondary:typeof import('./templates')|undefined;
  let secondaryLoad:Promise<void>|undefined;
  let difficultyOpen = false;
  let pendingDifficulty = '';
  const modes = ['story','standard','veteran'] as const;
  let selectedDifficulty: typeof modes[number] = 'standard';
  try { const saved = storage?.getItem('containment.difficulty.v1'); if (modes.includes(saved as typeof modes[number])) selectedDifficulty = saved as typeof modes[number]; } catch {}
  const difficultyCards = () => `<section class="panel difficulty-panel"><span class="eyebrow">BEFORE YOU WAKE</span><h2>Choose your difficulty.</h2><p>Ability rules are the same in every mode.</p><div class="difficulty-cards">${modes.map((mode,index)=>`<button id="difficulty-${mode}" data-difficulty="${mode}" aria-pressed="${selectedDifficulty===mode}"><b>${['Story','Standard','Veteran'][index]}</b><span>${['More breathing room, healing and fewer threats.','The original expedition. Every choice counts.','Fiercer attacks and scarce breathing room.'][index]}</span></button>`).join('')}</div><button id="difficulty-begin" class="primary">Begin expedition</button><button id="difficulty-back" class="quiet">Back</button></section>`;
  let settingsOpen = false;
  let creditsOpen = false;
  let controlsOpen = false;
  let recoveryPending = false;
  let recoveryFocus = '';
  let recoveryStatus = '';
  let selectedRoute = '';
  let routeNode = '';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let screenKey = '';
  let previousStatus = '';
  let dismissedRecord = '';
  let lessonSeen = false;
  let selectedRig: RigId = 'breacher';
  let pauseTab: PauseTab = 'resume';
  let legacyQuality: 'high'|'low' = 'high';
  let audioPreferences = loadAudioPreferences(storage);

  // Retain the original audio controls until the persisted settings view is supplied.
  function legacySettings(): string {
    return `<div class="settings"><label>Graphics<select id="quality"><option value="high" ${legacyQuality==='high'?'selected':''}>High</option><option value="low" ${legacyQuality==='low'?'selected':''}>Low</option></select></label><div class="sound-settings"><div class="sound-heading"><label for="master-volume">Master volume</label><output id="volume-value" for="master-volume">${Math.round(audioPreferences.master*100)}%</output></div><div class="sound-controls"><input id="master-volume" type="range" min="0" max="100" step="1" value="${Math.round(audioPreferences.master*100)}" aria-valuetext="${Math.round(audioPreferences.master*100)} percent${audioPreferences.muted?', muted':''}"><button id="sound" class="text-button" aria-label="Mute sound" aria-pressed="${audioPreferences.muted}">${audioPreferences.muted?'Unmute':'Mute'}</button></div></div>${controlsScreen()}<a href="${import.meta.env.BASE_URL}audio-credits.html" target="_blank" rel="noopener">Credits ↗</a></div>`;
  }

  function listen(id: string, callback: () => void): void {
    el('overlay').querySelector<HTMLElement>(`[id="${id}"]`)?.addEventListener('click', () => {
      if ((context.graphicsLost() || recoveryPending) && !['recover','graphics-continue'].includes(id)) return;
      callback();
    });
  }

  function closeDrawer(): void {
    const focus=settingsOpen?'settings':controlsOpen?'controls':'menu-credits';
    settingsOpen=false;controlsOpen=false;creditsOpen=false;
    playUiCue(audio,'back');syncScreen(true);el('overlay').querySelector<HTMLElement>(`[id="${focus}"]`)?.focus();
  }

  function continueGraphics(): void {
    if (context.graphicsLost() || context.recovering()) return;
    recoveryPending=false;syncScreen(true);
    // Combat always returns to pause; only the player's Resume releases it.
    const restored=recoveryFocus?el('overlay').querySelector<HTMLElement>(`[id="${recoveryFocus}"]`):null;
    if(restored)restored.focus();else {const panel=el('overlay').firstElementChild as HTMLElement|null;if(panel){panel.tabIndex=-1;panel.focus();}}
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
    playUiCue(audio,'rig-equip');
    syncScreen(true);
    if (focusCard) el('overlay').querySelector<HTMLButtonElement>(`[data-rig="${id}"]`)?.focus();
  }

  function setPauseTab(tab: PauseTab, focusTab = false): void {
    pauseTab = tab;
    playUiCue(audio,'tab');
    syncScreen(true);
    if (focusTab) el(`tab-${tab}`).focus();
  }

  function positionBuildTooltip(card: HTMLElement): void {
    const box=card.getBoundingClientRect(), width=Math.min(240,innerWidth-24);
    const left=box.left+box.width/2-width/2;
    const shift=Math.max(12-left,Math.min(0,innerWidth-12-left-width));
    card.style.setProperty('--tooltip-shift',`${shift}px`);
  }

  function bindActions(root: HTMLElement): void {
    listen('destroy-ship',()=>{
      if(game.authorizeDestruction()) { input.reset(); playUiCue(audio,'confirm'); syncScreen(); }
    });
    listen('recover',()=>location.reload());
    listen('start',()=>{difficultyOpen=true;syncScreen(true);el(`difficulty-${selectedDifficulty}`)?.focus();});
    listen('difficulty-back',()=>{difficultyOpen=false;syncScreen(true);el('start')?.focus();});
    listen('difficulty-begin',()=>{game.setDifficulty(selectedDifficulty);difficultyOpen=false;playUiCue(audio,'confirm');start();});
    root.querySelectorAll<HTMLButtonElement>('[data-difficulty]').forEach(button=>button.addEventListener('click',()=>{selectedDifficulty=button.dataset.difficulty as typeof modes[number];try{storage?.setItem('containment.difficulty.v1',selectedDifficulty);}catch{}syncScreen(true);}));
    root.querySelectorAll<HTMLButtonElement>('[data-easier]').forEach(button=>button.addEventListener('click',()=>{pendingDifficulty=button.dataset.easier!;syncScreen(true);el('difficulty-confirm')?.focus();}));
    listen('difficulty-cancel',()=>{pendingDifficulty='';syncScreen(true);});
    listen('difficulty-confirm',()=>{game.setDifficulty(pendingDifficulty as typeof modes[number]);pendingDifficulty='';syncScreen(true);});
    listen('continue',()=>{playUiCue(audio,'confirm');start(true);});
    listen('settings',()=>{settingsOpen=!settingsOpen; creditsOpen=false; controlsOpen=false; playUiCue(audio,'tab'); syncScreen(true);if(settingsOpen)el('close-drawer')?.focus();});
    listen('menu-credits',()=>{creditsOpen=!creditsOpen; settingsOpen=false; controlsOpen=false; playUiCue(audio,'tab'); syncScreen(true);if(creditsOpen)el('close-drawer')?.focus();});
    listen('controls',()=>{controlsOpen=!controlsOpen;settingsOpen=false;creditsOpen=false;playUiCue(audio,'tab');syncScreen(true);if(controlsOpen)el('close-drawer')?.focus();});
    listen('close-drawer',closeDrawer);
    listen('graphics-continue',continueGraphics);
    listen('close-credits',()=>{creditsOpen=false; playUiCue(audio,'back'); syncScreen(true); el('overlay').querySelector<HTMLElement>('button#menu-credits')?.focus();});
    listen('resume',pause);
    listen('dismiss-effect-set',()=>{lessonSeen=true;try {storage?.setItem(EFFECT_SET_LESSON_KEY,'seen');}catch {/* Session fallback. */}syncScreen(true);root.querySelector<HTMLElement>('[data-mutation]')?.focus();});
    listen('skip-clear-record',()=>{dismissedRecord=`${game.expedition.run.seed}:${game.roomRevision}`;syncScreen(true);root.querySelector<HTMLElement>('[data-mutation],#claim,#destroy-ship,[data-route]')?.focus();});
    listen('menu',()=>{
      game.menu(); pendingDifficulty=''; difficultyOpen=false; settingsOpen=false; creditsOpen=false; controlsOpen=false; pauseTab='resume';
      if(hasAudioDirector(audio as object)) {audio.setEnvironment(null);audio.resumeAll();audio.pauseMusic();}
      playUiCue(audio,'back');
      if(!hasAudioDirector(audio as object)) audio.pauseAll(); syncScreen(true);
    });
    listen('reroll',()=>{if(game.reroll()) {playUiCue(audio,'reroll'); syncScreen(true);} else playUiCue(audio,'denied');});
    listen('claim',()=>{game.claimResources();playUiCue(audio,'purchase'); syncScreen();});
    listen('equip-rig',()=>{if(chooseRig(game,selectedRig)) {playUiCue(audio,'rig-equip'); syncScreen(true);} else playUiCue(audio,'denied');});
    root.querySelectorAll<HTMLButtonElement>('[data-purchase]').forEach(button=>button.addEventListener('click',()=>{
      game.claimResources(button.dataset.purchase as 'heal'|'armor'|'ammo');playUiCue(audio,'purchase'); syncScreen();
    }));
    root.querySelectorAll<HTMLButtonElement>('[data-mutation]').forEach(button=>button.addEventListener('click',()=>{
      // Presentation completes independently of the immediate native choice transition.
      const art=button.querySelector<HTMLElement>('.reward-art');
      if(art&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
        const rect=art.getBoundingClientRect(), echo=art.cloneNode(true) as HTMLElement;
        echo.className='reward-acquired';
        Object.assign(echo.style,{left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`,color:getComputedStyle(button).getPropertyValue('--boon-color')});
        echo.style.setProperty('--boon-color',getComputedStyle(button).getPropertyValue('--boon-color'));
        document.body.append(echo);
        echo.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'translateY(-24px) scale(.94)'}],{duration:280,easing:'ease-out'}).finished.finally(()=>echo.remove());
      }
      game.chooseMutation(button.dataset.mutation as MutationId); playUiCue(audio,'boon-acquired'); syncScreen();
    }));
    root.querySelectorAll<HTMLButtonElement>('[data-route]').forEach(button=>button.addEventListener('click',()=>{
      game.route(button.dataset.route!); playUiCue(audio,'confirm'); syncScreen();
    }));
    root.querySelectorAll<HTMLButtonElement>('[data-inspect-route]').forEach(button=>button.addEventListener('click',()=>{
      selectedRoute=button.dataset.inspectRoute!;playUiCue(audio,'select');syncScreen(true);
    }));
    root.querySelectorAll<HTMLButtonElement>('[data-rig]').forEach(button=>{
      const id=button.dataset.rig as RigId;
      button.addEventListener('click',()=>inspectRig(id,true));
      // Real mouse movement previews a rig without taking keyboard focus.
      button.addEventListener('pointermove',()=>{if(selectedRig!==id) inspectRig(id);});
      button.addEventListener('focus',()=>{if(selectedRig!==id) inspectRig(id,true);});
    });
    root.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(button=>button.addEventListener('click',()=>setPauseTab(button.dataset.tab as PauseTab,true)));
    root.querySelectorAll<HTMLElement>('.owned-boon').forEach(card=>{
      card.addEventListener('focus',()=>positionBuildTooltip(card));
      card.addEventListener('pointerenter',()=>positionBuildTooltip(card));
    });
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
    if (context.graphicsLost() && !recoveryPending) {
      recoveryPending=true;recoveryStatus=status;
      recoveryFocus=(document.activeElement as HTMLElement|null)?.id??'';
      input.reset();
    }
    // Restoration never dismisses this gate or changes the current choice.
    const graphicsBlocked=context.graphicsLost()||recoveryPending;
    const blocked=status!=='playing'||graphicsBlocked;
    if(routeNode!==game.node.id) {routeNode=game.node.id;selectedRoute=game.node.next[0]??'';}
    const saved=status==='menu'&&game.canContinue?loadCheckpoint(storage):null;
    const savedNode=saved?generateRun(saved.run.seed,saved.run.version).nodes.find(node=>node.id===saved.run.currentNodeId):null;
    const continuation=saved&&savedNode?{rig:saved.run.phase==='rig-select'?'Rig selection':saved.build.rig?RIG_CATALOG[saved.build.rig].name:'Marine',sector:savedNode.depth+1,total:runLength(saved.run.version),boons:saved.build.mutations.length,phase:saved.run.phase}:null;
    // Snapshot values appear in the key only on their relevant screen, never at combat frequency.
    const key=JSON.stringify([status,phase,game.node.id,difficultyOpen,pendingDifficulty,selectedDifficulty,game.difficulty,settingsOpen,creditsOpen,controlsOpen,pauseTab,selectedRig,selectedRoute,continuation,
      game.checkpointStatus,game.checkpointWarning,game.checkpointNote,context.graphicsLost(),recoveryPending,graphicsBlocked?context.recovering():false,
      blocked?game.storyStatus:null,status==='menu'?game.canContinue:null,
      blocked?game.combat.snapshot.credits:0,status==='reward'?game.combat.snapshot:null,blocked?run.draftRoll:0,
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
    el('overlay').className=isMenu&&!graphicsBlocked&&!difficultyOpen?'menu-overlay':'modal-overlay';
    const root=el('overlay');
    for (const id of ['hud','world','signature']) {
      const background=el(id);
      if (!background) continue;
      background.inert=blocked;
      if(blocked) background.setAttribute('aria-hidden','true');else background.removeAttribute('aria-hidden');
    }
    root.setAttribute('role',blocked?'dialog':'presentation');
    if(blocked) root.setAttribute('aria-modal','true');else root.removeAttribute('aria-modal');
    root.setAttribute('aria-label',graphicsBlocked?'Graphics recovery':difficultyOpen?'Difficulty selection':isMenu?'Main menu':`${status} expedition screen`);
    if(!blocked) {root.innerHTML='';if(!hasAudioDirector(audio as object)) audio.resumeAll();previousStatus=status;return;}
    input.reset();
    if(!isMenu&&!hasAudioDirector(audio as object)) audio.pauseAll();
    const settings = () => context.settings?.render()??legacySettings();
    if(!isMenu&&!graphicsBlocked&&!secondary) {
      root.innerHTML=systemScreen('Preparing interface','Loading expedition controls…');
      secondaryLoad??=import('./templates').then(module=>{secondary=module;syncScreen(true);}).catch(()=>{
        root.innerHTML=systemScreen('Interface interrupted','Reload to restore your last checkpoint.',{id:'recover',label:'Reload game'});bindActions(root);
      });
      return;
    }
    let html: string;
    if(graphicsBlocked) {
      const restoring=context.graphicsLost()||context.recovering();
      html=`<section class="panel recovery-panel" aria-labelledby="recovery-title"><h2 id="recovery-title">${restoring?'Restoring graphics…':'Graphics restored.'}</h2><p role="status">${restoring?'Your expedition is on hold. Wait for graphics to return, or reload your last checkpoint.':'Your expedition is still on hold. Continue when you are ready.'}</p><button id="graphics-continue" class="primary" ${restoring?'disabled':''}>${recoveryStatus==='paused'||recoveryStatus==='playing'?'Return to pause':'Continue'}</button><button id="recover" class="secondary">Reload game</button></section>`;
    }
    else if(difficultyOpen) html=difficultyCards();
    else if(isMenu) html=titleScreen(game,settingsOpen?settings():'',settingsOpen,creditsOpen,controlsOpen,continuation);
    else if(status==='rig-select') html=secondary!.rigScreen(selectedRig);
    else if(status==='paused') html=secondary!.pauseScreen(game,pauseTab,pauseTab==='settings'?settings():'',context.graphicsLost());
    else if(status==='reward') html=expeditionRewardOffers(game.expedition).length?secondary!.draftScreen(game):secondary!.shopScreen(game);
    else if(status==='route') html=game.node.templateId==='manual-control-chamber'?secondary!.destroyScreen():secondary!.routeScreen(game,selectedRoute);
    else html=secondary!.resultsScreen(game);
    if (status === 'paused' && !graphicsBlocked) {
      const index=modes.indexOf(game.difficulty);
      const controls=`<aside class="pause-difficulty"><b>Difficulty: ${game.difficulty}</b>${pendingDifficulty?`<p>Change to ${pendingDifficulty==='story'?'Story':'Standard'}? You cannot raise difficulty during this expedition.</p><button id="difficulty-confirm" class="secondary">Confirm easier mode</button><button id="difficulty-cancel" class="secondary">Cancel</button>`:modes.slice(0,index).map(mode=>`<button class="secondary" data-easier="${mode}">Change to ${mode==='story'?'Story':'Standard'}</button>`).join('')}</aside>`;
      html=html.replace('<footer class="pause-footer">',controls+'<footer class="pause-footer">');
    }
    if (status === 'reward' && !lessonSeen && needsEffectSetLesson(expeditionRewardOffers(game.expedition),storage)) {
      html = html.replace('<div class="choice-grid">', `<aside class="effect-set-lesson" role="note"><p>${EFFECT_SET_LESSON}</p><button id="dismiss-effect-set" class="quiet">Got it</button></aside><div class="choice-grid">`);
    }
    if (dismissedRecord !== `${run.seed}:${game.roomRevision}` && !graphicsBlocked) {
      const record = clearRoomRecord(game);
      if (record) html = html.replace(/(<section[^>]*>)/, '$1' + record);
    }
    if(game.checkpointWarning&&status!=='paused') html=html.replace(/<\/(main|section)>$/,`<p class="save-note" role="status">${escapeHtml(game.checkpointWarning)}</p></$1>`);
    const active=document.activeElement as HTMLElement|null;
    const focusId=root.contains(active)?active?.id:'';
    const resultExpanded=status===previousStatus&&!!root.querySelector<HTMLDetailsElement>('.result-details')?.open;
    root.innerHTML=html;
    revealTitleLayers(root);
    if(resultExpanded) root.querySelector<HTMLDetailsElement>('.result-details')?.setAttribute('open','');
    bindActions(root);
    const focusReplacement=focusId?root.querySelector<HTMLElement>(`[id="${focusId}"]`):null;
    if(focusReplacement) focusReplacement.focus({preventScroll:true});
    else if(status!==previousStatus||graphicsBlocked) {
      // A held fire key must never activate a newly arrived choice or restart.
      // Keyboard users can deliberately Tab to a native action or use its number key.
      if(['reward','route','dead','complete'].includes(status)) {
        const panel=root.firstElementChild as HTMLElement|null;
        if(panel) {panel.tabIndex=-1;panel.focus({preventScroll:true});}
      } else {
        root.querySelector<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]')?.focus({preventScroll:true});
      }
    }
    if(status!==previousStatus&&status==='reward') playUiCue(audio,'draft-reveal');
    previousStatus=status;
  }

  function onKeyDown(event: KeyboardEvent): void {
    if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey) return;
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
    // Repeated Tab must remain contained; only action shortcuts reject repeats.
    if(event.repeat) return;
    if(context.graphicsLost()||recoveryPending) {
      if(event.key==='Escape') {event.preventDefault();el('recover')?.focus();}
      return;
    }
    if(event.key==='Escape') {
      if(difficultyOpen) {event.preventDefault();difficultyOpen=false;syncScreen(true);el('start')?.focus();}
      else if(status==='menu'&&(settingsOpen||creditsOpen||controlsOpen)) {event.preventDefault();closeDrawer();}
      else if(status==='paused') {event.preventDefault();pause();}
      // Mandatory draft/route decisions stay pending. Escape returns focus to
      // the screen heading instead of committing or destroying run progress.
      else if(status!=='menu') {event.preventDefault();const panel=root.firstElementChild as HTMLElement|null;if(panel){panel.tabIndex=-1;panel.focus();}}
      return;
    }
    if(target?.matches('input, select, textarea, [contenteditable="true"]')) return;
    // Match gameplay's physical letter/digit bindings across keyboard layouts.
    const shortcut=event.code ? /^Digit[1-9]$/.test(event.code) ? event.code.slice(-1) : event.code==='KeyR' ? 'r' : '' : event.key.toLowerCase();
    if(target?.getAttribute('role')==='tab'&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
      event.preventDefault();
      const tabs: PauseTab[]=['resume','loadout','settings','controls'];
      const index=event.key==='Home'?0:event.key==='End'?3:(tabs.indexOf(pauseTab)+(event.key==='ArrowRight'?1:3))%4;
      setPauseTab(tabs[index],true); return;
    }
    if(status==='rig-select') {
      if(target?.closest('.ability-preview')&&['ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(event.key)) return;
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) {
        event.preventDefault(); const delta=event.key==='ArrowLeft'||event.key==='ArrowUp'?3:1;
        inspectRig(RIG_IDS[(RIG_IDS.indexOf(selectedRig)+delta)%4],true);
      } else if(/^[1-4]$/.test(shortcut)) {
        event.preventDefault(); inspectRig(RIG_IDS[Number(shortcut)-1],true);
      } else if(event.key==='Enter'&&!target?.closest('#equip-rig')) {
        event.preventDefault(); el('equip-rig')?.click();
      }
      return;
    }
    if(status==='reward'&&/^[1-3]$/.test(shortcut)) {
      const choice=root.querySelectorAll<HTMLButtonElement>('[data-mutation]')[Number(shortcut)-1];
      if(choice) {event.preventDefault();choice.click();}
    } else if(status==='reward'&&shortcut==='r') {
      const reroll=root.querySelector<HTMLButtonElement>('#reroll:not(:disabled)');
      if(reroll) {event.preventDefault();reroll.click();}
    } else if(status==='route'&&root.querySelector('[data-route]')) {
      if(/^[1-9]$/.test(shortcut)) {
        const id=game.node.next[Number(shortcut)-1];
        if(id) {event.preventDefault();game.route(id);playUiCue(audio,'confirm');syncScreen();}
      } else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) {
        event.preventDefault();
        const index=game.node.next.indexOf(selectedRoute),delta=event.key==='ArrowLeft'||event.key==='ArrowUp'?-1:1;
        selectedRoute=game.node.next[(index+delta+game.node.next.length)%game.node.next.length];
        playUiCue(audio,'select');syncScreen(true);
        root.querySelector<HTMLButtonElement>(`.deck-node[data-inspect-route="${selectedRoute}"]`)?.focus();
      } else if(event.key==='Enter'&&target?.closest('[data-inspect-route]')) {
        event.preventDefault();root.querySelector<HTMLButtonElement>('[data-route]')?.click();
      }

    }
  }
  const onPointerMove=(event:PointerEvent)=>{
    if(document.body.dataset.state!=='menu'||motion.matches||settingsOpen||creditsOpen||controlsOpen) return;
    const title=el('overlay').querySelector<HTMLElement>('.title-screen');
    title?.style.setProperty('--parallax-x',`${(event.clientX/innerWidth-.5)*10}px`);
    title?.style.setProperty('--parallax-y',`${(event.clientY/innerHeight-.5)*7}px`);
  };
  const onResize=()=>{const active=document.activeElement;if(active instanceof HTMLElement&&active.matches('.owned-boon')) positionBuildTooltip(active);};
  const onAction=(event:Event)=>{
    if((context.graphicsLost()||recoveryPending)&&!(event.target as HTMLElement).closest('#recover,#graphics-continue')) {event.preventDefault();event.stopImmediatePropagation();}
  };
  el('overlay').addEventListener('click',onAction,true);
  const onStorage=()=>{if(game.status==='menu')syncScreen(true);};
  window.addEventListener('storage',onStorage);
  window.addEventListener('resize',onResize);
  document.addEventListener('keydown',onKeyDown);
  document.addEventListener('pointermove',onPointerMove);
  return {
    syncScreen,
    continueFailed() {
      const notice=el('application-notice');
      if(notice) {notice.hidden=false;notice.className='ui-toast';notice.textContent='Checkpoint unavailable. It may have changed in another tab. Start a new expedition.';}
      syncScreen(true);el('start')?.focus();
    },
    get graphicsBlocked() {return context.graphicsLost()||recoveryPending;},
    resetSettings() {const notice=el('application-notice');if(notice)notice.hidden=true;settingsOpen=false;creditsOpen=false;controlsOpen=false;pauseTab='resume';context.settings?.reset?.();},
    get quality() {return context.settings?.quality??legacyQuality;},
    dispose() {window.clearTimeout(portraitWarmup);el('overlay').removeEventListener('pointerover',warmPortraits);el('overlay').removeEventListener('focusin',warmPortraits);disposeBoonInspection();window.removeEventListener('storage',onStorage);el('overlay').removeEventListener('click',onAction,true);window.removeEventListener('resize',onResize);document.removeEventListener('keydown',onKeyDown);document.removeEventListener('pointermove',onPointerMove);},
  };
}
