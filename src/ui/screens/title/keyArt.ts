/** Original cryo-deck key art. All marks are authored vector paths, never game geometry. */
export function titleKeyArt(rig?: string, still = false, reveal = true): string {
  const accents: Record<string, string> = {breacher: '#ffb454', cryo: '#7fd6ff', pyro: '#ff7a2e', arc: '#b79cff'};
  const accent = accents[rig?.toLowerCase() ?? ''] ?? '#9fe8ff';
  return `<div class="title-key-art${still ? ' key-art-still' : ''}${reveal ? '' : ' key-art-revealed'}" style="--suit-accent:${accent}" aria-hidden="true">
  <svg viewBox="0 0 1600 900" preserveAspectRatio="xMaxYMid meet" focusable="false" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ka-deck" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#07121a"/><stop offset=".58" stop-color="#102631"/><stop offset="1" stop-color="#040c12"/></linearGradient>
    <linearGradient id="ka-glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#456571"/><stop offset=".3" stop-color="#203d4b"/><stop offset=".55" stop-color="#142d3a"/><stop offset="1" stop-color="#091721"/></linearGradient>
    <linearGradient id="ka-frost" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b0dce0" stop-opacity=".35"/><stop offset=".46" stop-color="#9fe8ff" stop-opacity=".04"/><stop offset="1" stop-color="#9fe8ff" stop-opacity=".18"/></linearGradient>
    <linearGradient id="ka-shaft" x1="0" y1="0" x2=".3" y2="1"><stop stop-color="#ff8051" stop-opacity=".34"/><stop offset=".6" stop-color="#ff5a36" stop-opacity=".08"/><stop offset="1" stop-color="#ff5a36" stop-opacity="0"/></linearGradient>
    <radialGradient id="ka-warm"><stop stop-color="#f18659" stop-opacity=".24"/><stop offset="1" stop-color="#ff5a36" stop-opacity="0"/></radialGradient>
    <radialGradient id="ka-friendly"><stop stop-color="#bcefff" stop-opacity=".3"/><stop offset="1" stop-color="#9fe8ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="ka-haze"><stop stop-color="#80bed2" stop-opacity=".16"/><stop offset="1" stop-color="#9fe8ff" stop-opacity="0"/></radialGradient>
    <linearGradient id="ka-left"><stop offset="0" stop-color="#030c12"/><stop offset=".38" stop-color="#030c12" stop-opacity=".96"/><stop offset=".63" stop-color="#030c12" stop-opacity="0"/></linearGradient>
    <linearGradient id="ka-bottom" x1="0" y1="0" x2="0" y2="1"><stop offset=".6" stop-color="#030c12" stop-opacity="0"/><stop offset="1" stop-color="#030c12" stop-opacity=".82"/></linearGradient>
    <g id="ka-pod" stroke-linejoin="bevel">
      <path d="M0 18 19 0h124l20 22v326l-19 24H16L0 350Z" fill="#0a1720" stroke="#020a10" stroke-width="7"/>
      <path d="m10 22 15-12h108l18 16v313l-14 20H24L11 341Z" fill="#29424e" stroke="#587783" stroke-width="2"/>
      <path d="M29 43h99l9 16v223l-17 31H38l-15-27V59Z" fill="url(#ka-glass)" stroke="#07131c" stroke-width="7"/>
      <g opacity=".34" fill="#081a27"><ellipse cx="81" cy="105" rx="15" ry="22"/><path d="m57 136 22-10 26 12 10 45-12 28-5 67H72l-6-68-17-20Z"/></g>
      <path d="m31 47 33 2-35 75Zm77 0h17l7 17v71L42 296H30v-27Z" fill="url(#ka-frost)"/>
      <path d="m28 60 13-9-8 31 10 14-12 42 5 33-9 14Zm101 117-11 27 10 12-20 47 3 32 16-17Z" fill="#a3cbd1" opacity=".1"/>
      <path d="m35 53 12 20-12 32 18 14-12 34m79 111-19 4 7 20-23 14m-49-65 11 9-9 15" fill="none" stroke="#bce3e4" stroke-opacity=".27" stroke-width="2"/>
      <path d="M24 29h106M20 325h119" stroke="#90b1bc" stroke-opacity=".45" stroke-width="3"/>
      <path d="M37 339h26l5-7 5 13 6-6h18" fill="none" stroke="#9fe8ff" stroke-opacity=".55" stroke-width="2"/>
      <path d="M112 339h12" stroke="#b8eff3" stroke-width="3"/>
      <path d="M3 100h10m-10 167h10m138-167h11m-11 167h11" stroke="#020a10" stroke-width="10"/>
      <path d="M43 22h36" stroke="#a9ced5" stroke-opacity=".65" stroke-width="2"/>
    </g>
  </defs>
  <rect width="1600" height="900" fill="#030c12"/>
  <g class="ka-plane ka-far">
    <path d="M520 0h1080v900H520Z" fill="url(#ka-deck)"/>
    <path d="m600 0 472 284h164L1600 0ZM520 900l552-471h164l364 471Z" fill="#14232b"/>
    <path d="m520 0 552 284v145L520 900Zm1080 0-364 284v145l364 471Z" fill="#0a1820"/>
    <path d="M1070 282h168v151h-168Z" fill="#040b11" stroke="#2a414a" stroke-width="3"/>
    <path d="M1102 308h104v124h-104Z" fill="#02090e" stroke="#192f3a" stroke-width="7"/>
    <path d="M1147 312v112m-29-75h72" stroke="#27434d" stroke-width="2"/>
    <g fill="none" stroke="#233741" stroke-width="3">
      <path d="m720 0 352 284m-137-284 137 284m435-284-271 284m-40-284 40 284M600 900l472-471m-196 471 196-471m482 471-318-471m-62 471 62-471"/>
      <path d="m708 121 285 198v181L707 756m121-585 196 157v146L820 658m95-433 130 111v118l-134 111m411-453-54 207v181l332 221m-220-549-82 156v146l302 186m-160-435-118 111v118l278 112"/>
    </g>
    <g stroke="#020a10" stroke-width="9" fill="none"><path d="m688 0 297 260v271L666 900m232-900 143 304v163L898 900m667-900-271 260v271l306 251"/></g>
    <g stroke="#6c98a6" stroke-opacity=".18" stroke-width="2" fill="none"><path d="m698 0 294 259v268L680 900m226-900 143 305v159L913 900m660-900-271 260v267l298 244"/></g>
    <path d="m1020 500 580 318v50l-587-351Z" fill="#243c46" opacity=".4"/>
    <path d="M980 557 1600 900m-689-215h518M1008 514h321M798 802h720M1055 465h225" stroke="#030b12" stroke-width="5"/>
    <path d="M1081 440 818 900m398-460 233 460" stroke="#68868a" stroke-opacity=".22" stroke-width="3" stroke-dasharray="14 25"/>
    <g opacity=".38"><use href="#ka-pod" transform="translate(1049 320) scale(.2 .29)"/><use href="#ka-pod" transform="translate(1235 316) scale(.19 .32)"/></g>
    <g opacity=".58"><use href="#ka-pod" transform="translate(1002 283) scale(.26 .48)"/><use href="#ka-pod" transform="translate(1290 274) scale(.33 .53)"/></g>
    <ellipse cx="1170" cy="445" rx="300" ry="230" fill="url(#ka-haze)"/>
  </g>
  <g class="ka-plane ka-middle">
    <use href="#ka-pod" transform="matrix(.56 .11 0 .87 890 226)"/>
    <use href="#ka-pod" transform="matrix(.8 .18 0 1.23 742 144)"/>
    <use href="#ka-pod" transform="matrix(.66 -.18 0 .97 1442 184)"/>
    <use href="#ka-pod" transform="matrix(.39 -.1 0 .7 1364 240)"/>
    <path d="m780 612 117-35 35 26-123 43Z" fill="#07131c" stroke="#334e59" stroke-width="2"/>
    <path d="M790 606v-88m8 89v-80" stroke="#020a10" stroke-width="8"/>
    <g fill="#a5d8e0" opacity=".3" font-family="Barlow Condensed,sans-serif" font-size="12" letter-spacing="2"><text x="770" y="600" transform="rotate(12 770 600)">CRYO / 08</text><text x="1454" y="564" transform="rotate(-15 1454 564)">12</text></g>
  </g>
  <g class="ka-plane ka-threat">
    <g stroke-linejoin="bevel" stroke="#030b11" stroke-width="5">
      <path d="m1428 399-20-44 9-36 27 40 12 21 25 14 16 51-18 52-23 17-40-15-17-46Z" fill="#0d1b22"/>
      <path d="m1441 396-3-37 23-18 7-42 13-22 4 50-8 39-8 44m-34 36-36-28-26-53-31-17-15-40-4 63 34 26 25 54 38 27m45-12 33-35 16-70 30-22 3-31 12 48-28 31-8 63-43 52" fill="#0d2028"/>
      <path d="M1452 412q-46-33-65-86l-37-18-13-43-9 54 40 28q17 57 52 86Z" fill="#0b1c23"/>
      <path d="M1441 417q-43-33-63-83l-30-19-9-30" fill="none" stroke="#4a6970" stroke-width="2"/>
      <path d="m1433 478-40 41-2 54-27 49 5-63-8-53 34-48m71 28 29 28-4 58 16 35-30-21-12-59-28-17" fill="#0b1c23"/>
      <path d="m1478 419 13-22 14-57 20-16m-90 119-37-32-23-49-29-16m88 134-46 40-3 45m91-66 21 23-4 40" fill="none" stroke="#375b62" stroke-width="2"/>
      <path d="m1416 455 10-16 13 11-1 23-13 10-10-12m28 8 11-8 12 12-4 22-12 6-10-15" fill="#506c37" stroke-width="3"/>
      <path d="m1424 448 6 4-2 13m24 8 4 7-2 11" fill="none" stroke="#a6d977" stroke-width="2"/>
      <path d="m1423 401 15-12 25 3 16 18-10 23-28 2-20-16Z" fill="#030b10" stroke-width="3"/>
      <path d="m1429 431 11 9 5-8 7 8 10-10" fill="none" stroke="#4b6664" stroke-width="2"/>
    </g>
    <path d="m1436 391 21-11 30 23 8 53-20 53-38 2-20-17 11-27-19-39Z" fill="#020a10" opacity=".37"/>
    <g class="ka-eyes ka-eyes-main" fill="#c0f98f">
      <path d="m1428 405 9 1-2 5-7-2m16-9 8 2-2 5-7-1m14-2 10-1 2 5-10 2"/>
      <path d="m1433 418 6-1-1 4-4 1m14-5 6 1-1 4h-5"/>
    </g>
    <g class="ka-eyes ka-eyes-deep" fill="#94be78" opacity=".7"><path d="m1277 374 5 1-1 3-4-1m12-2 5-1-1 3-4 1M1193 353h3v2h-3m8-2h3v2h-3M1356 429l5 1v3l-5-1m12-2 5-1v3l-5 1"/></g>
  </g>
  <g class="ka-emergency">
    <ellipse cx="1110" cy="240" rx="380" ry="390" fill="url(#ka-warm)"/>
    <path d="m1060 73 38 3 236 724-462-103Z" fill="url(#ka-shaft)"/>
    <path d="m1067 76 8 1 136 563-50-24Z" fill="#ff9863" opacity=".055"/>
    <path d="m1035 52 9-19 76 5 12 18-4 30-90-6Z" fill="#030b11" stroke="#40535b" stroke-width="3"/>
    <path d="m1048 57 66 4-1 10-67-5Z" fill="#ff784e"/><path d="m1053 58 54 4" stroke="#ffd1a4" stroke-width="3"/>
    <path d="m1080 36 5-36" stroke="#02090e" stroke-width="10"/>
  </g>
  <path d="m1097 495-96 316 228 30-83-345Z" fill="url(#ka-shaft)" opacity=".3"/>
  <ellipse cx="1100" cy="842" rx="146" ry="17" fill="#01080d" opacity=".75"/>
  <g class="ka-plane ka-marine"><g class="ka-marine-reveal" stroke="#020a11" stroke-linejoin="bevel" stroke-width="6">
    <!-- Planted asymmetrical stance: far leg, near leg, armored boot silhouettes. -->
    <path d="m1082 567 90 4 24 81-3 86 21 65 26 13 9 24-83 3-21-23-12-76-34-67Z" fill="#172b37"/>
    <path d="m1149 651 32 4-8 75 25 67-27 8-23-65Z" fill="#344955" stroke-width="3"/>
    <path d="m1168 807 35-5 10 16 20 8-58 2Z" fill="#40535c" stroke-width="3"/>
    <path d="m1018 555 94 22 15 69-39 75-10 94 10 20-22 19-69-2 3-25 23-20 4-100 17-61-31-34Z" fill="#263d4b"/>
    <path d="m1033 621 43 7 11 26-31 55-22-9 14-54Z" fill="#526775" stroke-width="3"/>
    <path d="m1035 713 35 5-10 90-30 9Z" fill="#3e5665" stroke-width="3"/>
    <path d="m1006 831 29-15 31 3 7 16-16 7h-48Z" fill="#526874" stroke-width="3"/>
    <path d="M1055 677l22-27m-43 92 27 4m-30 25 27 3m111-78 17 1" fill="none" stroke-width="4"/>
    <!-- Arm undersuit, collar and rear cuirass. -->
    <path d="m1040 361 71-18 75 27 28 48-43 142-31 52-122-30-26-80 11-83Z" fill="#101e2a"/>
    <path d="m1080 340 20-39 55 13 14 51-34 32-57-22Z" fill="#263c49"/>
    <path d="m1078 351 58 24 29-18m-90 5 59 25 30-19" fill="none" stroke-width="5"/>
    <path d="m1026 389 66-16 68 32-1 112-36 45-110-32-12-82Z" fill="#314957"/>
    <path d="m1032 399 58-14 57 27-11 44-46 16-65-26Z" fill="#657985" stroke-width="3"/>
    <path d="m1026 461 61 24 59-18-12 58-22 24-82-26Z" fill="#233b49" stroke-width="3"/>
    <path d="m1037 405 27-5 31 14-7 102-40-13-16-27Z" fill="#304b5b" stroke-width="4"/>
    <path d="m1045 415 14-3 24 10-2 13-36-13Z" fill="#738994" stroke-width="2"/>
    <path d="m1046 438 29 11m-29 0 28 11m-29 0 28 11m-28 0 27 11" fill="none" stroke="#0c1e2a" stroke-width="4"/>
    <path d="m1095 400 37 17-2 7-32-13m2 7 28 13-2 7-23-11m2 7 19 9-2 7-14-7" fill="#172c39" stroke-width="2"/>
    <path d="m1035 415 9-2 4 10-9 2m-2 5 9-2 4 10-9 2" fill="#b2c3c8" stroke="none" opacity=".65"/>
    <!-- Distinct offset heat exchanger, diagonal band and service markings. -->
    <path d="m1008 392 21-8 16 21-9 107-30 9-12-31Z" fill="#182c39" stroke-width="4"/>
    <path d="m1003 409 14-5 8 12-6 77-12 4Z" fill="#4b6471" stroke-width="3"/>
    <path d="m1045 399 15-3 57 139-14 8Z" fill="#0c1a25" stroke-width="3"/>
    <path d="m1066 409 22 10m-17 1 22 10m-17 1 22 10" fill="none" stroke="#172c38" stroke-width="3"/>
    <path d="m1106 486 25-8-4 24-25 8Z" fill="var(--suit-accent)" stroke-width="3" opacity=".75"/>
    <path d="m1099 516 25-8m-24 15 21-7" stroke="#7997a3" stroke-width="2"/>
    <path d="m1069 447 28 11 29-9-3 13-26 10-25-10Z" fill="#405d6c" stroke-width="3"/>
    <path d="m1083 452 13 5 13-4" fill="none" stroke="#95b7c2" stroke-width="2"/>
    <!-- Near shoulder and braced forearm. -->
    <path d="m1014 378 38 15-9 60-39 19-29-34 7-40Z" fill="#324c5b"/>
    <path d="m991 397 22-8 27 12-5 20-47 13Z" fill="#6d828b" stroke-width="3"/>
    <path d="m1000 444 34-7 19 36 40-18 24 23-17 38-57 12-46-33Z" fill="#233b48"/>
    <path d="m1011 458 15-6 20 36 47-15 8 13-58 23-30-31Z" fill="#526c78" stroke-width="3"/>
    <path d="m1092 454 24-20 26 11 8 24-21 20-26-6Z" fill="#0e202d" stroke-width="4"/>
    <path d="m1007 418 6-2 3 7-6 2m4-10 5-1 3 7-5 1" fill="#c7d9de" stroke="none"/>
    <!-- Far arm leads the rifle; the gun's negative space survives thumbnail reduction. -->
    <path d="m1161 370 36 5 23 32-4 23 42-22 17 29-63 37-38-23-22-38Z" fill="#2a4352"/>
    <path d="m1174 382 19 4 15 20-9 24-18-9Z" fill="#6c818b" stroke-width="3"/>
    <path d="m1244 408 23-13 25 7 3 17-24 20-18-3Z" fill="#152a37" stroke-width="4"/>
    <g transform="rotate(-12 1220 399)">
      <path d="M1117 378h44l17-17h112l18 9h44v31h-51l-17 15h-90l-21-8h-19l-17 28-18-8 11-29h-33Z" fill="#101f2b" stroke-width="5"/>
      <path d="M1177 368h107l17 10h25v11h-130l-21-9Z" fill="#6c7e85" stroke-width="3"/>
      <path d="M1210 387h63v19h-63Z" fill="#304b5b" stroke-width="3"/>
      <path d="M1241 364v-13h25v13m-62 51 4 26 24-1 3-25" fill="#233c4c" stroke-width="4"/>
      <path d="M1325 373h38v23h-38Z" fill="#152d3b" stroke-width="4"/>
      <path d="M1360 377v16" stroke="#9fe8ff" stroke-width="3"/>
      <path d="M1183 373h14m14 0h14m13 0h14m13 0h14" stroke="#172b38" stroke-width="3"/>
      <path d="M1220 395h27" stroke="var(--suit-accent)" stroke-width="2"/>
    </g>
    <!-- Helmet: rear shell, bevel band, visible side visor and jaw guard. -->
    <path d="m1084 274 27-29 46 2 31 23 9 47-23 31-44 5-38-23-15-27Z" fill="#344b59"/>
    <path d="m1089 277 26-24 37 2 28 20-5 20-45-15-37 13Z" fill="#617b89" stroke-width="3"/>
    <path d="m1083 301 44-12 45 13 18-18 6 25-27 20-39-10-42 5Z" fill="#1a303e" stroke-width="3"/>
    <path d="m1089 279 24-24 37 2 14 10-50-5-19 23Z" fill="#b3856b" stroke="none" opacity=".6"/>
    <path d="m987 405 11-11 17-6 14 6-26 3-13 14Z" fill="#b3856b" stroke="none" opacity=".65"/>
    <path d="m1158 254 26 19 10 36-7 9m-1 70 12 5 14 16m-38 323 12 68" fill="none" stroke="#84b5c7" stroke-width="2"/>
    <path class="ka-visor" d="m1173 302 17-11 2 17-21 13Z" fill="#c4f4ff" stroke="#9fe8ff" stroke-width="2"/>
    <path d="m1171 324 19-9-13 21-26 8-1-15Z" fill="#526c7a" stroke-width="3"/>
    <path d="m1091 310 12-4 8 20-11 3Z" fill="#142936" stroke-width="3"/>
    <path d="m1114 254 36 2 22 16m-80 7-7 17m-92 106-8 32m39 299-6 67m141 18 15 9" fill="none" stroke="#b8d9e0" stroke-width="2"/>
    <path class="ka-visor" d="m991 405 29-8 5 7-33 9Z" fill="#e8fbff" stroke="#9fe8ff" stroke-width="2"/>
    <path d="m1036 557 80 21 25-21-2 31-21 20-89-25Z" fill="#152b38" stroke-width="4"/>
    <path d="m1028 558 18 4-3 28-20-4Zm40 10 18 5-4 28-20-6Z" fill="#405a68" stroke-width="3"/>
    <path d="m1042 582 3 43" fill="none" stroke="#111e2a" stroke-width="7"/>
    <path d="m1042 582 3 43" fill="none" stroke="#6a808a" stroke-width="2"/>
  </g><ellipse cx="1181" cy="310" rx="28" ry="32" fill="url(#ka-friendly)"/><ellipse cx="1009" cy="404" rx="34" ry="21" fill="url(#ka-friendly)"/></g>
  <ellipse cx="1085" cy="364" rx="220" ry="270" fill="url(#ka-haze)" opacity=".4"/>
  <g class="ka-haze"><ellipse cx="1290" cy="712" rx="450" ry="115" fill="url(#ka-haze)"/><path d="M800 670q180-62 410 3t390-25v58q-240 2-390-15t-410 21Z" fill="#a1d9df" opacity=".025"/></g>
  <g class="ka-plane ka-front">
    <use href="#ka-pod" transform="matrix(1.35 -.26 0 2.1 1514 -40)"/>
    <path d="M1596 0q-95 140-33 330t-21 391q-21 52 58 110" fill="none" stroke="#01080d" stroke-width="21"/>
    <path d="M1591 0q-95 140-33 330t-21 391" fill="none" stroke="#314b58" stroke-width="3"/>
    <path d="m1482 900 118-115v115Z" fill="#02090f" stroke="#203944" stroke-width="4"/>
  </g>
  <g class="ka-frost" fill="#b9e6ee">${Array.from({length:28}, (_, i) => {
    const x = 750 + (i * 137 % 820), y = 90 + (i * 193 % 690);
    return `<path opacity="${.13 + i % 4 * .08}" d="m${x} ${y} 2-1 1 3-2 1Z"/>`;
  }).join('')}</g>
  <rect width="1600" height="900" fill="url(#ka-bottom)"/>
  <rect width="1600" height="900" fill="url(#ka-left)"/>
  </svg></div>`;
}
