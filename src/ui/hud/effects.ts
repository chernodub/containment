import type {GameEffect} from '../../DepthGame';
import type { AbilityEvent } from '../../game/abilities/contract';
/** Optional presentation metadata is consumed only when the simulation supplies it. */
export type HudEffect = Readonly<{
    reserveCut?: GameEffect['reserveCut'];
    shutterBroken?: true;
    selfBlast?: {distance:number;radius:number};
  type: string;
    encounterCue?: 'flank' | 'crossfire' | 'priority' | 'escort-broken' | 'pincer-broken';
    cueX?: number;
    cueY?: number;
    x: number;
    y: number;
    id?: number;
    targetId?: number;
    damage?: number;
    /** Optional authoritative (or unambiguous adapter-resolved) element. */
    damageElement?: string;
    element?: string;
    critical?: boolean;
    lethal?: boolean;
    source?: unknown;
    sourceX?: number;
    sourceY?: number;
    contact?: string;
    rocketUnarmed?: true;
    elements?: readonly string[];
    boon?: string;
    ability?: AbilityEvent;
    family?: string;
    elite?: boolean;
    angle?: number;
    durationMs?: number;
}>;
