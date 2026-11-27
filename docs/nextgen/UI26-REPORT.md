# UI26 decision screens

## Weapons

The paused Weapons tab shows the inspected weapon’s existing studio illustration, purpose, strongest target and loaded and reserve ammunition. Rocket inspection includes the self-blast warning. The arrow and number keys inspect the cards while paused. [Before](/Users/chernodub/.t3/worktrees/containment-game/t3-ddb88853-7ad62f220391d1bb/artifacts/nextgen/ui26-before-pause-weapons/pause-weapons.png) · [After](/Users/chernodub/.t3/worktrees/containment-game/t3-ddb88853-7ad62f220391d1bb/artifacts/nextgen/ui26-after-pause-weapons/pause-weapons.png)

## Supply stop

Each service shows a large grant next to its price. The ammo card lists the round mix, and the dedicated Coolant Plant offer shows its reserve grant beside the price. Resource caps can reduce the amount received. [Before](/Users/chernodub/.t3/worktrees/containment-game/t3-ddb88853-7ad62f220391d1bb/artifacts/nextgen/ui26-before-play21-supply/play21-supply.png) · [After](/Users/chernodub/.t3/worktrees/containment-game/t3-ddb88853-7ad62f220391d1bb/artifacts/nextgen/ui26-after-play21-supply/play21-supply.png)

## Augments

Draft, supply upgrade and field workshop cards show the base move beside the transformed move and call out what it gives up. Ice Road shows the same volley stopping at Glacier and continuing through the runway. [Before](/Users/chernodub/.t3/worktrees/containment-game/t3-ddb88853-7ad62f220391d1bb/artifacts/nextgen/ui26-before-ui26-ice-road-draft/ui26-ice-road-draft.png) · [After](/Users/chernodub/.t3/worktrees/containment-game/t3-ddb88853-7ad62f220391d1bb/artifacts/nextgen/ui26-after-ui26-ice-road-draft/ui26-ice-road-draft.png)

See the offer again as a supply upgrade. [Before](/Users/chernodub/.t3/worktrees/containment-game/t3-ddb88853-7ad62f220391d1bb/artifacts/nextgen/ui26-before-ui26-ice-road-shop/ui26-ice-road-shop.png) · [After](/Users/chernodub/.t3/worktrees/containment-game/t3-ddb88853-7ad62f220391d1bb/artifacts/nextgen/ui26-after-ui26-ice-road-shop/ui26-ice-road-shop.png)

The field workshop also uses the same comparison. [Before](/Users/chernodub/.t3/worktrees/containment-game/t3-ddb88853-7ad62f220391d1bb/artifacts/nextgen/ui26-before-art21-workshop-ice-road/art21-workshop-ice-road.png) · [After](/Users/chernodub/.t3/worktrees/containment-game/t3-ddb88853-7ad62f220391d1bb/artifacts/nextgen/ui26-after-art21-workshop-ice-road/art21-workshop-ice-road.png)

## Ending

The wide transmission image sits behind the original two-line outcome. Expedition statistics are folded by default and reachable by keyboard. Play again and Return to title appear below them. [Before](/Users/chernodub/.t3/worktrees/containment-game/t3-ddb88853-7ad62f220391d1bb/artifacts/nextgen/ui26-before-complete-fixture/complete-fixture.png) · [After](/Users/chernodub/.t3/worktrees/containment-game/t3-ddb88853-7ad62f220391d1bb/artifacts/nextgen/ui26-after-complete-fixture/complete-fixture.png) · [1280×720](/Users/chernodub/.t3/worktrees/containment-game/t3-ddb88853-7ad62f220391d1bb/artifacts/nextgen/ui26-after-ending-720/complete-fixture.png) · [Statistics opened with the keyboard](/Users/chernodub/.t3/worktrees/containment-game/t3-ddb88853-7ad62f220391d1bb/artifacts/nextgen/ui26-after-ui26-ending-statistics/ui26-ending-statistics.png)

## Route

A dim crop of the destination’s existing studio preview backs isolated creature illustrations on the route screen. The creature remains the brightest part of its art panel. [Before](/Users/chernodub/.t3/worktrees/containment-game/t3-ddb88853-7ad62f220391d1bb/artifacts/nextgen/ui26-before-run15-condition-route/run15-condition-route.png) · [After](/Users/chernodub/.t3/worktrees/containment-game/t3-ddb88853-7ad62f220391d1bb/artifacts/nextgen/ui26-after-run15-condition-route/run15-condition-route.png)

## Combat teaching plaque

The plaque sits beside the target on the side away from the marine. A short line connects it to the target’s silhouette. If that placement is blocked, it uses a clear position above the action dock. If all dock positions are obstructed, the plaque waits for a clear position. [Before](/Users/chernodub/.t3/worktrees/containment-game/t3-ddb88853-7ad62f220391d1bb/artifacts/nextgen/ui26-before-play22-plate/play22-plate-passenger-vault.png) · [Reviewer frame](/Users/chernodub/.t3/projects/containment-game/artifacts/nextgen/final17/screen-extra/play22-plate-passenger-vault.png) · [After](/Users/chernodub/.t3/worktrees/containment-game/t3-ddb88853-7ad62f220391d1bb/artifacts/nextgen/ui26-after-play22-plate/play22-plate-passenger-vault.png)

## Desktop verification

