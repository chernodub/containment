# PERF18 desktop rendering performance

Quarter-resolution High ambient occlusion clears the 20 ms p95 target on Transmission Chamber with Arc. Across all rigs and both rooms, High still records a 25.0 ms median trial p95 and a 25.8 ms worst trial. All 48 final trials hold a 16.7 ms median, stay within the 330-draw budget, and compile zero programs in combat. All 42 room preparation holds finish within 3 s.

## Preserved High baseline

Production build `1dc1d081`, 1920×1080, two 20-second trials per room and rig. Initial 1-minute load was 2.15.

| Room | Rig | Repeat | Load start → end | Frame p50 / p95 ms | CPU p95 ms | GPU query p50 ms | Draw peak |
| --- | --- | ---: | --- | --- | ---: | ---: | ---: |
| safety-interlock-station | pyro | 1 | 2.38 → 2.21 | 16.7 / 26.7 | 23.7 | 43.60 | 309 |
| safety-interlock-station | pyro | 2 | 2.21 → 2.20 | 16.7 / 26.5 | 22.3 | 36.83 | 299 |
| safety-interlock-station | arc | 1 | 2.20 → 1.84 | 16.7 / 25.0 | 16.1 | 27.76 | 283 |
| safety-interlock-station | arc | 2 | 1.84 → 1.89 | 16.7 / 25.0 | 14.9 | 27.35 | 299 |
| transmission-chamber | pyro | 1 | 1.89 → 2.12 | 16.7 / 25.2 | 20.2 | 31.84 | 170 |
| transmission-chamber | pyro | 2 | 2.12 → 2.21 | 16.7 / 25.0 | 20.1 | 29.86 | 176 |
| transmission-chamber | arc | 1 | 2.21 → 2.33 | 16.7 / 24.9 | 14.2 | 17.65 | 166 |
| transmission-chamber | arc | 2 | 2.33 → 2.06 | 16.7 / 18.6 | 15.1 | 17.21 | 166 |

All eight trials reached adaptive scale 0.90 and compiled zero combat programs. In the seven trials over budget, 7–23% of samples exceeded 20 ms. Most of that tail fell between 23 and 27 ms. Each run also recorded a roughly 1.2 s maximum, too rare to account for p95. Pyro demanded a depth snapshot every sampled render. Arc demanded zero and still missed p95 in three trials. The instrumentation provides no per-frame GC or light-churn attribution.

## High pass audit

One Pyro trial per room, with GPU flush enabled. Initial load was 1.98. Dimensions below are at the 0.90 adaptive floor. Draws are the median in frames where the scope ran. A copy submits zero geometry draws. The elapsed queries include queue time. A one-draw bloom pass and the scene both report roughly 25 ms, and transparent estimates exceed the enclosing scene estimate. These observations do not isolate pass cost.

| Pass | Size | Safety-interlock draws | Safety-interlock GPU p50 / p95 ms | Transmission draws | Transmission GPU p50 / p95 ms |
| --- | --- | ---: | --- | ---: | --- |
| frameTotal | 1920×1080 | 237 | 35.18 / 63.40 | 142 | 30.64 / 59.11 |
| sceneColor | 1728×972 | 229 | 28.08 / 32.27 | 134 | 26.44 / 30.48 |
| mainOpaque | 1728×972 | 191 | 25.84 / 31.60 | 98 | 24.46 / 30.04 |
| marineSilhouetteCopy | 384×384 | 0 | 20.44 / 26.42 | 0 | 21.88 / 26.71 |
| transparentVFX | 1728×972 | 39 | 45.14 / 55.65 | 38 | 44.97 / 52.20 |
| gtao | 864×486 | 1 | 23.42 / 29.31 | 1 | 23.72 / 27.76 |
| aoDenoise | 864×486 | 1 | 25.25 / 31.31 | 1 | 24.20 / 30.29 |
| bloomExtract | 432×243 | 1 | 24.83 / 31.88 | 1 | 22.53 / 27.40 |
| bloomBlurHorizontal | 432×243 | 1 | 24.65 / 28.65 | 1 | 23.83 / 28.63 |
| bloomBlurVertical | 432×243 | 1 | 23.61 / 31.21 | 1 | 21.40 / 27.93 |
| distortion | 432×243 | 1 | 24.29 / 30.49 | 1 | 23.61 / 28.07 |
| composite | 1728×972 | 1 | 25.05 / 32.17 | 1 | 24.46 / 29.21 |
| finalAA | 1920×1080 | 1 | 25.52 / 31.91 | 1 | 23.70 / 28.87 |
| hud | 1920×1080 | 7 | 25.68 / 30.33 | 7 | 23.97 / 29.24 |
| gasDepthSnapshot | 864×486 | 0 | 22.43 / 26.17 | 0 | 21.58 / 25.96 |

