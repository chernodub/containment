import {type DrawnMarineEnvelope} from './DrawnMarineEnvelope';
import {MARINE_FRAME_MARGIN_CSS,MARINE_FRAMING_FLOOR,MARINE_ENVELOPE_POINTS,marineEnvelopePoint} from './MarineFramingEnvelope';
import * as T from 'three';
import {type CombatViewport,type HudCombatFraming} from './HudCombatFraming';

type Boundary = readonly Readonly<{x:number;y:number}>[];
type Camera = T.OrthographicCamera | T.PerspectiveCamera;

/** Final presentation limits, measured in CSS pixels at the reference height. */
export const HERO_MIN_PIXELS = 100;
export const HERO_EMERGENCY_PIXELS = HERO_MIN_PIXELS*.85;
export const HERO_NORMAL_PIXELS = 122;
export const ROOM_OUTSIDE_LIMIT = .22;

/** Constrain the actual camera after threat and HUD framing. No scene/DOM reads. */
export class RoomCombatFraming {
  private readonly point = new T.Vector3();
  private readonly target = new T.Vector3();
  private readonly corners = new Float64Array(8);
  private readonly polygonA = new Float64Array(128);
  private readonly polygonB = new Float64Array(128);
  private readonly boundsPolygon = [{x:0,y:0},{x:0,y:0},{x:0,y:0},{x:0,y:0}];
  private ready = false;
  private bodyPaddingY = 0;
  private heroHeight = 0;
  private marineAngle = 0;
  private envelope?:DrawnMarineEnvelope;
  private heroFloor = HERO_MIN_PIXELS;
  private shallowZoomFloor = 0;
  private floorDepth = -1;
  private floorHeroHeight = -1;
  private floorCameraHeight = -1;
  private floorCameraUpY = -1;
  private floorCameraUpZ = -1;
  private floorProjectionTop = -1;
  private floorProjectionBottom = -1;
  private floorViewportTop = -1;
  private floorViewportBottom = -1;
  private roomWidth = 0;
  private roomDepth = 0;
  private x = 0;
  private z = 0;
  private vx = 0;
  private vz = 0;
  private zoom = 1;
  private zoomVelocity = 0;
  private remoteProgress = false;
  readonly diagnostics = {emergencyPullback:false,heroPixels:0, outside:0, hullOutside:0, heroBoundsPixels:0, outsideLimit:ROOM_OUTSIDE_LIMIT, centeredX:false, centeredZ:false, smallX:false, smallZ:false, outsideX:0, outsideZ:0, shallowZoomFloor:0};

  reset():void { this.ready = false; this.floorDepth = -1; this.remoteProgress=false; }

