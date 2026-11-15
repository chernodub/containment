/** Original room-specific interior color/function direction. No simulation state. */
export type FunctionKind=string;
export type InteriorProfile={kind:FunctionKind;deck:number;zone:number;trim:number;key:number;landmark:string};
export const INTERIOR_PROFILES:Record<string,InteriorProfile>={
  'diagnostic-gallery':{kind:'diagnostics',deck:0x657079,zone:0x879396,trim:0xb8d0d0,key:0x6fcddd,landmark:'Four-bay instrument rail and probe stations'},
  'crew-checkpoint':{kind:'checkpoint',deck:0x5d6870,zone:0x848278,trim:0x9aa399,key:0xc6dce4,landmark:'Inspection scanner and hardwired security terminals'},
  'swarm-junction':{kind:'ventilation',deck:0x69716a,zone:0x4d3f4d,trim:0x899180,key:0xadc3a0,landmark:'Sealed ventilation plenums split by rooted growth'},
};