No shadow refresh scope ran in either combat trial. The warning silhouette is part of the composite. The priority mask is rasterized on the CPU and uploaded when changed. Gas, decals and residues submit within scene color. Local lights shade scene materials in those same draws. The audit has no isolated GPU durations for those operations.

## Quarter-resolution ambient occlusion experiment

The candidate reduced both High AO target axes by half (quarter-size targets in place of half-size), retaining the same shaders and leaving Low at 1×1. The frozen builds ran B1 → A1 → B2 → A2 for ten seconds per room and rig. Start load for each browser invocation was 2.12, 2.31, 2.74 and 2.45. All frame p50s were 16.7 ms.

| Room / rig | Frame p95 A1 → B1 | Frame p95 A2 → B2 | Raw GPU p50 A1 → B1 | Raw GPU p50 A2 → B2 |
| --- | ---: | ---: | ---: | ---: |
| Safety-interlock / Pyro | 33.3 → 26.4 | 25.5 → 26.4 | 39.15 → 33.44 | 38.21 → 35.21 |
| Safety-interlock / Arc | 25.0 → 25.0 | 25.1 → 24.3 | 27.69 → 17.01 | 27.94 → 22.58 |
| Transmission / Pyro | 25.3 → 25.1 | 25.3 → 25.1 | 31.25 → 27.20 | 31.35 → 29.27 |
| Transmission / Arc | 24.9 → 18.2 | 23.6 → 18.2 | 17.03 → 15.61 | 15.81 → 16.27 |

The main repeatable frame-tail improvement was Transmission on Arc. Pyro still missed the frame target by 5–6 ms and Safety-interlock Arc still missed by 4–5 ms. The raw GPU intervals fell in seven of eight pairs. Those deltas represent whole-frame intervals, including scheduling effects.

## High pass audit after the AO change

Same two Pyro scopes and flush settings. Initial load was 1.78. GTAO and its denoise now write 432×243 at the adaptive floor. The other target sizes and draw topology retain the same design. The queue-scale timings still prevent stage-level subtraction.

| Pass | Size | Safety-interlock draws | Safety-interlock GPU p50 / p95 ms | Transmission draws | Transmission GPU p50 / p95 ms |
| --- | --- | ---: | --- | ---: | --- |
| frameTotal | 1920×1080 | 235 | 32.52 / 64.19 | 140 | 28.12 / 48.93 |
| sceneColor | 1728×972 | 227 | 22.60 / 30.85 | 133 | 15.53 / 32.38 |
| mainOpaque | 1728×972 | 189 | 16.24 / 29.64 | 96 | 15.43 / 30.58 |
| marineSilhouetteCopy | 384×384 | 0 | 21.74 / 27.46 | 0 | 13.05 / 26.32 |
| transparentVFX | 1728×972 | 38 | 37.36 / 57.31 | 37 | 29.26 / 53.14 |
| gasDepthSnapshot | 864×486 | 0 | 16.58 / 27.85 | 0 | 19.38 / 24.68 |
| gtao | 432×243 | 1 | 21.88 / 31.56 | 1 | 21.55 / 26.45 |
| aoDenoise | 432×243 | 1 | 23.99 / 31.39 | 1 | 21.26 / 25.72 |
| bloomExtract | 432×243 | 1 | 14.88 / 25.97 | 1 | 21.72 / 28.97 |
| bloomBlurHorizontal | 432×243 | 1 | 16.76 / 30.53 | 1 | 22.07 / 30.17 |
| bloomBlurVertical | 432×243 | 1 | 20.67 / 28.42 | 1 | 21.82 / 27.54 |
| distortion | 432×243 | 1 | 21.17 / 28.72 | 1 | 21.89 / 28.52 |
| composite | 1728×972 | 1 | 22.18 / 29.96 | 1 | 22.87 / 28.91 |
| finalAA | 1920×1080 | 1 | 22.88 / 29.45 | 1 | 22.54 / 26.88 |
| hud | 1920×1080 | 7 | 23.55 / 28.59 | 7 | 17.99 / 28.51 |

