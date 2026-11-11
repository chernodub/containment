import { app, el, mountShell } from './shell';
import { createHud } from './hud/Hud';
import { createScreens } from './screens/ScreenManager';
import { systemScreen } from './screens/templates';
import { createSettings } from './settings';
import {getUiPreferences} from './gameAdapter';
import { loadAudioPreferences } from '../game/audio/preferences';
import { FramePacer, FrameDiagnostics } from '../render/FrameBudget';
import { HitConfirmation } from './hud/HitConfirmation';
import { captureWeaponPointer } from '../WeaponHud';
import { positionHudPanels } from '../HudLayout';
import { DepthGame, type GameEffect } from '../DepthGame';
import { preloadAssets } from '../render/assets';
import { DepthRenderer } from '../render/DepthRenderer';
import { InputController } from '../InputController';
import { AudioSystem } from '../game/audio/AudioSystem';
import type { WeaponId } from '../game/combat/types';
import { WEAPONS } from '../game/combat/catalog';
/** Initialize assets, game, input and graphics recovery. */
export async function bootstrap() {
    mountShell();
    const fail = (title: string, message: string) => {
        app.innerHTML = `<div class="system-layer">${systemScreen(title, message, {id: 'system-retry', label: 'Try again'})}</div>`;
        el('system-retry').addEventListener('click', () => location.reload());
    };
    function positionHud() { positionHudPanels(renderer.playerScreenBounds(game.player.radius), innerWidth, innerHeight); }
    el('overlay').innerHTML = '<div class="asset-loading"><span>CONTAINMENT / DEPTH</span><h2>Establishing connection</h2><p>Synchronizing ship systems</p><div role="progressbar" aria-label="Loading assets" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="asset-track"><i id="asset-progress"></i></div><small>AWAITING MARINE WAKE PROTOCOL</small></div>';
    try {
        await preloadAssets(fraction => {
            el('asset-progress').style.width = `${fraction * 100}%`;
            el('asset-track').setAttribute('aria-valuenow', String(Math.round(fraction * 100)));
        });
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
        renderer = new DepthRenderer(el('world') as HTMLCanvasElement);
        renderer.setQuality('high');
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
    const audio = new AudioSystem({ master: audioPreferences.muted ? 0 : audioPreferences.master, music: .38, effects: .8 });
    void AudioSystem.preload();
    const settings = createSettings({renderer, audio, storage});
    settings.apply();
    const weaponSounds = {
        pistol: () => audio.playPistol(), rifle: () => audio.playRifle(),
        shotgun: () => audio.playShotgun(), plasma: () => audio.playPlasma(),
        rocket: () => audio.playRocket(),
    };
    const effect = (e: GameEffect) => {
        uiEffect(e);
        if (e.type === 'sync-corpse') {
            renderer.syncCorpse(e.id!, e.x, e.y);
            return;
        }
        renderer.effect(e);
        if (e.contact) {
            audio.playConfirmedHit(e.contact !== 'damage');
            confirmation.confirm(e.contact, Boolean((e as GameEffect & {lethal?: boolean}).lethal));
        }
        if (e.type === 'shot') weaponSounds[e.weapon ?? 'pistol']();
        else if (e.type === 'corpse' || e.type === 'wall-slam') audio.playBodyImpact();
        else if (e.type === 'explosion') audio.playExplosion();
        else if (e.type === 'pickup') audio.playPickup();
        else if (e.type === 'boon' && e.boon === 'shatter') audio.playElemental('shatter');
        else if (e.type === 'boon' && e.boon === 'overload') audio.playElemental('reactor');
        else if (e.type === 'hurt') {
            const flash = el('hurt-flash');
            flash.getAnimations().forEach(animation => animation.cancel());
            if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
                flash.animate([{opacity: .35 * settings.effectiveGraphicsOptions.flashIntensity}, {opacity: 0}], {duration: 220});
        }
    };
    const game = new DepthGame(effect, storage);
    const pause = () => {
        if (game.status === 'playing') {
            game.pause(); input.reset(); audio.pauseAll();
        } else if (game.status === 'paused' && !document.hidden && !graphicsLost) {
            game.resume(); audio.resumeAll();
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
        pause(); }, () => !graphicsLost && !roomRecovering && lastRoom === game.roomRevision && !renderer.roomLoading);
    let roomRecovering = true;
    let graphicsLost = false;
    let lastStatus = '', lastRoom = -1;
    const start = (resume = false) => {
        void audio.unlock(); audio.resumeAll(); input.reset(); screens.resetSettings();
        if (resume) {
            if (!game.continueRun()) return;
        } else game.newRun();
        syncScreen(true);
    };
    captureWeaponPointer(el('pause') as HTMLButtonElement);
    captureWeaponPointer(el('skip-story') as HTMLButtonElement);
    el('pause').addEventListener('click', pause);
    document.querySelectorAll<HTMLButtonElement>('[data-weapon]').forEach(b => { captureWeaponPointer(b); b.addEventListener('click', () => { if (!roomRecovering && lastRoom === game.roomRevision && !renderer.roomLoading && !graphicsLost)
        game.switchWeapon(b.dataset.weapon as WeaponId); b.blur(); }); });
    el('skip-story').addEventListener('click', () => { game.skipStory(); hud(); });
    // END HUD INPUT
    const hud = createHud(game, renderer, positionHud, () => getUiPreferences(game, settings.preferences)) as ReturnType<typeof createHud> & {
        effect?: (event: GameEffect) => void;
        tick?: (dt: number) => void;
        dispose?: () => void;
    };
    uiEffect = e => hud.effect?.(e);
    const reticle = {spreadRadians: 0, bloomRadians: 0, reloadProgress: 0, reloading: false, playing: false};
    function syncHud(): void {
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
    function syncScreen(force = false) { screens.syncScreen(force); }
    renderer.canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); graphicsLost = true; game.pause(); input.reset(); audio.pauseAll(); syncScreen(true); });
    renderer.canvas.addEventListener('webglcontextrestored', () => { graphicsLost = false; settings.apply(); syncScreen(true); });
    window.addEventListener('resize', () => renderer.resize());
    let hudTime = 0, hudLastMs = 0, hudTotalMs = 0, hudSamples = 0;
    let presentationFrozen = false;
    const advancePresentation = (dt: number) => {
        hud.tick?.(dt);
        confirmation.update(dt, game.status === 'playing' && !graphicsLost && !renderer.roomLoading && !roomRecovering);
    };
    const pacer = new FramePacer(), diagnostics = new FrameDiagnostics();
    document.addEventListener('visibilitychange', () => pacer.reset());
    Object.defineProperty(window, '__containmentPerformance', { get: () => ({
        ...diagnostics.snapshot, quality: renderer.qualityTier,
        drawCalls: renderer.renderer.info.render.calls,
        triangles: renderer.renderer.info.render.triangles,
        geometries: renderer.renderer.info.memory.geometries,
        textures: renderer.renderer.info.memory.textures, graphicsLost,
        hudMs: {last: hudLastMs, average: hudSamples ? hudTotalMs / hudSamples : 0, samples: hudSamples},
    }) });
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
            renderer.loadRoom(game.node);
            lastRoom = game.roomRevision;
            roomRecovering = true;
        }
        const blocked = graphicsLost || renderer.roomLoading;
        const recovering = roomRecovering;
        if (blocked || recovering)
            input.reset();
        else
            game.update(dt * 1000, input.read());
        if (game.status === 'playing' && !blocked && !recovering)
            audio.syncFrozen(game.enemies.snapshot.enemies.filter(e => e.health > 0 && game.boonStatuses(e.id).frozen).map(e => e.id), game.roomRevision);
        const updated = performance.now();
        if (!blocked) {
            renderer.render(game, recovering ? 0 : dt, game.status === 'menu');
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
        if (lastStatus !== game.status) {
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
            audio.syncCombat(game.combat.snapshot);
            audio.setMusicIntensity(Math.min(1, game.enemies.activeCount / 12 + (game.boss.snapshot.active ? .3 : 0)));
        }
        diagnostics.record(elapsed * 1000, updated - started, rendered - updated);
    }
    lastRoom = game.roomRevision;
    syncScreen(true);
    requestAnimationFrame(frame);
    // Explicit opt-in only: fixed-step visual review of the real production game.
    if (new URLSearchParams(location.search).get('debug') === '1') {
        const { installDebug } = await import('../../scripts/nextgen/debug');
        presentationFrozen = true;
        installDebug(game, renderer, () => { syncScreen(); syncHud(); }, () => { lastRoom = game.roomRevision; roomRecovering = true; }, event => uiEffect(event as GameEffect), advancePresentation);
    }
}
