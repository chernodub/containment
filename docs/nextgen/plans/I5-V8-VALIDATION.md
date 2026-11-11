# I5 mode-v8 fixed validation extension

Declared before running or reading any new validation outcome. The initial matched20-seed/rig cohorts have baseline68/80 (85%) and current41/80 (51.25%). Current rig rates are60/60/35/50%; Pyro is16.25 points below the mean, a single-campaign boundary at20-seed resolution. The existing numbers remain unchanged while a larger fixed sample checks this near-boundary result.

Use one additional fixed20-seed set for EVERY rig in BOTH profiles. Generate it using xorshift32, initial0x49355638, shifts13/17/5 with unsigned32-bit arithmetic. The exact seeds are:

2646007777, 2400273476, 1420519048, 926231573, 3293539470, 302625857, 3031516705, 315632507, 3763819556, 1353316589, 2570684887, 2825160470, 676147701, 1074335564, 1576486972, 719510212, 1190535481, 3640216177, 3344254954, 2595108862

Retain every original20 and new20 attempt:40seeds per rig,160campaigns per profile,320 total. Report initial, validation and combined distributions; do not select the better subset or silently discard censors/deaths. This is one predeclared extension; do not keep adding seeds merely until a threshold passes. If combined targets still miss, make a measured balance adjustment and repeat a controlled candidate cohort.

Frozen backend b6cac5f788451b162c61240896d3a846749e0de5, backendHash63b80de0fedf804ff871b6ba1f2c75ea9afcb6b1be9ffcf338a2efe19affcde0; shared native policy remains e97cf06107c6e23f9f7b96ac94f8b95ba3e7163d. Baseline gameplay c3bd53b; current gameplay f496476 (same selected V30 numbers). Use the same backend, actor metrics, assistance=false, graphv3 and bounded waits in both profiles. Code and numbers remain frozen until both validation batches finish.

Acceptance uses pooled completion40–60%, maximum rig distance15points, every-rig median rooms/Overdrive1.2–1.7 and zero strict ordinary cap violations; pooled ordinary30–45s and Transmission60–75s, broad/per-rig timing values exposed; welcoming firstfive rooms and pooled incoming damage rising by act; original full-kit30–45%/1.25x and per-act basic-crawler TTK<=1.15x guards unchanged. Native8calibration stays separate (same immutable f496 build); the extension does not change its game or policy.