## Final 48-trial matrix

Twenty seconds per trial at 1920×1080. Initial load was 1.74. Frame and CPU values are milliseconds. GPU values are raw frame-query intervals.

| Room | Rig | Tier | Repeat | Load start → end | Frame p50 / p95 | CPU p95 | GPU p50 | Min scale | Peak draws | Compiles |
| --- | --- | --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: |
| safety-interlock-station | breacher | high | 1 | 1.68 → 1.75 | 16.70 / 25.40 | 25.20 | 29.54 | 0.90 | 269 | 0 |
| safety-interlock-station | breacher | high | 2 | 1.75 → 2.07 | 16.70 / 25.10 | 24.20 | 29.68 | 0.90 | 268 | 0 |
| safety-interlock-station | breacher | high | 3 | 2.07 → 1.84 | 16.70 / 25.10 | 25.80 | 27.02 | 0.90 | 268 | 0 |
| safety-interlock-station | breacher | low | 1 | 1.84 → 2.09 | 16.70 / 18.20 | 21.70 | 9.04 | 1.00 | 255 | 0 |
| safety-interlock-station | breacher | low | 2 | 2.09 → 2.48 | 16.70 / 24.90 | 22.50 | 8.94 | 1.00 | 255 | 0 |
| safety-interlock-station | breacher | low | 3 | 2.48 → 4.36 | 16.70 / 24.90 | 22.90 | 8.96 | 1.00 | 260 | 0 |
| safety-interlock-station | cryo | high | 1 | 4.36 → 4.14 | 16.70 / 25.70 | 21.20 | 29.69 | 0.90 | 283 | 0 |
| safety-interlock-station | cryo | high | 2 | 4.14 → 3.38 | 16.70 / 25.50 | 22.20 | 29.88 | 0.90 | 285 | 0 |
| safety-interlock-station | cryo | high | 3 | 3.38 → 3.04 | 16.70 / 25.30 | 20.30 | 30.20 | 0.90 | 287 | 0 |
| safety-interlock-station | cryo | low | 1 | 3.04 → 2.89 | 16.70 / 17.90 | 20.10 | 10.40 | 1.00 | 271 | 0 |
| safety-interlock-station | cryo | low | 2 | 2.89 → 2.70 | 16.70 / 17.90 | 18.30 | 10.44 | 1.00 | 271 | 0 |
| safety-interlock-station | cryo | low | 3 | 2.70 → 2.17 | 16.70 / 18.00 | 19.70 | 10.50 | 1.00 | 271 | 0 |
| safety-interlock-station | pyro | high | 1 | 2.17 → 2.22 | 16.70 / 25.60 | 22.50 | 34.85 | 0.90 | 298 | 0 |
| safety-interlock-station | pyro | high | 2 | 2.22 → 2.18 | 16.70 / 25.50 | 22.50 | 33.06 | 0.90 | 300 | 0 |
| safety-interlock-station | pyro | high | 3 | 2.18 → 2.85 | 16.70 / 25.80 | 22.80 | 35.28 | 0.90 | 308 | 0 |
| safety-interlock-station | pyro | low | 1 | 2.85 → 3.31 | 16.70 / 18.10 | 20.00 | 9.94 | 1.00 | 289 | 0 |
| safety-interlock-station | pyro | low | 2 | 3.31 → 3.26 | 16.70 / 18.10 | 20.50 | 9.95 | 1.00 | 279 | 0 |
| safety-interlock-station | pyro | low | 3 | 3.26 → 2.77 | 16.70 / 18.10 | 19.80 | 9.87 | 1.00 | 283 | 0 |
| safety-interlock-station | arc | high | 1 | 2.77 → 3.04 | 16.70 / 25.00 | 16.50 | 20.88 | 0.90 | 298 | 0 |
| safety-interlock-station | arc | high | 2 | 3.04 → 2.68 | 16.70 / 24.90 | 16.70 | 19.65 | 0.90 | 299 | 0 |
| safety-interlock-station | arc | high | 3 | 2.68 → 2.29 | 16.70 / 24.90 | 15.70 | 17.70 | 0.90 | 290 | 0 |
| safety-interlock-station | arc | low | 1 | 2.29 → 2.21 | 16.70 / 17.70 | 13.30 | 9.74 | 1.00 | 277 | 0 |
| safety-interlock-station | arc | low | 2 | 2.21 → 2.69 | 16.70 / 17.70 | 14.00 | 9.46 | 1.00 | 279 | 0 |
| safety-interlock-station | arc | low | 3 | 2.69 → 2.15 | 16.70 / 17.70 | 13.60 | 10.18 | 1.00 | 278 | 0 |
| transmission-chamber | breacher | high | 1 | 2.15 → 2.40 | 16.70 / 25.00 | 21.50 | 16.47 | 0.90 | 154 | 0 |
| transmission-chamber | breacher | high | 2 | 2.40 → 2.07 | 16.70 / 24.00 | 19.80 | 16.68 | 0.90 | 149 | 0 |
| transmission-chamber | breacher | high | 3 | 2.07 → 1.85 | 16.70 / 24.90 | 20.30 | 16.51 | 0.90 | 155 | 0 |
| transmission-chamber | breacher | low | 1 | 1.85 → 1.97 | 16.70 / 17.80 | 16.20 | 9.33 | 1.00 | 139 | 0 |
| transmission-chamber | breacher | low | 2 | 1.97 → 1.68 | 16.70 / 17.90 | 17.30 | 9.37 | 1.00 | 137 | 0 |
| transmission-chamber | breacher | low | 3 | 1.68 → 2.15 | 16.70 / 18.20 | 18.90 | 10.40 | 1.00 | 146 | 0 |
| transmission-chamber | cryo | high | 1 | 2.15 → 1.59 | 16.70 / 25.00 | 18.40 | 22.29 | 0.90 | 154 | 0 |
| transmission-chamber | cryo | high | 2 | 1.59 → 1.36 | 16.70 / 25.00 | 17.30 | 28.88 | 0.90 | 156 | 0 |
| transmission-chamber | cryo | high | 3 | 1.36 → 1.33 | 16.70 / 25.00 | 17.80 | 21.40 | 0.90 | 156 | 0 |
| transmission-chamber | cryo | low | 1 | 1.33 → 1.78 | 16.70 / 17.60 | 13.70 | 10.16 | 1.00 | 144 | 0 |
| transmission-chamber | cryo | low | 2 | 1.78 → 1.51 | 16.70 / 18.00 | 16.90 | 10.01 | 1.00 | 142 | 0 |
| transmission-chamber | cryo | low | 3 | 1.51 → 1.73 | 16.70 / 17.70 | 14.70 | 9.73 | 1.00 | 144 | 0 |
| transmission-chamber | pyro | high | 1 | 1.73 → 2.04 | 16.70 / 25.00 | 19.30 | 26.85 | 0.90 | 180 | 0 |
| transmission-chamber | pyro | high | 2 | 2.04 → 2.35 | 16.70 / 25.00 | 20.10 | 28.51 | 0.90 | 175 | 0 |
| transmission-chamber | pyro | high | 3 | 2.35 → 2.14 | 16.70 / 25.00 | 20.70 | 29.66 | 0.90 | 178 | 0 |
| transmission-chamber | pyro | low | 1 | 2.14 → 2.45 | 16.70 / 17.70 | 17.80 | 9.21 | 1.00 | 156 | 0 |
| transmission-chamber | pyro | low | 2 | 2.45 → 3.11 | 16.70 / 18.00 | 17.30 | 9.24 | 1.00 | 160 | 0 |
| transmission-chamber | pyro | low | 3 | 3.11 → 2.84 | 16.70 / 17.70 | 16.90 | 9.14 | 1.00 | 155 | 0 |
| transmission-chamber | arc | high | 1 | 2.84 → 2.65 | 16.70 / 18.30 | 14.10 | 15.79 | 0.90 | 169 | 0 |
| transmission-chamber | arc | high | 2 | 2.65 → 2.41 | 16.70 / 18.00 | 13.40 | 16.30 | 0.90 | 167 | 0 |
| transmission-chamber | arc | high | 3 | 2.41 → 2.17 | 16.70 / 17.90 | 13.90 | 14.89 | 0.90 | 167 | 0 |
| transmission-chamber | arc | low | 1 | 2.17 → 1.91 | 16.70 / 17.70 | 13.10 | 8.80 | 1.00 | 154 | 0 |
| transmission-chamber | arc | low | 2 | 1.91 → 1.86 | 16.70 / 18.00 | 11.30 | 8.77 | 1.00 | 155 | 0 |
| transmission-chamber | arc | low | 3 | 1.86 → 1.61 | 16.70 / 17.70 | 12.80 | 8.84 | 1.00 | 155 | 0 |

