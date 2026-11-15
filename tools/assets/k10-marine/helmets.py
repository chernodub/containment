"""Three original closed pressure helmets, authored with curved subdivision surfaces.

Design coordinates: X right, Y forward, Z up (metres). Geometry/material art MIT.
Standalone review: blender -b -P tools/assets/k10-marine/helmets.py
Import: create_helmet(option, materials, attach, high=False).
"""
import bpy
import bmesh
import math
import numpy as np
from pathlib import Path
from mathutils import Vector

CENTER = Vector((0, .005, 1.875))
SELECTED_OPTION = 3
OPTION_NAMES = {1: 'Manta brow', 2: 'Split crescent', 3: 'Crown keel'}


def create_helmet(option, materials, attach, high=False):
    """Build a closed curved helmet; register every shipping part on ``head``.

    Surface modifiers are realized and all resulting points reweighted to the
    head. Hidden authoring cutters are absent from the returned part list. High
    geometry retains small milled seams/vents for the selected-to-active bake.
    """
    option = int(option)
    high = high or bool(getattr(getattr(attach, '__self__', None), 'high', False))
    objects = []
    subdivisions = 2 if high else 1
    segments = 24 if high else 16
    aliases = {
        'plate': ['plate', 'white', 'ivory'],
        'steel': ['steel', 'dark', 'fabric'],
        'dark': ['dark', 'fabric', 'steel'],
        'visor': ['visor', 'dark', 'fabric'],
        'light': ['light', 'cyan', 'ice', 'white'],
    }

    def key(name):
        return next((candidate for candidate in aliases[name] if candidate in materials), next(iter(materials)))

    def register(obj, name, material):
        obj.name = name
        for face in obj.data.polygons:
            face.use_smooth = True
        attach(obj, name, key(material), 'head')
        objects.append(obj)
        return obj

    def mesh(name, vertices, faces, material, registered=True):
        data = bpy.data.meshes.new(name)
        data.from_pydata(vertices, [], faces)
        data.update()
        obj = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(obj)
        if registered:
            register(obj, name, material)
        else:
            obj.hide_render = True
            obj.display_type = 'WIRE'
            obj.hide_set(True)
        return obj

    def bevel(obj, radius=.003):
        modifier = obj.modifiers.new('Helmet edge radii', 'BEVEL')
        modifier.width = radius
        modifier.segments = 3 if high else 1
        modifier.affect = 'EDGES'
        modifier.limit_method = 'ANGLE'
        modifier.angle_limit = .45
        modifier.harden_normals = True
        return modifier

    def weighted(obj):
        modifier = obj.modifiers.new('Helmet area weighted normals', 'WEIGHTED_NORMAL')
        modifier.keep_sharp = True
        modifier.weight = 40
        return modifier

    # Anatomical latitude cross sections: narrow under the jaw, full around the
    # temples, and a soft swept crown. Support rings shape the actual subdivision.
    sections = [
        (-.163, .070, .088, .004),
        (-.151, .086, .109, .006),
        (-.116, .118, .140, .007),
        (-.060, .145, .160, .003),
        (.005, .154, .166, -.001),
        (.070, .150, .159, -.008),
        (.125, .126, .137, -.017),
        (.162, .074, .090, -.024),
        (.178, .009, .014, -.027),
    ]
    if option == 2:
        sections = [(z, rx * (1.03 if z < .08 else .97), ry * 1.04, cy-.007) for z,rx,ry,cy in sections]
    elif option == 3:
        sections = [(z, rx * (.94 if z > .05 else 1), ry, cy+.006) for z,rx,ry,cy in sections]

    def section(z):
        if z <= sections[0][0]:
            return sections[0][1:]
        for a,b in zip(sections, sections[1:]):
            if z <= b[0]:
                t = (z-a[0])/(b[0]-a[0])
                return tuple(a[i]*(1-t)+b[i]*t for i in range(1,4))
        return sections[-1][1:]

    def surface(theta, z, radial=1, offset=0):
        rx,ry,cy = section(z)
        point = Vector((math.sin(theta)*rx*radial, math.cos(theta)*ry*radial+cy, z))
        normal = Vector((math.sin(theta)/max(rx,.001), math.cos(theta)/max(ry,.001), 0)).normalized()
        return tuple(CENTER + point + normal*offset)

    vertices = []
    for z,rx,ry,cy in sections:
        for j in range(segments):
            angle = j/segments*math.tau
            x,y = math.sin(angle)*rx, math.cos(angle)*ry+cy
            # Ownable soft crest follows the crown rather than sitting above it.
            zz = z + (.009 * math.exp(-(x/.045)**2) if option == 3 and z > .07 else 0)
            vertices.append(tuple(CENTER+Vector((x,y,zz))))
    faces=[]
    for row in range(len(sections)-1):
        for j in range(segments):
            a=row*segments+j;b=row*segments+(j+1)%segments
            faces.append((a,a+segments,b+segments,b))
    faces += [tuple(range(segments)),tuple((len(sections)-1)*segments+j for j in reversed(range(segments)))]
    shell=mesh('helmet continuous pressure shell',vertices,faces,'plate')
    sub=shell.modifiers.new('Helmet anatomical subdivision','SUBSURF');sub.levels=subdivisions;sub.render_levels=subdivisions

    def curved_band(name, theta_range, z_range, material='visor', radial=.88, thickness=.003, cut=False, tilt=0):
        theta_range=tuple(sorted(theta_range))
        width=theta_range[1]-theta_range[0]
        count=max(2, min(24 if high else 16, math.ceil(width*(12 if high else 8))))
        rows=4 if high else (3 if material=='visor' else 2)
        verts=[]
        layers=[radial,1.16] if cut else [radial]
        for scale in layers:
            for row in range(rows):
                v=row/(rows-1)
                # Rounded corners and taper remove the rectangle from the visor.
                taper=.92+.08*math.sin(v*math.pi)
                for j in range(count+1):
                    u=j/count
                    theta=(theta_range[0]*(1-u)+theta_range[1]*u)*taper
                    z=z_range[0]*(1-v)+z_range[1]*v+tilt*math.sin(theta)
                    verts.append(surface(theta,z,scale))
        stride=count+1;layer_size=rows*stride
        fs=[]
        for row in range(rows-1):
            for j in range(count):
                a=row*stride+j
                fs.append((a,a+stride,a+stride+1,a+1))
                if cut:fs.append((a+layer_size,a+1+layer_size,a+stride+1+layer_size,a+stride+layer_size))
        if cut:
            perimeter=list(range(stride))+[r*stride+count for r in range(1,rows)]+list(range((rows-1)*stride+count-1,(rows-1)*stride-1,-1))+[r*stride for r in range(rows-2,0,-1)]
            for a,b in zip(perimeter,perimeter[1:]+perimeter[:1]):fs.append((a,b,b+layer_size,a+layer_size))
        obj=mesh(name,verts,fs,material,not cut)
        if cut:
            bm=bmesh.new();bm.from_mesh(obj.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(obj.data);bm.free()
            obj.hide_set(False)
        if not cut:
            solid=obj.modifiers.new('Lens or trim thickness','SOLIDIFY');solid.thickness=thickness;solid.offset=0
            if high or material=='visor' or thickness>.005:bevel(obj,.0016)
            weighted(obj)
        return obj

    def visor(name, angle_range, z_range, tilt=0):
        cutter=curved_band(name+' recess cutter',angle_range,z_range,radial=.80,cut=True,tilt=tilt)
        modifier=shell.modifiers.new(name+' actual milled recess','BOOLEAN');modifier.operation='DIFFERENCE';modifier.solver='EXACT';modifier.object=cutter
        lens=curved_band(name+' dark recessed glass',angle_range,(z_range[0]+.004,z_range[1]-.004),'visor',.815,.003,tilt=tilt)
        return lens

    def crown_ribbon(name,x,width,theta_start,theta_end,material='light',offset=.004):
        count=48 if high else 32
        vertices=[]
        old_level=sub.levels
        sub.levels=3
        bpy.context.view_layer.update()
        smooth_shell=shell.evaluated_get(bpy.context.evaluated_depsgraph_get())
        for row in range(count+1):
            t=theta_start+(theta_end-theta_start)*row/count
            # Longitudinal ellipse follows the lofted shell; bottom of each end
            # is tucked into the crown so the light cannot appear as a floating bar.
            z=.012+.155*math.cos(t)
            rx,ry,cy=section(z)
            for side in [-1,1]:
                xx=x+side*width*.5*(.65+.35*math.sin(math.pi*row/count))
                xx=max(-rx*.85,min(rx*.85,xx))
                sign=-1 if t<0 else 1
                yy=cy+sign*ry*math.sqrt(max(.01,1-(xx/rx)**2))
                # At the crown apex the strip crosses the cap, with a short
                # interpolation between the exact back and front silhouettes.
                if abs(t)<.14:yy=cy+(yy-cy)*abs(t)/.14
                normal=Vector((xx/max(rx*rx,.001),(yy-cy)/max(ry*ry,.001),max(.1,math.cos(t))*2)).normalized()
                point=CENTER+Vector((xx,yy,z))
                found,location,surface_normal,_index=smooth_shell.closest_point_on_mesh(point)
                if found:point=location+surface_normal*(offset+.0015)
                else:point+=normal*(offset+.004)
                vertices.append(tuple(point))
        # Fit two fair, continuous boundary splines to the sampled surface.
        # A global low-degree fit removes triangle-normal scallops that local
        # averaging can leave on the bright crest edge. Preserve both endpoints.
        parameters=np.linspace(0,1,count+1)
        for side in range(2):
            samples=np.array([vertices[row*2+side] for row in range(count+1)])
            coefficients=[np.polynomial.polynomial.polyfit(parameters,samples[:,axis],6) for axis in range(3)]
            fitted=np.column_stack([np.polynomial.polynomial.polyval(parameters,c) for c in coefficients])
            start=samples[0]-fitted[0];end=samples[-1]-fitted[-1]
            for row,t in enumerate(parameters):
                point=Vector(fitted[row]+start*(1-t)+end*t)
                found,location,_face_normal,face_index=smooth_shell.closest_point_on_mesh(point)
                if found:
                    polygon=smooth_shell.data.polygons[face_index]
                    normal=Vector((0,0,0));total=0
                    for vi in polygon.vertices:
                        vertex=smooth_shell.data.vertices[vi]
                        weight=1/max(.00001,(vertex.co-location).length)
                        normal+=vertex.normal*weight;total+=weight
                    normal=(normal/total).normalized()
                    point=location+normal*(offset+.0015)
                vertices[row*2+side]=tuple(point)
        sub.levels=old_level
        bpy.context.view_layer.update()
        faces=[(i*2,i*2+1,i*2+3,i*2+2) for i in range(count)]
        obj=mesh(name,vertices,faces,material)
        solid=obj.modifiers.new('Crown ribbon shell thickness','SOLIDIFY');solid.thickness=.006 if material=='dark' else .003;solid.offset=-.3 if material=='dark' else 0
        if high:bevel(obj,.0014)
        weighted(obj)
        return obj

    if option == 1:
        visor('continuous wrap brow',(-1.03,1.03),(-.039,.049),tilt=.008)
        curved_band('visor upper optical arc',(-.92,.92),(.033,.047),'light',.835,.002,tilt=.008)
        # A single long luminous return crosses the crown and becomes a dorsal
        # teardrop, so the helmet still has a face from the back camera.
        crown_ribbon('dorsal sensor gasket',-.018,.037,-1.27,.79,'dark',.002)
        crown_ribbon('dorsal teardrop optic',-.018,.021,-1.24,.77,'light',.005)
    elif option == 2:
        visor('left crescent optic',(-1.10,-.11),(-.030,.052),tilt=.020)
        visor('right crescent optic',(.11,1.10),(-.041,.041),tilt=-.020)
        for side in [-1,1]:
            curved_band('crescent luminous upper lip '+str(side),(side*.15,side*1.02),(.030,.042),'light',.835,.002,tilt=-side*.020)
            crown_ribbon('swept sensor gasket '+str(side),side*.067,.032,-1.18,.53,'dark',.003)
            crown_ribbon('swept crown light '+str(side),side*.067,.014,-1.15,.50,'light',.006)
    else:
        visor('shield lens',(-.91,.91),(-.073,.049),tilt=.0)
        curved_band('shield upper light',(-.82,.82),(.032,.046),'light',.835,.002)
        foundation=crown_ribbon('crown keel recessed dark foundation',0,.084,-1.24,.99,'dark',.003)
        modifier=None
        if high:
            # Recess the actual pressure shell below the engineered keel foundation.
            channel=foundation.copy();channel.data=foundation.data.copy();bpy.context.collection.objects.link(channel)
            channel.name='crown keel channel cutter';channel.data.materials.clear();channel.hide_render=True
            for modifier in list(channel.modifiers):channel.modifiers.remove(modifier)
            solid=channel.modifiers.new('Crown channel cutting depth','SOLIDIFY');solid.thickness=.012;solid.offset=-1
            modifier=shell.modifiers.new('Actual recessed crown-keel channel','BOOLEAN');modifier.operation='DIFFERENCE';modifier.solver='EXACT';modifier.object=channel
            # Sampling subsequent layers ignores the fresh cavity; it uses the outer
            # shell subdivision plus the visor cuts, preserving one clean arc.
            modifier.show_viewport=False
        crown_ribbon('crown keel ceramic surround',0,.069,-1.20,.95,'steel',.005)
        crown_ribbon('crown keel luminous return',0,.034,-1.17,.92,'light',.0075)
        if modifier:modifier.show_viewport=True

    # A shallow posterior assembly seam follows the pressure shell itself. This
    # is a cut with an inset dark floor, not a raised rectangular decoration.
    if high:
        rear_cutter=curved_band('posterior service seam cutter',(1.62,4.66),(-.022,-.017),radial=.88,cut=True,tilt=.007)
        seam=shell.modifiers.new('Recessed posterior assembly seam','BOOLEAN');seam.operation='DIFFERENCE';seam.solver='EXACT';seam.object=rear_cutter
        curved_band('posterior seam inset floor',(1.63,4.65),(-.021,-.018),'dark',.887,.001,tilt=.007)

    # Cheek shells duplicate curved pressure-shell patches. Thin offset and
    # solidification keep their shape anatomical instead of adding box jaw pads.
    for side in [-1,1]:
        angles=(side*.46,side*1.36)
        cheek=curved_band('sculpted jaw guard '+str(side),angles,(-.130,-.066),'steel',1.045,.012,tilt=-side*.012)
        # Small round hinge/filter assembly is tangent to the shaped temple.
        angle=side*1.46
        center=Vector(surface(angle,-.034,1.025))
        axis=Vector((math.sin(angle),math.cos(angle),0))
        bpy.ops.mesh.primitive_cylinder_add(vertices=16 if not high else 24,radius=.027,depth=.011,location=center)
        pod=bpy.context.object;pod.rotation_euler=axis.to_track_quat('Z','Y').to_euler()
        register(pod,'recessed temple hinge '+str(side),'dark');bevel(pod,.003);weighted(pod)
        bpy.ops.mesh.primitive_cylinder_add(vertices=12 if not high else 20,radius=.014,depth=.013,location=center+axis*.004)
        cap=bpy.context.object;cap.rotation_euler=pod.rotation_euler
        register(cap,'temple hinge keeper '+str(side),'steel');bevel(cap,.002);weighted(cap)
        for k in range(3 if high else 0):
            # Three thin machined slits follow the cheek curvature.
            theta=side*(.66+k*.15)
            slot_cut=curved_band('jaw breather pocket cutter '+str(side)+' '+str(k),(theta-.028,theta+.028),(-.113,-.086),radial=.99,cut=True)
            mod=cheek.modifiers.new('Boolean breather pocket '+str(k),'BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=slot_cut
            bpy.context.view_layer.objects.active=cheek
            while list(cheek.modifiers).index(mod)>1:bpy.ops.object.modifier_move_up(modifier=mod.name)
            curved_band('jaw breather inset '+str(side)+' '+str(k),(theta-.025,theta+.025),(-.111,-.088),'dark',1.008,.001)
    if option==3:
        intake=curved_band('curved mandible pressure intake',(-.49,.49),(-.148,-.083),'steel',1.055,.014)
        for index,(bottom,top) in enumerate([(-.130,-.120),(-.108,-.098)] if high else []):
            cutter=curved_band('mandible intake slot cutter '+str(index),(-.34,.34),(bottom,top),radial=.985,cut=True)
            modifier=intake.modifiers.new('Recessed mandible intake '+str(index),'BOOLEAN');modifier.operation='DIFFERENCE';modifier.solver='EXACT';modifier.object=cutter
            bpy.context.view_layer.objects.active=intake
            while list(intake.modifiers).index(modifier)>1:bpy.ops.object.modifier_move_up(modifier=modifier.name)
            curved_band('mandible intake dark floor '+str(index),(-.325,.325),(bottom+.001,top-.001),'dark',.998,.001)
    bevel(shell,.0035)
    weighted(shell)
    # Boolean-generated floor vertices must follow the head, never the exporter
    # fallback torso bone. Realize this rigid assembly and weight every new point.
    for obj in objects:
        bpy.context.view_layer.objects.active=obj
        for modifier in list(obj.modifiers):bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj['k10RigidBone']='head'
        group=obj.vertex_groups.get('head') or obj.vertex_groups.new(name='head')
        group.add(list(range(len(obj.data.vertices))),1,'REPLACE')
    return objects


def _standalone():
    import json
    import struct
    import zlib
    root=Path(__file__).resolve().parents[3]
    out=root/'artifacts/nextgen/k10-final/helmet-options';out.mkdir(parents=True,exist_ok=True)
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    palette={'plate':(.75,.74,.66,1),'steel':(.20,.29,.33,1),'dark':(.025,.04,.05,1),'visor':(.018,.075,.11,1),'light':(.29,.82,1,1)}
    materials={}
    for name,color in palette.items():
        m=bpy.data.materials.new('helmet review '+name);m.diffuse_color=color;m.use_nodes=True
        p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=color;p.inputs['Metallic'].default_value=.35 if name in ['plate','steel'] else .15;p.inputs['Roughness'].default_value=.42 if name=='plate' else .27 if name=='visor' else .58
        if name=='light':p.inputs['Emission Color'].default_value=color;p.inputs['Emission Strength'].default_value=3.5
        materials[name]=m
    def attach(obj,name,mat,bone):
        obj.data.materials.append(materials[mat]);obj.name=name
        group=obj.vertex_groups.new(name=bone);group.add(list(range(len(obj.data.vertices))),1,'REPLACE')
    all_options={}
    for option in [1,2,3]:all_options[option]=create_helmet(option,materials,attach)
    high_options={3:create_helmet(3,materials,attach,high=True)}
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48
    scene.render.resolution_x=1000;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False;scene.view_settings.view_transform='AgX'
    scene.world.use_nodes=True;scene.world.node_tree.nodes.get('Background').inputs[0].default_value=(.13,.18,.22,1);scene.world.node_tree.nodes.get('Background').inputs[1].default_value=.55
    for point,power,size in [((.8,1.0,2.5),85,1.3),((-.7,-.5,2.4),110,.9),((.4,-.9,1.9),85,.7)]:
        bpy.ops.object.light_add(type='AREA',location=point);lamp=bpy.context.object;lamp.data.energy=power;lamp.data.size=size;lamp.rotation_euler=(CENTER-lamp.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add();camera=bpy.context.object;camera.data.type='ORTHO';camera.data.ortho_scale=.51;scene.camera=camera
    summary=[]
    for option,objects in all_options.items():
        selected=next((int(a.split('=')[1]) for a in __import__('sys').argv if a.startswith('--option=')),None)
        if selected and option!=selected:continue
        for key,group in all_options.items():
            for obj in group:obj.hide_render=True
        for group in high_options.values():
            for obj in group:obj.hide_render=True
        for view,point in [('beauty',(.65,1.0,2.48)),('gameplay',(.6,-.8,3.28)),('back',(.0,-1,2.1))]:
            use_high=option==3 and view!='gameplay'
            for key,group in all_options.items():
                for obj in group:obj.hide_render=key!=option or use_high
            for key,group in high_options.items():
                for obj in group:obj.hide_render=key!=option or not use_high
            camera.location=point;camera.rotation_euler=(CENTER-camera.location).to_track_quat('-Z','Y').to_euler()
            scene.render.filepath=str(out/f'option-{option}-{view}.png');bpy.ops.render.render(write_still=True)
        triangles=0
        for obj in objects:
            evaluated=obj.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=evaluated.to_mesh();mesh.calc_loop_triangles();triangles+=len(mesh.loop_triangles);evaluated.to_mesh_clear()
        summary.append({'option':option,'name':OPTION_NAMES[option],'triangles':triangles,'beautySource':'high-detail source' if option==3 else 'low concept','gameplaySource':'game mesh','selected':option==SELECTED_OPTION})
    old=[]
    if (out/'options.json').exists():
        try:old=json.loads((out/'options.json').read_text())
        except (ValueError,TypeError):pass
    latest={entry['option']:entry for entry in old}
    latest.update({entry['option']:entry for entry in summary})
    (out/'options.json').write_text(json.dumps(list(latest.values()),indent=2))
    (out/'DESIGN.md').write_text('''# Closed pressure helmet alternatives\n\nAll three begin with changing elliptical latitude sections and true subdivision. The visor is a curved Boolean recess with a sunk glass shell, not a painted panel. Curved jaw armour, small circular hinges and three machined breathing slits complete the lower head. No face is visible.\n\n1. **Manta brow**: one continuous wrap lens, raised outer brow contour and one offset teardrop optic returning across the crown and down the back. Calm, organic and particularly strong from the gameplay angle.\n2. **Split crescent**: two swept crescent lenses, two narrow crown-return lights and broad curved jaw guards. More technical; the paired crown signature is visible from above, but risks reading as generic twin racing stripes.\n3. **Crown keel**: shield lens and a broad continuous luminous centre keel over a rounded shell. Strongest compact graphic from behind; the broad keel can dominate the head if emission is not controlled.\n\nSelected by root after actual front/gameplay review: **option3 Crown keel**. Its single broad dorsal optic remains readable at the28px helmet approximation of a140px marine; option1 is too thin and option2 fragments. Option3 has a recessed keel bed/frame and curved mandible intake, with actual milled seams/slots in the high source transferred in the high-to-low bake. Its beauty/back renders show that high-detail source; gameplay shows the3,684-triangle low mesh. The initial blank-egg review was rejected: cutter volume normals and crown projection were corrected before selection. Crest boundaries are smoothed splines projected from a higher-resolution shell, not the old scalloped low face projection.\n''')
    print('Helmet options:',summary)


if __name__=='__main__':_standalone()
