import {defineShipRoom,point as p,polygon as poly,rectangles,partition as wall,type ShipRoomTopology} from './shipArchitecturePlan';
import {spaceBox as space,opening as gate,breachFeature as feature,type ShipPlan} from './shipArchitecturePlan';
export type {ShipPlan,ShipSpace,ShipOpening} from './shipArchitecturePlan';
const cabins=[40,416,808];
const cabinWidth=(x:number)=>x===416?368:352;
// P11 north common nook: existing gallery fight floor remains clear; its west
// bypass is 156 units from the cabin boundary and the solid is 202 units
// north of the arena centre (native fight radius 144).
const residential=defineShipRoom({width:1200,height:960,
 boundary:poly([[40,0],[392,0],[392,24],[416,24],[416,0],[784,0],[784,24],[808,24],[808,0],[1160,0],[1160,340],[1200,340],[1200,620],[1160,620],[1160,960],[808,960],[808,936],[784,936],[784,960],[416,960],[416,936],[392,936],[392,960],[40,960],[40,620],[0,620],[0,340],[40,340]]),
 obstacles:rectangles(cabins.flatMap(x=>[[x+24,0,cabinWidth(x)-24,40],[x+24,40,70,100],[x+cabinWidth(x)-68,40,68,60],[x+24,920,cabinWidth(x)-24,40],[x+24,820,70,100],[x+cabinWidth(x)-68,860,68,60]] as [number,number,number,number][]).concat([[0,400,40,160],[572,241,196,38]])),
 voids:[wall(392,24,24,116),wall(784,24,24,116),wall(392,820,24,116),wall(784,820,24,116)],
 spawn:p(200,200),exit:p(1100,480),breaches:poly([[460,200],[860,200],[340,740],[1100,740]]),
});
const checkpoint=defineShipRoom({width:1408,height:880,
 boundary:poly([[0,240],[200,240],[200,80],[520,80],[520,0],[760,0],[760,80],[1080,80],[1080,240],[1408,240],[1408,640],[1080,640],[1080,800],[760,800],[760,880],[520,880],[520,800],[200,800],[200,640],[0,640]]),
 obstacles:rectangles([[232,80,264,40],[232,760,264,40],[776,260,144,24]]),
 voids:[wall(520,0,240,80),wall(520,800,240,80),wall(200,80,32,200),wall(496,80,24,40),wall(200,600,32,200),wall(496,760,24,40),
  wall(720,260,200,24),wall(720,284,24,76),wall(720,596,200,24),wall(720,520,24,76)],
 spawn:p(300,440),exit:p(1308,440),breaches:poly([[380,200],[980,160],[380,680],[980,720]]),
});
const relay=defineShipRoom({width:1280,height:1000,
 boundary:poly([[40,0],[1240,0],[1240,340],[1280,340],[1280,660],[1240,660],[1240,1000],[40,1000],[40,660],[0,660],[0,340],[40,340]]),
 obstacles:rectangles([[40,0,160,340],[40,660,160,340],[1080,0,160,340],[1080,660,160,340],[606,300,100,400],[400,960,480,40]]),voids:[],
 spawn:p(300,500),exit:p(1180,500),breaches:poly([[300,220],[980,220],[300,780],[980,780]]),
});
export const SHIP_STANDARD_PLANS:Readonly<Record<string,ShipPlan>>=Object.freeze({
 'residential-gallery':{topology:residential,arena:p(600,480),bays:[{space:'Common nook',from:p(0,340),to:p(0,620)},{space:'Exit bay',from:p(1200,340),to:p(1200,620)}],
  spaces:[space('Gallery',260,300,680,360),space('Common nook',0,300,260,360,160,480),space('Exit bay',940,300,260,360,1060,480),
   ...cabins.map((x,i)=>space(`Cabin N${i+1}`,x,0,i===1?368:352,300,x+176,220)),...cabins.map((x,i)=>space(`Cabin S${i+1}`,x,660,i===1?368:352,300,x+176,740))],
  openings:[gate('Common nook','Gallery',260,300,260,460),gate('Common nook','Gallery',260,500,260,660),gate('Gallery','Exit bay',940,300,940,460),gate('Gallery','Exit bay',940,500,940,660),
   gate('Cabin N1','Common nook',40,300,260,300),gate('Cabin N2','Gallery',416,300,784,300),gate('Cabin N3','Exit bay',940,300,1160,300),
   gate('Cabin S1','Common nook',40,660,260,660),gate('Cabin S2','Gallery',416,660,784,660),gate('Cabin S3','Exit bay',940,660,1160,660),
   gate('Cabin N1','Cabin N2',404,140,404,300),gate('Cabin N2','Cabin N3',796,140,796,300),gate('Cabin S1','Cabin S2',404,660,404,820),gate('Cabin S2','Cabin S3',796,660,796,820)],
  breachFeatures:[feature('N2 service vent',404,100),feature('N3 service vent',796,100),feature('S1 service vent',404,860),feature('S3 hull tear',1160,740)]},
 'crew-checkpoint':{topology:checkpoint,arena:p(450,440),bays:[{space:'Entry vestibule',from:p(0,240),to:p(0,640)},{space:'Exit lock',from:p(1408,240),to:p(1408,640)}],
  spaces:[space('Entry vestibule',0,280,232,320,100,440),space('Scanner hall',232,280,488,320,450,440),space('Inspection N',232,120,264,160),space('Inspection S',232,600,264,160),
   space('North bypass',520,80,560,180,800,160),space('South bypass',520,620,560,180,800,720),space('Guard cage',744,284,176,312,830,440),space('Guard gallery',920,260,160,360,1000,440),space('Exit lock',1080,280,328,320,1308,440)],
  openings:[gate('Entry vestibule','Scanner hall',232,280,232,420),gate('Entry vestibule','Scanner hall',232,460,232,600),
   gate('Inspection N','Scanner hall',232,280,496,280),gate('Inspection S','Scanner hall',232,600,496,600),gate('Inspection N','North bypass',508,120,508,280),gate('Inspection S','South bypass',508,600,508,760),
   gate('Scanner hall','North bypass',520,280,720,280),gate('Scanner hall','South bypass',520,600,720,600),gate('Scanner hall','Guard cage',732,360,732,520),gate('Guard cage','Guard gallery',920,284,920,596),
   gate('North bypass','Guard gallery',920,260,1080,260),gate('South bypass','Guard gallery',920,620,1080,620),gate('Guard gallery','Exit lock',1080,280,1080,420),gate('Guard gallery','Exit lock',1080,460,1080,600)],
  breachFeatures:[feature('Inspection N vent',380,120),feature('North bypass door',1080,160),feature('Inspection S vent',380,760),feature('South bypass door',1080,720)]},
 'relay-racks':{topology:relay,arena:p(395,500),bays:[{space:'Entry lock',from:p(0,340),to:p(0,660)},{space:'Exit lock',from:p(1280,340),to:p(1280,660)}],
  spaces:[space('North cross aisle',200,0,880,300,640,160),space('Port rack aisle',200,300,406,400,395,500),space('Starboard rack aisle',706,300,374,400,885,500),space('Console bay',200,700,880,260,640,840),space('Entry lock',0,340,200,320,100,500),space('Exit lock',1080,340,200,320,1180,500)],
  openings:[gate('North cross aisle','Port rack aisle',200,300,606,300),gate('North cross aisle','Starboard rack aisle',706,300,1080,300),gate('Port rack aisle','Console bay',200,700,606,700),gate('Starboard rack aisle','Console bay',706,700,1080,700),
   gate('Entry lock','Port rack aisle',200,340,200,480),gate('Entry lock','Port rack aisle',200,520,200,660),gate('Starboard rack aisle','Exit lock',1080,340,1080,480),gate('Starboard rack aisle','Exit lock',1080,520,1080,660)],
  breachFeatures:[feature('Port north cooling vent',200,180),feature('Starboard north cooling vent',1080,180),feature('Port south cooling vent',200,820),feature('Starboard south cooling vent',1080,820)]},
});
