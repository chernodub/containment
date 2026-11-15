import {RELAY_RACKS_FOOTPRINTS} from './relayRacksLayout';
import type {StoryTemplateId} from './storyRooms';
import {polygon as points,rectangles,partition as wall,type ShipRoomTopology as Topology} from './shipArchitecturePlan';
import {SHIP_ACT2_LAYOUTS} from './shipArchitectureAct2';
import {SHIP_ACT3_LAYOUTS} from './shipArchitectureAct3';
import {SHIP_ACT4_LAYOUTS} from './shipArchitectureAct4';

/** Collision and presentation share these plans. All dimensions are game units.
 * Open-ended partitions make subspaces without one-door body-blocking pockets. */
export const SHIP_ARCHITECTURE_LAYOUTS: Readonly<Partial<Record<StoryTemplateId,Topology>>> = Object.freeze({
  ...SHIP_ACT2_LAYOUTS,...SHIP_ACT3_LAYOUTS,...SHIP_ACT4_LAYOUTS,
  'residential-gallery': Object.freeze({
    boundary: points([[0,160],[160,160],[160,0],[1040,0],[1040,160],[1200,160],[1200,720],[1040,720],[1040,880],[160,880],[160,720],[0,720]]),
    // Cabin furnishings are built into the north/south bulkheads. The open
    // gallery and both end cross-aisles remain continuous around each frontage.
    obstacles: rectangles([[320,0,240,220],[320,680,120,200],[700,0,240,220],[760,700,140,180]]),
    voids: Object.freeze([
      // Two exits per cutaway cabin:112-unit gallery doorway and100-unit
      // side service opening. L walls join the actual furniture back.
      wall(320,220,24,28),points([[320,348],[344,348],[344,360],[384,360],[384,384],[320,384]]),
      points([[536,220],[560,220],[560,384],[496,384],[496,360],[536,360]]),
      wall(700,220,24,28),points([[700,348],[724,348],[724,360],[764,360],[764,384],[700,384]]),
      points([[916,220],[940,220],[940,384],[876,384],[876,360],[916,360]]),
      wall(320,580,120,24),wall(760,580,140,24),
    ]),
    spawn: Object.freeze({x:440,y:300}), exit: Object.freeze({x:1100,y:440}),
    breaches: points([[210,100],[1080,260],[210,780],[990,780]]),
  }),
  'crew-checkpoint': Object.freeze({
    boundary: points([[0,100],[360,100],[440,0],[1080,0],[1200,120],[1200,760],[1080,880],[440,880],[360,780],[0,780]]),
    // Primary inspection gate at y440; emergency passages at y130/y750
    // prevent a single body or player barricade from sealing the whole room.
    obstacles: rectangles([[500,220,80,156],[500,504,80,156],[580,220,160,156],[690,540,88,112]]),
    voids: Object.freeze([wall(880,220,160,24),wall(1016,244,24,132),wall(880,504,160,24),wall(1016,528,24,132)]),
    spawn: Object.freeze({x:300,y:440}), exit: Object.freeze({x:1100,y:440}),
    breaches: points([[100,180],[1100,160],[100,700],[1100,720]]),
  }),
  'relay-racks': Object.freeze({
    boundary: points([[0,160],[120,160],[120,0],[1080,0],[1080,160],[1200,160],[1200,720],[1080,720],[1080,880],[120,880],[120,720],[0,720]]),
    // Two cooling aisles, a cross-aisle and open-ended distribution bay.
    obstacles: RELAY_RACKS_FOOTPRINTS,
    voids: Object.freeze([wall(300,0,100,60),wall(800,0,100,60),wall(300,820,100,60),wall(800,820,100,60)]),
    spawn: Object.freeze({x:220,y:440}), exit: Object.freeze({x:1100,y:440}),
    breaches: points([[160,100],[1040,100],[160,780],[1040,780]]),
  }),
});
