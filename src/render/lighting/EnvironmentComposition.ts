import type {ShipEnvironment} from '../ShipEnvironments';

/** Value composition is sourced from hardware; the common bounce draw must not stamp every mood alike. */
export const ENVIRONMENT_COMPOSITION:Record<ShipEnvironment,Readonly<{bounce:number;wall:readonly number[];width:number;depth:number}>>={
 cryogenics:{bounce:.22,wall:[.18,.62,.08,.4],width:.38,depth:2.1},
 habitation:{bounce:.36,wall:[.14,1,.06,.28],width:.85,depth:2.9},
 security:{bounce:.10,wall:[.08,.28,.06,1],width:.32,depth:1.65},
 cargo:{bounce:.52,wall:[.22,.74,1,.12],width:.64,depth:3.1},
 communications:{bounce:.08,wall:[.06,.2,.02,.1],width:.24,depth:1.4},
 engineering:{bounce:.48,wall:[1,.16,.45,.06],width:.45,depth:3.2},
 maintenance:{bounce:.24,wall:[.18,.7,.07,.32],width:.35,depth:2.65},
 infested:{bounce:.28,wall:[.08,.6,.18,.9,.03],width:.62,depth:2.8},
 containment:{bounce:.07,wall:[.04,.18,.04,.64],width:.30,depth:1.7},
 reactor:{bounce:.72,wall:[1,.15,.42,.06],width:.75,depth:3.5},
};
export function wallSourceGain(environment:ShipEnvironment,index:number):number{const values=ENVIRONMENT_COMPOSITION[environment].wall;return values[index%values.length];}
