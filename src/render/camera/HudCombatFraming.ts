import {type DrawnMarineEnvelope} from './DrawnMarineEnvelope';
import {MARINE_FRAME_MARGIN_CSS,MARINE_FRAMING_FLOOR,MARINE_ENVELOPE_POINTS,marineEnvelopePoint} from './MarineFramingEnvelope';
import * as T from 'three';

export type HudInsets = Readonly<{ top:number; right:number; bottom:number; left:number }>;
export type CombatViewport = Readonly<{
  left:number; right:number; top:number; bottom:number;
  centerX:number; centerY:number; halfX:number; halfY:number;
}>;
export const ZERO_HUD_INSETS:HudInsets=Object.freeze({top:0,right:0,bottom:0,left:0});
export const FULL_COMBAT_VIEWPORT:CombatViewport=Object.freeze({left:-1,right:1,top:1,bottom:-1,centerX:0,centerY:0,halfX:1,halfY:1});

type Contact=Readonly<{id?:number;x:number;y:number;radius:number;health?:number;windupMs?:number;chargeMs?:number;pendingAttack?:unknown;meleePhase?:string}>;
type Camera=T.OrthographicCamera|T.PerspectiveCamera;
const CAPACITY=6;

/** CSS-space HUD reservation and allocation-free engaged-contact framing. */
export class HudCombatFraming {
  private readonly requested={top:0,right:0,bottom:0,left:0};
  private readonly effective={top:0,right:0,bottom:0,left:0};
  readonly viewport={...FULL_COMBAT_VIEWPORT};
  private width=1;
  private height=1;
  private releaseReservationsOnNextLayout=false;
  // x,z,radius,height,score. Fixed slots avoid sorting/allocating live snapshots.
  private readonly contacts=new Float64Array(CAPACITY*5);
  private count=0;
  private primary=false;
  private marineAngle=0;
  private envelope?:DrawnMarineEnvelope;
  setMarineEnvelope(envelope?:DrawnMarineEnvelope):void {this.envelope=envelope;}
  private centroidX=0;
  private centroidZ=0;
  private weight=0;
  /** Retained capture receipt; mutable internally and never allocated during a frame. */
  readonly diagnostics={contacts:0,selectedIds:Array<number>(CAPACITY).fill(-1),focusContactId:-1,focusedPair:false,fit:true,pullback:1};
  get insets():HudInsets{return this.effective;}
  get hasInsets(){const i=this.effective;return i.top+i.right+i.bottom+i.left>0;}
  get hasEngagement(){return this.count>0;}

  /** Invalid/negative values become zero. Preserve at least35% of each dimension. */
  setInsets(insets:HudInsets):void {
    if(this.releaseReservationsOnNextLayout)this.resetReservations();
    this.requested.top=Math.max(this.requested.top,this.valid(insets.top));this.requested.right=Math.max(this.requested.right,this.valid(insets.right));
    this.requested.bottom=Math.max(this.requested.bottom,this.valid(insets.bottom));this.requested.left=Math.max(this.requested.left,this.valid(insets.left));
    this.resize(this.width,this.height);
  }

  /** Relocating chrome must not reclaim then reoccupy the marine's space after
   * camera projection. Peak edge reservations stay stable for this desktop size/layout. */
  resetReservations():void {this.requested.top=this.requested.right=this.requested.bottom=this.requested.left=0;this.releaseReservationsOnNextLayout=false;}

  /** Re-clamp requested CSS pixels after every desktop resize; never use framebuffer pixels. */
  resize(width:number,height:number):void {
    // Keep the existing chrome reservation on the resize frame. The next
    // measured layout replaces its peaks, so the camera never sees a HUD-free
    // viewport between the browser resize and the DOM layout update.
    if(width!==this.width||height!==this.height)this.releaseReservationsOnNextLayout=true;
    this.width=Number.isFinite(width)?Math.max(1,width):1;this.height=Number.isFinite(height)?Math.max(1,height):1;
    const i=this.requested,e=this.effective;
    const horizontal=Math.min(1,this.width*.65/Math.max(1,i.left+i.right));
    const vertical=Math.min(1,this.height*.65/Math.max(1,i.top+i.bottom));
    e.left=i.left*horizontal;e.right=i.right*horizontal;e.top=i.top*vertical;e.bottom=i.bottom*vertical;
    const v=this.viewport;v.left=e.left/this.width*2-1;v.right=1-e.right/this.width*2;
    v.top=1-e.top/this.height*2;v.bottom=e.bottom/this.height*2-1;
    v.centerX=(v.left+v.right)*.5;v.centerY=(v.top+v.bottom)*.5;
    v.halfX=(v.right-v.left)*.5;v.halfY=(v.top-v.bottom)*.5;
  }

