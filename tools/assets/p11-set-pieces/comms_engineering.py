"""P11 communications + engineering set pieces (Relay Racks, Transmission Chamber,
Diagnostic Gallery, Safety Interlock). Original MIT work, Blender 5.3.

Rebuild: blender -b --factory-startup -P tools/assets/p11-set-pieces/comms_engineering.py [-- --render]
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import p11lib as L  # noqa: E402
from mathutils import Vector  # noqa: E402

PACK = 'comms-engineering'
OUT = L.ROOT / 'public/assets/p11' / PACK
RENDERS = L.ROOT / 'artifacts/nextgen/p11-renders'


# ---------------------------------------------------------------- Relay Racks

def blade_door(cx, y, width, height, z0, seed):
    """South-facing rack door: frame, blade chassis rows with pull lips, LED
    pairs, a fibre comb, hinges and a handle."""
    zc = z0 + height / 2
    for sx in (-1, 1):
        L.box('Rack door stile', (cx + sx * (width / 2 - .035), y - .015, zc), (.07, .05, height), 'e9-trim', .012)
    for sz in (-1, 1):
        L.box('Rack door rail', (cx, y - .015, zc + sz * (height / 2 - .035)), (width, .05, .07), 'e9-trim', .012)
    L.box('Rack cavity', (cx, y + .01, zc), (width - .08, .02, height - .08), 'e9-dark', 0)
    rows = 8
    pitch = (height - .16) / rows
    for r in range(rows):
        z = z0 + .08 + pitch * (r + .5)
        L.box('Server blade', (cx - .08, y - .004, z), (width - .3, .03, pitch * .78), 'e9-body', 0)
        L.box('Blade pull lip', (cx - .08, y - .022, z - pitch * .3), (width - .34, .012, pitch * .12), 'e9-trim', 0)
        for k in range(2):
            role = 'e9-amber' if (r * 2 + k + seed) % 9 == 0 else 'e9-cyan'
            L.decal_quad('Blade LED', (cx + width / 2 - .23 + k * .05, y - .03, z + pitch * .12), .03, .02, '-Y',
                         role=role)
    L.box('Fibre comb', (cx + width / 2 - .11, y - .02, zc), (.05, .04, height - .2), 'e9-dark', 0)
    for r in range(5):
        L.box('Comb tooth', (cx + width / 2 - .11, y - .045, z0 + .25 + r * (height - .5) / 4), (.07, .012, .025),
              'e9-trim', 0)
    for zz in (.25, .75):
        L.hinge((cx - width / 2 + .02, y - .04, z0 + height * zz), .14, .014)
    L.handle((cx + width / 2 - .05, y - .045, zc), .28, 'Z', .025, .01, 'e9-ceramic', '-Y')


def monolith(y0, number, seed, broken=False):
    """Server monolith, 2.8 (X) x 1.5 (Y) x 2.45 m; doors face the camera (-Y).
    The never-seen north face stays plain."""
    w, d, h = 2.8, 1.5, 2.45
    front = y0 - d / 2
    L.box('Monolith core', (0, y0, h / 2), (w - .12, d - .04, h - .1), 'e9-body', .04)
    for sx in (-1, 1):
        for sy in (-1, 1):
            L.box('Monolith corner pillar', (sx * (w / 2 - .08), y0 + sy * (d / 2 - .06), h / 2 - .02),
                  (.18, .2, h - .06), 'e9-ceramic', .035)
    L.box('Monolith toe plinth', (0, y0, .06), (w + .06, d + .1, .12), 'e9-dark', .02)
    L.vent((0, front - .04, .2), w - .7, .14, 4, '-Y', .03)
    for k, dx in enumerate((-.66, .66)):
        blade_door(dx, front, 1.2, 1.78, .38, seed + k * 5)
    L.box('Cooling band', (0, front, 2.26), (w - .36, .06, .16), 'e9-trim', .015)
    for i in range(9):
        L.box('Cooling rib', (-1.0 + i * .25, front - .03, 2.26), (.035, .04, .15), 'e9-dark', 0)
    L.decal_quad('Rack plate', (.92, front - .062, 2.26), .4, .12, '-Y', 'black')
    L.stencil(f'R{number:02d}', (.92, front - .066, 2.26), .085, '-Y', 'stencil')
    # Sides (seen at an angle from the aisles): ribbed panels and a hatch.
    for sx in (-1, 1):
        face = 'X' if sx > 0 else '-X'
        L.inset_panel('Side service hatch', (sx * (w / 2), y0 - .1, 1.25), .8, 1.5, .02, .05, 'e9-body', 'e9-trim',
                      face)
        L.handle((sx * (w / 2 + .02), y0 - .38, 1.25), .22, 'Z', .02, .009, 'e9-ceramic', face)
        for k in range(3):
            L.box('Side rib', (sx * (w / 2 + .005), y0 + .45, .7 + k * .5), (.03, .1, .3), 'e9-dark', 0)
    # Crown: cap, riser, two fans, patch ridge, number and trunk glands.
    L.box('Crown cap', (0, y0, h + .04), (w - .04, d + .02, .1), 'e9-ceramic', .03)
    L.box('Crown riser', (0, y0, h + .13), (w - .5, d - .3, .1), 'e9-body', .025)
    for sx in (-1, 1):
        fx = sx * .78
        L.cylinder('Fan well', (fx, y0, h + .175), .42, .03, 'e9-dark', 'Z', 18, 0)
        L.torus('Fan shroud', (fx, y0, h + .2), .42, .035, 'e9-trim', 'Z', 16, 4)
        for b in range(6):
            a = 2 * math.pi * b / 6 + seed
            L.box('Fan blade', (fx + math.cos(a) * .2, y0 + math.sin(a) * .2, h + .19), (.32, .11, .012), 'e9-body',
                  0, rotation=(math.radians(25), 0, a + math.pi / 2))
        L.cylinder('Fan hub', (fx, y0, h + .2), .09, .04, 'e9-trim', 'Z', 8, 0)
        L.box('Fan guard bar', (fx, y0, h + .225), (.86, .02, .015), 'e9-trim', 0)
        L.box('Fan guard bar', (fx, y0, h + .225), (.02, .86, .015), 'e9-trim', 0)
    L.box('Patch ridge', (0, y0, h + .23), (.5, 1.0, .1), 'e9-dark', .02)
    for i in range(5):
        for j in (-1, 1):
            role = 'e9-amber' if broken and i == 2 else 'e9-cyan'
            L.decal_quad('Patch port', (j * .12, y0 - .36 + i * .18, h + .281), .08, .06, 'Z', role=role)
    L.stencil(f'{number:02d}', (-.95, y0 - .52, h + .092), .2, 'Z', 'stencil')
    for sy in (-1, 1):
        L.cylinder('Trunk gland', (.2, y0 + sy * .62, h + .2), .1, .16, 'e9-trim', 'Z', 9, 0)
        L.cylinder('Trunk gland collar', (.2, y0 + sy * .62, h + .29), .12, .04, 'e9-ceramic', 'Z', 9, 0)


def trunk(a, b, sag, glow=True):
    """Fibre trunk: thick jacketed conduit, a lit core strand and clamps."""
    pts = L.catenary(a, b, sag, 12)
    L.sweep('Fibre trunk jacket', pts, .075, 'p11-rubber', 8)
    if glow:
        off = Vector((.06, 0, .035))
        L.sweep('Fibre trunk lit strand', [p + off for p in pts], .02, 'e9-cyan', 5)
    for t in (.25, .75):
        p = pts[int(t * (len(pts) - 1))]
        L.cylinder('Trunk clamp', p, .09, .05, 'e9-trim', 'Y', 9, 0)


def relay_spine():
    """Hero set piece for Relay Racks: three server monoliths on a lit cable
    plinth, joined crown-to-crown by drooping fibre trunks that dive into two
    riser junctions. Runs north-south (Blender Y), 3.1 x 12.4 m footprint."""
    L.asset('relay-monolith-spine', 12000)
    length, width = 12.4, 3.05
    L.box('Spine plinth', (0, 0, .09), (width, length, .18), 'e9-dark', .03)
    L.box('Plinth deck', (0, 0, .19), (2.3, length - .1, .04), 'e9-body', .015)
    for side in (-1, 1):
        x = side * 1.32
        L.box('Trench glow', (x, 0, .16), (.16, length - .4, .01), 'e9-cyan', 0)
        for i in range(17):
            L.box('Trench grate bar', (x, -length / 2 + .35 + i * (length - .7) / 16, .19), (.36, .07, .03),
                  'e9-trim', 0)
        L.box('Plinth nosing', (side * 1.5, 0, .17), (.06, length, .05), 'e9-ceramic', .01)
    L.box('Plinth south nosing', (0, -length / 2, .17), (width, .06, .05), 'e9-ceramic', .01)
    ys = (-3.4, .5, 4.4)
    for i, y in enumerate(ys):
        monolith(y, i + 1, i * 1.7, broken=i == 1)
    h = 2.45 + .3
    # Crown-to-crown trunks (one lit, one dark) across each gap.
    trunk((.2, ys[0] + .62, h), (.2, ys[1] - .62, h), .6)
    trunk((.2, ys[1] + .62, h), (.2, ys[2] - .62, h), .55, glow=False)
    trunk((-.45, ys[0] + .55, h - .1), (-.45, ys[1] - .55, h - .1), .85, glow=False)
    trunk((-.45, ys[1] + .55, h - .1), (-.45, ys[2] - .55, h - .1), .8)
    for i, y in enumerate((ys[0] - .62, ys[2] + .62)):
        side = -1 if i == 0 else 1
        ey = side * 5.6
        # Riser junction: waist-high (south one is on the camera side).
        L.box('Riser junction', (0, ey, .5), (1.7, .8, .8), 'e9-body', .04)
        L.box('Riser lid', (0, ey, .93), (1.76, .86, .06), 'e9-ceramic', .02)
        L.grille_top((-.45, ey, .97), .55, .5, 6)
        if side < 0:
            L.screen('Riser status', (.4, ey - .41, .55), .55, .3, '-Y', 'bars', seed=2)
            L.hazard_band((-.45, ey - .41, .28), .6, .1, '-Y')
        L.stencil('F1' if side < 0 else 'F2', (.45, ey, .965), .14, 'Z', 'stencil')
        top = Vector((.2, y, h))
        L.sweep('Riser trunk', [top, top + Vector((0, side * .7, .1)), Vector((.25, ey, 1.35)),
                                Vector((.25, ey, .96))], .075, 'p11-rubber', 9, bend=.3)
        L.sweep('Riser trunk lit strand', [top + Vector((.06, 0, .035)), top + Vector((.06, side * .7, .135)),
                                           Vector((.31, ey, 1.38)), Vector((.31, ey, .97))], .02, 'e9-cyan', 5,
                bend=.3)
        L.cylinder('Riser gland', (.25, ey, 1.0), .11, .1, 'e9-trim', 'Z', 12, .01)


BUILDERS = [relay_spine]


def main():
    L.reset_scene()
    for build in BUILDERS:
        build()
    renders = '--render' in L.args()
    names = [a.name for a in L.ASSETS]
    L.export(PACK, OUT, PACK + '.glb', 'P11 communications and engineering hero set pieces.',
             f'blender -b --factory-startup -P tools/assets/p11-set-pieces/{Path(__file__).name}')
    if renders:
        for name in names:
            L.render(RENDERS / f'{name}-game.png', [name], 'game')
            L.render(RENDERS / f'{name}-hero.png', [name], 'hero')


main()