High p95 was 25.00 ms median and 25.80 ms worst. 3 of 24 trials reached 20 ms p95.

Low p95 was 17.90 ms median and 24.90 ms worst. 22 of 24 trials reached 20 ms p95.

Benchmark reported 0 errors and 0 resource guard failures.

## Room preparation

Values are milliseconds. Fresh rows use a new page. Sequential rows retain the renderer. Phase durations can overlap.

| Room | Mode | Load start → end | Total | Build | Reflection | Warm | Combat compiles |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| awakening-bay | fresh | 1.52 → 1.52 | 1828 | 382 | 316 | 216 | 0 |
| passenger-vault | fresh | 1.55 → 1.59 | 1427 | 100 | 250 | 212 | 0 |
| residential-gallery | fresh | 1.59 → 1.54 | 886 | 39 | 170 | 221 | 0 |
| communal-atrium | fresh | 1.54 → 1.58 | 1216 | 124 | 269 | 225 | 0 |
| crew-checkpoint | fresh | 1.58 → 1.69 | 859 | 46 | 182 | 215 | 0 |
| armory | fresh | 1.69 → 1.72 | 1104 | 117 | 180 | 218 | 0 |
| freight-hold | fresh | 1.72 → 1.66 | 2027 | 60 | 170 | 1286 | 0 |
| breached-loading-bay | fresh | 1.61 → 1.61 | 1228 | 234 | 191 | 213 | 0 |
| relay-racks | fresh | 1.56 → 1.56 | 962 | 60 | 184 | 226 | 0 |
| transmission-chamber | fresh | 1.51 → 1.51 | 1226 | 133 | 196 | 228 | 0 |
| diagnostic-gallery | fresh | 1.63 → 1.63 | 918 | 75 | 197 | 200 | 0 |
| safety-interlock-station | fresh | 2.30 → 2.30 | 1310 | 161 | 210 | 250 | 0 |
| coolant-plant | fresh | 2.44 → 2.44 | 828 | 40 | 177 | 211 | 0 |
| service-shaft-landing | fresh | 2.32 → 2.32 | 922 | 76 | 188 | 216 | 0 |
| infested-workshop | fresh | 2.22 → 2.22 | 1038 | 54 | 182 | 225 | 0 |
| swarm-junction | fresh | 2.28 → 2.28 | 826 | 31 | 174 | 210 | 0 |
| shielding-gate | fresh | 2.42 → 2.42 | 1237 | 124 | 227 | 220 | 0 |
| containment-annulus | fresh | 2.54 → 2.54 | 1548 | 116 | 211 | 220 | 0 |
| manual-control-chamber | fresh | 2.42 → 2.42 | 1186 | 54 | 243 | 426 | 0 |
| overload-floor | fresh | 2.46 → 2.43 | 1461 | 174 | 222 | 515 | 0 |
| reactor-vault | fresh | 2.43 → 2.39 | 2517 | 273 | 1366 | 557 | 0 |
| awakening-bay | sequential | 2.36 → 2.36 | 1805 | 382 | 300 | 227 | 0 |
| passenger-vault | sequential | 2.36 → 2.36 | 1256 | 72 | 241 | 142 | 0 |
| residential-gallery | sequential | 2.36 → 2.25 | 772 | 48 | 158 | 154 | 0 |
| communal-atrium | sequential | 2.25 → 2.25 | 1116 | 212 | 259 | 131 | 0 |
| crew-checkpoint | sequential | 2.25 → 2.25 | 699 | 58 | 171 | 128 | 0 |
| armory | sequential | 2.25 → 2.25 | 967 | 173 | 170 | 129 | 0 |
| freight-hold | sequential | 2.25 → 2.25 | 852 | 90 | 168 | 127 | 0 |
| breached-loading-bay | sequential | 2.25 → 2.31 | 1122 | 362 | 187 | 152 | 0 |
| relay-racks | sequential | 2.31 → 2.31 | 781 | 91 | 174 | 137 | 0 |
| transmission-chamber | sequential | 2.31 → 2.31 | 1266 | 299 | 191 | 127 | 0 |
| diagnostic-gallery | sequential | 2.31 → 2.31 | 816 | 105 | 192 | 157 | 0 |
| safety-interlock-station | sequential | 2.31 → 2.31 | 1283 | 273 | 203 | 143 | 0 |
| coolant-plant | sequential | 2.31 → 2.21 | 711 | 50 | 173 | 135 | 0 |
| service-shaft-landing | sequential | 2.21 → 2.21 | 796 | 125 | 180 | 158 | 0 |
| infested-workshop | sequential | 2.21 → 2.21 | 920 | 87 | 178 | 161 | 0 |
| swarm-junction | sequential | 2.21 → 2.21 | 618 | 38 | 214 | 130 | 0 |
| shielding-gate | sequential | 2.21 → 2.21 | 1411 | 326 | 214 | 167 | 0 |
| containment-annulus | sequential | 2.21 → 2.19 | 1345 | 166 | 203 | 168 | 0 |
| manual-control-chamber | sequential | 2.19 → 2.19 | 1435 | 72 | 217 | 848 | 0 |
| overload-floor | sequential | 2.19 → 2.19 | 2254 | 291 | 1320 | 170 | 0 |
| reactor-vault | sequential | 2.19 → 2.09 | 1141 | 520 | 113 | 130 | 0 |

