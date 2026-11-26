import type {EnemyId} from '../../game/enemies/types';

const enemies: Record<EnemyId, [string,string]> = {
  crawler: ['#9dbf74','M17 0 11-8 0-8-8-5-14-9-12-2-17 0-12 2-14 9-8 5 0 8 11 8Z'],
  stalker: ['#af91cb','M20 0 8-5-3-7-17-12-10-3-18 0-10 3-17 12-3 7 8 5Z'],
  brute: ['#98bb8d','M18 0 11-11 2-15-9-12-17-6-17 6-9 12 2 15 11 11Z'],
  spitter: ['#b4c76e','M17-5 9-9-5-11-15-7-17 0-15 7-5 11 9 9 17 5 11 0Z'],
  carrier: ['#c99c82','M18 0 10-8-1-12-12-10-18-4-18 4-12 10-1 12 10 8Z'],
  queen: ['#d4a2ab','M21 0 11-10-2-14-19-10-21 0-19 10-2 14 11 10Z'],
};

export function exchangeEnemy(family: EnemyId, x: number, y: number, angle: number, scale = 1): string {
  const [color, silhouette] = enemies[family];
  return `<g class="exchange-glyph" transform="translate(${x} ${y}) rotate(${angle*180/Math.PI}) scale(${scale})">
    <path fill="${color}" d="${silhouette}"/><path class="exchange-enemy-mark" stroke="${color}" d="M2-5 8 0 2 5"/>
  </g>`;
}

export function exchangeMarine(x: number, y: number, angle: number, ghost = false, scale = 1): string {
  return `<g class="exchange-glyph exchange-marine${ghost?' exchange-ghost':''}" transform="translate(${x} ${y}) rotate(${angle*180/Math.PI}) scale(${scale})">
    <path d="M10-5 6-11-6-13-10-7-8-3-13-2-13 7-6 7-5 12 4 10 7 6 13 5Z"/>
    <path class="exchange-visor" d="M3-5 8-1 4 4"/>
  </g>`;
}
