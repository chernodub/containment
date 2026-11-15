import {ARMORY_SOLIDS} from '../world/armoryCarouselLayout';
import {defineShipRoom,point as p,polygon as poly,rectangles,partition as wall,spaceBox as space,opening as gate,breachFeature as feature,type ShipPlan,type ShipRoomTopology} from './shipArchitecturePlan';

// Equipment is fixed to the ship's structure: magazine spine, loading banks,
// repaired docking trunk and uplink apse. The large fighting floors stay quiet.
const armory=defineShipRoom({
 boundary:poly([[0,240],[80,240],[80,0],[1120,0],[1120,240],[1200,240],[1200,640],[1120,640],[1120,880],[80,880],[80,640],[0,640]]),
 voids:[...ARMORY_SOLIDS,wall(480,0,240,200)],obstacles:[],
 spawn:p(100,440),exit:p(1100,440),breaches:poly([[140,100],[1060,100],[140,780],[1060,780]]),
});
const freight=defineShipRoom({
 boundary:poly([[0,240],[180,240],[180,80],[1000,80],[1000,0],[1200,0],[1200,480],[1120,480],[1120,640],[1200,640],[1200,880],[180,880],[180,640],[0,640]]),
 obstacles:rectangles([[400,80,320,160],[320,816,300,64],[1080,240,120,240],[660,432,260,108]]),
 // Two sides of the loading booth, with a 160-unit west door and 156-unit
 // south door. The rear stock begins 152 units beyond its southern cheek.
 voids:[poly([[240,480],[420,480],[420,664],[396,664],[396,504],[240,504]])],
 spawn:p(100,440),exit:p(1090,720),breaches:poly([[260,160],[1100,120],[100,560],[1060,760]]),
});
const loading=defineShipRoom({height:960,
 boundary:poly([[40,240],[180,240],[180,80],[760,80],[760,40],[980,40],[980,160],[1160,160],[1160,700],[1040,700],[1040,920],[280,920],[280,800],[40,800]]),
 // The established diagonal scar stays exact. A real repair trunk joins its
 // north shoulder to the hull, so the tear is a ship wound, not a floating prop.
 voids:[poly([[440,300],[610,220],[940,460],[820,570],[560,470]]),wall(560,80,100,220)],
 obstacles:rectangles([[280,840,140,80],[700,840,200,80]]),
 spawn:p(140,440),exit:p(1080,520),breaches:poly([[220,260],[1040,240],[160,680],[980,800]]),
});
const transmission=defineShipRoom({
 boundary:poly([[0,240],[200,240],[200,40],[480,40],[480,0],[720,0],[720,40],[1200,40],[1200,800],[1040,800],[1040,880],[200,880],[200,640],[0,640]]),
 obstacles:rectangles([[480,0,240,180],[200,720,180,160],[1040,640,160,160]]),
 // Unequal chancel screens leave a broad native holding approach at the east end.
 voids:[wall(420,320,160,24),wall(760,336,112,24)],
 spawn:p(600,440),exit:p(1100,440),breaches:poly([[280,160],[1080,160],[100,560],[940,780]]),
});
export const SHIP_ACT2_PLANS:Readonly<Record<string,ShipPlan>>=Object.freeze({
 armory:{topology:armory,arena:p(600,700),
  spaces:[space('Port magazine',0,0,480,700,180,380),space('Issue court',80,700,1040,180,600,740),space('Starboard fitting bay',720,0,480,700,1020,380)],
  openings:[gate('Port magazine','Issue court',80,700,220,700),gate('Port magazine','Issue court',220,700,360,700),gate('Issue court','Starboard fitting bay',840,700,980,700),gate('Issue court','Starboard fitting bay',980,700,1120,700)],
  bays:[{space:'Port magazine',from:p(0,240),to:p(0,640)},{space:'Starboard fitting bay',from:p(1200,240),to:p(1200,640)}],
  breachFeatures:[feature('Port magazine vent',80,100),feature('Starboard magazine vent',1120,100),feature('Port issue door',80,780),feature('Starboard issue door',1120,780)]},
 'freight-hold':{topology:freight,arena:p(780,700),
  spaces:[{name:'Port cargo court',outline:poly([[0,0],[660,0],[660,640],[420,640],[420,480],[240,480],[240,640],[0,640]]),anchor:p(220,440)},space('Starboard dispatch court',660,0,540,640,1000,600),space('Tow floor',180,640,1020,240,780,700),space('Loading control booth',240,504,156,160,318,584)],
  openings:[gate('Loading control booth','Port cargo court',240,508,240,664),gate('Loading control booth','Tow floor',240,664,396,664),gate('Port cargo court','Tow floor',440,640,580,640),gate('Starboard dispatch court','Tow floor',680,640,820,640),gate('Starboard dispatch court','Tow floor',820,640,960,640),gate('Port cargo court','Starboard dispatch court',660,260,660,400)],
  bays:[{space:'Port cargo court',from:p(0,240),to:p(0,640)},{space:'Starboard dispatch court',from:p(1120,480),to:p(1120,640)}],
  breachFeatures:[feature('Port loading door',180,160),feature('Dispatch ventilation vent',1200,120),feature('Tow entry door',0,560),feature('South dispatch door',1200,760)]},
 'breached-loading-bay':{topology:loading,arena:p(600,680),
  spaces:[space('Port docking apron',40,240,400,600,220,440),space('Freight turning floor',440,570,480,270,600,680),space('Starboard pressure lock',940,160,220,760,1080,520)],
  openings:[gate('Port docking apron','Freight turning floor',440,560,440,700),gate('Port docking apron','Freight turning floor',440,700,440,840),gate('Freight turning floor','Starboard pressure lock',940,560,940,700),gate('Freight turning floor','Starboard pressure lock',940,700,940,840)],
  bays:[{space:'Port docking apron',from:p(40,240),to:p(40,800)},{space:'Starboard pressure lock',from:p(1160,160),to:p(1160,700)}],
  breachFeatures:[feature('Port dock tear',180,240),feature('Pressure lock door',1160,240),feature('Port stern vent',40,680),feature('Starboard stern door',1040,800)]},
 'transmission-chamber':{topology:transmission,holdout:true,arena:p(700,560),
  spaces:[space('Uplink chancel',200,40,1000,304,840,220),space('Transmission nave',200,344,840,376,700,560),space('Service airlock',0,240,200,400,100,440),space('South service chapel',380,720,660,160,700,800)],
  openings:[gate('Service airlock','Transmission nave',200,344,200,484),gate('Uplink chancel','Transmission nave',580,344,740,344),gate('Uplink chancel','Transmission nave',220,344,360,344),gate('Transmission nave','South service chapel',580,720,820,720)],
  bays:[{space:'Service airlock',from:p(0,240),to:p(0,640)},{space:'South service chapel',from:p(200,880),to:p(1040,880)}],
  breachFeatures:[feature('Uplink port vent',200,160),feature('Uplink starboard door',1200,160),feature('Service airlock door',0,560),feature('South service vent',1040,800)]},
});
export const SHIP_ACT2_LAYOUTS:Readonly<Record<string,ShipRoomTopology>>=Object.freeze(Object.fromEntries(Object.entries(SHIP_ACT2_PLANS).map(([id,plan])=>[id,plan.topology])));
