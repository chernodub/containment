import * as T from 'three';

/**
 * LIGHT13 value hierarchy: "the ship is dark; actors carry the light".
 * A room adopts the standard by adding one profile below. Every value is a
 * uniform on materials that already exist, so a profile adds no draw, pass,
 * light or shader variant; unprofiled rooms keep the neutral defaults.
 * See docs/nextgen/LIGHT13-HANDOFF.md for target luminance bands.
 */
export type RoomValueProfile = Readonly<{
  /** Deck albedo multiplier inside baked fixture pools, outside them, and at hull/void edges. */
  /** Three fixture centres in native room units; the fight circle remains pool zero. */
  /** Landmark source in native units; bounded self-light and deck spill, below actor plates. */
  landmark?: Readonly<{at:readonly [number,number];color:number;radius:number;body:number;spill:number}>;
  fixturesAt?: readonly (readonly [number, number])[];
  floor: Readonly<{lit:number; unlit:number; edge:number}>;
  /** Fight-circle falloff from the authored arena centre (metres) toward the perimeter multiplier. */
  perimeter: Readonly<{inner:number; outer:number; value:number; lane?:number}>;
  /* lane: radius scale of the secondary named-space pools relative to the fight circle (default .55). */
  /** Final multiplier and saturation of lit architecture/props (floors take saturation only). */
  wall: Readonly<{value:number; saturation:number}>;
  floorSaturation: number;
  /** Colour identity, multiplied into lit environment surfaces after desaturation. */
  tint: number;
  /** Scale of neutral (white/pale) emissive fixtures; coloured warning/route emitters are kept. */
  fixtures: number;
  /** Scale of the four pooled practical point lights and the directional fill/ambient. */
  practicals: number;
  ambient: number;
  /** Marine rig-lamp floor glow gain on this room's surfaces (0 disables). */
  marineGlow: number;
  /** Extra baked exit light (0..1) so the exit is signalled by a pool. */
  exit: number;
}>;

const profile = (p: RoomValueProfile) => Object.freeze(p);

