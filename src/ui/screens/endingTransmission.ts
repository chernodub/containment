import type {RigId} from '../../game/abilities/contract';
import {marinePortrait} from './rigPortraits';

/** The last operator is a suit archive; the final warning outlives the marine. */
export function endingTransmission(rig: RigId = 'breacher'): string {
  const base = `${import.meta.env.BASE_URL}assets/ui/u10/`;
  return `<figure class="ending-transmission" aria-label="The abandoned ship uplink. The marine's final suit record closes; New Earth receives the warning."><div class="ending-render"><picture class="ending-set"><source type="image/webp" srcset="${base}ending-1280.webp 1280w, ${base}ending-1920.webp 1920w" sizes="min(1200px, 86vw)"><img src="${base}ending-1280.jpg" width="2560" height="1440" alt="An empty service nave lit by the final emergency signal" loading="lazy" decoding="async"></picture><div class="ending-operator">${marinePortrait(rig)}<span>LAST SUIT RECORD<br><b>LINK TERMINATED</b></span></div><div class="ending-receipt"><span class="eyebrow">UPLINK / NEW EARTH</span><strong>WARNING<br>RECEIVED.</strong><span class="ending-signal-line" aria-hidden="true"></span><small>TRANSMISSION COMPLETE</small></div></div><figcaption class="ending-outcomes"><div class="ending-loss"><span class="eyebrow">COLONY SHIP / SIGNAL LOST</span><strong>Passengers and marine lost.</strong></div><div class="ending-success"><span class="eyebrow">NEW EARTH / SIGNAL RECEIVED</span><strong>The warning made it.</strong></div></figcaption></figure>`;
}
