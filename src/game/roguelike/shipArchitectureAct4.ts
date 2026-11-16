import type {StoryTemplateId} from './storyRooms';
import {defineShipRoom,point as p,polygon as poly,rectangles,partition,spaceBox as space,opening as gate,breachFeature as feature,type ShipPlan,type ShipRoomTopology} from './shipArchitecturePlan';

/** Act4: a growth-distorted junction, paired shielding locks, a live-passenger
 * annulus, the authorization booth, and the final core floor. Hull machinery
 * encloses service spaces; both directions around sealed mechanisms stay open. */
const swarm=defineShipRoom({width:1200,height:1040,
 boundary:poly([[0,320],[160,320],[160,0],[1040,0],[1040,320],[1200,320],[1200,720],[1040,720],[1040,1040],[160,1040],[160,720],[0,720]]),
 // Attached former ventilation galleries now carry growth along their seams.
 obstacles:[],voids:[poly([[160,0],[440,0],[440,150],[410,180],[160,180]]),poly([[760,0],[1040,0],[1040,180],[790,180],[760,150]]),poly([[160,860],[410,860],[440,890],[440,1040],[160,1040]]),poly([[790,860],[1040,860],[1040,1040],[760,1040],[760,890]])],
 spawn:p(100,520),exit:p(1100,520),breaches:poly([[280,260],[920,260],[280,780],[920,780]]),
});
const shielding=defineShipRoom({width:1408,height:960,
 boundary:poly([[0,280],[200,280],[200,80],[560,80],[560,0],[848,0],[848,80],[1208,80],[1208,280],[1408,280],[1408,680],[1208,680],[1208,880],[848,880],[848,960],[560,960],[560,880],[200,880],[200,680],[0,680]]),
 // Source assemblies0/1/2 retain shield / power cabinet / shield ownership.
 obstacles:rectangles([[360,80,200,260],[560,0,288,160],[908,620,140,260]]),voids:[partition(200,80,160,260),partition(1048,620,160,260)],
 spawn:p(100,480),exit:p(1308,480),breaches:poly([[260,420],[1140,180],[260,780],[1140,540]]),
});
const annulus=defineShipRoom({width:1440,height:1040,
 boundary:poly([[0,320],[160,320],[160,0],[1280,0],[1280,320],[1440,320],[1440,720],[1280,720],[1280,1040],[160,1040],[160,720],[0,720]]),
 // Original octagonal sealed core translated(+200,+80), never rescaled. The
 // north/south hull housings are real shielding/service bays, not extra cores.
 voids:[poly([[620,320],[980,320],[1040,380],[1040,660],[980,720],[620,720],[560,660],[560,380]])],
 obstacles:rectangles([[160,0,1120,140],[160,900,1120,140]]),
 spawn:p(80,520),exit:p(1360,520),breaches:poly([[260,240],[1180,240],[260,800],[1180,800]]),
});
const manual=defineShipRoom({width:1280,height:1040,
 boundary:poly([[0,360],[160,360],[160,0],[1120,0],[1120,360],[1280,360],[1280,680],[1120,680],[1120,1040],[160,1040],[160,680],[0,680]]),
 // Paired hardwired cabinets define the booth; the cost/status desk terminates
 // the southern gallery. Its broad booth threshold has two independent lanes.
 obstacles:rectangles([[160,0,260,280],[860,0,260,280],[510,920,260,120],[568,298,144,44]]),voids:[],
 spawn:p(100,520),exit:p(1180,520),breaches:poly([[340,360],[940,360],[260,840],[1020,840]]),
});
const overload=defineShipRoom({width:1280,height:1040,
 boundary:poly([[40,320],[180,200],[360,200],[360,0],[920,0],[920,200],[1100,200],[1240,320],[1240,760],[1080,900],[880,900],[880,1040],[400,1040],[400,900],[200,900],[40,760]]),
 // Original six-sided core translated(+100,+80). Shielded reaction feed and
 // exhaust chambers attach to the outer hull; the broad western floor holds.
 voids:[poly([[570,380],[830,380],[890,480],[830,640],[570,640],[510,480]])],
 obstacles:rectangles([[360,0,560,200],[400,900,480,140]]),
 spawn:p(200,520),exit:p(1140,520),breaches:poly([[240,300],[1040,300],[240,800],[1040,800]]),
});
export const SHIP_ACT4_PLANS:Readonly<Record<string,ShipPlan>>=Object.freeze({
 'swarm-junction':{topology:swarm,arena:p(600,520),bays:[{space:'Port approach',from:p(0,320),to:p(0,720)},{space:'Hull exit',from:p(1200,320),to:p(1200,720)}],
  spaces:[space('Port approach',0,320,320,400,100,520),space('Growth crossing',320,320,560,400,600,520),space('Hull exit',880,320,320,400,1100,520),space('North airway',160,180,880,140,600,250),space('South airway',160,720,880,140,600,790)],
  openings:[gate('Port approach','Growth crossing',320,320,320,480),gate('Port approach','Growth crossing',320,560,320,720),gate('Growth crossing','Hull exit',880,320,880,480),gate('Growth crossing','Hull exit',880,560,880,720),gate('North airway','Growth crossing',440,320,760,320),gate('South airway','Growth crossing',440,720,760,720),gate('North airway','Port approach',160,320,320,320),gate('North airway','Hull exit',880,320,1040,320),gate('South airway','Port approach',160,720,320,720),gate('South airway','Hull exit',880,720,1040,720)],
  breachFeatures:[feature('Port north growth tear',280,180),feature('Starboard north vent',920,180),feature('Port south vent',280,860),feature('Starboard south growth tear',920,860)]},
 'shielding-gate':{topology:shielding,arena:p(704,480),bays:[{space:'Entry lock',from:p(0,280),to:p(0,680)},{space:'Exit lock',from:p(1408,280),to:p(1408,680)}],
  spaces:[space('Entry lock',0,340,500,280,100,480),space('Scanner floor',500,340,548,280,704,480),space('Exit lock',1048,280,360,400,1308,480),space('Inspection gallery',500,160,708,180,824,240),space('Sterilization bypass',200,620,708,260,580,740)],
  openings:[gate('Entry lock','Scanner floor',500,340,500,480),gate('Entry lock','Scanner floor',500,480,500,620),gate('Scanner floor','Exit lock',1048,340,1048,480),gate('Scanner floor','Exit lock',1048,480,1048,620),gate('Inspection gallery','Scanner floor',560,340,880,340),gate('Inspection gallery','Exit lock',1048,280,1208,280),gate('Sterilization bypass','Scanner floor',500,620,820,620),gate('Sterilization bypass','Entry lock',200,620,500,620)],
  breachFeatures:[feature('Inspection intake vent',260,340),feature('Inspection exhaust door',1208,180),feature('Sterilization intake door',200,780),feature('Sterilization exhaust vent',1140,620)]},
 'containment-annulus':{topology:annulus,arena:p(350,520),bays:[{space:'Entry airlock',from:p(0,320),to:p(0,720)},{space:'Exit airlock',from:p(1440,320),to:p(1440,720)}],
  spaces:[space('Entry airlock',0,320,160,400,80,520),space('West encounter floor',160,320,400,400,350,520),space('North inspection ring',160,140,1120,180,800,230),space('East status ring',1040,320,240,400,1160,520),space('South service ring',160,720,1120,180,800,810),space('Exit airlock',1280,320,160,400,1360,520)],
  openings:[gate('Entry airlock','West encounter floor',160,320,160,480),gate('Entry airlock','West encounter floor',160,560,160,720),gate('West encounter floor','North inspection ring',160,320,560,320),gate('West encounter floor','South service ring',160,720,560,720),gate('North inspection ring','East status ring',1040,320,1280,320),gate('South service ring','East status ring',1040,720,1280,720),gate('East status ring','Exit airlock',1280,320,1280,480),gate('East status ring','Exit airlock',1280,560,1280,720)],
  breachFeatures:[feature('North port shielding vent',260,140),feature('North starboard shielding vent',1180,140),feature('South port shielding vent',260,900),feature('South starboard shielding vent',1180,900)]},
 'manual-control-chamber':{topology:manual,arena:p(640,550),bays:[{space:'Entry vestibule',from:p(0,360),to:p(0,680)},{space:'Core threshold',from:p(1280,360),to:p(1280,680)}],
  spaces:[space('Entry vestibule',0,360,240,320,100,520),space('Authorization booth',420,0,440,340,640,180),space('Core floor',240,340,800,400,640,550),space('Core threshold',1040,360,240,320,1180,520),space('Fatal cost gallery',160,740,960,180,640,830)],
  openings:[gate('Entry vestibule','Core floor',240,360,240,500),gate('Entry vestibule','Core floor',240,540,240,680),gate('Core floor','Core threshold',1040,360,1040,500),gate('Core floor','Core threshold',1040,540,1040,680),gate('Authorization booth','Core floor',420,340,580,340),gate('Authorization booth','Core floor',700,340,860,340),gate('Core floor','Fatal cost gallery',240,740,560,740),gate('Core floor','Fatal cost gallery',720,740,1040,740)],
  breachFeatures:[feature('Port booth service vent',340,280),feature('Starboard booth service vent',940,280),feature('Port gallery hull tear',160,840),feature('Starboard gallery hull tear',1120,840)]},
 'overload-floor':{topology:overload,arena:p(335,520),holdout:true,bays:[{space:'Port holdout floor',from:p(40,320),to:p(40,760)},{space:'Starboard gantry',from:p(1240,320),to:p(1240,760)}],
  spaces:[space('Port holdout floor',40,320,470,440,310,520),space('Reaction feed threshold',360,200,560,180,700,290),space('Starboard gantry',890,200,350,560,1130,520),space('Exhaust gallery',200,640,880,260,640,800)],
  openings:[gate('Port holdout floor','Reaction feed threshold',360,320,510,320),gate('Reaction feed threshold','Starboard gantry',920,200,920,380),gate('Port holdout floor','Exhaust gallery',200,760,510,760),gate('Starboard gantry','Exhaust gallery',890,760,1080,760)],
  breachFeatures:[feature('Port reaction feed door',240,200),feature('Starboard reaction feed door',1040,200),feature('Port exhaust door',240,900),feature('Starboard exhaust door',1040,900)]},
});
export const SHIP_ACT4_LAYOUTS:Readonly<Partial<Record<StoryTemplateId,ShipRoomTopology>>>=Object.freeze(Object.fromEntries(Object.entries(SHIP_ACT4_PLANS).map(([id,plan])=>[id,plan.topology])));
