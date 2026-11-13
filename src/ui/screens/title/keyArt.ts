/** Original cryo-deck illustration: four value families, one perspective, authored gesture. */
export function titleKeyArt(rig?: string, still = false, reveal = true): string {
  const accents: Record<string, string> = {breacher: '#ffb454', cryo: '#7fd6ff', pyro: '#ff7a2e', arc: '#b79cff'};
  const accent = accents[rig?.toLowerCase() ?? ''] ?? '#9fe8ff';
  const ribs = [.24, .38, .59, .88, 1.25].map(scale => `<g transform="translate(1190 350) scale(${scale}) translate(-1190 -350)"><path d="M655-85 887 179v440L655 1010M1630-85l-233 264v440l233 391"/><path class="ka-rib-edge" d="M664-85 895 180v437L664 1010M1621-85l-232 265v437l232 393"/></g>`).join('');
  return `<div class="title-key-art${still ? ' key-art-still' : ''}${reveal ? '' : ' key-art-revealed'}" style="--suit-accent:${accent}" aria-hidden="true">
  <svg viewBox="0 0 1600 900" preserveAspectRatio="xMaxYMid meet" focusable="false" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ka-deck" x2="0" y2="1"><stop stop-color="#07131c"/><stop offset=".5" stop-color="#1a3039"/><stop offset="1" stop-color="#06121b"/></linearGradient>
    <linearGradient id="ka-glass" x2="1" y2=".3"><stop stop-color="#62848b"/><stop offset=".19" stop-color="#2f505d"/><stop offset=".64" stop-color="#17313e"/><stop offset="1" stop-color="#0b202c"/></linearGradient>
    <linearGradient id="ka-frost" x2="1" y2="1"><stop stop-color="#c2e5e7" stop-opacity=".43"/><stop offset=".38" stop-color="#a5dfe6" stop-opacity=".04"/><stop offset="1" stop-color="#a5dfe6" stop-opacity=".25"/></linearGradient>
    <linearGradient id="ka-shaft" x2=".3" y2="1"><stop stop-color="#ffac78" stop-opacity=".24"/><stop offset=".65" stop-color="#c86743" stop-opacity=".045"/><stop offset="1" stop-color="#ff7950" stop-opacity="0"/></linearGradient>
    <linearGradient id="ka-condensation" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#c1e4e5" stop-opacity=".22"/><stop offset=".26" stop-color="#a3d2d9" stop-opacity="0"/><stop offset=".78" stop-color="#a3d2d9" stop-opacity="0"/><stop offset="1" stop-color="#c1e4e5" stop-opacity=".18"/></linearGradient>
    <linearGradient id="ka-armor" x1=".2" y1="0" x2=".9" y2="1"><stop stop-color="#91a8a7"/><stop offset=".26" stop-color="#547685"/><stop offset=".6" stop-color="#2a4c61"/><stop offset="1" stop-color="#142c3f"/></linearGradient>
    <linearGradient id="ka-forearm" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8bafaf"/><stop offset=".32" stop-color="#648794"/><stop offset="1" stop-color="#33536b"/></linearGradient>
    <radialGradient id="ka-pod-shadow"><stop stop-color="#020b13" stop-opacity=".88"/><stop offset="1" stop-color="#020b13" stop-opacity="0"/></radialGradient>
    <linearGradient id="ka-helmet" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b3a18a"/><stop offset=".32" stop-color="#7b949b"/><stop offset=".72" stop-color="#4c6b7b"/><stop offset="1" stop-color="#203747"/></linearGradient>
    <linearGradient id="ka-visor" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d0f9ff"/><stop offset=".35" stop-color="#91d7e5"/><stop offset="1" stop-color="#375a70"/></linearGradient>
    <radialGradient id="ka-warm"><stop stop-color="#b16b48" stop-opacity=".19"/><stop offset="1" stop-color="#a94f31" stop-opacity="0"/></radialGradient>
    <radialGradient id="ka-friendly"><stop stop-color="#bcefff" stop-opacity=".24"/><stop offset="1" stop-color="#9fe8ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="ka-haze"><stop stop-color="#8ebfcb" stop-opacity=".16"/><stop offset="1" stop-color="#9fe8ff" stop-opacity="0"/></radialGradient>
    <linearGradient id="ka-left"><stop offset="0" stop-color="#030c12"/><stop offset=".4" stop-color="#030c12" stop-opacity=".98"/><stop offset=".64" stop-color="#030c12" stop-opacity="0"/></linearGradient>
    <linearGradient id="ka-bottom" x2="0" y2="1"><stop offset=".63" stop-color="#030c12" stop-opacity="0"/><stop offset="1" stop-color="#030c12" stop-opacity=".8"/></linearGradient>
    <g id="ka-pod" stroke-linejoin="round">
      <path d="M0 24 22 0h119l23 27v325l-23 24H20L0 350Z" fill="#0d1c27" stroke="#020b12" stroke-width="8"/>
      <path d="m12 30 17-16h105l17 20v308l-17 19H28l-16-18Z" fill="#314d5b" stroke="#6c8d96" stroke-width="1.5"/>
      <path d="M31 50h97l9 18v218l-16 28H40l-16-28V69Z" fill="url(#ka-glass)" stroke="#07141f" stroke-width="8"/>
      <g fill="#0b202d" opacity=".76"><path d="M74 96q2-10 11-9 13 2 10 17l-5 14-13-2-5-11Z"/><path d="M76 122q-15 5-17 25l9 52 4 91h13l1-83 10 82h13l-3-99 10-36q-2-24-24-31Z"/><path d="m63 143-9 38 8 46m44-85 10 35-7 49" fill="none" stroke="#0b202d" stroke-width="9"/><path d="m61 158 48 1m-41 42 34 1" fill="none" stroke="#9ab9bf" stroke-opacity=".17" stroke-width="6"/></g>
      <path d="M31 54h95l8 17v213l-15 26H41l-14-26V71Z" fill="url(#ka-condensation)"/>
      <path d="M36 95q5 17 1 36t3 44m81-40q-5 12-2 25t-3 31M39 214q-3 8 0 13l-1 21m82-2-2 26" fill="none" stroke="#c7e2df" stroke-opacity=".25" stroke-width=".8"/>
      <path d="m33 67 6-5-2 13 8 8-10 16 3 18-8 12m96 109-8 21 6 5-12 29-2 20" fill="#b6d5d5" opacity=".15"/>
      <path d="M29 53h35L29 180Zm69 0h27l8 19v98L45 307H29v-39Z" fill="url(#ka-frost)"/>
      <path d="m32 64 12-9-6 41 9 16-12 43 3 45-10 23m97-34-10 34 8 14-20 52 2 21 15-22" fill="#b8e0e3" opacity=".2"/>
      <path d="m34 59 10 15-7 25 10 15m70 161-14 5 5 13-22 14M27 246l7-9 5 13-4 24" fill="none" stroke="#bce3e4" stroke-opacity=".34" stroke-width="1.3"/>
      <path d="M29 31h101M25 329h112" stroke="#9ab5bf" stroke-opacity=".4" stroke-width="2"/>
      <path d="M39 344h23l5-7 5 13 5-6h19" fill="none" stroke="#9fe8ff" stroke-opacity=".7" stroke-width="1.5"/>
      <path d="M113 344h12" stroke="#b8eff3" stroke-width="2.5"/>
      <path d="M1 104h13m-13 165h13m137-165h12m-12 165h12" stroke="#020b13" stroke-width="10"/>
      <path d="m38 38 9 2m63 263-2 7m-70-112 1 10m82-100v6" stroke="#c7e6e7" stroke-opacity=".36" stroke-linecap="round"/>
    </g>
  </defs>
  <rect width="1600" height="900" fill="#030c12"/>
  <g class="ka-plane ka-far">
    <path d="M550 0h1050v900H550Z" fill="url(#ka-deck)"/>
    <path d="M590 0h1010l-325 277h-170Z" fill="#15242c"/>
    <path d="m550 900 555-457h170l325 457Z" fill="#172e39"/>
    <path d="M1105 277h170v166h-170Z" fill="#081620" stroke="#42606c" stroke-width="3"/>
    <path d="M1134 300h112v141h-112Z" fill="#030c14" stroke="#1a3443" stroke-width="9"/>
    <path d="M1190 300v141m-56-103h112" stroke="#345563" stroke-width="1.5"/>
    <g fill="none" stroke="#263c47" stroke-opacity=".65" stroke-width="2"><path d="M640 0 1190 350 1590 0M866 0l324 350L550 900M1100 0l90 350 410 550M1300 0l-110 350 20 550M1600 570l-410-220-330 550"/></g>
    <g fill="none" stroke="#030d16" stroke-width="10">${ribs}</g>
    <path d="M812 683h642M706 781h824M970 559h395M1054 493h264" stroke="#040f19" stroke-width="4"/>
    <path d="M1190 447 875 900m315-453 262 453" fill="none" stroke="#72929a" stroke-opacity=".18" stroke-width="2" stroke-dasharray="10 21"/>
    <g opacity=".28"><use href="#ka-pod" transform="matrix(.18 .04 0 .32 1100 310)"/><use href="#ka-pod" transform="matrix(.18 -.04 0 .32 1250 310)"/></g>
    <g opacity=".47"><use href="#ka-pod" transform="matrix(.34 .08 0 .56 1030 273)"/><use href="#ka-pod" transform="matrix(.33 -.08 0 .56 1320 275)"/></g>
    <ellipse cx="1190" cy="406" rx="285" ry="230" fill="url(#ka-haze)"/>
  </g>
  <g class="ka-plane ka-middle">
    <use href="#ka-pod" transform="matrix(.59 .13 0 .94 904 225)"/>
    <use href="#ka-pod" transform="matrix(.86 .21 0 1.39 743 135)"/>
    <path d="M770 136q-33 117-11 265t-27 233m33-490q-23 129-7 247" fill="none" stroke="#030d15" stroke-width="9"/>
    <path d="m781 689 117-43 42 26-127 54Z" fill="#0b202b" stroke="#456370" stroke-width="2"/>
    <path d="m769 688 13-30m-5 31 13-29" stroke="#456370" stroke-width="2"/>
    <g fill="#9ac0cc" opacity=".5" font-family="Barlow Condensed,sans-serif" font-size="10" letter-spacing="2"><text x="761" y="665" transform="rotate(14 761 665)">08 / PASSENGER</text></g>
  </g>
  <!-- The body stays behind the right pod. Only the reaching joints and wet edge explain its scale. -->
  <g class="ka-plane ka-threat" stroke-linecap="round" stroke-linejoin="round">
    <path d="M1504 230q-43-58-63-21l-20 53-18 44 20 57 38 31 41 99 43 25 32-102-22-84-8-72Z" fill="#040d15" stroke="#01080f" stroke-width="8"/>
    <path d="M1435 245q-26-25-39-52l-15-65-23-27 10 45q-4 51 7 71l32 62m73 67q-43 1-70 27l-43 80-31 17 26 2q29-12 39-33l43-47 42-3m-29 75-38 58q-1 33 21 87l-26 60 45-49-2-80 46-45" fill="#091922" stroke="#020a11" stroke-width="7"/>
    <path d="M1424 250q-26-25-35-45l-13-57m65 222q-27-3-40 5l-35 66m78 12-33 52 12 63" fill="none" stroke="#42616b" stroke-opacity=".2" stroke-width="2"/>
    <path d="M1424 272q-12 8-24 5l-32-24-15-40-12-8 6 20 4 49q17 24 42 34l35-11" fill="#07151f" stroke="#020b13" stroke-width="7"/>
    <path d="m1355 229 8 30 32 30 26-4m-59-87-8 7m6 0-6 7" fill="none" stroke="#62838a" stroke-opacity=".53" stroke-width="1.5"/>
    <ellipse cx="1408" cy="169" rx="115" ry="142" fill="url(#ka-pod-shadow)"/>
    <path d="m1387 209 4 10m10 16 4 5m-35 25 7 7m35 106-8 5" fill="none" stroke="#8caaa8" stroke-opacity=".4" stroke-width="1"/>
    <path d="m1428 314 31-19 29 9-9 30-24 16-26-12Z" fill="#020a11"/>
    <path d="M1430 307q4-13 17-18m21 19 6 10m-52 40-8 5m-40 57-3 9" fill="none" stroke="#96bdb5" stroke-opacity=".46" stroke-width="1"/>
    <path d="m1434 338 5 7 16 4m18-13 8-9m-34-40 9-14" fill="none" stroke="#759995" stroke-opacity=".48" stroke-width="1.4"/>
    <path d="m1444 347 3 18-2 16" fill="none" stroke="#83b585" stroke-opacity=".72" stroke-width="1.5"/><path d="M1445 378q-5 9 0 11 4-2 0-11" fill="#b1dac1"/>
    <g class="ka-eyes ka-eyes-main" fill="#c5eddf"><path d="m1435 317 5-2 3 2-1 2-6 1Zm12-6 7-2 4 2-2 3-7 1Zm15 6 3-3 4 1-1 3-5 1Zm-16 6 3-1 1 2-3 2Z"/></g>
    <g class="ka-eyes ka-eyes-deep" fill="#89b3ae" opacity=".6"><path d="m1277 361 3-1 2 1-1 2h-3m8-5h4l-1 2h-3M1344 328l3-1 2 2-4 1m9-4h3v2h-3M1213 351h2v1h-2m5-2h2v1h-2"/></g>
    <use href="#ka-pod" transform="matrix(.66 -.18 0 1.12 1466 181)"/>
    <path d="m1472 262-12-4-12 8-3 18 7 8 7-13 13-1m-10-18-4 13m7-10-1 11" fill="#081b24" stroke="#020b12" stroke-width="3"/>
    <path d="m1451 269 3-5 7 1m-12 12 4-6" fill="none" stroke="#64888b" stroke-width="1.4"/>
  </g>
  <g class="ka-emergency">
    <ellipse cx="1080" cy="280" rx="365" ry="390" fill="url(#ka-warm)"/>
    <path d="m1046 78 42 3 234 678-520-52Z" fill="url(#ka-shaft)"/>
    <path d="m1042 78 50 4 257 683-570-58Z" fill="url(#ka-shaft)" opacity=".28"/><path d="m1055 79 10 2 118 507-30-14Z" fill="#ffd1a0" opacity=".035"/>
    <path d="m1027 51 10-17 73 5 14 18-3 28-90-7Z" fill="#08131d" stroke="#49616b" stroke-width="2"/>
    <path d="m1040 56 67 5-2 10-66-5Z" fill="#e38555"/><path d="m1044 58 55 4" stroke="#ffd6a8" stroke-width="2"/>
    <path d="m1074 37 6-37" stroke="#020b13" stroke-width="9"/>
  </g>
  <ellipse cx="1353" cy="568" rx="290" ry="230" fill="url(#ka-haze)" opacity=".65"/>
  <ellipse cx="1122" cy="841" rx="176" ry="22" fill="#01090f" opacity=".8"/>
  <g class="ka-plane ka-marine"><g class="ka-marine-reveal" stroke="#030d17" stroke-linejoin="round" stroke-width="5">
    <!-- 7.5-head gesture: rear hip/ankle carries weight; shoulder and pelvis oppose. -->
    <path d="M1102 572q39-8 58 3l44 83 44 121 32 18 2 28-65 2-18-27-45-85q-32-31-63-51Z" fill="#203949"/>
    <path d="M1140 608q27 0 45 13l22 54-26 22-31-9-34-67Z" fill="#496574" stroke="#294656" stroke-width="2.5"/>
    <path d="m1216 789 35-13 23 22 22 12-1 15-76 1-17-13Z" fill="#152b3b"/><path d="m1220 794 29-7 13 15 25 10-57 2Z" fill="#57717b" stroke-width="2"/>
    <path d="M1057 564q34 3 64 23l-15 73-68 57 10 91 8 29-23 17-64-5-5-22 42-20-19-94q5-40 36-83Z" fill="#314e60"/>
    <path d="M1027 622q35 1 65 13l-12 30-54 42-27-13 10-29Z" fill="url(#ka-armor)" stroke="#294656" stroke-width="2.5"/>
    <path d="m1003 722 25-3 11 21 5 68-30 2Z" fill="#66808b" stroke="#294656" stroke-width="2.5"/><path d="m1010 736 13-3 9 62-13 2Z" fill="#365565" stroke="none"/>
    <path d="m1014 810 23 3 16 24-21 11-52-3-2-12Z" fill="#243d4d"/><path d="m1007 824 25-3 10 13-13 6-39-2Z" fill="#72858c" stroke-width="2"/>
    <path d="m998 705 26-10 14 18-9 19-27-4-10-13Z" fill="#6b8793" stroke-width="3"/><path d="m1182 676 24 14-1 22-25 8-19-20Z" fill="#284b61" stroke-width="3"/><path d="m1194 718 29 66-14 5-32-63Z" fill="#557687" stroke="#294656" stroke-width="2.5"/>
    <path d="m1056 562 61-17 49 34-17 45-49 14-57-34Z" fill="#182e3f"/><path d="m1058 569 56-10 40 25-8 22-39 11-51-23Z" fill="#486574" stroke="#294656" stroke-width="2.5"/>
    <!-- Large chest, single abdominal mass, oblique collar: the turn reads before seams. -->
    <path d="M1086 366q42-14 71-12l52 31 4 65-57 117-46 25-74-32q-32-48-18-86l25-56Z" fill="#112837"/>
    <path d="m1078 382 67-16 49 28-20 88-62 57-65-29-3-69Z" fill="url(#ka-armor)"/>
    <path d="M1062 403q33-17 72-21l44 20-16 49q-29 22-59 31l-52-21-4-34Z" fill="url(#ka-armor)" stroke="#294656" stroke-width="2.5"/>
    <path d="M1103 482q29-9 59-31l-11 40-39 38-53-21-8-31Z" fill="#263f51" stroke="#294656" stroke-width="2.5"/>
    <path d="M1065 513q28 9 54 18l27-13-10 42-26 18-56-20Z" fill="#39566a" stroke="#294656" stroke-width="2.5"/>
    <path d="m1099 386 11-4 11 140-11 7Z" fill="#142d3e" stroke-width="2"/>
    <path d="m1090 436 18-5 4 16-18 5Z" fill="var(--suit-accent)" stroke="none" opacity=".8"/>
    <path d="m1061 408 20-6m-26 12 9-3m86-12 13 6m-45 131 15-7" fill="none" stroke="#bad0d3" stroke-opacity=".65" stroke-width="1.5"/>
    <path d="m1143 399 47-17-9 27-36 19-27 63-7-8Z" fill="#061725" stroke="none" opacity=".32"/>
    <path d="M1054 404q12-6 26-8l-10 23-7 31-9 5-6-20Z" fill="#b48a6e" stroke="none" opacity=".35"/>
    <path d="m1170 374 24 14-4 20-7-8-13-10Z" fill="#81aeb9" stroke="none" opacity=".6"/>
    <path d="m1169 409-14 49-27 25 8-16 17-45Z" fill="#6e96a3" stroke="none" opacity=".7"/>
    <path d="M1041 423q-17 39-14 68l12 29 5-56 17-45Z" fill="#9f7961" stroke="none" opacity=".32"/>
    <path d="m1107 551 23-7-8 30-21 9-39-18-2-16Z" fill="#162f40" stroke-width="3"/>
    <path d="m1061 549 12 5-5 19-11-5m30-3 12 5-5 18-11-5" fill="#78929c" stroke-width="2"/>
    <path d="m1056 410 35-12m-40 25 18-6m-10 128 22 8m-39 98-16 23m-18 68 3 29m170-54 16 9" fill="none" stroke="#bad0cf" stroke-opacity=".62" stroke-width="1.4"/>
    <!-- Far arm, short in perspective. Elbow/wrist continue into the support palm. -->
    <path d="m1182 372 29 9 28 53 17 10 52-54 24 17-59 74-38 2-47-55Z" fill="#294a5b"/>
    <path d="m1195 392 12 4 26 45-16 12-26-33Z" fill="#5f7f8d" stroke="#294656" stroke-width="2.5"/>
    <path d="m1253 452 48-48 15 13-47 48-17 1Z" fill="url(#ka-forearm)" stroke="#294656" stroke-width="2.5"/>
    <!-- Rifle stock is embedded in the far shoulder, not floating against the chest. -->
    <path d="m1177 372 38-8 12 7 89-14 15-10 52-6 7 11 32-4 3 18-35 7-10 16-67 7-25 8-45 1-11-8-25 4-13 27-16-6 9-30-30 4Z" fill="#152d3f"/>
    <path d="m1213 366 100-15 14-8 56-7 6 14-68 12-97 17Z" fill="#829ca5" stroke="#294656" stroke-width="2.5"/>
    <path d="m1260 372 65-10 3 19-66 13Z" fill="#34576b" stroke-width="2"/>
    <path d="m1336 351 40-6 2 21-42 10Z" fill="#54737e" stroke-width="2"/>
    <path d="m1389 351 26-4 2 14-26 5Z" fill="#102a3c" stroke-width="2"/>
    <path d="m1214 380 24-3 8 16-16 13-11-7Z" fill="#0a2031" stroke-width="2"/>
    <path d="m1276 393 7 24 25-5-4-24" fill="#203e51" stroke-width="3"/>
    <path d="m1254 350-2-12 24-4 6 13" fill="#142f43" stroke-width="3"/>
    <path d="m1240 363 11-2m8-1 10-2m9-1 10-2m9-1 9-2" stroke="#233d4c" stroke-width="2"/>
    <path d="m1281 376 25-4" stroke="var(--suit-accent)" stroke-width="2"/>
    <path d="m1413 349 3 12" stroke="#bcdfeb" stroke-width="1.5"/>
    <!-- Support fingers wrap the underside of the handguard; thumb rests at its far edge. -->
    <path d="m1303 398-1-15 9-9 7 3 3 11 10-5 4 7-15 18-12-2Z" fill="#294657" stroke-width="3"/>
    <path d="m1308 391 4 8m1-14 5 10m3-12 4 8" fill="none" stroke="#92b0b8" stroke-width="1.5"/>
    <!-- Near arm forms an open triangle. Trigger hand meets grip, index extends to trigger. -->
    <path d="m1070 382 34 13 13 39 19 30 72-56 22 20-75 69-33 6-44-45-22-43Z" fill="#34566a"/>
    <path d="m1086 415 15 9 25 47 14 10-17 10-28-29Z" fill="url(#ka-forearm)" stroke="#294656" stroke-width="2.5"/>
    <path d="m1141 469 62-48 15 16-62 49-15-2Z" fill="url(#ka-armor)" stroke="#294656" stroke-width="2.5"/>
    <path d="m1202 417 11-19 3-16 9-3 9 6-5 9 5 7-9 22-13 5Z" fill="#294959" stroke-width="3"/>
    <path d="m1225 385 14-1 4 5-17 4m-10 8 8 4m-12 2 9 4" fill="none" stroke="#94b0b7" stroke-width="1.5"/>
    <!-- One pauldron, one quiet service band. -->
    <path d="m1054 382 33-11 28 23-9 39-37 9-25-25Z" fill="url(#ka-armor)"/>
    <path d="m1055 386 31-8 17 15-4 12-43 12-7-12Z" fill="#a39b86" stroke="#294656" stroke-width="2.5"/>
    <path d="m1060 394 28-7" stroke="var(--suit-accent)" stroke-width="4"/>
    <path d="m1051 400 8-12 28-9 15 12" fill="none" stroke="#d2af89" stroke-width="1.8"/>
    <!-- Helmet shell is 78px over a 548px figure; the skull beneath it is ~73px (7.5 heads). -->
    <g transform="translate(1185 140) scale(.85 .68) translate(-1185 0)">
    <path d="m1133 281 13-29 39-13 34 17 20 33-3 29-24 26-45 10-30-24-11-26Z" fill="url(#ka-helmet)"/>
    <path d="m1138 281 14-24 30-10 30 15 14 22-37-9-37 18Z" fill="url(#ka-helmet)" stroke="#294656" stroke-width="2.5"/>
    <path d="M1144 278l11-20 26-9 17 8-34 8-14 18Z" fill="#d2a27a" stroke="none" opacity=".5"/>
    <path d="m1132 298 17-11 42-6 35 10 8 13-29 13-43 6-26-11Z" fill="#0b2435" stroke-width="3"/>
    <path class="ka-visor" d="m1177 288 39 6 13 9-26 9-35 3Z" fill="url(#ka-visor)" stroke="#a4dbe5" stroke-width="1.5"/>
    <path d="m1171 321 34-3 22-8-11 24-30 12-26-8Z" fill="#4e7084" stroke="#294656" stroke-width="2.5"/>
    <path d="m1136 304 15-5 9 19-9 9-11-7Z" fill="#2d4e60" stroke="#294656" stroke-width="2.5"/>
    <path d="m1156 341 29 12 26-9-5 20-30 14-33-14Z" fill="#29495b" stroke-width="3"/>
    <path d="m1150 350 26 13 28-12m-29 18 25-11" fill="none" stroke="#9bbac0" stroke-opacity=".6" stroke-width="1.5"/>
    <path d="m1216 281 13 16-2 12" fill="none" stroke="#c0e3e6" stroke-opacity=".7" stroke-width="1.5"/>
    <path d="m1140 278 15-20 26-9 27 12m-77 33-1 11m100-14 5 11-5 12m-42 28 24-9" fill="none" stroke="#c1dde0" stroke-width="1.5"/>
    </g>
    <path d="m1084 394 7-2m-21 22 4-1m79 56 9-7m-32-90 5-1" fill="none" stroke="#c6d8d5" stroke-opacity=".55" stroke-width=".8"/>
    <path d="m1085 398 9 2m-28 166 24 10m-49 79-10 11" stroke="#d0a886" stroke-width="1.5"/>
  </g><ellipse cx="1199" cy="345" rx="30" ry="24" fill="url(#ka-friendly)"/></g>
  <g class="ka-haze"><ellipse cx="1295" cy="747" rx="450" ry="118" fill="url(#ka-haze)"/><path d="M800 702q190-42 410 4t390-18v35q-250-4-390-5t-410 14Z" fill="#a1d9df" opacity=".035"/></g>
  <g class="ka-plane ka-front"><use href="#ka-pod" transform="matrix(1.35 -.27 0 2.36 1552 -80)"/>
    <path d="M1595 0q-83 146-36 312t-12 352q-30 87 53 167" fill="none" stroke="#01090f" stroke-width="19"/><path d="M1591 0q-82 146-35 312t-12 352" fill="none" stroke="#486371" stroke-width="2"/>
  </g>
  <g class="ka-frost" fill="#b9e6ee">${Array.from({length:24}, (_, i) => `<path opacity="${.1 + i % 4 * .06}" d="m${780 + (i * 137 % 770)} ${95 + (i * 193 % 690)} 1-1 1 2-1 1Z"/>`).join('')}</g>
  <rect width="1600" height="900" fill="url(#ka-bottom)"/><rect width="1600" height="900" fill="url(#ka-left)"/>
  <!-- Capture-only anatomy evidence. Hidden unless the harness explicitly reveals this SVG group. -->
  <g data-key-art-scaffold="true" style="display:none" fill="none" stroke="#ffdf75" stroke-width="2" font-family="monospace" font-size="12">
    <path d="M1182 302v73m-40 13 58 23M1078 402l112-18M1066 574l75 22M1169 351l-55 89-7 146M1078 402l52 81 91-77M1190 384l56 78 67-69M1074 587l-62 123 16 114M1137 594l53 106 52 98M1200 345l213-14M1179 377l234-26"/>
    <g fill="#ffdf75" stroke="#06202d"><circle cx="1182" cy="344" r="6"/><circle cx="1078" cy="402" r="6"/><circle cx="1190" cy="384" r="6"/><circle cx="1130" cy="483" r="6"/><circle cx="1246" cy="462" r="6"/><circle cx="1221" cy="406" r="6"/><circle cx="1313" cy="393" r="6"/><circle cx="1074" cy="587" r="6"/><circle cx="1137" cy="594" r="6"/><circle cx="1012" cy="710" r="6"/><circle cx="1190" cy="700" r="6"/><circle cx="1028" cy="824" r="6"/><circle cx="1242" cy="798" r="6"/></g>
    <g fill="#ffdf75" stroke="none"><text x="980" y="227">7.5 HEADS / OPPOSED AXES</text><text x="1208" y="341">CHEEK / STOCK</text><text x="1227" y="437">GRIP</text><text x="1320" y="421">SUPPORT</text><text x="924" y="877">LOAD → REAR FOOT</text></g>
    <path d="M967 302v548m-8-548h16m-16 73h16m-16 73h16m-16 73h16m-16 73h16m-16 73h16m-16 73h16m-16 73h16m-16 37h16M1190 350 655-85m535 435 440-435m-440 435-535 660m535-660 440 660" stroke-dasharray="5 5" stroke-opacity=".5"/>
  </g>
  </svg></div>`;
}
