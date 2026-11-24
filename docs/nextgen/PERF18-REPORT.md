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

## PERF19 ablation

Measured on 81512bcb plus the benchmark controls at 1920×1080 on the same M1 Pro. Each feature used two pairs of 15-second trials, with a fresh staged fight and full High immediately before its ablation. Safety-interlock Pyro ran before Transmission Arc. The new frame summary excludes the interval that starts before measurement, uses nearest-rank p90/p95/p99, and counts strict >20 ms and >30 ms intervals. Savings below are percentage points of the frame distribution. Timing budgets are unchanged.

AO, bloom and distortion used the validated graphics overrides. The other selectors are debug-only. Final AA bypasses the intermediate graded target. Soft depth leaves gas particles live with detached depth disabled. Atmosphere layers hides the atmosphere batch with grading and room lights intact. Half light pool admits four of nine dynamic lights using the existing priority policy. Contacts disables the soft actor-contact stamps. Silhouette disables the marine coverage copy and borrowed-skin overlay and the committed attacker outline, while retaining ordinary ink. Priority sampling leaves the CPU priority raster and live warnings in place. Floor residues hides combat floor decals, ability scars and procedural scorch, wake and crack surfaces. Conditions disables visual condition owners. The standard benchmark route does not enable run-structure conditions, so that row is a negative control. Adaptive 0.80 changes the diagnostic minimum only.


### safety-interlock-station / pyro

| Feature | Repeat | Full load | Full p90 / p95 / p99 ms | Full >20 / >30 | Ablated load | Ablated p90 / p95 / p99 ms | Ablated >20 / >30 | >20 saving (pp) |
| --- | ---: | --- | --- | --- | --- | --- | --- | ---: |
| ao | 1 | 1.58 → 2.39 | 25.10 / 26.00 / 41.80 | 19.19% / 3.81% | 2.39 → 2.26 | 25.10 / 26.00 / 41.50 | 20.87% / 3.70% | -1.69 |
| bloom | 1 | 2.26 → 2.56 | 25.10 / 32.70 / 50.00 | 22.87% / 5.01% | 2.56 → 3.86 | 25.00 / 25.80 / 41.60 | 16.82% / 3.71% | +6.05 |
| distortion | 1 | 3.86 → 3.56 | 25.00 / 25.70 / 50.00 | 18.23% / 3.43% | 3.56 → 3.47 | 25.00 / 25.40 / 43.20 | 16.56% / 3.26% | +1.67 |
| finalAA | 1 | 3.47 → 3.40 | 25.10 / 26.30 / 48.70 | 21.92% / 4.47% | 3.40 → 3.25 | 25.00 / 25.70 / 48.90 | 16.32% / 3.39% | +5.60 |
| softDepth | 1 | 3.25 → 2.83 | 25.00 / 25.90 / 49.30 | 20.75% / 3.75% | 2.83 → 2.30 | 25.00 / 25.80 / 41.80 | 17.17% / 3.67% | +3.58 |
| atmosphereLayers | 1 | 2.30 → 2.32 | 25.00 / 25.70 / 41.70 | 16.58% / 2.87% | 2.32 → 2.54 | 25.00 / 26.50 / 43.30 | 19.73% / 4.80% | -3.15 |
| halfLightPool | 1 | 2.54 → 2.39 | 25.00 / 26.10 / 42.00 | 16.93% / 4.23% | 2.39 → 2.58 | 18.00 / 24.90 / 33.40 | 6.21% / 1.34% | +10.72 |
| contacts | 1 | 2.58 → 2.42 | 25.00 / 25.60 / 49.90 | 18.40% / 3.20% | 2.42 → 2.15 | 25.00 / 26.40 / 50.10 | 19.97% / 4.42% | -1.57 |
| silhouette | 1 | 2.15 → 2.65 | 25.00 / 26.40 / 50.00 | 18.38% / 4.53% | 2.65 → 2.60 | 25.00 / 25.90 / 42.40 | 18.85% / 4.28% | -0.47 |
| prioritySampling | 1 | 2.60 → 2.78 | 25.10 / 33.30 / 41.90 | 24.52% / 6.34% | 2.78 → 2.44 | 25.10 / 33.10 / 50.10 | 21.17% / 5.46% | +3.35 |
| floorResidues | 1 | 2.44 → 2.11 | 25.10 / 33.00 / 50.00 | 23.98% / 5.31% | 2.11 → 2.49 | 25.00 / 25.80 / 49.20 | 19.24% / 4.35% | +4.74 |
| conditions | 1 | 2.49 → 2.63 | 25.00 / 25.90 / 50.10 | 21.43% / 4.85% | 2.63 → 2.82 | 25.00 / 33.00 / 50.00 | 17.82% / 5.19% | +3.61 |
| adaptive80 | 1 | 2.82 → 2.80 | 25.00 / 25.60 / 41.70 | 17.35% / 3.68% | 2.80 → 2.61 | 24.80 / 25.20 / 41.60 | 12.76% / 2.81% | +4.59 |
| ao | 2 | 2.61 → 2.76 | 25.00 / 25.30 / 41.70 | 20.29% / 2.92% | 2.76 → 2.61 | 25.00 / 26.30 / 50.00 | 18.56% / 4.41% | +1.73 |
| bloom | 2 | 2.61 → 2.27 | 25.00 / 26.00 / 41.70 | 18.35% / 3.54% | 2.27 → 2.56 | 25.10 / 31.90 / 42.60 | 20.27% / 5.03% | -1.92 |
| distortion | 2 | 2.56 → 2.48 | 25.10 / 26.20 / 50.00 | 19.55% / 4.23% | 2.48 → 2.41 | 25.00 / 25.70 / 42.10 | 18.48% / 4.26% | +1.07 |
| finalAA | 2 | 2.41 → 1.99 | 25.00 / 25.60 / 42.90 | 19.95% / 3.94% | 1.99 → 1.92 | 25.00 / 26.00 / 42.00 | 19.25% / 4.55% | +0.70 |
| softDepth | 2 | 2.09 → 1.65 | 25.00 / 26.10 / 50.00 | 17.44% / 4.36% | 1.65 → 2.38 | 25.00 / 25.60 / 42.30 | 18.49% / 3.57% | -1.06 |
| atmosphereLayers | 2 | 2.38 → 3.06 | 25.00 / 25.80 / 42.10 | 18.24% / 4.07% | 3.06 → 2.66 | 25.20 / 26.70 / 42.70 | 23.84% / 4.77% | -5.60 |
| halfLightPool | 2 | 2.66 → 2.80 | 25.00 / 25.90 / 49.80 | 21.39% / 3.48% | 2.80 → 2.85 | 18.00 / 25.00 / 34.70 | 7.53% / 1.73% | +13.86 |
| contacts | 2 | 2.85 → 3.20 | 25.00 / 25.50 / 49.90 | 17.84% / 2.86% | 3.20 → 2.78 | 25.10 / 25.80 / 41.70 | 20.24% / 3.86% | -2.40 |
| silhouette | 2 | 2.78 → 2.45 | 25.10 / 26.10 / 41.70 | 20.42% / 4.11% | 2.45 → 2.31 | 25.00 / 25.90 / 41.70 | 16.84% / 4.38% | +3.58 |
| prioritySampling | 2 | 2.31 → 2.29 | 25.00 / 26.10 / 50.00 | 16.69% / 4.60% | 2.29 → 2.28 | 25.00 / 25.90 / 49.90 | 18.44% / 3.85% | -1.75 |
| floorResidues | 2 | 2.28 → 2.09 | 25.00 / 25.40 / 34.10 | 19.06% / 3.13% | 2.09 → 2.24 | 25.00 / 26.20 / 42.70 | 16.42% / 3.97% | +2.64 |
| conditions | 2 | 2.24 → 2.21 | 25.00 / 25.80 / 50.00 | 19.34% / 3.05% | 2.21 → 2.71 | 25.00 / 26.60 / 50.00 | 21.94% / 4.85% | -2.60 |
| adaptive80 | 2 | 2.71 → 2.57 | 25.00 / 26.30 / 50.00 | 20.29% / 4.41% | 2.57 → 2.59 | 24.90 / 25.00 / 43.60 | 13.04% / 2.05% | +7.25 |

