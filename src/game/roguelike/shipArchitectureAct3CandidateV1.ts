import {SHIP_ACT3_PLANS} from './shipArchitectureAct3';
import {defineShipRoom,polygon as poly,rectangles,spaceBox as space,opening as gate,breachFeature as feature,type ShipPlan} from './shipArchitecturePlan';
/** Prospective balance experiment only. Never imported by live registration. */
const coolant=SHIP_ACT3_PLANS['coolant-plant']!,workshop=SHIP_ACT3_PLANS['infested-workshop']!;
export const SHIP_ACT3_CANDIDATE_V1:Readonly<Record<string,ShipPlan>>=Object.freeze({
 'coolant-plant':Object.freeze({...coolant,
  topology:defineShipRoom({...coolant.topology,obstacles:rectangles([[40,0,220,300],[1100,0,220,300],[40,660,220,300],[1100,660,220,300],[600,300,160,100],[600,560,160,100]])}),
  spaces:Object.freeze([space('North pump header',260,0,840,300,680,150),space('Port pump gallery',260,300,420,360,430,480),space('Starboard pump gallery',680,300,420,360,930,480),space('South pump return',260,660,840,300,680,810),space('Entry lock',0,320,260,320,130,480),space('Exit lock',1100,320,260,320,1230,480)]),
  openings:Object.freeze([...coolant.openings,gate('Port pump gallery','Starboard pump gallery',680,400,680,560)]),
 }),
 'infested-workshop':Object.freeze({...workshop,
  topology:defineShipRoom({...workshop.topology,
   obstacles:rectangles([[260,0,300,160],[160,800,300,200],[1120,200,160,280],[900,800,220,200]]),
   boundary:poly([[0,240],[40,240],[40,0],[1200,0],[1200,200],[1280,200],[1280,760],[1120,760],[1120,1000],[40,1000],[40,760],[0,760]]),
   breaches:poly([[100,100],[1100,100],[80,730],[1180,720]]),
  }),
  spaces:Object.freeze([space('Loading vestibule',0,240,260,520,100,500),space('Work floor',260,300,640,460,650,500),space('Tool gallery',40,0,1160,300,800,180),space('Gantry alcove',900,300,380,460,1180,640),space('Service gallery',40,760,1080,240,650,880)]),
  breachFeatures:Object.freeze([feature('Port hull service vent',40,100),feature('North gantry service vent',1200,100),feature('Loading hull door tear',0,730),feature('East gantry door tear',1280,720)]),
 }),
});