export const ROOM_VALUE_PROFILES: Readonly<Record<string, RoomValueProfile>> = Object.freeze({
  // Occupied pod windows, medical observation face and south life-support chain.
  'passenger-vault': profile({
    fixturesAt:[[600,320],[1000,440],[600,700]],
    floor:{lit:.42,unlit:.22,edge:.11},perimeter:{inner:3.8,outer:9.5,value:.34,lane:.75},
    wall:{value:.50,saturation:.56},floorSaturation:.48,tint:0xccd7ef,
    fixtures:.20,practicals:.48,ambient:.46,marineGlow:1,exit:.9,
  }),
  // Warm cabin lamps at interrupted packing, opposite cabin and common nook.
  'residential-gallery': profile({
    fixturesAt:[[300, 280], [900, 720], [160, 480]],
    floor:{lit:.42,unlit:.22,edge:.11},perimeter:{inner:3.8,outer:9.5,value:.36,lane:.8},
    wall:{value:.52,saturation:.56},floorSaturation:.50,tint:0xead0a6,
    fixtures:.20,practicals:.50,ambient:.48,marineGlow:1,exit:.9,
  }),
  // Skylight on the garden, water bed and dining court.
  'communal-atrium': profile({
    fixturesAt:[[589, 355], [728, 150], [1090, 480]],
    floor:{lit:.42,unlit:.22,edge:.11},perimeter:{inner:3.8,outer:9.5,value:.36,lane:.8},
    wall:{value:.52,saturation:.56},floorSaturation:.50,tint:0xd5e4c7,
    fixtures:.20,practicals:.50,ambient:.48,marineGlow:1,exit:.9,
  }),
  // Carousel spindle, port magazine and starboard fitting lamps.
  'armory': profile({
    fixturesAt:[[600, 450], [180, 380], [1020, 380]],
    floor:{lit:.38,unlit:.20,edge:.10},perimeter:{inner:3.8,outer:9.5,value:.36,lane:.8},
    wall:{value:.52,saturation:.56},floorSaturation:.50,tint:0xcdd7e9,
    fixtures:.20,practicals:.50,ambient:.48,marineGlow:1,exit:.9,
  }),
  // Suspension gantry, loading booth and dispatch lamps.
  'freight-hold': profile({
    fixturesAt:[[790, 486], [318, 584], [1000, 600]],
    floor:{lit:.48,unlit:.24,edge:.12},perimeter:{inner:3.8,outer:9.5,value:.36,lane:.8},
    wall:{value:.52,saturation:.56},floorSaturation:.50,tint:0xefc897,
    fixtures:.20,practicals:.50,ambient:.48,marineGlow:1,exit:.9,
  }),
  // Boarding scar, wedged pod and pressure lock.
  'breached-loading-bay': profile({
    fixturesAt:[[215, 265], [690, 390], [1080, 520]],
    floor:{lit:.48,unlit:.24,edge:.12},perimeter:{inner:3.8,outer:9.5,value:.36,lane:.8},
    wall:{value:.52,saturation:.56},floorSaturation:.50,tint:0xbfd8ed,
    fixtures:.20,practicals:.50,ambient:.48,marineGlow:1,exit:.9,
  }),
  // Tracking dish, uplink chancel and service rack.
  'transmission-chamber': profile({
    fixturesAt:[[816, 380], [600, 160], [300, 600]],
    floor:{lit:.66,unlit:.30,edge:.14},perimeter:{inner:3.8,outer:9.5,value:.36,lane:.8},
    wall:{value:.52,saturation:.56},floorSaturation:.50,tint:0xbbd0ef,
    fixtures:.20,practicals:.50,ambient:.48,marineGlow:1,exit:.9,
  }),
  'diagnostic-gallery': profile({
    // Recorder diffuser, southern service recorder, starboard instrument lamp.
    fixturesAt:[[390,126],[710,826],[1084,180]],
    floor:{lit:.42,unlit:.20,edge:.10},perimeter:{inner:3.8,outer:9.5,value:.32,lane:.75},
    wall:{value:.48,saturation:.55},floorSaturation:.46,tint:0xc7dce5,
    fixtures:.20,practicals:.46,ambient:.46,marineGlow:1,exit:.9,
  }),
  'safety-interlock-station': profile({
    // Locked recorder, cage inspection diffuser, battery return task light.
    fixturesAt:[[370,176],[528,370],[640,824]],
    floor:{lit:.38,unlit:.20,edge:.10},perimeter:{inner:3.8,outer:9.5,value:.32,lane:.75},
    wall:{value:.46,saturation:.55},floorSaturation:.48,tint:0xead9b5,
    fixtures:.20,practicals:.44,ambient:.45,marineGlow:1,exit:.9,
  }),
  'service-shaft-landing': profile({
    // Surviving junction above the shaft, upper and lower docking diffusers.
    fixturesAt:[[359,405],[1060,6],[1060,874]],
    floor:{lit:.52,unlit:.26,edge:.13},perimeter:{inner:3.8,outer:10,value:.40,lane:.85},
    wall:{value:.55,saturation:.58},floorSaturation:.50,tint:0xc3e2d7,
    fixtures:.22,practicals:.58,ambient:.52,marineGlow:1,exit:.95,
  }),
  'infested-workshop': profile({
    // Consumed milling machine, rear brood nest, engulfed repair bench.
    fixturesAt:[[650,330],[861,100],[250,900]],
    floor:{lit:.62,unlit:.29,edge:.14},perimeter:{inner:3.8,outer:10,value:.42,lane:.8},
    wall:{value:.58,saturation:.60},floorSaturation:.54,tint:0xd9c4eb,
    fixtures:.22,practicals:.60,ambient:.55,marineGlow:1,exit:.9,
  }),
  'swarm-junction': profile({
    // Hive heart and the occupied northern/southern ventilation mouths.
    fixturesAt:[[470,620],[600,250],[600,790]],
    floor:{lit:.62,unlit:.30,edge:.14},perimeter:{inner:3.8,outer:10,value:.44,lane:.8},
    wall:{value:.60,saturation:.60},floorSaturation:.55,tint:0xebbedc,
    fixtures:.23,practicals:.62,ambient:.55,marineGlow:1,exit:.9,
  }),
  'shielding-gate': profile({
    // West emitter, northern power cabinet and east emitter service face.
    fixturesAt:[[460,300],[704,160],[978,620]],
    floor:{lit:.42,unlit:.22,edge:.11},perimeter:{inner:3.8,outer:10,value:.35,lane:.8},
    wall:{value:.49,saturation:.56},floorSaturation:.48,tint:0xcac9ef,
    fixtures:.20,practicals:.48,ambient:.46,marineGlow:1,exit:.9,
  }),
  'containment-annulus': profile({
    // North and south shielding-housing diffusers; east core status face.
    fixturesAt:[[720,140],[720,900],[1040,520]],
    floor:{lit:.46,unlit:.24,edge:.12},perimeter:{inner:3.8,outer:10,value:.38,lane:.85},
    wall:{value:.52,saturation:.56},floorSaturation:.48,tint:0xc5dedc,
    fixtures:.20,practicals:.50,ambient:.48,marineGlow:1,exit:.95,
  }),
  'manual-control-chamber': profile({
    // Authorization desk, southern cost/status desk and hardwired cabinet.
    fixturesAt:[[640,380],[640,920],[860,280]],
    floor:{lit:.46,unlit:.23,edge:.11},perimeter:{inner:3.8,outer:9.5,value:.36,lane:.8},
    wall:{value:.50,saturation:.58},floorSaturation:.50,tint:0xe6d3bd,
    fixtures:.20,practicals:.46,ambient:.46,marineGlow:1,exit:.9,
  }),
  'overload-floor': profile({
    landmark:{at:[700,500],color:0xff963c,radius:6,body:.8,spill:.12},
    // Reaction-feed diffuser, core's east rim, exhaust-housing diffuser.
    fixturesAt:[[640,200],[890,480],[640,900]],
    floor:{lit:.48,unlit:.24,edge:.12},perimeter:{inner:3.8,outer:10,value:.40,lane:.85},
    wall:{value:.52,saturation:.58},floorSaturation:.52,tint:0xf0c49f,
    fixtures:.20,practicals:.48,ambient:.46,marineGlow:1,exit:.95,
  }),
  'awakening-bay': profile({
    fixturesAt:[[440,240],[640,440],[640,800]],
    floor:{lit:.40,unlit:.20,edge:.10}, perimeter:{inner:3.8,outer:9,value:.30,lane:.7},
    wall:{value:.48,saturation:.55}, floorSaturation:.48,tint:0xc1e5ef,
    fixtures:.20,practicals:.45,ambient:.45,marineGlow:1,exit:.9,
  }),
  // Palest room: cold inspection pools on the portal; cage recesses near-black.
  'crew-checkpoint': profile({
    // Scanner arch inspection lamps and guard-gallery ceiling fixture.
    fixturesAt:[[364,200],[364,680],[1000,440]],
    floor:{lit:.34,unlit:.18,edge:.09}, perimeter:{inner:1.6,outer:4.8,value:.22,lane:.85},
    wall:{value:.42,saturation:.55}, floorSaturation:.45, tint:0xd8e2f0,
    fixtures:.2, practicals:.38, ambient:.45, marineGlow:1, exit:.9,
  }),
  // Wet teal plant: warm copper loops stay as tint, the floor stops being a green wash.
  'coolant-plant': profile({
    floor:{lit:.36,unlit:.18,edge:.09}, perimeter:{inner:4.5,outer:10,value:.25},
    wall:{value:.45,saturation:.55}, floorSaturation:.42, tint:0xc4ddd6,
    fixtures:.2, practicals:.6, ambient:.45, marineGlow:1, exit:.9,
  }),
  // Already dark: cooling-aisle pools on the lanes, rack backs black, white panels dimmed.
  'relay-racks': profile({
    floor:{lit:.70,unlit:.30,edge:.14}, perimeter:{inner:4.5,outer:10,value:.42,lane:.7},
    wall:{value:.62,saturation:.60}, floorSaturation:.55, tint:0xbfdcd8,
    fixtures:.25, practicals:.75, ambient:.6, marineGlow:1, exit:.9,
  }),
});

