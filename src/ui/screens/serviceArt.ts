import type {ServiceId} from '../../game/roguelike/economy';
import {studioImage} from '../studioArt';
import '../styles/requisition.css';

export function serviceArt(id: ServiceId): string {
  return studioImage(`service-${id}`, 'service-illustration',448,168);
}
