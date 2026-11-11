# S2 audio measurements

Raw recipe metrics and actual rendered stereo output are both included. Output master=1 includes .85 headroom, compressor and waveshaper. Fight bus taps include bus/category gains and actual music/ambience ducking, before shared reverb/master; final master is the actual limited destination.

No acoustic listening claim. WAVs are 24 kHz, signed 16-bit PCM; metrics use the unquantized OfflineAudioContext output. Centroid uses a Hann-windowed 1024-point FFT, 512-sample hop, averaged power. Spectrograms use logarithmic frequency 40–12000 Hz and −90…−25 dBFS bin-power mapping.

## Initialization

```json
{
  "constructorMs": 0,
  "unlockWithoutSamplesMs": 0.8999999761581421,
  "liveUnlocked": true,
  "liveUnlockWithoutSamplesMs": 175,
  "offlineContextCreationMs": 0,
  "warmMs": 7447.899999976158,
  "warmTaskMaxMs": 0.20000004768371582,
  "warmTaskP95Ms": 0.10000002384185791,
  "synchronousSynthesisCalls": 0,
  "workerPcmCopies": 240,
  "workerPcmCopyMaxMs": 0.20000004768371582,
  "timerMaxDelayMs": 2.799999952316284,
  "diagnostics": {
    "voices": 0,
    "loops": 0,
    "buffers": 240,
    "admitted": 0,
    "rejected": 0,
    "highWater": 0,
    "warmed": 240
  },
  "note": "Main-thread wall time around synchronous buffer preparation and transferred-PCM copies, plus a 16ms responsiveness timer. Worker CPU time is excluded. Headless browser measurements are not a hardware frame-time certification."
}
```

## Cue inventory

