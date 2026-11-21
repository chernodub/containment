import type {ServiceId} from '../../game/roguelike/economy';
import '../styles/requisition.css';
import {studioImage} from '../studioArt';

export function serviceArt(id: ServiceId): string {
  return studioImage(`service-${id}`, 'service-illustration', 560, 224);
}
