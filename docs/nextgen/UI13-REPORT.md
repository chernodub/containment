# UI13 decision screens

Branch `t3/improve-decision-screens`. The changes cover the desktop reward draft, supply stop, route choice, pause loadout and expedition debrief.

## Reward inventory

The 31 Blender studies cover 20 augments, four boon paths and seven effect-family or universal fallbacks. The manifest resolves the mutation id first, then the authored path for ordinary boons, then the family. Visible cards retain lazy picture loading. Shop items and route landmarks use inline SVG.

| Shipped image group | Files | Bytes |
| --- | ---: | ---: |
| WebP, 768 × 480 | 31 | 401,930 |
| PNG fallbacks, 768 × 480 | 31 | 13,110,588 |

Rebuild from the repository root with `blender -b -t 6 --python-exit-code 1 -P tools/assets/ui13-rewards/studies.py`. Append `-- wildfire slide-loader` to render individual plates. Geometry, materials and lighting are original. No runtime dependencies were added. Reviewing the full sheet led to two replacements. Wildfire now has curled flame ribbons, and Slide Loader shows a carriage running on exposed rails.

## Choices

- Each of the eight transformative augments has its own before and after diagram, affected ability or trigger, capability loss where applicable, and named exclusion. Installed transforms have the diagram in the loadout inspector. Slot-specific transforms also appear on the equipped ability.
- Seven illustrated supplies retain native prices, eligibility, stock, purchases and explicit departure. The credit deficit or other purchase constraint is visible on each disabled item.
- Five story junction landmarks identify the destination. Direct entry and salvage show the same destination, with the cache highlighted on the salvage approach. Older branching runs draw room cover footprints. The game still determines which destinations are available.
- Loadout groups rig abilities, augments and boons. Ability inspection retains detailed stats. The expanded debrief gives sectors, eliminations, time and damage the largest numerals. A secondary disclosure contains combat and economy counters.

## Gallery and verification

Local gallery at `artifacts/nextgen/ui13-final/index.html`. The full reward contact sheet is `artifacts/nextgen/ui13-final/reward-studies.jpg`. The gallery links native desktop PNGs and 480 × 270 reductions. Frozen baseline transform drafts use matching rooms, offers and seed. The historical comparison sources are listed in `before/SOURCES.txt`.

The keyboard pass used native draft, purchase, departure and route controls. Debug fixtures advanced the combat between decisions. Shard Harvest was installed and upgraded, credits fell from 500 to 260, and the selected detour entered Breached Loading Bay. All four rigs received transform offers in the draft capture. The first visual review led to restoring the supply capture hook, enlarging the embedded room record, reducing repeated transform labels, and widening and repositioning installed transform diagrams.

The images favor shape recognition over surface wear. The relay and twin pylon remain schematic, and the destination drawings share a simple sectional perspective. Pyro's draft has the tightest vertical space when its effect lesson and room record appear together.

The final gallery contains 44 native captures and 44 reductions, with zero capture errors. Purchase-state captures include the zero-credit fixture and a funded stop. Some historical 1280 comparisons are labeled reductions of the older 1920 layout. The matching transform baselines are native at both sizes. On the 720p Pyro and Arc drafts, the panel scrolls by up to 17 pixels to show the entire disabled reroll footer. The install controls and exclusion text are visible before scrolling.

The initial dependency install and build passed. The final production build passed with Vite’s bundle-size advisory. No test suites were added or run.

## Campaign

The unassisted Arc campaign, seed 1729, ran on gameplay revision `294d973035d24ea85484c49c3ac02c6401802d76`. It cleared 9 rooms and ended in transmission-chamber with outcome `dead`. The runner exited 0 after 1819.4 seconds, with 0 errors and 0 defects. The report and terminal capture are in `artifacts/nextgen/playtest/ui13-arc/`. The first launch encountered the sandbox loopback restriction. The authorized localhost run started from the beginning.
