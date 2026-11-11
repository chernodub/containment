import type { AbilityEvent } from '../../game/abilities/contract';
/** Optional presentation metadata is consumed only when the simulation supplies it. */
export type HudEffect = Readonly<{
    type: string;
    x: number;
    y: number;
    id?: number;
    targetId?: number;
    damage?: number;
    critical?: boolean;
    lethal?: boolean;
    source?: unknown;
    sourceX?: number;
    sourceY?: number;
    contact?: string;
    elements?: readonly string[];
    boon?: string;
    ability?: AbilityEvent;
    family?: string;
    elite?: boolean;
    angle?: number;
    durationMs?: number;
}>;
