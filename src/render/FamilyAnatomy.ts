import type {ActorPart} from './ActorIdentity';

/** Large, root-space anatomy. These join the already prepared identity geometry. */
export function familyAnatomy(kind: string, span: number, height: number): ActorPart[] {
  const s = span, h = height;
  if (kind === 'crawler') {
    // A solid armored hump and two blunt forward mandibles survive small masks.
    // The accent is part of the mandible geometry, never a floating light/card.
    return [
      {shape:'plate', role:0, position:[0,h*.62,-s*.015], scale:[s*.34,h*.34,s*.30], fitted:false},
      {shape:'plate', role:10, position:[-s*.13,h*.26,s*.30], scale:[s*.090,h*.19,s*.13], fitted:false},
      {shape:'plate', role:10, position:[s*.13,h*.26,s*.30], scale:[s*.090,h*.19,s*.13], fitted:false},
    ];
  }
  if (kind === 'stalker') {
    // One raised rear stinger defines the dark runner, with a substantial thorax
    // and broad folded forelimbs instead of additional hair-thin leg detail.
    return [
      {shape:'plate', role:0, position:[0,h*.57,-s*.025], scale:[s*.20,h*.28,s*.27], fitted:false},
      {shape:'shield', role:2, position:[-s*.21,h*.22,s*.055], scale:[s*.085,h*.20,s*.24], fitted:false},
      {shape:'shield', role:2, position:[s*.21,h*.22,s*.055], scale:[s*.085,h*.20,s*.24], fitted:false},
      {shape:'plate', role:2, position:[0,h*.67,-s*.18], scale:[s*.12,h*.22,s*.10], fitted:false},
      {shape:'spine', role:10, position:[0,h*.94,-s*.18], scale:[s*.12,h*.36,s*.09], fitted:false},
    ];
  }
  if (kind === 'carrier') {
    // A single rear egg, not a string of nodules. The pale collar anchors it to the trunk.
    return [
      {shape:'sac', role:7, position:[0,h*.78,-s*.19], scale:[s*.25,h*.46,s*.24], fitted:false},
      {shape:'plate', role:4, position:[0,h*.73,s*.015], scale:[s*.18,h*.065,s*.065], fitted:false},
    ];
  }
  // The approved Brute/Spitter and separately authored Queen keep their own constructions.
  return [];
}

/** All rank geometry is prebuilt on every owner; uniforms choose the visible rank. */
export function rankAnatomy(span: number, height: number): ActorPart[] {
  const s = span, h = height;
  return [
    // A single substantial elite dorsal crest remains distinct in solid black.
    {shape:'spine', role:1, position:[0,h*1.05,-s*.07], scale:[s*.075,h*.22,s*.065], fitted:false},
    // Champions carry a broad three-prong crown, taller and wider than the elite crest.
    {shape:'plate', role:6, position:[0,h*1.08,-s*.07], scale:[s*.22,h*.055,s*.075], fitted:false},
    {shape:'spine', role:6, position:[-s*.13,h*1.26,-s*.07], scale:[s*.065,h*.25,s*.065], fitted:false},
    {shape:'spine', role:6, position:[s*.13,h*1.26,-s*.07], scale:[s*.065,h*.25,s*.065], fitted:false},
    {shape:'spine', role:6, position:[0,h*1.39,-s*.07], scale:[s*.085,h*.32,s*.075], fitted:false},
  ];
}
