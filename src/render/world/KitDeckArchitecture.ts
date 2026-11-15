import {SHIP_ARCHITECTURE_LAYOUTS} from '../../game/roguelike/shipArchitectureLayouts';
import type { RoomTemplate } from '../../game/roguelike/types';

type Reservation = {x:number;y:number;width:number;height:number};
type FloorPainter = {
  quad:(x:number,z:number,width:number,depth:number,angle:number,color:number,kind:string,y?:number)=>boolean;
  segment:(ax:number,az:number,bx:number,bz:number,width:number,color:number,kind:string,y?:number)=>boolean;
};
export type DeckArchitectureProof = {
  idea:string;bays:number;connections:number;triangles:number;baseArea:number;
  maxHeight:number;anchors:number[][];
};

/** Small access covers and interrupted cable feeds belong to real equipment.
 * The floor owner clips every stroke against the authored hull/void/solids. */
export function addKitDeckArchitecture(t:RoomTemplate,id:string,reservations:readonly Reservation[],p:FloorPainter):DeckArchitectureProof {
  const proof:DeckArchitectureProof={idea:'Equipment access covers with narrow wall feeds',bays:0,connections:0,triangles:0,baseArea:0,maxHeight:0,anchors:[]};
  if(Object.hasOwn(SHIP_ARCHITECTURE_LAYOUTS,id))return proof;
  if(!['residential-gallery','crew-checkpoint','transmission-chamber'].includes(id))return proof;
  const quad=(x:number,z:number,w:number,d:number,color:number,kind:string,y=.024)=>{
    if(proof.triangles>=800||!p.quad(x,z,w,d,0,color,kind,y))return false;
    proof.triangles+=2;proof.maxHeight=Math.max(proof.maxHeight,y*.75);return true;
  };
  for(const [i,r] of reservations.entries()){
    const x=(r.x+r.width*.5)/32;
    const top=(r.y+r.height*.5)<t.height*.5;
    const z=(top?r.y+r.height:r.y)/32+(top?.65:-.65);
    // A single lid, asymmetric latch and two bolts; no enclosing court frame.
    if(quad(x,z,.74,.48,0x39474b,'deck-access-bay',.020)){
      proof.bays++;proof.baseArea+=.74*.48;
      quad(x+.23,z,.04,.22,0x65716b,'deck-cover-latch',.028);
      for(const side of [-1,1])quad(x+side*.27,z-.15,.035,.035,0x70786e,'deck-cover-bolt',.028);
    }
    const edge=i%2===0?.6:t.width/32-.6;
    const steps=Math.ceil(Math.abs(x-edge)/.38);
    let connected=false;
    for(let n=0;n<steps;n++){
      const a=edge+(x-edge)*n/steps,b=edge+(x-edge)*(n+.87)/steps;
      if(p.segment(a,z,b,z,.055,0x39484c,'deck-frontage-feed',.022)){
        proof.triangles+=2;proof.maxHeight=Math.max(proof.maxHeight,.022*.75);connected=true;
      }
    }
    if(connected){proof.connections++;proof.anchors.push([edge,z,x,z]);}
  }
  return proof;
}
