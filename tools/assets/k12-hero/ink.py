"""Hard light planes and visible contours for high-resolution marine illustrations."""
import math
import bpy

# Shadow, key and grazing highlight in display sRGB.
IVORY = ('666667','b6b5ae','dddcd1')
GRAPHITE = ('222731','464c53','68727b')
STEEL = ('343b45','737d86','aebbc0')
INK = ('131822','252b32','363c42')
PAINT = {
    'ceramic': IVORY, 'steel': STEEL, 'gunmetal': GRAPHITE, 'heat': GRAPHITE,
    'amber': ('665337','b89850','dac07c'), 'ice': ('345361','6baab8','a3d3d6'),
    'fire': ('795132','c88d4b','e4b16d'), 'violet': ('56416e','9371b3','c1a4d7'),
    'visor': ('10212a','213b46','37525d'), 'visor_edge': INK,
    'marking': ('151921','20252c','31353c'), 'brass': ('685439','a08b67','c4b389'),
    'hazard': GRAPHITE, 'graphite': GRAPHITE,
}
LIGHT = {'glow':'a9f6ff','arc_glow':'d4c0ef','fire_glow':'ffa34d',
         'amber_glow':'edbe74','ice_glow':'a9dfea'}


def linear(hex_colour):
    def channel(i):
        v = int(hex_colour[i:i+2],16)/255
        return v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4
    return (*[channel(i) for i in (0,2,4)],1)


def draw(scene, objects, key, resolution, embedded=False, breach=None):
    if not embedded:
        scene.view_settings.view_transform = 'Standard'
        scene.view_settings.look = 'None'
        scene.view_settings.exposure = 0
    scene.render.use_freestyle = True
    lines = scene.view_layers[0].freestyle_settings
    lines.crease_angle = math.radians(95)
    line = lines.linesets[0]
    if embedded:
        subjects = bpy.data.collections.new('Inked operator')
        scene.collection.children.link(subjects)
        for obj in objects:
            if obj.type == 'MESH' and not obj.hide_render:
                subjects.objects.link(obj)
        line.select_by_collection = True
        line.collection = subjects
    line.select_crease = True
    line.linestyle = bpy.data.linestyles.new('Marine ink')
    line.linestyle.color = linear('151922')[:3]
    line.linestyle.thickness = max(.9, resolution*.0011)
    materials = {slot.material for obj in objects if obj.type == 'MESH' and not obj.hide_render
                 for slot in obj.material_slots if slot.material}
    for mat in materials:
        role = mat.get('k12Role', 'gunmetal')
        tree = mat.node_tree
        tree.nodes.clear()
        emit = tree.nodes.new('ShaderNodeEmission')
        if role in LIGHT:
            emit.inputs[0].default_value = linear(LIGHT[role])
        else:
            normal = tree.nodes.new('ShaderNodeNewGeometry').outputs['Normal']
            dot = tree.nodes.new('ShaderNodeVectorMath')
            dot.operation = 'DOT_PRODUCT'
            dot.inputs[1].default_value = key.normalized()
            tree.links.new(normal,dot.inputs[0])
            ramp = tree.nodes.new('ShaderNodeValToRGB')
            ramp.color_ramp.interpolation = 'CONSTANT'
            shadow, middle, high = PAINT.get(role, INK)
            stops = ramp.color_ramp.elements
            stops[0].color = linear(shadow)
            stops[1].position = .22
            stops[1].color = linear(middle)
            stops.new(.86).color = linear(high)
            tree.links.new(dot.outputs['Value'],ramp.inputs[0])
            colour = ramp.outputs[0]
            if breach is not None:
                for direction, threshold, tint, strength in breach:
                    facing = tree.nodes.new('ShaderNodeVectorMath')
                    facing.operation = 'DOT_PRODUCT'
                    facing.inputs[1].default_value = direction.normalized()
                    tree.links.new(normal, facing.inputs[0])
                    band = tree.nodes.new('ShaderNodeMath')
                    band.operation = 'GREATER_THAN'
                    band.inputs[1].default_value = threshold
                    tree.links.new(facing.outputs['Value'], band.inputs[0])
                    mix = tree.nodes.new('ShaderNodeMixRGB')
                    mix.inputs[2].default_value = tuple(a*(1-strength)+b*strength for a,b in zip(linear(middle),linear(tint)))
                    tree.links.new(band.outputs[0],mix.inputs[0])
                    tree.links.new(colour,mix.inputs[1])
                    colour = mix.outputs[0]
            tree.links.new(colour,emit.inputs[0])
        tree.links.new(emit.outputs[0],tree.nodes.new('ShaderNodeOutputMaterial').inputs['Surface'])
