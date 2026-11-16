"""P11 cryogenic and security landmarks; original MIT geometry."""
import sys, math, bpy
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import p11lib as L
from mathutils import Matrix
OUT=L.ROOT/'public/assets/p11/clinical-security'
RENDERS=L.ROOT/'artifacts/nextgen/p11-final/beauty'
# Shared-machine beauty rendering: CPU avoids concurrent Metal compilation; two threads.
from cpu_preview import stage as _stage
def preview_stage():
    scene=_stage();scene.cycles.device='CPU';scene.cycles.samples=16;scene.render.threads=2
    return scene
L._stage=preview_stage


def berth(x,y,open=False,index=0):
    # Recessed angled cradle, captive shoulder shell, foot manifold and service couplings.
    L.profile_x('Berth cradle',[(y-.9,.12),(y+.9,.12),(y+.9,.68),(y+.5,.95),(y-.65,.58),(y-.9,.37)],x-.48,x+.48,'p11-tint-metal',.04,tint='navy')
    L.box('Recessed patient pad',(x,y,.65),(.65,1.3,.10),'p11-rubber',.04,rotation=(.20,0,0))
    for sx in (-1,1):
        L.sweep('Cradle perimeter rail',[(x+sx*.46,y-.85,.48),(x+sx*.46,y-.55,.69),(x+sx*.46,y+.55,.94),(x+sx*.46,y+.85,.78)],.065,'p11-steel',6)
        for yy in (-.55,.55):L.cylinder('Lock piston',(x+sx*.5,y+yy,.43),.06,.5,'p11-steel','Z',8,0)
    if not open:
        L.profile_x('Frosted canopy',[(y-.62,.73),(y+.55,.99),(y+.71,1.07),(y+.48,1.31),(y-.48,1.05)],x-.35,x+.35,'p11-steel',.025)
        L.box('Canopy glass gasket',(x,y-.02,1.185),(.53,.77,.028),'p11-rubber',.025,rotation=(.28,0,0))
        L.box('Deep observation glass',(x,y-.02,1.205),(.43,.65,.02),'p11-tint',.018,rotation=(.28,0,0),tint='teal' if index%3 else 'navy')
        # Ice clings unevenly to the pressure glazing edges, leaving a viewing slit.
        for side in (-1,1):
            import bmesh
            bm=bmesh.new()
            contour=[(.215,-.30),(.215,.30),(.16,.30),(.12,.22),(.17,.13),(.13,.02),(.17,-.08),(.12,-.17),(.17,-.30)]
            bm.faces.new([bm.verts.new((x+side*xx,y-.02+yy,1.225+yy*math.sin(.28))) for xx,yy in contour])
            L.mesh_object('Uneven frost accretion',bm,'p11-frost',smooth=False)
        L.box('Glass pressure mullion',(x,y+.08,1.24),(.46,.035,.025),'p11-steel',0,rotation=(.28,0,0))
        for yy in (-.35,.4): L.box('Canopy pressure strap',(x,y+yy,1.19+yy*.27),(.8,.075,.035),'p11-steel',.008,rotation=(.28,0,0))
    else:
        L.profile_x('Retracted canopy',[(y+.6,.95),(y+.9,1.0),(y+.9,1.85),(y+.65,1.65)],x-.4,x+.4,'p11-steel',.015)
        L.box('Retracted lid frost window',(x,y+.58,1.39),(.50,.025,.48),'p11-frost',.03)
        L.box('Head cushion',(x,y+.4,.83),(.45,.30,.14),'p11-rubber',.05)
    for sx in (-1,1):
        for yy in (-.4,.35):L.cylinder('Pressure latch',(x+sx*.43,y+yy,.82+yy*.27),.055,.045,'e9-trim','X',8,0)
    L.box('Foot service pod',(x,y-.93,.39),(.8,.24,.58),'p11-tint-metal',.035,tint='navy')
    L.screen('Berth vitals',(x,y-1.06,.48),.44,.21,'-Y','bars')
    L.gauge((x+.29,y-1.06,.28),.06)
    for sx in (-1,1):
        L.sweep('Umbilical',[(x+sx*.30,y+.8,.78),(x+sx*.58,y+.85,.55),(x+sx*.63,y+.5,.18),(x+sx*.63,y-.8,.18),(x+sx*.4,y-.94,.32)],.035,'p11-rubber',7)
        L.cylinder('Umbilical connector',(x+sx*.3,y+.8,.78),.075,.13,'p11-steel','Z',8,0)