  /** Keep the marine legible; nearby walls take precedence over a remote threat. */
  apply(camera:Camera, focus:T.Vector3, x:number, z:number, radius:number, height:number,
    roomWidth:number, roomDepth:number, viewport:CombatViewport, cssHeight:number,
    dt:number, reducedMotion:boolean, boundary?:Boundary, engagement?:HudCombatFraming,bodyHeight=height,marineAngle=0,envelope?:DrawnMarineEnvelope):void {
    this.envelope=envelope;
    this.heroFloor=HERO_MIN_PIXELS;this.diagnostics.emergencyPullback=false;
    this.heroHeight=bodyHeight;this.marineAngle=marineAngle;
    this.bodyPaddingY=MARINE_FRAME_MARGIN_CSS*2/Math.max(1,cssHeight);
    let roomLeft=0,roomTop=0,roomRight=roomWidth,roomBottom=roomDepth;
    if(boundary?.length){roomLeft=roomTop=Infinity;roomRight=roomBottom=-Infinity;for(const p of boundary){roomLeft=Math.min(roomLeft,p.x/32);roomRight=Math.max(roomRight,p.x/32);roomTop=Math.min(roomTop,p.y/32);roomBottom=Math.max(roomBottom,p.y/32);}}
    const roomZoomFloor=this.minimumShallowZoom(camera,viewport,roomBottom-roomTop,height);
    this.diagnostics.shallowZoomFloor=roomZoomFloor;
    this.point.set(x,0,z).project(camera);
    this.target.set(x,this.heroHeight,z).project(camera);
    const heroSpan = Math.max(.0001,Math.abs(this.target.y-this.point.y)*cssHeight*.5);
    const minimum = camera.zoom * (HERO_MIN_PIXELS*cssHeight/1080) / heroSpan;
    const normal = camera.zoom * (HERO_NORMAL_PIXELS*cssHeight/1080) / heroSpan;
    // The existing pair solver may request a pullback, but cannot spend hero size.
    const threatRoom=T.MathUtils.clamp((camera.zoom-.85)/.15,0,1);
    const desiredZoom = Math.max(roomZoomFloor,T.MathUtils.lerp(minimum,normal,threatRoom));
    const fresh = !this.ready || this.roomWidth!==roomWidth || this.roomDepth!==roomDepth;
    const previousX=this.x,previousZ=this.z,previousZoom=this.zoom;
    const urgent=engagement?.needsFinalFit(x,z)??false;
    const remote=!urgent&&(engagement?.hasEngagement===true||this.remoteProgress);
    if(fresh){this.x=camera.position.x;this.z=camera.position.z;this.zoom=desiredZoom;this.vx=this.vz=this.zoomVelocity=0;this.ready=true;}
    this.roomWidth=roomWidth;this.roomDepth=roomDepth;
    const step=Math.max(0,Math.min(.05,dt)),omega=reducedMotion?6:8,decay=Math.exp(-omega*step);
    // CameraRig already smooths translation. A second spring here feeds its
    // lag back into CameraRig.focus and can pin combat near the HUD for seconds.
    // Consume its current position directly; only zoom and constrained remote
    // engagement progression retain their own response limits.
    this.x=camera.position.x;this.z=camera.position.z;this.vx=this.vz=0;
    const zoomStep=this.spring(this.zoom,this.zoomVelocity,desiredZoom,omega,step,decay);this.zoom=zoomStep[0];this.zoomVelocity=zoomStep[1];
    camera.zoom=Math.max(this.zoom,roomZoomFloor);camera.updateProjectionMatrix();
    this.contain(camera,focus,x,z,radius,height,roomLeft,roomTop,roomRight,roomBottom,viewport);
    // If a shallow deck fits but its actor head does not, use a modest closer
    // view until the deck once again extends beyond the usable frame. This
    // avoids claiming a centered small room after body clearance moved it.
    for(let pass=0;pass<14&&((this.diagnostics.smallX&&!this.diagnostics.centeredX)||(this.diagnostics.smallZ&&!this.diagnostics.centeredZ));pass++){
      this.point.set(x,0,z).project(camera);this.target.set(x,this.heroHeight,z).project(camera);
      if(Math.abs(this.target.y-this.point.y)*540>=150)break;
      camera.zoom*=Math.min(1.025,150/Math.max(.0001,Math.abs(this.target.y-this.point.y)*540));camera.updateProjectionMatrix();
      this.contain(camera,focus,x,z,radius,height,roomLeft,roomTop,roomRight,roomBottom,viewport);
    }
    const rectangle=this.boundsPolygon;
    rectangle[0].x=rectangle[3].x=roomLeft*32;rectangle[1].x=rectangle[2].x=roomRight*32;
    rectangle[0].y=rectangle[1].y=roomTop*32;rectangle[2].y=rectangle[3].y=roomBottom*32;
    let outside=this.outsideFraction(camera,roomWidth,roomDepth,viewport,rectangle);
    // At a north corner the head needs a narrow strip beyond the deck. Reclaim
    // that strip with a bounded pullback, stopping at the hero's size floor.
    for(let pass=0;pass<16&&outside>ROOM_OUTSIDE_LIMIT&&!this.diagnostics.centeredX&&!this.diagnostics.centeredZ;pass++){
      this.heroFloor=HERO_EMERGENCY_PIXELS;this.diagnostics.emergencyPullback=true;
      const oldZoom=camera.zoom;
      camera.zoom=Math.max(roomZoomFloor,camera.zoom*.97);camera.updateProjectionMatrix();
      this.contain(camera,focus,x,z,radius,height,roomLeft,roomTop,roomRight,roomBottom,viewport);
      outside=this.outsideFraction(camera,roomWidth,roomDepth,viewport,rectangle);
      if(camera.zoom>=oldZoom-1e-6)break;
    }
    // A pullback can reveal the far edge of a narrow deck. Try a bounded
    // closer view too, retaining it only when joint body/room coverage improves.
    if(urgent&&engagement)engagement.refreshFit(camera,this.point);
    const preserveUrgentFit=urgent&&engagement?.diagnostics.fit===true;
    for(let pass=0;pass<8&&outside>ROOM_OUTSIDE_LIMIT;pass++){
      const oldX=camera.position.x,oldZ=camera.position.z,oldZoom=camera.zoom,oldOutside=outside;
      camera.zoom*=1.02;camera.updateProjectionMatrix();
      this.contain(camera,focus,x,z,radius,height,roomLeft,roomTop,roomRight,roomBottom,viewport,true);
      const candidate=this.outsideFraction(camera,roomWidth,roomDepth,viewport,rectangle);
      if(preserveUrgentFit&&engagement)engagement.refreshFit(camera,this.point);
      if(candidate<oldOutside-1e-6&&(!preserveUrgentFit||engagement?.diagnostics.fit)){outside=candidate;continue;}
      this.move(camera,focus,oldX-camera.position.x,oldZ-camera.position.z);camera.zoom=oldZoom;camera.updateProjectionMatrix();
      this.validPose(camera,x,z,radius,height,roomLeft,roomTop,roomRight,roomBottom,viewport);if(engagement)engagement.refreshFit(camera,this.point);break;
    }
    // The spring/room correction can undo the earlier HUD solve even when a
    // nearby fight fits. Solve once more against the rendered pose, with the
    // hero floor fixed and the room/body constraints reapplied after translation.
    if(urgent&&engagement){
      engagement.refreshFit(camera,this.point);
      for(let pass=0;pass<8&&!engagement.diagnostics.fit;pass++){
        const oldX=camera.position.x,oldZ=camera.position.z,oldZoom=camera.zoom;
        this.point.set(x,0,z).project(camera);this.target.set(x,this.heroHeight,z).project(camera);
        const span=Math.max(.0001,Math.abs(this.target.y-this.point.y)*540);
        const minimumZoom=Math.max(roomZoomFloor,camera.zoom*this.heroFloor/span);
        // A group can fit the viewport at this zoom while its required pan
        // exceeds the room allowance. Retrying that same pan cannot progress:
        // spend the available hero-size pullback before the next joint attempt.
        if(pass>0){camera.zoom=minimumZoom;camera.updateProjectionMatrix();}
        engagement.protectEngagement(camera,focus,x,z,radius,height,this.point,this.target,minimumZoom,true,pass>0?MARINE_FRAME_MARGIN_CSS:undefined,pass>1);
        this.contain(camera,focus,x,z,radius,height,roomLeft,roomTop,roomRight,roomBottom,viewport,true);
        this.setRectangle(roomLeft,roomTop,roomRight,roomBottom);
        const candidateOutside=this.outsideFraction(camera,roomWidth,roomDepth,viewport,rectangle);
        if((!this.diagnostics.smallX&&!this.diagnostics.smallZ&&candidateOutside>ROOM_OUTSIDE_LIMIT+1e-6)
          ||this.diagnostics.smallX&&!this.diagnostics.centeredX||this.diagnostics.smallZ&&!this.diagnostics.centeredZ){
          this.move(camera,focus,oldX-camera.position.x,oldZ-camera.position.z);camera.zoom=oldZoom;camera.updateProjectionMatrix();
          this.contain(camera,focus,x,z,radius,height,roomLeft,roomTop,roomRight,roomBottom,viewport);
          engagement.refreshFit(camera,this.point);continue;
        }
        outside=candidateOutside;engagement.refreshFit(camera,this.point,true);
      }
      engagement.refreshFit(camera,this.point);
    }
    // A remote target may need several metres of legal room-margin pan. Keep
    // advancing from the last rendered pose instead of restarting at the room's
    // zero-outside clamp each frame, then cap the actual presented movement.
    // Limit translation of the resolved nearby fit as well as remote progression.
    if((remote||urgent)&&!fresh&&engagement){
      const baseX=camera.position.x,baseZ=camera.position.z,baseZoom=camera.zoom;
      if(remote&&engagement.hasEngagement){
        this.move(camera,focus,previousX-camera.position.x,previousZ-camera.position.z);
        camera.zoom=previousZoom;camera.updateProjectionMatrix();
        engagement.refreshFit(camera,this.point);
        for(let padding=0;padding<1&&!engagement.diagnostics.fit;padding++){
          const edge=MARINE_FRAME_MARGIN_CSS;
          for(let pass=0;pass<3&&!engagement.diagnostics.fit;pass++){
            this.point.set(x,0,z).project(camera);this.target.set(x,this.heroHeight,z).project(camera);
            const span=Math.max(.0001,Math.abs(this.target.y-this.point.y)*540);
            engagement.protectEngagement(camera,focus,x,z,radius,height,this.point,this.target,Math.max(roomZoomFloor,camera.zoom*this.heroFloor/span),true,edge);
            this.contain(camera,focus,x,z,radius,height,roomLeft,roomTop,roomRight,roomBottom,viewport,true,edge*2/cssHeight);
            engagement.refreshFit(camera,this.point);
          }
        }
      }else{
        this.move(camera,focus,baseX-camera.position.x,baseZ-camera.position.z);camera.zoom=baseZoom;camera.updateProjectionMatrix();
      }
      const candidateX=camera.position.x,candidateZ=camera.position.z,candidateZoom=camera.zoom;
      const distance=Math.hypot(candidateX-previousX,candidateZ-previousZ);
      const elapsed=Math.max(0,Math.min(1,dt*60)),positionLimit=(reducedMotion?.25:.5)*elapsed,zoomLimit=(reducedMotion?.02:.04)*elapsed;
      let accepted=false;
      for(let goal=0;goal<2&&!accepted;goal++){
        const goalX=goal===0?candidateX:baseX,goalZ=goal===0?candidateZ:baseZ,goalZoom=goal===0?candidateZoom:baseZoom;
        const length=Math.hypot(goalX-previousX,goalZ-previousZ);
        let fraction=Math.min(1,length>0?positionLimit/length:1);
        for(let attempt=0;attempt<10;attempt++){
          this.move(camera,focus,previousX+(goalX-previousX)*fraction-camera.position.x,previousZ+(goalZ-previousZ)*fraction-camera.position.z);
          // Hero scale follows the current player depth independently of the
          // long pan fraction; moving at a100px floor must not freeze the pose.
          camera.zoom=previousZoom+T.MathUtils.clamp(goalZoom-previousZoom,-zoomLimit,zoomLimit);camera.updateProjectionMatrix();
          this.point.set(x,0,z).project(camera);this.target.set(x,this.heroHeight,z).project(camera);
          const span=Math.max(.0001,Math.abs(this.target.y-this.point.y)*540);
          if(span<this.heroFloor){camera.zoom*=this.heroFloor/span;camera.updateProjectionMatrix();}
      if(span>150){camera.zoom*=150/span;camera.updateProjectionMatrix();this.zoomVelocity=Math.min(0,this.zoomVelocity);}
          this.contain(camera,focus,x,z,radius,height,roomLeft,roomTop,roomRight,roomBottom,viewport,true,this.bodyPaddingY);
          const bounded=Math.hypot(camera.position.x-previousX,camera.position.z-previousZ)<=positionLimit+1e-6&&Math.abs(camera.zoom-previousZoom)<=zoomLimit+1e-6;
          if(this.validPose(camera,x,z,radius,height,roomLeft,roomTop,roomRight,roomBottom,viewport)&&bounded){accepted=true;break;}
          fraction*=.5;
        }
      }
      if(!accepted){
        this.move(camera,focus,previousX-camera.position.x,previousZ-camera.position.z);camera.zoom=previousZoom;camera.updateProjectionMatrix();
        if(!this.validPose(camera,x,z,radius,height,roomLeft,roomTop,roomRight,roomBottom,viewport)){
          // A changed player/viewport can invalidate the old pose. Keep the
          // existing valid body/room result instead of holding an unsafe frame.
          this.move(camera,focus,baseX-camera.position.x,baseZ-camera.position.z);camera.zoom=baseZoom;camera.updateProjectionMatrix();
          this.validPose(camera,x,z,radius,height,roomLeft,roomTop,roomRight,roomBottom,viewport);
        }
      }
      this.setRectangle(roomLeft,roomTop,roomRight,roomBottom);
      outside=this.outsideFraction(camera,roomWidth,roomDepth,viewport,rectangle);
      engagement.refreshFit(camera,this.point);
      this.vx=this.vz=this.zoomVelocity=0;
      this.remoteProgress=remote&&(engagement.hasEngagement||distance>.001||Math.abs(candidateZoom-previousZoom)>.0001);
    }else this.remoteProgress=remote;
    // Final pose safety follows every room/remote clamp; perspective extents
    // are remeasured to convergence rather than spending the16px margin.
    this.protectBody(camera,focus,x,z,radius,height,viewport);
    const safeX=camera.position.x,safeZ=camera.position.z,safeZoom=camera.zoom;
    this.protectBody(camera,focus,x,z,radius,height,viewport,undefined,true);
    if(camera.zoom!==safeZoom||!this.validPose(camera,x,z,radius,height,roomLeft,roomTop,roomRight,roomBottom,viewport)){
      this.move(camera,focus,safeX-camera.position.x,safeZ-camera.position.z);
      if(camera.zoom!==safeZoom){camera.zoom=safeZoom;camera.updateProjectionMatrix();}
      this.validPose(camera,x,z,radius,height,roomLeft,roomTop,roomRight,roomBottom,viewport);
    }
    this.setRectangle(roomLeft,roomTop,roomRight,roomBottom);
    outside=this.outsideFraction(camera,roomWidth,roomDepth,viewport,rectangle);
    this.x=camera.position.x;this.z=camera.position.z;this.zoom=camera.zoom;
    this.point.set(x,0,z).project(camera);this.target.set(x,this.heroHeight,z).project(camera);
    this.diagnostics.heroPixels=Math.abs(this.target.y-this.point.y)*cssHeight*.5;
    this.diagnostics.outside=outside;
    this.diagnostics.hullOutside=this.outsideFraction(camera,roomWidth,roomDepth,viewport,boundary);
    let top=-Infinity,bottom=Infinity;
    for(let sample=0;sample<(this.envelope?.count||MARINE_ENVELOPE_POINTS);sample++){
      if(this.envelope?.count)this.envelope.point(this.point,sample);else marineEnvelopePoint(this.point,sample,x,z,this.marineAngle);this.point.project(camera);top=Math.max(top,this.point.y);bottom=Math.min(bottom,this.point.y);
    }
    this.diagnostics.heroBoundsPixels=(top-bottom)*cssHeight*.5;
    this.deckCorners(camera,viewport);
    const minX=Math.min(this.corners[0],this.corners[2],this.corners[4],this.corners[6])-.001;
    const maxX=Math.max(this.corners[0],this.corners[2],this.corners[4],this.corners[6])+.001;
    const minZ=Math.min(this.corners[1],this.corners[3],this.corners[5],this.corners[7])-.001;
    const maxZ=Math.max(this.corners[1],this.corners[3],this.corners[5],this.corners[7])+.001;
    this.setRectangle(roomLeft,minZ,roomRight,maxZ);
    this.diagnostics.outsideX=this.outsideFraction(camera,roomWidth,roomDepth,viewport,rectangle);
    this.setRectangle(minX,roomTop,maxX,roomBottom);
    this.diagnostics.outsideZ=this.outsideFraction(camera,roomWidth,roomDepth,viewport,rectangle);
  }

