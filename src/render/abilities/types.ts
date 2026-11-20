import type * as T from 'three';
import type { DepthGame } from '../../DepthGame';
import type { AbilitiesSnapshot, AbilityEvent, AbilityElement } from '../../game/abilities/contract';
import type { ElementKit } from './ElementKit';
export const UNIT = 32;
export const ELEMENT_COLORS: Readonly<Record<AbilityElement, number>> = Object.freeze({
    kinetic: 0xffd063, cryo: 0x7fd6ff, pyro: 0xff7a2e, arc: 0xb79cff,
});
/** Contact joints on the five enemy skeleton families, shared by electrical and frost attachments. */
export function isContactJoint(node: T.Object3D): boolean {
    return node.type === 'Bone' &&
        /forearm|shin|_lower|calf|arm_mid|leg_(front|back)_mid|hand1?[lr]$|leg_(front|middle|back)001[lr]$/i.test(node.name.replaceAll('.', ''));
}
/** Read-only presentation inputs; no component calls simulation actions. */
export interface AbilityFrame {
    snapshot: AbilitiesSnapshot | undefined;
    game?: DepthGame;
    marine?: T.Object3D;
    marineBody?: T.Object3D;
    dt: number;
    visible: boolean;
}
/** Rig modules own no simulation, timers outside the presentation clock, or global resources. */
export interface AbilityPresentation {
    event(event: AbilityEvent, x: number, y: number): void;
    update(frame: AbilityFrame): void;
    clear(): void;
    dispose(): void;
}
export type PresentationFactory = (kit: ElementKit) => AbilityPresentation;
