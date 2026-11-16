"""P11 manufactured forms and vertex curvature/wear for original E9 meshes."""
import bmesh

def bake_craft(group):
    """Bake deterministic convex edge wear and concave grime after original AO.

    Keep luminous, glass and walking-deck finishes untouched. No geometry, material
    ownership or named origin changes happen here.
    """
    for obj in group.children:
        mesh=obj.data
        material=mesh.materials[0]
        name=material.name
        if any(s in name for s in ('cyan','amber','green','violet','glass','floor')):
            continue
        layer=mesh.color_attributes.active_color
        if layer is None:
            continue
        bm=bmesh.new(); bm.from_mesh(mesh); bm.verts.ensure_lookup_table()
        factors=[]
        for v in bm.verts:
            terms=[]
            for edge in v.link_edges:
                delta=edge.other_vert(v).co-v.co
                if delta.length>1e-6: terms.append(-v.normal.dot(delta.normalized()))
            curvature=sum(terms)/max(1,len(terms))
            factors.append(1+min(.10,max(0,curvature)*.35)-min(.14,max(0,-curvature)*.5))
        bm.free()
        for loop in mesh.loops:
            color=layer.data[loop.index].color
            f=factors[loop.vertex_index]
            layer.data[loop.index].color=tuple(min(1,max(0,c*f)) for c in color[:3])+(color[3],)
        mesh.update()



