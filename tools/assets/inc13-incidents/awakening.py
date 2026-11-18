"""Breached recovery bank. Original MIT. Blender Z-up, aisle toward -Y."""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'p11-set-pieces'))
import p11lib as L
from compact_uv import compact_uv

L.reset_scene()
L.asset('breached-recovery-bank', 12000)

def hull(x, width, length, z, height, finish):
    corners = [(-.64,-1),(.64,-1),(1,-.76),(1,.65),(.58,1),(-.58,1),(-1,.65),(-1,-.76)]
    return L.slab('Pressure capsule', [(x+a*width,b*length) for a,b in corners],
                  z,z+height,finish,.04)

for index, x in enumerate((-4.15,-2.48,-.81,.86,2.53,4.20)):
    hull(x,.63,.97,0,.18,'e9-dark')
    hull(x,.79,1.12,.16,.52,'e9-body')
    hull(x,.73,1.06,.68,.08,'p11-steel')
    hull(x,.61,.92,.76,.04,'p11-rubber')
    if index in (0,1):
        # Two peeled shells with exposed dark cavities and a jagged fracture lip.
        sign = 1 if index == 1 else -1
        outline = [(-.93,.78),(.78,.80),(.89,1.84),(.43,2.14),(.13,1.86),
                   (-.09,2.02),(-.21,1.72),(-.57,1.89),(-.78,1.51)]
        for side in (-1,1):
            offset=x+side*.59
            lid=L.profile_x('Split pressure shell',outline,offset-.046,offset+.046,'e9-trim',.018)
            for v in lid.data.vertices:
                v.co.x += side*(v.co.z-.78)*(.36 if side == sign else .15)
                v.co.z=.78+(v.co.z-.78)*(1 if side == sign else .52)
        # Broken pressure bands stay attached at one end and curl into the aisle.
        for side in (-1, 1):
            L.sweep('Peeled canopy band',[(x+side*.60,-.68,.80),(x+side*.74,-.79,1.05),
                    (x+side*.81,-.91,1.19),(x+side*.91,-1.05,1.13)],.036,'p11-steel',6)
        hull(x,.40,.65,.80,.035,'p11-tint-metal')
        L.box('Dark patient liner',(x,-.06,.85),(.55,1.10,.07),'p11-rubber',.06)
        L.box('Exposed neck rest',(x,.48,.84),(.58,.34,.12),'p11-rubber',.045)
        L.sweep('Severed hose',[(x,.67,.9),(x-.22,.4,1.22),(x-.46,.06,1.04),
                (x-.52,-.34,.90),(x-.31,-.61,1.05)],.048,'p11-rubber')
        L.cylinder('Sheared coupling',(x-.31,-.61,1.06),.071,.11,'p11-steel','Z',8)
        L.lamp_strip('Breach signal',(x,-1.07,.64),.56,'X','e9-cyan')
    else:
        hull(x,.67,.98,.79,.18,'e9-trim')
        hull(x,.48,.76,.97,.055,'p11-tint-metal')
        L.box('Smoked viewing window',(x,.17,1.04),(.74,.76,.065),'e9-dark',.07)
    for side in (-1,1):
        L.box('Lock shoe',(x+side*.70,-.44,.64),(.17,.29,.28),'p11-steel',.025)
L.box('Service spine',(0,.95,.19),(10,.47,.38),'e9-body',.05)
# Overturned medical trolley at the foot of the failed pair.
for y in (-1.56,-2.25):
    L.box('Trolley shelf on edge',(-3.4,y,.53),(1.31,.07,.83),'e9-trim',.05,
          rotation=(.13,0,-.13))
for x in (-4,-2.8):
    L.sweep('Cart frame',[(x,-1.4,.14),(x,-2.42,.14),(x,-2.48,.92),(x,-1.4,.92)],.044,'p11-steel')
    for z in (.14,.92):
        L.cylinder('Caster',(x,-1.39,z),.12,.09,'p11-rubber','X',12)
out=L.ROOT/'public/assets/inc13/awakening'
L.export('inc13-awakening',out,'bank.glb','Six pressure berths with a twin shell failure and overturned treatment cart.',
         'blender -b -P tools/assets/inc13-incidents/awakening.py')
compact_uv(out/'bank.glb',out/'manifest.json')