def awakening():
    L.asset('awakening-berth-array',12000)
    for i,x in enumerate([-4.55+i*1.3 for i in range(8)]):
        berth(x,0,i in (3,4),i)
        L.stencil(str(i+1).zfill(2),(x,-1.065,.22),.10,'-Y')
    # The emergency release failed mid-cycle: one canopy is kicked sideways,
    # its torn tether ends at the exposed socket; the recovery wrap hangs out.
    for ob in list(L.CURRENT.children):
        if ob.name.startswith(('Retracted canopy','Retracted lid frost')):
            center=ob.data.vertices[0].co.x
            if center>0:
                ob.data.transform(Matrix.Translation((.65,.6,.95)) @ Matrix.Rotation(-.65,4,'Y') @ Matrix.Translation((-.65,-.6,-.95)))
    L.sweep('Disconnected recovery tether',[(.96,.8,.8),(1.11,.6,.52),(.9,.3,.35),(.83,-.15,.42),(.93,-.45,.63)],.035,'p11-rubber',6)
    L.cylinder('Torn tether plug',(.93,-.45,.65),.065,.13,'p11-steel','Z',8,0)
    L.slab('Emergency wrap caught on rim',[(-.97,-.48),(-.38,-.55),(-.32,.26),(-.79,.33),(-.91,.1)],.74,.755,'p11-tint',0,tint='cream')
    L.profile_x('Wrap hanging over broken latch',[(-.48,.75),(-.85,.67),(-.89,.25),(-.82,.18),(-.79,.61),(-.46,.73)],-.98,-.72,'p11-tint',0,tint='cream')
    for xx in (-.91,-.83):L.sweep('Recovery wrap crease',[(xx,-.5,.765),(xx,-.70,.68),(xx,-.84,.26)],.007,'p11-tint',3,tint='sand')
    L.box('Released manual handle',(.25,-.88,.88),(.24,.06,.05),'p11-steel',.005,rotation=(0,.4,.3))
    L.box('Release handle socket',(.22,-.87,.72),(.20,.12,.025),'p11-rubber',.008)
    L.box('Supply spine',(0,1.0,.22),(10.6,.3,.38),'p11-tint-metal',.03,tint='navy')
    L.box('Open supply junction recess',(4.9,1.0,.43),(.48,.27,.08),'p11-rubber',.01)
    for x in (4.74,4.89,5.04):L.box('Exposed coolant contact',(x,1.0,.49),(.035,.21,.035),'e9-trim',0)
    L.box('Hinged service cover',(5.18,1.0,.60),(.28,.28,.035),'p11-tint-metal',.01,rotation=(0,.8,0),tint='navy')
    for i in range(21):L.box('Cooling fin',(-4.95+i*.47,1.0,.44),(.18,.32,.06),'e9-trim',.006)
    L.lamp_strip('Cryo bank status',(0,1.16,.28),10.0,'X','e9-cyan',.025,.025)

