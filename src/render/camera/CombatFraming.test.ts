import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {ROOM_STORY_ROUTE} from '../../game/roguelike/storyRooms';
import {roomFocus} from '../roomFraming';
import {CameraRig} from './CameraRig';
import {combatFocusTarget,COMBAT_VIEW_HEIGHT,PLAYER_SAFE_INSET,protectPlayerFrame} from './CombatFraming';

describe('combat safe inset',()=>{
  it('bounds threat lookahead and honors reduced-motion aim suppression',()=>{
    const out=new T.Vector3();
    expect(combatFocusTarget(1,2,0,100,100,false,true,out).toArray()).toEqual([1,0,2]);
    combatFocusTarget(1,2,0,100,100,true,false,out);
    expect(Math.hypot(out.x-1,out.z-2)).toBeLessThanOrEqual(2.11);
  });

  describe.each(['orthographic','perspective'])('%s safe inset',projection=>{
  it.each([[1920,1080],[1280,720],[1280,900],[2560,1440],[600,600],[800,1000]])('keeps every room edge and corner inside the central inset at %ix%i',(width,height)=>{
    const point=new T.Vector3(),target=new T.Vector3(),desired=new T.Vector3();
      const view=height>width?18:COMBAT_VIEW_HEIGHT,viewWidth=view*width/height;
      const camera=projection==='perspective'?new T.PerspectiveCamera(28,width/height,.1,160):new T.OrthographicCamera(-viewWidth/2,viewWidth/2,view/2,-view/2,.1,160);
      for(const story of ROOM_STORY_ROUTE){
        const room=ROOM_TEMPLATES[story.templateId],w=room.width/32,d=room.height/32;
        for(const x of [.5,w/2,w-.5])for(const z of [.5,d/2,d-.5])for(const angle of [0,Math.PI*.5,Math.PI,Math.PI*1.5]){
          combatFocusTarget(x,z,angle,w-x,d-z,false,false,desired);
          const framed=roomFocus(desired.x,desired.z,w,d,viewWidth,view,room.id);
          const rig=new CameraRig();rig.reset(framed.x,framed.z);rig.kick(angle,.35);rig.addTrauma(1);rig.punch(.055,240);
          rig.apply(camera,1,view);
          protectPlayerFrame(camera,rig.focus,x,z,.5,2.2,point,target);
          for(const dx of [-.5,.5])for(const dz of [-.5,.5])for(const y of [0,2.2]){
            point.set(x+dx,y,z+dz).project(camera);
            expect(Math.abs(point.x),`${room.id} horizontal`).toBeLessThanOrEqual(PLAYER_SAFE_INSET.x+1e-5);
            expect(Math.abs(point.y),`${room.id} vertical`).toBeLessThanOrEqual(PLAYER_SAFE_INSET.y+1e-5);
          }
        }
      }
  });
  });

  it('centers oversized desktop/debug envelopes with a bounded fallback',()=>{
    const camera=new T.OrthographicCamera(-1,1,1,-1,.1,160),rig=new CameraRig();rig.reset(0,0);rig.apply(camera,1,2);
    const p=new T.Vector3(),t=new T.Vector3();protectPlayerFrame(camera,rig.focus,0,0,1,3,p,t);
    const a=new T.Vector3(-1,0,-1).project(camera),b=new T.Vector3(1,3,1).project(camera);
    expect(Math.abs((a.x+b.x)*.5)).toBeLessThan(.02);
    expect(camera.position.toArray().every(Number.isFinite)).toBe(true);
  });

  it.each(['orthographic','perspective'])('recovers an edge-pinned marine after a large framing displacement with %s',projection=>{
    const view=COMBAT_VIEW_HEIGHT,width=view*16/9;
    const camera=projection==='perspective'?new T.PerspectiveCamera(28,16/9,.1,160):new T.OrthographicCamera(-width/2,width/2,view/2,-view/2,.1,160);
    const rig=new CameraRig();rig.reset(15,14);rig.apply(camera,1,view);
    const p=new T.Vector3(),t=new T.Vector3();
    expect(protectPlayerFrame(camera,rig.focus,.5,26,.5,2.2,p,t)).toBe(true);
    for(const dx of [-.5,.5])for(const dz of [-.5,.5])for(const y of [0,2.2]){
      p.set(.5+dx,y,26+dz).project(camera);
      expect(Math.abs(p.x)).toBeLessThanOrEqual(PLAYER_SAFE_INSET.x+1e-5);
      expect(Math.abs(p.y)).toBeLessThanOrEqual(PLAYER_SAFE_INSET.y+1e-5);
    }
  });

  it('reclaims room interior at the Armory spawn while retaining the central actor inset',()=>{
    const room=ROOM_TEMPLATES.armory,view=COMBAT_VIEW_HEIGHT,width=view*16/9;
    const focus=roomFocus(room.spawn.x/32,room.spawn.y/32,room.width/32,room.height/32,width,view,room.id);
    const camera=new T.PerspectiveCamera(28,16/9,.1,160),rig=new CameraRig();
    rig.reset(focus.x,focus.z);rig.apply(camera,1,view);
    const player=new T.Vector3(room.spawn.x/32,0,room.spawn.y/32).project(camera);
    const hull=new T.Vector3(0,0,room.spawn.y/32).project(camera);
    const marineX=(player.x+1)*.5,hullX=(hull.x+1)*.5;
    expect(marineX).toBeGreaterThan(.29);expect(marineX).toBeLessThan(.36);
    expect(hullX).toBeGreaterThan(.10);expect(hullX).toBeLessThan(.24);
  });
});