| Cue | Duration s | Peak | RMS | Centroid Hz | DC |
|---|---:|---:|---:|---:|---:|
| [weapon:pistol](weapon-pistol.png) | 0.2800 | 0.1347 | 0.0274 | 273 | -1.87e-4 |
| [weapon:rifle](weapon-rifle.png) | 0.1900 | 0.1307 | 0.0222 | 665 | 1.61e-5 |
| [weapon:shotgun](weapon-shotgun.png) | 0.5200 | 0.2305 | 0.0508 | 218 | -4.56e-4 |
| [weapon:plasma](weapon-plasma.png) | 0.4300 | 0.2033 | 0.0376 | 1049 | -1.54e-4 |
| [weapon:rocket](weapon-rocket.png) | 0.7500 | 0.3805 | 0.0591 | 1796 | 4.43e-5 |
| [impact:flesh](impact-flesh.png) | 0.1600 | 0.1041 | 0.0219 | 310 | -8.23e-6 |
| [impact:armor](impact-armor.png) | 0.1900 | 0.0707 | 0.0106 | 1819 | -7.96e-7 |
| [impact:blocked](impact-blocked.png) | 0.1050 | 0.0530 | 0.0060 | 394 | -7.35e-5 |
| [impact:kill](impact-kill.png) | 0.2500 | 0.1488 | 0.0294 | 437 | -3.71e-4 |
| [impact:body](impact-body.png) | 0.3200 | 0.1228 | 0.0339 | 120 | -1.30e-4 |
| [impact:wall](impact-wall.png) | 0.4600 | 0.1842 | 0.0337 | 281 | -1.13e-4 |
| [impact:small-explosion](impact-small-explosion.png) | 0.4800 | 0.1602 | 0.0346 | 265 | -4.04e-5 |
| [impact:explosion](impact-explosion.png) | 0.9500 | 0.2428 | 0.0539 | 216 | -1.03e-4 |
| [impact:large-explosion](impact-large-explosion.png) | 1.4000 | 0.2868 | 0.0589 | 198 | -1.72e-4 |
| [impact:reload](impact-reload.png) | 0.2200 | 0.2016 | 0.0224 | 2562 | 2.65e-4 |
| [impact:shell](impact-shell.png) | 0.1700 | 0.1123 | 0.0090 | 4475 | -3.75e-4 |
| [impact:hurt](impact-hurt.png) | 0.3400 | 0.1648 | 0.0354 | 220 | -7.35e-4 |
| [impact:grenade](impact-grenade.png) | 0.2900 | 0.2170 | 0.0306 | 2307 | 3.68e-5 |
| [impact:switch](impact-switch.png) | 0.1800 | 0.1108 | 0.0118 | 1113 | 2.99e-5 |
| [enemy:crawler:warning](enemy-crawler-warning.png) | 0.3200 | 0.1514 | 0.0440 | 798 | -1.32e-3 |
| [enemy:crawler-elite:warning](enemy-crawler-elite-warning.png) | 0.3200 | 0.1649 | 0.0441 | 687 | -1.49e-3 |
| [enemy:crawler:attack](enemy-crawler-attack.png) | 0.2700 | 0.1687 | 0.0318 | 786 | -2.95e-3 |
| [enemy:crawler-elite:attack](enemy-crawler-elite-attack.png) | 0.2700 | 0.1756 | 0.0325 | 720 | -2.95e-3 |
| [enemy:crawler:death](enemy-crawler-death.png) | 0.3375 | 0.1902 | 0.0357 | 796 | -2.87e-3 |
| [enemy:crawler-elite:death](enemy-crawler-elite-death.png) | 0.3375 | 0.1971 | 0.0365 | 709 | -3.15e-3 |
| [enemy:brute:warning](enemy-brute-warning.png) | 0.8500 | 0.1773 | 0.0541 | 101 | -3.14e-4 |
| [enemy:brute-elite:warning](enemy-brute-elite-warning.png) | 0.8500 | 0.1679 | 0.0545 | 86 | -1.82e-4 |
| [enemy:brute:attack](enemy-brute-attack.png) | 0.6500 | 0.2754 | 0.0485 | 101 | 1.09e-4 |
| [enemy:brute-elite:attack](enemy-brute-elite-attack.png) | 0.6500 | 0.2537 | 0.0490 | 97 | 1.97e-4 |
| [enemy:brute:death](enemy-brute-death.png) | 0.8125 | 0.2560 | 0.0521 | 127 | 1.00e-4 |
| [enemy:brute-elite:death](enemy-brute-elite-death.png) | 0.8125 | 0.2707 | 0.0525 | 121 | 3.90e-5 |
| [enemy:spitter:warning](enemy-spitter-warning.png) | 0.5000 | 0.1699 | 0.0491 | 386 | -1.68e-3 |
| [enemy:spitter-elite:warning](enemy-spitter-elite-warning.png) | 0.5000 | 0.1758 | 0.0494 | 332 | -1.14e-3 |
| [enemy:spitter:attack](enemy-spitter-attack.png) | 0.4300 | 0.3186 | 0.0453 | 1406 | -2.36e-3 |
| [enemy:spitter-elite:attack](enemy-spitter-elite-attack.png) | 0.4300 | 0.2622 | 0.0457 | 1371 | -1.92e-3 |
| [enemy:spitter:death](enemy-spitter-death.png) | 0.5375 | 0.2605 | 0.0468 | 384 | -2.52e-3 |
| [enemy:spitter-elite:death](enemy-spitter-elite-death.png) | 0.5375 | 0.2575 | 0.0472 | 346 | -2.04e-3 |
| [enemy:stalker:warning](enemy-stalker-warning.png) | 0.4000 | 0.1581 | 0.0470 | 1190 | -1.37e-4 |
| [enemy:stalker-elite:warning](enemy-stalker-elite-warning.png) | 0.4000 | 0.1493 | 0.0469 | 1043 | -3.92e-4 |
| [enemy:stalker:attack](enemy-stalker-attack.png) | 0.3500 | 0.2021 | 0.0358 | 1334 | -8.59e-4 |
| [enemy:stalker-elite:attack](enemy-stalker-elite-attack.png) | 0.3500 | 0.1920 | 0.0357 | 1239 | -1.05e-3 |
| [enemy:stalker:death](enemy-stalker-death.png) | 0.4375 | 0.2526 | 0.0395 | 1292 | -7.29e-4 |
| [enemy:stalker-elite:death](enemy-stalker-elite-death.png) | 0.4375 | 0.2268 | 0.0400 | 1225 | -9.15e-4 |
| [enemy:carrier:warning](enemy-carrier-warning.png) | 0.5500 | 0.1651 | 0.0501 | 250 | -2.29e-4 |
| [enemy:carrier-elite:warning](enemy-carrier-elite-warning.png) | 0.5500 | 0.1626 | 0.0498 | 224 | -1.79e-4 |
| [enemy:carrier:attack](enemy-carrier-attack.png) | 0.5900 | 0.2288 | 0.0467 | 255 | -4.44e-4 |
| [enemy:carrier-elite:attack](enemy-carrier-elite-attack.png) | 0.5900 | 0.2323 | 0.0471 | 235 | -3.76e-4 |
| [enemy:carrier:death](enemy-carrier-death.png) | 0.7375 | 0.2583 | 0.0499 | 278 | -4.74e-4 |
| [enemy:carrier-elite:death](enemy-carrier-elite-death.png) | 0.7375 | 0.2542 | 0.0495 | 260 | -3.97e-4 |
| [enemy:champion:warning](enemy-champion-warning.png) | 0.8500 | 0.2372 | 0.0729 | 120 | -1.16e-4 |
| [enemy:champion:attack](enemy-champion-attack.png) | 0.9000 | 0.3363 | 0.0643 | 143 | 4.23e-5 |
| [enemy:champion:death](enemy-champion-death.png) | 1.1250 | 0.3642 | 0.0675 | 159 | -7.60e-6 |
| [enemy:warden:warning](enemy-warden-warning.png) | 0.8500 | 0.2319 | 0.0727 | 103 | -3.64e-4 |
| [enemy:warden:attack](enemy-warden-attack.png) | 0.8300 | 0.3220 | 0.0629 | 115 | 6.68e-5 |
| [enemy:warden:death](enemy-warden-death.png) | 1.0375 | 0.3569 | 0.0663 | 135 | -1.67e-4 |
| [enemy:matron:warning](enemy-matron-warning.png) | 0.8500 | 0.2464 | 0.0719 | 249 | 8.79e-5 |
| [enemy:matron:attack](enemy-matron-attack.png) | 0.9500 | 0.3405 | 0.0649 | 264 | -5.26e-5 |
| [enemy:matron:death](enemy-matron-death.png) | 1.1875 | 0.3150 | 0.0673 | 264 | -1.99e-5 |
| [enemy:queen:warning](enemy-queen-warning.png) | 0.8000 | 0.2320 | 0.0704 | 211 | 2.88e-4 |
| [enemy:queen:attack](enemy-queen-attack.png) | 1.1000 | 0.3471 | 0.0629 | 274 | -1.70e-4 |
| [enemy:queen:death](enemy-queen-death.png) | 1.3750 | 0.3802 | 0.0658 | 294 | -1.95e-4 |
| [enemy:queen-phase-2:warning](enemy-queen-phase-2-warning.png) | 0.8000 | 0.2374 | 0.0699 | 261 | 2.90e-4 |
| [enemy:queen-phase-2:attack](enemy-queen-phase-2-attack.png) | 1.1500 | 0.3619 | 0.0622 | 346 | -1.87e-4 |
| [enemy:queen-phase-2:death](enemy-queen-phase-2-death.png) | 1.4375 | 0.4100 | 0.0655 | 353 | -2.22e-4 |
| [enemy:queen-phase-3:warning](enemy-queen-phase-3-warning.png) | 0.8000 | 0.2425 | 0.0712 | 358 | 3.60e-4 |
| [enemy:queen-phase-3:attack](enemy-queen-phase-3-attack.png) | 1.2000 | 0.3847 | 0.0663 | 466 | 1.41e-4 |
| [enemy:queen-phase-3:death](enemy-queen-phase-3-death.png) | 1.5000 | 0.4018 | 0.0687 | 490 | 1.37e-4 |
| [ability:ram:cast](ability-ram-cast.png) | 0.1800 | 0.1488 | 0.0333 | 2885 | -4.60e-5 |
| [ability:ram:impact](ability-ram-impact.png) | 0.3000 | 0.1751 | 0.0338 | 170 | 1.23e-4 |
| [ability:ram:tick](ability-ram-tick.png) | 0.2400 | 0.1578 | 0.0154 | 2031 | -2.01e-3 |
| [ability:ram:end](ability-ram-end.png) | 0.3000 | 0.1406 | 0.0192 | 1971 | -1.62e-3 |
| [ability:ram:burst](ability-ram-burst.png) | 0.3000 | 0.1562 | 0.0171 | 2100 | 9.48e-4 |
| [ability:ram:link](ability-ram-link.png) | 0.2400 | 0.1416 | 0.0139 | 2249 | 8.77e-4 |
| [ability:ram:dash-start](ability-ram-dash-start.png) | 0.1800 | 0.1523 | 0.0329 | 2645 | -3.11e-4 |
| [ability:ram:dash-end](ability-ram-dash-end.png) | 0.3000 | 0.1616 | 0.0188 | 1869 | 1.05e-3 |
| [ability:seismic-slam:cast](ability-seismic-slam-cast.png) | 0.2200 | 0.2122 | 0.0395 | 682 | 5.60e-5 |
| [ability:seismic-slam:impact](ability-seismic-slam-impact.png) | 0.9200 | 0.2875 | 0.0541 | 298 | -9.03e-5 |
| [ability:seismic-slam:tick](ability-seismic-slam-tick.png) | 0.2400 | 0.0802 | 0.0157 | 157 | -5.97e-4 |
| [ability:seismic-slam:end](ability-seismic-slam-end.png) | 0.6200 | 0.2477 | 0.0375 | 585 | -2.06e-4 |
| [ability:seismic-slam:burst](ability-seismic-slam-burst.png) | 0.6200 | 0.2595 | 0.0384 | 574 | -3.66e-5 |
| [ability:seismic-slam:link](ability-seismic-slam-link.png) | 0.2400 | 0.0847 | 0.0161 | 158 | -5.10e-4 |
| [ability:seismic-slam:dash-start](ability-seismic-slam-dash-start.png) | 0.2200 | 0.2004 | 0.0395 | 653 | -1.00e-4 |
| [ability:seismic-slam:dash-end](ability-seismic-slam-dash-end.png) | 0.6200 | 0.2450 | 0.0366 | 564 | -1.22e-4 |
| [ability:bulwark:cast](ability-bulwark-cast.png) | 0.1800 | 0.1280 | 0.0306 | 469 | 2.08e-6 |
| [ability:bulwark:impact](ability-bulwark-impact.png) | 0.5400 | 0.2817 | 0.0439 | 381 | -1.23e-3 |
| [ability:bulwark:tick](ability-bulwark-tick.png) | 0.2400 | 0.1195 | 0.0170 | 575 | 2.97e-3 |
| [ability:bulwark:end](ability-bulwark-end.png) | 0.5400 | 0.2174 | 0.0420 | 427 | -4.25e-5 |
| [ability:bulwark:burst](ability-bulwark-burst.png) | 0.5400 | 0.2336 | 0.0426 | 437 | -1.60e-4 |
| [ability:bulwark:link](ability-bulwark-link.png) | 0.2400 | 0.1367 | 0.0167 | 593 | -2.70e-3 |
| [ability:bulwark:dash-start](ability-bulwark-dash-start.png) | 0.1800 | 0.1273 | 0.0304 | 465 | -2.62e-5 |
| [ability:bulwark:dash-end](ability-bulwark-dash-end.png) | 0.5400 | 0.2304 | 0.0423 | 432 | -3.56e-4 |
| [ability:railbreaker:cast](ability-railbreaker-cast.png) | 0.6000 | 0.1534 | 0.0478 | 1145 | -1.28e-5 |
| [ability:railbreaker:impact](ability-railbreaker-impact.png) | 1.5800 | 0.4696 | 0.0859 | 172 | -2.79e-5 |
| [ability:railbreaker:tick](ability-railbreaker-tick.png) | 0.2400 | 0.0846 | 0.0168 | 175 | -8.52e-5 |
| [ability:railbreaker:end](ability-railbreaker-end.png) | 0.6200 | 0.2738 | 0.0405 | 1691 | 1.06e-4 |
| [ability:railbreaker:burst](ability-railbreaker-burst.png) | 0.6200 | 0.2434 | 0.0367 | 1690 | -1.79e-4 |
| [ability:railbreaker:link](ability-railbreaker-link.png) | 0.2400 | 0.0851 | 0.0168 | 174 | -1.38e-4 |
| [ability:railbreaker:dash-start](ability-railbreaker-dash-start.png) | 0.6000 | 0.1528 | 0.0478 | 1159 | -9.34e-6 |
| [ability:railbreaker:dash-end](ability-railbreaker-dash-end.png) | 0.6200 | 0.2574 | 0.0404 | 1653 | 1.09e-4 |
| [ability:frost-trail:cast](ability-frost-trail-cast.png) | 0.1800 | 0.1532 | 0.0328 | 3965 | -5.90e-7 |
| [ability:frost-trail:impact](ability-frost-trail-impact.png) | 0.4800 | 0.3161 | 0.0490 | 3624 | -8.20e-5 |
| [ability:frost-trail:tick](ability-frost-trail-tick.png) | 0.2400 | 0.1246 | 0.0180 | 5543 | 3.63e-3 |
| [ability:frost-trail:end](ability-frost-trail-end.png) | 0.4800 | 0.1513 | 0.0267 | 6603 | 4.09e-3 |
| [ability:frost-trail:burst](ability-frost-trail-burst.png) | 0.4800 | 0.1497 | 0.0260 | 6076 | -4.77e-3 |
| [ability:frost-trail:link](ability-frost-trail-link.png) | 0.2400 | 0.1158 | 0.0179 | 6944 | -2.05e-3 |
| [ability:frost-trail:dash-start](ability-frost-trail-dash-start.png) | 0.1800 | 0.1540 | 0.0328 | 3945 | 1.86e-7 |
| [ability:frost-trail:dash-end](ability-frost-trail-dash-end.png) | 0.4800 | 0.1651 | 0.0261 | 7011 | -1.53e-3 |
| [ability:cryo-nova:cast](ability-cryo-nova-cast.png) | 0.1800 | 0.1768 | 0.0346 | 5594 | -5.89e-8 |
| [ability:cryo-nova:impact](ability-cryo-nova-impact.png) | 0.7200 | 0.3147 | 0.0482 | 5974 | 3.03e-4 |
| [ability:cryo-nova:tick](ability-cryo-nova-tick.png) | 0.2400 | 0.1371 | 0.0181 | 4604 | -1.98e-4 |
| [ability:cryo-nova:end](ability-cryo-nova-end.png) | 0.6200 | 0.2650 | 0.0388 | 4889 | 4.95e-4 |
| [ability:cryo-nova:burst](ability-cryo-nova-burst.png) | 0.6200 | 0.2813 | 0.0389 | 4743 | -1.28e-3 |
| [ability:cryo-nova:link](ability-cryo-nova-link.png) | 0.2400 | 0.1466 | 0.0182 | 4566 | -3.91e-4 |
| [ability:cryo-nova:dash-start](ability-cryo-nova-dash-start.png) | 0.1800 | 0.1712 | 0.0345 | 5339 | 7.96e-8 |
| [ability:cryo-nova:dash-end](ability-cryo-nova-dash-end.png) | 0.6200 | 0.2683 | 0.0387 | 4743 | -1.02e-3 |
| [ability:glacier:cast](ability-glacier-cast.png) | 0.1500 | 0.1743 | 0.0313 | 906 | 2.46e-4 |
| [ability:glacier:impact](ability-glacier-impact.png) | 1.0500 | 0.5001 | 0.0719 | 1180 | 8.13e-4 |
| [ability:glacier:tick](ability-glacier-tick.png) | 0.2400 | 0.1069 | 0.0166 | 1355 | -1.76e-4 |
| [ability:glacier:end](ability-glacier-end.png) | 0.6200 | 0.2586 | 0.0320 | 3593 | 7.74e-4 |
| [ability:glacier:burst](ability-glacier-burst.png) | 0.6200 | 0.2389 | 0.0319 | 3609 | -2.11e-4 |
| [ability:glacier:link](ability-glacier-link.png) | 0.2400 | 0.1087 | 0.0167 | 1419 | -2.00e-4 |
| [ability:glacier:dash-start](ability-glacier-dash-start.png) | 0.1500 | 0.1723 | 0.0315 | 877 | 3.16e-4 |
| [ability:glacier:dash-end](ability-glacier-dash-end.png) | 0.6200 | 0.2469 | 0.0301 | 3672 | -7.06e-4 |
| [ability:whiteout:cast](ability-whiteout-cast.png) | 0.1800 | 0.2010 | 0.0362 | 1514 | 1.49e-4 |
| [ability:whiteout:impact](ability-whiteout-impact.png) | 1.3400 | 0.4285 | 0.0634 | 2010 | -2.66e-4 |
| [ability:whiteout:tick](ability-whiteout-tick.png) | 0.2400 | 0.1239 | 0.0196 | 3666 | 8.48e-4 |
| [ability:whiteout:end](ability-whiteout-end.png) | 0.6200 | 0.3027 | 0.0436 | 2246 | -6.64e-5 |
| [ability:whiteout:burst](ability-whiteout-burst.png) | 0.6200 | 0.3395 | 0.0456 | 2318 | 1.58e-4 |
| [ability:whiteout:link](ability-whiteout-link.png) | 0.2400 | 0.1121 | 0.0195 | 3722 | 2.76e-4 |
| [ability:whiteout:dash-start](ability-whiteout-dash-start.png) | 0.1800 | 0.2149 | 0.0362 | 1564 | -1.62e-4 |
| [ability:whiteout:dash-end](ability-whiteout-dash-end.png) | 0.6200 | 0.2740 | 0.0449 | 2295 | -2.59e-4 |
| [ability:afterburn:cast](ability-afterburn-cast.png) | 0.1800 | 0.1275 | 0.0302 | 1167 | 6.71e-5 |
| [ability:afterburn:impact](ability-afterburn-impact.png) | 0.4900 | 0.3497 | 0.0515 | 898 | 3.07e-4 |
| [ability:afterburn:tick](ability-afterburn-tick.png) | 0.2400 | 0.0936 | 0.0268 | 246 | 1.82e-4 |
| [ability:afterburn:end](ability-afterburn-end.png) | 0.4900 | 0.2269 | 0.0295 | 2034 | -2.60e-4 |
| [ability:afterburn:burst](ability-afterburn-burst.png) | 0.4900 | 0.2079 | 0.0284 | 1944 | 9.56e-5 |
| [ability:afterburn:link](ability-afterburn-link.png) | 0.2400 | 0.0901 | 0.0270 | 244 | 8.85e-6 |
| [ability:afterburn:dash-start](ability-afterburn-dash-start.png) | 0.1800 | 0.1206 | 0.0299 | 1163 | 5.53e-5 |
| [ability:afterburn:dash-end](ability-afterburn-dash-end.png) | 0.4900 | 0.2452 | 0.0300 | 2094 | 6.81e-4 |
| [ability:flashfire:cast](ability-flashfire-cast.png) | 0.0800 | 0.0724 | 0.0127 | 3474 | 2.64e-5 |
| [ability:flashfire:impact](ability-flashfire-impact.png) | 0.6600 | 0.3184 | 0.0514 | 1893 | 2.08e-4 |
| [ability:flashfire:tick](ability-flashfire-tick.png) | 0.2400 | 0.1278 | 0.0198 | 1495 | -4.24e-4 |
| [ability:flashfire:end](ability-flashfire-end.png) | 0.6200 | 0.2754 | 0.0422 | 1337 | -4.53e-4 |
| [ability:flashfire:burst](ability-flashfire-burst.png) | 0.6200 | 0.3252 | 0.0435 | 1382 | -2.26e-4 |
| [ability:flashfire:link](ability-flashfire-link.png) | 0.2400 | 0.1264 | 0.0199 | 1453 | -5.34e-4 |
| [ability:flashfire:dash-start](ability-flashfire-dash-start.png) | 0.0800 | 0.0733 | 0.0129 | 3738 | -1.88e-5 |
| [ability:flashfire:dash-end](ability-flashfire-dash-end.png) | 0.6200 | 0.2443 | 0.0412 | 1404 | -6.59e-4 |
| [ability:napalm-charge:cast](ability-napalm-charge-cast.png) | 0.3500 | 0.1141 | 0.0201 | 1626 | 4.44e-5 |
| [ability:napalm-charge:impact](ability-napalm-charge-impact.png) | 0.8300 | 0.2548 | 0.0382 | 1150 | -1.80e-4 |
| [ability:napalm-charge:tick](ability-napalm-charge-tick.png) | 0.2400 | 0.1984 | 0.0241 | 1561 | -6.27e-4 |
| [ability:napalm-charge:end](ability-napalm-charge-end.png) | 0.6200 | 0.3124 | 0.0379 | 2388 | 1.08e-3 |
| [ability:napalm-charge:burst](ability-napalm-charge-burst.png) | 0.6200 | 0.3134 | 0.0374 | 2424 | 4.21e-4 |
| [ability:napalm-charge:link](ability-napalm-charge-link.png) | 0.2400 | 0.2108 | 0.0247 | 1733 | 9.94e-4 |
| [ability:napalm-charge:dash-start](ability-napalm-charge-dash-start.png) | 0.3500 | 0.1063 | 0.0201 | 1578 | 5.50e-5 |
| [ability:napalm-charge:dash-end](ability-napalm-charge-dash-end.png) | 0.6200 | 0.2570 | 0.0307 | 2242 | -1.12e-3 |
| [ability:meltdown:cast](ability-meltdown-cast.png) | 0.1800 | 0.1698 | 0.0369 | 344 | 2.64e-5 |
| [ability:meltdown:impact](ability-meltdown-impact.png) | 1.2600 | 0.3379 | 0.0555 | 496 | -2.05e-4 |
| [ability:meltdown:tick](ability-meltdown-tick.png) | 0.2400 | 0.1032 | 0.0184 | 774 | -5.10e-4 |
| [ability:meltdown:end](ability-meltdown-end.png) | 0.6200 | 0.2206 | 0.0429 | 439 | -3.26e-4 |
| [ability:meltdown:burst](ability-meltdown-burst.png) | 0.6200 | 0.2080 | 0.0422 | 418 | -7.20e-4 |
| [ability:meltdown:link](ability-meltdown-link.png) | 0.2400 | 0.0949 | 0.0184 | 757 | -2.72e-4 |
| [ability:meltdown:dash-start](ability-meltdown-dash-start.png) | 0.1800 | 0.1655 | 0.0367 | 347 | -1.82e-5 |
| [ability:meltdown:dash-end](ability-meltdown-dash-end.png) | 0.6200 | 0.2154 | 0.0428 | 412 | -3.06e-4 |
| [ability:static-step:cast](ability-static-step-cast.png) | 0.1800 | 0.1043 | 0.0219 | 2733 | -2.37e-5 |
| [ability:static-step:impact](ability-static-step-impact.png) | 0.2600 | 0.2345 | 0.0657 | 241 | 8.26e-5 |
| [ability:static-step:tick](ability-static-step-tick.png) | 0.2400 | 0.1179 | 0.0122 | 2336 | 4.37e-6 |
| [ability:static-step:end](ability-static-step-end.png) | 0.2600 | 0.1393 | 0.0166 | 2226 | 1.38e-4 |
| [ability:static-step:burst](ability-static-step-burst.png) | 0.2600 | 0.1407 | 0.0182 | 2217 | 1.67e-4 |
| [ability:static-step:link](ability-static-step-link.png) | 0.2400 | 0.1255 | 0.0123 | 2376 | 9.91e-5 |
| [ability:static-step:dash-start](ability-static-step-dash-start.png) | 0.1800 | 0.1094 | 0.0221 | 2801 | 5.34e-5 |
| [ability:static-step:dash-end](ability-static-step-dash-end.png) | 0.2600 | 0.1422 | 0.0167 | 2147 | 1.16e-4 |
| [ability:overload:cast](ability-overload-cast.png) | 0.1800 | 0.1395 | 0.0311 | 3435 | 5.24e-5 |
| [ability:overload:impact](ability-overload-impact.png) | 0.7100 | 0.2983 | 0.0412 | 1167 | -3.71e-4 |
| [ability:overload:tick](ability-overload-tick.png) | 0.2400 | 0.1260 | 0.0146 | 2429 | 5.98e-5 |
| [ability:overload:end](ability-overload-end.png) | 0.6200 | 0.2156 | 0.0298 | 2088 | 1.98e-4 |
| [ability:overload:burst](ability-overload-burst.png) | 0.6200 | 0.2522 | 0.0318 | 2029 | 1.39e-4 |
| [ability:overload:link](ability-overload-link.png) | 0.2400 | 0.1357 | 0.0139 | 2492 | 2.16e-5 |
| [ability:overload:dash-start](ability-overload-dash-start.png) | 0.1800 | 0.1351 | 0.0313 | 3503 | 3.46e-5 |
| [ability:overload:dash-end](ability-overload-dash-end.png) | 0.6200 | 0.2485 | 0.0361 | 1962 | -1.39e-5 |
| [ability:tesla-pylon:cast](ability-tesla-pylon-cast.png) | 0.1000 | 0.0724 | 0.0135 | 534 | -5.29e-5 |
| [ability:tesla-pylon:impact](ability-tesla-pylon-impact.png) | 0.7900 | 0.2298 | 0.0564 | 389 | 8.64e-5 |
| [ability:tesla-pylon:tick](ability-tesla-pylon-tick.png) | 0.2400 | 0.1130 | 0.0261 | 929 | 8.98e-5 |
| [ability:tesla-pylon:end](ability-tesla-pylon-end.png) | 0.6200 | 0.2358 | 0.0432 | 692 | 1.64e-5 |
| [ability:tesla-pylon:burst](ability-tesla-pylon-burst.png) | 0.6200 | 0.2354 | 0.0431 | 693 | -8.78e-6 |
| [ability:tesla-pylon:link](ability-tesla-pylon-link.png) | 0.2400 | 0.1138 | 0.0262 | 926 | -1.73e-5 |
| [ability:tesla-pylon:dash-start](ability-tesla-pylon-dash-start.png) | 0.1000 | 0.0765 | 0.0133 | 543 | -1.63e-5 |
| [ability:tesla-pylon:dash-end](ability-tesla-pylon-dash-end.png) | 0.6200 | 0.2318 | 0.0431 | 691 | 2.35e-5 |
| [ability:overclock:cast](ability-overclock-cast.png) | 0.1800 | 0.1596 | 0.0362 | 2229 | -1.53e-6 |
| [ability:overclock:impact](ability-overclock-impact.png) | 1.1800 | 0.3468 | 0.0581 | 1667 | -1.62e-4 |
| [ability:overclock:tick](ability-overclock-tick.png) | 0.2400 | 0.1225 | 0.0132 | 1050 | 1.64e-3 |
| [ability:overclock:end](ability-overclock-end.png) | 0.6200 | 0.2356 | 0.0543 | 402 | -1.58e-6 |
| [ability:overclock:burst](ability-overclock-burst.png) | 0.6200 | 0.2337 | 0.0543 | 399 | -1.68e-6 |
| [ability:overclock:link](ability-overclock-link.png) | 0.2400 | 0.1036 | 0.0134 | 1040 | 1.49e-4 |
| [ability:overclock:dash-start](ability-overclock-dash-start.png) | 0.1800 | 0.1626 | 0.0363 | 2194 | -2.13e-6 |
| [ability:overclock:dash-end](ability-overclock-dash-end.png) | 0.6200 | 0.2341 | 0.0543 | 400 | -2.84e-6 |
| [ability:bulwark:loop](ability-bulwark-loop.png) | 2.0000 | 0.0741 | 0.0429 | 119 | 7.77e-6 |
| [ability:frost-trail:loop](ability-frost-trail-loop.png) | 2.0000 | 0.1547 | 0.0426 | 6689 | 3.00e-7 |
| [ability:glacier:loop](ability-glacier-loop.png) | 2.0000 | 0.1682 | 0.0428 | 4764 | 9.22e-7 |
| [ability:whiteout:loop](ability-whiteout-loop.png) | 2.0000 | 0.1594 | 0.0430 | 2882 | -5.89e-6 |
| [ability:afterburn:loop](ability-afterburn-loop.png) | 2.0000 | 0.1841 | 0.0428 | 1930 | 4.03e-6 |
| [ability:napalm-charge:loop](ability-napalm-charge-loop.png) | 2.0000 | 0.1945 | 0.0428 | 2791 | 7.64e-6 |
| [ability:meltdown:loop](ability-meltdown-loop.png) | 2.0000 | 0.1572 | 0.0429 | 819 | -8.66e-6 |
| [ability:tesla-pylon:loop](ability-tesla-pylon-loop.png) | 2.0000 | 0.1274 | 0.0433 | 439 | -9.95e-7 |
| [ability:overclock:loop](ability-overclock-loop.png) | 2.0000 | 0.0857 | 0.0430 | 162 | -5.99e-5 |
| [ability:feedback:denied](ability-feedback-denied.png) | 0.0650 | 0.0307 | 0.0030 | 882 | -2.34e-5 |
| [ability:feedback:ready](ability-feedback-ready.png) | 0.1000 | 0.0379 | 0.0039 | 1300 | 7.79e-4 |
| [ability:feedback:overdrive-ready](ability-feedback-overdrive-ready.png) | 0.7200 | 0.3875 | 0.0457 | 1093 | -2.27e-4 |
| [ambience:cryogenics](ambience-cryogenics.png) | 5.0000 | 0.0877 | 0.0272 | 2844 | 1.79e-7 |
| [ambience:habitation](ambience-habitation.png) | 5.0000 | 0.0746 | 0.0257 | 188 | 1.36e-5 |
| [ambience:security](ambience-security.png) | 5.0000 | 0.1154 | 0.0266 | 566 | -7.53e-7 |
| [ambience:cargo](ambience-cargo.png) | 5.0000 | 0.0769 | 0.0289 | 71 | 1.31e-5 |
| [ambience:communications](ambience-communications.png) | 5.0000 | 0.0734 | 0.0241 | 581 | 3.27e-6 |
| [ambience:engineering](ambience-engineering.png) | 5.0000 | 0.1220 | 0.0321 | 311 | -2.34e-6 |
| [ambience:maintenance](ambience-maintenance.png) | 5.0000 | 0.0755 | 0.0266 | 160 | -9.48e-6 |
| [ambience:infested](ambience-infested.png) | 5.0000 | 0.0874 | 0.0298 | 165 | 3.02e-5 |
| [ambience:containment](ambience-containment.png) | 5.0000 | 0.0890 | 0.0274 | 451 | -1.42e-6 |
| [ambience:reactor](ambience-reactor.png) | 5.0000 | 0.1022 | 0.0321 | 581 | -1.37e-5 |
| [ui:hover](ui-hover.png) | 0.0650 | 0.0274 | 0.0030 | 2094 | 3.19e-6 |
| [ui:select](ui-select.png) | 0.1200 | 0.0474 | 0.0071 | 1130 | -1.27e-5 |
| [ui:confirm](ui-confirm.png) | 0.2800 | 0.1036 | 0.0246 | 993 | 1.08e-5 |
| [ui:back](ui-back.png) | 0.1800 | 0.0711 | 0.0161 | 671 | 9.65e-6 |
| [ui:denied](ui-denied.png) | 0.1000 | 0.0343 | 0.0054 | 324 | 1.14e-5 |
| [ui:tab](ui-tab.png) | 0.1100 | 0.0362 | 0.0058 | 1522 | 1.12e-6 |
| [ui:toggle](ui-toggle.png) | 0.1600 | 0.0651 | 0.0087 | 1079 | 2.24e-5 |
| [ui:slider](ui-slider.png) | 0.0500 | 0.0229 | 0.0023 | 1623 | 1.49e-6 |
| [ui:draft-reveal](ui-draft-reveal.png) | 0.7500 | 0.2813 | 0.0589 | 309 | 3.48e-5 |
| [ui:boon-acquired](ui-boon-acquired.png) | 0.7000 | 0.3162 | 0.0647 | 798 | -2.94e-5 |
| [ui:rig-equip](ui-rig-equip.png) | 0.6000 | 0.2555 | 0.0557 | 614 | 5.24e-5 |
| [ui:reroll](ui-reroll.png) | 0.3400 | 0.1403 | 0.0229 | 819 | 1.06e-6 |
| [ui:purchase](ui-purchase.png) | 0.4200 | 0.1613 | 0.0331 | 1027 | 1.14e-5 |
| [ui:room-enter](ui-room-enter.png) | 0.8500 | 0.2717 | 0.0489 | 181 | -4.75e-5 |
| [ui:room-clear](ui-room-clear.png) | 1.0500 | 0.3767 | 0.0708 | 346 | 2.27e-5 |
| [ui:boss-intro](ui-boss-intro.png) | 1.6500 | 0.3349 | 0.0810 | 100 | 2.32e-5 |
| [ui:overdrive-ready](ui-overdrive-ready.png) | 0.9000 | 0.2596 | 0.0674 | 652 | -5.72e-6 |
| [ui:ability-ready](ui-ability-ready.png) | 0.0900 | 0.0221 | 0.0039 | 1474 | 4.73e-7 |
| [ui:low-health](ui-low-health.png) | 0.4200 | 0.0730 | 0.0163 | 103 | -4.05e-5 |
| [ui:death](ui-death.png) | 1.5000 | 0.2174 | 0.0620 | 146 | -3.07e-5 |
| [ui:victory](ui-victory.png) | 1.7500 | 0.3452 | 0.0749 | 344 | 1.25e-5 |
| [ui:checkpoint](ui-checkpoint.png) | 0.4800 | 0.1113 | 0.0261 | 858 | 1.70e-5 |
| [system:heartbeat](system-heartbeat.png) | 1.2500 | 0.0797 | 0.0124 | 64 | -1.47e-5 |
| [layered:pistol](layered-pistol.png) | 0.8500 | 0.1941 | 0.0337 | 526 | -1.02e-4 |
| [layered:rifle](layered-rifle.png) | 0.8500 | 0.1853 | 0.0305 | 1119 | -7.04e-5 |
| [layered:shotgun](layered-shotgun.png) | 2.4500 | 0.3206 | 0.0474 | 627 | 1.03e-4 |
| [layered:plasma](layered-plasma.png) | 1.8500 | 0.2314 | 0.0433 | 303 | -5.10e-5 |
| [layered:rocket](layered-rocket.png) | 1.5500 | 0.4089 | 0.0526 | 1069 | -1.68e-4 |
| [layered:large-explosion](layered-large-explosion.png) | 1.5000 | 0.4336 | 0.0808 | 242 | -9.40e-5 |
| [legacy:freeze](legacy-freeze.png) | 0.3200 | 0.0957 | 0.0225 | 1706 | -6.71e-7 |
| [legacy:shatter](legacy-shatter.png) | 0.2400 | 0.0575 | 0.0084 | 6827 | 5.31e-8 |
| [legacy:reactor](legacy-reactor.png) | 0.6800 | 0.1384 | 0.0386 | 138 | -2.81e-5 |
| [fight:master](fight-master.png) | 8.0000 | 0.6561 | 0.1248 | 644 | -5.97e-4 |
| [fight:bus:music](fight-bus-music.png) | 8.0000 | 0.0890 | 0.0052 | 2139 | -6.48e-6 |
| [fight:bus:ambience](fight-bus-ambience.png) | 8.0000 | 0.0633 | 0.0108 | 331 | 7.24e-7 |
| [fight:bus:weapons](fight-bus-weapons.png) | 8.0000 | 0.7250 | 0.1029 | 644 | -5.88e-4 |
| [fight:bus:abilities](fight-bus-abilities.png) | 8.0000 | 0.4867 | 0.0482 | 1722 | -4.14e-5 |
| [fight:bus:enemies](fight-bus-enemies.png) | 8.0000 | 0.2936 | 0.0502 | 394 | 3.11e-4 |
| [fight:bus:impacts](fight-bus-impacts.png) | 8.0000 | 0.4720 | 0.0654 | 368 | -3.60e-4 |
| [fight:bus:ui](fight-bus-ui.png) | 8.0000 | 0.2799 | 0.0278 | 371 | -2.46e-6 |

## Assertions

All renders finite, non-silent, duration-bounded, endpoint-silent and below master clipping threshold; DC within 0.006.
