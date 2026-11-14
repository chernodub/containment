import type {ActorPart} from './ActorIdentity';

/** Four restrained silhouettes fit below the existing helmet and inside the suit span. */
export function marineRigAnatomy(): ActorPart[] {
  const parts: ActorPart[] = [];
  const add=(shape:ActorPart['shape'],role:number,position:ActorPart['position'],scale:ActorPart['scale'],rotation?:ActorPart['rotation'])=>parts.push({shape,role,position,scale,rotation,fitted:false});
  // Breacher: heavy asymmetric ram shoulder and a short forward cheek plate.
  add('shield',13,[-.30,1.49,.015],[.16,.20,.19]);
  add('shield',13,[.30,1.47,.015],[.115,.14,.16]);
  add('plate',13,[-.22,1.34,.19],[.14,.12,.065]);
  // Cryo: two tall cylindrical vessels, bridged by one graphite collar.
  for(const side of [-1,1]) {
    add('segment',14,[side*.32,1.13,-.16],[.11,1,.10]);
    parts[parts.length-1].end=[side*.32,1.88,-.16];
    add('plate',14,[side*.32,1.90,-.16],[.11,.055,.11]);
  }
  add('seam',14,[0,1.34,-.23],[.20,.045,.07]);
  // Pyro: squat fuel tanks and two flat, outward-facing exhaust fins.
  for(const side of [-1,1]) {
    add('plate',15,[side*.26,1.45,-.16],[.145,.25,.125]);
    add('shield',15,[side*.34,1.53,-.11],[.105,.08,.19]);
    add('seam',15,[side*.34,1.57,-.11],[.09,.025,.15]);
  }
  // Arc: open induction hoops, with a visible gap and a solid terminal block.
  for(const side of [-1,1]) {
    add('coil',16,[side*.32,1.64,-.14],[.145,.25,.10],[0,side*.25,side*.10]);
    add('seam',16,[side*.29,1.23,-.14],[.09,.055,.09]);
  }
  return parts;
}
