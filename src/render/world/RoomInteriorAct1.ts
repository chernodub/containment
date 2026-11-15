import * as T from 'three';
import type {Point} from '../../game/roguelike/types';
import type {ShipPlan} from '../../game/roguelike/shipArchitecturePlan';
import type {InteriorProfile} from './RoomInteriorProfiles';
import type {InteriorDeckChart} from './InteriorDeckGeometry';

/** Room direction for the first nine interiors. Existing native landmarks stay owned by their builders. */
export const ACT1_INTERIOR_PROFILES:Record<string,InteriorProfile> = {
  'awakening-bay': {
    kind:'cryo-recovery', deck:0x203d49, zone:0x355461, trim:0xe2e4ce, key:0x8cdbef,
    landmark:'Released berth and sealed cryo bank beside the recovery observation floor',
  },
  'passenger-vault': {
    kind:'cryo-inspection', deck:0x333e5b, zone:0x4d5974, trim:0xd8e4d7, key:0x82d0c3,
    landmark:'Paired occupied cryo banks and their life-sign inspection consoles',
  },
  'residential-gallery': {
    kind:'domestic-gallery', deck:0x655344, zone:0x8e7658, trim:0xc9d7c5, key:0xe4ba7d,
    landmark:'Six open-front arrival cabins with made berths, writing desks and silent radios',
  },
  'communal-atrium': {
    kind:'communal-dining', deck:0x765c4b, zone:0x9b8262, trim:0x9fbba5, key:0xe4c37d,
    landmark:'Shared dining table and conservatory garden against the abandoned galley frontage',
  },
  'armory': {
    kind:'ordnance', deck:0x26364e, zone:0x3e5170, trim:0xdce0ba, key:0xd8bf73,
    landmark:'Secured radial rifle carousel inside the horseshoe issue and maintenance counter',
  },
  'freight-hold': {
    kind:'freight', deck:0x786844, zone:0x9a875b, trim:0x9bb5bf, key:0xe2bf73,
    landmark:'Heavy stacked colony freight banks and the enclosed loading control booth',
  },
  'breached-loading-bay': {
    kind:'docking', deck:0x3c5665, zone:0x5c7782, trim:0xd2c6a4, key:0xd6b17a,
    landmark:'Retained diagonal hull scar and torn metal along the repaired docking trunk',
  },
  'relay-racks': {
    kind:'data-relay', deck:0x322f3e, zone:0x4d4658, trim:0xc4d9cb, key:0x74d4b8,
    landmark:'Paired hull-backed relay rack banks and the long central service spine',
  },
  'transmission-chamber': {
    kind:'uplink', deck:0x4d3d53, zone:0x6f5872, trim:0xddd4b6, key:0x8bd8ce,
    landmark:'Elevated uplink dish behind the staggered chancel screens and transmission nave',
  },
};

const rectangle = (x:number,y:number,w:number,h:number):Point[] => [
  {x,y}, {x:x+w,y}, {x:x+w,y:y+h}, {x,y:y+h},
];