def passenger():
    L.asset('passenger-sleeper-carrier',12000)
    for sx in (-1,1):
        L.box('Carrier corner beam',(sx*1.4,0,1.55),(.13,1.4,3.1),'p11-tint-metal',.025,tint='navy')
        L.box('Captive rail',(sx*1.25,-.68,1.55),(.07,.07,2.9),'e9-trim',.01)
    for row in range(4):
        z=.3+row*.7
        before=set(L.CURRENT.children)
        L.box('Sleeper drawer',(0,0,z),(2.55,1.25,.57),'p11-tint-metal',.035,tint='navy')
        L.inset_panel('Sleeper lid',(0,-.64,z),2.3,.43,.035,.04,'e9-ceramic','p11-steel')
        L.handle((.75,-.69,z),.48,'X',.055,.022)
        L.stencil('C'+str(row+11),(-.72,-.70,z),.14,'-Y')
        L.lamp_strip('Occupant life strip',(-.1,-.70,z),.42,'X','e9-cyan',.015,.025)
        for sx in (-1,1):L.hinge((sx*1.08,-.69,z),.28,.022)
        L.inset_panel('Sleeper ID window',(-.72,-.71,z+.13),.39,.075,.008,.009,'p11-steel','e9-glass')
        for sx in (-1,1):
            L.cylinder('Captive lock',(sx*.98,-.72,z),.055,.025,'e9-trim','Y',8,0)
            L.box('Lock tongue',(sx*.98,-.74,z),(.06,.01,.015),'p11-rubber',0)
        if row==3:
            for ob in set(L.CURRENT.children)-before:ob.data.transform(Matrix.Translation((0,-.35,0)))
            L.box('Released slide carriage',(0,-.70,z-.31),(2.45,.40,.045),'p11-rubber',.004)
            # Drawer C14 was opened for one child; the small personal effects
            # remain on the exposed tray beside the vacant recovery wrapping.
            L.box('Drawn drawer vacant recess',(0,-.86,z+.29),(1.9,.27,.015),'p11-rubber',.01)
            for sx in (-1,1):
                L.profile_x('Small passengers abandoned boots',[(-1.04,z+.30),(-.78,z+.30),(-.78,z+.53),(-.91,z+.57),(-.92,z+.40),(-1.04,z+.37)],sx*.18-.065,sx*.18+.065,'p11-tint',.015,tint='cushion')
                L.box('Child boot strap',(sx*.18,-.9,z+.47),(.145,.032,.045),'p11-tint',.004,tint='cream')
            L.box('Folded recovery wrap',(-.66,-.87,z+.34),(.41,.23,.07),'p11-tint',.02,tint='cream')
            L.decal_quad('Passenger boarding keepsake',(.64,-.86,z+.31),.31,.20,'Z','paper',rotation=.13)
            L.decal_quad('Passenger blue destination stamp',(.64,-.86,z+.315),.17,.04,'Z','crayon-blue',rotation=.13)
            L.sweep('Unclasped identity wristband',[(.35,-1.02,z+.31),(.42,-.98,z+.34),(.48,-.88,z+.35),(.44,-.78,z+.33)],.018,'p11-tint',5,tint='cream')

    L.box('Carrier base',(0,0,.08),(2.95,1.5,.16),'p11-steel',.025)
    for sx in (-1,1):
        L.cylinder('Carrier trolley wheel',(sx*1.06,.35,.1),.14,.13,'p11-rubber','X',10,0)
        L.sweep('Coolant return',[(sx*1.42,.6,.2),(sx*1.42,.6,2.9)],.045,'p11-rubber',8)
    # Roof module is an exposed heat exchanger, not another blank drawer lid.
    L.box('Top service plinth',(0,.12,2.75),(2.35,.85,.12),'p11-rubber',.018)
    for x in (-.9,.9):
        L.box('Heat exchanger header',(x,.12,2.91),(.18,.78,.27),'p11-steel',.025)
    for y in (-.19,.02,.23,.44):
        L.sweep('Captive cooling loop',[(-.9,y,2.99),(-.675,y,3.08),(.675,y,3.08),(.9,y,2.99)],.024,'p11-steel',6)
    for x in [-.67+i*.15 for i in range(10)]:L.box('Heat exchanger deep fin',(x,.12,2.94),(.035,.68,.24),'p11-tint-metal',.004,tint='navy')
    for sx in (-1,1):
        L.sweep('Connected roof coolant hose',[(sx*1.42,.6,2.9),(sx*1.18,.6,3.13),(sx*.9,.45,3.01)],.042,'p11-rubber',7)
        L.bolt_row((sx*1.18,-.55,2.73),(sx*1.18,.48,2.73),4,.025,'Z')
        L.handle((sx*1.30,.15,3.12),.48,'Y',.10,.035,'p11-steel','Z')
    L.inset_panel('Roof pump hatch',(0,-.5,2.85),.52,.28,.035,.035,'p11-steel','e9-dark')
    L.gauge((0,-.55,2.85),.075)
    L.box('Rack destination placard',(0,-.55,3.04),(1.4,.09,.16),'p11-steel',.01)
    L.stencil('NEW EARTH',(0,-.60,3.04),.10,'-Y')