Overload Floor was ready in 1.46 s fresh and 2.25 s sequential, with 0.22 s and 1.32 s respectively inside the reflection hooks. Both timings sum two calls to the capture hook, which returns immediately when the room already owns a texture. The previous 15.6 s reflection observation did not recur. The worst hold was the fresh legacy Reactor Vault at 2.52 s. All preparation rows passed the tool's phase, resource and combat-compilation checks, so the capture policy stays at its existing resolution and cadence.

## Desktop visual review and playtest

The baseline and candidate captures used a fixed native 1920×1080 target, seed 1729, and the same capture driver. The 42 matched frames are retained side by side at 1920×1080 and 480×270 per panel. Coverage includes Pyro and Cryo overlaps, Relay Racks crowd, heavy Communal Atrium combat, Containment Annulus Overdrive sequences for all four rigs, and two condition rooms. The native comparisons show slightly softer contact shading at some prop edges. The 480×270 comparisons retain the same read of the dark ship, lit actors, warning edges, marine silhouette and Overdrive aftermaths.

The original heavy fixture stopped on both builds because its 28-unit packing estimate could admit a point that failed native rank-radius clearance. The driver now rejects that placement and continues searching. The full native population and framing checks passed on the paired reruns. The production build passed. The fast Arc campaign on seed 1729 reached its six-room limit with six clears and zero errors.

## Remaining frame budget

High still needs approximately 5 ms off the observed tail in most combinations. The unchanged 16.7 ms median and sustained 23–27 ms tail indicate repeated missed presentation intervals. Individual stalls make up a smaller share. Static shadows and missing gas demand on Arc rule out either as a common trigger in these trials. Pyro also has CPU p95 near or over 20 ms, so further GPU work alone may not resolve its worst intervals. The next attribution step would require a Metal trace that separates attachment stores at the marine color and soft-depth copies, opaque material shading, and transparent overdraw. WebGL pass queries on this backend cannot resolve those costs independently.

[Preserved baseline](../../artifacts/nextgen/perf18/baseline/benchmark.json) · [Final trials](../../artifacts/nextgen/perf18/final/benchmark.json) · [Room preparation](../../artifacts/nextgen/perf18/rooms/rooms.json) · [Matched frames](../../artifacts/nextgen/perf18/pairs) · [Arc playtest](../../artifacts/nextgen/perf18/playtest-arc/report.json)
