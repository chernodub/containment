import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {environmentClock} from '../lighting/HotFixtureSurface';
import {IncidentPieces} from './Inc13StoryIncidents';
import {paintIncidentDeck} from './Inc13DeckPaint';
import type {OriginalKitInstance} from './OriginalShipKitAssets';

const dais = new T.Matrix4().makeScale(.64, .96, .78).setPosition(449 / 32, 0, 572 / 32);

export function inc13ManualPlacement(): OriginalKitInstance {
  return {
    pack: 'p11-inc13-manual', asset: 'burned-manual-dais', matrix: dais.clone(),
    purpose: 'P11 / burned-manual-dais', cutaway: false,
  };
}

export function addInc13Manual(root: T.Group): void {
  const frame=new IncidentPieces(), phosphor=new IncidentPieces(), failing=new IncidentPieces();
  // A sloped instrument bridge behind the original switch desk. The open
  // fourth bay exposes three insulated bus bars under its inspection lamp.
  for(let i=0;i<4;i++){
    const x=-54+i*34,h=84-Math.abs(1-i)*4;
    frame.box(x,h-22,-15,33,46,11,0x51616a);
    frame.face([[x-15,h,-9],[x+15,h,-9],[x+15,h-26,4],[x-15,h-26,4]],0x19262b);
    if(i<2){
      const screen=i===1?failing:phosphor;
      screen.face([[x-12,h-3,-4],[x+12,h-3,-4],[x+12,h-21,5],[x-12,h-21,5]],0x98c9cb);
      for(let j=0;j<3;j++)frame.box(x-7+j*6,h-12,2,3,2+j*2,2,0xadc1b8);
    }
    if(i===3)for(const offset of [-8,0,8]){
      phosphor.rod([x+offset,h-2,-8],[x+offset-2,h-22,4],1.6,0xbd985d);
    }
    frame.rod([x,2,-17],[x,h-7,-18],3,0x58676a);
  }
  // Shared kickplate and projecting switch shelf join the monitors in silhouette.
  frame.box(-2,13,0,128,24,14,0x41535a);
  frame.box(-3,30,7,135,8,28,0x809391);
  frame.box(-12,35,14,51,2,10,0x323c41);
  for(let i=0;i<7;i++)frame.box(-33+i*6,37,14,2,3,6,0xc9b99b);
  for(let i=0;i<3;i++){
    const x=7+i*9;frame.rod([x,34,12],[x-2,41+i*2,7],1.5,0xbfaa90);
  }
  frame.finish(root,'master-station',449,556).scale.x=.70;
  for(const bank of [phosphor,failing]){
    const lit=new T.MeshBasicMaterial({color:bank===failing?0x82c3b7:0xb5dbda,vertexColors:true,side:T.DoubleSide});
    const mesh=bank.finish(root,'station-phosphor',449,556,lit);
    mesh.scale.x=.70;mesh.castShadow=false;
    if(bank===failing)mesh.onBeforeRender=()=>{lit.color.setScalar(Math.sin(environmentClock.value*9)>.77?.22:.91);};

  }
  paintIncidentDeck(root,'room14-manual-cable',[548,385,111,147],c=>{
    // Floor return socket and the three leads from the hard-wired panel.
    c.fillStyle='#484f51';c.fillRect(574,509,26,15);
    c.fillStyle='#282f32';c.fillRect(578,512,17,8);
    c.lineCap='round';
    for(const offset of [-4,0,4]){
      c.save();c.translate(0,offset);
      const cable=new Path2D('M646 391 C652 422 603 412 608 450 S568 479 571 503 Q572 518 585 517');
      c.lineWidth=4;c.strokeStyle='#272828';c.stroke(cable);
      c.lineWidth=1.4;c.strokeStyle='#8b8c75';c.stroke(cable);c.restore();
    }
  });

  // Blender (x, y, z) exports to glTF (x, z, -y). These endpoints are the
  // two stripped conductor tips in manual.py, under the same transform as the dais.
  const points = [
    [-2.60, 1.65, .21],
    [-2.63, 1.67, .14],
    [-2.60, 1.64, .087],
    [-2.64, 1.66, .025],
    [-2.60, 1.65, -.03],
  ].map(([x, y, z]) => new T.Vector3(x, y, z).applyMatrix4(dais));
  const segments = points.slice(1).map((tip, i) => {
    const direction = tip.clone().sub(points[i]);
    const segment = new T.CylinderGeometry(.009, .009, direction.length() + .008, 5);
    segment.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), direction.normalize()));
    return segment.translate(...tip.clone().lerp(points[i], .5).toArray());
  });
  const geometry = mergeGeometries(segments, false)!;
  segments.forEach(segment => segment.dispose());
  const material = new T.MeshBasicMaterial({
    color: 0xd9efff, transparent: true, depthWrite: false, toneMapped: false,
  });
  material.userData.actorMaterial = true;
  const arc = new T.Mesh(geometry, material);
  arc.name = 'inc13-manual-conductor-arc';
  arc.onBeforeRender = () => {
    const t = environmentClock.value;
    const flicker = Math.sin(t * 53) + .55 * Math.sin(t * 89 + 1.7);
    material.opacity = flicker < -.35 ? .04 : .65 + .35 * Math.sin(t * 31) ** 2;
  };
  root.add(arc);
}
