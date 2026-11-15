import {SHIP_STANDARD_PLANS} from './shipArchitectureStandards';
import type {StoryTemplateId} from './storyRooms';
import type {ShipRoomTopology} from './shipArchitecturePlan';
/** Later-act candidates remain dormant until the revised standard passes review. */
export const SHIP_ARCHITECTURE_LAYOUTS:Readonly<Partial<Record<StoryTemplateId,ShipRoomTopology>>>=Object.freeze(
 Object.fromEntries(Object.entries(SHIP_STANDARD_PLANS).map(([id,plan])=>[id,plan.topology]))
);
