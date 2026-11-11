# S2 audio review evidence

Run `node scripts/nextgen/audio-evidence.mjs` from the repository root to regenerate the complete local gallery. Full run: 257 WAV/PNG pairs, no assertion failures or browser errors. The complete ~102 MiB gallery exists in this worktree; this branch commits eight representative pairs, the audition screenshot, all measurements and gate logs. Other inventory links become available after regeneration in another checkout.

- `inventory.md`: complete per-cue peak/RMS/duration table.
- `inventory.csv`: machine-readable compact inventory.
- `inventory.json`: raw/rendered metrics, family/bus, centroid, DC, endpoints, loop seam metrics, worker initialization and dense-fight measurements.
- `review.html`: eight committed waveform/spectrogram images and WAV players.
- `gates/`: actual command logs, including failures (aggregate verify lacks Blender; unmodified smoke collects aborted GLBs; the supplied two-line readiness patch passes the same gate).

The audio audition is `scripts/nextgen/audio-audition.html`, served by Vite dev only. No listening-quality or real-hardware FPS claim is made. WAVs are locally synthesized/recorded from the existing licensed samples; no internet audio or new dependency was used.
