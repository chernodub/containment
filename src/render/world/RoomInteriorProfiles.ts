import { ACT1_INTERIOR_PROFILES } from './RoomInteriorAct1';
import { ACT2_INTERIOR_PROFILES } from './RoomInteriorAct2';
/** Original room-specific interior color/function direction. No simulation state. */
export type FunctionKind = string;
export type InteriorProfile = {
    kind: FunctionKind;
    deck: number;
    zone: number;
    trim: number;
    key: number;
    landmark: string;
};
export const INTERIOR_PROFILES: Record<string, InteriorProfile> = {
    ...ACT1_INTERIOR_PROFILES, ...ACT2_INTERIOR_PROFILES,
    'diagnostic-gallery': { kind: 'diagnostics', deck: 0x1d303d, zone: 0x344d5d, trim: 0xd5ded3, key: 0x65d8e6, landmark: 'Probe arch and recorder workbays beneath the fatal-purge gantry' },
    'crew-checkpoint': { kind: 'checkpoint', deck: 0xd5d4bd, zone: 0x95b1b3, trim: 0xb2a15c, key: 0x71c793, landmark: 'Inspection scanner and glazed security booth' },
    'swarm-junction': { kind: 'ventilation', deck: 0x857055, zone: 0x5d6055, trim: 0xb0a58b, key: 0xb286d1, landmark: 'Raised ventilation plenums split by rooted growth' },
};
/** Main casing and lighter cap paint; floors deliberately use another family. */
export const INTERIOR_WALL_FINISHES: Record<string, readonly [
    number,
    number
]> = {
    'awakening-bay': [0xd8d7bd, 0xe2e4ce],
    'passenger-vault': [0xcad9cd, 0xd8e4d7],
    'residential-gallery': [0xaebfb0, 0xc9d7c5],
    'communal-atrium': [0x2f5148, 0x9fbba5],
    armory: [0xb9c3a0, 0xdce0ba],
    'freight-hold': [0x304a5a, 0x9bb5bf],
    'breached-loading-bay': [0xc8c2a6, 0xd2c6a4],
    'relay-racks': [0xa3c2b7, 0xc4d9cb],
    'transmission-chamber': [0xd4cfaa, 0xddd4b6],
    'diagnostic-gallery': [0x344b57, 0xd5ded3],
    'crew-checkpoint': [0x172d3c, 0x8faaa8],
    'swarm-junction': [0x4b4651, 0xa59a82],
    'safety-interlock-station': [0xc3b68d, 0xd8cda8],
    'coolant-plant': [0x294653, 0x9ebfc2],
    'service-shaft-landing': [0x87a6ad, 0xb8cbd0],
    'infested-workshop': [0x789b8e, 0xabc3b0],
    'shielding-gate': [0xc7c4a8, 0xdfddc3],
    'containment-annulus': [0x493b50, 0xb6a9c6],
    'manual-control-chamber': [0x263f53, 0xa2b6bd],
    'overload-floor': [0xa88d70, 0xd1bea0],
};