52 trials, 0 benchmark errors, 0 resource guard misses.

### transmission-chamber / arc

| Feature | Repeat | Full load | Full p90 / p95 / p99 ms | Full >20 / >30 | Ablated load | Ablated p90 / p95 / p99 ms | Ablated >20 / >30 | >20 saving (pp) |
| --- | ---: | --- | --- | --- | --- | --- | --- | ---: |
| ao | 1 | 2.54 → 2.56 | 17.60 / 18.00 / 26.10 | 3.28% / 0.61% | 2.56 → 2.04 | 17.50 / 18.20 / 25.20 | 3.20% / 0.49% | +0.08 |
| bloom | 1 | 2.04 → 2.18 | 17.50 / 18.10 / 25.10 | 2.68% / 0.37% | 2.18 → 1.56 | 17.30 / 18.00 / 25.10 | 3.11% / 0.50% | -0.43 |
| distortion | 1 | 1.56 → 1.81 | 17.80 / 24.80 / 32.90 | 5.26% / 1.10% | 1.81 → 1.75 | 17.20 / 17.90 / 25.30 | 3.16% / 0.85% | +2.10 |
| finalAA | 1 | 1.75 → 2.18 | 17.60 / 18.10 / 33.30 | 4.66% / 1.35% | 2.18 → 2.31 | 17.40 / 18.00 / 26.30 | 3.55% / 0.98% | +1.10 |
| softDepth | 1 | 2.31 → 2.08 | 17.60 / 18.30 / 25.40 | 3.66% / 0.73% | 2.08 → 2.25 | 17.50 / 18.10 / 25.80 | 4.16% / 0.98% | -0.50 |
| atmosphereLayers | 1 | 2.25 → 1.96 | 17.50 / 18.20 / 26.30 | 4.15% / 0.98% | 1.96 → 2.05 | 17.50 / 18.10 / 25.70 | 2.92% / 0.49% | +1.23 |
| halfLightPool | 1 | 2.05 → 2.02 | 17.50 / 18.10 / 25.10 | 2.45% / 0.73% | 2.02 → 1.59 | 17.20 / 17.90 / 25.00 | 2.16% / 0.72% | +0.28 |
| contacts | 1 | 1.59 → 1.82 | 17.40 / 18.10 / 25.10 | 2.56% / 0.61% | 1.82 → 1.95 | 17.60 / 18.40 / 26.40 | 4.99% / 0.73% | -2.42 |
| silhouette | 1 | 1.95 → 1.92 | 17.30 / 18.00 / 25.70 | 3.65% / 0.61% | 1.92 → 2.09 | 17.60 / 18.20 / 25.10 | 3.44% / 0.49% | +0.21 |
| prioritySampling | 1 | 2.09 → 2.18 | 17.50 / 18.10 / 25.10 | 4.13% / 0.49% | 2.18 → 2.16 | 17.30 / 17.90 / 25.10 | 2.68% / 0.73% | +1.45 |
| floorResidues | 1 | 2.16 → 1.91 | 17.80 / 18.20 / 26.10 | 4.02% / 0.85% | 1.91 → 2.09 | 17.50 / 18.20 / 25.70 | 3.76% / 0.61% | +0.26 |
| conditions | 1 | 2.09 → 2.47 | 17.70 / 18.20 / 25.20 | 4.01% / 0.73% | 2.47 → 2.75 | 17.40 / 18.00 / 25.00 | 2.44% / 0.49% | +1.56 |
| adaptive80 | 1 | 2.75 → 2.74 | 17.40 / 18.10 / 25.20 | 3.65% / 0.73% | 2.74 → 2.74 | 17.40 / 18.10 / 25.00 | 2.80% / 0.49% | +0.84 |
| ao | 2 | 2.74 → 2.35 | 17.40 / 18.00 / 25.50 | 3.54% / 0.61% | 2.72 → 2.31 | 17.20 / 17.90 / 25.20 | 2.96% / 0.49% | +0.57 |
| bloom | 2 | 2.31 → 2.15 | 17.40 / 17.90 / 25.30 | 3.41% / 0.49% | 2.22 → 1.87 | 17.50 / 18.10 / 25.10 | 3.48% / 0.37% | -0.08 |
| distortion | 2 | 1.87 → 2.10 | 17.40 / 18.60 / 33.30 | 4.92% / 1.35% | 2.10 → 2.04 | 17.60 / 17.90 / 25.10 | 2.79% / 0.24% | +2.13 |
| finalAA | 2 | 2.04 → 2.65 | 17.50 / 18.10 / 25.20 | 3.40% / 0.73% | 2.65 → 2.29 | 17.20 / 17.80 / 25.10 | 3.05% / 0.37% | +0.35 |
| softDepth | 2 | 2.29 → 1.94 | 17.60 / 18.30 / 25.20 | 4.53% / 0.61% | 1.94 → 1.72 | 17.70 / 24.90 / 32.20 | 6.34% / 1.10% | -1.81 |
| atmosphereLayers | 2 | 1.72 → 1.57 | 17.40 / 18.10 / 25.70 | 4.02% / 0.85% | 1.57 → 1.66 | 17.60 / 18.30 / 25.80 | 4.98% / 0.61% | -0.96 |
| halfLightPool | 2 | 1.66 → 2.55 | 17.40 / 18.10 / 25.30 | 3.54% / 0.73% | 2.55 → 2.46 | 17.50 / 18.10 / 25.70 | 3.72% / 0.72% | -0.18 |
| contacts | 2 | 2.46 → 2.68 | 17.10 / 18.20 / 25.10 | 4.14% / 0.61% | 2.68 → 2.61 | 17.30 / 18.00 / 25.10 | 3.04% / 0.61% | +1.10 |
| silhouette | 2 | 2.61 → 2.35 | 17.60 / 18.30 / 26.10 | 4.74% / 0.73% | 2.35 → 2.50 | 17.30 / 17.90 / 25.00 | 1.60% / 0.37% | +3.15 |
| prioritySampling | 2 | 2.50 → 3.21 | 17.40 / 18.10 / 25.10 | 3.28% / 0.61% | 3.21 → 2.95 | 17.60 / 18.10 / 25.60 | 3.66% / 0.49% | -0.37 |
| floorResidues | 2 | 2.95 → 2.47 | 17.50 / 18.10 / 25.20 | 2.45% / 0.74% | 2.47 → 3.65 | 17.60 / 18.10 / 26.50 | 3.77% / 0.85% | -1.32 |
| conditions | 2 | 3.65 → 3.38 | 17.50 / 18.10 / 25.30 | 3.78% / 0.49% | 3.38 → 2.88 | 17.50 / 18.20 / 25.30 | 4.28% / 0.86% | -0.50 |
| adaptive80 | 2 | 2.88 → 2.65 | 17.50 / 18.00 / 25.10 | 3.28% / 0.61% | 2.65 → 2.44 | 17.40 / 18.20 / 25.80 | 3.43% / 0.98% | -0.14 |

