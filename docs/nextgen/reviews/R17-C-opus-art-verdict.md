# R17-C — art-director second opinion (Claude Opus, 2026-11-21, gallery final12)

Evidence: 44 images from `final12/`: 6 screens, 3 contact sheets, 30 review480 frames, 3 native frames (`native-heavy/pyro-pressure-3`, `elite-pairs/…-stalker-…`, `crowds/…relay-racks-01`) and 2 motion sheets (`marine-contact-1`, `brute-contact-1`). I did not run the game.

## 1. Scores

- **First impression: 6.5.** The type and layout look premium. The key art does not: the creatures are soft, flat-brown clay, and black wire strokes hang in the air like render errors (`title.png`).
- **Interface: 7.5.** A consistent, commercial system: diagrammed rigs, before/after boon cards, route previews, and a death card that names the cause. The HUD corner text is about 9 px at 1080p, and the route cards use blurry crops (`run15-condition-route.png`).
- **Combat readability: 6.5.** Telegraph wedges are now translucent with a bright rim, and the marine's white suit reads (`crowds/…relay-racks-01`). Orange player fire still swallows red hostile markers (`overlap--…-pyro-04`), and Dark Heavy is a black field (`conditions--…-dark-heavy-…`).
- **Environments: 5.5.** All twenty rooms have their own grade, but most of every frame is an empty plate floor with box-modelled props. Warm floor light pools read as smudges (`twenty-incident.png`, `elite-pairs/…-stalker`).
- **Ability effects: 6.** Cryo Nova, Seismic Slam and the Flashfire tongues land. Railbreaker is a beige stripe, Overload a lilac thread and Meltdown a thin ring (`abilities--…-03`). The Napalm pool is a camouflage-pattern decal (`native-heavy/pyro-pressure-3`).
- **Characters and creatures: 5.5.** The marine is now one strong, readable icon. The creatures are hue-coded by family but modelled like plush: the Brute is muddy brown lumps, and its death melts into a smear (`motion/brute-contact-1`). The Matron is a pink cone.
- **Cohesion: 5.5.** In-game ink-line toon, sketch-style boon vignettes, blurry 3D route crops and soft PBR title creatures are four rendering languages.

## 2. Tier

A polished early-access indie with an AA-grade interface wrapped around prototype-grade actors and floors. I would pay $12–15 today.

## 3. Seven changes, ranked

1. **Creature material and value** (`motion/brute-contact-1`, `crowds/…relay-racks-01`). Repaint bodies as dark, hard chitin at 20–30% value, with mid tones only on joints and underbelly and one saturated emissive per family on the weak point. Model angular plates instead of rounded lumps, and add a cool rim light so bodies separate from amber floors.
2. **One render language for UI art** (`run15-condition-route.png`, `title.png`, `augment-draft.png`). Re-render the title creatures and all route and boon art from the in-game toon shader, with outlines, at 2× resolution and crisp. No blurred crops and no clay creatures.
3. **Hostile markers on top** (`overlap--…-pyro-04`, `native-heavy/pyro-pressure-3`). Hostile projectiles and telegraphs need one saturated magenta-red with a white core ring, drawn after player VFX. Cap player additive bloom at about 50% within 1 m of a hostile marker, and shift Pyro toward yellow-orange so red belongs only to the enemy.
4. **Floor density** (`elite-pairs/…-stalker`, `twenty-incident.png`). Add grime gradients toward walls, contact AO under props, cable runs and drag marks leading to the landmark, and material breaks (grating, plate, hazard paint) every few metres. Replace the orange floor blobs with practical fixtures that throw shaped light.
5. **Landmarks framed and lit** (`rooms--incident-facing-overload-floor`, `…-containment-annulus`). Today they are cropped at the top edge and sit in shadow. Give each one a key light, an emissive core and a fully in-frame position in the upper third, so it sits one clear value step above the floor.
6. **Thin abilities and ground pools** (`abilities--…-railbreaker-03`, `…-overload-03`, `…-meltdown-03`, `native-heavy/pyro-pressure-3`). Beams need a hot white core three times the current width, coloured falloff and a flash at each hit point. Pools need a charred dark centre, an emissive rim and vertical flame billboards that light the creatures.
7. **Elites and animation** (`elite-pairs--…-brute`, `motion/marine-contact-1`). Elites need 1.25× scale, a bone-pale crest and emissive seams; at 480 I can't pick them out today. The marine needs a 10–15° lean into the run and visible recoil on fire. The Brute needs a readable fall pose rather than a melt.

## 4. Keep

1. The UI system: Barlow, diagrammed ability cards and the death card that names a cause and a fix (`rig-breacher-equip.png`, `onb14-death-spitter.png`).
2. The marine icon: white plates, yellow "07" dome, cyan visor and a personal pool of light, the same from title to play (`twenty-native.png`).
3. Per-room colour grades and family hue coding, with translucent red wedges with a bright rim (`twenty-kiting.png`, `crowds/…relay-racks-01`).

## 5. Value hierarchy and identity

The hierarchy is complete in calm frames and in the darker fight rooms. It is a dark ship, and the marine is lit first in its own spotlight. It breaks in three places:
- Creatures don't hold second place. Their brown and mauve mid-values sit on the floor's value, so crowds become texture.
- In the bright grey rooms (Crew Checkpoint), the whole floor lifts and there is no dark ship.
- Landmarks are rarely a clean third, because they are cropped or unlit.

The marine now keeps one identity across title, debrief, cards and play; only the rig-screen render is slimmer, with a smaller dome. The single decision holding the picture back is **the surface language**: flat toon fill plus outline with no value modelling or texture. It makes creatures, props and floors all read as outlined greybox. Commit to hand-painted value gradients (dark base, lit top planes, worn edges) inside the ink line.

## 6. Against R16-C

- **Done:** #2, one marine: the title, cards and play now share the white, yellow-dome "07" trooper. Damage-number stacking from #6 is done ("42×", "4×4").
- **Partly done:** #1, creatures: the blades are darker, but the Brute is still brown clay. #3, bosses: the Warden has its own banded head, but the Matron is still a capsule and elites still aren't distinct. #4, telegraphs: the fills are now translucent with rims, but Dark Heavy still hides the marine. #6: Flashfire has tongues, and Napalm is textured but flat. #7: one longer run stride.
- **Not done:** #5, the floors are still empty plates.
- **Its scores:** I agree within a point. I am half a point harsher on environments (5.5) and abilities (6), and half a point kinder on characters (5.5) now that the marine is unified.
