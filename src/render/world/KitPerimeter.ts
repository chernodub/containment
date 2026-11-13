import * as T from 'three';
import type {RoomTemplate} from '../../game/roguelike/types';
import type {ShipEnvironment} from '../ShipEnvironments';
import {kitHull} from './KitSafety';

type PlaceKit = (
  name:string, x:number, y:number, z:number,
  width:number, height:number, depth:number, angle:number,
  purpose:string, role?:string, flat?:boolean,
) => boolean;

export type KitPerimeterBuilders = {
  place:PlaceKit;
  box:(role:string, x:number, y:number, z:number, width:number, height:number, depth:number, purpose:string) => void;
  pipe:(a:T.Vector3, b:T.Vector3, radius:number, role?:string) => void;
};

export type KitPerimeterProof = {
  segmentsAttempted:number;
  segmentsAccepted:number;
  overheadAttempted:number;
  overheadAccepted:number;
  edges:readonly {index:number;attempted:number;accepted:number;doorwaySegments:number}[];
  idea:string;
};

const WALL_IDEAS:Record<ShipEnvironment,string> = {
  cryogenics:'sealed berth service wall, cold observation windows and release controls',
  habitation:'continuous cabin bulkheads, luggage cupboards, windows and domestic services',
  security:'armored locker line, inspection screens and interrupted defense storage',
  cargo:'loading-bay wall, packed storage and industrial ventilation',
  communications:'linked equipment wall, screen cassettes and overhead cable trays',
  engineering:'service wall, pressure conduits and suspended maintenance gantries',
  maintenance:'continuous pressure manifold, pump-wall vents and service cupboards',
  infested:'human bulkheads interrupted by growth and consumed service trunks',
  containment:'sealed observation wall and sparse field-service apertures',
  reactor:'heat-shielded service wall and overhead power-distribution gantries',
};

/**
 * Continuous hull dressing. Every raised placement still passes the owner's
 * navigation, story and actual gameplay-camera guards; no topology is changed.
 */
