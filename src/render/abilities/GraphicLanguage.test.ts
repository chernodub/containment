import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { authoredVariation, createArmorSection, createFractureMass, createMarineEcho, impactBeat, GRAPHIC_FLAME_FRAGMENT, GRAPHIC_SOLID_FRAGMENT } from './GraphicLanguage';
import { InstanceBatch } from './InstanceBatch';
describe('V5 authored graphic language', () => {
    it('keeps variation stable, bounded and unequal, with a two-to-three frame hot beat', () => {
        const values = Array.from({ length: 32 }, (_, i) => authoredVariation(i, 4));
        expect(values).toEqual(Array.from({ length: 32 }, (_, i) => authoredVariation(i, 4)));
        expect(new Set(values).size).toBe(32);
        for (const value of values) {
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(1);
        }
        expect(impactBeat(2 / 60)).toBe(1);
        expect(impactBeat(3 / 60)).toBe(1);
        expect(impactBeat(.11)).toBeCloseTo(.5);
        expect(impactBeat(.2)).toBe(0);
    });
    it('authors finite clipped armor and broken-crown masses with exact unit footprint bounds', () => {
        for (const [make, limit] of [[createArmorSection, .5], [createFractureMass, 1]] as const) {
            const g = make();
            g.computeBoundingBox();
            const b = g.boundingBox!;
            expect(b.min.x).toBeGreaterThanOrEqual(-limit);
            expect(b.max.x).toBeLessThanOrEqual(limit);
            expect(b.min.z).toBeGreaterThanOrEqual(-limit);
            expect(b.max.z).toBeLessThanOrEqual(limit);
            const p = g.getAttribute('position');
            for (const value of p.array)
                expect(Number.isFinite(value)).toBe(true);
            const crown = new Set<number>();
            for (let i = 0; i < p.count; i++)
                if (p.getY(i) > .1)
                    crown.add(p.getY(i));
            expect(crown.size).toBeGreaterThan(1);
            g.dispose();
        }
    });
    it('has a split stride and weapon in one echo contour and no rectangular proxy assembly', () => {
        const g = createMarineEcho(), p = g.getAttribute('position');
        expect(p.count).toBeGreaterThan(60);
        g.computeBoundingBox();
        expect(g.boundingBox!.max.x).toBeCloseTo(.5);
        const feet = new Set<number>();
        for (let i = 0; i < p.count; i++)
            if (p.getY(i) < -.4)
                feet.add(p.getX(i));
        expect(feet.size).toBeGreaterThan(3);
        g.dispose();
    });
    it('uses normal-blended banded flames with no ink and solid-only thin edge shading in retained batches', () => {
        const root = new T.Group(), flame = new InstanceBatch(root, 'flame', 4), solid = new InstanceBatch(root, 'solid', 4);
        const fire = flame.mesh.material as T.ShaderMaterial, armor = solid.mesh.material as T.ShaderMaterial;
        expect(fire.blending).toBe(T.NormalBlending);
        expect(fire.forceSinglePass).toBe(true);
        expect(fire.fragmentShader).toContain(GRAPHIC_FLAME_FRAGMENT);
        expect(fire.fragmentShader).not.toContain('inkEdge');
        expect(armor.fragmentShader).toContain(GRAPHIC_SOLID_FRAGMENT);
        expect(armor.side).toBe(T.FrontSide);
        expect(armor.forceSinglePass).toBe(false);
        expect(root.children).toHaveLength(2);
        flame.dispose();
        solid.dispose();
        expect(root.children).toHaveLength(0);
    });
});
