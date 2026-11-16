# FEEL12 aim implementation notes

The root turns on the native aim each presentation frame. Native marine +X forward is converted to +Z through the retained source -90° rotation, then root `PI/2 - aim` maps +Z onto the simulation direction. Feet therefore turn with aim; runtime adds no unbounded torso aim twist.

Round 1 inspected at native size: zero-angle rifle, Railbreaker, Flashfire, Bulwark and Whiteout; pistol at 90°, plasma at 135°, rocket at 180°, Overload at 45°. Rifle/barrel/flash and the sampled other weapon headings agree. However, correcting only the gun group's yaw exposed a visible receiver-to-hand separation during Flashfire, Bulwark and Overload. Whiteout retained a nearly vertical barrel. This was rejected as the final solution.

Round 2 correction moves the actual firing wrist in world space before sampling the attachment socket. The correction maps the socket +Z to native root forward plus explicit aim pitch. Position, receiver orientation and muzzle all then come from that corrected socket. Death disables this constraint. Working vectors/quaternions are actor-owned, with no allocation inside the frame operation. Existing bone restoration removes the preceding additive wrist correction before sampling the next authored pose.

The strip runner accepts `--aim=<degrees>`; ability body-pose adapters receive a presentation-only proxy player with that angle. The frozen simulation player is never changed. Cast study effects remain isolated presentation evidence, not native hit or acceptance evidence.

Pending: inspect round 2 wrist poses and all final angle strips. Plasma support hand looked below the foregrip in the round 1 135° fire study; exact support grip remains weaker than rifle. A numerical heading correction alone is not proof of attractive wrist anatomy or all cast silhouettes.

Round 2 native-size openings: angle45 Flashfire, Whiteout, run90 and run180. Receiver separation improved and Whiteout barrel remained on aim; the overhead firing wrist still looked bent. Run90/180 showed straight, excessively extended leg extremes. The Crew Checkpoint native Crawler frame supplied by the lead also showed a backward-looking free-hand gesture while the receiver and ring pointed right.

Round 3 changes pending capture: receiver-arm two-bone solve holds a reachable forward firing pocket during casts, preserving the authored free arm and torso. Locomotion was reauthored with a precise 20-frame (1/3s) cycle rather than24frames; at the same authored contact speed this shortens stride reach by16.7%. The two compression beats increase from .13 to .65 source units and spine counterturn changes from88% to118% of pelvic yaw. The generating scripts rebuilt69 clips, retaining action choreography, existing skeleton node names/rest transforms and no exported meshes. Final strips must judge whether the remaining free-hand gestures read naturally.