def scanner():
    L.asset('checkpoint-scanner-gate',12000)
    for sx in (-1,1):
        x=sx*2.546
        L.profile_x('Scanner swept pylon',[(-.5,0),(.55,0),(.55,2.8),(.2,3.25),(-.3,3.25),(-.5,2.8)],x-.304,x+.304,'p11-tint-metal',.035,tint='navy')
        L.box('Scanner inset',(x-sx*.26,0,1.65),(.05,.60,2.2),'e9-dark',.015)
        for z in (.7,1.2,1.7,2.2,2.7):
            L.cylinder('Optical sensor',(x-sx*.30,0,z),.10,.06,'e9-trim','X',12,0)
            L.cylinder('Sensor pupil',(x-sx*.34,0,z),.05,.012,'e9-cyan','X',10,0)
        L.inset_panel('Scanner access hatch',(x,-.52,1.35),.36,1.30,.02,.025,'p11-steel','e9-trim')
        L.vent((x,-.54,.42),.35,.24,4)
        for z in (.8,1.85):L.hinge((x-.17,-.55,z),.15,.018)
    L.box('Scanner header',(0,0,3.15),(5.7,.9,.28),'p11-tint-metal',.04,tint='navy')
    for x in (-1.65,1.65):
        L.grille_top((x,0,3.30),1.1,.57,7)
        L.bolt_row((x-.5,-.35,3.30),(x+.5,-.35,3.30),4,.022,'Z')
    for x in (-.85,.85):L.box('Header assembly seam',(x,0,3.30),(.035,.88,.012),'p11-rubber',0)
    L.screen('Scan result',(1.25,-.46,3.15),1.0,.17,'-Y','bars')
    L.box('Scanner threshold',(0,0,.035),(5.7,1.1,.07),'p11-steel',.01)
    for sx in (-1,1):L.lamp_strip('Gate strip',(sx*2.22,-.3,1.65),2.35,'Z','e9-cyan',.025,.03)
    L.stencil('BIO SCAN',(-1.25,-.46,3.15),.11,'-Y')

    barricade_before=set(L.CURRENT.children)
    # Failed barricade: its two shield leaves are folded against the gate
    # jambs, ripped at the hinge, leaving the full 140-unit opening clear.
    for sx in (-1,1):
        x=sx*2.57
        L.profile_x('Buckled barricade shield',[(-.45,.25),(-.51,1.35),(-.34,1.78),(-.1,1.70),(.12,.45),(-.10,.21)],x-.23,x+.23,'p11-tint-metal',.02,tint='navy')
        L.box('Ballistic vision slit',(x,-.49,1.43),(.27,.025,.075),'p11-rubber',.008)
        for zz in (.6,1.1):L.hinge((x+sx*.17,-.49,zz),.24,.027)
        L.sweep('Bent captive barrier brace',[(x,-.30,.4),(x+sx*.12,-.45,.85),(x+sx*.22,-.41,1.2)],.035,'p11-steel',6)
        for dx,zz in ((-.10,.88),(.08,.73),(.02,1.12)):
            L.cylinder('Shield impact chipped metal',(x+dx,-.515,zz),.052,.008,'p11-steel','Y',7,0)
            L.cylinder('Shield deep impact',(x+dx,-.523,zz),.033,.012,'p11-rubber','Y',7,0)
    L.sweep('Broken release cable',[(-2.57,.23,1.7),(-2.64,.35,1.28),(-2.69,.40,.73),(-2.63,.30,.32)],.023,'p11-rubber',6)
    L.box('Barrier torn latch plate',(2.57,-.52,.95),(.22,.035,.16),'p11-steel',.01,rotation=(0,.17,.18))

    # Bring damaged leaves forward of the scanner access panels; the render
    # exposed their earlier coplanar concealment. Width/opening is unchanged.
    for ob in set(L.CURRENT.children)-barricade_before:ob.data.transform(Matrix.Translation((0,-.33,0)))

    # Suspended scanning head on a captive gimbal and drive carriage.
    L.box('Scanner carriage',(0,0,3.32),(.76,.72,.16),'p11-rubber',.025)
    L.grille_top((-.12,.08,3.405),.25,.42,4)
    L.cylinder('Head cable gland',(.16,.12,3.41),.065,.06,'p11-steel','Z',8,0)
    L.bolt_row((-.31,-.28,3.405),(.31,-.28,3.405),3,.023,'Z')
    for sx in (-1,1):
        L.box('Gimbal clevis',(sx*.32,-.5,2.94),(.10,.24,.48),'p11-steel',.018)
        L.cylinder('Gimbal pivot',(sx*.34,-.5,2.78),.10,.14,'e9-trim','X',12,.01)
        L.profile_x('Header corner gusset',[(-.4,2.55),(-.4,3.0),(.3,3.0)],sx*2.22-.04,sx*2.22+.04,'p11-steel',.015)
        L.bolt_row((sx*2.42,-.5,.8),(sx*2.42,-.5,1.85),4,.024,'-Y')
    L.cylinder('Scanning head barrel',(0,-.55,2.78),.25,.50,'p11-tint-metal','Y',16,.025,tint='navy')
    L.cylinder('Lens captive ring',(0,-.82,2.78),.21,.08,'p11-steel','Y',16,.01)
    L.cylinder('Lens dark aperture',(0,-.87,2.78),.16,.02,'p11-rubber','Y',16,0)
    L.cylinder('Lens illuminated pupil',(0,-.89,2.78),.095,.012,'e9-cyan','Y',16,0)
    L.sweep('Scanner head signal cable',[(.16,.12,3.34),(.16,-.13,3.52),(.38,-.49,3.36),(.35,-.6,2.94),(.12,-.4,2.8)],.025,'p11-rubber',6)
    for sx in (-1,1):
        L.box('Field emitter cheek',(sx*2.18,.15,1.65),(.12,.42,.75),'p11-tint-metal',.025,tint='navy')
        L.cylinder('Emitter shield rim',(sx*2.11,.15,1.65),.18,.13,'p11-steel','X',12,.01)
        L.cylinder('Emitter ceramic core',(sx*2.02,.15,1.65),.12,.04,'e9-ceramic','X',12,.01)


