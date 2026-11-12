/** Original vector epilogue: the ship is lost while its warning travels onward. */
export function endingTransmission(): string {
  return `<figure class="ending-transmission" aria-label="The colony ship breaks apart. Its warning signal reaches New Earth.">
    <svg class="ending-space" viewBox="0 0 1200 340" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="ending-earth-light"><stop stop-color="#bbf2ff" stop-opacity=".15"/><stop offset="1" stop-color="#9fe8ff" stop-opacity="0"/></radialGradient>
        <linearGradient id="ending-signal-light"><stop stop-color="#d3ebef" stop-opacity=".08"/><stop offset="1" stop-color="#a6edff" stop-opacity=".8"/></linearGradient>
      </defs>
      <g class="ending-stars" fill="#a0bfc9"><circle cx="63" cy="58" r="1"/><circle cx="512" cy="37" r="1"/><circle cx="721" cy="101" r="1"/><circle cx="834" cy="44" r="1"/><circle cx="1140" cy="105" r="1"/><circle cx="575" cy="268" r="1"/><circle cx="759" cy="309" r="1"/><circle cx="1125" cy="276" r="1"/></g>
      <path class="ending-orbit" d="M45 274Q554 301 1140 72"/>
      <g class="ending-ship" stroke-linejoin="bevel">
        <g class="ending-ship-aft"><path class="ending-hull" d="M128 137 202 120 261 132 291 145 282 198 252 212 187 199 128 182 113 170 113 151Z"/><path class="ending-hull-detail" d="m141 143 49-9 60 9m-105 34 47 10 57 10m-68-59v52m39-50v57m-94-47h40v25h-40z"/><path class="ending-engines" d="M117 145h-17v10h17m0 13h-17v10h17"/></g>
        <g class="ending-ship-bow"><path class="ending-hull" d="m299 145 43-20 94 14 57 24-58 26-94 12-38-16 10-16Z"/><path class="ending-hull-detail" d="m324 151 105 1 26 11-26 12-105 11m25-58v70m35-64v60"/><path class="ending-window" d="m431 154 27 9-27 10"/></g>
        <path class="ending-fracture" d="m291 130-12 22 17 15-9 25 14 22m14-68-7 12 13 15-11 15"/>
        <g class="ending-debris"><path d="m278 107 11-10 7 12-12 6Zm25 127 13 9-8 7-12-8Zm-48-6 9 2-5 7-7-3Zm78-117 8-5 5 8-7 3Z"/><path d="m301 87 4-7m-27 174-2 6m62-43 7 2"/></g>
      </g>
      <path class="ending-signal-track" d="M456 148Q713 52 982 156"/>
      <path class="ending-signal" d="M456 148Q713 52 982 156"/>
      <g class="ending-destination"><circle class="ending-earth-halo" cx="1017" cy="171" r="123" fill="url(#ending-earth-light)"/><circle class="ending-earth" cx="1017" cy="171" r="55"/><path class="ending-land" d="m992 124 13 10 5 16-13 11 4 19-13 10-18-10m70-57-10 19 8 15-10 16 14 12-7 20 8 11m-48-2 16-9 14 8-4 15"/><path class="ending-arrival" d="M948 111a91 91 0 0 1 135 117M962 122a74 74 0 0 1 108 94"/></g>
      <path class="ending-leader ending-leader--loss" d="M249 221v42h-55"/><path class="ending-leader ending-leader--success" d="M1017 236v27h55"/>
    </svg>
    <figcaption class="ending-outcomes"><div class="ending-loss"><span class="eyebrow">COLONY SHIP / SIGNAL LOST</span><strong>Passengers and marine lost.</strong></div><div class="ending-success"><span class="eyebrow">NEW EARTH / SIGNAL RECEIVED</span><strong>The warning made it.</strong></div></figcaption>
  </figure>`;
}
