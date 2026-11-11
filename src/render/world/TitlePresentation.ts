import * as T from 'three';
import {box,rod,batch,disposeModel} from '../meshParts';
import {sleepingPassenger} from './EquipmentDetail';
import {optimizeLocalLights} from '../lighting/LocalLightShading';

/** Original occupied berth display: faint human form behind frost, with individual life telemetry. */
function occupiedGlass():T.DataTexture {
  const width=128,height=256,pixels=new Uint8Array(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    const u=x/width,v=y/height,dx=u-.5;
    const frost=Math.max(0,(Math.abs(dx)-.28)*2.3)+Math.max(0,.10-v)*3;
    const noise=((Math.imul(x+17,374761393)^Math.imul(y+43,668265263))>>>0)%29/29;
    const figure=sleepingPassenger(u,1-v);
    let r=figure?8:18,g=figure?23:41,b=figure?29:52;
    r+=frost*42+noise*3;g+=frost*52+noise*4;b+=frost*56+noise*5;
    if(v>.79&&v<.93&&u>.12&&u<.88){r=4;g=14;b=19;
      const phase=(u*5)%1,wave=.855+(phase>.34&&phase<.43?-.035:phase>.43&&phase<.51?.045:Math.sin(u*17)*.003);
      if(Math.abs(v-wave)<.004){r=159;g=232;b=255;}
    }
    const i=(y*width+x)*4;pixels[i]=r;pixels[i+1]=g;pixels[i+2]=b;pixels[i+3]=255;
  }
  const texture=new T.DataTexture(pixels,width,height);texture.colorSpace=T.SRGBColorSpace;
  texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}

/** A separate, original cryobay set: the left half is negative space for the title UI. */
export class TitlePresentation {
  readonly root = new T.Group();
  private readonly target = new T.Vector3();
  private disposed = false;
  constructor(scene?: T.Scene) {
    this.root.name = 'cinematic-awakening-set';
    const material = (name:string,color:number,metalness:number,roughness:number,emissive=0,intensity=0) => {
      const m = new T.MeshStandardMaterial({color,metalness,roughness,emissive,emissiveIntensity:intensity});
      m.name = name; m.userData.actorMaterial = true; return m;
    };
    const steel=material('title-bulkhead',0x192a33,.72,.42),paint=material('title-ceramic',0x60777c,.45,.52),
      black=material('title-gaskets',0x070e13,.15,.85),glass=material('title-pod-glass',0x14303b,.82,.15),
      cold=material('title-cold-strip',0x8ac5db,.5,.3,0x9fe8ff,2.2),warm=material('title-emergency',0x865c3c,.5,.4,0xff9362,1.5);
    const occupants=occupiedGlass();glass.map=glass.emissiveMap=occupants;glass.color.setHex(0xc5e0e5);glass.emissive.setHex(0x9fe8ff);glass.emissiveIntensity=.7;glass.metalness=.25;glass.roughness=.34;
    // The occupied displays use the same mapped/emissive room material program.
    optimizeLocalLights(glass);
    glass.addEventListener('dispose',()=>occupants.dispose());
    box(this.root,23,-.18,12,32,.3,30,steel,0);
    // The visible broken berth behind the hero establishes the awakening beat.
    for(const x of [24.5,28.4,32.3]) {
      box(this.root,x,1.9,8.8,3.2,3.8,.7,black,.16);
      box(this.root,x,2.0,9.15,2.8,3.3,.22,paint,.15);
      box(this.root,x,2.15,9.29,2.25,2.5,.08,glass,.2);
      for(const side of [-1,1])box(this.root,x+side*1.35,2,9.34,.075,2.95,.08,cold,.025);
      box(this.root,x,3.6,9.27,1.25,.08,.12,cold,.025);
      box(this.root,x,.45,9.4,2.8,.24,1.3,steel,.08);
      for(let n=0;n<5;n++)box(this.root,x-.8+n*.4,.82,9.5,.12,.04,.16,n===1?warm:cold,.015);
    }
    for(let i=0;i<6;i++) {
      const x=18+i*3.5;
      box(this.root,x,3.2,7.6,3.42,6.4,.5,steel,.06);
      box(this.root,x-1.65,3.3,8,.16,6.6,.5,paint,.04);
      for(const y of [4.3,5.6])rod(this.root,new T.Vector3(x-1.7,y,8.05),new T.Vector3(x+1.7,y,8.05),.065,.065,black);
      box(this.root,x,5.3,8.05,2.2,.06,.1,i%3===0?warm:cold,.02);
    }
    // Deck seams and a single rescue stripe carry the eye toward the marine.
    for(let z=9;z<22;z+=2.8)box(this.root,25,-.015,z,22,.012,.018,black,0);
    for(let z=11;z<23;z+=.7)box(this.root,25.8,.002,z,.08,.012,.34,paint,0);
    batch(this.root);this.root.visible=false;scene?.add(this.root);
  }
  /** Native gameplay camera is re-applied by CameraRig before every menu call. */
  apply(camera:T.OrthographicCamera|T.PerspectiveCamera,time:number,reducedMotion:boolean) {
    const drift=reducedMotion?0:Math.sin(time*.12)*.12;
    camera.position.set(20.3+drift,4.8,28.8);
    this.target.set(20.7+drift*.35,1.6,12.8);camera.lookAt(this.target);
    camera.zoom=1;camera.updateProjectionMatrix();camera.updateMatrixWorld();
  }
  dispose() {if(this.disposed)return;this.disposed=true;disposeModel(this.root);}
}