  /** A shallow room that fits the normal hero view should keep that framing
   * through remote-threat changes. Derive its floor from deck-ray geometry,
   * leaving genuinely smaller rooms on their existing centered-axis path.
   * Cached inputs exclude translation/zoom, so live updates do no extra search. */
  private minimumShallowZoom(camera:Camera,viewport:CombatViewport,depth:number,heroHeight:number):number {
    const perspective=camera instanceof T.PerspectiveCamera;
    const projectionTop=perspective?camera.fov:camera.top;
    const projectionBottom=perspective?0:camera.bottom;
    const upY=camera.matrixWorld.elements[5],upZ=camera.matrixWorld.elements[6];
    if(this.floorDepth===depth&&this.floorHeroHeight===heroHeight&&Math.abs(this.floorCameraHeight-camera.position.y)<1e-8
      &&Math.abs(this.floorCameraUpY-upY)<1e-10&&Math.abs(this.floorCameraUpZ-upZ)<1e-10&&this.floorProjectionTop===projectionTop
      &&this.floorProjectionBottom===projectionBottom&&this.floorViewportTop===viewport.top
      &&this.floorViewportBottom===viewport.bottom)return this.shallowZoomFloor;
    this.floorDepth=depth;this.floorHeroHeight=heroHeight;this.floorCameraHeight=camera.position.y;
    this.floorCameraUpY=upY;this.floorCameraUpZ=upZ;this.floorProjectionTop=projectionTop;
    this.floorProjectionBottom=projectionBottom;this.floorViewportTop=viewport.top;this.floorViewportBottom=viewport.bottom;
    const originalZoom=camera.zoom;
    camera.zoom=1;camera.updateProjectionMatrix();
    this.deckPoint(camera,viewport.centerX,viewport.centerY);
    this.target.copy(this.point);this.target.y+=heroHeight;
    this.point.project(camera);this.target.project(camera);
    const referenceSpan=Math.max(.0001,Math.abs(this.target.y-this.point.y)*540);
    let low=this.heroFloor/referenceSpan,high=HERO_NORMAL_PIXELS/referenceSpan;
    const targetDepth=depth*.96;
    this.shallowZoomFloor=0;
    camera.zoom=high;camera.updateProjectionMatrix();
    const fitsNormal=this.deckDepth(camera,viewport)<=targetDepth;
    if(fitsNormal){
      camera.zoom=low;camera.updateProjectionMatrix();
      if(this.deckDepth(camera,viewport)>targetDepth){
        for(let pass=0;pass<10;pass++){
          const middle=(low+high)*.5;
          camera.zoom=middle;camera.updateProjectionMatrix();
          if(this.deckDepth(camera,viewport)>targetDepth)low=middle;else high=middle;
        }
        this.shallowZoomFloor=high;
      }
    }
    camera.zoom=originalZoom;camera.updateProjectionMatrix();
    return this.shallowZoomFloor;
  }

