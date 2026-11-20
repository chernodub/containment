import {icon} from '../../src/ui/icons';
import {groundIndicatorMaterial} from '../../src/render/vfx/GroundIndicatorMaterial';
import * as T from 'three';
import type {DepthRenderer} from '../../src/render/DepthRenderer';
import type {DepthGame, GameEffect} from '../../src/DepthGame';
import type {RigId, AbilityEvent, AbilitiesSnapshot} from '../../src/game/abilities/contract';
import type {WeaponId} from '../../src/game/combat/types';
import type {StandardEnemyId} from '../../src/game/enemies/types';
import {MELEE_ATTACKS} from '../../src/game/enemies/meleeAttacks';
import {marine} from '../../src/render/models';
import {loadPickupModels,pickupModel} from '../../src/render/PickupModels';
import {weaponModel} from '../../src/render/weapons';
import {acquireRoomKit, KIT_URLS} from '../../src/render/world/RoomKitAssets';
import {registerGeometry, GEOMETRY_CLASSES} from '../../src/render/post/GeometryBuffer';
import {disposeModel} from '../../src/render/meshParts';
import {retireRoomModels} from '../../src/render/RoomModelCache';

type Mark = {x?:number; z?:number; aim?:number; y?:number; scale?:number; shadow?:number};
type Subject = Mark & (
  {kind:'marine'; rig:RigId; weapon:WeaponId; pose?:string; frame?:number; reload?:number; ghost?:boolean}
  | {kind:'enemy'; family:StandardEnemyId; champion?:'warden'|'matron'; pose?:'attack'|'hit'|'frozen'; frame?:number}
  | {kind:'pod'; swollen?:boolean}
  | {kind:'ordnance'; weapon:'plasma'|'rocket'; from:[number,number,number]}
  | {kind:'pickup'; id:'health'|'armor'|'ammo'|'grenade'|'credits'}
  | {kind:'weapon'; id:WeaponId}
  | {kind:'prop'; kit:keyof typeof KIT_URLS; name:string; tint?:number; glow?:number}
  | {kind:'glyph'; name:string; color:number}
  | {kind:'ring'; color:number; radius:number}
  | {kind:'light'; color:number; intensity:number; distance:number}
);
export type StudioShot = {
  width:number; height:number; subjects:Subject[]; view?:'product'|'gameplay'; span:number;
  focus?:[number,number,number]; key?:[number,number,number]; rim?:[number,number,number];
  framePortrait?:boolean; rimColor?:number; transparent?:boolean; room?:string; origin?:[number,number]; lesson?:boolean|'blocked-shot'; effect?:AbilityEvent; effectFrames?:number;
  deployables?:AbilitiesSnapshot['deployables']; zones?:AbilitiesSnapshot['zones']; links?:AbilitiesSnapshot['links'];
  extraEffects?:{x:number;z:number;event:AbilityEvent}[];
  boonEffects?:GameEffect[];
};

