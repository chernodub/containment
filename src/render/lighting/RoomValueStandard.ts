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
  'awakening-bay': profile({
    fixturesAt:[[440,240],[640,440],[640,800]],
    floor:{lit:.40,unlit:.20,edge:.10}, perimeter:{inner:3.8,outer:9,value:.30,lane:.7},
    wall:{value:.48,saturation:.55}, floorSaturation:.48,tint:0xc1e5ef,
    fixtures:.20,practicals:.45,ambient:.45,marineGlow:1,exit:.9,
  }),
  // Palest room: cold inspection pools on the portal; cage recesses near-black.
  'crew-checkpoint': profile({
    floor:{lit:.34,unlit:.18,edge:.09}, perimeter:{inner:4.5,outer:10.5,value:.22},
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
export const ROOM_VALUE_EXIT = {value: new T.Vector4(0, 0, 1, 0)};
export function setRoomValueField(pools: readonly {x:number; z:number}[], exitX: number, exitZ: number, profile?: RoomValueProfile): void {
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