  private deckDepth(camera:Camera,viewport:CombatViewport):number {
    this.deckPoint(camera,viewport.centerX,viewport.top);
    const top=this.point.z;
    this.deckPoint(camera,viewport.centerX,viewport.bottom);
    return Math.abs(this.point.z-top);
  }

  /** Test the actual intermediate pose, without moving it to another clamp. */
  private validPose(camera:Camera,x:number,z:number,radius:number,height:number,left:number,top:number,right:number,bottom:number,v:CombatViewport):boolean {
    this.point.set(x,0,z).project(camera);this.target.set(x,this.heroHeight,z).project(camera);
    let valid=Math.abs(this.target.y-this.point.y)*540>=this.heroFloor-1e-6;
    for(let sample=0;sample<(this.envelope?.count||MARINE_ENVELOPE_POINTS);sample++){
      if(this.envelope?.count)this.envelope.point(this.point,sample);else marineEnvelopePoint(this.point,sample,x,z,this.marineAngle);this.point.project(camera);
      const aspect=camera instanceof T.PerspectiveCamera?camera.aspect:(camera.right-camera.left)/(camera.top-camera.bottom),px=this.bodyPaddingY/aspect,py=this.bodyPaddingY;
      const pl=px*(v.left>-.99999?.5:1),pr=px*(v.right<.99999?.5:1),pt=py*(v.top<.99999?.5:1),pb=py*(v.bottom>-.99999?.5:1);
      if(this.point.x<v.left+pl-1e-6||this.point.x>v.right-pr+1e-6||this.point.y<v.bottom+pb-1e-6||this.point.y>v.top-pt+1e-6)valid=false;
    }
    this.deckCorners(camera,v);
    let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
    for(let n=0;n<4;n++){minX=Math.min(minX,this.corners[n*2]);maxX=Math.max(maxX,this.corners[n*2]);minZ=Math.min(minZ,this.corners[n*2+1]);maxZ=Math.max(maxZ,this.corners[n*2+1]);}
    const d=this.diagnostics;
    d.smallX=maxX-minX>right-left;d.smallZ=maxZ-minZ>bottom-top;
    d.centeredX=d.smallX&&Math.abs((minX+maxX-left-right)*.5)<1e-5;
    d.centeredZ=d.smallZ&&Math.abs((minZ+maxZ-top-bottom)*.5)<1e-5;
    const roomFits=this.fitsRoomMargin(camera,v,left,top,right,bottom,minX,maxX,minZ,maxZ,d.centeredX,d.centeredZ);
    return valid&&roomFits;
  }