52 trials, 0 benchmark errors, 0 resource guard misses.

### Active-condition follow-up

The standard condition ablations above measured empty condition owners. A second pair of full and visual-only ablations in each room used native Overcharged Conduits, with the condition still active in simulation on both sides.

| Room / rig | Seed | Repeat | Full load | Full p90 / p95 / p99 ms | Full >20 / >30 | Ablated load | Ablated p90 / p95 / p99 ms | Ablated >20 / >30 | >20 saving (pp) |
| --- | ---: | ---: | --- | --- | --- | --- | --- | --- | ---: |
| safety-interlock-station / pyro | 1731 | 1 | 1.55 → 2.00 | 25.00 / 26.00 / 42.50 | 18.56% / 3.40% | 1.92 → 1.86 | 25.00 / 32.40 / 50.00 | 20.21% / 5.35% | -1.65 |
| safety-interlock-station / pyro | 1731 | 2 | 1.96 → 2.09 | 25.00 / 25.40 / 50.00 | 17.45% / 3.41% | 1.92 → 1.86 | 25.10 / 26.30 / 49.80 | 21.60% / 4.40% | -4.15 |
| transmission-chamber / arc | 1729 | 1 | 1.96 → 1.77 | 17.90 / 24.70 / 26.30 | 5.84% / 0.85% | 1.79 → 2.09 | 17.80 / 23.50 / 26.60 | 5.10% / 0.85% | +0.74 |
| transmission-chamber / arc | 1729 | 2 | 2.65 → 2.67 | 17.70 / 18.20 / 25.70 | 4.48% / 0.73% | 2.54 → 2.88 | 17.60 / 18.20 / 26.20 | 2.92% / 0.97% | +1.57 |

Neither case supports removing condition visuals to meet the target. The apparent improvement in Transmission was below two percentage points.

### Production selection

The light ablation was the clear heavy-case win. Cutting the High local pool from nine to four reduced the Safety-interlock Pyro >20 ms tail by 10.72 and 13.86 percentage points. The production pool uses four slots with its existing effect-priority admission and replacement. Room practicals, key lights and the marine lamp keep their existing owners. High FXAA now checks axial contrast before reading the four diagonals. Edge pixels still take the original edge search and filtering. The full adaptive floor stays at 0.90. The 0.80 diagnostic alone still left 12.76–13.04% of intervals above 20 ms on Safety-interlock Pyro.

Two 15-second screening trials each measured Safety-interlock Pyro at 6.85% and 6.72% above 20 ms, and Transmission Arc at 3.00% and 2.40%. Safety-interlock Pyro remained over 5%; its CPU p95 was 21.10–21.90 ms. The final matrix below uses three 15-second trials per combination. Load was printed before each trial and the runner waits when the one-minute load exceeds six.

### PERF19 final matrix

