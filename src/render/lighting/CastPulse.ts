import { Color, Vector4 } from 'three';
import type { AbilityEvent } from '../../game/abilities/contract';

export const castField = { value: new Vector4() };
export const castColor = { value: new Color() };
const colors = { pyro: 0xff7028, cryo: 0x57dfff, arc: 0xbe8dff, breacher: 0xffbd52 };
const ranges = { 'cryo-nova': 210, whiteout: 300, meltdown: 130, 'seismic-slam': 230,
    flashfire: 300, overload: 240, railbreaker: 280 };

export function startCastPulse(event: AbilityEvent, x: number, y: number) {
    if (!(event.ability in ranges)) return;
    const core = event.ability === 'meltdown' && event.phase === 'burst' && (event.radius ?? 0) > 130;
    if (event.phase !== 'impact' && !core) return;
    const radius = event.radius ?? ranges[event.ability as keyof typeof ranges];
    castField.value.set(x / 32, y / 32, radius / 32, 1);
    castColor.value.setHex(colors[event.rig]);
}

export function advanceCastPulse(dt: number) {
    castField.value.w = Math.max(0, castField.value.w - dt / .18);
}
