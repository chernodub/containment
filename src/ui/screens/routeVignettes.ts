import {MUTATION_CATALOG} from '../../game/roguelike/mutationCatalog';
import {ROOM_TEMPLATES} from '../../game/roguelike/roomTemplates';
import {SERVICE_IDS, type ServiceId} from '../../game/roguelike/economy';
import {rewardArt} from '../rewardArt';
import {serviceArt} from './serviceArt';
import type {RoomTemplate, TemplateId} from '../../game/roguelike/types';
import '../styles/route-vignettes.css';

const scenes: Partial<Record<TemplateId, { light: string; geometry: string }>> = {
  'communal-atrium': {
    light: '#9ad8e1',
    geometry: `<path class="route-art-structure" d="M40 119V49l28-30h344l28 30v70H325l-22-22H178l-22 22z"/>
      <path class="route-art-steel" d="M64 118V58l22-22h308l22 22v60h-67V76H131v42z"/>
      <path class="route-art-structure" d="M164 34h152v48H164z"/>
      <path class="route-art-lit" d="M173 42h134v30H173z"/>
      <path class="route-art-lines" d="m185 67 29-17 22 10 23-13 36 16M82 48v62m20-74v74m276-74v74m20-62v62M43 126h96m202 0h96"/>
      <path class="route-art-steel" d="m82 122 34-7 38 8v7l-37 7-35-8zm244 1 38-8 34 7v7l-35 8-37-7z"/>
      <path class="route-art-lit" d="m179 122 61-12 61 12-61 16z"/>`,
  },
  'breached-loading-bay': {
    light: '#e1a772',
    geometry: `<path class="route-art-structure" d="M35 117V50l46-30h315l49 30v67h-70l-36-17H151l-38 17z"/>
      <path class="route-art-steel" d="M163 102V53l40-24h73l40 24v49z"/>
      <path class="route-art-lines" d="M180 98V57l31-18h57l31 18v41m-103-1V63l21-15h46l21 15v35"/>
      <path class="route-art-lit" d="m196 77 42-14-21 19 31-4-18 24m52-40-29 13 9 7-24 17"/>
      <path class="route-art-steel" d="m39 106 51-13 36 11v27l-37 12-50-14zm309-2 51-13 43 14v28l-43 13-51-15z"/>
      <path class="route-art-lines" d="m39 106 50 13 37-15m-37 15v24m259-39 51 13 43-12m-43 12v29m-266-19 45-13m128 0 40 13"/>`,
  },
  'safety-interlock-station': {
    light: '#99d9ac',
    geometry: `<path class="route-art-structure" d="M36 120V39l36-22h340l32 22v81h-82l-26-17H142l-24 17z"/>
      <path class="route-art-steel" d="M69 112V50h88v62zm255 0V50h88v62zM168 33h144v68H168z"/>
      <path class="route-art-lit" d="M183 44h114v43H183zM83 65h16v7H83zm22 0h16v7h-16zm22 0h16v7h-16zm211 0h16v7h-16zm22 0h16v7h-16zm22 0h16v7h-16z"/>
      <path class="route-art-lines" d="M193 72h17l9-14 12 20 10-11 8 5h36m-94 10h97M82 83h62m-62 8h62m194-8h62m-62 8h62"/>
      <path class="route-art-steel" d="m155 115 33-17h104l33 17-6 14H161z"/>
      <path class="route-art-lit" d="M196 109h88l9 9H187z"/>`,
  },
  'swarm-junction': {
    light: '#f3a584',
    geometry: `<path class="route-art-structure" d="M28 118V53l36-23h116l22-17h76l22 17h116l36 23v65l-106-22H133z"/>
      <path class="route-art-steel" d="M69 108V61l26-15h48l25 15v36zm243-11V61l26-15h48l25 15v47zM202 97V50l18-19h40l18 19v47z"/>
      <path class="route-art-lit" d="M218 53l22-16 22 16v38h-44zm-130 8h58l-7 15H96zm246 0h58l-8 15h-42z"/>
      <path class="route-art-growth" d="M0 24c55 11 35 61 108 66s144 32 95 75M480 20c-59 24-43 48-103 61s-139 31-102 84M0 88c88-4 89 37 157 45m323-36c-79-14-94 35-155 40"/>
      <path class="route-art-lines" d="M7 46c76 8 34 50 137 63m326-70c-52 12-61 66-122 65m-236 13 18 13m221-18-16 20"/>
      <path class="route-art-lit" d="M68 105l15 5-8 14-15-6zm74 22 12 4-6 12-12-3zm251-20 12-5 9 15-15 7z"/>`,
  },
  'manual-control-chamber': {
    light: '#efb586',
    geometry: `<path class="route-art-structure" d="M24 124V50l50-27h332l50 27v74l-108-27H132z"/>
      <path class="route-art-steel" d="M55 113V59l30-18h62l14 18v45zm264-9V59l14-18h62l30 18v54zM181 98V37l21-17h76l21 17v61z"/>
      <path class="route-art-lit" d="M202 45h76v40h-76zm-116 9h55v6H86zm253 0h55v6h-55z"/>
      <path class="route-art-lines" d="M207 64h16m33 0h17m-37-10h8v17h-8zm-7 17h22v7h-22M95 72v21m13-21v21m13-21v21m238-21v21m13-21v21m13-21v21"/>
      <path class="route-art-steel" d="m177 120 23-20h80l23 20-17 21h-92z"/>
      <path class="route-art-lit" d="m204 107 72 0 9 9h-90z"/>
      <path class="route-art-lines" d="M208 132h64m-67-10h9m7 0h9m20 0h9m7 0h9"/>`,
  },
};

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
  const service = key==='salvage'||key==='cache'?'upgrade':key==='medicine'?'medkit':key;
  if (service && SERVICE_IDS.includes(service as ServiceId)) {
    return serviceArt(service as ServiceId).replace('service-illustration','service-illustration route-illustration');
  }
  if (key && Object.hasOwn(MUTATION_CATALOG,key)) {
    return rewardArt(MUTATION_CATALOG[key as keyof typeof MUTATION_CATALOG],true);
  }
  const room = key && Object.hasOwn(ROOM_TEMPLATES,key)?ROOM_TEMPLATES[key as TemplateId]:template;
  const scene = scenes[room.id];
  return `<svg class="route-illustration" style="--route-light:${scene?.light??'#9accdd'}" viewBox="0 0 480 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <path class="route-art-lines route-art-deck" d="M142 93 19 160m163-67-79 67m118-67-25 67m63-67 25 67m14-67 79 67m-39-67 123 67M0 145h480M27 124h426M56 110h368"/>
    ${scene?.geometry??roomSection(room)}
  </svg>`;
}
