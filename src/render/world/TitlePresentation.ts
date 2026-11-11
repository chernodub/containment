import * as T from 'three';
import {box,rod,batch,disposeModel} from '../meshParts';

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