The production type-check and build passed. The Cryo playtest used seed 1729 and keyboard activation for screen decisions. It cleared six rooms with zero errors and zero reported defects. The campaign ran before the final focus and color adjustments, which are covered by the captures. [Playtest report](/Users/chernodub/.t3/worktrees/containment-game/t3-ddb88853-7ad62f220391d1bb/artifacts/nextgen/playtest/cryo-1729/index.html)

I reviewed the paired frames at native size and at 480×270. The captured 1920×1080 screens fit without scrolling or text collisions. The supply numerals remained legible at the reduced size. Keyboard focus was visible in the Weapons tab, supply stop, draft, route and opened statistics. Both ending actions fit at 1920×1080 and 1280×720.

Legacy destinations lacking room studio assets use their existing route artwork.

## UI34

### Supply commitment

The exclusive row precedes the paid stock, including the route reserve ammo. The pending exit reads **Choose one to continue**. Selecting an option uses the existing free purchase and names the choice, its affected ability, and its key on the exit. The folded stock opens when keyboard focus enters or the pointer moves onto it. The campaign drivers select the free augment through the same purchase contract.

### Icon inventory

The new drawings live in `src/ui/screens/serviceArt.ts`.

| Previous asset | Where it appeared |
| --- | --- |
| `public/assets/ui/studio/service-heal.webp` | Immediate repair |
| `public/assets/ui/studio/service-medkit.webp` | Inventory medkit |
| `public/assets/ui/requisition/armor.svg` | Armour refill |
| `public/assets/ui/requisition/ammo.svg` | Ammunition refill and the artwork reused for route ammo |
| `public/assets/ui/requisition/grenade.svg` | Grenade purchase |
| `public/assets/ui/requisition/reroll.svg` | Reroll purchase |
| `public/assets/ui/requisition/upgrade.svg` | Paid upgrade and the fallback rig-return service illustration |
| `public/assets/ui/studio/service-revive.webp` | Finale revival |

The pickup toast already uses the flat vector credits icon. Deck pickups are 3D props with face swatches in `src/render/PickupModels.ts`.

### Debrief and between-room screens

The earlier pose is smaller and hollow. The impact pose remains solid, with its escape arrow emerging from the figure. The fatal silhouette is filled once and the redundant dashed range guide and text key are gone. Reach remains in the caption. The boon tray, augment rail, supply counter edge and route grid give the four choices distinct structure.

### Story hold

The gate renderer consumes PLAY39’s `storyHoldGrace` shape. A mint arc preserves the accumulated charge while an amber notch travels around it. On expiry the notch disappears and the arc recedes. The effect is a visual readout of the snapshot. The capture fixture provides the same snapshot shape independently of live simulation timing.

### Desktop evidence

The comparison index includes native captures and 480×270 reductions at 1920×1080, 1366×768 and 1280×720. The selected receipt, expanded stock, all five fatal kinds, boon, augment and route were captured with empty error lists. The archived screen sheet uses available examples of each screen, so some offers differ. [UI34 comparison index](/Users/chernodub/.t3/worktrees/containment-game/t3-ddb88853-7ad62f220391d1bb/artifacts/nextgen/ui34/proof.md)

In the native keyboard walkthrough, Tab passes Room record, Pilgrim Pylon and Live Wire before entering paid stock. Shift+Tab moves back through the choices. Enter installs Pilgrim Pylon and moves focus to **Install Pilgrim Pylon and leave**, where the Tesla Pylon glyph and F key are visible. A second Enter loads Relay Racks. [Tab into stock](/Users/chernodub/.t3/worktrees/containment-game/t3-ddb88853-7ad62f220391d1bb/artifacts/nextgen/ui34-final-ui34-keyboard-tab-stock-1920/ui34-keyboard-tab-stock.png) · [Exit focus](/Users/chernodub/.t3/worktrees/containment-game/t3-ddb88853-7ad62f220391d1bb/artifacts/nextgen/ui34-final-ui34-keyboard-exit-focus-1920/ui34-keyboard-exit-focus.png) · [Relay Racks after Enter](/Users/chernodub/.t3/worktrees/containment-game/t3-ddb88853-7ad62f220391d1bb/artifacts/nextgen/ui34-final-ui34-keyboard-leave-1920/ui34-keyboard-leave-relay-racks.png)

The secondary supply copy and the differences between boon and augment rails are subtle at 480×270. Native captures show the choice and exit clearly. The two drafts still take a second look at thumbnail size.

`npm run build` passed. The Cryo 1729 campaign cleared all eight rooms with zero recorded errors using the frozen build at `960fdd9c`. The later source change only distinguishes majority-weapon drafts visually and was verified by separate builds and captures. Four earlier campaign attempts hit the renderer screenshot deadline under host load. The completed run used the opt-in 180-second screenshot deadline and exited with status 1 for five room loads over five seconds. The capture batches also retried ship-kit timeouts. PLAY39’s live branch had yet to reach local `nextgen` at verification, so the hold sequence uses the published snapshot shape in fixtures. [Campaign report](/Users/chernodub/.t3/worktrees/containment-game/t3-ddb88853-7ad62f220391d1bb/artifacts/nextgen/playtest/ui34/report.json)

`df -h /Users/chernodub` reported 926 GiB capacity, 874 GiB used and 25 GiB available at the start, and 805 GiB used and 89 GiB available at the end. The worktree evidence directory started at 6.5 GiB and finished at 377 MiB after removing old ignored captures and scratch.