  /** Nearby danger counts in every direction; farther contacts must be aimed at or attacking. */
  selectContacts(x:number,z:number,angle:number,enemies:readonly Contact[],units=32,heightForContact?:(id:number)=>number):void {
    this.marineAngle=angle;this.primary=false;this.count=0;this.weight=0;this.centroidX=this.centroidZ=0;this.diagnostics.contacts=0;this.diagnostics.selectedIds.fill(-1);this.diagnostics.focusContactId=-1;this.diagnostics.focusedPair=false;this.diagnostics.fit=true;this.diagnostics.pullback=1;
    const ax=Math.cos(angle),az=Math.sin(angle);
    for(const e of enemies){
      if(e.health!==undefined&&e.health<=0)continue;
      const ex=e.x/units,ez=e.y/units,dx=ex-x,dz=ez-z,distance=Math.hypot(dx,dz);
      if(distance>12.5)continue;
      const alignment=distance>.001?(dx*ax+dz*az)/distance:1;
      const attacking=!!e.pendingAttack||(e.windupMs??0)>0||(e.chargeMs??0)>0||e.meleePhase==='windup'||e.meleePhase==='strike';
      if(distance>5.5&&alignment<.20&&!attacking)continue;
      const score=(attacking?8:1)*(distance<4?1.5:1)*(.7+Math.max(0,alignment)*1.3)/(1+distance*.18);
      let index=this.count;
      if(index===CAPACITY){let weakest=0;for(let n=1;n<CAPACITY;n++)if(this.contacts[n*5+4]<this.contacts[weakest*5+4])weakest=n;if(score<=this.contacts[weakest*5+4])continue;index=weakest;}else this.count++;
      const p=index*5;this.contacts[p]=ex;this.contacts[p+1]=ez;this.contacts[p+2]=Math.max(.18,e.radius/units);this.contacts[p+3]=heightForContact&&e.id!==undefined?Math.max(.1,heightForContact(e.id)):2.65;this.contacts[p+4]=score;this.diagnostics.selectedIds[index]=e.id??-1;
    }
    for(let n=0;n<this.count;n++){const p=n*5,w=this.contacts[p+4];this.centroidX+=this.contacts[p]*w;this.centroidZ+=this.contacts[p+1]*w;this.weight+=w;}
    this.diagnostics.contacts=this.count;
    if(this.weight>0){this.centroidX/=this.weight;this.centroidZ/=this.weight;}
  }

  /** Boss framing keeps its complete primary anatomy, independent of normal enemy range selection. */
  selectPrimaryContact(id:number,x:number,z:number,radius:number,height:number):void {
    this.primary=true;this.count=1;this.centroidX=x;this.centroidZ=z;this.weight=1;
    this.contacts[0]=x;this.contacts[1]=z;this.contacts[2]=radius;this.contacts[3]=height;this.contacts[4]=1;
    this.diagnostics.contacts=1;this.diagnostics.selectedIds.fill(-1);this.diagnostics.selectedIds[0]=id;
    this.diagnostics.focusContactId=id;this.diagnostics.focusedPair=true;this.diagnostics.fit=true;this.diagnostics.pullback=1;
  }

  /** Nearby combat gets a final fit after the room spring; remote targets may yield to room/hero limits. */
  needsFinalFit(x:number,z:number):boolean {
    if(this.primary)return true;
    for(let n=0;n<this.count;n++)if(Math.hypot(this.contacts[n*5]-x,this.contacts[n*5+1]-z)<=5.5)return true;
    return false;
  }

