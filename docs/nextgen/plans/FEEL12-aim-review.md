# FEEL12 aim implementation notes

The root turns on the native aim each presentation frame. Native marine +X forward is converted to +Z through the retained source -90° rotation, then root `PI/2 - aim` maps +Z onto the simulation direction. Feet therefore turn with aim; runtime adds no unbounded torso aim twist.

Round 1 inspected at native size: zero-angle rifle, Railbreaker, Flashfire, Bulwark and Whiteout; pistol at 90°, plasma at 135°, rocket at 180°, Overload at 45°. Rifle/barrel/flash and the sampled other weapon headings agree. However, correcting only the gun group's yaw exposed a visible receiver-to-hand separation during Flashfire, Bulwark and Overload. Whiteout retained a nearly vertical barrel. This was rejected as the final solution.

Round 2 correction moves the actual firing wrist in world space before sampling the attachment socket. The correction maps the socket +Z to native root forward plus explicit aim pitch. Position, receiver orientation and muzzle all then come from that corrected socket. Death disables this constraint. Working vectors/quaternions are actor-owned, with no allocation inside the frame operation. Existing bone restoration removes the preceding additive wrist correction before sampling the next authored pose.

The strip runner accepts `--aim=<degrees>`; ability body-pose adapters receive a presentation-only proxy player with that angle. The frozen simulation player is never changed. Cast study effects remain isolated presentation evidence, not native hit or acceptance evidence.

Pending: inspect round 2 wrist poses and all final angle strips. Plasma support hand looked below the foregrip in the round 1 135° fire study; exact support grip remains weaker than rifle. A numerical heading correction alone is not proof of attractive wrist anatomy or all cast silhouettes.

Round 2 native-size openings: angle45 Flashfire, Whiteout, run90 and run180. Receiver separation improved and Whiteout barrel remained on aim; the overhead firing wrist still looked bent. Run90/180 showed straight, excessively extended leg extremes. The Crew Checkpoint native Crawler frame supplied by the lead also showed a backward-looking free-hand gesture while the receiver and ring pointed right.

Round 3 changes pending capture: receiver-arm two-bone solve holds a reachable forward firing pocket during casts, preserving the authored free arm and torso. Locomotion was reauthored with a precise 20-frame (1/3s) cycle rather than24frames; at the same authored contact speed this shortens stride reach by16.7%. The two compression beats increase from .13 to .65 source units and spine counterturn changes from88% to118% of pelvic yaw. The generating scripts rebuilt69 clips, retaining action choreography, existing skeleton node names/rest transforms and no exported meshes. Final strips must judge whether the remaining free-hand gestures read naturally.

## Complete round1 angle contact review

Opened all32 native contact pages (`angle-{0,45,90,135,180,225,270,315}/marine-contact-{1,2,3,4}.png`), covering four selected native phases of all176 studies (idle, five weapons, sixteen casts at eight headings). This is a contact review, not a claim that every cell of every twelve-frame original was individually opened. Source assets changed during this critique set; later angles contain the wrist fix. It cannot serve as coherent final-source verification.

