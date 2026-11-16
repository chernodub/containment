"""P11 environmental Lantern Brood sculpture; original MIT, shares K11 anatomy."""
import math, sys
from pathlib import Path
import bpy, bmesh
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'k11-creatures'))
import sdf as S
import p11lib as L


def sculpt(name,primitives,role='p11-growth',budget=700,voxel=.024,tint=None):
    sculpture=S.Sculpture(name);sculpture.extend(primitives)
    field,origin=sculpture.evaluate_grid(voxel,log=lambda *_:None)
    points,faces=S.mesh_from_grid(field,origin,voxel,.02)
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(points.tolist(),[],faces.tolist());mesh.update();mesh.validate()
    obj=L._link(mesh,name,role,tint)
    if len(faces)>budget:
        dec=obj.modifiers.new('Retain sculpted ridges within prop budget','DECIMATE');dec.ratio=budget/len(faces);L._apply(obj)
    return L.finish(obj,role,0,tint=tint)


def shell(name,c,r=(.42,.34,.13),tilt=0,seed=0,budget=160):
    # Structured sculpt topology keeps the rolled growth rings continuous after
    # export; the prior heavily-decimated SDF cap tore into isolated triangles.
    R=S.rot((1,0,0),tilt);verts=[];faces=[];n=8 if budget<100 else (16 if budget>=200 else 12)
    radii=(0,.3,.6,.85,1) if budget<100 else ((0,.25,.4,.46,.52,.61,.68,.75,.8,.85,.91,1) if budget>=200 else (0,.22,.43,.59,.73,.85,.94,1))
    last=len(radii)-1
    for row,t in enumerate(radii):
        for j in range(n):
            a=j*math.tau/n
            chip=1-(.07*(.5+.5*math.sin(j*2.1+seed)) if row==last and math.cos(a)<0 else 0)
            xx=r[0]*t*math.cos(a)*chip;yy=r[1]*t*math.sin(a)*chip*(.78-.28*math.cos(a))
            rho=math.sqrt(((xx/r[0]-.55)/1.55)**2+(yy/r[1])**2)
            ridge=max(math.exp(-((rho-q)/.045)**2) for q in (.46,.68,.85))
            zz=r[2]*math.sqrt(max(0,1-t*t))+(.035 if budget>=150 else .012)*ridge
            p=Vector(R@S.v3((xx,yy,zz)))+Vector(c);verts.append(p)
            if row:
                k=row*n+j;previous=(row-1)*n+j
                faces.append((previous,(row-1)*n+(j+1)%n,row*n+(j+1)%n,k))
    # Close a thin lens shell; no holes or overlapping inner SDF surface.
    for j in range(n):
        p=Vector(R@S.v3((r[0]*math.cos(j*math.tau/n),r[1]*math.sin(j*math.tau/n)*(.78-.28*math.cos(j*math.tau/n)),-.035)))+Vector(c);verts.append(p)
        faces.append((last*n+j,last*n+(j+1)%n,(last+1)*n+(j+1)%n,(last+1)*n+j))
    faces.append(tuple(range((last+2)*n-1,(last+1)*n-1,-1)))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();mesh.validate()
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.remove_doubles(bm,verts=bm.verts,dist=.0001);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(mesh);bm.free()
    obj=L._link(mesh,name,'p11-tint','#45392f')
    for polygon in mesh.polygons:polygon.use_smooth=True
    # A narrow anterior bone rim traces the shell, leaving dark membrane gaps.
    pts=[]
    for i in range(9):
        a=-math.pi/2+i*math.pi/8
        p=Vector(R@S.v3((r[0]*.94*math.cos(a),r[1]*.94*math.sin(a)*(.78-.28*math.cos(a)),r[2]*.34+.014)))+Vector(c);pts.append(p)
    L.sweep(name+' rolled bone lip',pts,.028,'p11-tint',4,tint='#afa18b')
    return obj


def crust(c=(0,0,0),scale=1,seed=0,budget=550):
    # Flattened, branching fused crust with pits and growth ridges. No radial spikes.
    x,y,z=c;s=scale
    mass=S.Ellipsoid(c,(.52*s,.34*s,.12*s))
    parts=[S.Displace(S.Stretch(mass,(1,.3,0),.13*s,.025*s,sharp=3),.045*s,13/s,seed)]
    for i in range(4):
        a=i*1.8+seed
        start=(x+math.cos(a)*.25*s,y+math.sin(a)*.15*s,z)
        end=(x+math.cos(a)*.7*s,y+math.sin(a)*.4*s,z-.035*s)
        parts.append(S.Tube([start,end],[.11*s,.04*s],k=.08*s))
    for i in range(4):
        parts.append(S.Ellipsoid((x+(.12*i-.2)*s,y+math.sin(i+seed)*.18*s,z+.10*s),(.05*s,.06*s,.07*s),op='sub'))
    return sculpt('Pitted resin crust',parts,budget=budget,voxel=.025*s)


def clutch(c,scale=1,seed=0,count=3):
    x,y,z=c
    for i in range(count):
        cx=x+(i%2)*.27*scale;cy=y+(i//2)*.24*scale
        profile=[(max(.005,.14*scale*math.sin(math.pi*t/12)**.75*(1-.15*(t%2))),t*.032*scale) for t in range(13)]
        L.lathe('Ribbed brood membrane',profile,(cx,cy,z),'p11-flesh',8)
        L.egg('Faint enclosed violet lumen',(cx,cy-.12*scale,z+.1*scale),.085*scale,'p11-bio-violet',seed+i,.09)
        for side in (-1,1):
            shell('Egg protective shingle',(cx+side*.11*scale,cy,z+.22*scale),(.19*scale,.12*scale,.07*scale),tilt=side*.35,seed=seed+i,budget=65)
