import { ABILITY_CATALOG } from '../../game/abilities/catalog';
import type { AbilityEvent } from '../../game/abilities/contract';
import type { Telegraph } from '../vfx';
import { ELEMENT_COLORS, UNIT } from './types';
/** Resolve the same catalog dimensions and augmented receipt overrides as the simulation. */
export function bindAbilityShape(out: Telegraph, event: AbilityEvent, x: number, y: number): boolean {
    const definition = ABILITY_CATALOG[event.ability], shape = definition.shape;
    const angle = event.angle ?? 0;
    out.x = x / UNIT;
    out.z = y / UNIT;
    out.angle = angle;
    out.color = ELEMENT_COLORS[event.element];
    out.progress = 0;
    out.opacity = .65;
    out.radius = 0;
    out.length = 0;
    out.width = 0;
    out.arc = undefined;
    if (shape.kind === 'chain' || shape.kind === 'dash')
        return false;
    if (shape.kind === 'circle' || event.phase === 'burst' || (event.radius !== undefined && event.arcRadians === undefined && event.ability === 'flashfire')) {
        out.shape = 'circle';
        out.radius = (event.radius ?? (shape.kind === 'circle' ? shape.radius : 0)) / UNIT;
        if (definition.targeting === 'point' || event.ability === 'flashfire') {
            out.x = (event.targetX ?? x) / UNIT;
            out.z = (event.targetY ?? y) / UNIT;
        }
    }
    else if (shape.kind === 'cone') {
        out.shape = 'cone';
        out.radius = (event.length ?? shape.range) / UNIT;
        out.arc = event.arcRadians ?? shape.arcRadians;
    }
    else if (shape.kind === 'line') {
        out.shape = 'line';
        out.length = (event.length ?? shape.length) / UNIT;
        out.width = (event.width ?? shape.width) / UNIT;
    }
    else if (shape.kind === 'wall') {
        out.shape = 'wall';
        out.length = (event.length ?? shape.length) / UNIT;
        out.width = (event.width ?? shape.thickness) / UNIT;
        out.angle = angle + Math.PI / 2;
        out.x = (event.targetX ?? x) / UNIT - Math.cos(out.angle) * out.length / 2;
        out.z = (event.targetY ?? y) / UNIT - Math.sin(out.angle) * out.length / 2;
    }
    return Number.isFinite(out.x) && Number.isFinite(out.z) && Number.isFinite(out.angle) && Number.isFinite(out.radius)
        && Number.isFinite(out.length) && Number.isFinite(out.width) && (out.arc === undefined || Number.isFinite(out.arc))
        && (out.radius! > 0 || out.length! > 0 && out.width! > 0);
}