def broken_barrier():
    L.asset('checkpoint-failed-barrier',12000)
    # A captured barrier leaf torn from its drive, folded onto the booth rail.
    # Complete footprint fits the existing 200x24-unit north guard-cage solid.
    L.box('Broken gate drive shoe',(-2.30,0,.98),(.70,.58,.16),'p11-tint-metal',.025,tint='navy')
    L.cylinder('Sheared hinge barrel',(-2.30,0,1.19),.16,.56,'p11-steel','Y',12,.012)
    L.cylinder('Exposed hinge pin',(-2.30,-.30,1.19),.07,.09,'p11-rubber','Y',10,0)
    # Profile is authored in X/Z, then rotated into a narrow Y extrusion.
    def plate(name,points,tint):
        ob=L.profile_x(name,points,-.085,.085,'p11-tint-metal',.018,tint=tint)
        ob.data.transform(Matrix.Rotation(-math.pi/2,4,'Z'))
    plate('Buckled ballistic gate left',[(-2.2,1.02),(-2.2,2.00),(-1.65,2.03),(-.60,1.60),(-.23,1.65),(-.02,1.43),(-.30,1.31),(-.10,1.14),(-.42,.98)],'navy')
    plate('Torn gate right half',[(.05,1.06),(.23,1.29),(.04,1.49),(.37,1.57),(1.4,1.14),(2.55,1.12),(2.55,.94),(.4,.94)],'service-blue')
    for points in [[(-2.18,-.12,2.02),(-1.65,-.12,2.05),(-.65,-.12,1.62),(-.21,-.12,1.67)],[(.36,-.12,1.59),(1.43,-.12,1.17),(2.55,-.12,1.15)], [(-2.18,-.12,1.02),(-.44,-.12,.99)]]:
        L.sweep('Bent exposed gate edge',points,.045,'p11-steel',6)
    for x,z in [(-1.8,1.5),(-1.1,1.35),(1.2,1.04),(1.9,1.03)]:
        L.box('Barrier rib',(x,-.13,z),(.10,.055,.48 if x<0 else .18),'p11-steel',.008,rotation=(0,-.35 if x<0 else 0,0))
    L.box('Broken vision frame',(-1.65,-.14,1.76),(.51,.06,.15),'p11-steel',.008,rotation=(0,-.24,0))
    L.box('Fractured vision opening',(-1.65,-.177,1.76),(.40,.012,.075),'p11-rubber',0,rotation=(0,-.24,0))
    for x,z in [(-1.25,1.51),(-.85,1.32),(-1.0,1.43)]:
        L.cylinder('Barrier impact bare edge',(x,-.102,z),.08,.015,'p11-steel','Y',7,0)
        L.cylinder('Barrier impact hole',(x,-.114,z),.05,.02,'p11-rubber','Y',7,0)
    L.sweep('Torn actuator linkage',[(-2.3,.2,1.13),(-1.9,.23,1.32),(-1.2,.24,1.08),(-.7,.24,.94)],.045,'p11-steel',7)
    L.sweep('Severed barrier power cable',[(-2.3,-.22,1.1),(-2.0,-.25,.96),(-1.7,-.24,.94),(-1.5,-.24,1.08)],.025,'p11-rubber',6)
    L.stencil('HOLD',(-1.4,-.19,1.19),.15,'-Y','cream')