| Angle | Observed read and remaining oddities |
|---|---|
| 0 | All gun flashes point right. Seismic Slam/Whiteout lift gun near vertical; Cryo Nova points its held gun back across shoulder; Bulwark/Flashfire/Overload place receiver beside the held hand. Tesla Pylon folds chest extremely low; Railbreaker remains comparatively coherent. |
| 45 | Five weapon flashes point lower-right; pistol and rifle are clear. Seismic Slam/Whiteout overhead gun breaks aim. Cryo Nova swings receiver behind head; Static Step starts with receiver above shoulder. Flashfire/Overclock receiver sits apart from wrist early; Tesla Pylon resembles a bow with gun floating to its side. |
| 90 | Gunfire points down consistently. Rifle foregrip looks firmer than plasma. Whiteout/Slam/Cryo Nova still raise barrel skyward. Meltdown second phase holds receiver high while free hand reaches sideways; Tesla Pylon second phase folds head beneath receiver. |
| 135 | Gunfire points lower-left; plasma support hand hangs visibly below foregrip. Wrist-corrected cast headings are steadier, but Whiteout/Slam still hold a horizontal gun high over the helmet. Cryo Nova extends firing arm away from shoulder; Tesla Pylon is deeply crouched and side-loaded. |
| 180 | Five gunfire rows point left; muzzle flash/barrel agree. Whiteout/Slam now keep horizontal heading but lift receiver above brow. Cryo Nova exposes chest toward camera with firing hand/gun behind body; Flashfire/Overload left-hand gesture is clearer than previous angles. |
| 225 | Gunfire points upper-left. Body/backpack direction does not invert. Whiteout/Slam maintain heading while receiver rises overhead; Cryo Nova second phase places gun low on opposite side of torso. Tesla Pylon low twist makes arm support hard to read; Overclock gesture clear from rear. |
| 270 | Gunfire points up; pistol/rifle stand out more clearly than large shoulder weapons. Cryo Nova/Meltdown second phase puts gun on lateral edge while torso twists away. Whiteout has steadier heading but elevated wrist. Tesla Pylon has a deep forward fold; free hand and receiver can overlap from this view. |
| 315 | Gunfire points upper-right. Shotgun flash coherent; rifle support hand most convincing. Whiteout/Slam keep heading with overhead receiver; Cryo Nova briefly places gun down-left of torso while its barrel still points upper-right. Meltdown/Tesla Pylon crouches make firing elbow look sharply folded. |

The front-pocket arm correction targets these observed overhead/side-loaded receiver poses. The free-arm hemisphere clamp targets casts that signal backwards. These are the questions for round3, not assumed successes.

## Railbreaker source boundary

The native event path is `DepthRenderer.effect` → lazy ability owner → ability registry → Breacher `event`. At Railbreaker impact/burst, its presentation computes endpoint from native origin+length, then emits `heavyBeam` and a white `beam` from `(x,.85,z)`. The same event origin also owns its trench, impact, burst and flash. There is no existing weapon/muzzle anchor service. Moving event coordinates in the renderer would move that entire footprint, while replacing the kit's beam method temporarily would be a fragile interception across the VFX12 ownership boundary. Neither was implemented. A dedicated optional weapon-source anchor for only the physical discharge is the appropriate VFX12 integration; the footprint/endpoints must remain native. Native final Railbreaker capture is still required to assess the visible size of this source-to-socket gap.

## Round3 opened-strip review

Opened all13 complete twelve-frame native strips in `aim-round3/angle45`: run0/90/180/270, rifle, shotgun, Railbreaker, Cryo Nova, Whiteout, Flashfire, Static Step, Overload and Tesla Pylon. The right receiver now stays visibly in front and attached through all seven sampled cast rows. Whiteout's free arm still lifts, while its gun stays forward; Cryo Nova no longer sweeps the gun behind the head. Flashfire/Overload keep their free-hand gestures without the detached low-side receiver. Tesla Pylon's deep forward fold remains, but the receiver no longer floats above or opposite the firing hand. The Railbreaker brace and the two fire rows remain coherent.

The shorter gait has a more compact stance and clearer compression/transfer. Brief straight-leg extremes remain (notably run90 cell8 and run0 cell8); run180 still has a broad split stance. These are residual polish weaknesses, rather than a claim of fully solved foot contact from isolated strips. Native movement remains necessary to assess sliding.

Non-gating metadata inspection of156 sampled frames gives maximum horizontal barrel-heading error0.7862° (Railbreaker), next0.2894° (Tesla Pylon), with other rows below0.00004°. Results are retained in `aim-round3/heading-diagnostics.json`. This measures the model/socket heading, not the ability beam's origin or native attack accuracy.