| Room | Rig | Tier | Repeat | Load | p90 / p95 / p99 ms | >20 / >30 | Scale floor | Draw peak | Compiles |
| --- | --- | --- | ---: | --- | --- | --- | ---: | ---: | ---: |
| safety-interlock-station | breacher | high | 1 | 1.42 → 1.70 | 18.30 / 25.00 / 42.70 | 9.36% / 2.62% | 0.900 | 269 | 0 |
| safety-interlock-station | breacher | high | 2 | 1.70 → 1.85 | 17.50 / 24.90 / 41.70 | 5.90% / 1.60% | 0.900 | 260 | 0 |
| safety-interlock-station | breacher | high | 3 | 1.85 → 2.56 | 18.10 / 25.00 / 41.70 | 9.49% / 2.87% | 0.900 | 265 | 0 |
| safety-interlock-station | breacher | low | 1 | 2.56 → 2.75 | 17.60 / 18.50 / 41.60 | 4.83% / 1.69% | 1.000 | 257 | 0 |
| safety-interlock-station | breacher | low | 2 | 2.75 → 2.87 | 17.20 / 18.20 / 41.60 | 4.22% / 1.57% | 1.000 | 252 | 0 |
| safety-interlock-station | breacher | low | 3 | 2.87 → 2.87 | 17.60 / 18.30 / 50.00 | 4.35% / 1.45% | 1.000 | 254 | 0 |
| safety-interlock-station | cryo | high | 1 | 2.87 → 3.34 | 17.90 / 24.90 / 33.20 | 7.02% / 1.09% | 0.900 | 284 | 0 |
| safety-interlock-station | cryo | high | 2 | 3.34 → 3.05 | 17.70 / 18.20 / 33.30 | 4.38% / 1.09% | 0.900 | 283 | 0 |
| safety-interlock-station | cryo | high | 3 | 3.05 → 3.25 | 17.50 / 18.30 / 33.50 | 4.89% / 1.59% | 0.900 | 284 | 0 |
| safety-interlock-station | cryo | low | 1 | 3.25 → 2.79 | 17.40 / 18.10 / 25.90 | 2.72% / 0.83% | 1.000 | 272 | 0 |
| safety-interlock-station | cryo | low | 2 | 2.79 → 2.67 | 17.20 / 17.90 / 26.30 | 1.78% / 0.83% | 1.000 | 272 | 0 |
| safety-interlock-station | cryo | low | 3 | 2.67 → 2.09 | 17.30 / 18.00 / 33.30 | 2.86% / 1.07% | 1.000 | 269 | 0 |
| safety-interlock-station | pyro | high | 1 | 2.09 → 2.08 | 24.50 / 25.00 / 33.30 | 10.78% / 1.38% | 0.900 | 301 | 0 |
| safety-interlock-station | pyro | high | 2 | 2.08 → 2.45 | 18.10 / 25.00 / 33.40 | 9.28% / 2.35% | 0.900 | 302 | 0 |
| safety-interlock-station | pyro | high | 3 | 2.45 → 2.20 | 18.10 / 25.00 / 34.20 | 7.77% / 2.10% | 0.900 | 309 | 0 |
| safety-interlock-station | pyro | low | 1 | 2.20 → 2.55 | 17.60 / 18.20 / 33.30 | 3.92% / 1.31% | 1.000 | 289 | 0 |
| safety-interlock-station | pyro | low | 2 | 2.55 → 2.67 | 17.40 / 18.20 / 32.70 | 3.67% / 1.07% | 1.000 | 279 | 0 |
| safety-interlock-station | pyro | low | 3 | 2.67 → 3.04 | 17.60 / 18.20 / 25.10 | 2.96% / 0.71% | 1.000 | 273 | 0 |
| safety-interlock-station | arc | high | 1 | 3.04 → 2.54 | 17.30 / 17.90 / 25.70 | 3.38% / 0.97% | 0.900 | 289 | 0 |
| safety-interlock-station | arc | high | 2 | 2.54 → 2.48 | 17.40 / 17.90 / 25.00 | 2.04% / 0.48% | 0.900 | 293 | 0 |
| safety-interlock-station | arc | high | 3 | 2.48 → 2.57 | 17.40 / 17.90 / 25.10 | 3.00% / 0.60% | 0.900 | 282 | 0 |
| safety-interlock-station | arc | low | 1 | 2.57 → 2.40 | 17.30 / 18.00 / 25.00 | 2.56% / 0.35% | 1.000 | 278 | 0 |
| safety-interlock-station | arc | low | 2 | 2.40 → 2.77 | 17.10 / 17.70 / 25.10 | 1.77% / 0.59% | 1.000 | 272 | 0 |
| safety-interlock-station | arc | low | 3 | 2.77 → 2.52 | 17.10 / 18.10 / 25.10 | 1.65% / 0.71% | 1.000 | 278 | 0 |
| transmission-chamber | breacher | high | 1 | 2.52 → 2.65 | 17.20 / 18.00 / 33.40 | 3.53% / 1.34% | 0.900 | 151 | 0 |
| transmission-chamber | breacher | high | 2 | 2.65 → 2.51 | 17.60 / 18.30 / 33.30 | 4.87% / 1.46% | 0.900 | 156 | 0 |
| transmission-chamber | breacher | high | 3 | 2.51 → 2.71 | 17.40 / 18.20 / 33.50 | 4.02% / 1.46% | 0.900 | 149 | 0 |
| transmission-chamber | breacher | low | 1 | 2.71 → 2.72 | 17.30 / 18.10 / 33.30 | 2.63% / 1.07% | 1.000 | 137 | 0 |
| transmission-chamber | breacher | low | 2 | 2.72 → 2.39 | 17.20 / 17.90 / 32.60 | 2.51% / 1.20% | 1.000 | 142 | 0 |
| transmission-chamber | breacher | low | 3 | 2.39 → 2.07 | 17.00 / 17.70 / 33.20 | 1.79% / 1.08% | 1.000 | 138 | 0 |
| transmission-chamber | cryo | high | 1 | 2.07 → 1.57 | 17.40 / 18.10 / 26.50 | 3.24% / 0.96% | 0.900 | 156 | 0 |
| transmission-chamber | cryo | high | 2 | 1.57 → 1.69 | 17.20 / 17.80 / 25.00 | 2.17% / 0.48% | 0.900 | 157 | 0 |
| transmission-chamber | cryo | high | 3 | 1.69 → 1.68 | 17.50 / 18.00 / 33.30 | 3.51% / 1.57% | 0.900 | 159 | 0 |
| transmission-chamber | cryo | low | 1 | 1.68 → 2.37 | 17.20 / 17.80 / 25.00 | 1.65% / 0.47% | 1.000 | 147 | 0 |
| transmission-chamber | cryo | low | 2 | 2.37 → 2.56 | 17.20 / 17.80 / 25.10 | 1.88% / 0.59% | 1.000 | 139 | 0 |
| transmission-chamber | cryo | low | 3 | 2.56 → 2.63 | 17.30 / 18.00 / 25.00 | 2.24% / 0.71% | 1.000 | 141 | 0 |
| transmission-chamber | pyro | high | 1 | 2.63 → 2.49 | 17.70 / 18.10 / 26.60 | 3.49% / 0.84% | 0.900 | 170 | 0 |
| transmission-chamber | pyro | high | 2 | 2.49 → 2.03 | 17.40 / 18.20 / 25.10 | 2.65% / 0.84% | 0.900 | 171 | 0 |
| transmission-chamber | pyro | high | 3 | 2.03 → 2.17 | 17.60 / 18.20 / 25.70 | 3.12% / 0.72% | 0.900 | 169 | 0 |
| transmission-chamber | pyro | low | 1 | 2.17 → 1.94 | 17.00 / 17.60 / 25.00 | 1.76% / 0.35% | 1.000 | 154 | 0 |
| transmission-chamber | pyro | low | 2 | 1.94 → 2.12 | 17.20 / 17.80 / 25.00 | 1.64% / 0.35% | 1.000 | 155 | 0 |
| transmission-chamber | pyro | low | 3 | 2.12 → 2.50 | 17.10 / 17.70 / 24.90 | 1.41% / 0.47% | 1.000 | 160 | 0 |
| transmission-chamber | arc | high | 1 | 2.50 → 2.41 | 17.20 / 18.10 / 25.10 | 2.88% / 0.60% | 0.900 | 167 | 0 |
| transmission-chamber | arc | high | 2 | 2.41 → 2.11 | 17.20 / 18.00 / 26.00 | 3.00% / 0.96% | 0.900 | 166 | 0 |
| transmission-chamber | arc | high | 3 | 2.11 → 2.55 | 17.10 / 17.80 / 25.10 | 2.64% / 0.48% | 0.900 | 169 | 0 |
| transmission-chamber | arc | low | 1 | 2.55 → 2.44 | 17.00 / 17.90 / 25.00 | 1.53% / 0.23% | 1.000 | 155 | 0 |
| transmission-chamber | arc | low | 2 | 2.44 → 3.16 | 17.50 / 18.20 / 25.10 | 3.17% / 0.47% | 1.000 | 155 | 0 |
| transmission-chamber | arc | low | 3 | 3.16 → 3.56 | 17.30 / 18.00 / 25.00 | 2.12% / 0.35% | 1.000 | 155 | 0 |

