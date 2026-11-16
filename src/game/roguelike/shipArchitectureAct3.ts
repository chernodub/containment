import type {StoryTemplateId} from './storyRooms';
import {defineShipRoom,point as p,polygon as poly,rectangles,partition as wall,spaceBox as space,opening as gate,breachFeature as feature,type ShipPlan,type ShipRoomTopology} from './shipArchitecturePlan';

/** Engineering decks have inhabited service galleries rather than machine islands.
 * Equipment backplates meet hull; the few independent interlocks remain open on
 * both sides. Coordinates are simulation units, not presentation dimensions. */
const diagnostic=defineShipRoom({width:1280,height:960,
 boundary:poly([[40,0],[1240,0],[1240,320],[1280,320],[1280,640],[1240,640],[1240,960],[40,960],[40,640],[0,640],[0,320],[40,320]]),
 // The warning recorder remains the first equipment role and keeps a full roof.
 obstacles:rectangles([[260,0,260,130],[40,40,160,180],[1080,40,160,180],[40,740,160,180],[1080,740,160,180],[600,830,220,90],[690,270,128,42]]),
 voids:[wall(40,0,1200,40),wall(40,920,1200,40),wall(520,40,24,120),wall(820,40,24,140),wall(560,780,24,140)],
 spawn:p(100,480),exit:p(1180,480),breaches:poly([[300,220],[980,220],[300,760],[980,760]]),
});
const safety=defineShipRoom({width:1280,height:960,
 boundary:poly([[40,0],[1240,0],[1240,320],[1280,320],[1280,640],[1240,640],[1240,960],[40,960],[40,640],[0,640],[0,320],[40,320]]),
 // The recorder and disconnected AI occupy real booths; battery backs onto hull.
 obstacles:rectangles([[280,0,180,180],[820,0,180,180],[500,820,280,140],[586,344,128,42]]),
 voids:[wall(40,0,1200,40),wall(40,920,460,40),wall(780,920,460,40),wall(40,760,160,160),wall(1080,760,160,160),
  wall(516,332,280,12),wall(516,344,24,56),wall(772,344,24,56),wall(500,616,280,24),wall(500,560,24,56),wall(756,560,24,56)],
 spawn:p(100,480),exit:p(1180,480),breaches:poly([[300,260],[980,260],[300,820],[980,820]]),
});
const coolant=defineShipRoom({width:1360,height:960,
 boundary:poly([[40,0],[1320,0],[1320,320],[1360,320],[1360,640],[1320,640],[1320,960],[40,960],[40,640],[0,640],[0,320],[40,320]]),
 obstacles:rectangles([[40,0,220,300],[1100,0,220,300],[40,660,220,300],[1100,660,220,300],[600,300,160,360]]),voids:[],
 spawn:p(100,480),exit:p(1260,480),breaches:poly([[350,180],[1010,180],[350,780],[1010,780]]),
});
const shaft=defineShipRoom({width:1200,height:880,
 // Retain the C balcony and original cutout: only the outer docking recesses move.
 boundary:poly([[0,0],[1160,0],[1160,40],[1200,40],[1200,200],[1160,200],[1160,540],[1200,540],[1200,640],[1160,640],[1160,680],[1200,680],[1200,840],[1160,840],[1160,880],[0,880]]),
 voids:[poly([[340,240],[900,240],[900,540],[1200,540],[1200,640],[340,640]])],obstacles:[],
 spawn:p(170,440),exit:p(1060,120),breaches:poly([[100,100],[1060,100],[100,780],[1060,780]]),
});
const workshop=defineShipRoom({width:1280,height:1000,
 boundary:poly([[0,240],[160,240],[160,0],[1120,0],[1120,200],[1280,200],[1280,760],[1120,760],[1120,1000],[160,1000],[160,760],[0,760]]),
 // A lathe, workbench, wall gantry and stock cabinet still explain the old room.
 obstacles:rectangles([[260,0,300,160],[160,800,300,200],[1120,200,160,280],[900,800,220,200]]),
 voids:[wall(560,0,24,200),poly([[1120,440],[1020,440],[1020,464],[1080,464],[1080,560],[1120,560]]),wall(460,860,24,140)],
 spawn:p(100,500),exit:p(1180,640),breaches:poly([[260,240],[1000,180],[260,720],[1060,640]]),
});
export const SHIP_ACT3_PLANS:Readonly<Partial<Record<StoryTemplateId,ShipPlan>>>=Object.freeze({
 'diagnostic-gallery':{topology:diagnostic,arena:p(620,480),
  spaces:[space('Diagnostic nave',200,300,880,360,620,480),space('Instrument gallery',200,130,880,170,640,230),space('Service return',200,660,880,170,640,740),space('Entry threshold',0,320,200,320,100,480),space('Exit threshold',1080,320,200,320,1180,480)],
  openings:[gate('Entry threshold','Diagnostic nave',200,320,200,460),gate('Entry threshold','Diagnostic nave',200,500,200,640),gate('Diagnostic nave','Exit threshold',1080,320,1080,460),gate('Diagnostic nave','Exit threshold',1080,500,1080,640),
   gate('Instrument gallery','Diagnostic nave',200,300,520,300),gate('Instrument gallery','Diagnostic nave',560,300,1080,300),gate('Diagnostic nave','Service return',200,660,520,660),gate('Diagnostic nave','Service return',600,660,1080,660)],
  bays:[{space:'Entry threshold',from:p(0,320),to:p(0,640)},{space:'Exit threshold',from:p(1280,320),to:p(1280,640)}],
  breachFeatures:[feature('Recorder service vent',300,130),feature('Starboard instrument door',1080,220),feature('Port service vent',200,760),feature('Starboard service vent',1080,760)]},
 'safety-interlock-station':{topology:safety,arena:p(350,480),
  spaces:[space('Entry vestibule',0,320,200,320,100,480),space('Port inspection',200,320,300,320,350,480),space('Recorder and AI booths',200,40,880,280,640,200),space('Interlock cage',524,344,232,272,640,480),space('Starboard gallery',780,320,300,320,930,480),space('Battery return',200,640,880,180,640,730),space('Exit lock',1080,320,200,320,1180,480)],
  openings:[gate('Entry vestibule','Port inspection',200,320,200,460),gate('Entry vestibule','Port inspection',200,500,200,640),gate('Port inspection','Recorder and AI booths',200,320,500,320),gate('Starboard gallery','Recorder and AI booths',812,320,1080,320),
   gate('Port inspection','Interlock cage',512,400,512,560),gate('Interlock cage','Starboard gallery',768,400,768,560),gate('Port inspection','Battery return',200,640,500,640),gate('Starboard gallery','Battery return',780,640,1080,640),gate('Starboard gallery','Exit lock',1080,320,1080,460),gate('Starboard gallery','Exit lock',1080,500,1080,640)],
  bays:[{space:'Entry vestibule',from:p(0,320),to:p(0,640)},{space:'Exit lock',from:p(1280,320),to:p(1280,640)}],
  breachFeatures:[feature('Recorder booth vent',300,180),feature('AI booth vent',980,180),feature('Port return vent',200,820),feature('Starboard return vent',1080,820)]},
 'coolant-plant':{topology:coolant,arena:p(430,480),
  spaces:[space('North pump header',260,0,840,300,680,150),space('Port pump gallery',260,300,340,360,430,480),space('Starboard pump gallery',760,300,340,360,930,480),space('South pump return',260,660,840,300,680,810),space('Entry lock',0,320,260,320,130,480),space('Exit lock',1100,320,260,320,1230,480)],
  openings:[gate('North pump header','Port pump gallery',260,300,600,300),gate('North pump header','Starboard pump gallery',760,300,1100,300),gate('Port pump gallery','South pump return',260,660,600,660),gate('Starboard pump gallery','South pump return',760,660,1100,660),
   gate('Entry lock','Port pump gallery',260,320,260,460),gate('Entry lock','Port pump gallery',260,500,260,640),gate('Starboard pump gallery','Exit lock',1100,320,1100,460),gate('Starboard pump gallery','Exit lock',1100,500,1100,640)],
  bays:[{space:'Entry lock',from:p(0,320),to:p(0,640)},{space:'Exit lock',from:p(1360,320),to:p(1360,640)}],
  breachFeatures:[feature('Port header vent',260,180),feature('Starboard header vent',1100,180),feature('Port return door',260,780),feature('Starboard return door',1100,780)]},
 'service-shaft-landing':{topology:shaft,arena:p(170,170),
  spaces:[space('Upper docking balcony',0,0,1200,240,1060,120),space('Local lift landing',0,240,340,400,170,440),space('Lower docking balcony',0,640,1200,240,1060,760)],
  openings:[gate('Upper docking balcony','Local lift landing',0,240,160,240),gate('Upper docking balcony','Local lift landing',180,240,340,240),gate('Local lift landing','Lower docking balcony',0,640,160,640),gate('Local lift landing','Lower docking balcony',180,640,340,640)],
  bays:[{space:'Upper docking balcony',from:p(1200,40),to:p(1200,200)},{space:'Lower docking balcony',from:p(1200,680),to:p(1200,840)}],
  breachFeatures:[feature('Upper port hull door',0,100),feature('Upper starboard hull door',1200,100),feature('Lower port hull door',0,780),feature('Lower starboard hull door',1200,780)]},
 'infested-workshop':{topology:workshop,arena:p(650,500),
  spaces:[space('Loading vestibule',0,240,260,520,100,500),space('Work floor',260,300,640,460,650,500),space('Tool gallery',160,0,960,300,800,180),space('Gantry alcove',900,300,380,460,1180,640),space('Service gallery',160,760,960,240,650,880)],
  openings:[gate('Loading vestibule','Work floor',260,320,260,500),gate('Loading vestibule','Work floor',260,540,260,720),gate('Tool gallery','Work floor',260,300,560,300),gate('Tool gallery','Work floor',600,300,900,300),gate('Tool gallery','Gantry alcove',900,300,1080,300),gate('Work floor','Gantry alcove',900,300,900,480),gate('Work floor','Gantry alcove',900,560,900,760),gate('Work floor','Service gallery',484,760,684,760),gate('Work floor','Service gallery',704,760,900,760)],
  bays:[{space:'Loading vestibule',from:p(0,240),to:p(0,760)},{space:'Gantry alcove',from:p(1280,200),to:p(1280,760)}],
  breachFeatures:[feature('Lathe service vent',300,160),feature('Gantry hull tear',1120,240),feature('Workbench door tear',260,800),feature('Gantry seam tear',1100,540)]},
});
/** Compatibility view only; the integration registry chooses which plans are live. */
export const SHIP_ACT3_LAYOUTS:Readonly<Partial<Record<StoryTemplateId,ShipRoomTopology>>>=Object.freeze(Object.fromEntries(Object.entries(SHIP_ACT3_PLANS).map(([id,plan])=>[id,plan!.topology])));