def armory():
    L.asset('armory-weapon-carousel',12000)
    L.cylinder('Carousel base',(0,0,.16),1.45,.32,'p11-tint-metal','Z',24,.025,tint='navy')
    L.cylinder('Rotary bearing',(0,0,.38),1.23,.14,'e9-trim','Z',24,.015)
    # Open drive shaft and a bolted octagonal motor casing replace the blank drum.
    L.cylinder('Central drive shaft',(0,0,1.30),.12,1.55,'p11-steel','Z',12,.012)
    L.cylinder('Motor cast housing',(0,0,.69),.43,.46,'p11-tint-metal','Z',8,.025,tint='navy')
    L.cylinder('Upper latch distributor',(0,0,1.85),.31,.43,'p11-tint-metal','Z',8,.025,tint='navy')
    L.cylinder('Distributor end plate',(0,0,2.08),.28,.045,'p11-steel','Z',8,.008)
    L.cylinder('Recessed shaft cap',(0,0,2.11),.11,.025,'p11-rubber','Z',8,0)
    for i in range(8):
        a=i*math.pi/4
        L.bolt((math.cos(a)*.22,math.sin(a)*.22,2.115),.022,'Z')
        L.box('Motor cooling rib',(math.cos(a)*.4,math.sin(a)*.4,.69),(.06,.15,.33),'p11-steel',.008,rotation=(0,0,a))
        L.sweep('Latch actuation cable',[(math.cos(a)*.26,math.sin(a)*.26,1.85),(math.cos(a)*.65,math.sin(a)*.65,1.66),(math.cos(a)*.93,math.sin(a)*.93,1.55)],.018,'p11-rubber',5)
        L.box('Base captive inspection panel',(math.cos(a)*1.25,math.sin(a)*1.25,.33),(.22,.24,.025),'p11-rubber',.01,rotation=(0,0,a))
    L.box('Gearbox service hatch',(0,-.435,.7),(.4,.035,.25),'p11-steel',.018)
    L.bolt_row((-.14,-.46,.78),(.14,-.46,.78),2,.022,'-Y')
    L.torus('Upper retaining hoop',(0,0,2.2),1.02,.045,'p11-steel','Z',24,6)
    L.torus('Lower retaining hoop',(0,0,.60),1.02,.06,'p11-steel','Z',24,6)
    for i in range(8):
        a=i*math.pi/4;x,y=math.cos(a)*.93,math.sin(a)*.93
        # Authored rifle silhouette: swept butt, trigger well, angled magazine,
        # vented handguard and offset optic; all geometry rotates with its rack.
        before=set(L.CURRENT.children)
        L.profile_x('Weapon swept stock',[(-.09,.7),(.21,.7),(.21,.82),(.10,.94),(.10,1.05),(-.07,1.05)],-.075,.075,'p11-rubber',.012)
        L.box('Weapon receiver',(0,0,1.30),(.14,.22,.51),'p11-tint-metal',.016,tint='navy')
        L.box('Receiver ejection recess',(.075,.005,1.40),(.008,.12,.09),'p11-rubber',.004)
        L.box('Charging lever',(.105,.015,1.43),(.06,.035,.035),'p11-steel',.004)
        L.box('Stock shoulder pad',(0,.06,.71),(.17,.29,.055),'p11-rubber',.012)
        for zz in (1.19,1.31):L.bolt((-.078,-.02,zz),.015,'X')
        L.profile_x('Weapon pistol grip',[(-.10,1.30),(-.23,1.22),(-.28,1.02),(-.17,1.02),(-.09,1.19)],-.055,.055,'p11-rubber',.008)
        L.torus('Trigger guard',(0,-.13,1.29),.07,.012,'p11-steel','X',10,4)
        L.box('Weapon magazine',(0,.15,1.10),(.10,.15,.30),'p11-steel',.008,rotation=(.22,0,0))
        L.box('Vented handguard',(0,0,1.65),(.16,.15,.30),'p11-rubber',.012)
        for z in (1.56,1.64,1.72):L.box('Handguard cooling slot',(0,-.079,z),(.105,.012,.025),'e9-trim',0)
        L.cylinder('Weapon barrel',(0,0,2.0),.032,.44,'p11-steel','Z',8,0)
        L.cylinder('Weapon muzzle',(0,0,2.23),.045,.10,'p11-rubber','Z',8,0)
        L.cylinder('Weapon optic',(0,-.13,1.66),.038,.22,'p11-steel','Z',10,0)
        weapons=set(L.CURRENT.children)-before
        if i in (0,1,2):
            # Empty clamps record an interrupted emergency issue, not a full display.
            for ob in weapons:bpy.data.objects.remove(ob,do_unlink=True)
        else:
            transform=(Matrix.Translation((0,1.2,.62)) @ Matrix.Rotation(math.pi/2,4,'X')) if i==6 else Matrix.Translation((x,y,0)) @ Matrix.Rotation(a,4,'Z')
            for ob in weapons:ob.data.transform(transform)
        L.box('Captive rifle clamp',(x,y,1.55),(.19,.23,.055),'e9-trim',.008,rotation=(0,0,a))
        L.sweep('Carousel spoke',[(0,0,.61),(x,y,.61)],.035,'p11-steel',6)
        L.cylinder('Slot status',(x,y,.44),.035,.01,'e9-cyan','Z',8,0)
    # Open ammunition cassette beside the dropped rifle, on the solid base.
    L.box('Issue cassette shell',(.65,-.32,.50),(.56,.61,.30),'p11-tint-metal',.025,tint='navy')
    L.box('Cassette recessed interior',(.65,-.32,.655),(.45,.50,.018),'p11-rubber',.015)
    L.box('Issue cassette flipped lid',(.65,.04,.76),(.56,.045,.47),'p11-tint-metal',.018,rotation=(-.24,0,0),tint='navy')
    L.handle((.65,-.64,.50),.25,'X',.05,.02)
    for xx in (.51,.65,.79):
        for yy in (-.45,-.25):
            L.cylinder('Foam cartridge socket',(xx,yy,.67),.045,.015,'p11-rubber','Z',8,0)
            if xx!=.79:L.cylinder('Unissued cartridge',(xx,yy,.74),.032,.15,'p11-steel','Z',8,0)
    for xx,yy,a in ((-.54,-.65,.4),(-.68,-.51,1.0),(-.43,-.39,-.5)):
        L.cylinder('Spent cartridge on carousel',(xx,yy,.35),.026,.13,'e9-trim','X',8,0)
    L.decal_quad('Abandoned issue ticket',(.72,-.91,.331),.25,.21,'Z','paper',rotation=.24)
    L.box('Issue console',(0,-1.15,.64),(.65,.36,.48),'p11-steel',.03)
    L.screen('Issue inventory',(0,-1.34,.7),.48,.26,'-Y','grid')
    L.stencil('ISSUE 04',(0,-1.35,.46),.09,'-Y')

L.reset_scene()
for f in (awakening,passenger,scanner,broken_barrier,armory):f()
L.export('clinical-security',OUT,'clinical-security.glb','Cryogenic recovery and security landmarks.', 'blender -b --factory-startup -P tools/assets/p11-set-pieces/clinical_security.py')
from compact_uv import compact_uv
compact_uv(OUT/'clinical-security.glb',OUT/'manifest.json')
if '--render' in L.args():
 for a in [v for v in L.ASSETS if not any(a.startswith('--only=') for a in L.args()) or '--only='+v.name in L.args()]:L.render(RENDERS/(a.name+'-game.png'),[a.name],'game',scale=1.25 if a.name=='armory-weapon-carousel' else 1.0)
