"""HEAVY46 target sketch: one loaded Brute stride from the game camera, drawn before the clip.
Side view in play proportions (metres), walking screen-left past a fixed deck seam. Four keys
of the near club: contact, load, pass, release. Vertical is foreshortened by the camera's 54 deg
elevation (cos 54 = .59 on screen). python3 tools/assets/k11-creatures/heavy46/stride_sketch.py <out.svg>"""
import math, sys
out = sys.argv[1] if len(sys.argv) > 1 else 'stride-sketch.svg'
FORE = .59                      # screen scale of world height at the game camera
PX = 120                        # px per metre
W, H = 300, 360

# key: chest centre (x,y), pelvis (x,y), near/far socket heights, near hand (wrist, knuckle), heel lift, far hand
KEYS = [
 ('contact', dict(chest=(.30, 1.95), pelvis=(.95, 1.30), near=2.08, far=2.08, elbow=(.40, 1.20), wrist=(.22, .22),
                  heel=0., far_hand=(.75, .35), far_lift=.10, head=(-.30, 2.30))),
 ('load',    dict(chest=(.08, 1.74), pelvis=(.80, 1.22), near=1.86, far=2.06, elbow=(.42, 1.00), wrist=(.24, .20),
                  heel=0., far_hand=(.45, .55), far_lift=.30, head=(-.50, 2.02))),
 ('pass',    dict(chest=(-.18, 1.80), pelvis=(.60, 1.24), near=1.90, far=2.10, elbow=(.40, 1.08), wrist=(.26, .20),
                  heel=0., far_hand=(-.10, .50), far_lift=.25, head=(-.78, 2.12))),
 ('release', dict(chest=(-.42, 1.92), pelvis=(.40, 1.28), near=2.00, far=1.92, elbow=(.30, 1.25), wrist=(.30, .36),
                  heel=.16, far_hand=(-.55, .30), far_lift=0., head=(-1.02, 2.28))),
]
SEAM = 0.0  # the near knuckles sit on this deck seam from contact to release

def sx(x, ox): return ox + W * .55 + x * PX
def sy(y): return H - 40 - y * PX * FORE

parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W*4}" height="{H+70}" font-family="Helvetica" font-size="13">',
         f'<rect width="100%" height="100%" fill="#141c24"/>']
for i, (label, k) in enumerate(KEYS):
    ox = i * W
    deck = sy(0)
    parts.append(f'<line x1="{ox+10}" y1="{deck}" x2="{ox+W-10}" y2="{deck}" stroke="#3a4a58" stroke-width="2"/>')
    parts.append(f'<line x1="{sx(SEAM,ox)}" y1="{deck-6}" x2="{sx(SEAM,ox)}" y2="{deck+14}" stroke="#ffd34d" stroke-width="2"/>')
    cx, cy = k['chest']; px, py = k['pelvis']
    # far club first (behind), far shoulder high when the near one is loaded
    fs = (cx + .05, k['far'])
    fh = k['far_hand']
    parts.append(f'<polyline points="{sx(fs[0]+.12,ox)},{sy(fs[1])} {sx((fs[0]+fh[0])/2+.15,ox)},{sy((fs[1]+fh[1])/2+.1)} {sx(fh[0],ox)},{sy(fh[1])}" fill="none" stroke="#2c3440" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>')
    # pelvis and hind legs
    parts.append(f'<ellipse cx="{sx(px,ox)}" cy="{sy(py)}" rx="{.42*PX}" ry="{.48*PX*FORE}" fill="#363e4c"/>')
    parts.append(f'<polyline points="{sx(px,ox)},{sy(py)} {sx(px-.15,ox)},{sy(.62)} {sx(px+.05,ox)},{sy(0)}" fill="none" stroke="#363e4c" stroke-width="18" stroke-linejoin="round"/>')
    # chest mass: dorsal dark, flank mid
    parts.append(f'<ellipse cx="{sx(cx,ox)}" cy="{sy(cy)}" rx="{.62*PX}" ry="{.66*PX*FORE}" fill="#4a5262"/>')
    parts.append(f'<path d="M{sx(cx-.6,ox)},{sy(cy+.05)} Q{sx(cx,ox)},{sy(cy+.95)} {sx(cx+.62,ox)},{sy(cy+.05)}" fill="#2a303a"/>')
    hx, hy = k['head']
    parts.append(f'<polygon points="{sx(hx-.28,ox)},{sy(hy-.05)} {sx(hx+.18,ox)},{sy(hy+.22)} {sx(hx+.25,ox)},{sy(hy-.22)}" fill="#b9b39f"/>')
    # near club: socket -> elbow -> wrist -> knuckles on the seam
    ns = (cx - .02, k['near'])
    ex, ey = k['elbow']; wx, wy = k['wrist']
    kx = SEAM
    parts.append(f'<polyline points="{sx(ns[0],ox)},{sy(ns[1])} {sx(ex,ox)},{sy(ey)} {sx(wx,ox)},{sy(wy)}" fill="none" stroke="#5b6478" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>')
    heel = k['heel']
    parts.append(f'<polygon points="{sx(wx-.06,ox)},{sy(wy+.06)} {sx(kx-.10,ox)},{sy(.08)} {sx(kx-.12,ox)},{sy(0)} {sx(kx+.10,ox)},{sy(0)} {sx(wx+.10,ox)},{sy(heel)}" fill="#c9c6b8"/>')
    # shoulder markers and plumb line from the near socket
    parts.append(f'<circle cx="{sx(ns[0],ox)}" cy="{sy(ns[1])}" r="6" fill="#ff7a59"/>')
    parts.append(f'<circle cx="{sx(fs[0]+.12,ox)}" cy="{sy(fs[1])}" r="5" fill="none" stroke="#ff7a59" stroke-width="2"/>')
    parts.append(f'<line x1="{sx(ns[0],ox)}" y1="{sy(ns[1])}" x2="{sx(ns[0],ox)}" y2="{deck}" stroke="#ff7a59" stroke-dasharray="4 4" stroke-width="1"/>')
    drop = (KEYS[0][1]['chest'][1] - cy) * 100
    notes = {
        'contact': ['knuckles land AHEAD of the socket', 'shoulders level, chest high'],
        'load': [f'chest falls {drop:.0f} cm onto the hand', 'near shoulder 20 cm LOW, head dips late'],
        'pass': ['chest CROSSES the wrist (plumb line', 'behind the knuckles); far club swings low'],
        'release': ['heel peels, knuckles still on the seam', 'near shoulder rises past the far one'],
    }[label]
    parts.append(f'<text x="{ox+14}" y="22" fill="#e6e6e6" font-weight="bold">{i+1}. {label}</text>')
    for j, n in enumerate(notes):
        parts.append(f'<text x="{ox+14}" y="{H+28+j*17}" fill="#b8c2cc">{n}</text>')
parts.append(f'<text x="{W*4-12}" y="{H+62}" fill="#7f8c99" text-anchor="end">HEAVY46 target - game camera, walking screen-left; yellow tick = fixed deck seam; filled dot = near (loaded) shoulder, ring = far</text>')
parts.append('</svg>')
open(out, 'w').write('\n'.join(parts))
print('wrote', out)
