/** Per-room motivated composition; no exposure compensation or simulation data. */
export type RoomComposition=Readonly<{
  idea:string;keyOffset:readonly [number,number,number];keyGain:number;fillGain:number;practicalGain:number;
}>;
const composition=(idea:string,keyOffset:readonly [number,number,number],keyGain=1,fillGain=1,practicalGain=1):RoomComposition=>Object.freeze({idea,keyOffset,keyGain,fillGain,practicalGain});
export const ROOM_COMPOSITIONS:Readonly<Record<string,RoomComposition>>=Object.freeze({
  'awakening-bay':composition('An open berth in a sea of sleeping passengers',[-16,10,10],1,1,1.5),
  'passenger-vault':composition('Cold ranks of occupied cryopods',[-12,11,12],1.1,1.5,.72),
  'residential-gallery':composition('Warm thresholds against abandoned cold corridors',[-13,9,11],1.9,1.5,4),
  'communal-atrium':composition('A last artificial garden under amber task lights',[-16,9,10],1.8,2.0),
  'crew-checkpoint':composition('The last defensive line cut by hard white light',[-14,12,9],1.03,1),
  armory:composition('An illuminated radial arsenal',[-16,12,10],1,1,1.25),
  'freight-hold':composition('Sodium lanes between ribbed colony freight',[-15,8,12],2.4,2.1,2.7),
  'breached-loading-bay':composition('The boarding scar sealed inside the hull',[-16,8,10],2.2,2.2,1.5),
  'relay-racks':composition('Dark rack faces and localized data signals',[-16,10,10],1,1,.85),
  'transmission-chamber':composition('A single bright uplink against quiet racks',[-14,10,11],1.6,1.9,1.1),
  'diagnostic-gallery':composition('The independent display wall exposes the truth',[-16,5,10],1.8,4.5),
  'safety-interlock-station':composition('Amber evidence preserved on the service recorder',[-16,5,10],1.85,2.3),
  'coolant-plant':composition('Wet teal steel beneath warm copper coolant loops',[-15,9,11],1,1.03,1.4),
  'service-shaft-landing':composition('A fading green bridge above the disconnected ship',[-16,9,10],1.45,1.35,1.5),
  'infested-workshop':composition('Human machinery reclaimed by living tissue',[-16,8,10],.9,.9,.9),
  'swarm-junction':composition('Brood eggs glowing against magenta vascular growth',[-14,9,10],.82,.85,.82),
  'shielding-gate':composition('Clinical violet barriers before the core',[-15,11,10],1.05,1.02,4.5),
  'containment-annulus':composition('An ordered violet ring around the forbidden center',[-16,11,10]),
  'manual-control-chamber':composition('Incandescent authorization machinery against the occupied ship',[0,3.2,0],1.2,2.8,1.35),
  'overload-floor':composition('White-hot energy keys the deck outward from the failed reactor well',[0,3.2,0],1.25,.85,.85),
  'reactor-vault':composition('The Queen owns the brightest key and a cold counter-rim',[0,9,7],1,1,1),
  receiving:composition('Amber arrival lanes between the surviving cargo',[-15,8,12],2.2,1.8,3.2),
  'forklift-loop':composition('Warm service pools around the dark freight block',[-15,8,12],2.6,2,4),
  'freight-crossing':composition('Sodium pools cut the crossing cargo lanes',[-15,8,12],2.1,1.8,3),
  'rail-depot':composition('Lit freight labels interrupt the long rail shadow',[-15,8,12],2.6,2,4),
  'cold-aisle':composition('A cold task-light chain follows the open berths',[-12,11,12],.8,.95,1.1),
  'cryo-gallery':composition('Cold ranks recede into quiet blue steel',[-12,11,12],.55,.9,.95),
  'pump-ring':composition('Teal light traces the copper pump circuit',[-15,9,11],1.2,1.1,1.25),
  filtration:composition('Wet steel catches the filtering machinery light',[-15,9,11],1.15,1.1,1.4),
  'specimen-bay':composition('Violet task light isolates the specimen shelves',[-15,11,10],.75,.9,2.5),
  'quarantine-cross':composition('Violet barriers divide the transfer crossing',[-15,11,10],1,1,1.3),
  'security-lock':composition('Hard warning pools flank the security line',[-14,12,9],.6,.85,.85),
  'turbine-hall':composition('Amber screen rows emerge from the turbine shadow',[-16,5,10],.85,.95,.9),
  'power-conduits':composition('The remaining power follows the bright service spine',[-16,5,10],.9,.95,.9),
  'waste-processing':composition('Living green tissue occupies the abandoned waste works',[-14,9,10],.85,1,.7),
  'hive-approach':composition('Brood glow leads toward the occupied reactor',[-14,9,10]),
});
export const DEFAULT_ROOM_COMPOSITION=composition('Industrial light follows the surviving ship systems',[-16,10,10]);
export function roomComposition(id?:string):RoomComposition{return id&&ROOM_COMPOSITIONS[id]||DEFAULT_ROOM_COMPOSITION;}
