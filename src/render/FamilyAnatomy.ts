import type {ActorPart} from './ActorIdentity';

type Point = [number, number, number];

/** Root-space proportions: shell, articulated trunk, and planted contact limbs. */
export function familyAnatomy(kind: string, span: number, height: number): ActorPart[] {
  const s = span, h = height, parts: ActorPart[] = [];
  const add = (shape: ActorPart['shape'], role: number, p: Point, size: Point, joint?: string) => {
    parts.push({shape, role, position: [p[0]*s,p[1]*h,p[2]*s], scale: [size[0]*s,size[1]*h,size[2]*s], fitted: false, joint});
  };
  const limb = (a: Point, b: Point, radius: number, role: number, joint?: string) => {
    const from: Point = [a[0]*s,a[1]*h,a[2]*s], to: Point = [b[0]*s,b[1]*h,b[2]*s];
    parts.push({shape:'segment',role,position:from,scale:[radius*s,1,radius*s],end:to,joint,fitted:false});
  };
  if (kind === 'brute') {
    // A three-segment siege beetle. The negative seams are actual gaps between
    // overlapping plates, and the jaw is forward of the shoulder mass.
    add('plate',2,[0,.59,-.08],[.25,.23,.30]);
    for (let i=0;i<3;i++) add('carapace',i===1?11:4,[0,.83-i*.055,.16-i*.19],[.255-i*.018,.22,.14]);
    add('plate',12,[0,.68,.35],[.18,.18,.11],'head');
    for(const side of [-1,1])add('eye',10,[side*.095,.75,.39],[.035,.035,.04],'head');
    for (const side of [-1,1]) {
      add('plate',10,[side*.095,.55,.395],[.065,.09,.075],'head');
      add('plate',11,[side*.19,.70,.22],[.12,.17,.12],side<0?'forearmr':'forearml');
      limb([side*.17,.64,.16],[side*.29,.36,.22],.095,11,side<0?'forearmr':'forearml');
      limb([side*.29,.36,.22],[side*.285,.065,.265],.075,2,side<0?'clawr':'clawl');
      add('plate',4,[side*.26,.065,.25],[.08,.07,.09],side<0?'clawr':'clawl');
      for (const z of [-.22,-.025]) {
        const joint=(z<-.1?'footback':'footfront')+(side<0?'r':'l');
        limb([side*.17,.43,z],[side*.30,.08,z-.04],.065,2,joint);
        add('plate',11,[side*.28,.07,z-.04],[.075,.07,.085],joint);
      }
    }
  } else if (kind === 'spitter') {
    // Raised rear pressure vessel, low muzzle, four outriggers: a mortar animal.
    add('plate',2,[0,.56,.015],[.17,.28,.29]);
    add('sac',7,[0,1.02,-.16],[.205,.42,.19],'bum');
    for (const side of [-1,1]) {
      add('plate',4,[side*.14,.84,-.13],[.065,.25,.19],'bum');
      add('plate',12,[side*.07,.61,.31],[.085,.12,.12],'head');
      add('plate',10,[side*.065,.67,.39],[.033,.055,.05],'head');
      for (const back of [false,true]) {
        const z=back?-.25:.20,joint=(back?'leg_b1':'leg_m1')+(side<0?'R':'L');
        limb([side*.12,.57,z*.6],[side*.29,.32,z],.055,11,joint);
        limb([side*.29,.32,z],[side*.31,.055,z*1.2],.045,2,joint);
        add('plate',4,[side*.29,.065,z*1.1],[.055,.08,.065],joint);
      }
    }
    add('plate',11,[0,.66,.22],[.16,.12,.10],'head');
  } else if (kind === 'crawler') {
    add('plate',2,[0,.45,0],[.25,.28,.31]);
    for (let i=0;i<3;i++) add('carapace',i===1?11:4,[0,.73-i*.035,.12-i*.17],[.29-i*.025,.28,.105]);
    add('plate',12,[0,.42,.29],[.18,.20,.13]);
    for (const side of [-1,1]) {
      add('plate',10,[side*.13,.30,.34],[.08,.16,.105]);
      for (let i=0;i<3;i++) {
        const z=.23-i*.23,joint=`leg${side<0?i:5-i}_lower`;
        limb([side*.16,.48,z],[side*.29,.22,z-.035],.075,11,joint);
        limb([side*.29,.22,z-.035],[side*.30,.06,z-.04],.065,2,joint);
      }
    }
  } else if (kind === 'stalker') {
    add('plate',2,[0,.45,-.02],[.19,.30,.32]);
    add('plate',4,[0,.72,-.13],[.19,.27,.22]);
    add('plate',12,[0,.56,.27],[.13,.23,.13],'head');
    for (const side of [-1,1]) {
      // Folded hooked scythes replace a generic shoulder cape.
      limb([side*.10,.66,.18],[side*.285,.37,.255],.08,11,side<0?'arm_midR':'arm_midL');
      // One rigid hooked forearm keeps its contiguous plates attached while the
      // imported wrist controls execute their attack clip.
      limb([side*.285,.37,.255],[side*.17,.18,.36],.07,10,side<0?'arm_midR':'arm_midL');
      for (const back of [false,true]) {
        const z=back?-.25:.13,joint=`leg_${back?'back':'front'}_mid${side<0?'R':'L'}`;
        limb([side*.12,.45,z],[side*.30,.07,z-.025],.06,2,joint);
      }
    }
    add('plate',11,[0,.91,-.23],[.10,.24,.10]);
    add('spine',10,[0,1.19,-.23],[.105,.27,.08]);
  } else if (kind === 'carrier') {
    add('plate',2,[0,.50,.03],[.19,.25,.30]);
    add('sac',7,[0,.86,-.19],[.26,.44,.22]);
    for (const side of [-1,1]) {
      for (let i=0;i<3;i++) add('carapace',i===1?11:4,[side*.15,.98-i*.12,-.19],[.085,.12,.205]);
      add('plate',12,[side*.07,.57,.29],[.085,.15,.13],'head');
      add('plate',10,[side*.085,.59,.39],[.045,.07,.065],'head');
      for (const [n,z] of ['back','middle','front'].map((n,i)=>[n,-.24+i*.23] as const)) {
        const joint=`leg_${n}001${side<0?'R':'L'}`;
        limb([side*.12,.50,z],[side*.29,.30,z],.065,11,joint);
        limb([side*.29,.30,z],[side*.34,.055,z],.055,2,joint);
      }
    }
  }
  return parts;
}

/** Resident rank gates preserve the same ordinary physical footprint. */
export function rankAnatomy(span: number, height: number): ActorPart[] {
  const s = span, h = height;
  return [
    {shape:'spine',role:1,position:[0,h*1.05,-s*.07],scale:[s*.075,h*.22,s*.065],fitted:false},
    {shape:'plate',role:6,position:[0,h*1.08,-s*.07],scale:[s*.22,h*.055,s*.075],fitted:false},
    {shape:'spine',role:6,position:[-s*.13,h*1.26,-s*.07],scale:[s*.065,h*.25,s*.065],fitted:false},
    {shape:'spine',role:6,position:[s*.13,h*1.26,-s*.07],scale:[s*.065,h*.25,s*.065],fitted:false},
    {shape:'spine',role:6,position:[0,h*1.39,-s*.07],scale:[s*.085,h*.32,s*.075],fitted:false},
  ];
}
