import * as T from 'three';
import { PlacementPreview, type PlacementPreviewState } from './PlacementPreview';
import { AbilityPriorityMask, bindPriorityMask, type HostilePrioritySource } from './PriorityMask';
import type { AbilitiesSnapshot, AbilityEvent, RigId } from '../../game/abilities/contract';
import type { DepthGame } from '../../DepthGame';
import type { GraphicsOptions } from '../graphicsOptions';
import type { GraphicsTier } from '../FrameBudget';
import { AbilityGeometry } from './AbilityGeometry';
import { createBreacherPresentation } from './breacher';
import { createCryoPresentation } from './cryo';
import { createPyroPresentation } from './pyro';
import { createArcPresentation } from './arc';
import { createSystemPresentation } from './system';
import { ElementKit, type AbilityServices } from './ElementKit';
import type { AbilityFrame, AbilityPresentation, PresentationFactory } from './types';
/** One owner for ability routing, quality, fixed pools and the immutable snapshot clock. */
export class AbilityVisuals extends AbilityGeometry {
    readonly kit = new ElementKit(this.root);
    readonly priorityMask = new AbilityPriorityMask();
    readonly placementPreview = new PlacementPreview(this.root);
    setPlacementPreview(value: PlacementPreviewState | null): void { this.placementPreview.set(value); }
    private readonly priorityActor = (id: number) => this.kit.statusActor(id);
    private prioritySource?: HostilePrioritySource;
    /** Optional world-renderer accessor; old renderers keep snapshot/projectile fallback. */
    setHostilePrioritySource(source: unknown): void { this.prioritySource = source as HostilePrioritySource; }
    private registry = new Map<RigId, AbilityPresentation>();
    private system?: AbilityPresentation;
    private frame: AbilityFrame = { snapshot: undefined, dt: 0, visible: true };
    private dead = false;
    private wasVisible = true;
    constructor(scene: T.Object3D) {
        super(scene);
        // Arc owns elevated energy links; standalone geometry retains its snapshot contract.
        this.ownsLinkPresentation = false;
        this.ownsZonePresentation = true;
        this.shareBoundaries(this.kit.rings);
        this.register('breacher', createBreacherPresentation);
        this.register('cryo', createCryoPresentation);
        this.register('pyro', createPyroPresentation);
        this.register('arc', createArcPresentation);
        this.registerSystem(createSystemPresentation);
        this.root.traverse(node => {
            if (!(node instanceof T.Mesh)) return;
            const m = node.material as T.ShaderMaterial;
            if (!m.isShaderMaterial) return;
            m.stencilFunc = T.NotEqualStencilFunc;
            m.stencilRef = m.stencilFuncMask = 1;
            m.stencilWriteMask = 0;
            this.castMaterials.add(m);
            const g = node.geometry;
            bindPriorityMask(m, this.priorityMask.texture,
                g.getAttribute('abilityPriority') ? 'abilityPriority' : g.getAttribute('ribbonPriority') ? 'ribbonPriority' : undefined, false, true);
        });
    }
    /** Renderer integration: await this before first-room warmup. */
    prepare(): Promise<void> { return this.kit.prepare(); }
    /** Borrow an opaque-depth copy; caller owns its target and unbinds before disposal. */
    setSoftDepth(texture: T.Texture | null, near = .1, far = 100, perspective = true): void {
        this.kit.batches.flame.setSoftDepth(texture, near, far, perspective);
        this.kit.batches.smoke.setSoftDepth(texture, near, far, perspective);
    }
    register(rig: RigId, factory: PresentationFactory): void { this.registry.get(rig)?.dispose(); this.registry.set(rig, factory(this.kit)); }
    registerSystem(factory: PresentationFactory): void { this.system?.dispose(); this.system = factory(this.kit); }
    bind(services: AbilityServices): void { this.kit.bind(services); }
    setOptions(options: GraphicsOptions, tier: GraphicsTier, reducedMotion: boolean): void { this.kit.setOptions(options, tier, reducedMotion); super.setOptions(options, tier, reducedMotion); }
    override event(event: AbilityEvent, x: number, y: number): void {
        if (this.dead || !Number.isFinite(x) || !Number.isFinite(y))
            return;
        if (event.phase === 'cast')
            super.event(event, x, y);
        this.kit.contact(event, x, y);
        this.registry.get(event.rig)?.event(event, x, y);
        this.system?.event(event, x, y);
    }
    private readonly castMaterials = new Set<T.Material>();
    private protectionMask = 0;

    override update(snapshot: AbilitiesSnapshot | undefined, dt: number, visible = true, game?: DepthGame, marine?: T.Object3D, camera?: T.Camera, marineBody?: T.Object3D): void {
        if (this.dead)
            return;
        if (visible && game && game.status !== 'menu') void this.prepare();
        if (camera)
            this.kit.setView(camera);
        if (game && (game.status === 'dead' || game.status === 'complete' || game.status === 'menu'))
            visible = false;
        if (!visible && this.wasVisible)
            this.clear();
        this.wasVisible = visible;
        const protect = snapshot?.rig === 'pyro' ? 3 : snapshot?.rig === 'arc' ? 1 : 0;
        if (this.protectionMask !== protect) {
            this.protectionMask = protect;
            for (const material of this.castMaterials) {
                material.stencilWrite = protect !== 0 && !(protect === 1 && material === this.kit.ribbons.mesh.material);
                material.stencilFunc = T.EqualStencilFunc;
                material.stencilRef = 0;
                material.stencilFuncMask = protect;
            }
        }
        dt = visible && Number.isFinite(dt) ? Math.max(0, dt) : 0;

        this.kit.rings.setColdDominance();
        if (visible) for (const zone of snapshot?.zones ?? []) if (zone.ability === 'whiteout' && zone.remainingMs > 0) {
            this.kit.rings.setColdDominance(zone.x / 32, zone.y / 32, zone.radius / 32); break;
        }
        this.kit.begin(dt);
        super.update(visible ? snapshot : undefined, dt, visible);
        const f = this.frame;
        f.snapshot = snapshot;
        f.dt = dt;
        f.visible = visible;
        f.game = game;
        f.marine = marine;
        f.marineBody = marineBody;
        if (visible && snapshot?.rig)
            this.registry.get(snapshot.rig)?.update(f);
        this.system?.update(f);
        this.placementPreview.update(this.kit.time, this.kit.reducedMotion, visible);
        this.kit.end();
    }
    updatePriority(camera: T.Camera): void {
        this.priorityMask.update(this.wasVisible ? this.frame.game : undefined, camera, this.prioritySource, this.priorityActor);
    }
    override clear(): void { super.clear(); this.placementPreview?.clear(); this.priorityMask?.clear(); this.kit?.clear(); if (this.registry)
        for (const p of this.registry.values())
            p.clear(); this.system?.clear(); }
    override dispose(): void { if (this.dead)
        return; this.dead = true; for (const p of this.registry.values())
        p.dispose(); this.system?.dispose(); this.placementPreview.dispose(); this.kit.dispose(); this.priorityMask.dispose(); super.dispose(); }
}