  private deckPoint(camera:Camera,x:number,y:number):void {
    this.point.set(x,y,0).unproject(camera);
    if(camera instanceof T.PerspectiveCamera){
      this.point.sub(camera.position).multiplyScalar(-camera.position.y/this.point.y).add(camera.position);
    }else{
      this.target.set(0,0,-1).transformDirection(camera.matrixWorld);
      this.point.addScaledVector(this.target,-this.point.y/this.target.y);
    }
  }

  private setRectangle(left:number,top:number,right:number,bottom:number):void {
    const p=this.boundsPolygon;
    p[0].x=p[3].x=left*32;p[1].x=p[2].x=right*32;
    p[0].y=p[1].y=top*32;p[2].y=p[3].y=bottom*32;
  }

  private contain(camera:Camera,focus:T.Vector3,x:number,z:number,radius:number,height:number,
    roomLeft:number,roomTop:number,roomRight:number,roomBottom:number,viewport:CombatViewport,engagementMargin=false,bodyEdgePaddingY?:number):void {
    if(!engagementMargin)this.protectBody(camera,focus,x,z,radius,height,viewport,bodyEdgePaddingY,true);
    // Alternate room coverage and body clearance at bevels and corners.
    for(let pass=0;pass<12;pass++){
      if(engagementMargin)this.protectBody(camera,focus,x,z,radius,height,viewport,bodyEdgePaddingY);
      this.point.set(x,0,z).project(camera);this.target.set(x,this.heroHeight,z).project(camera);
      const span=Math.abs(this.target.y-this.point.y)*540;
      if(span<this.heroFloor){camera.zoom*=this.heroFloor/span;camera.updateProjectionMatrix();}
      if(span>150){camera.zoom*=150/span;camera.updateProjectionMatrix();this.zoomVelocity=Math.min(0,this.zoomVelocity);}
      this.deckCorners(camera,viewport);
      let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
      for(let n=0;n<4;n++){minX=Math.min(minX,this.corners[n*2]);maxX=Math.max(maxX,this.corners[n*2]);minZ=Math.min(minZ,this.corners[n*2+1]);maxZ=Math.max(maxZ,this.corners[n*2+1]);}
      const spanX=maxX-minX,spanZ=maxZ-minZ;
      this.diagnostics.smallX=spanX>roomRight-roomLeft;this.diagnostics.smallZ=spanZ>roomBottom-roomTop;
      // Keep the current framing whenever it is within the room allowance.
      const centeredX=this.diagnostics.smallX&&Math.abs((minX+maxX-roomLeft-roomRight)*.5)<1e-5;
      const centeredZ=this.diagnostics.smallZ&&Math.abs((minZ+maxZ-roomTop-roomBottom)*.5)<1e-5;
      if(this.fitsRoomMargin(camera,viewport,roomLeft,roomTop,roomRight,roomBottom,minX,maxX,minZ,maxZ,centeredX,centeredZ)){
        this.diagnostics.centeredX=centeredX;this.diagnostics.centeredZ=centeredZ;
        break;
      }
      const dx=spanX>roomRight-roomLeft?(roomLeft+roomRight)*.5-(minX+maxX)*.5:Math.max(roomLeft-minX,Math.min(roomRight-maxX,0));
      const dz=spanZ>roomBottom-roomTop?(roomTop+roomBottom)*.5-(minZ+maxZ)*.5:Math.max(roomTop-minZ,Math.min(roomBottom-maxZ,0));
      const startX=camera.position.x,startZ=camera.position.z;
      if(!this.diagnostics.smallX&&!this.diagnostics.smallZ){
        // Find the closest pose along the correction toward the room interior.
        let low=0,high=1;
        this.setRectangle(roomLeft,roomTop,roomRight,roomBottom);
        for(let step=0;step<12;step++){
          const mid=(low+high)*.5;
          this.move(camera,focus,startX+dx*mid-camera.position.x,startZ+dz*mid-camera.position.z);
          if(this.outsideFraction(camera,roomRight,roomBottom,viewport,this.boundsPolygon)<=ROOM_OUTSIDE_LIMIT)high=mid;
          else low=mid;
        }
        this.move(camera,focus,startX+dx*high-camera.position.x,startZ+dz*high-camera.position.z);
      }else this.move(camera,focus,dx,dz);
      this.protectBody(camera,focus,x,z,radius,height,viewport,bodyEdgePaddingY);
      this.deckCorners(camera,viewport);
      const centerX=(Math.min(this.corners[0],this.corners[2],this.corners[4],this.corners[6])+Math.max(this.corners[0],this.corners[2],this.corners[4],this.corners[6]))*.5;
      const centerZ=(Math.min(this.corners[1],this.corners[3],this.corners[5],this.corners[7])+Math.max(this.corners[1],this.corners[3],this.corners[5],this.corners[7]))*.5;
      this.diagnostics.centeredX=this.diagnostics.smallX&&Math.abs(centerX-(roomLeft+roomRight)*.5)<1e-5;
      this.diagnostics.centeredZ=this.diagnostics.smallZ&&Math.abs(centerZ-(roomTop+roomBottom)*.5)<1e-5;
      if(Math.abs(dx)+Math.abs(dz)<1e-6&&pass>1)break;
    }
  }

