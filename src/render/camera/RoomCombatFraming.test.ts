import {describe, it, expect} from 'vitest';
import * as T from 'three';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import type {RoomTemplate} from '../../game/roguelike/types';
import {CameraRig} from './CameraRig';
import {DepthRenderer} from '../DepthRenderer';
import {combatFocusTarget, COMBAT_VIEW_HEIGHT, protectPlayerFrame} from './CombatFraming';
import {HudCombatFraming} from './HudCombatFraming';
import {RoomCombatFraming, HERO_MIN_PIXELS, ROOM_OUTSIDE_LIMIT} from './RoomCombatFraming';

/** Circle clearance against the authored outer hull, including beveled edges. */
function insideHull(room:RoomTemplate, x:number, z:number):boolean {
  const boundary=room.boundary;
  if(!boundary)return x>=.5&&x<=room.width/32-.5&&z>=.5&&z<=room.height/32-.5;
  let inside=false;
  for(let n=0,p=boundary.length-1;n<boundary.length;p=n++){
    const a=boundary[n],b=boundary[p],ax=a.x/32,az=a.y/32,bx=b.x/32,bz=b.y/32;
    const t=T.MathUtils.clamp(((x-ax)*(bx-ax)+(z-az)*(bz-az))/((bx-ax)**2+(bz-az)**2),0,1);
    if(Math.hypot(x-ax-(bx-ax)*t,z-az-(bz-az)*t)<.5-1e-6)return false;
    if((az>z)!==(bz>z)&&x<(bx-ax)*(z-az)/(bz-az)+ax)inside=!inside;
  }
  return inside;
}

function positions(room:RoomTemplate):Array<[number,number]> {
  const w=room.width/32,d=room.height/32,result:Array<[number,number]>=[];
  for(const x of [.5,w*.25,w*.5,w*.75,w-.5]){
    for(const z of [.5,d*.25,d*.5,d*.75,d-.5])if(insideHull(room,x,z))result.push([x,z]);
  }
  const boundary=room.boundary;
  if(boundary)for(let n=0;n<boundary.length;n++){
    const a=boundary[n],b=boundary[(n+1)%boundary.length],dx=b.x-a.x,dz=b.y-a.y,length=Math.hypot(dx,dz);
    const x=(a.x+b.x)/64-dz/length*.6,z=(a.y+b.y)/64+dx/length*.6;
    if(insideHull(room,x,z))result.push([x,z]);
  }
  return result;
}

function makeCamera(width:number,height:number,perspective=true){
  const viewWidth=COMBAT_VIEW_HEIGHT*width/height;
  return perspective?new T.PerspectiveCamera(28,width/height,.1,160)
    :new T.OrthographicCamera(-viewWidth/2,viewWidth/2,COMBAT_VIEW_HEIGHT/2,-COMBAT_VIEW_HEIGHT/2,.1,160);
}

function reserveHud(hud:HudCombatFraming,width:number,height:number){
  hud.resize(width,height);
  hud.setInsets({top:182*height/1080,right:292*width/1920,bottom:120*height/1080,left:0});
}

