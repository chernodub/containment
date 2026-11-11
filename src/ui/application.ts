import { app, el, mountShell } from './shell';
import { createHud } from './hud/Hud';
import { createScreens } from './screens/ScreenManager';
import { systemScreen } from './screens/initialTemplates';
import { createSettings } from './settings';
import {getUiPreferences, getAbilities, hasAudioDirector, forwardAudioEffect, playUiCue, playPresentationCue, syncAudioDirector, cameraEffect} from './gameAdapter';
import {GameFeel} from './feel';
import {configureIntegratedRenderer, presentationCameraBeat} from './integrationPresentation';
import {PresentationBeats} from './hud/beats/PresentationBeats';
import { loadAudioPreferences } from '../game/audio/preferences';
import { FramePacer, FrameDiagnostics } from '../render/FrameBudget';
import {NativeFrameSamples} from './performance';
import { HitConfirmation } from './hud/HitConfirmation';
import { captureWeaponPointer } from '../WeaponHud';
import { positionHudPanels } from '../HudLayout';
import { DepthGame, type GameEffect, type GameInput } from '../DepthGame';
import { preloadAssets } from '../render/assets';
import type { DepthRenderer } from '../render/DepthRenderer';
import { InputController } from '../InputController';
import type { AudioSystem } from '../game/audio/AudioSystem';
import {warmDeathPhysics} from './loading/DeferredRagdolls';
import type { WeaponId } from '../game/combat/types';
import { WEAPONS } from '../game/combat/catalog';
/** Passive diagnostics keep the normal RAF pipeline only with both explicit query opt-ins. */
export function debugLiveObservation(search: string): boolean {
    const query = new URLSearchParams(search);
    return query.get('debug') === '1' && query.get('playtest-live') === '1';
}
/** Seeded native UI starts are opt-in diagnostic runs; normal play keeps its sequence. */
export function debugRunSeed(search: string): number | undefined {
    const query = new URLSearchParams(search), raw = query.get('seed');
    if (query.get('debug') !== '1' || raw === null || !/^\d+$/.test(raw)) return undefined;
    const seed = Number(raw);
    return Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff ? seed : undefined;
}
/** Initialize assets, game, input and graphics recovery. */
export async function bootstrap() {
    mountShell();
    const fail = (title: string, message: string) => {
        app.innerHTML = `<div class="system-layer">${systemScreen(title, message, {id: 'system-retry', label: 'Try again'})}</div>`;
        el('system-retry').addEventListener('click', () => location.reload());
    };
    function positionHud() { positionHudPanels(renderer.playerScreenBounds(game.player.radius), innerWidth, innerHeight); }
    el('overlay').innerHTML = '<div class="asset-loading"><span>CONTAINMENT / DEPTH</span><h2>Establishing connection</h2><p>Synchronizing ship systems</p><div role="progressbar" aria-label="Loading assets" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="asset-track"><i id="asset-progress"></i></div><small>AWAITING MARINE WAKE PROTOCOL</small></div>';
    const rendererCode=import('../render/DepthRenderer');
    const audioCode=import('../game/audio/AudioSystem');
    try {
        await preloadAssets(fraction => {
            el('asset-progress').style.width = `${fraction * 100}%`;
            el('asset-track').setAttribute('aria-valuenow', String(Math.round(fraction * 100)));
        }, async()=>{});
        await Promise.all([
            document.fonts.load('400 16px Barlow'),
            document.fonts.load('600 16px Barlow'),
            document.fonts.load('600 32px "Barlow Condensed"'),
        ]);
        await document.fonts.ready;
    }
    catch (error) {
        fail('Download interrupted', 'Ship assets could not be loaded. Check your connection, then try again.');
        throw error;
    }
    let renderer: DepthRenderer;
    try {
        const {DepthRenderer}=await rendererCode;
        renderer = new DepthRenderer(el('world') as HTMLCanvasElement);
        renderer.setQuality('high');
        configureIntegratedRenderer(renderer);
    }
    catch {
        fail('3D graphics unavailable', 'Open this game in a browser with WebGL 2 enabled.');
        throw new Error('WebGL renderer unavailable');
    }
    let storage: Storage | null = null;
    try {
        storage = localStorage;
    }
    catch { }
    const marker = document.createElement('div');
    marker.id = 'hit-confirmation';
    marker.hidden = true;
    marker.setAttribute('aria-hidden', 'true');
    app.append(marker);
    const confirmation = new HitConfirmation(marker);
    for (const event of ['pointermove', 'pointerdown'] as const)
        renderer.canvas.addEventListener(event, e => { if (e.pointerType === 'mouse')
            confirmation.point(e.clientX, e.clientY); });
    let uiEffect: (event: GameEffect) => void = () => { };
    let audioPreferences = loadAudioPreferences(storage);
    const {AudioSystem}=await audioCode;
    const audio = new AudioSystem({ master: audioPreferences.muted ? 0 : audioPreferences.master, music: .38, effects: .8 });
    void AudioSystem.preload();
    const settings = createSettings({renderer, audio, storage});
    settings.apply();
    const feel = new GameFeel();
    let beats: PresentationBeats | null = null;
    let presentationEnabled = new URLSearchParams(location.search).get('debug') !== '1' || debugLiveObservation(location.search);
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const timingContext = {dashing: false, critical: false, remaining: 0};
    const feelContext = () => {
        timingContext.dashing = getAbilities(game)?.dashing ?? false;
        timingContext.critical = game.combat.snapshot.health <= 25;
        timingContext.remaining = game.encounterRemaining;
        return timingContext;
    };
    const effect = (e: GameEffect) => {
        uiEffect(e);
        if (e.type === 'sync-corpse') {
            renderer.syncCorpse(e.id!, e.x, e.y);
            return;
        }
        renderer.effect(e);
        forwardAudioEffect(audio, e, game.player);
        if (presentationEnabled) {
            const before = feel.snapshot;
            feel.setEnabled(!motion.matches);
            feel.effect(e, feelContext());
            presentationCameraBeat(renderer, before, feel.snapshot, settings.effectiveGraphicsOptions.screenShake, motion.matches);
            cameraEffect(renderer, e, motion.matches ? 0 : settings.effectiveGraphicsOptions.screenShake);
            beats?.effect(e);
        }
        if (e.contact) {
            confirmation.confirm(e.contact, Boolean((e as GameEffect & {lethal?: boolean}).lethal));
        }
        if (e.type === 'hurt') {
            const flash = el('hurt-flash');
            flash.getAnimations().forEach(animation => animation.cancel());
            if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
                flash.animate([{opacity: .35 * settings.effectiveGraphicsOptions.flashIntensity}, {opacity: 0}], {duration: 220});
        }
    };
    const game = new DepthGame(effect, storage);
    beats = new PresentationBeats(game, app, cue => playPresentationCue(audio, cue));
    beats.setEnabled(presentationEnabled);
    const pause = () => {
        if (game.status === 'playing') {
            // One synchronous cue is admitted before the transport stops every voice.
            playUiCue(audio, 'back');
            game.pause(); input.reset(); audio.pauseAll();
        } else if (game.status === 'paused' && !document.hidden && !graphicsLost && !screens.graphicsBlocked) {
            game.resume(); audio.resumeAll();
            playUiCue(audio, 'confirm');
        }
        syncScreen();
    };
    game.aimVisible = (x, y) => renderer.visible(x, y);
    try {
        await renderer.prepare(game.node);
    }
    catch (error) {
        fail('Graphics interrupted', 'The room could not be prepared. Your last checkpoint remains available.');
        throw error;
    }
    const input = new InputController(game, renderer, (toggle) => { if (game.status === 'playing' || toggle && game.status === 'paused')
        pause(); }, () => !graphicsLost && !screens.graphicsBlocked && !roomRecovering && lastRoom === game.roomRevision && !renderer.roomLoading);
    let roomRecovering = true;
    let graphicsLost = false;
    let lastStatus = '', lastRoom = -1;
    const start = (resume = false) => {
        if(graphicsLost||screens.graphicsBlocked)return;
        void audio.unlock(); audio.resumeAll(); input.reset(); screens.resetSettings();
        if (resume) {
            if (!game.continueRun()) {screens.continueFailed();syncHud();return;}
        } else game.newRun(debugRunSeed(location.search), {rigSelect: true});
        feel.reset(); beats?.reset();
        syncScreen(true);
        syncHud();
    };
    captureWeaponPointer(el('pause') as HTMLButtonElement);
    captureWeaponPointer(el('skip-story') as HTMLButtonElement);
    el('pause').addEventListener('click', pause);
    document.querySelectorAll<HTMLButtonElement>('[data-weapon]').forEach(b => { captureWeaponPointer(b); b.addEventListener('click', () => { if (!roomRecovering && lastRoom === game.roomRevision && !renderer.roomLoading && !graphicsLost)
        game.switchWeapon(b.dataset.weapon as WeaponId); b.blur(); }); });
    el('skip-story').addEventListener('click', () => { game.skipStory(); hud(); });
    // END HUD INPUT
    const hud = createHud(game, renderer, positionHud, () => getUiPreferences(game, settings.preferences), storage) as ReturnType<typeof createHud> & {
        effect?: (event: GameEffect) => void;
        tick?: (dt: number) => void;
        dispose?: () => void;
    };
    uiEffect = e => hud.effect?.(e);
    const reticle = {spreadRadians: 0, bloomRadians: 0, reloadProgress: 0, reloading: false, playing: false};
    function syncHud(): void {
        syncAudio();
        hud();
        const combat = game.combat.snapshot;
        reticle.spreadRadians = WEAPONS[combat.weaponId].spreadRadians;
        reticle.bloomRadians = combat.bloomRadians;
        reticle.reloadProgress = combat.reloading ? 1 - combat.reloadRemainingMs / Math.max(1, combat.reloadDurationMs) : 0;
        reticle.reloading = combat.reloading;
        reticle.playing = game.status === 'playing' && !graphicsLost && !roomRecovering && !renderer.roomLoading;
        confirmation.snapshot(reticle);
    }
    const screens = createScreens({ game, renderer, input, audio, confirmation, storage, pause, start, settings, graphicsLost: () => graphicsLost, recovering: () => roomRecovering || lastRoom !== game.roomRevision || renderer.roomLoading });
    function syncAudio(): void {
        const loading = roomRecovering || lastRoom !== game.roomRevision || renderer.roomLoading;
        syncAudioDirector(audio, game, {paused: game.status === 'paused' || graphicsLost || document.hidden || loading, loading});
        // Reload/switch/death transitions have no separate UI sound path.
        audio.syncCombat(game.combat.snapshot);
    }
    function syncScreen(force = false) { syncAudio(); if (graphicsLost || screens.graphicsBlocked || !beats?.blocking) screens.syncScreen(force); }
    renderer.canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); graphicsLost = true; game.pause(); input.reset(); audio.pauseAll(); syncScreen(true); });
    renderer.canvas.addEventListener('webglcontextrestored', () => { graphicsLost = false; settings.apply(); syncScreen(true); });
    window.addEventListener('resize', () => renderer.resize());
    let hudTime = 0, hudLastMs = 0, hudTotalMs = 0, hudSamples = 0;
    let presentationFrozen = false;
    let optionalPresentationStarted=false;
    const advancePresentation = (dt: number) => {
        beats?.tick(dt);
        beats?.position(renderer.playerScreenBounds(game.player.radius));
        hud.tick?.(dt);
        confirmation.update(dt, game.status === 'playing' && !graphicsLost && !renderer.roomLoading && !roomRecovering);
    };
    const pacer = new FramePacer(), diagnostics = new FrameDiagnostics(), nativeFrameSamples = new NativeFrameSamples();
    document.addEventListener('visibilitychange', () => {pacer.reset(); syncAudio();});
    Object.defineProperty(window, '__containmentPerformance', { get: () => ({
        ...diagnostics.snapshot, quality: renderer.qualityTier,
        drawCalls: renderer.renderer.info.render.calls,
        triangles: renderer.renderer.info.render.triangles,
        geometries: renderer.renderer.info.memory.geometries,
        textures: renderer.renderer.info.memory.textures, graphicsLost,
        debugFixedStep: (window as Window & {__containmentDebug?: {stepPerformance?: unknown}}).__containmentDebug?.stepPerformance,
        nativeUpdateRenderMs: nativeFrameSamples.snapshot,
        hudMs: {last: hudLastMs, average: hudSamples ? hudTotalMs / hudSamples : 0, samples: hudSamples},
    }) });
    let controlsForStep: GameInput = {x: 0, y: 0, fire: false, angle: null, autoAim: false};
    const stepSimulation = (ms: number) => game.update(ms, controlsForStep);
    function frame(now: number) {
        requestAnimationFrame(frame);
        if (document.hidden)
            return;
        const elapsed = pacer.sample(now);
        if (elapsed === null)
            return;
        const dt = Math.min(.05, elapsed), started = performance.now();
        // Synchronize before input/update: a boon, restart or route can change rooms between RAFs.
        if (lastRoom !== game.roomRevision) {
            feel.reset();
            renderer.loadRoom(game.node);
            lastRoom = game.roomRevision;
            roomRecovering = true;
        }
        const blocked = graphicsLost || renderer.roomLoading;
        const graphicsHeld = screens.graphicsBlocked;
        const recovering = roomRecovering;
        syncAudioDirector(audio, game, {paused: game.status === 'paused' || blocked || recovering, loading: blocked || recovering});
        if (blocked || recovering || graphicsHeld)
            input.reset();
        else if (presentationFrozen) game.update(dt * 1000, input.read());
        else {
            feel.setEnabled(presentationEnabled && !motion.matches);
            controlsForStep = input.read();
            feel.advance(dt * 1000, feelContext(), stepSimulation);
        }
        if(screens.graphicsBlocked) syncScreen();
        beats?.sync();
        if (!hasAudioDirector(audio as object) && game.status === 'playing' && !blocked && !recovering)
            audio.syncFrozen(game.enemies.snapshot.enemies.filter(e => e.health > 0 && game.boonStatuses(e.id).frozen).map(e => e.id), game.roomRevision);
        const updated = performance.now();
        if (!blocked) {
            renderer.render(game, recovering ? 0 : dt * feel.renderScale, game.status === 'menu');
            if(!optionalPresentationStarted) {optionalPresentationStarted=true;setTimeout(()=>{void warmDeathPhysics();},0);}
            if (game.status === 'playing')
                positionHud();
            roomRecovering = false;
            if (recovering)
                pacer.reset();
        }
        else
            roomRecovering = true;
        // Project pooled UI from the camera's current rendered pose, including follow-camera moves.
        advancePresentation(blocked || recovering || presentationFrozen ? 0 : dt);
        el('room-loading').hidden = !blocked || game.status !== 'playing';
        el('world').setAttribute('aria-busy', String(blocked));
        const rendered = performance.now();
        if (lastStatus !== game.status && !beats?.blocking) {
            lastStatus = game.status;
            syncScreen();
        }
        hudTime += dt;
        if (hudTime > .08) {
            hudTime = 0;
            const hudStarted = performance.now();
            syncHud();
            hudLastMs = performance.now() - hudStarted;
            hudTotalMs += hudLastMs;
            hudSamples++;
        }
        diagnostics.record(elapsed * 1000, updated - started, rendered - updated);
        nativeFrameSamples.record(rendered - started);
    }
    lastRoom = game.roomRevision;
    syncScreen(true);
    requestAnimationFrame(frame);
    // Explicit opt-in only: fixed-step visual review of the real production game.
    if (new URLSearchParams(location.search).get('debug') === '1') {
        const { installDebug } = await import('../../scripts/nextgen/debug');
        const liveObservation = debugLiveObservation(location.search);
        presentationFrozen = !liveObservation;
        installDebug(game, renderer, () => { beats?.sync(); syncScreen(); syncHud(); }, () => { lastRoom = game.roomRevision; roomRecovering = true; }, event => uiEffect(event as GameEffect), advancePresentation, {
            setEnabled(enabled) {presentationEnabled = enabled; feel.setEnabled(enabled && !matchMedia('(prefers-reduced-motion: reduce)').matches); beats?.setEnabled(enabled);},
            reset() {feel.reset(); beats?.reset();},
            effect(event) {if (event.type === 'beat') beats?.show(event.kind as import('./hud/beats/PresentationBeats').BeatKind); else {feel.effect(event as GameEffect, feelContext()); beats?.effect(event as GameEffect); uiEffect(event as GameEffect);}},
            step(ms, controls, update) {feel.advance(ms, feelContext(), dt => update(dt, controls)); beats?.sync();},
        }, () => input.read(), () => !graphicsLost && !roomRecovering && lastRoom === game.roomRevision && !renderer.roomLoading, liveObservation);
    }
}