  /** Validate the exact projected allowance without relaxing either small-axis rule. */
  private fitsRoomMargin(camera:Camera,viewport:CombatViewport,left:number,top:number,right:number,bottom:number,
    minX:number,maxX:number,minZ:number,maxZ:number,centeredX:boolean,centeredZ:boolean):boolean {
    const d=this.diagnostics;
    if(d.smallX&&!centeredX||d.smallZ&&!centeredZ)return false;
    this.setRectangle(left,top,right,bottom);
    const total=this.outsideFraction(camera,right,bottom,viewport,this.boundsPolygon);
    this.setRectangle(left,minZ-.001,right,maxZ+.001);
    const outsideX=this.outsideFraction(camera,right,bottom,viewport,this.boundsPolygon);
    this.setRectangle(minX-.001,top,maxX+.001,bottom);
    const outsideZ=this.outsideFraction(camera,right,bottom,viewport,this.boundsPolygon);
    this.setRectangle(left,top,right,bottom);
    return(d.smallX||outsideX<=ROOM_OUTSIDE_LIMIT)&&(d.smallZ||outsideZ<=ROOM_OUTSIDE_LIMIT)
      &&(d.smallX||d.smallZ||total<=ROOM_OUTSIDE_LIMIT);
  }

  private readonly springResult = [0,0];
  private spring(value:number,velocity:number,target:number,omega:number,dt:number,decay:number):number[]{
    const delta=value-target,term=(velocity+omega*delta)*dt;
    this.springResult[0]=target+(delta+term)*decay;this.springResult[1]=(velocity-omega*term)*decay;
    return this.springResult;
  }