describe('final room and hero camera constraints',()=>{
  it.each(Object.values(ROOM_TEMPLATES))('sweeps $id walls, aim and remote priority contacts',room=>{
    const point=new T.Vector3(),target=new T.Vector3(),w=room.width/32,d=room.height/32;
    for(const [width,height]of [[1920,1080],[1280,720],[900,900],[3440,1440]]){
      for(const perspective of [true,false])for(const [x,z]of positions(room)){
        for(const angle of [0,Math.PI*.5,Math.PI,Math.PI*1.5]){
          const camera=makeCamera(width,height,perspective),rig=new CameraRig();
          const hud=new HudCombatFraming(),final=new RoomCombatFraming();
          reserveHud(hud,width,height);
          const ex=T.MathUtils.clamp(x+Math.cos(angle)*12,.5,w-.5);
          const ez=T.MathUtils.clamp(z+Math.sin(angle)*12,.5,d-.5);
          hud.selectContacts(x,z,angle,[{id:1,x:ex*32,y:ez*32,radius:18,health:100,windupMs:100}]);
          combatFocusTarget(x,z,angle,ex,ez,false,false,point);
          hud.biasTarget(x,z,angle,false,false,point);
          rig.reset(point.x,point.z);rig.apply(camera,1,COMBAT_VIEW_HEIGHT,0);
          hud.center(camera,rig.focus,point,target);
          hud.protectEngagement(camera,rig.focus,x,z,.5,2.05,point,target);
          protectPlayerFrame(camera,rig.focus,x,z,.5,2.05,point,target,hud.viewport);
          final.apply(camera,rig.focus,x,z,.5,2.05,w,d,hud.viewport,height,1/60,false,room.boundary);
          const diag=final.diagnostics;
          const info=`${room.id} ${width}x${height} perspective=${perspective} ${x},${z} angle${angle} ${JSON.stringify(diag)}`;
          expect(diag.heroPixels,info).toBeGreaterThanOrEqual(HERO_MIN_PIXELS*height/1080-.5);
          if(!diag.smallX)expect(diag.outsideX,info).toBeLessThanOrEqual(ROOM_OUTSIDE_LIMIT);
          if(!diag.smallZ)expect(diag.outsideZ,info).toBeLessThanOrEqual(ROOM_OUTSIDE_LIMIT);
          if(!diag.smallX&&!diag.smallZ)expect(diag.outside,info).toBeLessThanOrEqual(ROOM_OUTSIDE_LIMIT);
          if(diag.smallX||diag.smallZ){
            if(diag.smallX)expect(diag.centeredX,info).toBe(true);
            if(diag.smallZ)expect(diag.centeredZ,info).toBe(true);
            const debug=final as unknown as {deckCorners(c:T.Camera,v:typeof hud.viewport):void;corners:Float64Array};
            debug.deckCorners(camera,hud.viewport);
            const xs=Array.from({length:4},(_,n)=>debug.corners[n*2]);
            const zs=Array.from({length:4},(_,n)=>debug.corners[n*2+1]);
            const rx=room.boundary?room.boundary.map(p=>p.x/32):[0,w];
            const rz=room.boundary?room.boundary.map(p=>p.y/32):[0,d];
            if(diag.smallX)expect((Math.min(...xs)+Math.max(...xs))*.5,info).toBeCloseTo((Math.min(...rx)+Math.max(...rx))*.5,4);
            if(diag.smallZ)expect((Math.min(...zs)+Math.max(...zs))*.5,info).toBeCloseTo((Math.min(...rz)+Math.max(...rz))*.5,4);
          }
          for(const dx of [-.5,.5])for(const dz of [-.5,.5])for(const y of [0,2.05]){
            point.set(x+dx,y,z+dz).project(camera);
            expect(point.x,info).toBeGreaterThanOrEqual(hud.viewport.left-1e-5);
            expect(point.x,info).toBeLessThanOrEqual(hud.viewport.right+1e-5);
            expect(point.y,info).toBeGreaterThanOrEqual(hud.viewport.bottom-1e-5);
            expect(point.y,info).toBeLessThanOrEqual(hud.viewport.top+1e-5);
          }
        }
      }
    }
  });

  it.each([false,true])('damps priority-pair changes without pops, reducedMotion=%s',reducedMotion=>{
    const width=1920,height=1080,camera=makeCamera(width,height),rig=new CameraRig();
    const hud=new HudCombatFraming(),final=new RoomCombatFraming(),point=new T.Vector3(),target=new T.Vector3();
    reserveHud(hud,width,height);
    let lastX=0,lastZ=0,lastZoom=0;
    for(let frame=0;frame<180;frame++){
      const phase=Math.floor(frame/30)%2;
      rig.reset(15+(phase?4:-4),14+(phase?3:-3));
      rig.apply(camera,phase?.5:1,COMBAT_VIEW_HEIGHT,0);
      hud.center(camera,rig.focus,point,target);
      final.apply(camera,rig.focus,15,14,.5,2.05,37.5,27.5,hud.viewport,height,1/60,reducedMotion);
      if(frame>0){
        expect(Math.abs(camera.position.x-lastX)).toBeLessThan(.65);
        expect(Math.abs(camera.position.z-lastZ)).toBeLessThan(.65);
        expect(Math.abs(camera.zoom-lastZoom)).toBeLessThan(.055);
      }
      expect(final.diagnostics.heroPixels).toBeGreaterThanOrEqual(99.5);
      lastX=camera.position.x;lastZ=camera.position.z;lastZoom=camera.zoom;
    }
  });

  it('retains a concave-hull receipt separately from the rectangular room limit',()=>{
    const camera=makeCamera(1920,1080),rig=new CameraRig(),hud=new HudCombatFraming(),final=new RoomCombatFraming();
    const room=ROOM_TEMPLATES['overload-floor'];
    reserveHud(hud,1920,1080);
    rig.reset(18.75,3.5);rig.apply(camera,1,COMBAT_VIEW_HEIGHT,0);
    hud.center(camera,rig.focus,new T.Vector3(),new T.Vector3());
    final.apply(camera,rig.focus,18.75,1.85,.5,2.05,room.width/32,room.height/32,hud.viewport,1080,1/60,false,room.boundary);
    expect(final.diagnostics.outside).toBeLessThanOrEqual(ROOM_OUTSIDE_LIMIT);
    // The north tip is locally narrower than the full room AABB. Do not claim
    // its real polygon coverage passed merely because rectangular bounds did.
    expect(final.diagnostics.hullOutside).toBeGreaterThan(ROOM_OUTSIDE_LIMIT);
  });

  it('refreshes contact-fit receipts against the final rendered matrix',()=>{
    const camera=makeCamera(1920,1080),rig=new CameraRig(),hud=new HudCombatFraming(),point=new T.Vector3();
    hud.resize(1920,1080);rig.reset(15,14);rig.apply(camera,1,COMBAT_VIEW_HEIGHT,0);
    hud.selectContacts(15,14,Math.PI*.5,[{id:7,x:15*32,y:26*32,radius:18,health:100}]);
    hud.diagnostics.fit=true;hud.refreshFit(camera,point);
    expect(hud.diagnostics.fit).toBe(false);
    expect(hud.diagnostics.pullback).toBe(camera.zoom);
    hud.selectContacts(15,14,0,[{id:8,x:17*32,y:14*32,radius:18,health:100}]);
    hud.refreshFit(camera,point);expect(hud.diagnostics.fit).toBe(true);
  });
  it('retains native pointer, visible and cached CSS player-bounds contracts after final constraints',()=>{
    const camera=makeCamera(1920,1080),rig=new CameraRig(),hud=new HudCombatFraming(),final=new RoomCombatFraming();
    const point=new T.Vector3(),target=new T.Vector3(),root=new T.Group();
    root.position.set(15,0,14);reserveHud(hud,1920,1080);
    rig.reset(15,14);rig.apply(camera,.5,COMBAT_VIEW_HEIGHT,0);hud.center(camera,rig.focus,point,target);
    final.apply(camera,rig.focus,15,14,.5,2.05,37.5,27.5,hud.viewport,1080,1/60,false);
    const rect={left:11,top:17,width:1920,height:1080};
    const probe=Object.assign(Object.create(DepthRenderer.prototype),{
      camera,cameraRig:rig,hudFraming:hud,viewportSize:{width:1920,height:1080},canvasRect:rect,
      canvas:{getBoundingClientRect:()=>rect},
      player:{root,height:2.05},visiblePoint:new T.Vector3(),screenPoint:point,screenTarget:target,
      raycaster:new T.Raycaster(),ground:new T.Plane(new T.Vector3(0,1,0),0),actors:new Map(),
    });
    const projected=new T.Vector3(16,0,13).project(camera);
    const pointer=probe.pointer(rect.left+(projected.x+1)*960,rect.top+(1-projected.y)*540);
    expect(pointer.x).toBeCloseTo(16*32,8);expect(pointer.y).toBeCloseTo(13*32,8);
    expect(probe.visible(15*32,14*32)).toBe(true);
    probe.canvas.getBoundingClientRect=()=>{throw Error('Player bounds must use cached CSS bounds');};
    const body=probe.playerScreenBounds(16);
    expect(body.left).toBeGreaterThanOrEqual(rect.left+hud.insets.left);
    expect(body.right).toBeLessThanOrEqual(rect.left+1920-hud.insets.right);
    expect(body.top).toBeGreaterThanOrEqual(rect.top+hud.insets.top);
    expect(body.bottom).toBeLessThanOrEqual(rect.top+1080-hud.insets.bottom);
  });

});
