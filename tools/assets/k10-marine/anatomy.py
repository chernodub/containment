"""Original anatomical pressure suit and surface-derived armour. MIT.
Design coordinates are metres: X right, Y forward, Z up.
"""
import bpy
import bmesh
import math
from mathutils import Vector


def apply_modifier(obj, modifier):
    bpy.context.view_layer.objects.active = obj
    if modifier.type == 'SUBSURF' and modifier.levels == 0:
        obj.modifiers.remove(modifier)
        return
    try:
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    except RuntimeError:
        print("MODIFIER FAILURE", obj.name, modifier.name, modifier.type, modifier.show_viewport)
        raise


def finish_normals(obj):
    for face in obj.data.polygons:
        face.use_smooth = True
    modifier = obj.modifiers.new('Area-weighted panel normals', 'WEIGHTED_NORMAL')
    modifier.keep_sharp = True
    modifier.weight = 30
    return modifier


class Anatomy:
    """Build low or high surfaces from the same loft/profile descriptions."""
    def __init__(self, joints, tails, materials, high=False, detail=5):
        self.joints, self.tails, self.materials = joints, tails, materials
        self.high, self.detail = high, detail
        self.parts = {key: [] for key in ['body', 'breacher', 'cryo', 'pyro', 'arc']}
        self.group = 'body'
        self.sources = []
        self.profiles = {}

    def attach(self, obj, name, material, bone='ribs', weights=None, register=True):
        obj.name = name
        obj['k10Component'] = name
        if not obj.data.materials:
            obj.data.materials.append(self.materials[material])
        if weights is None and bone:
            obj['k10RigidBone']=bone
            group = obj.vertex_groups.get(bone) or obj.vertex_groups.new(name=bone)
            group.add(list(range(len(obj.data.vertices))), 1, 'REPLACE')
        if register:
            self.parts[self.group].append(obj)
        return obj

    def mesh(self, name, vertices, faces, mat, bone='ribs', register=True):
        data = bpy.data.meshes.new(name)
        data.from_pydata(vertices, [], faces)
        data.update()
        obj = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(obj)
        self.attach(obj, name, mat, bone, register=register)
        return obj

    def subdivide(self, obj, level=1):
        modifier = obj.modifiers.new('Anatomical subdivision', 'SUBSURF')
        modifier.levels = level + (1 if self.high else 0)
        modifier.render_levels = modifier.levels
        return modifier

    def crease_boundary(self, obj, weight=.65):
        bm = bmesh.new(); bm.from_mesh(obj.data)
        layer = bm.edges.layers.float.get('crease_edge') or bm.edges.layers.float.new('crease_edge')
        for edge in bm.edges:
            edge[layer] = weight if edge.is_boundary else 0
        bm.to_mesh(obj.data); bm.free()

    def loft(self, name, sections, mat='fabric', segments=12, forward=(0,1,0), register=True, level=1):
        # Each section is (centre, lateral radius, front/back radius, bone weights).
        vertices, faces, weights = [], [], []
        for index, (centre, rx, ry, skin) in enumerate(sections):
            centre = Vector(centre)
            before = Vector(sections[max(0,index-1)][0])
            after = Vector(sections[min(len(sections)-1,index+1)][0])
            axis = (after-before).normalized()
            front = Vector(forward) - axis * axis.dot(Vector(forward))
            if front.length < .1: front = Vector((0,0,1))-axis*axis.z
            front.normalize(); right = front.cross(axis).normalized()
            for j in range(segments):
                angle = j/segments*math.tau
                vertices.append(tuple(centre+right*math.cos(angle)*rx+front*math.sin(angle)*ry))
                weights.append(skin)
        for row in range(len(sections)-1):
            for j in range(segments):
                a=row*segments+j;b=row*segments+(j+1)%segments
                faces.append((a,b,b+segments,a+segments))
        faces.extend([tuple(range(segments-1,-1,-1)),tuple((len(sections)-1)*segments+j for j in range(segments))])
        obj=self.mesh(name,vertices,faces,mat,None,register)
        names=set(key for skin in weights for key in skin)
        groups={key:obj.vertex_groups.new(name=key) for key in names}
        for index,skin in enumerate(weights):
            for bone,value in skin.items():groups[bone].add([index],value,'REPLACE')
        self.subdivide(obj,level)
        for face in obj.data.polygons:face.use_smooth=True
        self.profiles[name]=(obj,sections,segments)
        return obj

    def shell(self, source_name, name, rows, angles, mat='white', bone=None, offset=.022, thickness=.014, inset=True):
        source,sections,segments=self.profiles[source_name]
        # Duplicate an actual anatomical face patch, then fit its subdivided form
        # back onto that pressure-suit surface at a real 1.5–3cm stand-off.
        selected=[]
        for polygon in source.data.polygons:
            if len(polygon.vertices)!=4:continue
            row=min(polygon.vertices)//segments
            col=min(v%segments for v in polygon.vertices)
            if max(v%segments for v in polygon.vertices)==segments-1 and col==0:col=segments-1
            degrees=(col+.5)/segments*360
            if rows[0]<=row<rows[1] and angles[0]<=degrees<=angles[1]:selected.append(polygon)
        if angles[0] == 0 and angles[1] == 360 and rows[1] >= len(sections)-1:
            selected.append(source.data.polygons[-1])
        used=sorted(set(v for face in selected for v in face.vertices));lookup={v:i for i,v in enumerate(used)}
        vertices=[tuple(source.data.vertices[v].co + source.data.vertices[v].normal*offset) for v in used]
        faces=[tuple(lookup[v] for v in face.vertices) for face in selected]
        if self.detail>=7 and name.startswith('ceramic toe'):
            last=(len(sections)-1)*segments
            arc=[v for v in used if v>=last and angles[0]<=((v%segments)/segments*360)<=angles[1]]
            arc.sort()
            centre=len(vertices);vertices.append(tuple(sections[-1][0]))
            faces.extend((lookup[a],lookup[b],centre) for a,b in zip(arc,arc[1:]))
        if self.detail>=7 and 'pectoral' in name:
            shaped=[]
            for coordinate in vertices:
                v=Vector(coordinate);v.x+=.008 if v.x>0 else -.008
                if v.z<1.32:v.z-=.025*max(0,1-abs(v.x)/.22)
                shaped.append(tuple(v))
            vertices=shaped
        obj=self.mesh(name,vertices,faces,mat,bone)
        if bone is None:
            for source_group in source.vertex_groups:
                group=obj.vertex_groups.new(name=source_group.name)
                for old,new in lookup.items():
                    try:weight=source_group.weight(old)
                    except RuntimeError:continue
                    if weight>0:group.add([new],weight,'REPLACE')
        self.crease_boundary(obj,.85)
        bm=bmesh.new();bm.from_mesh(obj.data);boundary={v.index for v in bm.verts if v.is_boundary};bm.free()
        fit=obj.vertex_groups.new(name='shell fit interior')
        inside=[v.index for v in obj.data.vertices if v.index not in boundary]
        if inside:fit.add(inside,1,'REPLACE')
        self.subdivide(obj)
        shrink=obj.modifiers.new('Surface-derived armour stand-off','SHRINKWRAP')
        shrink.target=source;shrink.wrap_method='NEAREST_SURFACEPOINT';shrink.offset=offset;shrink.vertex_group=fit.name
        solid=obj.modifiers.new('Ceramic shell wall','SOLIDIFY');solid.thickness=thickness;solid.offset=1
        bevel=obj.modifiers.new('Rolled machined rim','BEVEL');bevel.width=.004;bevel.segments=3 if self.high else 1
        finish_normals(obj)
        if self.detail>=6 and any(word in name for word in ['pectoral','calf greave','thigh guard']):
            self.inset_panel(obj)
        if self.detail>=9 and any(word in name for word in ['pectoral','calf greave','thigh guard','patella shield','ceramic toe']):
            self.engineer_panel(obj,name,bone)
        return obj

    def ellipsoid(self, name, centre, radii, mat='fabric', bone='ribs', register=True):
        # UV ring surface is deliberately shaped by its cross sections, not a box.
        sections=[]
        for z in [-.98,-.82,-.5,0,.5,.82,.98]:
            radius=math.sqrt(max(.015,1-z*z))
            sections.append((Vector(centre)+Vector((0,0,z*radii[2])),radii[0]*radius,radii[1]*radius,{bone:1}))
        return self.loft(name,sections,mat,12,register=register)

    def tube(self, name, points, radius, mat='metal', bone='ribs', sides=10):
        curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=8
        curve.bevel_depth=radius;curve.bevel_resolution=2 if self.high else 1
        spline=curve.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
        for handle,point in zip(spline.bezier_points,points):
            handle.co=point;handle.handle_left_type=handle.handle_right_type='AUTO'
        obj=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(obj)
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH')
        self.attach(obj,name,mat,bone)
        obj['k10BakeRelief']=False
        for face in obj.data.polygons:face.use_smooth=True
        return obj

    def cylinder(self,name,a,b,radius,mat='metal',bone='ribs',sides=12):
        a,b=Vector(a),Vector(b)
        bpy.ops.mesh.primitive_cylinder_add(vertices=sides,radius=radius,depth=(b-a).length,location=(a+b)*.5)
        obj=bpy.context.object;obj.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        self.attach(obj,name,mat,bone)
        obj['k10BakeRelief']=False
        bevel=obj.modifiers.new('Turned edge radius','BEVEL');bevel.width=min(.006,radius*.15);bevel.segments=3 if self.high else 1
        finish_normals(obj)
        return obj

    def ring(self,name,centre,major,minor,mat='metal',bone='ribs',rotation=(0,0,0),arc=math.tau):
        verts=[];faces=[];n=24 if self.high else 16;m=8 if self.high else 6
        from mathutils import Euler
        transform=Euler(rotation).to_matrix()
        for i in range(n+1):
            a=i/n*arc
            for j in range(m):
                b=j/m*math.tau
                p=Vector(((major+minor*math.cos(b))*math.cos(a),(major+minor*math.cos(b))*math.sin(a),minor*math.sin(b)))
                verts.append(tuple(transform@p+Vector(centre)))
        for i in range(n):
            for j in range(m):
                a=i*m+j;b=i*m+(j+1)%m;faces.append((a,b,b+m,a+m))
        obj=self.mesh(name,verts,faces,mat,bone)
        obj['k10BakeRelief']=False
        for face in obj.data.polygons:face.use_smooth=True
        return obj

    def profile_plate(self,name,outline,depth,mat='metal',bone='ribs',bevel=.006):
        # Thin shaped support hardware only; primary armour always comes from anatomy.
        verts=[(x,y-depth*.5,z) for x,y,z in outline]+[(x,y+depth*.5,z) for x,y,z in outline]
        n=len(outline);faces=[tuple(range(n-1,-1,-1)),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
        obj=self.mesh(name,verts,faces,mat,bone)
        mod=obj.modifiers.new('Support hardware fillet','BEVEL');mod.width=bevel;mod.segments=3 if self.high else 1
        finish_normals(obj);return obj

    def inset_panel(self,obj):
        # Applied after shell fitting; true inset/inward extrusion makes a recessed
        # panel bed, with its own rim, rather than another floating surface box.
        for modifier in list(obj.modifiers):apply_modifier(obj,modifier)
        bm=bmesh.new();bm.from_mesh(obj.data)
        candidates=[f for f in bm.faces if f.calc_area()>.0007 and f.normal.y>.65]
        if candidates:
            face=max(candidates,key=lambda f:f.calc_area())
            result=bmesh.ops.inset_region(bm,faces=[face],thickness=.004,depth=-.002,use_boundary=True)
        bm.to_mesh(obj.data);bm.free();obj.data.update()

    def surface_path(self,obj,name,coordinates,radius,mat,bone):
        """Machine an inset-looking seam following the evaluated curved plate.

        Ray samples use the actual shell rather than a guessed planar decal.
        Small dark gasket geometry remains stable at silhouette edges; relief
        detail and ambient contact are projected from the high model.
        """
        bpy.context.view_layer.update()
        evaluated=obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
        points=[]
        for a,b in zip(coordinates,coordinates[1:]):
            a,b=Vector(a),Vector(b)
            for i in range(5):
                point=a.lerp(b,i/4)
                hit,co,normal,_=evaluated.ray_cast(Vector((point.x,1,point.y)),Vector((0,-1,0)))
                if hit:points.append(tuple(co+normal*radius*.20))
        if len(points)<2:return
        curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.bevel_depth=radius
        curve.bevel_resolution=2 if self.high else 0
        spline=curve.splines.new('POLY');spline.points.add(len(points)-1)
        for p,co in zip(spline.points,points):p.co=(*co,1)
        mark=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(mark)
        bpy.ops.object.select_all(action='DESELECT');mark.select_set(True);bpy.context.view_layer.objects.active=mark;bpy.ops.object.convert(target='MESH')
        self.attach(mark,name,mat,bone)
        for f in mark.data.polygons:f.use_smooth=True
        return points

    def engineer_panel(self,obj,name,bone):
        # Restraint at gameplay scale: a few long machined seams, broad latches,
        # edge ferrules and recessed vent banks, rather than surface noise.
        for modifier in list(obj.modifiers):apply_modifier(obj,modifier)
        vs=[v.co for v in obj.data.vertices];xmin=min(v.x for v in vs);xmax=max(v.x for v in vs);zmin=min(v.z for v in vs);zmax=max(v.z for v in vs)
        cx=(xmin+xmax)*.5;w=xmax-xmin;h=zmax-zmin
        if 'pectoral' in name:
            sign=1 if cx>0 else -1
            seam=[(sign*.038,1.50),(sign*.065,1.36),(sign*.15,1.34),(sign*.195,1.40)]
            self.surface_path(obj,'recessed breast service seam',seam,.003,'metal',bone)
            # Shaped breast lock with an exposed latch tongue and two rivets.
            at=self.surface_path(obj,'quick release latch seat',[(sign*.14,1.52),(sign*.14,1.56)],.009,'dark',bone)
            if at:
                p=Vector(at[len(at)//2]);self.cylinder('breast lock pivot',p+Vector((0,.002,0)),p+Vector((0,.012,0)),.010,'silver',bone,10)
            for z in [1.395,1.415,1.435]:
                self.surface_path(obj,'recessed rib ventilation',[(sign*.17,z),(sign*.205,z+.015)],.0035,'dark',bone)
        elif 'calf greave' in name:
            self.surface_path(obj,'greave recessed keel',[(cx-w*.12,zmax-h*.15),(cx-w*.12,zmin+h*.2),(cx+w*.16,zmin+h*.10),(cx+w*.25,zmin+h*.26)],.0035,'metal',bone)
            for z in [zmax-h*.17,zmin+h*.24]:
                self.surface_path(obj,'greave edge retention clip',[(cx+w*.29,z),(cx+w*.40,z+.012)],.006,'steel',bone)
        elif 'thigh guard' in name:
            self.surface_path(obj,'thigh service hatch gasket',[(cx-w*.25,zmax-h*.16),(cx+w*.12,zmax-h*.13),(cx+w*.28,zmax-h*.26),(cx+w*.22,zmin+h*.20),(cx-w*.10,zmin+h*.12)],.003,'metal',bone)
            self.surface_path(obj,'thigh hatch pull',[(cx+w*.10,zmax-h*.25),(cx+w*.15,zmax-h*.32)],.006,'silver',bone)
        elif 'patella shield' in name:
            self.surface_path(obj,'knee articulated cap seam',[(cx-w*.28,zmax-h*.31),(cx,zmax-h*.43),(cx+w*.28,zmax-h*.31)],.004,'metal',bone)
        elif 'ceramic toe' in name:
            # Toe cap is physically separated from the instep by a dark seam.
            self.surface_path(obj,'toe cap dividing seam',[(cx-w*.30,zmin+h*.44),(cx+w*.30,zmin+h*.44)],.003,'steel',bone)

    def band_on_dome(self, source_name, name, material, longitude, width=.14, slope=.35, target=None):
        source,sections,segments=self.profiles[source_name]
        verts=[];faces=[]
        # Analytic patch on the same shoulder ellipsoid, then shrinkwrapped.
        centre=Vector(sections[len(sections)//2][0]);rx=sections[len(sections)//2][1];ry=sections[len(sections)//2][2]
        rz=(Vector(sections[-1][0])-Vector(sections[0][0])).length*.51
        for row in range(6):
            latitude=-.15+row/5*1.45
            for side in [-1,1]:
                angle=longitude+latitude*slope+side*width*.5
                verts.append(tuple(centre+Vector((rx*1.65*math.cos(latitude)*math.cos(angle),ry*1.65*math.cos(latitude)*math.sin(angle),rz*1.65*math.sin(latitude)))))
        for row in range(5):faces.append((row*2,row*2+1,row*2+3,row*2+2))
        obj=self.mesh(name,verts,faces,material,'upper_arm.L' if centre.x<0 else 'upper_arm.R')
        shrink=obj.modifiers.new('Stripe conforms to curved shoulder','SHRINKWRAP');shrink.target=target or source;shrink.offset=.0018
        solid=obj.modifiers.new('Inset hazard enamel','SOLIDIFY');solid.thickness=.001
        return obj

    def build_body(self):
        j,t=self.joints,self.tails
        torso=[]
        for z,rx,ry in [(1.00,.165,.108),(1.04,.19,.12),(1.12,.18,.115),(1.19,.153,.113),(1.28,.173,.125),(1.40,.222,.148),(1.52,.245,.155),(1.61,.237,.142),(1.67,.19,.105),(1.71,.10,.075)]:
            weights={'hips':1} if z<1.12 else {'hips':.2,'spine':.8} if z<1.28 else {'spine':.45,'ribs':.55} if z<1.4 else {'ribs':1}
            torso.append(((0,.004,z),rx,ry,weights))
        self.loft('anatomical torso',torso)
        # Split breast shells follow the chest/waist curvature and leave an elastic keel.
        self.shell('anatomical torso','right pectoral ceramic',(4,7),(15,78),'white','ribs')
        self.shell('anatomical torso','left pectoral ceramic',(4,7),(102,165),'white','ribs')
        self.shell('anatomical torso','curved backplate',(4,8),(205,335),'steel','ribs',offset=.020)
        self.shell('anatomical torso','right pelvic ceramic',(0,2),(0,80),'white','hips',offset=.020)
        self.shell('anatomical torso','left pelvic ceramic',(0,2),(100,180),'white','hips',offset=.020)
        self.ellipsoid('neck bellows',(0,0,1.745),(.083,.075,.10),'fabric','neck')
        for side in ['R','L']:
            sign=1 if side=='R' else -1
            # Continuous lofts follow the two bone segments; cross sections narrow
            # at elbow/knee, swell at muscle bellies and taper toward wrist/ankle.
            upper,lower='upper_arm.'+side,'forearm.'+side
            a,b,c=j[upper],j[lower],j['hand.'+side]
            arm_sections=[]
            for p,rx,ry,w in [
                (a,.105,.11,{upper:1}),(a.lerp(b,.18),.115,.115,{upper:1}),
                (a.lerp(b,.55),.10,.105,{upper:1}),(a.lerp(b,.87),.077,.079,{upper:.85,lower:.15}),
                (b,.074,.073,{upper:.4,lower:.6}),(b.lerp(c,.22),.098,.09,{lower:1}),
                (b.lerp(c,.55),.082,.078,{lower:1}),(b.lerp(c,.86),.063,.062,{lower:.85,'hand.'+side:.15}),
                (c,.059,.058,{'hand.'+side:1})]:arm_sections.append((p,rx,ry,w))
            name='arm anatomy '+side;self.loft(name,arm_sections)
            self.shell(name,'upper arm ceramic '+side,(2,3),(0,180),'white',upper,offset=.018)
            self.shell(name,'white wrist ferrule '+side,(7,8),(0,180),'white',lower,offset=.020)
            shoulder=a+Vector((sign*.018,0,.008))
            dome='shoulder anatomy '+side;self.ellipsoid(dome,shoulder,(.138,.148,.128),'fabric',upper)
            # Rounded ball joint remains visible underneath each removable pauldron.
            self.profiles['shoulder '+side]=self.profiles[dome]
            thigh,shin='thigh.'+side,'shin.'+side
            a,b,c=j[thigh],j[shin],t[shin]
            leg_sections=[]
            for p,rx,ry,w in [
                (a,.122,.12,{thigh:.8,'hips':.2}),(a.lerp(b,.15),.13,.13,{thigh:1}),
                (a.lerp(b,.47),.115,.117,{thigh:1}),(a.lerp(b,.79),.087,.09,{thigh:1}),
                (b,.079,.08,{thigh:.4,shin:.6}),(b.lerp(c,.18),.105,.10,{shin:1}),
                (b.lerp(c,.38)+Vector((0,-.012,0)),.108,.103,{shin:1}),
                (b.lerp(c,.72),.078,.077,{shin:1}),(b.lerp(c,.94),.064,.064,{shin:1})]:leg_sections.append((p,rx,ry,w))
            name='leg anatomy '+side;self.loft(name,leg_sections)
            self.shell(name,'sculpted thigh guard '+side,(1,4),(0,180),'white',thigh,offset=.021)
            self.shell(name,'sculpted calf greave '+side,(5,8),(0,180),'white',shin,offset=.022)
            if self.detail>=10:
                # The player mostly sees the rear. Light articulated shells on
                # the hamstring and calf retain a full-body friendly-value read.
                self.shell(name,'posterior thigh ceramic '+side,(1,3),(205,335),'white',thigh,offset=.020)
                self.shell(name,'posterior shin ceramic '+side,(5,8),(205,335),'white',shin,offset=.020)
                knee_anchor=b+Vector((sign*.083,.04,0))
                self.cylinder('knee hinge bearing '+side,knee_anchor,knee_anchor+Vector((sign*.018,0,0)),.029,'steel',shin,12)
                self.cylinder('knee bearing centre '+side,knee_anchor+Vector((sign*.018,0,0)),knee_anchor+Vector((sign*.020,0,0)),.012,'dark',shin,10)
            knee=b+Vector((0,.055,0));kn='knee anatomy '+side
            self.ellipsoid(kn,knee,(.087,.095,.105),'fabric',shin)
            self.shell(kn,'curved patella shield '+side,(1,5),(10,170),'white',shin,offset=.021)
            foot=j['foot.'+side]
            # Boot is a swept foot-shaped loft: heel, arch, metatarsal width and toe.
            sections=[]
            for y,z,rx,rz in [(-.16,.085,.07,.075),(-.12,.09,.087,.086),(-.035,.095,.09,.092),(.06,.08,.10,.07),(.14,.062,.093,.049),(.18,.06,.065,.037)]:
                sections.append(((foot.x,foot.y+y,z),rx,rz,{'foot.'+side:1}))
            boot='boot anatomy '+side;self.loft(boot,sections,'dark',12,forward=(0,0,1))
            # The upper half is copied from the foot surface, including a curved toe.
            self.shell(boot,'ceramic toe and instep '+side,(1,5),(0,180),'white','foot.'+side,offset=.014,thickness=.009)
            if self.detail>=7:self.shell(boot,'rubber tread sole '+side,(0,5),(180,360),'dark','foot.'+side,offset=.004,thickness=.005)
            self.ellipsoid('ankle cuff '+side,(foot.x,foot.y-.10,.15),(.084,.085,.10),'fabric','foot.'+side)
            self.ring('ankle flex ring '+side,(foot.x,foot.y-.10,.16),.078,.012,'steel','foot.'+side)
            if self.detail>=10:
                # A metal ankle pivot, heel bumper and physically layered sole
                # distinguish boots from a single pressure-suit slipper.
                ankle=Vector((foot.x+sign*.079,foot.y-.10,.15))
                self.cylinder('boot ankle hinge '+side,ankle,ankle+Vector((sign*.015,0,0)),.026,'silver','foot.'+side,12)
                self.tube('heel crash bumper '+side,[(foot.x-.065,foot.y-.145,.065),(foot.x,foot.y-.18,.060),(foot.x+.065,foot.y-.145,.065)],.013,'metal','foot.'+side)
            self.build_hand(side)
        if self.detail>=10:
            for z in [1.145,1.18,1.215]:
                points=[(.16*math.cos(a),.004+.121*math.sin(a),z) for a in [math.radians(18+i*12) for i in range(13)]]
                self.tube('flexible abdominal rib',points,.008,'metal','spine')
            for sign in [-1,1]:
                x=sign*.14
                self.cylinder('belt retention stud',(x,.096,1.09),(x,.112,1.09),.016,'steel','hips',12)

    def build_hand(self,side):
        hand='hand.'+side;a,b=self.joints[hand],self.tails[hand];v=(b-a).normalized()
        self.loft('shaped glove palm '+side,[(a-v*.015,.055,.038,{hand:1}),(a+v*.035,.065,.04,{hand:1}),(a+v*.09,.059,.035,{hand:1}),(a+v*.12,.042,.027,{hand:1})],'fabric',10)
        for finger in ['index','middle','ring','pinky','thumb']:
            for number in [1,2,3]:
                bone=('thumb' if finger=='thumb' else 'finger_'+finger)+f'.0{number}.'+side
                if bone not in self.joints:continue
                p,q=self.joints[bone],self.tails[bone]
                radius=.015 if finger!='pinky' else .012
                self.loft(f'{finger} phalange {number} {side}',[(p,radius,radius,{bone:1}),(p.lerp(q,.25),radius*1.05,radius*.95,{bone:1}),(p.lerp(q,.8),radius*.8,radius*.8,{bone:1}),(q,radius*.65,radius*.65,{bone:1})],'dark',6,level=0)
                if number==1:
                    self.cylinder(f'{finger} knuckle {side}',p+Vector((0,.008,0)),p+Vector((0,.008,.014)),radius*.9,'white',bone,8)

    def build_rig(self,rig):
        self.group=rig;colour={'breacher':'amber','cryo':'ice','pyro':'fire','arc':'violet'}[rig]
        # Every rig has its own curved shoulder/collar/forearm surface ownership.
        for side in ['R','L']:
            upper,fore='upper_arm.'+side,'forearm.'+side
            source='shoulder '+side
            if self.detail>=7:
                original,sections,n=self.profiles[source]
                centre=Vector(sections[len(sections)//2][0])
                sx,sy,sz=(1.25,1.16,.90) if rig=='breacher' and side=='L' else (1,1,.80) if rig=='breacher' else (.84,1.15,.88) if rig=='cryo' else (1.22,1.20,.65) if rig=='pyro' and side=='R' else (.95,1.02,.88) if rig=='pyro' else (.90,.95,.78)
                custom=[]
                for c,rx,ry,w in sections:
                    c=Vector(c);c.z=centre.z+(c.z-centre.z)*sz
                    if rig=='arc':c.z+=.025
                    custom.append((c,rx*sx,ry*sy,w))
                source=rig+' shoulder foundation '+side
                foundation=self.loft(source,custom,'fabric',n,register=False)
                foundation.hide_render=True;self.sources.append(foundation)
            shoulder_mat='dark' if self.detail>=7 and rig=='pyro' and side=='R' else colour
            if self.detail>=9 and rig=='breacher' and side=='L':shoulder_mat='hazard'
            angles=(0,210) if self.detail>=7 and rig=='arc' else (0,360)
            dome=self.shell(source,rig+' rounded pauldron '+side,(1,6),angles,shoulder_mat,upper,offset=.025,thickness=.016)
            if rig=='breacher' and side=='L' and self.detail<9:
                for angle in [.4,1.05,1.7,2.35,3.,3.65,4.3,4.95,5.6]:self.band_on_dome(source,'diagonal hazard enamel','dark',angle,.18,.38,target=dome)
            if self.detail>=7 and rig=='arc':
                p=self.joints[upper]+Vector(((1 if side=='R' else -1)*.035,-.015,.10))
                self.ring('shoulder induction frame '+side,p,.118,.020,'violet',upper,rotation=(math.pi/2,0,0),arc=math.tau*.76)
                self.ring('pale shoulder coil '+side,p+Vector((0,-.014,0)),.116,.008,'arc_glow',upper,rotation=(math.pi/2,0,0),arc=math.tau*.76)
            if self.detail>=7 and rig=='pyro' and side=='R':
                self.heat_vents(dome,self.joints[upper]+Vector((.015,0,.12)))
            self.shell('arm anatomy '+side,rig+' coloured forearm '+side,(5,8),(190,350),colour,fore,offset=.024)
            self.shell('arm anatomy '+side,rig+' forearm outer crest '+side,(5,7),(0,180),colour,fore,offset=.036,thickness=.009)
            if self.detail>=7 and rig=='cryo':
                for rows in [(5,6),(7,8)]:self.shell('arm anatomy '+side,'frost ceramic cuff '+side,rows,(0,360),'white',fore,offset=.047,thickness=.008)
        collar_source='anatomical torso'
        if self.detail>=7 and rig=='cryo':
            original,sections,n=self.profiles[collar_source]
            raised=[]
            for c,rx,ry,w in sections:
                c=Vector(c)
                if c.z>1.60:c.z+=(c.z-1.60)*.55
                raised.append((c,rx,ry,w))
            collar_source='cryo raised collar foundation'
            foundation=self.loft(collar_source,raised,'fabric',n,register=False);foundation.hide_render=True;self.sources.append(foundation)
        collar_mat='dark' if self.detail>=7 and rig=='pyro' else colour
        self.shell(collar_source,rig+' fitted collar',(8,9),(0,360),collar_mat,'ribs',offset=.025,thickness=.014)
        self.shell('anatomical torso',rig+' breast harness',(7,8),(0,180),colour,'ribs',offset=.034,thickness=.006)
        if self.detail>=7 and rig=='cryo':self.shell(collar_source,'insulated frost collar lip',(8,9),(195,345),'white','ribs',offset=.048,thickness=.008)
        if rig=='breacher':self.breacher()
        elif rig=='cryo':self.cryo()
        elif rig=='pyro':self.pyro()
        else:self.arc()
        self.group='body'

    def heat_vents(self,obj,centre):
        for delta in [-.05,0,.05]:
            bpy.ops.mesh.primitive_cube_add(size=1,location=Vector(centre)+Vector((delta,0,0)))
            cutter=bpy.context.object;cutter.dimensions=(.018,.14,.055)
            bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
            mod=cutter.modifiers.new('Rounded vent cutter','BEVEL');mod.width=.008;mod.segments=3;apply_modifier(cutter,mod)
            cutter.hide_render=True;cutter.display_type='WIRE'
            boolean=obj.modifiers.new('Milled heat shield vent','BOOLEAN');boolean.operation='DIFFERENCE';boolean.object=cutter;boolean.solver='EXACT'
        rim=obj.modifiers.new('Heat vent rolled edges','BEVEL');rim.width=.002;rim.segments=3 if self.high else 1
        finish_normals(obj)

    def breacher(self):
        self.ellipsoid('impact accumulator',(0,-.205,1.48),(.19,.125,.205),'dark')
        self.shell('impact accumulator','amber accumulator shell',(1,5),(185,355),'amber','ribs',offset=.025)
        for sign in [-1,1]:
            x=sign*.105
            self.cylinder('impact piston',(x,-.31,1.29),(x,-.31,1.64),.035,'metal')
            self.cylinder('exposed piston rod',(x,-.31,1.38),(x,-.31,1.73),.017,'silver')
            self.ring('piston seal',(x,-.31,1.62),.037,.008,'amber')
        self.tube('amber dorsal discharge',[(0,-.34,1.30),(0,-.36,1.47),(0,-.32,1.68)],.019,'amber_glow')
        if self.detail>=7:
            p,q=self.joints['forearm.L'],self.joints['hand.L']
            for y in [-.045,.045]:
                a=p.lerp(q,.20)+Vector((-.085,y,0));b=p.lerp(q,.78)+Vector((-.085,y,0))
                self.cylinder('gauntlet impact housing',a,b,.022,'amber','forearm.L')
                self.cylinder('gauntlet exposed ram',a.lerp(b,.3),b+Vector((0,0,-.025)),.010,'silver','forearm.L')
            for side in ['R','L']:
                p=self.joints['forearm.'+side].lerp(self.joints['hand.'+side],.4)
                self.ring('gauntlet recoil seal',p,.094,.012,'dark','forearm.'+side,rotation=(math.pi*.12,0,0))

    def cryo(self):
        for sign in [-1,1]:
            x=sign*.14
            name='dewar vessel '+str(sign)
            sections=[((x,-.24,z),r,r,{'ribs':1}) for z,r in [(1.20,.035),(1.24,.075),(1.31,.09),(1.70,.09),(1.78,.07),(1.81,.025)]]
            self.loft(name,sections,'ice',12)
            for z in [1.31,1.68]:self.ring('frost ceramic vessel band',(x,-.24,z),.092,.012,'white')
            self.tube('luminous coolant level',[(x,-.332,1.33),(x,-.335,1.61),(x,-.32,1.73)],.012,'ice_glow')
            self.tube('insulated supply hose',[(x,-.24,1.80),(sign*.25,-.20,1.84),(sign*.29,-.04,1.75),(sign*.23,.11,1.64)],.022,'white')
        for z in [1.35,1.43,1.51,1.59,1.67]:
            self.tube('arched radiator fin',[(-.10,-.29,z),(0,-.35,z+.02),(.10,-.29,z)],.011,'silver')
        for side in ['R','L']:
            p=self.joints['forearm.'+side].lerp(self.joints['hand.'+side],.5)
            self.ring('cryogenic gauntlet ferrule',p,.092,.014,'white','forearm.'+side,rotation=(.25,0,0))

    def pyro(self):
        self.ellipsoid('charred thermal backpack',(0,-.195,1.46),(.20,.125,.21),'dark')
        self.shell('charred thermal backpack','orange heat jacket',(1,5),(185,355),'fire','ribs',offset=.025)
        for sign in [-1,1]:
            x=sign*.12
            self.ellipsoid('fuel bladder '+str(sign),(x,-.26,1.36),(.085,.08,.17),'fire')
            points=[(sign*.12,-.25,1.50),(sign*.18,-.26,1.69),(sign*.25,-.27,1.86)]
            self.tube('splayed exhaust stack',points,.049,'dark')
            for z in [1.62,1.69,1.76,1.83]:self.ring('exhaust cooling fin',(sign*(.18+(z-1.69)*.41),-.26,z),.056,.009,'metal')
            self.cylinder('exhaust hot throat',(sign*.25,-.27,1.84),(sign*.26,-.27,1.88),.039,'fire_glow')
        self.tube('armoured fuel umbilical',[(-.14,-.29,1.21),(-.26,-.30,1.15),(-.29,-.10,1.28),(-.23,.02,1.47)],.025,'dark')
        self.shell('anatomical torso','charcoal heat apron',(0,3),(30,150),'dark','hips',offset=.038)
        for side in ['R','L']:
            # Distinct short gauntlet heat ribs, following forearm anatomy.
            for row in [5,6,7]:self.shell('arm anatomy '+side,'orange gauntlet heat rib',(row,row+1),(30,150),'dark','forearm.'+side,offset=.045,thickness=.005)

    def arc(self):
        self.ellipsoid('graphite capacitor carrier',(0,-.20,1.48),(.145,.095,.20),'dark')
        self.shell('graphite capacitor carrier','violet capacitor jacket',(1,5),(185,355),'violet','ribs',offset=.025)
        for sign in [-1,1]:
            self.tube('open induction bow',[(sign*.09,-.23,1.31),(sign*.27,-.25,1.52),(sign*.32,-.25,1.76),(sign*.20,-.22,1.88)],.025,'metal')
            self.tube('pale induction track',[(sign*.12,-.255,1.35),(sign*.285,-.27,1.55),(sign*.325,-.27,1.75),(sign*.22,-.24,1.85)],.010,'arc_glow')
            for z,x in [(1.49,.25),(1.61,.30),(1.73,.32)]:
                self.ring('capacitor insulator',(sign*x,-.25,z),.047,.012,'violet')
            self.tube('forked antenna',[(sign*.07,-.22,1.63),(sign*.08,-.22,1.88),(sign*.11,-.22,1.96)],.012,'dark')
            self.ellipsoid('antenna ceramic tip '+str(sign),(sign*.11,-.22,1.96),(.025,.026,.045),'arc_glow')
        for side in ['R','L']:
            p=self.joints['forearm.'+side].lerp(self.joints['hand.'+side],.45)
            self.ring('open gauntlet induction coil',p,.145,.015,'arc_glow','forearm.'+side,rotation=(self.joints['hand.'+side]-self.joints['forearm.'+side]).to_track_quat('Z','Y').to_euler(),arc=math.tau*.78)

    def join(self):
        result=[]
        # Resolve all cross-object shell fits while their anatomical source
        # objects still exist. Joining body first would remove rig fit targets.
        for objects in self.parts.values():
            for obj in objects:
                for modifier in list(obj.modifiers):apply_modifier(obj,modifier)
                # Stable component identity lets the normal bake separate nearby
                # shell, joint and support surfaces without changing UVs.
                import zlib
                component=zlib.crc32(obj.get('k10Component',obj.name).encode()) & 0x7fffffff
                attribute=obj.data.attributes.get('k10_part') or obj.data.attributes.new('k10_part','INT','FACE')
                for entry in attribute.data:entry.value=component
                relief=obj.data.attributes.get('k10_relief') or obj.data.attributes.new('k10_relief','INT','FACE')
                for entry in relief.data:entry.value=1 if obj.get('k10BakeRelief',True) else 0
                bone=obj.get('k10RigidBone')
                if bone:
                    group=obj.vertex_groups.get(bone) or obj.vertex_groups.new(name=bone)
                    group.add(list(range(len(obj.data.vertices))),1,'REPLACE')
        for key,objects in self.parts.items():
            bpy.ops.object.select_all(action='DESELECT')
            for obj in objects:obj.select_set(True)
            bpy.context.view_layer.objects.active=objects[0]
            bpy.ops.object.join();obj=bpy.context.object
            obj.name=('k10-body' if key=='body' else 'k10-rig-'+key)+('-high' if self.high else '')
            bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
            if not self.high and self.detail>=6:
                # Low retopology of the curved subdivision model. The untouched
                # higher subdivision source supplies the final tangent normals.
                reduction=obj.modifiers.new('Game surface retopology','DECIMATE')
                reduction.ratio=(.53 if key=='body' else .58) if self.detail>=10 else .62;reduction.use_collapse_triangulate=True
                apply_modifier(obj,reduction)
            result.append(obj)
        return result