  /** Add bounded centroid/aim lead to the existing boss-aware focus target. */
  biasTarget(x:number,z:number,angle:number,reducedMotion:boolean,bossActive:boolean,out:T.Vector3):void {
    if(bossActive||this.count===0)return;
    // Immediate bodies own the look-ahead before a distant contact centroid.
    // Selection/fit still retains every original contact and all safety bounds.
    let nearX=0,nearZ=0,nearWeight=0;
    for(let n=0;n<this.count;n++){
      const p=n*5,d=Math.hypot(this.contacts[p]-x,this.contacts[p+1]-z);
      if(d>4)continue;
      const w=this.contacts[p+4]*(1+(4-d)*.35);
      nearX+=this.contacts[p]*w;nearZ+=this.contacts[p+1]*w;nearWeight+=w;
    }
    const dx=(nearWeight?nearX/nearWeight:this.centroidX)-x,dz=(nearWeight?nearZ/nearWeight:this.centroidZ)-z,distance=Math.hypot(dx,dz);
    const amount=distance>.001?Math.min(reducedMotion?.8:1.6,distance*.32)/distance:0;
    const aim=reducedMotion?0:.35*Math.min(this.viewport.halfX,this.viewport.halfY);
    out.set(x+dx*amount+Math.cos(angle)*aim,0,z+dz*amount+Math.sin(angle)*aim);
  }

  /** Move the optical center into the usable viewport without changing the spring's target. */
  center(camera:Camera,focus:T.Vector3,point:T.Vector3,target:T.Vector3):void {
    const v=this.viewport;if(!this.hasInsets)return;
    point.copy(focus).project(camera);target.copy(point);target.x+=v.centerX;target.y+=v.centerY;
    this.translate(camera,focus,point,target,false);
  }

  /** Shift a fitting engagement as one group; if oversized, prefer the aimed/most urgent contact.
   * The bounded extra pullback is only used when HUD reservation makes that pair too large.
   * Final remote progression may explicitly spend compositional padding down
   * to a CSS-pixel body edge; the ordinary solve retains its larger margins. */
  protectEngagement(camera:Camera,focus:T.Vector3,x:number,z:number,radius:number,height:number,point:T.Vector3,target:T.Vector3,minimumZoom=.5,allowMarineMargin=false,bodyEdgePaddingCss?:number):void {
    if(!this.count)return;
    const v=this.viewport,padX=Math.max(MARINE_FRAME_MARGIN_CSS*2/this.width,bodyEdgePaddingCss===undefined?.06*v.halfX:bodyEdgePaddingCss*2/this.width),padY=Math.max(MARINE_FRAME_MARGIN_CSS*2/this.height,bodyEdgePaddingCss===undefined?.10*v.halfY:bodyEdgePaddingCss*2/this.height);
    const leftLimit=v.left+padX,rightLimit=v.right-padX,topLimit=v.top-padY,bottomLimit=v.bottom+padY;
    let selected=this.primary?0:-1;
    for(let pass=0;pass<32;pass++){
      let left=Infinity,right=-Infinity,top=-Infinity,bottom=Infinity;
      let marineLeft=0,marineRight=0,marineTop=0,marineBottom=0;
      for(let actor=-1;actor<this.count;actor++){
        if(actor>=0&&selected>=0&&actor!==selected)continue;
        const offset=actor*5,px=actor<0?x:this.contacts[offset],pz=actor<0?z:this.contacts[offset+1],r=actor<0?radius:this.contacts[offset+2],h=actor<0?height:this.contacts[offset+3];
        for(let sample=0;sample<(actor<0?(this.envelope?.count||MARINE_ENVELOPE_POINTS):8);sample++){
          if(actor<0){if(this.envelope?.count)this.envelope.point(point,sample);else marineEnvelopePoint(point,sample,x,z,this.marineAngle);}else point.set(px+(sample&1?1:-1)*r,sample&4?h:0,pz+(sample&2?1:-1)*r);point.project(camera);left=Math.min(left,point.x);right=Math.max(right,point.x);top=Math.max(top,point.y);bottom=Math.min(bottom,point.y);
        }
        if(actor<0){marineLeft=left;marineRight=right;marineTop=top;marineBottom=bottom;}
      }
      const scale=Math.min(1,(rightLimit-leftLimit)/(right-left),(topLimit-bottomLimit)/(top-bottom));
      // The final room solve may spend central composition to keep actual
      // bodies safe, but retains six percent of the usable half-viewport.
      const fullMarineMargin=this.primary||allowMarineMargin;
      const marineHalfX=bodyEdgePaddingCss!==undefined?v.halfX-padX:Math.max((fullMarineMargin?.94:.60)*v.halfX,(marineRight-marineLeft)*.5+.015);
      const marineHalfY=bodyEdgePaddingCss!==undefined?v.halfY-padY:Math.max((fullMarineMargin?.94:.55)*v.halfY,(marineTop-marineBottom)*.5+.015);
      const minX=Math.max(right-rightLimit,marineRight-v.centerX-marineHalfX),maxX=Math.min(left-leftLimit,marineLeft-v.centerX+marineHalfX);
      const minY=Math.max(top-topLimit,marineTop-v.centerY-marineHalfY),maxY=Math.min(bottom-bottomLimit,marineBottom-v.centerY+marineHalfY);
      if(scale<1-1e-6||minX>maxX+1e-6||minY>maxY+1e-6){
        // Try the complete engaged group before falling back to its highest-priority pair.
        // Keep ordinary crowds at the authored scale. A remote priority pair
        // gets additional bounded room before abandoning its actual body bounds;
        // the ordinary marine central composition remains unless the final
        // remote solve explicitly requests literal body-edge clearance.
        const zoom=Math.max(minimumZoom,.88,camera.zoom*Math.min(.96,scale*.98));
        if(zoom<camera.zoom-1e-6){camera.zoom=zoom;this.diagnostics.pullback=zoom;camera.updateProjectionMatrix();continue;}
        if(selected<0){selected=0;for(let n=1;n<this.count;n++)if(this.contacts[n*5+4]>this.contacts[selected*5+4])selected=n;this.diagnostics.focusedPair=true;this.diagnostics.focusContactId=this.diagnostics.selectedIds[selected];continue;}
        // Perspective body extents change when the camera moves on the deck.
        // Disjoint current intervals do not prove that the pair cannot fit:
        // first use the marine's remaining central-safe translation, then
        // measure the actual eight-corner bounds again at the same zoom.
        const dx=Math.max(marineRight-v.centerX-marineHalfX,Math.min(marineLeft-v.centerX+marineHalfX,(left+right)*.5-v.centerX));
        const dy=Math.max(marineTop-v.centerY-marineHalfY,Math.min(marineBottom-v.centerY+marineHalfY,(top+bottom)*.5-v.centerY));
        if(Math.abs(dx)+Math.abs(dy)<1e-7){this.diagnostics.fit=false;return;}
        point.set(x,height*.5,z).project(camera);target.copy(point);target.x-=dx;target.y-=dy;
        this.translate(camera,focus,point,target,true);continue;
      }
      const dx=Math.max(minX,Math.min(maxX,0));
      const dy=Math.max(minY,Math.min(maxY,0));
      if(Math.abs(dx)+Math.abs(dy)<1e-7)return;
      point.set(x,height*.5,z).project(camera);target.copy(point);target.x-=dx;target.y-=dy;
      this.translate(camera,focus,point,target,true);
    }
    this.diagnostics.fit=false;
  }

