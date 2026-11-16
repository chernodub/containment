"""Cinematic rim/key portraits of each original K10 rig; outputs only U10 UI assets."""
from pathlib import Path
import sys
import bpy
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).resolve().parent))
from actors import ROOT,import_marine,finish_for_render,area_light,deformed_points,ACCENTS
sys.path.insert(0,str(ROOT/'tools/assets/k10-marine'))
from render_device import choose_render_device
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
selected=next((a.split('=')[1] for a in args if a.startswith('--rig=')),None)
out=ROOT/'public/assets/portraits/u10';out.mkdir(parents=True,exist_ok=True)
for rig in (selected.split(',') if selected else ['breacher','cryo','pyro','arc']):
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    objects,meshes,armature=import_marine(rig,True);finish_for_render(objects,meshes,rig)
    scene=bpy.context.scene;scene.render.engine='CYCLES';choose_render_device(scene)
    scene.cycles.samples=128;scene.cycles.use_denoising=True
    scene.render.resolution_x=1024;scene.render.resolution_y=1024;scene.render.resolution_percentage=100
    scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
    scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=-1.45
    scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.04,.07,.1,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.025
    area_light('Cold white crown rim',(-1.3,-1.0,2.9),650,.85,(.65,.86,1),target=(0,0,1.7))
    area_light('Rig-colored emergency key',(2.7,1.0,2.7),230,1.6,ACCENTS[rig],target=(0,0,1.65))
    area_light('Quiet reflected fill',(3.5,3.0,1.5),14,2,(.32,.54,.65),target=(0,0,1.6))
    bpy.ops.object.camera_add();camera=bpy.context.object;scene.camera=camera;camera.data.type='ORTHO'
    direction=Vector((5.4,3.8,.35)).normalized();target=Vector((0,0,1.65))
    camera.location=target+direction*5;camera.rotation_euler=(-direction).to_track_quat('-Z','Y').to_euler()
    rotation=camera.rotation_euler.to_matrix();right=rotation @ Vector((1,0,0));up=rotation @ Vector((0,1,0))
    points=deformed_points(meshes,minimum_z=1.18);xs=[p.dot(right) for p in points];ys=[p.dot(up) for p in points]
    camera.location+=right*((min(xs)+max(xs))/2-target.dot(right));camera.location+=up*((min(ys)+max(ys))/2-target.dot(up))
    camera.data.ortho_scale=max((max(xs)-min(xs))/.9,(max(ys)-min(ys))/.9)
    scene.render.filepath=str(out/(rig+'-bust.png'));bpy.ops.render.render(write_still=True)
    print('U10 CINEMATIC PORTRAIT',rig,scene.render.filepath,flush=True)
