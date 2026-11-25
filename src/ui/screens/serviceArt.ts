import type {ServiceId} from '../../game/roguelike/economy';
import '../styles/requisition.css';
import {studioImage} from '../studioArt';

export function serviceArt(service: ServiceId): string {
  const id = service === 'route-ammo' ? 'ammo' : service === 'rig-return' ? 'upgrade' : service;
  if (['armor', 'ammo', 'grenade', 'reroll', 'upgrade'].includes(id)) {
    return `<img class="service-illustration" src="${import.meta.env.BASE_URL}assets/ui/requisition/${id}.svg" width="560" height="224" alt="" loading="lazy" decoding="async">`;
  }
  return studioImage(`service-${id}`, 'service-illustration', 560, 224);
}
