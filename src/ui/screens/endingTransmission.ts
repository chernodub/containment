/** Original ink plate: a colony vessel opens at its reactor; one thin signal survives. */
export function endingTransmission(): string {
  const stars = [[54,93],[205,187],[407,75],[762,25],[980,63],[1148,105],[1498,79],[1359,450],[1504,621],[1070,728],[835,724],[149,617],[35,375],[1171,437],[103,300],[1401,21]];
  const cryoDecks = [0,1,2].map(deck => `<g transform="translate(${deck * 59} ${deck * 5})" data-vessel-section="frosted-cryo-bay"><path d="m151-49 47 5-3 47-43-5Z" fill="#4c6770" stroke="#0b1d29" stroke-width="2.5"/><path d="m155-44 38 4-2 36-35-4Z" fill="#203f50"/><path d="m158-40 7 1v26l-7-1Zm11 1 7 1v26l-7-1Zm11 1 7 1v26l-7-1Z" fill="#54777f"/><path d="m159-39 5 1m6 0 5 1m6 0 5 1m-27 1 4 1m18 1 4 1m-25 5 3 1m8 1 3 0m-15 15 5 1m6 0 5 1m6 0 5 1" stroke="#c8ded2" stroke-width="1" opacity=".7"/><path d="m160-33 3 1v5l-3-1Zm11 2 3 1v5l-3-1Zm11 1 3 1v5l-3-1Z" fill="#18303e"/><path d="m159-26 5 1v10l-5-1Zm11 2 5 1v10l-5-1Zm11 1 5 1v10l-5-1Z" fill="#263e49"/><path d="m153-47 43 5m-42 43 39 4" stroke="#adbdb5" stroke-width="1.4"/></g>`).join('');
  const radiatorRibs = Array.from({length:9},(_,i)=>`<path d="M${-430+i*22} -115v-54m0 251v57" stroke="#56717b" stroke-width="2"/>`).join('');
  const ringRibs = Array.from({length:12},(_,i)=> {
    const a=-Math.PI/2+i*Math.PI/11, x=Math.cos(a)*68, y=Math.sin(a)*174;
    return `<path d="M${(212+x).toFixed(1)} ${(y-8).toFixed(1)}l12 6" stroke="#8a9c99" stroke-width="2"/>`;
  }).join('');
  return `<figure class="ending-transmission" aria-label="The colony ship breaks apart at its reactor. Its habitat ring and cryogenic decks fall dark. Cryo pods drift away. A thin warning signal reaches distant New Earth.">
    <svg class="ending-space" viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" data-key-art="aftermath">
      <defs>
        <radialGradient id="ending-flash"><stop stop-color="#fff5d7" stop-opacity=".9"/><stop offset=".12" stop-color="#ffbd72" stop-opacity=".8"/><stop offset=".4" stop-color="#c56842" stop-opacity=".32"/><stop offset="1" stop-color="#79402f" stop-opacity="0"/></radialGradient>
        <linearGradient id="et-pressure-band" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#edaa71" stop-opacity="0"/><stop offset=".45" stop-color="#df925f" stop-opacity=".02"/><stop offset=".82" stop-color="#f8bc85" stop-opacity=".17"/><stop offset="1" stop-color="#ffe0ac" stop-opacity=".46"/></linearGradient>
        <linearGradient id="et-ejecta-trail" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#a67253" stop-opacity="0"/><stop offset=".5" stop-color="#c68558" stop-opacity=".12"/><stop offset="1" stop-color="#f8c28a" stop-opacity=".65"/></linearGradient>
        <radialGradient id="et-core"><stop stop-color="#fff9de"/><stop offset=".2" stop-color="#ffdfa3"/><stop offset=".5" stop-color="#ec8655"/><stop offset="1" stop-color="#6d322b" stop-opacity="0"/></radialGradient>
        <linearGradient id="et-hot-cavity" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#fff4c8"/><stop offset=".3" stop-color="#ffe1a8"/><stop offset=".65" stop-color="#f09c6b"/><stop offset="1" stop-color="#984635"/></linearGradient>
        <linearGradient id="ending-steel" x1="0" y1="0" x2=".2" y2="1"><stop stop-color="#b0b8b1"/><stop offset=".18" stop-color="#849797"/><stop offset=".21" stop-color="#4a626b"/><stop offset=".62" stop-color="#263c48"/><stop offset="1" stop-color="#0c1a28"/></linearGradient>
        <linearGradient id="et-reactor-bounce"><stop stop-color="#b88868" stop-opacity="0"/><stop offset=".7" stop-color="#d39972" stop-opacity=".12"/><stop offset="1" stop-color="#e6b68b" stop-opacity=".6"/></linearGradient>
        <linearGradient id="et-fore-bounce"><stop stop-color="#e5b58b" stop-opacity=".5"/><stop offset=".4" stop-color="#c59877" stop-opacity=".08"/><stop offset="1" stop-color="#b88868" stop-opacity="0"/></linearGradient>
        <linearGradient id="et-top" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#b6bab0"/><stop offset="1" stop-color="#596f74"/></linearGradient>
        <linearGradient id="et-hot-metal-aft" x1="1" y1="0" x2="0" y2="0"><stop stop-color="#f5c397"/><stop offset=".23" stop-color="#b67b61"/><stop offset="1" stop-color="#3e4c55"/></linearGradient>
        <linearGradient id="et-hot-metal"><stop stop-color="#f5c397"/><stop offset=".23" stop-color="#b67b61"/><stop offset="1" stop-color="#3e4c55"/></linearGradient>
        <linearGradient id="et-ring"><stop stop-color="#5b7279"/><stop offset=".4" stop-color="#c5bba1"/><stop offset=".65" stop-color="#596a70"/><stop offset="1" stop-color="#1b303c"/></linearGradient>
        <radialGradient id="ending-earth-light" cx=".27" cy=".23" r=".8"><stop stop-color="#7aa6a3"/><stop offset=".6" stop-color="#244d5a"/><stop offset="1" stop-color="#061521"/></radialGradient>
        <linearGradient id="et-planet-shadow"><stop stop-color="#040c17" stop-opacity="0"/><stop offset=".6" stop-color="#040c17" stop-opacity=".1"/><stop offset="1" stop-color="#040c17"/></linearGradient>
        <linearGradient id="ending-signal-light"><stop stop-color="#ffe4b7"/><stop offset=".5" stop-color="#effcff"/><stop offset="1" stop-color="#9fe8ff"/></linearGradient>
        <linearGradient id="et-pod-glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#87a6ad"/><stop offset=".4" stop-color="#385b69"/><stop offset="1" stop-color="#091c2a"/></linearGradient>
        <clipPath id="et-planet"><circle r="79"/></clipPath>
        <g id="ending-pod">
          <path d="m-22-49 29-6 18 15 2 68-13 19-28 3-15-16-1-65Z" fill="#0b1825" stroke="#020912" stroke-width="4"/>
          <path d="m-19-43 25-5 13 12 2 63-11 15-23 2-11-14-1-58Z" fill="#4f6872"/>
          <path d="m-13-35 17-4 10 10 1 48-9 13-17 2-8-12-1-47Z" fill="url(#et-pod-glass)" stroke="#8bafb6" stroke-width="1.2"/>
          <ellipse cx="1" cy="-19" rx="4.5" ry="5.8" fill="#182c3a"/>
          <path d="M-3-12 5-11 8-5 6 12 2 20-5 16-8-2-6-9Z" fill="#122634"/>
          <path d="m-5-8-3 11 5 5M5-7l4 9-3 7M-3 16l-2 10m6-9 1 10" fill="none" stroke="#16313f" stroke-width="2.3"/>
          <path d="m-4-22 3-2 4 2m-8 12 2-2" fill="none" stroke="#92adb3" stroke-width=".7" opacity=".55"/>
          <path d="m-12-29 7-2m-7 8 4-1m-5 7 6-1m-7 11 4-1M-15 7l4-1" stroke="#a4c9cd" stroke-width="1" opacity=".5"/>
          <path d="m-22-39-4 7 1 51m1 15 11 11 24-2 11-16M-18 37l25-2" fill="none" stroke="#adc7c9" stroke-width="1.3"/>
          <path d="M-26-22v14m48 21v9" stroke="#c7e9e3" stroke-width="2"/><path d="m-13-45 13-3" stroke="#b8b7a2" stroke-width="2"/>
        </g>
      </defs>
      <path fill="#050d19" d="M0-100h1600v900H0Z"/>
      <g class="ending-stars">${stars.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i%4?'.8':'1.4'}" fill="${i%3?'#72909d':'#c1dde0'}"/>`).join('')}</g>
      <path d="M-30 468Q470 120 1190 488" fill="none" stroke="#142633" stroke-width="75" opacity=".26"/>
      <path d="M-30 469Q470 121 1190 489" fill="none" stroke="#35414b" stroke-width="1" opacity=".4"/>
      <g class="ending-destination" transform="translate(1370 155) rotate(-22)">
        <circle r="85" fill="#24404b" opacity=".32"/><circle r="80" fill="url(#ending-earth-light)" stroke="#a6ced0" stroke-width="1"/>
        <g clip-path="url(#et-planet)">
          <path d="M-76-48C-65-59-59-55-52-48S-36-50-32-39-39-29-38-24-23-24-24-16-38-12-42-4-60 2-65-8-74-10-80-5ZM-29-12C-18-16-7-8-7 1S-16 11-14 23-21 33-22 45-31 59-34 49-42 35-38 25-45 10-39 1-37-7-29-12ZM19-72C30-73 41-63 43-51S32-40 39-29 55-27 52-17 60-5 76-6L83-55Z" fill="#89a9a0" opacity=".33"/>
          <path d="M-77-24C-60-36-48-32-31-38S-3-49 14-42 34-41 43-45M-74-5C-54-16-36-13-17-18S7-26 25-21M-51 49C-36 34-14 35 1 29S29 24 47 26" fill="none" stroke="#d4e5d9" stroke-width="2.5" stroke-linecap="round" opacity=".21"/>
          <path d="M-57-52C-43-65-22-69-4-66M-54-47C-37-61-14-63 3-59M-74 4C-61-3-52-1-42-5M-24 54C-8 47 9 48 22 41" fill="none" stroke="#c7dad3" stroke-width="1" opacity=".24"/>
          <circle r="80" fill="url(#et-planet-shadow)"/>
        </g>
        <path d="M-79-17a81 81 0 0 1 105-60" fill="none" stroke="#e1f5ea" stroke-width="1.5"/>
        <path class="ending-arrival" d="M-86-26a90 90 0 0 1 143-42M-94-29a99 99 0 0 1 157-46" fill="none" stroke="#b8f5ff" stroke-width="1"/>
      </g>
      <ellipse class="ending-reactor-halo" cx="610" cy="310" rx="485" ry="350" fill="url(#ending-flash)"/>
      <g data-art-layer="shock-fronts" transform="translate(623 304) rotate(-22)">
        <ellipse rx="307" ry="151" fill="none" stroke="#f0a474" stroke-width="1.4" opacity=".18"/>
        <path d="M-234-13C-209-93-54-115 92-78 203-50 252-4 223 46 189 103 56 126-87 88C53 138 210 105 246 41 278-16 225-76 101-108-60-145-220-105-247-22Z" fill="url(#et-pressure-band)"/>
        <path d="M-94 95C-26 119 44 125 105 108 167 99 210 77 231 51 252 24 248-10 226-37" fill="none" stroke="#ffd8a3" stroke-width="3.5" opacity=".7"/>
        <path d="M-85 108C-25 127 50 134 101 121M208 87C244 59 261 26 252 4" fill="none" stroke="#c7865c" stroke-width="1.6" opacity=".4"/>
        <path d="M-83 91C-15 116 47 117 104 101L115 104 95 110 91 107C43 123-29 120-84 99Z" fill="#f6c38b" opacity=".16"/>
        <path d="M-290 15C-279-98-120-145 33-123 222-96 311-6 263 67 221 131 63 149-80 115" fill="none" stroke="#c77751" stroke-width="14" opacity=".09"/>
        <path d="M-243 11C-229-76-108-117 18-102 171-83 250-13 218 45 192 92 90 110-15 98" fill="none" stroke="#ffd8a5" stroke-width="2.8" opacity=".48"/>
        <path d="M-213 8C-204-58-104-91 6-81 139-67 204-14 185 34" fill="none" stroke="#ef9a67" stroke-width="10" opacity=".2"/>
        <path d="M-185-5C-161-69-58-79 32-58 118-38 150 10 116 40" fill="none" stroke="#ffe4bc" stroke-width="2" opacity=".55"/>
      </g>
      <g class="ending-ship" data-vessel="colony-spine" transform="translate(630 308) rotate(-18)" stroke="#04101a" stroke-width="3" style="stroke-width:3" stroke-linejoin="round">
        <g class="ending-ship-aft">
          <path data-vessel-section="radiators" d="m-445-91 205 10 21-65-218-30Zm-4 166 202 11 17 58-218-16Z" fill="#152b37"/>
          ${radiatorRibs}
          <path d="m-439-173 205 10m-211 6 207 10m-211 270 215 13m-211-26 207 13" stroke="#7f8b85" stroke-width="2" fill="none"/>
          <path data-vessel-section="engine-bells" d="m-474-78-57-15-27 7-18 25 4 29 25 18 73 1m-3 47-64-7-31 14-8 31 17 27 29 7 61-14" fill="#2b414e"/>
          <path d="m-475-73-57-14-22 7-11 15 35-5 54 12m-5 102-60-6-26 12 34 7 52 1" fill="#849691"/>
          <path d="m-568-63 10-14 19-2 10 21-4 26-16 8-17-12Z" fill="#071521" stroke="#8b9fa0" stroke-width="2"/>
          <path d="m-563-58 6-11 11-2 6 15-2 17-10 6-9-11Z" fill="#263e4d" stroke-width="1"/>
          <path d="m-571 56 10-11 18 3 12 23-5 23-17 3-16-17Z" fill="#071521" stroke="#7d9599" stroke-width="2"/>
          <path d="m-564 59 5-6 10 2 8 16-3 15-9 1-9-13Z" fill="#263e4d" stroke-width="1"/>
          <path d="m-549-69 1 25m-10 103 8 22" stroke="#9ebfc0" stroke-width="1"/>
          <path d="m-529-64 46 10m-48 125 48 4" stroke="#162a37" stroke-width="8"/>
          <path d="m-524-62 39 9m-42 125 42 3" stroke="#697e83" stroke-width="1.5"/>
          <path d="m-489-79 142-22 137 19 102 36 18 42-25 49-104 40-137-4-131-43Z" fill="url(#ending-steel)"/>
          <path d="m-482-76 139-19 131 18 77 26-50 15-155-16-105 12Z" fill="url(#et-top)"/>
          <path d="m-482-76 139-19 131 18 77 26-50 15-155-16-105 12Z" fill="url(#et-reactor-bounce)" stroke="none"/>
          <path d="m-487-37 145-15 157 16 49-15 24 37-39 24-186-19-148 12Z" fill="#465e68"/>
          <path d="m-486 3 146-12 187 19-2 31-64 32-126-5-140-39Z" fill="#122b39"/>
          <path d="m-473-58 113-15 96 11m-215 56 139-7 153 15m-294 29 142 39 119 4" fill="none" stroke="#b9c2b5" stroke-width="1.5"/>
          <path d="m-414-49 8 82m77-85 3 107m62-101-1 105" fill="none" stroke="#122630" stroke-width="4"/>
          <path d="m-455-24 73-7m-69 19 70-7m-62 19 63-6" stroke="#0b1b28" stroke-width="7"/>
          <path d="m-454-26 67-6m-62 19 61-6m-55 18 55-5" stroke="#a4b8ad" stroke-width="1"/>
          <path data-vessel-section="engineering-trunk" d="m-326-34 122 13-3 34-120-13Z" fill="#172f3d" stroke="#0b202c" stroke-width="2"/>
          <path d="m-321-30 113 12m-115 13 112 13" stroke="#7e9696" stroke-width="1.3"/>
          <path d="m-308-26 13 2 1 26-13-1Zm38 4 12 1 1 27-12-1Zm37 4 13 1-1 27-12-1Z" fill="#49616a" stroke-width="1.6"/>
          <path d="m-313-17 100 11m-98-4 96 10" fill="none" stroke="#9aa99e" stroke-width="1" opacity=".6"/>
          <path d="m-353 13 9 25 24 8m87-5 12-8" fill="none" stroke="#617781" stroke-width="1" opacity=".5"/>
          <path data-vessel-section="reactor-aft" d="m-187-67 48 4 29 24 29-7 13 18-17 18 13 23-22 4-16 33-31-3-47 14Z" fill="url(#et-hot-metal-aft)"/>
          <path d="m-177-57-5 104m19-99-5 93m21-85-5 75" fill="none" stroke="#263c44" stroke-width="7"/>
          <path d="m-96-29 11 18-13 17 7 15-15 22" fill="none" stroke="#fff0bd" stroke-width="3"/>
          <path d="m-125-44 20 17-13 19 13 12m-6 13-11 18" fill="none" stroke="#ea9e72" stroke-width="1.5"/>
          <path data-vessel-section="ruptured-reactor-collar" d="M-135-48C-107-35-106 24-132 44L-144 34C-126 20-123-19-145-34Z" fill="#7f776a" stroke="#273641" stroke-width="2.5"/>
          <path d="M-132-40C-113-22-115 16-135 34" fill="none" stroke="#dcb58a" stroke-width="1.7"/>
          <path d="m-125-30-7 4m11 11-8 1m8 14-8-1m5 15-8-3" fill="none" stroke="#334852" stroke-width="3"/>
          <path d="m-175-52 6 18m29 67-7 14" fill="none" stroke="#d5b69a" stroke-width="1" opacity=".5"/>
        </g>
        <g class="ending-ship-bow">
          <path data-vessel-section="habitat-ring-back" d="M202-180C106-182 111 174 213 183L229 169C145 164 142-162 215-164Z" fill="#273c48" stroke="#071723" stroke-width="5"/>
          <path d="M210-172C135-161 139 158 219 176" fill="none" stroke="#a9b7aa" stroke-width="3"/>
          <g data-vessel-section="ring-supports-rear" fill="#334d58" stroke="#0a202c" stroke-width="3"><path d="m204-161 18-2-20 139-15 9-7-13Z"/><path d="m278-47 1 20-69 37-14-10Z"/><path d="m212 20 14 3 11 140-17 7-18-133Z"/></g>
          <path d="M219-153 197-25m15 55 19 125" fill="none" stroke="#9aaea7" stroke-width="1.6"/>
          <path data-vessel-section="spine" d="m58-49 91-28 207 27 116 43 59 44-59 33-126 2-209-37-60-23 10-30Z" fill="url(#ending-steel)"/>
          <path d="m84-48 70-22 204 27 93 34-63 11-226-31-65 5Z" fill="url(#et-top)"/>
          <path d="m84-48 70-22 204 27 93 34-63 11-226-31-65 5Z" fill="url(#et-fore-bounce)" stroke="none"/>
          <path d="m91-25 72-4L389 2l63-11 42 32-111 16-220-33-66-16Z" fill="#506975"/>
          <path d="m96-10 69 16 217 31 109-14-22 25-121 9-203-35-60-24Z" fill="#142b3a"/>
          <path d="m165-29-2 35m225-4-6 35M97-27l66-9L388-5m-243 27 204 35 121-9" fill="none" stroke="#b7c4b8" stroke-width="1.6"/>
          <g data-vessel-section="cryo-decks">${cryoDecks}</g>
          <path d="m327-22 43 6v25l-43-6Z" fill="#223c4b"/><path d="m331-17 32 5m-32 4 31 4" stroke="#8ea6a6" stroke-width="1.5"/>
          <path d="m366-43 2-34 55 9 24 59-20-8-17-35-30-4v17Z" fill="#4a626c"/>
          <path d="m374-72 45 8m-39 4 33 5" fill="none" stroke="#b8c5ba" stroke-width="1.5"/>
          <path data-vessel-section="warning-transmitter" d="m418-62 2-16m-4-4 8 1 2 8-8-1Z" fill="#c9ddcf" stroke="#102330" stroke-width="1.5"/>
          <path d="m445-8 34 14 24 22-49-6-31-14Z" fill="#96c4c5" stroke-width="2"/>
          <path d="m453-3 7 14m5-11 7 14m6-8 6 11" stroke="#132b38" stroke-width="2"/>
          <path d="m69-40-8 17 9 19-15 13 21 17 19 4 1-56Z" fill="url(#et-hot-metal)"/>
          <path d="m65-37-5 15 10 17-15 14 16 14" fill="none" stroke="#ffe2ac" stroke-width="3"/>
          <path d="m87-50-2 57m13-60-1 64" stroke="#1b303b" stroke-width="5"/>
          <path d="M82-42C65-32 66-6 83 9L91 4C78-8 78-27 91-34Z" fill="#8f8d7e" stroke="#233a46" stroke-width="2.2"/>
          <path d="M80-34C72-24 73-9 83-1" fill="none" stroke="#e4c399" stroke-width="1.2"/>
          <path data-vessel-section="habitat-ring-front" d="M211-181C312-180 323 173 221 183L207 167C289 151 281-150 211-163Z" fill="url(#et-ring)" stroke="#071723" stroke-width="5"/>
          <path d="M212-161C278-144 284 139 209 164L224 160C301 137 296-134 226-157Z" fill="#142c39" stroke="none"/>
          <path d="M241-131C272-88 282 62 252 122" fill="none" stroke="#b3bbab" stroke-width="1.5"/>
          <path d="m243-124 7 12m7 17 4 13m4 17 2 14m2 17 1 15m0 18v15m-1 19-1 14m-3 18-3 14m-4 17-5 12" fill="none" stroke="#6d9093" stroke-width="4"/>
          <path d="m228 40 29 43-5 23-36-54Z" fill="#3a535d" stroke="#081e2b" stroke-width="3"/>
          <path d="m233 50 19 28" stroke="#b4bdac" stroke-width="1.5"/>
          <path d="M219-173C304-153 308 147 222 175" fill="none" stroke="#c5c5ae" stroke-width="2"/>
          <path d="M226-153C289-111 291 118 233 151" fill="none" stroke="#233d49" stroke-width="8"/>
          <path d="M246-120q12 29 16 61m3 26 2 46m-1 25-4 33m-7 26-8 25" fill="none" stroke="#b9c6b8" stroke-width="2.5"/>
          <g fill="none">${ringRibs}</g>
          <path d="m203-175 10-6 13 7m-15 352 10 5 10-7" fill="none" stroke="#d2bd9a" stroke-width="3"/>
          <path d="m117-79 17-30 53 7-10 33m-42-24 42 5m-53 3 48 6" fill="#526973" stroke="#0c202c" stroke-width="2"/>
          <path d="m127-105 41 6" stroke="#cad0bd" stroke-width="1.5"/>
        </g>
      </g>
      <g data-art-layer="reactor-ejecta" transform="translate(610 302) rotate(-18)">
        <path data-art-layer="directed-ejecta" d="M-32-35C-63-65-83-99-102-138S-135-197-161-216C-122-199-103-167-87-133S-56-70-21-45ZM8-40C50-70 76-119 104-170S151-236 181-245C145-224 123-191 105-157S55-60 21-27Z" fill="url(#et-ejecta-trail)" opacity=".65"/>
        <path d="M-11 25C24 69 48 119 92 160S154 201 191 208C137 207 103 181 73 146S21 63-23 36Z" fill="#b5714e" opacity=".12"/>
        <path d="M-43-60C-80-107-97-164-136-193M35-66C82-126 92-178 142-216M-9 55C32 103 65 162 133 190" fill="none" stroke="#edb47a" stroke-width=".9" opacity=".56"/>
        <path d="M-30-65C-67-103-109-120-156-132M21-47C84-97 119-137 143-192M10 59C65 112 102 148 156 190M-39 41C-100 76-149 107-192 149" fill="none" stroke="#dba775" stroke-width="1" opacity=".42"/>
        <path d="M-24-66C-52-112-52-157-32-200M25 49C43 97 34 135 14 167" fill="none" stroke="#dc815b" stroke-width="16" opacity=".1"/>
        <ellipse cx="-11" cy="-8" rx="103" ry="80" fill="url(#et-core)" transform="rotate(-24)" opacity=".55"/>
        <g data-vessel-section="torn-reactor-rails" stroke="#1b222c" stroke-width="2">
          <path d="m-82-30 19-5 22 17-9 5-18-8-15 5Z" fill="#bda084"/>
          <path d="m-88 31 21-8 20 5 16-11 4 7-20 19-20-7-19 9Z" fill="#715347"/>
          <path d="m65-26-21 5-17-7-9 6 22 13 20-7Z" fill="#b89f89"/>
          <path d="m60 17-19-4-10 12-17 2 1 8 23-1 13-9 11 4Z" fill="#8c6755"/>
        </g>
        <path d="M-79 29C-52 20-69 2-46-17-29-32-30-15-14-29 3-46 31-32 22-16 49-21 54 1 36 11 17 5 17 30-1 30-12 42-27 26-39 37-50 50-72 43-79 29Z" fill="url(#et-core)"/>
        <path d="M-65 27C-53 25-59 9-44-4S-28-7-19-19-4-33 7-24M-40 29C-26 25-26 12-13 10S9-6 19-2 33-6 37-11" fill="none" stroke="#f5b57c" stroke-width="8" opacity=".6"/>
        <path class="ending-reactor-core" d="M-66 28C-52 26-59 10-44-3S-31-6-21-17-6-34 6-25M-39 27C-25 24-25 13-13 11S9-5 18-1" fill="none" stroke="#fff0bc" stroke-width="2.8"/>
        <path d="M-82-12C-46-1-40-29-18-18M65 9C40 17 37-1 23 6M-85 36C-59 32-49 47-35 33" fill="none" stroke="#6b493c" stroke-width="2"/>
        <path d="M-82-12C-46-1-40-29-18-18M65 9C40 17 37-1 23 6" fill="none" stroke="#ecc293" stroke-width=".8"/>
        <path d="M-54 36C-82 19-88-10-61-38-41-59-42-92-62-111M26-31C62-29 75-4 56 20S48 57 70 72" fill="none" stroke="#dc9a6b" stroke-width="3" opacity=".55"/>
        <path d="M-56 33C-76 16-80-9-58-32M34-24C58-19 63-3 51 16" fill="none" stroke="#ffdba7" stroke-width="1.2" opacity=".8"/>
        <path d="M-33-20C-18-52-9-78 18-100M6 14C26 27 30 50 23 75" fill="none" stroke="#e79361" stroke-width="7" opacity=".2"/>
        <g class="ending-debris" stroke-width="2" style="stroke-width:2">
          <path d="m-105-128 17-25 20 8-4 8-12-3-9 15-14-3Zm180-28 17-16 7 8-6 9 11 13-8 5-10-13-6 5Zm-190 243 20-9 13 9-8 7-6-3-12 16-9-5 6-11Zm177 19c12-2 26-11 35-21l9 13c-7 15-20 25-34 27l-6-12Z" fill="#4e646e"/>
          <path d="m-47-196 5-16 10 3 1 9 12-2-3 13-10-1-4-7Zm112 267 10 2 1 9 8 6-7 9-6-3-4-12-7-4Zm-216-114 21-13 13 6-7 6-7-2-11 13Z" fill="#667980"/>
          <path d="m-100-133 12-16 15 6m153-17 9 13m-201 235 16-5m171 21q17-4 30-17" fill="none" stroke="#e6b691" stroke-width="1.8"/>
          <path d="m-98-134 10-13 9 4m157-4 8 9m-193 7 4-4m178 163 4-2" fill="none" stroke="#182e3c" stroke-width="2"/>
        </g>
        <path d="m-78-104-14-18m156-3 11-19M-89 75l-13 11m144 13 18 8M-33-169l-4-19m94 228 8 23" fill="none" stroke="#bba18b" stroke-width=".8" opacity=".6"/>
        <g fill="#f0bf86"><path d="m-131-78 3-10 3 8-3 5Zm-58 179 8-5-3 6Zm232 40 5 8-8-3Zm19-258 3-8 3 7Z"/><circle cx="-54" cy="91" r="1.5"/><circle cx="37" cy="-104" r="1.5"/><circle cx="108" cy="57" r="1.2"/></g>
      </g>
      <path class="ending-signal-track" d="M1027 104C1138 26 1271 78 1295 134" fill="none" stroke="url(#ending-signal-light)" style="stroke-width:1.15;opacity:.8"/>
      <path class="ending-signal" d="M1027 104C1138 26 1271 78 1295 134" fill="none" stroke="#e2faff" style="stroke-width:1.5"/>
      <g class="ending-pods" data-art-layer="foreground-loss"><use href="#ending-pod" transform="translate(1070 550) rotate(35) scale(1.06)"/><use href="#ending-pod" transform="translate(1220 635) rotate(-17) scale(.53)"/><use href="#ending-pod" transform="translate(929 458) rotate(54) scale(.32)"/></g>
      <path d="m1044 565-25 18m193 49-14-13m-327-165-12 6M777 508l10 8" stroke="#76949e" stroke-width="1.3" opacity=".6"/>
    </svg>
    <figcaption class="ending-outcomes"><div class="ending-loss"><span class="eyebrow">COLONY SHIP / SIGNAL LOST</span><strong>Passengers and marine lost.</strong></div><div class="ending-success"><span class="eyebrow">NEW EARTH / SIGNAL RECEIVED</span><strong>The warning made it.</strong></div></figcaption>
  </figure>`;
}