  /** Re-measure selected contacts after final room/hero constraints. A remote
   * contact may yield to hero size; receipts must describe the rendered matrix. */
  refreshFit(camera:Camera,point:T.Vector3,compositionPadding=false):void {
    const v=this.viewport,padX=compositionPadding?.06*v.halfX:0,padY=compositionPadding?.10*v.halfY:0,tolerance=compositionPadding?1e-7:1e-5;
    this.diagnostics.fit=true;
    for(let n=0;n<this.count;n++){
      if(this.diagnostics.focusedPair&&this.diagnostics.selectedIds[n]!==this.diagnostics.focusContactId)continue;
      const offset=n*5;
      for(let ix=-1;ix<=1;ix+=2)for(let iz=-1;iz<=1;iz+=2)for(let iy=0;iy<2;iy++){
        point.set(this.contacts[offset]+ix*this.contacts[offset+2],iy*this.contacts[offset+3],this.contacts[offset+1]+iz*this.contacts[offset+2]).project(camera);
        if(point.x<v.left+padX-tolerance||point.x>v.right-padX+tolerance||point.y<v.bottom+padY-tolerance||point.y>v.top-padY+tolerance)this.diagnostics.fit=false;
      }
    }
    this.diagnostics.pullback=camera.zoom;
  }

  private valid(value:number){return Number.isFinite(value)?Math.max(0,value):0;}
  private translate(camera:Camera,focus:T.Vector3,point:T.Vector3,target:T.Vector3,moveFocus:boolean){
    point.unproject(camera);target.unproject(camera);
    // Intersect the desired projection ray with the reference point's horizontal
    // plane. A same-depth unproject followed by flattening drifts in perspective.
    target.sub(camera.position);const amount=(point.y-camera.position.y)/target.y;
    target.multiplyScalar(amount).add(camera.position);point.sub(target);point.y=0;
    camera.position.add(point);if(moveFocus)focus.add(point);camera.updateMatrixWorld();
  }
}