export function addKitPerimeter(
  template:RoomTemplate,
  environment:ShipEnvironment,
  id:string,
  builders:KitPerimeterBuilders,
):KitPerimeterProof {
  const {place,pipe} = builders;
  const hull = kitHull(template);
  let signedArea = 0;
  hull.forEach((a,i) => {
    const b = hull[(i+1)%hull.length];
    signedArea += a.x*b.y-b.x*a.y;
  });
  const orientation = Math.sign(signedArea)||1;
  const top = Math.min(...hull.map(point=>point.y))/32;
  const bottom = Math.max(...hull.map(point=>point.y))/32;
  const edges:{index:number;attempted:number;accepted:number;doorwaySegments:number}[] = [];
  let segmentsAttempted=0,segmentsAccepted=0,overheadAttempted=0,overheadAccepted=0;
  const openings = [template.spawn,template.exit,...template.breaches];

  for(let edge=0;edge<hull.length;edge++) {
    const a=hull[edge],b=hull[(edge+1)%hull.length];
    const ax=a.x/32,az=a.y/32;
    const dx=(b.x-a.x)/32,dz=(b.y-a.y)/32,length=Math.hypot(dx,dz);
    if(length<.7)continue;
    const tx=dx/length,tz=dz/length;
    const nx=tz*orientation,nz=-tx*orientation;
    // There is no end-to-end gap between the base panels. Storage, vents and
    // windows interrupt their silhouette rather than replacing the whole run.
    const count=Math.max(1,Math.ceil(length/1.65)),step=length/count;
    const angle=-Math.atan2(tz,tx);
    const edgeProof={index:edge,attempted:0,accepted:0,doorwaySegments:0};
    const doorwayAt=(along:number)=>openings.some(point=>{
      const px=point.x/32-ax,pz=point.y/32-az;
      const normalDistance=Math.abs(px*nx+pz*nz);
      return normalDistance<3.1&&Math.abs(px*tx+pz*tz-along)<1.35;
    });

    for(let segment=0;segment<count;segment++) {
      const along=(segment+.5)*step;
      if(doorwayAt(along)) {
        edgeProof.doorwaySegments++;
        continue;
      }
      const boundaryX=ax+tx*along,boundaryZ=az+tz*along;
      const far=boundaryZ<top+(bottom-top)*.22;
      const foreground=boundaryZ>bottom-(bottom-top)*.18;
      const height=far?2.55:foreground?.46:1.9;
      const panelWidth=step+.035;
      // The caller checks a full axis-aligned box. A diagonal wall panel needs
      // enough outboard offset for that conservative box, not only its mesh.
      const offset=Math.max(foreground?.72:.9,panelWidth*Math.abs(tx*tz)+.36);
      const x=boundaryX+nx*offset,z=boundaryZ+nz*offset;
      const window=(environment==='habitation'||environment==='cryogenics'||environment==='containment')&&segment%4===1;
      const name=window?'wall-window':'wall';
      const purpose=`${id}: ${WALL_IDEAS[environment]}`;
      segmentsAttempted++;edgeProof.attempted++;
      let accepted=place(name,x,.035,z,panelWidth,height,.30,angle,purpose,undefined,true);
      if(!accepted&&height>.46) {
        // Close the visual wall run with a low plinth where a tall side form
        // would enter the sampled actor cone. Rejection never grants clearance.
        accepted=place('wall',x,.035,z,panelWidth,.42,.50,angle,purpose+' / low camera-safe service plinth',undefined,true);
      }
      if(!accepted) {
        // A concave notch may have no room for an outboard cabinet. Its thin
        // authored wall face still fits immediately outside that actual edge.
        accepted=place('wall',boundaryX+nx*.08,.035,boundaryZ+nz*.08,step*.88,.40,.06,angle,purpose+' / inset notch service face',undefined,true);
      }
      if(!accepted)continue;
      segmentsAccepted++;edgeProof.accepted++;

      // Small source-authored service faces cost18–120 triangles, allowing
      // full-density runs without spending the budget on repeated heavy crates.
      const faceX=boundaryX+nx*.63,faceZ=boundaryZ+nz*.63;
      if(foreground) {
        if(segment%3===0)place('pipe-ring',faceX,.04,faceZ,step*.72,.26,.50,angle,'wall-base service coupling','dark',true);
      } else if(segment%4===0) {
        place('wall-detail',faceX,.45,faceZ,step*.65,Math.min(1.35,height-.4),.17,angle,'ventilation cassette on continuous hull service wall',undefined,true);
      } else if(segment%4===2) {
        place('wall-switch',faceX,.82,faceZ,step*.30,.24,.045,angle,'local hatch status and service isolation switch',undefined,true);
      }

      if(segment%6===3&&!foreground) {
        const fixture=environment==='maintenance'||environment==='reactor'||environment==='engineering'?'pipe':environment==='communications'?'computer-system':environment==='security'?'Prop_Locker':environment==='cargo'?'container-tall':environment==='habitation'?'cabinetBedDrawer':'container-wide';
        place(fixture,x,.035,z,step*.78,Math.min(height,1.5),.60,angle,'wall-bay '+environment+' service equipment',undefined,true);
      }
      if((environment==='maintenance'||environment==='engineering'||environment==='reactor')&&segment%3===1&&!foreground) {
        pipe(new T.Vector3(x,.15,z),new T.Vector3(x,Math.min(height,2.05),z),.065,'dark');
      }

      if(far&&nz<-.45&&segment%3===1) {
        // Only the far/top edge receives overhead silhouettes. Their6m base
        // and shallow1.45m inboard reach keep the playfield/actor cone open;
        // the same caller-side bounds and marine/story rays still decide.
        const beamX=boundaryX-nx*.35,beamZ=boundaryZ-nz*.35;
        const reach=2.2,beamWidth=Math.min(step*2.75,4.3);
        overheadAttempted++;
        const beam=place('structure',beamX,6.15,beamZ,beamWidth,.22,reach,angle,'far-edge overhead maintenance gantry and floor-casting lattice','dark',true);
        if(beam) {
          overheadAccepted++;
          pipe(new T.Vector3(x,1.6,z),new T.Vector3(x,6.26,z),.065,'dark');
          pipe(new T.Vector3(x,6.2,z),new T.Vector3(beamX,6.2,beamZ),.065,'dark');
          place('rail',beamX,6.03,beamZ,beamWidth,.12,.16,angle,'suspended cable-tray edge below far gantry','trim',true);
          if(segment%6===1)place('wall-switch',beamX,5.92,beamZ,beamWidth*.34,.065,.24,angle,'far-edge suspended service luminaire','accent',true);
        }
      }
    }
    edges.push(edgeProof);
  }
  return {segmentsAttempted,segmentsAccepted,overheadAttempted,overheadAccepted,edges,idea:WALL_IDEAS[environment]};
}