  private move(camera:Camera,focus:T.Vector3,dx:number,dz:number):void {
    camera.position.x+=dx;camera.position.z+=dz;focus.x+=dx;focus.z+=dz;camera.updateMatrixWorld();
  }

  private deckCorners(camera:Camera,v:CombatViewport):void {
    for(let n=0;n<4;n++){
      this.deckPoint(camera,n<2?v.left:v.right,n%2?v.top:v.bottom);
      this.corners[n*2]=this.point.x;this.corners[n*2+1]=this.point.z;
    }
  }

  private protectBody(camera:Camera,focus:T.Vector3,x:number,z:number,radius:number,height:number,v:CombatViewport,edgePaddingY?:number,preferCentre=false):void {
    for(let pass=0;pass<16;pass++){
      let left=Infinity,right=-Infinity,top=-Infinity,bottom=Infinity;
      for(let sample=0;sample<(this.envelope?.count||MARINE_ENVELOPE_POINTS);sample++){
      if(this.envelope?.count)this.envelope.point(this.point,sample);else marineEnvelopePoint(this.point,sample,x,z,this.marineAngle);this.point.project(camera);
        left=Math.min(left,this.point.x);right=Math.max(right,this.point.x);top=Math.max(top,this.point.y);bottom=Math.min(bottom,this.point.y);
      }
      const aspect=camera instanceof T.PerspectiveCamera?camera.aspect:(camera.right-camera.left)/(camera.top-camera.bottom);
      const padY=Math.max(this.bodyPaddingY,edgePaddingY??0),padX=padY/aspect;
      // HUD insets already include8CSS pixels beyond each physical panel.
      // Complete the16px geometry margin; canvas edges still receive all16.
      const pl=padX*(v.left>-.99999?.5:1),pr=padX*(v.right<.99999?.5:1),pt=padY*(v.top<.99999?.5:1),pb=padY*(v.bottom>-.99999?.5:1);
      // An oversized projected pose cannot be repaired by translation. Fit it
      // first; otherwise alternating left/right edge corrections can run away.
      const fit=Math.min(1,(v.right-v.left-pl-pr)/Math.max(.0001,right-left),(v.top-v.bottom-pt-pb)/Math.max(.0001,top-bottom));
      if(fit<1-1e-7){camera.zoom*=Math.max(.01,fit*.999);camera.updateProjectionMatrix();this.zoomVelocity=Math.min(0,this.zoomVelocity);continue;}
      this.point.set(x,.65,z).project(camera);
      const dx=left<v.left+pl?left-v.left-pl:right>v.right-pr?right-v.right+pr:
        preferCentre?this.point.x-T.MathUtils.clamp(this.point.x,-.6,.6):0;
      const dy=top>v.top-pt?top-v.top+pt:bottom<v.bottom+pb?bottom-v.bottom-pb:
        preferCentre?this.point.y-T.MathUtils.clamp(this.point.y,-.24,.4):0;
      if(Math.abs(dx)+Math.abs(dy)<1e-7)return;
      this.point.set(x,height*.5,z).project(camera);this.target.copy(this.point);this.target.x-=dx;this.target.y-=dy;
      this.point.unproject(camera);this.target.unproject(camera);
      if(camera instanceof T.PerspectiveCamera){const denominator=this.target.y-camera.position.y;if(Math.abs(denominator)<1e-5)return;const amount=(this.point.y-camera.position.y)/denominator;this.target.sub(camera.position).multiplyScalar(amount).add(camera.position);}
      else {this.target.z-= (this.target.y-this.point.y)*camera.matrixWorld.elements[10]/camera.matrixWorld.elements[9];this.target.y=this.point.y;}
      this.point.sub(this.target);
      const length=Math.hypot(this.point.x,this.point.z);if(!Number.isFinite(length))return;
      const scale=length>.75?.75/length:1;this.move(camera,focus,this.point.x*scale,this.point.z*scale);
    }
  }