High median per-trial >20 share was 3.52%, median per-trial p95 was 18.20 ms, and 17 of 24 trials were below 5%.

Low median per-trial >20 share was 2.37%, median per-trial p95 was 18.00 ms, and 24 of 24 trials were below 5%.

### Visual review, campaign and remaining tail

All 32 matched frames passed capture guards at 1920×1080 and are paired at native size and at 480×270 per panel. Eighteen pairs are byte-identical, including the Relay Racks crowd and heavy Communal Atrium. The active Pyro overlap has some weaker amber spill on nearby chitin and deck. Railbreaker and Overclock have slightly different launch highlights near the marine. Later Overdrive frames retain their aftermaths, and red warning edges, ink contours and the marine remain readable at both sizes. These fixtures cover matched gameplay framing and isolate visual changes with adaptive scaling disabled on both builds.

The production build passed. Pyro cleared all four requested rooms on seed 1729 with zero errors. The final matrix peaked at 309 draws. Every trial held a 16.7 ms median, retained scale at or above 0.90, and had zero combat program creations or benchmark errors.

Safety-interlock High remained over 5% in all Breacher and Pyro trials and one Cryo trial. Pyro finished at 7.77–10.78% and 25.0 ms p95, with 21.8–23.5 ms CPU p95. That CPU tail leaves room for additional gains even if GPU shading gets cheaper. The runs establish a reduction in repeated misses, with further work needed to close the heaviest case. Low's final 18.0 ms median p95 and 2.37% median late share compare with 17.9 ms and 1.94% in PERF18's longer trials. All final Low trials met the 5% target. The High light capacity and FXAA changes do not apply to Low.

[Pyro ablations](../../artifacts/nextgen/perf19/ablation-pyro/benchmark.json) · [Arc ablations](../../artifacts/nextgen/perf19/ablation-arc/benchmark.json) · [Final matrix](../../artifacts/nextgen/perf19/final/benchmark.json) · [Matched frames](../../artifacts/nextgen/perf19/pairs) · [Pyro playtest](../../artifacts/nextgen/perf19/playtest-pyro/report.json)

## PERF22

### Attribution

The baseline freezes 8500276f. All combat measurements use the M1 Pro at 1920×1080 with 15-second trials. Safety-interlock Pyro reproduced 7.48–9.58% frames over 20 ms. Safety-interlock Arc reproduced 6.08–9.09%. Two Transmission Low rows that crossed load 4 were repeated. The table shows full High immediately before each ablation. Savings are percentage points of the frame distribution.

| Ablation | Pair | Full load | Full >20 ms | Off load | Off >20 ms | Saving (pp) |
| --- | ---: | --- | ---: | --- | ---: | ---: |
| surfacePaint | 1 | 3.39 → 2.68 | 9.23% | 2.68 → 2.66 | 10.98% | -1.76 |
| inkWear | 1 | 2.66 → 2.46 | 9.02% | 2.46 → 2.42 | 9.17% | -0.15 |
| prioritySampling | 1 | 2.42 → 2.40 | 10.89% | 2.40 → 2.44 | 9.27% | +1.61 |
| flameSprites | 1 | 2.44 → 2.74 | 8.30% | 2.74 → 2.77 | 11.56% | -3.26 |
| floorSkins | 1 | 2.77 → 2.94 | 10.12% | 2.94 → 2.36 | 9.12% | +1.00 |
| surfacePaint | 2 | 2.36 → 2.17 | 7.69% | 2.17 → 2.33 | 10.06% | -2.37 |
| inkWear | 2 | 2.33 → 2.72 | 12.68% | 2.72 → 3.31 | 9.99% | +2.69 |
| prioritySampling | 2 | 3.31 → 3.21 | 13.47% | 3.21 → 4.44 | 9.51% | +3.96 (load miss) |
| flameSprites | 2 | 3.80 → 3.53 | 13.98% | 3.53 → 3.59 | 8.30% | +5.67 |
| floorSkins | 2 | 3.59 → 3.20 | 7.96% | 3.20 → 3.51 | 8.94% | -0.98 |
| prioritySampling | 1 | 2.29 → 2.59 | 8.97% | 2.59 → 2.86 | 9.46% | -0.50 |
| prioritySampling | 2 | 2.86 → 2.78 | 8.56% | 2.78 → 3.17 | 11.92% | -3.36 |

Paint removal made the tail worse in both pairs. The ink-wear, flame-batch and floor-skin results changed sign. Mask sampling removal also changed sign across quiet repeats. It disables mask sampling and its alpha yield together, while keeping the CPU raster active, so the result includes any change in overdraw. Flame removal hides the instanced flame draw, leaving shared ember sparks and procedural floor fire active. Floor-skin removal targets the named deck wear, service lane and threshold overlays.

Baseline High Safety-interlock Pyro update p95 was 10.6–13.0 ms, versus 5.6–6.1 ms for Arc. An instrumented Pyro run at load 2.84 → 2.44 found the most frequent application leaf samples in the polygon containment and traversal code. The minified profile was attributed by matching its generated offsets to the preserved bundle. Gameplay update time rose on Pyro in both tiers. The ablation pairs did not isolate a repeatable render saving, so the first production change targets redundant collision-query work without changing the predicates.

### Changes

Traversal now checks continuous polygon clearance once instead of separately checking polygon clearance at each endpoint and again for the sweep. A swept bounding box rejects distant rectangular blockers before their existing exact endpoint, slab and corner tests. Immutable void polygons also reuse their bounds to reject disjoint sweeps before containment or edge work. Mutable topology still uses the exact polygon path. These queries preserve continuous concave geometry, endpoint clearance and tangency without changing collision shapes.

In two isolated Safety-interlock Pyro screening trials, the traversal change alone measured 8.35% and 8.97% above 20 ms at loads 2.34 → 2.11 and 2.11 → 2.02. With the void bounds added, the same two observations were 8.26% and 7.15% at loads 2.22 → 1.99 and 1.99 → 2.09. CPU p95 fell from 20.20–20.90 ms to 19.10–20.10 ms in these separate live runs.

### Final combat and warm preparation

