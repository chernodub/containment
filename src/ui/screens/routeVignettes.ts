import {studioImage} from '../studioArt';
import {AUGMENT_UPGRADE_RULES} from '../../game/abilities/augmentCatalog';
import type {TemplateId} from '../../game/roguelike/types';
import '../styles/route-vignettes.css';

const roomCrops = new Set<string>([
  'awakening-bay',
  'passenger-vault',
  'residential-gallery',
  'communal-atrium',
  'crew-checkpoint',
  'armory',
  'freight-hold',
  'breached-loading-bay',
  'relay-racks',
  'transmission-chamber',
  'diagnostic-gallery',
  'safety-interlock-station',
  'coolant-plant',
  'service-shaft-landing',
  'infested-workshop',
  'swarm-junction',
  'shielding-gate',
  'containment-annulus',
  'manual-control-chamber',
  'overload-floor',
]);

export function routeVignette(template: TemplateId, key?: string, threat?: string): string {
  const subject = threat ? `threat-${threat}`
    : key && Object.hasOwn(AUGMENT_UPGRADE_RULES,key) ? `workshop-${key}` : key ?? template;
  const crop = roomCrops.has(template) ? template : undefined;
  const room = crop ? studioImage(`route-${crop}`, 'route-room-crop', 1120, 476) : '';
  const creature = threat || ['brood', 'plate-breaker', 'warden-cache', 'legacy-queen'].includes(subject);
  return creature
    ? room + studioImage(`route-${subject}`, 'route-illustration route-creature', 1120, 476)
    : studioImage(`route-${subject}`, 'route-illustration', 1120, 476);
}