  /** Exact screen-area receipt of the projected deck rectangle, clipped to HUD. */
  outsideFraction(camera:Camera,width:number,depth:number,v:CombatViewport,boundary?:Boundary):number {
    let source=this.polygonA,dest=this.polygonB,count=boundary?.length??4;
    for(let n=0;n<count;n++){this.point.set(boundary?boundary[n].x/32:n===1||n===2?width:0,0,boundary?boundary[n].y/32:n>=2?depth:0).project(camera);source[n*2]=this.point.x;source[n*2+1]=this.point.y;}
    for(let edge=0;edge<4;edge++){
      const axis=edge<2?0:1,bound=edge===0?v.left:edge===1?v.right:edge===2?v.bottom:v.top,sign=edge%2===0?1:-1;
      let next=0;
      for(let n=0;n<count;n++){
        const p=(n+count-1)%count,a=source[p*2+axis],b=source[n*2+axis],insideA=(a-bound)*sign>=0,insideB=(b-bound)*sign>=0;
        if(insideA!==insideB){const t=(bound-a)/(b-a);dest[next*2]=source[p*2]+(source[n*2]-source[p*2])*t;dest[next*2+1]=source[p*2+1]+(source[n*2+1]-source[p*2+1])*t;next++;}
        if(insideB){dest[next*2]=source[n*2];dest[next*2+1]=source[n*2+1];next++;}
      }
      count=next;const swap=source;source=dest;dest=swap;
    }
    let area=0;for(let n=0;n<count;n++){const p=(n+1)%count;area+=source[n*2]*source[p*2+1]-source[p*2]*source[n*2+1];}
    return Math.max(0,Math.min(1,1-Math.abs(area)*.5/((v.right-v.left)*(v.top-v.bottom))));
  }
}
