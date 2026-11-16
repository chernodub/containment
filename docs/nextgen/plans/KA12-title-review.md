# KA12 title revision — focused review

Weapons and ending accepted; left unchanged. `git merge nextgen` fast-forwarded to `857024ce` before work. New title-only entry point: `tools/assets/u10-keyart/title.py`; accepted ending remains reproducible with `stage.py`.

Round 1 / 21: opened 480×270 first, then 1920×1080. Immediate torn-hole/armoured-hero silhouette read improves substantially. No violet plane, floating shards or right-edge tendrils. Actual curved metal strips and fractured ring frame a modeled corridor. Full-size problems: overbright haze erases corridor depth; Brute lower legs crop off; Crawlers lie too far behind rim; right wall terminates visibly behind hero. Fix: deeper/scaled set, lower density and light power, larger outer hull, bring Crawlers in front of the rim. Clean amber shoulder established; surface-aligned unit 07 added for next round.

Round 2 / 22: opened 480×270 first, then 1920×1080. Clean amber07 shoulder works; dark Brute against the physical tear reads immediately. Actual corridor framing is beginning to show through reduced haze. Crawlers remain invisible against outer wall/gun; Spitter is occluded behind Brute. Read-only projected bounds confirmed those placements. Fix: bring ceiling Crawler down into lit aperture, move second onto left edge, make deep Spitter taller/offset, reduce Brute size and pitch it toward camera to reveal dorsal lantern; add real floor spill light and wet threshold.

## Round 3 — 23
Opened 480×270 first, then 1920×1080. The leaned Brute now exposes a hooked claw and separated legs; the deep green sac separates from its amber lantern. Corridor ribs recede behind the haze. Crawlers still merge with torn metal. Move both inward against haze and add a narrow rear edge light. Hero marking and calm menu field remain successful.

## Round 4 — 24
Opened 480×270 first, then 1920×1080. Both Crawlers now show separate legs against bright haze; Brute hook/legs and deep green sac read immediately with the hero. Full-size issue: upper Crawler appears suspended. Add a buckled ceiling support under its shell, connected to the torn rim. The left Crawler already overlaps the exposed wall ribs. Proceed to 128-sample final and inspect the actual DOM composite.

## Final — 25
128-sample Cycles composition opened at 480×270 first, then native 2560×1440. Added support connects upper Crawler to the peeled ceiling rim. Read: hero, torn opening, hooked Brute and two small climbing silhouettes. Corridor frames and acid-green sac retain depth behind the dark front creature. The wet floor is a narrow strip because the approved hero camera is low; reflections are visible but less prominent than the wall and actors.

## Browser review

Production build passes. Shared preview loaded all six images, entered `key-art-layered`, and reported Start enabled. Its screenshot call timed out twice (`Preview automation snapshot timed out after 15000ms.`), so that tab was closed and the existing repository capture runner used serially with ANGLE Metal on Apple M1 Pro.

1920×1080: opened 480 thumbnail first, then native. Menu stays left of the Brute and both Crawlers. Clean amber shoulder and visor remain dominant. 1280×720 first capture exposed a menu overlap with left Crawler legs; narrowed menu below 1400px. A second capture exposed cramped utility arrows; final rule uses 320px and tighter utility-button gaps/padding. No hooks or UI logic changed.

Final 1280×720 recapture opened at 480×270 and native: menu clears the Crawler, utility icons/text/arrows fit within their buttons, continuation line is single-line again. Final 1920 capture remains the delivery reference. Remaining art limits are documented in KA12-REPORT.md rather than presented as solved: small Crawler lanterns, narrow floor-reflection strip and soft distant corridor detail.
