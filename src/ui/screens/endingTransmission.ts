/** Original ink illustration: the reactor breaks the ship; the last signal escapes. */
export function endingTransmission(): string {
  return `<figure class="ending-transmission" aria-label="The colony ship breaks apart in a reactor flash. Cryo pods drift away. Its warning signal reaches New Earth.">
    <svg class="ending-space" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="ending-flash"><stop stop-color="#fff9dc"/><stop offset=".13" stop-color="#ffdfae"/><stop offset=".38" stop-color="#f9814b" stop-opacity=".75"/><stop offset="1" stop-color="#ff5436" stop-opacity="0"/></radialGradient>
        <linearGradient id="ending-steel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#9aadb0"/><stop offset=".25" stop-color="#4b626d"/><stop offset=".26" stop-color="#263c48"/><stop offset=".8" stop-color="#11202d"/><stop offset="1" stop-color="#040c16"/></linearGradient>
        <linearGradient id="ending-earth-light" x1="0" x2="1" y2="1"><stop stop-color="#b5e4df"/><stop offset=".26" stop-color="#6caaaf"/><stop offset=".55" stop-color="#234653"/><stop offset="1" stop-color="#081320"/></linearGradient>
        <linearGradient id="ending-signal-light"><stop stop-color="#ffe4b7"/><stop offset=".5" stop-color="#effcff"/><stop offset="1" stop-color="#9fe8ff"/></linearGradient>
        <pattern id="ending-hatching" width="13" height="13" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><path d="M0 0v13" stroke="#020914" stroke-width="4"/></pattern>
        <g id="ending-pod"><path d="m-31-46 39-9 28 15 3 68-35 22-31-16Z" fill="#0b1b29" stroke="#030812" stroke-width="6"/><path d="m-23-35 28-8 20 11 2 47-24 18-23-12Z" fill="#4d7e8b" stroke="#94b6bb" stroke-width="2"/><path d="m-15-27 17-4 12 7 1 26-15 11-13-8Z" fill="#182e40"/><path d="M-13-16 0-22l10 6-2 11-10 5-9-5Z" fill="#7fa2ac"/><path d="m-23 47 26 9 35-22-2-8L2 45l-25-8Z" fill="#385768"/><path d="M-32-34v18M27 28l-18 12" stroke="#a9e5ed" stroke-width="3"/></g>
      </defs>
      <path fill="#050d19" d="M0 0h1600v900H0Z"/>
      <g class="ending-stars" fill="#bacbd1">${[[55,93],[205,187],[407,75],[762,125],[980,63],[1148,105],[1498,179],[1359,450],[1504,621],[1070,728],[835,824],[149,617],[35,375]].map(([x,y],i)=>`<path d="M${x-2} ${y}h4m-2-2v4" stroke="${i%3?'#6b8c9d':'#c1dde0'}"/>`).join('')}</g>
      <path d="M-100 493Q402 284 1091 618" fill="none" stroke="#374654" stroke-width="1"/>
      <path d="M-20 527Q470 315 1105 658" fill="none" stroke="#1c2d3d" stroke-width="19"/>
      <g class="ending-destination" transform="translate(1320 230) rotate(-23)">
        <circle r="140" fill="#162e3c" stroke="#050914" stroke-width="9"/>
        <circle class="ending-earth" r="130" fill="url(#ending-earth-light)" stroke="#b2dadb" stroke-width="2"/>
        <path class="ending-land" d="m-79-99 28 4 22 25-14 20 16 21-13 25-33-2-22 18-25-7m72 12 28-7 22 19-5 34-22 15-4 41-19 27-19-25-10-38 9-28m88-117 24 12 7 22-18 15 13 24-24 29 8 23 25 9" fill="#9cbeb9" opacity=".5" stroke="#243d4b" stroke-width="3"/>
        <path d="M-101-60q75-61 180-18M-119-3q127-56 239-4M-106 64q98-40 196-3" fill="none" stroke="#b4d9d6" stroke-width="5" opacity=".18"/>
        <path class="ending-arrival" d="M-137-61a150 150 0 0 1 277 108M-149-67a164 164 0 0 1 302 118" fill="none" stroke="#b8f5ff" stroke-width="2"/>
      </g>
      <ellipse class="ending-reactor-halo" cx="596" cy="355" rx="475" ry="370" fill="url(#ending-flash)"/>
      <g class="ending-blast-rays" fill="#ffe7bf" opacity=".55"><path d="m587 340-401-84 382 102-244 134 266-105-110 249 136-246 207 189-178-216 296-63-306 37 96-250-133 232-128-177Z"/></g>
      <g class="ending-ship" transform="translate(600 365) rotate(-24)" stroke-linejoin="bevel" stroke="#030914" stroke-width="8">
        <g class="ending-ship-aft">
          <path class="ending-hull" d="m-495-116 180-27 142 20 99 60-47 64 27 65-165 67-171-21-92-67Z" fill="url(#ending-steel)"/>
          <path d="m-462-101 147-18 137 23 66 35-58 26-211-16Z" fill="#8f9c9c"/>
          <path d="m-481 44 151 42 143-23 58-38-8 49-121 57-167-20Z" fill="url(#ending-hatching)"/>
          <path class="ending-engines" d="m-495-83-62-9-24 27 9 36 67 5m-17 61-62 3-10 42 35 24 70-15" fill="#2b4555"/>
          <path d="m-548-64 21 2m-28 132 24-5" stroke="#c3edee" stroke-width="7"/>
          <path class="ending-hull-detail" d="m-449-87 123-16 116 20m-238 11 5 95 125 35 117-20m-149-124 5 112m42-119 5 127m43-124 6 115m-47-141 7 18m-85 101 3 15" fill="none" stroke="#bac1b8" stroke-width="2"/>
          <path d="m-407-25 230 3m-223 21 220 5m-208 18 168 7" stroke="#030a16" stroke-width="11"/>
          <path d="m-402-29 216 3m-208 20 205 6m-187 16 156 6" stroke="#d9b480" stroke-width="2"/>
        </g>
        <g class="ending-ship-bow">
          <path class="ending-hull" d="m58-79 106-62 180 4 162 73 95 85-166 50-230-7-148-50 29-39Z" fill="url(#ending-steel)"/>
          <path d="m94-79 91-36 152 2 136 55-62 26-247-15Z" fill="#a8b0a9"/>
          <path d="m118 27 94 27 216 6 126-35-129 7-230-21-91-34Z" fill="url(#ending-hatching)"/>
          <path class="ending-hull-detail" d="m197-104-6 100 228 24 90-20m-263-101-7 108m65-98-7 107m60-86-8 89" fill="none" stroke="#aec0be" stroke-width="2"/>
          <path class="ending-window" d="m437-50 63 29 37 28-107-21Z" fill="#c0f4f0" stroke-width="5"/>
          <path d="m151-112 7-65 74 10 25 43m49-2 13-52 54 18 10 54" fill="#334e5b"/>
        </g>
        <path class="ending-fracture" d="m-89-91-20 47 48 27-37 44 35 46m111-172 30 45-35 39 23 27-23 27" fill="none" stroke="#ffd8a4" stroke-width="6"/>
        <g class="ending-debris" fill="#516773" stroke-width="4"><path d="m-50-157 29-32 37 16-8 38Zm83 274 43 17-19 29-32-15Zm-172 43 29-2 8 21-35 14Zm205-337 32-7 19 20-22 19Z"/><path d="m-80-228 14-19 14 10-6 17Zm105 427 25-7 13 22-18 14Z"/></g>
      </g>
      <path class="ending-reactor-core" d="m573 306 26-81 15 85 58-36-44 68 73 28-78 10 27 88-52-74-45 68 16-82-93-12 89-30-43-57Z" fill="#fff4ce"/>
      <path class="ending-signal-track" d="M785 220Q994 33 1192 207" fill="none" stroke="url(#ending-signal-light)" stroke-width="2"/>
      <path class="ending-signal" d="M785 220Q994 33 1192 207" fill="none" stroke="#e2faff" stroke-width="4"/>
      <g class="ending-pods"><use href="#ending-pod" transform="translate(1118 614) rotate(29) scale(1.02)"/><use href="#ending-pod" transform="translate(1294 716) rotate(-16) scale(.6)"/><use href="#ending-pod" transform="translate(990 529) rotate(43) scale(.4)"/></g>
      <path d="m1056 606-22 19m236 47-20-16M891 472l-11 4M734 580l15 18" stroke="#a3bbc1" stroke-width="3"/>
    </svg>
    <figcaption class="ending-outcomes"><div class="ending-loss"><span class="eyebrow">COLONY SHIP / SIGNAL LOST</span><strong>Passengers and marine lost.</strong></div><div class="ending-success"><span class="eyebrow">NEW EARTH / SIGNAL RECEIVED</span><strong>The warning made it.</strong></div></figcaption>
  </figure>`;
}
