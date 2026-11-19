import {studioImage} from '../studioArt';
import {ROOM_STORY_ROUTE} from '../../game/roguelike/storyRooms';
import {AUGMENT_UPGRADE_RULES} from '../../game/abilities/augmentCatalog';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {SERVICE_IDS, type ServiceId} from '../../game/roguelike/economy';
import {serviceArt} from './serviceArt';
import type {RoomTemplate, TemplateId} from '../../game/roguelike/types';
import '../styles/route-vignettes.css';

/** Legacy destinations use their room's actual cover footprints as a sectional sketch. */
function roomSection(template: RoomTemplate): string {
  const scaleX = 310 / template.width, scaleY = 66 / template.height;
  return `<path class="route-art-structure" d="M63 35h309l47 53-48 40H109L61 84z"/>
    <path class="route-art-lines" d="M63 35l46 49h310m-310 0v44"/>
    <g transform="translate(67 36) skewX(25)">
    ${template.obstacles.map(({x,y,width,height})=>{
      const left=x*scaleX, top=y*scaleY, w=width*scaleX, h=height*scaleY;
      return `<rect class="route-art-structure" x="${left}" y="${top+7}" width="${w}" height="${h}"/><rect class="route-art-steel" x="${left}" y="${top}" width="${w}" height="${h}"/>`;
    }).join('')}
    <path class="route-art-lit" d="M0 34h18v4H0zm292 0h18v4h-18z"/>
    </g>`;
}

export function routeVignette(template: RoomTemplate, key?: string): string {
  const detourArt = key==='salvage'?'cache':key;
  if(detourArt&&['cache','medicine','armor','upgrade','warden-cache','capacitor'].includes(detourArt))
    return studioImage(`route-${detourArt}`,'route-illustration');
  const service = key==='salvage'||key==='cache'?'upgrade':key==='medicine'?'medkit':key;
  if (service && SERVICE_IDS.includes(service as ServiceId)) {
    return serviceArt(service as ServiceId).replace('service-illustration','service-illustration route-illustration');
  }
  if (key && Object.hasOwn(AUGMENT_UPGRADE_RULES,key)) {
    return studioImage(`route-workshop-${key}`,'route-illustration');
  }
  const room = key && Object.hasOwn(ROOM_TEMPLATES,key)?ROOM_TEMPLATES[key as TemplateId]:template;
  if(ROOM_STORY_ROUTE.some(entry=>entry.templateId===room.id))return studioImage(`route-${room.id}`,'route-illustration');
  return `<svg class="route-illustration" style="--route-light:#9accdd" viewBox="0 0 480 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <path class="route-art-lines route-art-deck" d="M142 93 19 160m163-67-79 67m118-67-25 67m63-67 25 67m14-67 79 67m-39-67 123 67M0 145h480M27 124h426M56 110h368"/>
    ${roomSection(room)}
  </svg>`;
}
