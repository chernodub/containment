# R24 — lead's summary of the three independent reviews (2026-11-25, gallery final19)

Build reviewed: fixtures at `f4f54aa7`, campaigns at `3bb061f5` (waves 27 and 28). Reviewers: two GPT Astra 6.2 at high reasoning (visual, play) and one bounded Claude Opus art pass. Full texts: `R24-A-visual-verdict.md`, `R24-B-play-verdict.md`, `R24-C-opus-art-verdict.md`.

## Scores

| Visual (A) | R23 | R24 | | Play (B) | R23 | R24 | | Art second opinion (C) | R23 | R24 |
|---|---:|---:|---|---|---:|---:|---|---|---:|---:|
| First impression | 7.5 | 6.5 | | Core combat | 7.5 | 7.0 | | First impression | 6.5 | 6.0 |
| Interface and HUD | 7.5 | 7.5 | | Rigs | 8.0 | 8.0 | | Interface | 7.5 | 7.5 |
| Combat readability | 7.0 | 7.0 | | Enemy counterplay | 7.5 | 7.0 | | Combat readability | 6.5 | 6.0 |
| Environments | 6.5 | 6.0 | | Game feel | 7.0 | 7.0 | | Environments | 6.0 | 6.0 |
| Ability spectacle | 6.5 | 6.0 | | Build variety | 7.0 | 7.5 | | Ability effects | 6.5 | 6.0 |
| Characters and creatures | 5.5 | 5.0 | | Onboarding | 7.5 | 7.0 | | Characters and creatures | 5.5 | 4.5 |
| Animation | 6.0 | 5.5 | | Interface flow | 8.0 | 8.0 | | Cohesion | 5.5 | 5.0 |
| Cohesion | 6.5 | 6.0 | | Pacing | 6.5 | 6.0 | | | | |

Price the reviewers would pay: A US$8, C US$12. B: "solid commercial indie". Nobody calls it AAA. Wave 28 did not raise a single score; most fell by half a point. Each reviewer says part of that is calibration, and each also names things in the pictures that got worse.

## What the round says

1. **Creatures are still the weakest thing, and recolouring them did not help.** C: "creatures are shaded as flat unlit colour fills, while everything around them is lit. Recolouring them did not fix that; it made them louder stickers." A: "the Brute's pale patch has no readable jaw and the Warden's plate consumes most of its anatomy." The raking key the lead added in wave 28 does not show in any frame the reviewers looked at. The lead's own native crops agree.
2. **The title got weaker.** The back-lit silhouettes solved the close-up problem but removed the face of the largest creature (A: "the largest alien in the key art is harder to understand than the small one with the pink stripe"), and the title marine is still not the marine you play (C).
3. **Rooms read as one accident repeated.** A: "the centre of Passenger, Freight and Breached Loading Bay repeats a ladder-like diagonal beside loose boxes." ROOM27 added seams and fittings; over twenty tiles the shared lit strip is now more obvious.
4. **Area powers have no weight at play size.** C: "Cryo Nova and Seismic Slam are hairline rings at 480×270." A: Flashfire's peak is "a rounded white insert inside a solid orange triangle"; Whiteout "still shows its construction".
5. **The selector promises a marine the game does not show.** A: "The Breacher still presents a rifle while its signature shield sits behind the head."
6. **Play: the designed first exchange is often skipped, and late damage comes from small enemies in fights the player cannot influence.** B: across five Standard traces the first Gallery Brute never reaches a strike; Crawlers and Stalkers account for 63% of Standard suit loss; a Coolant Plant pincer of small enemies costs as much as the guardian; sectors 1–4 cost a competent player 33.9 suit in total. Reserve cancellations and the shutter break work but do not show their payoff.
7. **Kept by all three:** the red telegraph grammar, the interface system and death debrief, the four rigs' kits, amber player fire separated from hostile red, Railbreaker.

## Lead decisions

- The rule "one body hue and one bright mark per family" stays for telling families apart, but it is not enough. Creatures need a body plan designed for the camera above them and a hard form light. A 2D sketch pasted into the Swarm Junction crowd (symmetric plan, pale skull plate on top of the head, large masses with floor between them) read at every heading where the shipped Brute did not; that is the brief for BRUTE32 and BRUTE33. If the three-step light works on the Brute it goes to the Warden and then every family.
- C's request to give the small families one shared dark carapace is not taken: their body hue is how a player tells threats apart, and A found the restored marks made them "quicker to find".
- Area powers get one grammar: a bright hard front at the true radius, a thin glaze inside, a short core flash, all under actors and warnings (FX29).
- Rooms get a function motif across the whole floor and a second light pool, room by room from A's list (ROOM29).
- The marine in play carries what the selector shows, starting with the Breacher's shield on the forearm (RIG29).
- Play work goes to exchanges the player can see coming and to making cancellations and the shutter break pay off on screen (PLAY31).
- Fixed already: the supply stop fits 1080p without scrolling and the stun callout no longer covers the Warden's maw (UI29, merged `b1f1d1ed`).

## Not addressed by this round's plan

- Enemy anticipation animation (A defect 4, B investment 4): waits for the creature bodies to settle.
- The title's large creature and the title marine: waits for BRUTE33 and RIG29, then one re-render.
- Human play: every play number comes from bot policies; no person has played these builds for the reviews.
