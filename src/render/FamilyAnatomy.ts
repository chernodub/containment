import type {ActorPart} from './ActorIdentity';

/** Large, root-space anatomy. These join the already prepared identity geometry. */
export function familyAnatomy(kind: string, span: number, height: number): ActorPart[] {
  const s = span, h = height;
  if (kind === 'crawler') {
    // One low, broad shell reads as a compact swarm body rather than a small Spitter.
    return [{shape:'plate', role:0, position:[0,h*.48,0], scale:[s*.28,h*.22,s*.25], fitted:false}];
  }
  if (kind === 'stalker') {
    // Paired low lances flank a narrow thorax. Their pointed fronts face +Z.
    return [
      {shape:'plate', role:2, position:[0,h*.48,-s*.025], scale:[s*.075,h*.12,s*.26], fitted:false},
      {shape:'shield', role:0, position:[-s*.18,h*.20,s*.08], scale:[s*.09,h*.16,s*.28], fitted:false},
      {shape:'shield', role:0, position:[s*.18,h*.20,s*.08], scale:[s*.09,h*.16,s*.28], fitted:false},
      {shape:'plate', role:2, position:[-s*.12,h*.28,-s*.035], scale:[s*.12,h*.045,s*.075], fitted:false},
      {shape:'plate', role:2, position:[s*.12,h*.28,-s*.035], scale:[s*.12,h*.045,s*.075], fitted:false},
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
