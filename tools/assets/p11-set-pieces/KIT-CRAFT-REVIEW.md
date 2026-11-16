# Cargo and kit second craft review

This supplements the original KIT-CARGO-NOTES and supersedes its texture-free
limitation. All six packs now have baked vertex AO/curvature plus a selected-to-active
512px tangent-normal atlas. The tightened .0025m projection cage removed broad
cross-part projection artifacts seen in the first atlas renders. Geometry remains
merged by named finish; runtime normal materials now retain UVs per source pack.

Freight changed from a generic framed box to a double pressure-door cargo pod:
open casting pockets, full perimeter seals, folded door ribs, two rotating cam
rods with keeper tongues, over-centre lever cradles, welded hinge ears and scuffed
placards. The gantry carries a reduction gearbox, brake disc/caliper, bearing
yokes, motor/glands, wound drum, lifting eyes and bolted haunches. Its review render
uses extra framing margin so the full rear rail is visible. 9,356 triangles.

Breached Loading changed from repeated sawtooth plates to seven separately
specified buckled sheets. Each has its own knee, twist and torn lip, physical skin
thickness and exposed I-section framing. Broken channels and severed service lines
sit around the revised pressure pod. 5,982 triangles. No collider changes.

Every service module was re-opened and revised: splice sleeves/glands on cable
trays; cam latch and two rear ports on the hatch; over-centre bails, recessed side
grips and label wear on both cases; pressure-relief valve and gauge feed on the
drum; saddle couplings and mounting shoes on the rail; open stringers and welded
tread angles on stairs; rain hoods, rear cables/ports and access lids on both
consoles, with a separate key on the schematic console; actual globe bodies and
connected gauge feeds on the valve manifold. The simplified gauge geometry freed
budget for those connections rather than adding more decorative fasteners.
Service modules are 336–1,176 triangles. All ten were inspected in the two native
beauty boards; both 480 reductions are retained.

All 45 E9 modules were reviewed in sixteen three-piece boards, not just the
small all-pack thumbnails. Dark structural caps and manufactured panel joints
replace broad blank white tops on machinery and walls. Selected cabinets receive
hinged access doors, latch pockets, deeper angled cooling louvres and paired
service connectors. Locker hinges, berth drawer rails/pillow seams, a removable
desk mat and cable-end ferrules clarify construction. Detailed pump/manifold and
plenum mechanisms retained their existing useful silhouette; the pump exchanged
a blank plaque and tiny meter tick for roof panel joints to stay at 1,500 triangles.
Quiet flush floors, glass channels and thresholds retain their restrained surface
layout because their role is circulation and contact, not hero detail.

The closer render review caught two mistakes in the first E9 revision: a vent in
the testbench's open knee space and unsupported conveyor side ports. The vent and
rear connectors were moved onto the left cabinet; the conveyor received actual
rail-mounted service housings. Cable-tray glands were moved to the real cable
ends. Corrected renders were re-opened; these are not accepted floating details.

Final pack totals: structure 3,344; security 8,480; clinical 21,944; industrial
24,992 triangles. Every ordinary module is ≤1,500. Six retained landmarks exceed
the ordinary budget but remain ≤12k: security scanner 2,256; analyser 2,868; uplink
dish 8,980; hoist 2,604; tool bridge 4,696; airway exchanger 6,056. This distinction
must remain explicit in the report.

All native boards are under `artifacts/nextgen/p11-final/beauty/`:
`freight-suspension-gantry`, `loading-wedged-pod`, `service-kit-storage`,
`service-kit-machinery`, `e9-{pack}-craft`, and `e9-{pack}-pieces-N` (PNG).
Every board has a matching 480×270 letterboxed reduction. The close boards can be
rebuilt with `blender -b -t 4 -P tools/assets/e9-ship-kit/review_craft.py -- --pieces
<pack>`; pack overviews omit `--pieces`. All rendering is serial four-thread CPU.

Remaining quality limitation: the older E9 architecture/furniture is still a
systematic support kit, and the long clinical scanner beam and domestic storage
are less individual than the new heroes. Do not describe this as a ground-up
redesign of every original silhouette. Room-scale composition, cutaway behaviour
and gameplay verification are the lead's final capture/build/campaign work.
