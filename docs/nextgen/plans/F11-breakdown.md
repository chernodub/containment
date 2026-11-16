# F11 breakdown status

The existing benchmark already owns asynchronous GPU pass queries, draw/state/fill counters and CDP CPU/heap capture. The additive `--breakdown` mode enables all three and writes per-run Markdown alongside benchmark.json and raw profiles. CPU attribution uses exclusive leaf samples; bundled/minified or unidentified frames stay unattributed. These samples are not deterministic subsystem instrumentation.

Planned measurement matrix: coolant-plant, crew-checkpoint, relay-racks, transmission-chamber, freight-hold, overload-floor; breacher and arc; high and low. Retain host load for every trial. GPU queries can also suffer contention; draw counts and target pixels are the strongest load-independent evidence. Never sum independently sampled GPU percentiles.

Execution blocked at dependency installation: npm ci reports missing @emnapi/runtime in package-lock.json. No ranked measurements or optimisation claims are available. No renderer changes were made without measurements.
