import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import type {TemplateId} from '../../game/roguelike/types';
import {CameraRig} from './CameraRig';
import {combatFocusTarget,COMBAT_VIEW_HEIGHT,protectPlayerFrame} from './CombatFraming';
import {HudCombatFraming} from './HudCombatFraming';
import {RoomCombatFraming} from './RoomCombatFraming';

const walls:Array<{id:TemplateId;x:number;z:number}>=[
  {id:'communal-atrium',x:17.5,z:7.35},
  {id:'overload-floor',x:18.75,z:1.85},
  {id:'containment-annulus',x:18.75,z:1.85},
];

/** Replay the production camera order with a continuous marine path (2.4m/s north, <=.6m/s lateral).
 * Two fixed remote contacts exchange attack urgency every half second. */
describe('wall-adjacent priority-pair camera continuity',()=>{
  it.each(walls)('$id retains bounded per-frame zoom while the remote priority changes',wall=>{
    const results=[];
    for(const reducedMotion of [false,true]){
      const room=ROOM_TEMPLATES[wall.id],camera=new T.PerspectiveCamera(28,16/9,.1,160);
      const rig=new CameraRig(),hud=new HudCombatFraming(),final=new RoomCombatFraming();
      const point=new T.Vector3(),target=new T.Vector3(),desired=new T.Vector3();
      hud.resize(1920,1080);hud.setInsets({top:182,right:292,bottom:120,left:0});
      const startZ=wall.id==='communal-atrium'?10.5:wall.z+1.2;
      rig.reset(wall.x,startZ);
      let lastZoom=0,lastX=0,lastZ=0,worstZoom=0,worstPosition=0,worstFrame=0,worstBeforeZoom=0,worstAfterZoom=0,worstPlayerX=0,worstPlayerZ=0;
      let pairFrames=0,priorityChanges=0,lastPriority=-1,smallAxisFrames=0,smallAxisCorrectionCalls=0,shallowZoomFloor=0;
      const instrumented=final as unknown as {contain(...args:unknown[]):void};
      const originalContain=instrumented.contain.bind(final);
      instrumented.contain=(...args:unknown[])=>{
        originalContain(...args);
        const d=final.diagnostics;
        if((d.smallX&&!d.centeredX)||(d.smallZ&&!d.centeredZ))smallAxisCorrectionCalls++;
      };
      for(let frame=0;frame<180;frame++){
        const x=wall.x+(frame>60?.3*Math.sin((frame-60)/30):0);
        const z=startZ-Math.min(startZ-wall.z,Math.max(0,frame-60)*.04),angle=Math.PI*.5;
        const urgent=Math.floor(frame/30)%2;
        const contacts=[
          {id:1,x:(wall.x-11)*32,y:(wall.z+5)*32,radius:18,health:100,windupMs:urgent===0?300:0},
          {id:2,x:(wall.x+11)*32,y:(wall.z+5)*32,radius:18,health:100,windupMs:urgent===1?300:0},
        ];
        combatFocusTarget(x,z,angle,0,0,false,reducedMotion,desired);
        hud.selectContacts(x,z,angle,contacts);hud.biasTarget(x,z,angle,reducedMotion,false,desired);
        rig.update(1/60,desired.x,desired.z,0,reducedMotion);
        rig.apply(camera,1,COMBAT_VIEW_HEIGHT,0);hud.center(camera,rig.focus,point,target);
        hud.protectEngagement(camera,rig.focus,x,z,.5,2.05,point,target);
        protectPlayerFrame(camera,rig.focus,x,z,.5,2.05,point,target,hud.viewport);
        final.apply(camera,rig.focus,x,z,.5,2.05,room.width/32,room.height/32,hud.viewport,1080,1/60,reducedMotion,room.boundary,hud);
        if(hud.diagnostics.focusedPair){
          pairFrames++;
          if(lastPriority!==-1&&lastPriority!==hud.diagnostics.focusContactId)priorityChanges++;
          lastPriority=hud.diagnostics.focusContactId;
        }
        if(final.diagnostics.smallX||final.diagnostics.smallZ)smallAxisFrames++;
        shallowZoomFloor=Math.max(shallowZoomFloor,final.diagnostics.shallowZoomFloor);
        if(frame>0){
          const zoomDelta=Math.abs(camera.zoom-lastZoom);
          if(zoomDelta>worstZoom){worstZoom=zoomDelta;worstFrame=frame;worstBeforeZoom=lastZoom;worstAfterZoom=camera.zoom;worstPlayerX=x;worstPlayerZ=z;}
          worstPosition=Math.max(worstPosition,Math.hypot(camera.position.x-lastX,camera.position.z-lastZ));
        }
        lastZoom=camera.zoom;lastX=camera.position.x;lastZ=camera.position.z;
        expect(final.diagnostics.heroPixels).toBeGreaterThanOrEqual(99.5);
      }
      const receipt={room:wall.id,reducedMotion,worstZoom,worstPosition,worstFrame,worstBeforeZoom,worstAfterZoom,worstPlayerX,worstPlayerZ,pairFrames,priorityChanges,smallAxisFrames,smallAxisCorrectionCalls,shallowZoomFloor};
      results.push(receipt);
      expect(pairFrames,JSON.stringify(receipt)).toBeGreaterThan(0);
      if(wall.id==='communal-atrium'){
        expect(shallowZoomFloor,JSON.stringify(receipt)).toBeGreaterThan(0);
        expect(smallAxisCorrectionCalls,JSON.stringify(receipt)).toBe(0);
      }
      expect(priorityChanges,JSON.stringify(receipt)).toBeGreaterThanOrEqual(3);
      expect.soft(worstZoom,JSON.stringify(receipt)).toBeLessThan(.055);
      expect.soft(worstPosition,JSON.stringify(receipt)).toBeLessThan(.65);
    }
    if(process.env.C6_CAMERA_CONTINUITY_REPORT==='1')process.stdout.write(`${JSON.stringify(results)}\n`);
  });
  it('caches shallow-depth searches across translated lookAt poses and invalidates on viewport change',()=>{
    const camera=new T.PerspectiveCamera(28,16/9,.1,160),rig=new CameraRig(),hud=new HudCombatFraming();
    const final=new RoomCombatFraming(),point=new T.Vector3(),target=new T.Vector3();
    const room=ROOM_TEMPLATES['communal-atrium'];
    hud.resize(1920,1080);hud.setInsets({top:182,right:292,bottom:120,left:0});
    let depthQueries=0;
    const instrumented=final as unknown as {deckDepth(c:T.Camera,v:typeof hud.viewport):number};
    const originalDepth=instrumented.deckDepth.bind(final);
    instrumented.deckDepth=(c,v)=>{depthQueries++;return originalDepth(c,v);};
    const update=(frame:number)=>{
      const x=17.5+frame*.02,z=10.5-frame*.015;
      rig.reset(x,z);rig.apply(camera,.5,COMBAT_VIEW_HEIGHT,0);hud.center(camera,rig.focus,point,target);
      final.apply(camera,rig.focus,x,z,.5,2.05,room.width/32,room.height/32,hud.viewport,1080,1/60,false,room.boundary,hud);
    };
    update(0);
    const initialQueries=depthQueries;
    expect(initialQueries).toBeGreaterThan(0);
    expect(initialQueries).toBeLessThanOrEqual(12);
    expect(final.diagnostics.shallowZoomFloor).toBeGreaterThan(0);
    for(let frame=1;frame<=90;frame++)update(frame);
    expect(depthQueries).toBe(initialQueries);
    hud.setInsets({top:140,right:292,bottom:120,left:0});
    update(91);
    expect(depthQueries).toBeGreaterThan(initialQueries);
    expect(depthQueries-initialQueries).toBeLessThanOrEqual(12);
  });

  it('retains centered axes for genuinely smaller rooms that cannot fit the normal view',()=>{
    const camera=new T.PerspectiveCamera(28,16/9,.1,160),rig=new CameraRig(),hud=new HudCombatFraming();
    const final=new RoomCombatFraming(),point=new T.Vector3(),target=new T.Vector3();
    hud.resize(1920,1080);hud.setInsets({top:182,right:292,bottom:120,left:0});
    rig.reset(4.5,3);rig.apply(camera,1,COMBAT_VIEW_HEIGHT,0);hud.center(camera,rig.focus,point,target);
    final.apply(camera,rig.focus,4.5,3,.5,2.05,9,6,hud.viewport,1080,1/60,false);
    expect(final.diagnostics.shallowZoomFloor).toBe(0);
    expect(final.diagnostics.smallX).toBe(true);expect(final.diagnostics.centeredX).toBe(true);
    expect(final.diagnostics.smallZ).toBe(true);expect(final.diagnostics.centeredZ).toBe(true);
    expect(final.diagnostics.heroPixels).toBeGreaterThanOrEqual(99.5);
  });

});
