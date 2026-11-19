import type {ServiceId} from '../../game/roguelike/economy';
import '../styles/requisition.css';
import {studioImage} from '../studioArt';

const useStudioArt = false;

const objects: Record<Exclude<ServiceId,'revive'>, string> = {
  heal: `<path class="service-art-body" d="M94 19h36l11 9v31l-11 10H94L83 59V28z"/>
    <path class="service-art-face" d="M92 35h40v18H92zM95 19v-7h32v7m-30 50v7h28v-7"/>
    <path class="service-art-mark" d="M106 36h10v6h6v6h-6v6h-10v-6h-6v-6h6z"/>
    <path class="service-art-detail" d="M91 30h42m-42 28h42m-38 5h6m5 0h6m5 0h6"/>`,
  armor: `<path class="service-art-body" d="M99 15l38 3 19 19-11 29-38 11-29-21 5-30z"/>
    <path class="service-art-face" d="M105 19l26 4 13 15-9 24-27 9-19-19 5-20z"/>
    <path class="service-art-detail" d="M105 23l-5 16-7 7m37-18l6 12-6 16m-25 7l9-8 12 1M86 29l-9 4m65-7l10 7m-8 21l-5 10"/>
    <path class="service-art-mark" d="M113 30l13 7-4 12-12 8-5-12z"/>`,
  ammo: `<path class="service-art-body" d="M61 43h99l15 12-12 16H69L49 57z"/>
    <path class="service-art-face" d="M64 50h96l9 6-9 8H69l-12-8z"/>
    <path class="service-art-mark" d="M77 28l6-11 6 11v31H77zm19-6l6-11 6 11v37H96zm19 0 6-11 6 11v37h-12zm19 6 6-11 6 11v31h-12z"/>
    <path class="service-art-detail" d="M77 33h12m7-6h12m7 0h12m7 6h12M77 53h12m7 0h12m7 0h12m7 0h12"/>`,
  medkit: `<path class="service-art-body" d="M70 36l52-13 37 12v27l-50 14-39-13z"/>
    <path class="service-art-face" d="M70 36l39 11 50-12m-50 12v29m-13-45v-7l26-7 14 4v5"/>
    <path class="service-art-detail" d="M74 51l30 8m11 5l40-11m-69 8l10 3m23-5l10-3"/>
    <path class="service-art-mark" d="M108 31l10-3 8 2-8 3 10 3-9 3-10-3-10 3-9-2 10-4-7-2 9-3z"/>`,
  grenade: `<g transform="translate(-23 8) rotate(-12 113 45)"><path class="service-art-body" d="M104 17h16v13l9 9v24l-9 10h-16L95 63V39l9-9z"/>
    <path class="service-art-detail" d="M98 44h28m-28 12h28m-16-22v34m6-34v34"/></g>
    <g transform="translate(20 -5) rotate(10 113 45)"><path class="service-art-face" d="M104 17h16v13l9 9v24l-9 10h-16L95 63V39l9-9z"/>
    <path class="service-art-detail" d="M98 44h28m-28 12h28m-16-22v34m6-34v34m4-47c16-11 20 9 11 11"/>
    <path class="service-art-mark" d="M106 18h12v9h-12z"/></g>`,
  reroll: `<path class="service-art-body" d="M66 31l33-13 35 18-33 14zM66 31v22l35 20 33-13V36z"/>
    <path class="service-art-face" d="M100 26l34-14 34 17-35 15zM100 26v23l33 19 35-14V29z"/>
    <path class="service-art-detail" d="M101 50v23m32-29v24m34-16l-34 14"/>
    <path class="service-art-mark" d="M83 47l6 3v7l-6-3zm27 7 6-2v6l-6 3zm35-19 11-4v6l-11 4zm-18-10 11-5 9 5-11 5zm20 24 7-3v7l-7 3z"/>`,
  upgrade: `<path class="service-art-body" d="M70 36l49-17 35 17v19l-47 18-37-18z"/>
    <path class="service-art-face" d="M70 36l37 19 47-19m-47 19v18m-24-36 37-13 23 11-35 14z"/>
    <path class="service-art-detail" d="M82 59v6m9-1v6m9-2v6m21-8v6m9-9v6m9-9v6m9-10v6m-54-34-2-7m14 3-2-7m12 4-2-7"/>
    <path class="service-art-mark" d="M101 36l18-7 12 6-18 7z"/>`,
};

/** PROPS14 illustrations: the same original models the player picks up, rendered with ink and banded shading. */
const propArt: Record<ServiceId, string> = {heal:'health',armor:'armor',ammo:'ammo',medkit:'medkit',grenade:'grenade',reroll:'reroll',upgrade:'upgrade',revive:'resuscitator'};
const propBase = `${import.meta.env.BASE_URL}assets/ui/props14/`;

export function serviceArt(id: ServiceId): string {
  if (useStudioArt) return studioImage(`service-${id}`, 'service-illustration', 448, 168);
  if (propArt[id]) return `<img class="service-illustration service-prop" src="${propBase}${propArt[id]}.png" width="300" height="300" alt="" loading="lazy" decoding="async">`;
  return `<svg class="service-illustration" viewBox="0 0 224 84" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <path class="service-art-shadow" d="M18 68l95-22 93 22-93 13z"/>
    <path class="service-art-guide" d="M12 22V12h20m160 0h20v10M12 62v10h20m160 0h20V62M17 42h38m114 0h38"/>
    ${objects[id==='revive'?'medkit':id]}
  </svg>`;
}