Both matrices used the same 15-second production command, with two repeats per room, rig and tier. The final table substitutes quiet reruns for the two baseline Transmission Arc Low rows and the after Safety-interlock Arc High second row that exceeded load 4. The original measurements remain in the raw logs. Draws are peaks and compiles are combat program creations.

| Room | Rig | Tier | Repeat | Before load | Before >20 | Before p95 ms | Before update p95 | Before draws / compiles | After load | After >20 | After p95 ms | After update p95 | After draws / compiles |
| --- | --- | --- | ---: | --- | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: |
| safety-interlock-station | pyro | high | 1 | 2.18 → 3.02 | 9.58% | 25.00 | 13.00 | 306 / 0 | 1.89 → 2.10 | 7.98% | 25.00 | 6.90 | 296 / 0 |
| safety-interlock-station | pyro | high | 2 | 3.02 → 2.99 | 7.48% | 25.00 | 10.60 | 297 / 0 | 2.10 → 2.76 | 11.59% | 25.10 | 7.60 | 292 / 0 |
| safety-interlock-station | pyro | low | 1 | 2.99 → 2.43 | 3.70% | 18.10 | 10.80 | 285 / 0 | 2.76 → 3.23 | 1.67% | 17.70 | 3.70 | 290 / 0 |
| safety-interlock-station | pyro | low | 2 | 2.43 → 2.43 | 3.49% | 18.00 | 10.50 | 289 / 0 | 3.23 → 2.72 | 1.44% | 18.00 | 4.20 | 296 / 0 |
| safety-interlock-station | arc | high | 1 | 2.43 → 2.80 | 6.08% | 25.00 | 5.60 | 279 / 0 | 2.72 → 2.67 | 4.51% | 18.30 | 2.50 | 288 / 0 |
| safety-interlock-station | arc | high | 2 | 2.80 → 2.84 | 9.09% | 25.00 | 6.10 | 304 / 0 | 1.84 → 2.32 | 5.22% | 23.60 | 2.30 | 292 / 0 |
| safety-interlock-station | arc | low | 1 | 2.84 → 2.97 | 2.25% | 17.80 | 6.10 | 279 / 0 | 3.51 → 3.17 | 1.69% | 17.80 | 2.60 | 275 / 0 |
| safety-interlock-station | arc | low | 2 | 2.97 → 2.36 | 2.01% | 18.00 | 6.10 | 282 / 0 | 3.17 → 2.86 | 1.55% | 17.70 | 2.50 | 279 / 0 |
| transmission-chamber | pyro | high | 1 | 2.36 → 2.26 | 5.11% | 23.50 | 11.40 | 165 / 0 | 2.86 → 3.14 | 4.64% | 18.20 | 8.80 | 166 / 0 |
| transmission-chamber | pyro | high | 2 | 2.26 → 2.80 | 7.19% | 24.90 | 8.90 | 164 / 0 | 3.14 → 2.92 | 3.49% | 18.10 | 9.50 | 169 / 0 |
| transmission-chamber | pyro | low | 1 | 2.80 → 2.42 | 1.57% | 17.90 | 12.10 | 149 / 0 | 2.92 → 2.53 | 1.32% | 17.80 | 11.60 | 146 / 0 |
| transmission-chamber | pyro | low | 2 | 2.42 → 2.72 | 1.44% | 18.00 | 10.80 | 149 / 0 | 2.53 → 2.36 | 1.44% | 17.70 | 11.70 | 152 / 0 |
| transmission-chamber | arc | high | 1 | 2.72 → 3.87 | 5.35% | 24.70 | 4.00 | 161 / 0 | 2.36 → 2.29 | 3.84% | 18.20 | 2.60 | 160 / 0 |
| transmission-chamber | arc | high | 2 | 3.87 → 3.66 | 4.10% | 18.20 | 3.80 | 161 / 0 | 2.29 → 1.97 | 4.83% | 18.50 | 3.40 | 163 / 0 |
| transmission-chamber | arc | low | 1 | 2.88 → 2.96 | 2.04% | 17.90 | 3.70 | 149 / 0 | 1.97 → 2.20 | 1.56% | 17.70 | 2.60 | 149 / 0 |
| transmission-chamber | arc | low | 2 | 2.96 → 2.91 | 2.04% | 17.90 | 3.90 | 149 / 0 | 2.20 → 2.03 | 1.80% | 18.20 | 2.80 | 149 / 0 |

| Warm revisit | Before load | Before hold | After load | After hold |
| --- | --- | ---: | --- | ---: |
| Safety-interlock Station | 2.41 → 2.37 | 1,176.9 ms | 1.95 → 1.95 | 1,174.4 ms |
| Transmission Chamber | 2.37 → 2.37 | 1,240.6 ms | 1.95 → 1.95 | 1,251.3 ms |

Transmission's warm hold was 10.7 ms longer in the single matched revisit. Both rooms retained the same program inventory and recorded zero combat compiles. This comparison does not establish a repeatable loading change.

Safety-interlock Pyro still missed 7% in both repeats. Its CPU p95 improved from 21.1–22.3 ms to 19.4–19.9 ms, while its frame p95 remained about 25 ms. Transmission's four High trials came in below 5%. Low stayed under 2% in all eight final trials. The maximum after draw count was below 330, with zero combat compiles.

### Native visual and campaign verification

Both builds produced all 22 requested 1920×1080 frames with adaptive resolution held fixed. The Armory incident fixture stages the marine in a legal gap facing the carousel using the normal gameplay camera. The native side-by-sides and 480×270 panels show no visible change to the painted surfaces, floor markings, warning yield, or fire effects. Ten pairs are byte-identical. The other twelve differ by at most three decoded pixels per image. One Relay Racks pixel differs by ten channel values, and the other changed pixels differ by at most one.

The production build passed. The native fast Pyro run on seed 1729 cleared twelve rooms with zero errors, through Safety-interlock Station. Its Safety-interlock hold was 922 ms at load 2.43 → 2.43.

The remaining frame target is concentrated in Safety-interlock High. Pyro still exceeded 20 ms in 7.98% and 11.59% of frames, and one quiet Arc run reached 5.22%. High stayed at or above 0.90 adaptive scale and the final peak was 296 draws. The work reduced update cost without a reproducible Pyro frame-tail improvement in this room. Arc made no soft-depth copies, while Pyro demanded one on essentially every rendered frame. That establishes a workload difference, with no isolated timing attribution for the residual GPU cost.

[Baseline matrix](../../artifacts/nextgen/perf22/before/benchmark.json) · [Ablations](../../artifacts/nextgen/perf22/ablation/benchmark.json) · [Final matrix](../../artifacts/nextgen/perf22/after/benchmark.json) · [Matched native frames](../../artifacts/nextgen/perf22/pairs) · [Pyro campaign](../../artifacts/nextgen/perf22/playtest-pyro/report.json)

