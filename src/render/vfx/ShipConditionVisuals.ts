import * as T from 'three';
import type {Point} from '../../game/roguelike/types';
import type {RoomConditionRuntime} from '../../game/roguelike/RoomConditionRuntime';
import {groundIndicatorMaterial} from './GroundIndicatorMaterial';

const BLUE=0x43c7fa, WHITE=0xd6e8ff, AMBER=0xffca70;

export class ShipConditionVisuals {
  readonly root=new T.Group();
  private readonly ground=new T.PlaneGeometry(2,2).rotateX(-Math.PI/2);
  private readonly shutterGeometry=new T.BoxGeometry(1,1,1);
  private readonly shutterMaterial=new T.MeshBasicMaterial({color:0x435969});
  private readonly sealMaterial=new T.MeshBasicMaterial({color:AMBER});
  private readonly shutters=Array.from({length:3},()=>{
    const mesh=new T.Mesh(this.shutterGeometry,this.shutterMaterial);
    for(const height of [-.32,0,.32]){
      const stripe=new T.Mesh(this.shutterGeometry,this.sealMaterial);
      stripe.position.set(0,height,0);
      stripe.scale.set(1.07,.065,1.04);
      mesh.add(stripe);
    }
    return mesh;
  });
  private readonly patches=Array.from({length:12},()=>new T.Mesh(this.ground,groundIndicatorMaterial('contact',BLUE)));

  constructor(private readonly unit:number){
    this.root.name='ship-condition-visuals';
    for(const mesh of this.patches)mesh.renderOrder=24;
    this.root.add(...this.patches,...this.shutters);
  }

  update(state:RoomConditionRuntime|null,low:boolean,reduced:boolean,player?:Point,playing=true){
    for(const mesh of [...this.patches,...this.shutters])mesh.visible=false;
    if(!state)return;
    const id=state.condition.id;
    state.zones.forEach((zone,i)=>{
      if(id==='sealed'){
        if(i===state.closedBreaches.length&&(!playing||(!state.countdown&&!state.sealedHold)))return;
        const mesh=this.shutters[i];
        mesh.visible=true;
        mesh.position.set(zone.x/this.unit,.85,zone.y/this.unit);
        mesh.scale.set(.24,1.7,zone.radius*2/this.unit);
        mesh.rotation.y=zone.angle??0;
        return;
      }
      if(id==='dark'||id==='brood')return;
      const x=zone.x/this.unit,z=zone.y/this.unit,r=zone.radius/this.unit;
      const flashing=state.ventWarning&&!reduced&&Math.floor(state.elapsed/250)%2===0;
      const color=id==='coolant'?BLUE:id==='vent'?(flashing?WHITE:AMBER):state.conduitLive?WHITE:BLUE;
      const gain=id==='vent'?(state.ventLive?2:flashing?2:1.6):id==='conduit'?(state.conduitLive?3:state.elapsed%4000>=2000?2:1.35):1.3;
      if(zone.end){
        const dx=(zone.end.x-zone.x)/this.unit,dz=(zone.end.y-zone.y)/this.unit;
        this.patch(i,x+dx/2,z+dz/2,r,Math.hypot(dx,dz)/2,Math.atan2(dx,dz),color,gain);
      }else this.patch(i,x,z,r,r,0,color,gain,id==='coolant'&&!low?3:0);
      if(id==='vent'&&player){
        const dx=zone.x-player.x,dy=zone.y-player.y,range=Math.hypot(dx,dy)||1,angle=Math.atan2(dx,dy);
        for(let j=0;j<3;j++){
          const offset=Math.min(range,45+j*56)/this.unit;
          this.patch(j+1,player.x/this.unit+dx/range*offset,player.y/this.unit+dy/range*offset,.17,.68,angle,flashing?WHITE:AMBER,1.25);
        }
      }
      if(id==='vent'&&state.ventLive){
        const count=low?3:8;
        for(let j=0;j<count;j++){
          const angle=j*2.4,phase=(state.elapsed%2500/700+j/count)%1,distance=1+7*(1-phase);
          this.patch(j+4,x+Math.cos(angle)*distance,z+Math.sin(angle)*distance,.09,.64,-angle+Math.PI/2,WHITE,1.7);
        }
      }
    });
  }

  private patch(index:number,x:number,z:number,width:number,length:number,angle:number,color:number,gain:number,mode=0){
    const mesh=this.patches[index];
    mesh.visible=true;
    mesh.position.set(x,.036,z);
    mesh.scale.set(width,1,length);
    mesh.rotation.y=angle;
    mesh.material.uniforms.indicatorColor.value.setHex(color).multiplyScalar(gain);
    mesh.material.uniforms.indicatorMode.value=mode;
  }

  dispose(){
    for(const mesh of this.patches)mesh.material.dispose();
    this.ground.dispose();
    this.shutterGeometry.dispose();
    this.shutterMaterial.dispose();
    this.sealMaterial.dispose();
    this.root.removeFromParent();
  }
}