/** Add a room's flush functional inlay to the exact clipped deck chart. No raised props or simulation edits. */
export function buildAct1InteriorInlay(
  id:string, plan:ShipPlan, chart:InteriorDeckChart, base:T.Color, trim:T.Color,
):boolean {
  if(!Object.hasOwn(ACT1_INTERIOR_PROFILES,id))return false;
  const a=plan.arena;
  const ink=base.clone().lerp(trim,.14), recess=base.clone().multiplyScalar(.88);
  const field=base.clone().multiplyScalar(.96), joint=base.clone().lerp(trim,.06);
  const at=(x:number,y:number):Point=>({x:a.x+x,y:a.y+y});
  const polygon=(points:readonly (readonly [number,number])[],color:T.Color,y=.017)=>
    chart.polygon(points.map(([x,z])=>at(x,z)),color,y);
  const strip=(x0:number,z0:number,x1:number,z1:number,width:number,color=ink,y=.019)=>
    chart.strip(at(x0,z0),at(x1,z1),width,color,y);
  const rect=(x:number,z:number,w:number,h:number,color:T.Color,y=.017)=>
    chart.polygon(rectangle(a.x+x,a.y+z,w,h),color,y);
  const arc=(radius:number,start:number,end:number,width:number,color:T.Color,y=.018)=>{
    const steps=Math.max(2,Math.ceil(Math.abs(end-start)*radius/20));
    const points:Point[]=[];
    for(let i=0;i<=steps;i++) {
      const angle=start+(end-start)*i/steps;
      points.push(at((radius+width/2)*Math.cos(angle),(radius+width/2)*Math.sin(angle)));
    }
    for(let i=steps;i>=0;i--) {
      const angle=start+(end-start)*i/steps;
      points.push(at((radius-width/2)*Math.cos(angle),(radius-width/2)*Math.sin(angle)));
    }
    chart.polygon(points,color,y);
  };

  switch(id) {
    case 'awakening-bay': {
      // The observation floor is a long pressure-test cradle, perpendicular to
      // the pod aisle. Broad chamfers and a split seam replace the tile grid.
      polygon([[-74,-174],[74,-174],[98,-150],[98,150],[74,174],[-74,174],[-98,150],[-98,-150]],recess,.016);
      polygon([[-68,-164],[68,-164],[88,-144],[88,144],[68,164],[-68,164],[-88,144],[-88,-144]],field,.017);
      for(const side of [-1,1]) {
        strip(side*83,-138,side*83,138,2,joint);
        polygon([[side*60,-112],[side*72,-100],[side*60,-88],[side*48,-100]],ink,.020);
        strip(side*42,132,side*70,132,4,ink);
      }
      strip(0,-152,0,152,2,recess,.018);
      break;
    }
    case 'passenger-vault': {
      // Flush gurney-guide channels continue through the cryo aisle; the entry
      // holds one soft-edged inspection plate rather than a warning target.
      for(const side of [-1,1]) {
        chart.strip({x:104,y:440+side*49},{x:1058,y:440+side*49},7,recess,.016);
        chart.strip({x:112,y:440+side*43},{x:1050,y:440+side*43},1.4,joint,.018);
      }
      polygon([[-68,-25],[62,-25],[78,-10],[78,10],[62,25],[-68,25],[-82,10],[-82,-10]],field,.019);
      strip(-55,0,51,0,2,ink,.020);
      for(const end of [-1,1])strip(end*62,-12,end*62,12,3,ink,.020);
      break;
    }
    case 'residential-gallery': {
      // A continuous woven runner ties the six cabin mouths together. Its
      // broad inset and restrained lozenge describe domestic material, not tech.
      rect(-318,-69,636,138,recess,.016);
      polygon([[-310,-61],[294,-61],[310,-45],[310,45],[294,61],[-310,61]],field,.017);
      for(const side of [-1,1])strip(-298,side*52,286,side*52,2,joint,.018);
      polygon([[-66,0],[0,-31],[66,0],[0,31]],joint,.019);
      polygon([[-44,0],[0,-19],[44,0],[0,19]],field,.020);
      for(const space of plan.spaces.filter(space=>space.name.startsWith('Cabin'))) {
        const north=space.anchor.y<a.y, sill=north?300:660;
        chart.polygon(rectangle(space.anchor.x-52,sill+(north?-27:4),104,23),recess,.016);
        chart.strip({x:space.anchor.x-42,y:sill+(north?-13:15)},
          {x:space.anchor.x+42,y:sill+(north?-13:15)},1.6,joint,.019);
      }
      break;
    }
    case 'communal-atrium': {
      // Large terrazzo courses and a simple paired-leaf medallion on the west
      // common floor echo the conservatory. No loose chips or repeated scatter.
      polygon([[-102,-87],[76,-87],[104,-59],[104,87],[-102,87]],recess,.016);
      polygon([[-95,-80],[73,-80],[97,-56],[97,80],[-95,80]],field,.017);
      polygon([[-95,-80],[-24,-80],[-24,80],[-95,80]],joint,.018);
      polygon([[-15,34],[-54,4],[-45,-29],[-11,-6]],ink,.019);
      polygon([[9,20],[47,-8],[36,-37],[5,-6]],joint,.019);
      strip(-8,43,-3,-29,1.8,recess,.020);
      // The dining court gets a quieter extension of the same stone module.
      chart.polygon(rectangle(1000,451,181,84),field,.016);
      chart.strip({x:1009,y:526},{x:1172,y:526},2,joint,.018);
      break;
    }
    case 'armory': {
      // Engraved maintenance drawing: receiver, stock, bore, detached magazine.
      // Low-value technical ink stays subordinate to the real secured weapons.
      polygon([[-178,-22],[-124,-22],[-108,-10],[-58,-10],[-58,-25],[54,-25],[54,-13],
        [160,-13],[160,-5],[54,-5],[54,15],[2,15],[-10,35],[-29,35],[-32,15],
        [-101,15],[-127,30],[-178,30]],joint,.017);
      rect(-47,-17,92,24,field,.018);
      strip(49,-9,177,-9,2,recess,.020);
      polygon([[-9,48],[15,48],[10,83],[-13,80]],recess,.018);
      strip(-166,52,-43,52,1.6,ink);
      strip(42,52,165,52,1.6,ink);
      for(const end of [-1,1])strip(end*176,-42,end*176,-31,2,ink);
      break;
    }
    case 'freight-hold': {
      // Recessed towing shoes are actual long service rails. The quiet 07 bay
      // numeral is paint inside their module, with no danger-colored chevrons.
      for(const side of [-1,1]) {
        strip(-386,side*53,292,side*53,12,recess,.016);
        strip(-374,side*53,280,side*53,2,joint,.018);
        rect(-392,side*53-11,14,22,joint,.019);
        rect(286,side*53-11,14,22,joint,.019);
      }
      const zero=[[-58,-28],[-26,-28],[-19,-20],[-19,22],[-26,30],[-58,30],[-65,22],[-65,-20],[-58,-28]];
      for(let i=1;i<zero.length;i++)strip(...zero[i-1] as [number,number],...zero[i] as [number,number],4,ink,.020);
      strip(-4,-28,36,-28,4,ink,.020);
      strip(36,-28,7,30,4,ink,.020);
      break;
    }
    case 'breached-loading-bay': {
      // A manufactured turning plate with four broad quadrant joints survives
      // the hull breach. Everything is flush, including the quiet bearing ring.
      arc(119,0,Math.PI*2,12,recess,.016);
      arc(111,0,Math.PI*2,2,joint,.018);
      for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]) {
        const dx=Math.cos(angle),dy=Math.sin(angle);
        strip(dx*42,dy*42,dx*104,dy*104,2.5,joint,.018);
        strip(dx*123,dy*123,dx*137,dy*137,5,ink,.019);
      }
      polygon([[-26,-19],[26,-19],[34,-11],[34,11],[26,19],[-26,19],[-34,11],[-34,-11]],field,.018);
      strip(-18,0,18,0,2,ink,.020);
      break;
    }
    case 'relay-racks': {
      // Patch trays follow the actual paired aisles and turn toward the spine.
      // Offset elbows read as signal infrastructure without bright circuit noise.
      const trunks=[[-126,-172,-126,116],[-126,116,108,116],[108,116,108,-94]];
      for(const [x0,y0,x1,y1] of trunks) {
        strip(x0,y0,x1,y1,11,recess,.016);
        strip(x0,y0,x1,y1,2,joint,.018);
      }
      rect(-37,-30,74,60,recess,.017);
      rect(-32,-25,64,50,field,.018);
      for(const side of [-1,1]) {
        strip(side*37,0,side*75,0,5,joint,.019);
        strip(side*75,0,side*75,side*43,5,joint,.019);
      }
      strip(-14,-9,14,-9,2,ink,.020);
      strip(-14,9,14,9,2,ink,.020);
      break;
    }
    case 'transmission-chamber': {
      // Quiet bearing/fan chart points toward the retained northern uplink.
      // A single filled aperture and two engraved arcs replace an arena target.
      const bearing=Math.atan2(100-a.y,600-a.x),spread=.52;
      const fan:Point[]=[at(0,0)];
      for(let i=0;i<=16;i++) {
        const angle=bearing-spread+i*spread/8;
        fan.push(at(164*Math.cos(angle),164*Math.sin(angle)));
      }
      chart.polygon(fan,field,.016);
      arc(122,bearing-2.55,bearing+2.55,8,recess,.017);
      arc(130,bearing-.60,bearing+.60,2,joint,.019);
      for(const turn of [-Math.PI/2,0,Math.PI/2,Math.PI]) {
        const angle=bearing+turn;
        strip(Math.cos(angle)*111,Math.sin(angle)*111,
          Math.cos(angle)*136,Math.sin(angle)*136,3,joint,.019);
      }
      const dx=Math.cos(bearing),dy=Math.sin(bearing);
      strip(dx*27,dy*27,dx*102,dy*102,2,ink,.020);
      polygon([[-12,-8],[12,-8],[12,8],[-12,8]],recess,.018);
      break;
    }
  }
  return true;
}
