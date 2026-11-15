import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {ROOM_STORY_ROUTE} from '../../game/roguelike/storyRooms';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import type {ShipEnvironment} from '../ShipEnvironments';
import {addKitPerimeter} from './KitPerimeter';
import {kitBoundsSupported,kitMarineSamples,kitOccludesMarine} from './KitSafety';

describe('continuous CC0 perimeter and far-edge overhead planning',()=>{
  it.each([...ROOM_STORY_ROUTE.map(room=>[room.templateId,room.environment] as const),['reactor-vault','reactor'] as const])('%s retains wall coverage without admitting a marine blocker',(id,environment)=>{
    const template=ROOM_TEMPLATES[id],unchanged=JSON.stringify(template),samples=kitMarineSamples(template);
    const accepted:{name:string;bounds:T.Box3;purpose:string}[]=[];
    const proof=addKitPerimeter(template,environment as ShipEnvironment,id,{
      place(name,x,y,z,width,height,depth,angle,purpose,_role,flat){
        // Every perimeter source uses explicit affine sizing. Its centered
        // footprint/base contract is independent of the author's fine details.
        expect(flat).toBe(true);
        const matrix=new T.Matrix4().makeRotationY(angle).setPosition(x,y,z);
        const bounds=new T.Box3(new T.Vector3(-width/2,0,-depth/2),new T.Vector3(width/2,height,depth/2)).applyMatrix4(matrix);
        if(!kitBoundsSupported(template,bounds)||kitOccludesMarine(bounds,samples))return false;
        accepted.push({name,bounds,purpose});return true;
      },
      box(){throw Error('Perimeter should use artist-authored kit faces');},
      pipe(a,b,radius){
        const bounds=new T.Box3().setFromPoints([a,b]).expandByScalar(radius);
        if(!kitBoundsSupported(template,bounds)||kitOccludesMarine(bounds,samples))return;
        accepted.push({name:'conduit',bounds,purpose:'connected service pipe'});
      },
    });
    expect(JSON.stringify(template)).toBe(unchanged);
    expect(proof.segmentsAttempted).toBeGreaterThan(30);
    expect(proof.segmentsAccepted).toBeGreaterThan(proof.segmentsAttempted*.75);
    expect(proof.edges.every(edge=>edge.attempted===0||edge.accepted>0),JSON.stringify(proof.edges)).toBe(true);
    expect(proof.overheadAttempted).toBeGreaterThan(0);
    expect(proof.overheadAccepted).toBeGreaterThan(0);
    const overhead=accepted.filter(item=>item.purpose.includes('overhead maintenance gantry'));
    expect(overhead.length).toBe(proof.overheadAccepted);
    expect(overhead.every(item=>item.bounds.min.y>=6)).toBe(true);
    expect(accepted.every(item=>!kitOccludesMarine(item.bounds,samples))).toBe(true);
  });
  it('leaves short articulated return joints to the exact hull instead of squeezing a cabinet into a notch',()=>{
    const t=ROOM_TEMPLATES['breached-loading-bay'],proof=addKitPerimeter(t,'cargo',t.id,{place(){return true;},box(){},pipe(){}});
    const short=t.boundary!.flatMap((a,i)=>{const b=t.boundary![(i+1)%t.boundary!.length];return Math.hypot(b.x-a.x,b.y-a.y)<48?[i]:[];});
    expect(short.length).toBeGreaterThan(0);for(const i of short)expect(proof.edges.some(e=>e.index===i&&e.attempted>0)).toBe(false);
    expect(proof.segmentsAccepted).toBeGreaterThan(30);
  });
  it('retains guard rejection rather than forcing density into the scene',()=>{
    const proof=addKitPerimeter(ROOM_TEMPLATES['residential-gallery'],'habitation','residential-gallery',{
      place(){return false;},box(){},pipe(){},
    });
    expect(proof.segmentsAttempted).toBeGreaterThan(30);
    expect(proof.segmentsAccepted).toBe(0);
    expect(proof.overheadAccepted).toBe(0);
  });
  it('leaves a deliberate doorway gap when an actual opening reaches the hull',()=>{
    const original=ROOM_TEMPLATES['residential-gallery'];
    const template={...original,spawn:{x:0,y:original.height*.5}};
    const proof=addKitPerimeter(template,'habitation','residential-gallery',{
      place(){return true;},box(){},pipe(){},
    });
    expect(proof.edges.reduce((sum,edge)=>sum+edge.doorwaySegments,0)).toBeGreaterThan(0);
  });
});
