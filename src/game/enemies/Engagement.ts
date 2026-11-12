/** Stable local attack berths. The forward half-plane remains an escape lane. */
export type EngagementState = 'engaged' | 'waiting' | 'ranged';
export type AttackSlot = Readonly<{angle: number; radius: number}>;
export type EngagementBody = {
  id: number; type: string; x: number; y: number; radius: number;
  attackSlot?: AttackSlot; engagement?: EngagementState;
};
const angleDistance = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a-b), Math.cos(a-b)));

export class Engagement {
  #escape = 0;
  #anchorX = Infinity;
  #anchorY = Infinity;
  readonly #bodies: EngagementBody[] = [];
  readonly #occupied: EngagementBody[] = [];
  readonly #candidates: EngagementBody[] = [];

  reset(): void { this.#anchorX = Infinity; this.#anchorY = Infinity; }

  update<T extends EngagementBody>(bodies: Iterable<T>, player: {x:number;y:number;radius?:number;angle?:number}, legal: (body:T,x:number,y:number)=>boolean, escapeLegal: (x:number,y:number)=>boolean): void {
    const actors=this.#bodies as T[];actors.length=0;for(const body of bodies)actors.push(body);
    const pr = player.radius ?? 16;
    // Keep the lane stable while the marine stands still. Reconsider after moving
    // a body width; prefer a legal straight lane over pointing into architecture.
    const hasClose = actors.some(body=>Math.hypot(body.x-player.x,body.y-player.y)<=240);
    if (hasClose && Math.hypot(player.x-this.#anchorX,player.y-this.#anchorY)>48) {
      this.#anchorX=player.x;this.#anchorY=player.y;
      const first=actors[0] as T | undefined;
      if(first)for(let i=0;i<16;i++) {
        const a=(player.angle??0)+i*Math.PI/8;
        if(escapeLegal(player.x+Math.cos(a)*110,player.y+Math.sin(a)*110)){this.#escape=a;break;}
      }
    }
    this.#occupied.length=0;this.#candidates.length=0;
    const fits = (body: T, angle: number, radius: number) => {
      // Tangent enemies on the other half-plane leave >= one marine diameter
      // between the two bordering discs, including mixed crawler/brute radii.
      if(angleDistance(angle,this.#escape)<Math.PI/2+.025)return false;
      const x=player.x+Math.cos(angle)*radius,y=player.y+Math.sin(angle)*radius;
      if(!legal(body,x,y))return false;
      for(const other of this.#occupied){const slot=other.attackSlot!;
        if(Math.hypot(Math.cos(angle)*radius-Math.cos(slot.angle)*slot.radius,Math.sin(angle)*radius-Math.sin(slot.angle)*slot.radius)<body.radius+other.radius+2)return false;
      }
      return true;
    };
    for(const body of actors){
      const ranged=body.type==='spitter'||body.type==='carrier';
      if(ranged){body.attackSlot=undefined;body.engagement='ranged';continue;}
      if(Math.hypot(body.x-player.x,body.y-player.y)>240){body.attackSlot=undefined;body.engagement='waiting';continue;}
      const slot=body.attackSlot,radius=pr+body.radius+.25;
      if(slot&&fits(body as T,slot.angle,radius)){
        body.attackSlot=Object.freeze({angle:slot.angle,radius});body.engagement='engaged';this.#occupied.push(body);
      }else {body.attackSlot=undefined;body.engagement='waiting';this.#candidates.push(body);}
    }
    // Nearest first, numeric ID breaks exact ties; existing owners are retained.
    this.#candidates.sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y)||a.id-b.id);
    for(const body of this.#candidates){
      const radius=pr+body.radius+.25;
      let best=Infinity,angle:number|undefined;
      for(let i=0;i<48;i++){
        const a=this.#escape+Math.PI/2+.025+i*(Math.PI-.05)/47;
        if(!fits(body as T,a,radius))continue;
        const distance=Math.hypot(player.x+Math.cos(a)*radius-body.x,player.y+Math.sin(a)*radius-body.y);
        const rear=body.type==='stalker'?angleDistance(a,(player.angle??0)+Math.PI)*12:0;
        if(distance+rear<best){best=distance+rear;angle=a;}
      }
      if(angle!==undefined){body.attackSlot=Object.freeze({angle,radius});body.engagement='engaged';this.#occupied.push(body);}
    }
  }

  goal(body:EngagementBody,player:{x:number;y:number}):{x:number;y:number}|undefined {
    const slot=body.attackSlot;
    if(slot)return {x:player.x+Math.cos(slot.angle)*slot.radius,y:player.y+Math.sin(slot.angle)*slot.radius};
    if(body.type==='spitter'||Math.hypot(body.x-player.x,body.y-player.y)>240)return undefined;
    const radius=body.type==='carrier'?170:100+body.radius;
    const current=Math.atan2(body.y-player.y,body.x-player.x);
    // Waiting enemies hold a second ring instead of seeking the marine's center.
    const offset=Math.atan2(Math.sin(current-this.#escape),Math.cos(current-this.#escape));
    const angle=this.#escape+(offset<0?-1:1)*Math.max(Math.PI/2+.15,Math.abs(offset));
    return {x:player.x+Math.cos(angle)*radius,y:player.y+Math.sin(angle)*radius};
  }
}
