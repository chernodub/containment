/** Per-room motivated composition; no exposure compensation or simulation data. */
export type RoomComposition=Readonly<{
  idea:string;keyOffset:readonly [number,number,number];keyGain:number;fillGain:number;practicalGain:number;
}>;
const composition=(idea:string,keyOffset:readonly [number,number,number],keyGain=1,fillGain=1,practicalGain=1):RoomComposition=>Object.freeze({idea,keyOffset,keyGain,fillGain,practicalGain});
export const ROOM_COMPOSITIONS:Readonly<Record<string,RoomComposition>>=Object.freeze({
  'awakening-bay':composition('An open berth in a sea of sleeping passengers',[-16,10,10]),
  'passenger-vault':composition('Cold ranks of occupied cryopods',[-12,11,12],.62,.82,.8),
  'residential-gallery':composition('Warm thresholds against abandoned cold corridors',[-13,9,11],1.45,1.25,1.7),
  'communal-atrium':composition('A last artificial garden under amber task lights',[-16,9,10]),
  'crew-checkpoint':composition('The last defensive line cut by hard white light',[-14,12,9],1.03,1),
  armory:composition('An illuminated radial arsenal',[-16,12,10]),
  'freight-hold':composition('Sodium lanes between ribbed colony freight',[-15,8,12],1.4,1.8,1.25),
  'breached-loading-bay':composition('The boarding scar sealed inside the hull',[-16,8,10]),
  'relay-racks':composition('A cyan spine through the data aisles',[-16,10,10]),
  'transmission-chamber':composition('A single bright uplink against quiet racks',[-14,10,11],1.4,1.8,1.3),
  'diagnostic-gallery':composition('The independent display wall exposes the truth',[-16,5,10],1.01,1.05),
  'safety-interlock-station':composition('Amber evidence preserved on the service recorder',[-16,5,10]),
  'coolant-plant':composition('Wet teal steel beneath warm copper coolant loops',[-15,9,11],1,1.03),
  'service-shaft-landing':composition('A fading green bridge above the disconnected ship',[-16,9,10],1.45,1.35,1.5),
  'infested-workshop':composition('Human machinery reclaimed by living tissue',[-16,8,10]),
  'swarm-junction':composition('Brood eggs glowing against magenta vascular growth',[-14,9,10],.82,.85,.82),
  'shielding-gate':composition('Clinical violet barriers before the core',[-15,11,10],1.05,1.02,1.3),
  'containment-annulus':composition('An ordered violet ring around the forbidden center',[-16,11,10]),
  'manual-control-chamber':composition('One lit authorization console faces the occupied ship',[0,3.2,0],.95,1.12,1.1),
  'overload-floor':composition('Orange-white core light consumes the final deck',[0,3.2,0]),
  'reactor-vault':composition('The Queen owns the brightest key and a cold counter-rim',[0,9,7],1,1,1),
});
export const DEFAULT_ROOM_COMPOSITION=composition('Industrial light follows the surviving ship systems',[-16,10,10]);
export function roomComposition(id?:string):RoomComposition{return id&&ROOM_COMPOSITIONS[id]||DEFAULT_ROOM_COMPOSITION;}
