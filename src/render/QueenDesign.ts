import type {ActorPart} from './ActorIdentity';

type Point = [number, number, number];
type QueenPart = ActorPart & {anchor?: Point};

/** A crown-mantled arthropod: articulated supports, a front mask and a split thorax. */
export function queenDesign(span: number, height: number): QueenPart[] {
  const s=span,h=height,parts:QueenPart[]=[];
  const point=(p:Point):Point=>[p[0]*s,p[1]*h,p[2]*s];
  const add=(shape:ActorPart['shape'],role:number,p:Point,size:Point,joint?:string,anchor?:Point)=>{
    parts.push({shape,role,position:point(p),scale:point(size),joint,anchor:anchor?point(anchor):undefined,fitted:false});
  };
  const limb=(role:number,a:Point,b:Point,radius:number,joint?:string,anchor?:Point)=>{
    parts.push({shape:'segment',role,position:point(a),end:point(b),scale:[radius*s,1,radius*s],joint,anchor:anchor?point(anchor):undefined,fitted:false});
  };

  // Dark continuous thorax and low reproductive abdomen ground the side armor.
  add('plate',2,[0,.60,-.025],[.235,.25,.29]);
  add('sac',7,[0,.57,-.29],[.23,.26,.18]);

  for(const side of [-1,1]) {
    // Three scutes share one hinge per side, so exposure opens two rigid wings.
    const hinge:Point=[side*.16,.83,0];
    for(let i=0;i<3;i++) {
      add('plate',5,[side*.16,.85-i*.015,.17-i*.17],[.175,.18,.125],undefined,hinge);
    }

    // Broad forearms and four rear supports carry the mantle rather than hang
    // as hair-thin decorative appendages. Each joins the retained source joint.
    const hand=side<0?'clawr':'clawl',arm=side<0?'forearmr':'forearml';
    limb(11,[side*.17,.64,.13],[side*.32,.36,.20],.082,arm);
    limb(2,[side*.32,.36,.20],[side*.34,.065,.25],.070,hand);
    add('carapace',11,[side*.34,.065,.25],[.080,.075,.10],hand);
    for(const back of [false,true]) {
      const z=back?-.23:-.035,joint=(back?'footback':'footfront')+(side<0?'r':'l');
      limb(11,[side*.17,.46,z],[side*.31,.28,z-.045],.063,joint);
      limb(2,[side*.31,.28,z-.045],[side*.39,.055,z-.065],.052,joint);
    }
  }

  // The front is a separate, directional mask under a wide orbital brow.
  add('shield',12,[0,.66,.335],[.145,.13,.13],'head');
  add('carapace',11,[0,.79,.29],[.18,.085,.14],'head');
  for(const side of [-1,1]) {
    add('plate',4,[side*.12,.53,.385],[.070,.11,.090],'head');
    add('eye',10,[side*.065,.745,.385],[.021,.025,.027],'head');
  }

  // Two asymmetric ventricles surround a dark longitudinal valve. The single
  // raised artery is the luminous target focus; all three semantic roles share
  // exactly the same opening transform, rather than sliding apart as ornaments.
  const organ:Point=[0,.80,.015];
  add('sac',3,[-.060,.775,.025],[.090,.115,.13],undefined,organ);
  add('sac',3,[.065,.79,-.015],[.080,.130,.13],undefined,organ);
  add('plate',17,[0,.815,.065],[.035,.045,.080],undefined,organ);
  limb(18,[.012,.845,-.015],[.005,.895,-.115],.023,undefined,organ);

  // Broken, flared attachment tendons leave the forward sternum open. There
  // is no continuous lip, horizontal crossbar, ladder, or bowl-shaped surface.
  for(const side of [-1,1]) {
    limb(9,[side*.13,.69,-.07],[side*.16,.84,-.10],.028);
    limb(8,[side*.17,.82,-.17],[side*.11,.90,-.09],.025);
    limb(8,[side*.17,.81,.105],[side*.115,.875,.12],.021);
  }
  return parts;
}