### Exactness follow-up and baseline provenance

Breacher seed 7 ran the baseline and optimized collision routines on the same inputs. It found zero differences in 7,149,109 calls. Both builds finish that seed with 18 clears. There is no differing collision input to report from that run.

The questioned totals match the PLAY22 column in the historical report. The authoritative rerun pins game source to `8500276f` and reads the matching actor models. Between PLAY22's `b72b4341` and `8500276f`, the Spitter and Carrier GLBs changed, while the simulator and game source stayed the same. The headless observer reads actor dimensions from those files and uses them for HUD contact framing and pointer hit proxies. Changing only the model input to the older revision in a scratch copy of the runner restored Breacher seeds 256 and 4096 from 11 clears to 20 on the same `8500276f` game code. The observed height inputs changed from 1.72805 to 1.72663 for Spitter and 2.36983 to 2.35819 for Carrier. This reproduces an outcome difference independently of the collision optimization.

[Historical model replay](../../artifacts/nextgen/perf22/exact/old-model.log) · [Actor metrics](../../artifacts/nextgen/perf22/exact/model-metrics.json) · [PLAY22 cohort](PLAY22-REPORT.md)

### Full-cohort collision parity

The temporary dual-call harness compared the return values from the checked-in fast path and the `8500276f` functions for every observed query. The stock runner separately ran the pinned baseline. Both used twelve Standard competent seeds per rig, the same policy and the same current model inputs. All 48 run reports match on gameplay fields, including per-room records, weapon use, deaths and final state. The compared fields exclude wall-clock duration and source provenance.

The harness recorded zero mismatches in 333,869,786 comparisons. This includes 193,922,155 polygon sweeps, 36,258,751 point-occupancy queries, 82,493,358 traversal queries and 21,195,522 line-of-sight queries. Each comparison calls both implementations with the same input objects, including shared endpoint identity for point sweeps. The harness stays outside tracked source. The collision fast path is retained as measured.

| Rig | Completed on both builds | Clears before each death, in seed order |
| --- | ---: | --- |
| Breacher | 6/12 | 18, 18, 11, 19, 11, 18 |
| Cryo | 11/12 | 13 |
| Pyro | 10/12 | 14, 10 |
| Arc | 11/12 | 15 |

[Parity totals](../../artifacts/nextgen/perf22/exact/parity.json) · [Pinned baseline](../../artifacts/nextgen/playtest/perf22-exact-base/summary.json) · [Dual-call cohort](../../artifacts/nextgen/playtest/perf22-search-diff/summary.json)

### Quiet remeasurement of the verified fast path

The 16 after trials use a new production build with the verified collision code and the same 1920×1080, 15-second benchmark settings. The baseline column uses the original quiet PERF22 baseline, including its two quiet Low replacements. One new Transmission Pyro Low trial finished at load 7.62 and was replaced by its quiet rerun. The table records one-minute load at both ends of each accepted measurement.

| Room | Rig | Tier | Repeat | Before load | Before >20 | Before p95 ms | Before update p95 | Before draws / compiles | After load | After >20 | After p95 ms | After update p95 | After draws / compiles |
| --- | --- | --- | ---: | --- | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: |
| safety-interlock-station | pyro | high | 1 | 2.18 → 3.02 | 9.58% | 25.00 | 13.00 | 306 / 0 | 2.03 → 2.37 | 10.09% | 25.00 | 9.80 | 300 / 0 |
| safety-interlock-station | pyro | high | 2 | 3.02 → 2.99 | 7.48% | 25.00 | 10.60 | 297 / 0 | 2.37 → 2.20 | 8.77% | 25.00 | 4.40 | 301 / 0 |
| safety-interlock-station | pyro | low | 1 | 2.99 → 2.43 | 3.70% | 18.10 | 10.80 | 285 / 0 | 2.20 → 2.57 | 1.79% | 17.90 | 3.50 | 295 / 0 |
| safety-interlock-station | pyro | low | 2 | 2.43 → 2.43 | 3.49% | 18.00 | 10.50 | 289 / 0 | 2.57 → 2.61 | 1.80% | 17.90 | 8.70 | 281 / 0 |
| safety-interlock-station | arc | high | 1 | 2.43 → 2.80 | 6.08% | 25.00 | 5.60 | 279 / 0 | 2.61 → 3.48 | 7.73% | 25.00 | 2.60 | 303 / 0 |
| safety-interlock-station | arc | high | 2 | 2.80 → 2.84 | 9.09% | 25.00 | 6.10 | 304 / 0 | 3.48 → 3.05 | 6.71% | 24.90 | 2.40 | 279 / 0 |
| safety-interlock-station | arc | low | 1 | 2.84 → 2.97 | 2.25% | 17.80 | 6.10 | 279 / 0 | 3.05 → 3.14 | 1.66% | 18.00 | 2.60 | 282 / 0 |
| safety-interlock-station | arc | low | 2 | 2.97 → 2.36 | 2.01% | 18.00 | 6.10 | 282 / 0 | 3.14 → 2.85 | 1.90% | 17.70 | 3.40 | 275 / 0 |
| transmission-chamber | pyro | high | 1 | 2.36 → 2.26 | 5.11% | 23.50 | 11.40 | 165 / 0 | 2.85 → 2.96 | 6.78% | 24.90 | 8.90 | 176 / 0 |
| transmission-chamber | pyro | high | 2 | 2.26 → 2.80 | 7.19% | 24.90 | 8.90 | 164 / 0 | 2.96 → 2.87 | 6.24% | 24.80 | 7.30 | 172 / 0 |
| transmission-chamber | pyro | low | 1 | 2.80 → 2.42 | 1.57% | 17.90 | 12.10 | 149 / 0 | 2.87 → 3.05 | 2.03% | 18.20 | 12.20 | 156 / 0 |
| transmission-chamber | pyro | low | 2 | 2.42 → 2.72 | 1.44% | 18.00 | 10.80 | 149 / 0 | 3.14 → 3.27 | 36.04% | 33.80 | 12.50 | 146 / 0 |
| transmission-chamber | arc | high | 1 | 2.72 → 3.87 | 5.35% | 24.70 | 4.00 | 161 / 0 | 3.58 → 3.15 | 3.84% | 18.20 | 3.60 | 163 / 0 |
| transmission-chamber | arc | high | 2 | 3.87 → 3.66 | 4.10% | 18.20 | 3.80 | 161 / 0 | 3.15 → 2.86 | 2.60% | 18.10 | 2.80 | 161 / 0 |
| transmission-chamber | arc | low | 1 | 2.88 → 2.96 | 2.04% | 17.90 | 3.70 | 149 / 0 | 2.86 → 3.27 | 1.68% | 18.00 | 2.40 | 149 / 0 |
| transmission-chamber | arc | low | 2 | 2.96 → 2.91 | 2.04% | 17.90 | 3.90 | 149 / 0 | 3.27 → 2.80 | 1.80% | 17.90 | 3.80 | 149 / 0 |

