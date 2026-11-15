import {AWAKENING_BLOCKOUT,PASSENGER_BLOCKOUT,COMMUNAL_ATRIUM_BLOCKOUT} from './authoredRoomTopologies';
import {defineShipRoom,point as p,polygon as poly,rectangles,spaceBox as space,opening as gate,breachFeature as feature,type ShipPlan} from './shipArchitecturePlan';
import type {StoryTemplateId} from './storyRooms';
/** Prospective act1 plans. Kept separate from live registration during authoring. */
export const SHIP_ACT1_PLANS:Readonly<Partial<Record<StoryTemplateId,ShipPlan>>>=Object.freeze({
 'awakening-bay':{
  topology:defineShipRoom({width:1200,height:1080,
   boundary:poly([[80,40],[400,40],[400,90],[900,90],[900,40],[1120,40],[1160,80],[1160,880],[1120,920],[440,920],[440,1040],[0,1040],[0,880],[0,600],[40,600],[40,500],[90,500],[90,380],[40,380],[40,80]]),
   voids:AWAKENING_BLOCKOUT.map(f=>f.footprint),obstacles:rectangles([[440,140,400,100],[280,620,170,30]]),
   spawn:p(230,440),exit:p(1080,440),breaches:poly([[340,190],[1000,190],[350,730],[1000,550]]),
  }),
  arena:p(1000,440),bays:[{space:'Recovery bay',from:p(0,600),to:p(0,880)},{space:'Observation floor',from:p(1160,80),to:p(1160,880)}],
  spaces:[space('Release gallery',0,140,440,520,300,440),space('Pod aisle',440,350,400,180,640,440),space('Observation floor',840,140,320,780,1000,440),space('South service gallery',290,650,750,270,640,800),space('Recovery bay',0,660,290,380,80,720)],
  openings:[gate('Release gallery','Pod aisle',440,350,440,530),gate('Pod aisle','Observation floor',840,350,840,530),gate('Observation floor','South service gallery',1040,750,1040,920),gate('South service gallery','Recovery bay',290,760,290,920),gate('Recovery bay','Release gallery',0,660,160,660)],
  breachFeatures:[feature('Release gallery pod vent',440,240),feature('Observation supply vent',900,140),feature('Recovery service vent',290,700),feature('Station service vent',1040,650)],
 },
 'passenger-vault':{
  topology:defineShipRoom({width:1200,height:880,
   boundary:poly([[40,40],[1160,40],[1160,360],[1200,360],[1200,520],[1160,520],[1160,840],[40,840],[40,520],[0,520],[0,360],[40,360]]),
   voids:PASSENGER_BLOCKOUT.map((f,i)=>i<4?poly([[f.footprint[0].x,i<2?260:520],[f.footprint[1].x,i<2?260:520],[f.footprint[2].x,i<2?360:620],[f.footprint[3].x,i<2?360:620]]):i===7?f.footprint.map(v=>p(v.x+17.45,v.y)):f.footprint),
   obstacles:rectangles([[320,120,200,140],[680,120,200,140],[520,520,160,100],[1107.45,479.35,92.55,38.63]]),
   spawn:p(100,440),exit:p(1100,440),breaches:poly([[220,200],[980,200],[220,700],[980,700]]),
  }),
  arena:p(176,440),bays:[{space:'Entry gallery',from:p(0,360),to:p(0,520)},{space:'Medical bay',from:p(1200,360),to:p(1200,520)}],
  spaces:[space('Entry gallery',0,360,320,160,176,440),space('Cryo aisle',320,360,560,160,600,440),space('Medical bay',880,320,320,440,1000,440),space('South service gallery',300,620,600,140,600,700),space('West service turn',40,520,280,240,180,700)],
  openings:[gate('Entry gallery','Cryo aisle',320,360,320,520),gate('Cryo aisle','Medical bay',880,360,880,520),gate('Medical bay','South service gallery',900,620,900,760),gate('South service gallery','West service turn',320,620,320,760),gate('West service turn','Entry gallery',40,520,320,520)],
  breachFeatures:[feature('Port pod vent',320,200),feature('Medical service vent',1080,260),feature('South supply vent',300,800),feature('South return vent',900,800)],
 },
 'communal-atrium':{
  topology:defineShipRoom({width:1296,height:880,
   boundary:poly([[192,80],[782,80],[782,216],[1120,272],[1200,272],[1200,280],[1296,280],[1296,560],[1200,560],[1200,572],[1120,572],[932,556],[882,580],[480,580],[480,584],[192,584]]),
   voids:COMMUNAL_ATRIUM_BLOCKOUT.map(f=>{
    if(f.id==='shared-water')return poly([[698,130],[758,130],[758,170],[698,170]]);
    if(f.id==='entry-welcome')return poly([[240,154],[304,154],[304,170],[240,170]]);
    if(f.id==='corridor-garden')return poly([[464,310],[480,310],[480,330],[464,330]]);
    if(f.id==='shared-table'||f.id.startsWith('north-seat')||f.id.startsWith('south-seat'))return f.footprint.map(v=>p(v.x+80,v.y));
    return f.footprint;
   }),
   obstacles:rectangles([[192,80,590,90],[192,170,48,32],[1068,388,8,20],[1068,420,8,20]]),
   spawn:p(436,440),exit:p(1248,420),breaches:poly([[320,256],[850,280],[436,500],[1200,520]]),
  }),
  arena:p(336,440),bays:[{space:'North service gallery',from:p(192,80),to:p(782,80)},{space:'Exit lock',from:p(1296,280),to:p(1296,560)}],
  spaces:[space('West common',192,330,288,254,336,440),space('North service gallery',192,170,690,150,600,240),space('East garden turn',698,170,184,246,790,368),space('South garden gallery',480,416,402,164,620,500),space('Dining court',882,272,318,284,1090,480),space('Exit lock',1200,280,96,280,1248,420)],
  openings:[gate('West common','North service gallery',192,310,464,310),gate('North service gallery','East garden turn',698,320,882,320),gate('East garden turn','Dining court',882,276,882,416),gate('Dining court','South garden gallery',882,416,882,556),gate('South garden gallery','East garden turn',698,416,882,416),gate('South garden gallery','West common',480,416,480,580),gate('Dining court','Exit lock',1200,280,1200,420),gate('Dining court','Exit lock',1200,420,1200,560)],
  breachFeatures:[feature('Galley service vent',320,170),feature('Conservatory service vent',782,216),feature('Garden service vent',480,400),feature('Exit lock door',1296,520)],
 },

});
