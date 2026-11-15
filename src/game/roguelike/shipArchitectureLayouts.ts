import {SHIP_ACT1_PLANS} from './shipArchitectureAct1';
import {SHIP_ACT2_PLANS} from './shipArchitectureAct2';
import {SHIP_ACT3_PLANS} from './shipArchitectureAct3';
import {SHIP_ACT4_PLANS} from './shipArchitectureAct4';
import {SHIP_STANDARD_PLANS} from './shipArchitectureStandards';
import type {StoryTemplateId} from './storyRooms';
import type {ShipRoomTopology} from './shipArchitecturePlan';
/** Activated after the connected three-room standard passed plan and native review. */
export const SHIP_ARCHITECTURE_PLANS=Object.freeze({...SHIP_ACT1_PLANS,...SHIP_STANDARD_PLANS,...SHIP_ACT2_PLANS,...SHIP_ACT3_PLANS,...SHIP_ACT4_PLANS});
export const SHIP_ARCHITECTURE_LAYOUTS:Readonly<Partial<Record<StoryTemplateId,ShipRoomTopology>>>=Object.freeze(
 Object.fromEntries(Object.entries(SHIP_ARCHITECTURE_PLANS).map(([id,plan])=>[id,plan.topology]))
);