The first Low replacement passed the load cutoff but produced a 36.04% tail at load 3.14 → 3.27. It stays in the table. Two confirmation trials on the same build measured 1.46% at 2.80 → 2.65 and 1.20% at 2.65 → 3.32, both at 17.70 ms p95. The isolated result did not reproduce and its cause is unresolved. The final matrix peaked at 303 draws and had zero combat compiles.

The build passed, and the repeated fast native Pyro run on seed 1729 cleared all twelve rooms with zero errors. Safety-interlock Pyro still records 8.77–10.09% of frames above 20 ms and 25.0 ms frame p95, despite update p95 dropping from 10.6–13.0 ms to 4.4–9.8 ms. Frame p50 held at 16.7 ms and the combat program count stayed flat. Safety-interlock Arc and Transmission Pyro also missed the late-share goal in this rerun.

The remaining Safety-interlock Pyro pattern is consistent with expensive High GPU rendering at the adaptive floor of 0.90. At the two loads in the table, the combined main-thread p95 was 20.8 and 18.8 ms while raw GPU query medians were 49.26 and 47.49 ms. The GPU values reflect queue scheduling as well as execution and cannot isolate fill, soft-depth copies, or another individual pass. The quiet ablations did not justify removing any of the reviewed art. The cheapest next candidate is a lower High internal-resolution floor in this room class during sustained misses. That would trade some sharpness and needs its own matched screenshots and timing run. Accepting this room's residual tail preserves the current presentation.

[Exact-path remeasurement](../../artifacts/nextgen/perf22/exact/final/benchmark.json) · [Quiet Low replacement](../../artifacts/nextgen/perf22/exact/final-low-retry/benchmark.json) · [Low confirmation trials](../../artifacts/nextgen/perf22/exact/final-low-check/benchmark.json) · [Repeated Pyro campaign](../../artifacts/nextgen/playtest/perf22-exact-pyro/report.json)

## PERF25

### Reproduction

The M1 Pro ran the November 24, 2026 production builds of `9aefc2a3` and `b74bfa28` back to back at 1920×1080. Both used the same 25-enemy benchmark, with 15 seconds per trial. The older build used a separate dist built from its own source and assets. The renderer stayed on the production adaptive scale. CPU update p95 includes the fixture driver.

| Safety-interlock Pyro High | Load before → after | Frames over 20 ms | CPU update / render p95 (ms) | Peak draws | Combat compiles |
| --- | --- | ---: | ---: | ---: | ---: |
| Previous 1 | 2.19 → 2.47 | 4.59% | 4.80 / 12.00 | 294 | 0 |
| Previous 2 | 2.47 → 3.16 | 4.61% | 4.20 / 11.30 | 299 | 0 |
| Current 1 | 3.80 → 3.48 | 5.89% | 4.10 / 12.50 | 292 | 0 |
| Current 2 | 3.48 → 3.02 | 7.31% | 4.50 / 11.10 | 293 | 0 |

Safety-interlock Pyro High reproduced a 1.30 and 2.70 percentage-point increase with overlapping CPU update and render p95. Safety-interlock Pyro Low measured 1.42–1.54% in the previous build at loads 3.16 → 3.32 and 3.32 → 2.96, and 1.30–1.55% in the current build at loads 3.02 → 2.82 and 2.82 → 3.13.

Other Chromium sessions were active by the Safety-interlock Arc Low trials. The second Arc Low run reached load 3.94 → 5.01 and 32.91% over 20 ms. Transmission High trials overlapped that activity. The lead changed the remaining protocol to interleaved trials without waiting for a fixed load threshold. Each High comparison uses full, candidate, full, candidate in sequence. A comparison is discarded when the two full-High tail shares differ by more than one-third of the smaller share. The raw sequential matrices retain the interference.

[Previous production results](../../artifacts/nextgen/perf25-previous/benchmark.json) · [Current production results](../../artifacts/nextgen/perf25-current/benchmark.json)

### Attribution

The candidates were separate production builds of the current source and assets. The creature finish candidate used the existing post-processed diffuse value for zone selection and restored the previous ink shader. The room candidate restored the previous lane props, practical placement, deck-light bake and deck wash. The waiting candidate returned waiting actors to idle presentation and suppressed their feint pose, while the simulation kept native movement and attack decisions. The warning candidate skipped feint outlines and the exposed-recovery brackets. Each trial recorded Warden presence from the native enemy snapshots. None of the measured trials included a Warden.

| Safety-interlock Pyro High candidate | Pair | Full load | Full >20 ms | Candidate load | Candidate >20 ms | Saving (pp) |
| --- | ---: | --- | ---: | --- | ---: | ---: |
| finish | 1 | 6.48 → 8.13 | 5.68% | 8.13 → 9.85 | 86.71% | -81.03 (discarded) |
| finish | 2 | 9.85 → 12.01 | 84.87% | 12.01 → 13.90 | 88.76% | -3.89 (discarded) |
| room | 1 | 14.18 → 13.86 | 89.77% | 13.86 → 12.14 | 92.25% | -2.48 |
| room | 2 | 12.14 → 13.92 | 90.95% | 13.92 → 13.87 | 91.41% | -0.46 |
| waiting | 1 | 13.64 → 10.63 | 94.51% | 10.63 → 9.06 | 98.03% | -3.51 |
| waiting | 2 | 9.06 → 8.29 | 93.46% | 8.29 → 11.47 | 93.53% | -0.06 |
| warnings | 1 | 12.47 → 11.50 | 95.05% | 11.50 → 12.79 | 95.49% | -0.45 |
| warnings | 2 | 12.79 → 11.40 | 95.45% | 11.40 → 9.57 | 93.40% | 2.05 |
| finish retry | 1 | 10.39 → 13.14 | 96.92% | 13.14 → 10.18 | 92.08% | +4.84 |
| finish retry | 2 | 10.18 → 9.05 | 92.59% | 9.05 → 8.69 | 94.07% | -1.48 |

The first creature finish comparison failed the full-High agreement rule. Its retry moved in opposite directions across the two pairs. Room dressing added no measurable tail savings when removed. Waiting animation and the new warnings also showed no repeatable improvement when removed. The accepted comparisons occurred during load spikes and most frames already exceeded 20 ms. The small pair differences at that saturation cannot establish cost near the shipping target.

Room25 kept the existing High four-slot light pool. The second housing in Transmission uses baked spill and the existing landmark key. Disabling the new hardware and restoring its light placement did not reduce the shader light count.