export async function shootStudio(owner:DepthRenderer, game:DepthGame, shot:StudioShot) {
  const {renderer,scene}=owner;
  const post=owner['post'], abilities=owner['interimAbilities'];
  const postTime=post['time'];
  const size=renderer.getSize(new T.Vector2()), ratio=renderer.getPixelRatio();
  const original=new Map(scene.children.map(child=>[child,child.visible]));
  const background=scene.background, fog=scene.fog;
  const stage=new T.Group();
  const effects=owner['effects'];
  const disposable:Array<()=>void>=[];
  const [originX,originZ]=shot.origin??[0,0];
  const worldX=originX*32, worldY=originZ*32;
  const target=(event:AbilityEvent)=>({...event,
    targetX:event.targetX===undefined?undefined:event.targetX+worldX,
    targetY:event.targetY===undefined?undefined:event.targetY+worldY,
  });
  stage.position.set(originX,0,originZ);
  const center=new T.Vector3(...(shot.focus??[0,.6,0])).add(stage.position);
  const aspect=shot.width/shot.height;
  const camera=new T.OrthographicCamera(-shot.span*aspect/2,shot.span*aspect/2,shot.span/2,-shot.span/2,.05,150);
  const direction=shot.view==='gameplay'
    ? new T.Vector3(0,1,.72).normalize()
    : new T.Vector3(4,3.2,6).normalize();
  camera.position.copy(center).addScaledVector(direction,12);
  camera.lookAt(center); camera.updateMatrixWorld();
  const key=new T.DirectionalLight(0xd9e8ff,2.3),rim=new T.DirectionalLight(shot.rimColor??0xa5e6ec,shot.framePortrait?.55:1.9);
  key.position.set(...(shot.key??[-3,7,4]));
  rim.position.set(...(shot.rim??[4,2,-5]));
  if(!shot.room)stage.add(key,rim,new T.HemisphereLight(0xb5dded,0x253036,1.9));
  else if(shot.origin){
    key.intensity=1.15;
    stage.add(key,key.target);
  }
  let firstSubject:T.Object3D|undefined;
  let lessonCover:T.Object3D|undefined;
  try {
    post['time']=0;
    post.distortion.clear();
    for(const subject of shot.subjects){
      let root:T.Object3D;
      switch(subject.kind){
        case 'marine': {
          const actor=marine();
          actor.setRig?.(subject.rig); actor.equip?.(subject.weapon);
          if(shot.framePortrait)actor.setAimPitch?.(-.15);
          actor.setMotionSeed?.(1729); actor.setMotionOptions?.(1,true);
          for(let tick=0;tick<30;tick++){
            actor.setAction?.(subject.pose??'',subject.frame??.55);
            actor.animate(tick/60,0,subject.aim??.9,0,subject.reload??0);
          }
          actor.syncWeaponPose?.();
          root=actor.root;
          if(subject.ghost)root.traverse(object=>{
            if(!(object instanceof T.Mesh))return;
            const ghost=(material:T.Material)=>{
              if(!(material instanceof T.MeshStandardMaterial))return material;
              const copy=material.clone();
              copy.transparent=true;copy.opacity=.51;copy.depthWrite=false;
              // Material clones keep base geometry shading but need the actor hooks.
              copy.onBeforeCompile=material.onBeforeCompile;
              copy.customProgramCacheKey=material.customProgramCacheKey;
              copy.userData.containmentPreserveGeometry=true;
              disposable.push(()=>copy.dispose());
              return copy;
            };
            const original=object.material;
            object.material=Array.isArray(original)?original.map(ghost):ghost(original);
            disposable.push(()=>{object.material=original;});
          });
          disposable.unshift(()=>{actor.stop?.();disposeModel(actor.root);});
          break;
        }
        case 'enemy': {
          const pool=owner['actorPool'],actor=pool.take(subject.family,false);
          actor.reset?.(); actor.setMotionSeed?.(1729); actor.setThreat?.(0,null,subject.champion,1);
          if(subject.pose==='attack'){
            const shape=MELEE_ATTACKS[subject.family]?.shape;
            actor.setAttackState?.('strike',subject.frame??.45,subject.aim??-2,shape);
            actor.attack?.();
          }
          if(subject.pose==='hit')actor.hit?.(.85,subject.aim??-2,true);
          if(subject.pose==='frozen')actor.setAffliction?.({chilled:true,frozen:true,burning:false,poisoned:false,shocked:false});
          for(let tick=0;tick<18;tick++)actor.animate(tick/60,0,subject.aim??-2);
          root=actor.root; disposable.push(()=>{actor.root.removeFromParent();pool.release(actor);});
          break;
        }
        case 'pod': {
          const pool=owner['actorPool'], actor=pool.take('brood-pod',false);
          actor.setPodCountdown?.(160,subject.swollen?'swelling':'sealed');
          root=actor.root;
          disposable.push(()=>{root.removeFromParent();pool.release(actor);});
          break;
        }
        case 'ordnance': {
          const plasma=subject.weapon==='plasma';
          const flash=new T.MeshBasicMaterial({color:plasma?0xc2ecff:0xffc174});
          const wake=new T.MeshStandardMaterial({color:plasma?0x348bf3:0x705052,
            emissive:plasma?0x369eff:0x873d33,emissiveIntensity:1.3});
          const group=new T.Group();
          const tail=new T.Vector3(...subject.from).sub(new T.Vector3(subject.x,subject.y,subject.z));
          const streak=(start:T.Vector3,end:T.Vector3,tip:number,base:number,material:T.Material)=>{
            const axis=new T.Vector3().subVectors(end,start);
            const mesh=new T.Mesh(new T.CylinderGeometry(base,tip,axis.length(),8),material);
            mesh.position.copy(start).lerp(end,.5);
            mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),axis.normalize());
            group.add(mesh);
            disposable.push(()=>mesh.geometry.dispose());
          };
          if(plasma){
            streak(new T.Vector3(),tail,.065,.01,wake);
            streak(new T.Vector3(),tail.clone().multiplyScalar(.87),.03,.009,flash);
            const sparks=[[-.31,.29,.18],[-.15,.16,.44],[.04,.36,.22],[.16,.14,.31],[-.29,-.12,.24],[.11,-.23,.37]];
            for(const offset of sparks){
              const end=new T.Vector3(...offset);
              streak(end.clone().multiplyScalar(.28),end,.019,.005,flash);
            }
          }else{
            const casing=new T.MeshStandardMaterial({color:0x705a51,metalness:.48,roughness:.45});
            streak(new T.Vector3(),tail.clone().multiplyScalar(.16),.077,.077,casing);
            streak(tail.clone().multiplyScalar(-.09),new T.Vector3(),.005,.077,casing);
            streak(tail.clone().multiplyScalar(.16),tail.clone().multiplyScalar(.44),.055,.013,flash);
            // Break the smoke silhouette into overlapping puffs that widen away from the nozzle.
            for(let puff=0;puff<8;puff++){
              const mesh=new T.Mesh(new T.IcosahedronGeometry(.052+puff*.012,1),wake);
              mesh.position.copy(tail).multiplyScalar(.31+puff*.094);
              mesh.position.y+=Math.sin(puff*1.8)*.042;
              group.add(mesh);
              disposable.push(()=>mesh.geometry.dispose());
            }
            disposable.push(()=>casing.dispose());
          }
          root=group;
          disposable.push(()=>{flash.dispose();wake.dispose();});
          break;
        }
        case 'pickup':
          root=pickupModel(await loadPickupModels(owner.renderer),subject.id);
          for(const mesh of [...root.children])if(mesh instanceof T.Mesh&&mesh.material.name==='supply-locator'){
            mesh.geometry.dispose();mesh.removeFromParent();
          }
          disposable.push(()=>disposeModel(root));
          break;
        case 'weapon':
          root=weaponModel(subject.id).root;
          root.rotation.y=Math.PI/2;
          disposable.push(()=>disposeModel(root));
          break;
        case 'light':
          root=new T.PointLight(subject.color,subject.intensity,subject.distance);
          break;
        case 'glyph': {
          const image=new Image();
          const glyph=icon(subject.name).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')
            .replace('currentColor', '#'+subject.color.toString(16).padStart(6,'0'));
          image.src='data:image/svg+xml,'+encodeURIComponent(glyph);
          await image.decode();
          const map=new T.Texture(image);map.colorSpace=T.SRGBColorSpace;map.needsUpdate=true;
          const geometry=new T.PlaneGeometry(1,1).rotateX(-Math.PI/2);
          const material=new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false});
          root=new T.Mesh(geometry,material);
          disposable.push(()=>{map.dispose();geometry.dispose();material.dispose();});
          break;
        }
        case 'ring': {
          const ring=new T.Mesh(new T.RingGeometry(subject.radius-.035,subject.radius,72),
            new T.MeshStandardMaterial({color:subject.color,emissive:subject.color,emissiveIntensity:1.1,side:T.DoubleSide}));
          ring.geometry.rotateX(-Math.PI/2);
          root=ring;disposable.push(()=>{ring.material.dispose();ring.geometry.dispose();});
          break;
        }
        case 'prop': {
          const kit=await acquireRoomKit(KIT_URLS[subject.kit]);
          disposable.push(()=>retireRoomModels(kit));
          const prop=kit.getObjectByName(subject.name);
          if(!prop)throw Error(`Unknown ${subject.kit} prop ${subject.name}`);
          root=new T.Group();root.add(prop.clone(true));root.children[0].position.set(0,0,0);
          if(subject.tint!==undefined||subject.glow!==undefined)root.traverse(object=>{
            if(!(object instanceof T.Mesh)||!(object.material instanceof T.MeshStandardMaterial))return;
            const material=object.material.clone();
            if(subject.tint!==undefined)material.color.setHex(subject.tint);
            if(subject.glow!==undefined){material.emissive.setHex(subject.glow);material.emissiveIntensity=.7;}
            material.roughness=.72;
            object.material=material;
            disposable.push(()=>material.dispose());
          });
          break;
        }
      }
      root.position.set(subject.x??0,subject.y??(subject.kind==='pickup'?.1:0),subject.z??0);
      root.scale.multiplyScalar(subject.scale??1);
      if(subject.kind==='prop')root.rotation.y=subject.aim??0;
      const radius=subject.shadow??(shot.transparent||subject.kind==='ring'||subject.kind==='glyph'||subject.kind==='light'?0:subject.kind==='marine'?.7:subject.kind==='enemy'?.58:.42);
      if(radius>0){
        const shadow=new T.Mesh(new T.PlaneGeometry(radius*2,radius*1.55),groundIndicatorMaterial('contact',0x000609));
        shadow.rotation.x=-Math.PI/2;shadow.position.set(root.position.x,.012,root.position.z);
        stage.add(shadow);registerGeometry(shadow);
        disposable.push(()=>{shadow.material.dispose();shadow.geometry.dispose();});
      }
      root.visible=true; stage.add(root);firstSubject??=root;
      if(shot.lesson==='blocked-shot'&&subject.kind==='prop')lessonCover=root;
      registerGeometry(root,subject.kind==='marine'?GEOMETRY_CLASSES.marine:subject.kind==='enemy'?GEOMETRY_CLASSES.enemy:undefined);
    }
    for(const child of original.keys()){
      if(shot.room){if(child===owner['player'].root||[...owner['actors'].values()].some(actor=>actor.root===child))child.visible=false;}
      else child.visible=false;
    }
    if(!shot.room){
      scene.background=new T.Color(shot.transparent?0:0x102a31);
      scene.fog=null;
    }
    if(!shot.transparent&&!shot.room){
      const floor=new T.Mesh(new T.PlaneGeometry(80,80),new T.MeshStandardMaterial({color:0x102126,roughness:1}));
      floor.rotation.x=-Math.PI/2;floor.position.y=-.035;
      stage.add(floor);registerGeometry(floor,GEOMETRY_CLASSES.floor);
      disposable.push(()=>{floor.geometry.dispose();floor.material.dispose();});
    }
    scene.add(stage);
    if(shot.lesson==='blocked-shot'&&lessonCover){
      const bounds=new T.Box3().setFromObject(lessonCover);
      const muzzle=new T.Vector3(-1.8,bounds.max.y*.66,.15);
      const impact=new T.Vector3(bounds.min.x,muzzle.y,muzzle.z);
      const shotMaterial=new T.MeshStandardMaterial({color:0xbbeb54,emissive:0x8bcc25,emissiveIntensity:1.8});
      const trail=new T.Mesh(new T.CylinderGeometry(.021,.045,muzzle.distanceTo(impact),8),shotMaterial);
      trail.rotation.z=Math.PI/2;
      trail.position.copy(muzzle).lerp(impact,.5);
      const splash=new T.Mesh(new T.IcosahedronGeometry(.12,0),shotMaterial);
      splash.position.copy(impact);
      stage.add(trail,splash);
      registerGeometry(trail);
      registerGeometry(splash);
      disposable.push(()=>{trail.geometry.dispose();splash.geometry.dispose();shotMaterial.dispose();});
    }else if(shot.lesson){
      const attacker=shot.subjects.find(subject=>subject.kind==='enemy');
      const escape=shot.subjects.find(subject=>subject.kind==='marine');
      if(attacker&&escape){
        const shape=MELEE_ATTACKS[attacker.family].shape;
        const x=(attacker.x??0)*32,y=(attacker.z??0)*32,angle=attacker.aim??0;
        const warningShape=attacker.champion==='warden'?{kind:'line' as const,range:145,width:44,halfAngle:0}:shape;
        const length=warningShape.range/32,half=warningShape.width/64;
        const footprint=new T.Shape();
        if(warningShape.kind==='line'){
          footprint.moveTo(0,-half);footprint.lineTo(length,-half);footprint.lineTo(length,half);footprint.lineTo(0,half);
        }else{
          footprint.moveTo(0,0);
          for(let i=0;i<=28;i++){
            const theta=(i/14-1)*warningShape.halfAngle;
            footprint.lineTo(Math.cos(theta)*length,Math.sin(theta)*length);
          }
        }
        footprint.closePath();
        const groundMark=(shape:T.Shape,color:number,opacity:number)=>{
          const mark=new T.Mesh(new T.ShapeGeometry(shape),new T.MeshStandardMaterial({
            color,emissive:color,emissiveIntensity:.48,transparent:true,opacity,depthWrite:false,side:T.DoubleSide,
          }));
          mark.geometry.rotateX(Math.PI/2);stage.add(mark);registerGeometry(mark);
          disposable.push(()=>{mark.geometry.dispose();mark.material.dispose();});
          return mark;
        };
        const warning=groundMark(footprint,0xff2340,.4);
        warning.position.set(x/32,.015,y/32);warning.rotation.y=-angle;
        const arrowShape=new T.Shape();
        arrowShape.moveTo(-.07,0);arrowShape.lineTo(.07,0);arrowShape.lineTo(.07,.93);
        arrowShape.lineTo(.22,.93);arrowShape.lineTo(0,1.38);arrowShape.lineTo(-.22,.93);arrowShape.lineTo(-.07,.93);arrowShape.closePath();
        groundMark(arrowShape,0xbce9ff,.9).position.set((escape.x??0)-.6,.04,(escape.z??0)-1.15);

      }
    }
    if(shot.boonEffects?.length){
      effects.clear();
      for(const receipt of shot.boonEffects)effects.event({...receipt,x:receipt.x+worldX,y:receipt.y+worldY,
        targetX:receipt.targetX===undefined?undefined:receipt.targetX+worldX,
        targetY:receipt.targetY===undefined?undefined:receipt.targetY+worldY,
      });
      for(const mesh of effects['meshes']())if(mesh.parent===scene)mesh.visible=true;
      for(let tick=0;tick<(shot.effectFrames??4);tick++)effects.update(1/60,camera,[]);
    }
    if(shot.effect){
      const effect=shot.effect;
      abilities.clear(); abilities.root.visible=true;
      const kit=abilities.kit;
      if(kit){kit.time=0;kit['serial']=0;}
      for(const receipt of shot.extraEffects??[])abilities.event(target(receipt.event),receipt.x*32+worldX,receipt.z*32+worldY);
      abilities.event(target(effect),(shot.subjects[0]?.x??0)*32+worldX,(shot.subjects[0]?.z??0)*32+worldY);
      const deployables=shot.deployables?.map(d=>({...d,x:d.x+worldX,y:d.y+worldY}))??[];
      const zones=shot.zones?.map(z=>({...z,x:z.x+worldX,y:z.y+worldY,x2:z.x2+worldX,y2:z.y2+worldY}))??[];
      const links=shot.links?.map(l=>({...l,x:l.x+worldX,y:l.y+worldY,targetX:l.targetX+worldX,targetY:l.targetY+worldY}))??[];
      const snapshot=game.abilities.snapshot;
      for(let tick=0;tick<(shot.effectFrames??10);tick++){
        abilities.update({...snapshot,rig:effect.rig,deployables,zones,links},1/60,true,undefined,firstSubject,camera);
      }
    }
    renderer.setPixelRatio(1); renderer.setSize(shot.width,shot.height,false);
    if(shot.framePortrait&&firstSubject){
      stage.updateMatrixWorld(true);
      const bounds=new T.Box2(),point=new T.Vector3(),projected=new T.Vector2();
      firstSubject.traverseVisible(object=>{
        if(!(object instanceof T.Mesh))return;
        if(object instanceof T.SkinnedMesh)object.skeleton.update();
        const positions=object.geometry.getAttribute('position');
        for(let index=0;index<positions.count;index++){
          object.getVertexPosition(index,point).applyMatrix4(object.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
          bounds.expandByPoint(projected.set(point.x,point.y));
        }
      });
      const size=bounds.getSize(new T.Vector2()),middle=bounds.getCenter(new T.Vector2());
      const frameHeight=Math.max(size.y/.90,size.x/(aspect*.98));
      camera.left=middle.x-frameHeight*aspect/2;camera.right=middle.x+frameHeight*aspect/2;
      camera.bottom=middle.y-frameHeight/2;camera.top=middle.y+frameHeight/2;
      camera.updateProjectionMatrix();
    }
    post.setCamera(camera); post.setSize(shot.width,shot.height,1);
    const output=document.createElement('canvas');
    output.width=shot.width; output.height=shot.height;
    const ctx=output.getContext('2d',{willReadFrequently:true})!;
    post.render(0); ctx.drawImage(renderer.domElement,0,0);
    if(!shot.transparent&&!shot.room){
      const gradient=ctx.createRadialGradient(shot.width*.5,shot.height*.56,shot.height*.16,shot.width*.5,shot.height*.56,shot.width*.63);
      gradient.addColorStop(0,'transparent');gradient.addColorStop(1,'rgba(1,8,12,.69)');
      ctx.fillStyle=gradient;ctx.fillRect(0,0,shot.width,shot.height);
    }
    if(shot.transparent){
      const foreground=ctx.getImageData(0,0,shot.width,shot.height);
      stage.visible=false; abilities.root.visible=false;
      post.render(0); ctx.drawImage(renderer.domElement,0,0);
      const empty=ctx.getImageData(0,0,shot.width,shot.height).data;
      for(let i=0;i<empty.length;i+=4){
        const difference=Math.max(Math.abs(empty[i]-foreground.data[i]),Math.abs(empty[i+1]-foreground.data[i+1]),Math.abs(empty[i+2]-foreground.data[i+2]));
        foreground.data[i+3]=Math.min(255,Math.max(0,difference-2)*24);
      }
      ctx.putImageData(foreground,0,0);
      if(shot.framePortrait&&firstSubject){
        const foot=firstSubject.getWorldPosition(new T.Vector3()).project(camera);
        ctx.save();
        ctx.globalCompositeOperation='destination-over';
        ctx.translate((foot.x*.5+.5)*shot.width,(.5-foot.y*.5)*shot.height);
        ctx.scale(1,.28);
        const radius=shot.width*.24,shadow=ctx.createRadialGradient(0,0,0,0,0,radius);
        shadow.addColorStop(0,'rgba(0, 6, 9, .65)');
        shadow.addColorStop(1,'rgba(0, 6, 9, 0)');
        ctx.fillStyle=shadow;ctx.fillRect(-radius,-radius,radius*2,radius*2);
        ctx.restore();
      }
    }
    return output.toDataURL(shot.transparent?'image/png':'image/webp',.88);
  } finally {
    abilities.clear();
    if(shot.boonEffects?.length)effects.clear();
    stage.removeFromParent();
    for(const release of disposable.reverse())release();
    for(const [child,visible] of original)child.visible=visible;
    scene.background=background;scene.fog=fog;
    renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);
    post['time']=postTime;
    post.setCamera(owner.camera);post.setSize(size.x,size.y,ratio);
  }
}
