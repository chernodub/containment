import type {ServiceId} from '../../game/roguelike/economy';
import '../styles/requisition.css';
import {studioImage} from '../studioArt';

export function serviceArt(service: ServiceId): string {
  const id = service === 'route-ammo' ? 'ammo' : service;
  return studioImage(`service-${id}`, 'service-illustration', 560, 224);
}
