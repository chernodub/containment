import {studioImage} from '../studioArt';
import {AUGMENT_UPGRADE_RULES} from '../../game/abilities/augmentCatalog';
import type {TemplateId} from '../../game/roguelike/types';
import '../styles/route-vignettes.css';

export function routeVignette(template: TemplateId, key?: string, threat?: string): string {
  const subject = threat ? `threat-${threat}`
    : key && Object.hasOwn(AUGMENT_UPGRADE_RULES,key) ? `workshop-${key}` : key ?? template;
  return studioImage(`route-${subject}`,'route-illustration',1120,476);
}