def craft_forms(api, groups):
    """Second P11 pass: functional service breaks, connections and closure hardware.

    Named detail recipes preserve native origins and supporting roof heights.
    Already dense pump/manifold/plenum mechanisms retain their authored hardware;
    no decimation or hidden triangle budget relaxation is used.
    """
    import bpy
    box, cylinder = api['box'], api['cylinder']
    material = api['MATERIALS']
    def tri(group):
        return sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in group.children if o.type=='MESH')
    def plate(name, xyz, size, role='e9-body'):
        return box(name, xyz, size, role, 0)
    def hatch(x, y, z, w, h):
        outward = -1 if y < 0 else 1
        plate('Service hatch gasket', (x,y,z),(w,.026,h),'e9-dark')
        plate('Removable access door',(x,y+outward*.018,z),(w-.06,.02,h-.06),'e9-body')
        for zz in [z-h*.28,z+h*.28]:
            cylinder('Hatch captive hinge',(x-w*.42,y+outward*.036,zz),.022,.095,'e9-trim','Z',8)
            plate('Hinge welded leaf',(x-w*.36,y+outward*.03,zz),(.12,.018,.055),'e9-trim')
        plate('Quarter-turn latch pocket',(x+w*.33,y+outward*.033,z),(.075,.018,.12),'e9-dark')
        plate('Latch lever',(x+w*.33,y+outward*.048,z),(.025,.018,.08),'e9-trim')
    def vent(x,y,z,w,h):
        plate('Deep cooling intake',(x,y,z),(w,.035,h),'e9-dark')
        for k in range(4):
            blade=plate('Folded cooling louvre',(x,y-.024,z+(k-1.5)*h*.21),(w-.04,.035,.018),'e9-trim')
            blade.rotation_euler[0]=.45
    def ports(x,y,z):
        outward = -1 if y < 0 else 1
        for off,r in [(-.12,.042),(.12,.058)]:
            cylinder('Paired service connector',(x+off,y,z),r,.06,'e9-trim','Y',8)
            cylinder('Connector recessed bore',(x+off,y+outward*.033,z),r*.58,.005,'e9-dark','Y',8)
    for group in groups:
        api['CURRENT']=group
        name=group.name
        if name=='pump-skid':
            # Exchange a blank plaque and one tiny meter tick for actual casing
            # joints, keeping this already-detailed module at 1,500 triangles.
            removed_tick=False
            for obj in list(group.children):
                if obj.name.startswith('Pump row designation') or (not removed_tick and obj.name.startswith('Quiet meter graduations')):
                    if obj.name.startswith('Quiet meter graduations'):removed_tick=True
                    bpy.data.objects.remove(obj,do_unlink=True)
        # A dark structural cap is a casing, not an appliance's white blank lid.
        for obj in list(group.children):
            if obj.type!='MESH':continue
            if any(word in obj.name for word in ['Bright continuous cutaway cap','Broad ceramic wall cap','Booth roof cap','Tower continuous cap','Rack cap','Broad off-white gantry cap']):
                obj.data.materials.clear();obj.data.materials.append(material['e9-body'])
                if tri(group)<=1476:
                    bpy.context.view_layer.update();bounds=[obj.matrix_world@__import__('mathutils').Vector(p)for p in obj.bound_box]
                    lo=[min(v[i]for v in bounds)for i in range(3)];hi=[max(v[i]for v in bounds)for i in range(3)]
                    for f in [-.22,.22]:
                        plate('Manufactured top panel joint',((lo[0]+hi[0])/2+f*(hi[0]-lo[0]),(lo[1]+hi[1])/2,hi[2]+.001),(.018,(hi[1]-lo[1])*.92,.002),'e9-dark')
        if name.startswith('wall-bulkhead'):
            height=.62 if name.endswith('low') else 1.20
            hatch(-1.46,-.385,height*.53,.70,max(.20,height*.40))
            vent(1.47,-.385,height*.5,.65,max(.12,height*.25))
        elif name=='wall-end-jamb':
            hatch(0,-.37,.67,.26,.40)
        elif name=='security-guard-booth':
            hatch(-.66,-.72,.42,.73,.42);vent(.66,-.72,.38,.63,.18)
            plate('Roof access gasket',(0,0,1.922),(1.05,.72,.008),'e9-dark')
            plate('Roof service lid',(0,0,1.930),(.96,.64,.008),'e9-body')
            plate('Roof lid lifting channel',(0,-.12,1.936),(.30,.045,.004),'e9-dark')
        elif name.startswith('security-lockers'):
            for i in range(5):
                x=(i-2)*.58
                for z in [.24,.63]:cylinder('Locker knuckle hinge',(x-.24,-.405,z),.014,.10,'e9-trim','Z',6)
                plate('Folded latch lever',(x+.155,-.41,.43),(.022,.02,.08),'e9-trim')
        elif name=='security-baggage-conveyor':
            plate('Conveyor drive access housing',(-.85,-.50,.52),(.56,.14,.28),'e9-body')
            hatch(-.85,-.58,.52,.50,.22)
            plate('Conveyor connector housing',(.55,-.51,.48),(.58,.14,.28),'e9-body')
            ports(.55,-.60,.48)
        elif name=='security-console':
            ports(0,.55,.35)
            hatch(0,.55,.44,.40,.30)
            vent(0,-.585,.27,.40,.16)
        elif name=='security-bench':
            for x in [-.70,0,.70]:plate('Replaceable seat edge welt',(x,-.35,.545),(.58,.018,.018),'e9-dark')
        elif name=='clinical-diagnostic-tower':
            vent(0,-.427,1.02,.88,.17);ports(0,.438,.30)
        elif name.startswith('comms-rack'):
            ports(0,.43,.26)
            hatch(.62,.43,.48,.25,.35)
        elif name=='habitation-console-locker':
            hatch(0,-.38,.38,.43,.42)
            ports(.78,.38,.31)
            plate('Desktop access joint',(-.64,0,.865),(.012,.68,.002),'e9-dark')
        elif name=='habitation-berth':
            for z in [.25,.39]:plate('Drawer slide rail',(0,-.596,z),(1.58,.018,.016),'e9-dark')
            for x in [-.77,-.57]:plate('Pillow sewn panel joint',(x,0,.628),(.008,.70,.003),'e9-trim')
        elif name=='habitation-desk':
            ports(-.47,.39,.45)
            plate('Removable writing mat',(-.48,-.04,.819),(.55,.51,.005),'e9-body')
        elif name=='clinical-testbench':
            ports(-.94,.50,.40)
            vent(-.94,-.32,.35,.45,.17)
        elif name=='cryo-service-console':
            ports(0,.51,.40)
            vent(0,-.55,.35,.45,.17)
        elif name.startswith('cargo-restraintbank'):
            for x in [-1.03,0,1.03]:
                hatch(x,-.655,.48,.68,.43)
        elif name=='reactor-servicebay':
            vent(0,-.66,.47,.58,.23);ports(1.1,-.66,.24)
        elif name=='shielding-servicebay':
            hatch(0,-.64,.42,.50,.46)
        elif name=='cabletray-open-cover':
            for y in [-.23,.24]:
                cylinder('Tray cable-end ferrule',(1.40,y,.052),.037,.12,'e9-trim','X',8)
                cylinder('Ferrule recessed cable end',(1.463,y,.052),.023,.006,'e9-dark','X',8)
        elif name=='drainage-grating':
            for x in [-1.0,1.0]:plate('Lift key slot',(x,0,.122),(.10,.15,.002),'e9-dark')
