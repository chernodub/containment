"""Render the selector close-ups and the Breacher plate for the title."""
import argparse
import json
import sys
from pathlib import Path
import bpy
from mathutils import Vector

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import hero
import ink
from render_device import choose_render_device

SHOTS = {
    'breacher': ('shotgun', (.75, -.72, 1.05)),
    'cryo': ('rifle', (.64, .98, .92)),
    'pyro': ('rocket', (.70, -1.1, .82)),
    'arc': ('plasma', (.88, .66, .74)),
}
parser = argparse.ArgumentParser()
parser.add_argument('--rig', nargs='+', choices=SHOTS, default=list(SHOTS))
parser.add_argument('--out', type=Path, default=hero.ROOT / 'public/assets/ui/studio')
parser.add_argument('--preview', action='store_true')
parser.add_argument('--title', action='store_true', help='Light and frame the close-up Breacher for the breached hatch')
args = parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
args.out.mkdir(parents=True, exist_ok=True)
hero.HERO_GLB = hero.HERO_GLB.with_name('marine-selection.glb')


for rig in (['breacher'] if args.title else args.rig):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    choose_render_device(scene)
    scene.cycles.samples = 4 if args.preview else 12
    scene.cycles.use_denoising = False
    scene.world = bpy.data.worlds.new('Low cool studio ambient')
    scene.world.color = (.09,.105,.13)
    resolution = 1728 if args.title else 640
    if args.preview:
        resolution = 640 if args.title else 320
    scene.render.resolution_x = scene.render.resolution_y = resolution
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.compression = 100
    scene.render.image_settings.color_mode = 'RGBA'

    weapon, view = SHOTS[rig]
    path = hero.ROOT / 'artifacts/nextgen/title32-studio' / (rig+'-carry.json')
    objects, meshes, arm = hero.stage_hero(rig, weapon, brace=False, carry=json.loads(path.read_text()))
    if args.title:
        view = (.47, 1.19, .63)
    forward = Vector(view).normalized()
    orientation = (-forward).to_track_quat('-Z', 'Y')
    right, up = (orientation @ Vector(axis) for axis in ((1,0,0),(0,1,0)))
    points = hero.deformed_points([obj for obj in objects if obj.type == 'MESH'])
    bounds = [(min(p.dot(axis) for p in points),max(p.dot(axis) for p in points)) for axis in (right,up)]
    target = sum((axis * ((lo+hi)/2) for axis,(lo,hi) in zip((right,up),bounds)),Vector())
    bpy.ops.object.camera_add(location=target+forward*5)
    cam = bpy.context.object
    scene.camera = cam
    cam.rotation_euler = orientation.to_euler()
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = max(hi-lo for lo,hi in bounds)/.90

    ink.draw(scene, objects, forward*.52 - right*.58 + up*.76, resolution)
    scene.render.filepath = str(args.out / ('breacher.png' if args.title else f'portrait-{rig}.png'))
    bpy.ops.render.render(write_still=True)