export function roomValueProfile(templateId?: string): RoomValueProfile | undefined {
  return templateId ? ROOM_VALUE_PROFILES[templateId] : undefined;
}

/** Shared per-room analytic value field: up to four light pools (XZ, inner, outer radius;
 * pool 0 is the fight circle, the rest the room's named-space fixtures) plus exit XZ/radius/gain. */
export const ROOM_VALUE_FIELD = {value: Array.from({length: 4}, () => new T.Vector4(0, 0, 1e4, 2e4))};
export const ROOM_LANDMARK = {value:new T.Vector4()};
export const ROOM_LANDMARK_COLOR = {value:new T.Color(0)};
export const ROOM_LANDMARK_GAINS = {value:new T.Vector2()};
export const ROOM_VALUE_EXIT = {value: new T.Vector4(0, 0, 1, 0)};
export function setRoomValueField(pools: readonly {x:number; z:number}[], exitX: number, exitZ: number, profile?: RoomValueProfile): void {
  const landmark=profile?.landmark;
  ROOM_LANDMARK.value.set((landmark?.at[0]??0)/32,(landmark?.at[1]??0)/32,landmark?.radius??1,landmark?1:0);
  ROOM_LANDMARK_COLOR.value.setHex(landmark?.color??0);
  ROOM_LANDMARK_GAINS.value.set(landmark?.body??0,landmark?.spill??0);
  ROOM_VALUE_FIELD.value.forEach((pool, i) => {
    const source = pools[i], lane = i > 0 ? profile?.perimeter.lane ?? .55 : 1;
    if (!profile) pool.set(0, 0, 1e4, 2e4);
    else if (!source) pool.set(0, 0, 0, 0);
    else pool.set(source.x, source.z, profile.perimeter.inner * lane, profile.perimeter.outer * lane);
  });
  ROOM_VALUE_EXIT.value.set(exitX, exitZ, 3.2, profile?.exit ?? 0);
}

/** World XZ, radius (m) and intensity of the marine rig lamp; one shared uniform for every surface. */
export const MARINE_FLOOR_GLOW = {value: new T.Vector4(0, 0, 3.0, 0)};
export const MARINE_FLOOR_GLOW_COLOR = {value: new T.Color(0xbfe6ff)};
export function setMarineFloorGlow(x: number, z: number, color?: number): void {
  MARINE_FLOOR_GLOW.value.x = x; MARINE_FLOOR_GLOW.value.y = z; MARINE_FLOOR_GLOW.value.w = 1.3;
  if (color !== undefined) MARINE_FLOOR_GLOW_COLOR.value.setHex(color).lerp(new T.Color(0xffffff), .55);
}
