"""K12 surface library: procedural Cycles finishes with baked-down game albedo.

Original MIT authoring code. One description per *role* builds both the close-up
render shader (paint with chipped edges revealing metal, cavity grime, fine
scratches, micro-roughness, fabric weave) and, with ``mode='albedo'``, an emission
shader that outputs the same colour signal for selected-to-active atlas baking.
Game albedo keeps flat readable value zones: wear and grime are reduced there.
"""
import bpy

PALETTE = {
    # linear RGB
    'ceramic': (.60, .565, .47),       # warm ivory paint over composite
    'ceramic_game': (.74, .705, .60),
    'amber': (.93, .45, .035),
    'ice': (.17, .50, .82),
    'fire': (.86, .17, .03),
    'violet': (.36, .13, .72),
    'gunmetal': (.055, .065, .072),
    'steel': (.42, .44, .45),
    'graphite': (.03, .035, .04),
    'fabric': (.022, .027, .032),
    'rubber': (.013, .014, .016),
    'brass': (.55, .36, .12),
    'marking': (.016, .018, .021),
    'visor': (.004, .012, .016),
    'glow': (.20, .85, 1.0),
    'amber_glow': (1.0, .52, .05),
    'ice_glow': (.25, .78, 1.0),
    'fire_glow': (1.0, .30, .04),
    'arc_glow': (.70, .52, 1.0),
    'primer': (.25, .26, .25),
}
RIG_COLOUR = {'breacher': 'amber', 'cryo': 'ice', 'pyro': 'fire', 'arc': 'violet'}
RIG_GLOW = {'breacher': 'amber_glow', 'cryo': 'ice_glow', 'pyro': 'fire_glow', 'arc': 'arc_glow'}

# role -> (kind, palette key, roughness, metallic, wear, grime)
ROLES = {
    'ceramic': ('paint', 'ceramic', .42, .0, 1.0, 1.0),
    'amber': ('paint', 'amber', .40, .0, 1.0, 1.0),
    'ice': ('paint', 'ice', .40, .0, .9, .9),
    'fire': ('paint', 'fire', .45, .0, 1.1, 1.1),
    'violet': ('paint', 'violet', .38, .0, .9, .9),
    'hazard': ('hazard', 'amber', .42, .0, 1.2, 1.0),
    'gunmetal': ('metal', 'gunmetal', .36, .9, .6, 1.0),
    'steel': ('metal', 'steel', .28, 1.0, .3, .8),
    'brass': ('metal', 'brass', .32, 1.0, .2, .8),
    'heat': ('heat', 'gunmetal', .4, .9, .2, .6),
    'graphite': ('polymer', 'graphite', .55, .0, .4, .7),
    'fabric': ('fabric', 'fabric', .82, .0, .0, .5),
    'rubber': ('polymer', 'rubber', .88, .0, .0, .6),
    'marking': ('paint', 'marking', .5, .0, .9, .5),
    'visor': ('visor', 'visor', .06, .0, .0, .0),
    'glow': ('glow', 'glow', .3, .0, .0, .0),
    'amber_glow': ('glow', 'amber_glow', .3, .0, .0, .0),
    'ice_glow': ('glow', 'ice_glow', .3, .0, .0, .0),
    'fire_glow': ('glow', 'fire_glow', .3, .0, .0, .0),
    'arc_glow': ('glow', 'arc_glow', .3, .0, .0, .0),
}
GLOW_STRENGTH = {'glow': 6.0, 'amber_glow': 5.0, 'ice_glow': 5.5, 'fire_glow': 6.0, 'arc_glow': 6.0}
GAME_VALUE = {'ceramic': 'ceramic_game'}

_cache = {}


def colour(role):
    kind, key = ROLES[role][0], ROLES[role][1]
    return PALETTE[key] + (1,)


def get(role, mode='render'):
    """Material for a role. ``mode`` = 'render' | 'albedo' | 'emission'."""
    key = (role, mode)
    mat = _cache.get(key)
    try:
        if mat is not None and bpy.data.materials.get(mat.name) == mat:
            return mat
    except ReferenceError:
        pass
    mat = build(role, mode)
    _cache[key] = mat
    return mat


def _n(nodes, kind, loc=(0, 0), **inputs):
    node = nodes.new(kind)
    node.location = loc
    for k, v in inputs.items():
        node.inputs[k].default_value = v
    return node


def _math(nodes, links, op, a, b=None, clamp=False):
    node = nodes.new('ShaderNodeMath'); node.operation = op; node.use_clamp = clamp
    for i, x in enumerate([a, b]):
        if x is None:
            continue
        if isinstance(x, (int, float)):
            node.inputs[i].default_value = x
        else:
            links.new(x, node.inputs[i])
    return node.outputs[0]


def _mix(nodes, links, fac, a, b, blend='MIX'):
    node = nodes.new('ShaderNodeMix'); node.data_type = 'RGBA'; node.blend_type = blend
    for slot, x in [(0, fac), (6, a), (7, b)]:
        if isinstance(x, (int, float)):
            node.inputs[slot].default_value = x
        elif isinstance(x, tuple):
            node.inputs[slot].default_value = x
        else:
            links.new(x, node.inputs[slot])
    return node.outputs[2]


def _ramp(nodes, links, src, stops):
    node = nodes.new('ShaderNodeValToRGB')
    els = node.color_ramp.elements
    els[0].position, els[0].color = stops[0][0], (stops[0][1],) * 3 + (1,)
    els[1].position, els[1].color = stops[-1][0], (stops[-1][1],) * 3 + (1,)
    for pos, val in stops[1:-1]:
        e = els.new(pos); e.color = (val,) * 3 + (1,)
    links.new(src, node.inputs[0])
    return node.outputs[0]


def masks(nodes, links, wear_amount, grime_amount, game=False):
    """Edge wear, cavity grime and scratch masks in object space (bake-stable)."""
    tex = nodes.new('ShaderNodeTexCoord')
    obj = tex.outputs['Object']
    geo = nodes.new('ShaderNodeNewGeometry')
    # Edge detection: rounded shading normal (Bevel node) departs from true normal on arrises.
    bev = nodes.new('ShaderNodeBevel'); bev.samples = 6; bev.inputs['Radius'].default_value = .0035
    dot = nodes.new('ShaderNodeVectorMath'); dot.operation = 'DOT_PRODUCT'
    links.new(bev.outputs[0], dot.inputs[0]); links.new(geo.outputs['Normal'], dot.inputs[1])
    edge = _math(nodes, links, 'SUBTRACT', 1.0, dot.outputs['Value'])
    edge = _math(nodes, links, 'MULTIPLY', edge, 14.0, clamp=True)
    # Break the edge into chips with layered noise.
    chip = nodes.new('ShaderNodeTexNoise'); chip.inputs['Scale'].default_value = 55; chip.inputs['Detail'].default_value = 8
    chip.inputs['Roughness'].default_value = .65
    links.new(obj, chip.inputs['Vector'])
    breakup = _ramp(nodes, links, chip.outputs['Fac'], [(.42, 0), (.62, 1)])
    sep = nodes.new('ShaderNodeSeparateColor'); links.new(breakup, sep.inputs[0])
    wear = _math(nodes, links, 'MULTIPLY', edge, sep.outputs[0])
    wear = _math(nodes, links, 'MULTIPLY', wear, 1.6 * wear_amount * (.45 if game else 1), clamp=True)
    # Large-scale scuffs on exposed convex areas (low frequency, sparse).
    scuff = nodes.new('ShaderNodeTexNoise'); scuff.inputs['Scale'].default_value = 9; scuff.inputs['Detail'].default_value = 6
    links.new(obj, scuff.inputs['Vector'])
    scuff_mask = _ramp(nodes, links, scuff.outputs['Fac'], [(.62, 0), (.70, 1)])
    sepc = nodes.new('ShaderNodeSeparateColor'); links.new(scuff_mask, sepc.inputs[0])
    scuff_v = _math(nodes, links, 'MULTIPLY', sepc.outputs[0], .35 * wear_amount * (.3 if game else 1))
    wear = _math(nodes, links, 'MAXIMUM', wear, scuff_v)
    # Cavity grime from short-range local occlusion.
    ao = nodes.new('ShaderNodeAmbientOcclusion'); ao.samples = 12; ao.only_local = True
    ao.inputs['Distance'].default_value = .035
    grime_noise = nodes.new('ShaderNodeTexNoise'); grime_noise.inputs['Scale'].default_value = 18; grime_noise.inputs['Detail'].default_value = 5
    links.new(obj, grime_noise.inputs['Vector'])
    cav = _math(nodes, links, 'SUBTRACT', 1.0, ao.outputs['AO'])
    cav = _math(nodes, links, 'MULTIPLY', cav, 2.2, clamp=True)
    gn = nodes.new('ShaderNodeSeparateColor'); links.new(grime_noise.outputs['Color'], gn.inputs[0])
    gmod = _math(nodes, links, 'MULTIPLY_ADD', gn.outputs[0], .8)
    gmod.node.inputs[2].default_value = .55
    grime = _math(nodes, links, 'MULTIPLY', cav, gmod)
    grime = _math(nodes, links, 'MULTIPLY', grime, grime_amount * (.55 if game else 1), clamp=True)
    # Downward streaks: grime gathers below fasteners/edges (object -Z stretched noise).
    streak = nodes.new('ShaderNodeTexNoise'); streak.inputs['Scale'].default_value = 30; streak.inputs['Detail'].default_value = 3
    mapping = nodes.new('ShaderNodeMapping'); mapping.inputs['Scale'].default_value = (1, 1, .08)
    links.new(obj, mapping.inputs['Vector']); links.new(mapping.outputs[0], streak.inputs['Vector'])
    streak_m = _ramp(nodes, links, streak.outputs['Fac'], [(.55, 0), (.75, 1)])
    ss = nodes.new('ShaderNodeSeparateColor'); links.new(streak_m, ss.inputs[0])
    grime = _math(nodes, links, 'MAXIMUM', grime, _math(nodes, links, 'MULTIPLY', ss.outputs[0], .18 * grime_amount * (.3 if game else 1)))
    # Fine directional scratches.
    scr = nodes.new('ShaderNodeTexWave'); scr.wave_type = 'BANDS'; scr.bands_direction = 'DIAGONAL'
    scr.inputs['Scale'].default_value = 140; scr.inputs['Distortion'].default_value = 22; scr.inputs['Detail'].default_value = 4
    links.new(obj, scr.inputs['Vector'])
    scr_m = _ramp(nodes, links, scr.outputs['Fac'], [(.0, 1), (.035, 0)])
    scr_noise = nodes.new('ShaderNodeTexNoise'); scr_noise.inputs['Scale'].default_value = 6
    links.new(obj, scr_noise.inputs['Vector'])
    scr_gate = _ramp(nodes, links, scr_noise.outputs['Fac'], [(.55, 0), (.62, 1)])
    s1 = nodes.new('ShaderNodeSeparateColor'); links.new(scr_m, s1.inputs[0])
    s2 = nodes.new('ShaderNodeSeparateColor'); links.new(scr_gate, s2.inputs[0])
    scratch = _math(nodes, links, 'MULTIPLY', s1.outputs[0], s2.outputs[0])
    scratch = _math(nodes, links, 'MULTIPLY', scratch, .55 * wear_amount * (.0 if game else 1))
    micro = nodes.new('ShaderNodeTexNoise'); micro.inputs['Scale'].default_value = 220; micro.inputs['Detail'].default_value = 4
    links.new(obj, micro.inputs['Vector'])
    return {'wear': wear, 'grime': grime, 'scratch': scratch, 'micro': micro.outputs['Fac'], 'object': obj, 'edge': edge}


def build(role, mode='render'):
    kind, key, rough, metal, wear_amt, grime_amt = ROLES[role]
    game = mode != 'render'
    base_key = GAME_VALUE.get(key, key) if game else key
    base = PALETTE[base_key] + (1,)
    name = f'k12-{role}' + ('' if mode == 'render' else '-' + mode)
    mat = bpy.data.materials.new(name)
    mat['k12Role'] = role
    mat.diffuse_color = base
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    out = _n(nodes, 'ShaderNodeOutputMaterial', (900, 0))
    if mode == 'emission':
        em = _n(nodes, 'ShaderNodeEmission', (600, 0))
        if kind == 'glow':
            em.inputs['Color'].default_value = PALETTE[key] + (1,)
            em.inputs['Strength'].default_value = 1.0
        elif kind == 'visor':
            em.inputs['Color'].default_value = (.02, .09, .11, 1)
        else:
            em.inputs['Color'].default_value = (0, 0, 0, 1)
        links.new(em.outputs[0], out.inputs['Surface'])
        return mat
    if kind == 'glow':
        if mode == 'albedo':
            em = _n(nodes, 'ShaderNodeEmission', (600, 0)); em.inputs['Color'].default_value = tuple(min(1, c * .8 + .15) for c in PALETTE[key]) + (1,)
            links.new(em.outputs[0], out.inputs['Surface'])
            return mat
        p = _n(nodes, 'ShaderNodeBsdfPrincipled', (500, 0))
        p.inputs['Base Color'].default_value = PALETTE[key] + (1,)
        p.inputs['Emission Color'].default_value = PALETTE[key] + (1,)
        p.inputs['Emission Strength'].default_value = GLOW_STRENGTH.get(role, 5)
        p.inputs['Roughness'].default_value = .3
        links.new(p.outputs[0], out.inputs['Surface'])
        return mat
    if kind == 'visor':
        if mode == 'albedo':
            em = _n(nodes, 'ShaderNodeEmission', (600, 0)); em.inputs['Color'].default_value = (.03, .10, .13, 1)
            links.new(em.outputs[0], out.inputs['Surface'])
            return mat
        # Smoked glass over a luminous HUD layer: a glossy coat with emission that
        # brightens toward the lower lens and carries faint horizontal scanlines.
        p = _n(nodes, 'ShaderNodeBsdfPrincipled', (500, 0))
        p.inputs['Base Color'].default_value = (.004, .015, .02, 1)
        p.inputs['Roughness'].default_value = .05
        p.inputs['Coat Weight'].default_value = .6
        p.inputs['Coat Roughness'].default_value = .04
        p.inputs['Specular IOR Level'].default_value = .8
        tex = nodes.new('ShaderNodeTexCoord')
        sep = nodes.new('ShaderNodeSeparateXYZ'); links.new(tex.outputs['Object'], sep.inputs[0])
        wave = nodes.new('ShaderNodeTexWave'); wave.wave_type = 'BANDS'; wave.bands_direction = 'Z'
        wave.inputs['Scale'].default_value = 420; links.new(tex.outputs['Object'], wave.inputs['Vector'])
        lines = _ramp(nodes, links, wave.outputs['Fac'], [(0, .78), (1, 1)])
        grad = nodes.new('ShaderNodeTexNoise'); grad.inputs['Scale'].default_value = 2.5
        links.new(tex.outputs['Object'], grad.inputs['Vector'])
        glow = _mix(nodes, links, grad.outputs['Fac'], (.01, .12, .22, 1), (.05, .45, .70, 1))
        glow = _mix(nodes, links, 1.0, glow, lines, 'MULTIPLY')
        links.new(glow, p.inputs['Emission Color'])
        p.inputs['Emission Strength'].default_value = 1.4
        links.new(p.outputs[0], out.inputs['Surface'])
        return mat

    m = masks(nodes, links, wear_amt, grime_amt, game)
    paint = base
    if kind == 'hazard':
        # Diagonal hazard bands in object space, painted then worn like everything else.
        wave = nodes.new('ShaderNodeTexWave'); wave.wave_type = 'BANDS'; wave.bands_direction = 'DIAGONAL'
        wave.inputs['Scale'].default_value = 7.0; wave.inputs['Distortion'].default_value = 0
        links.new(m['object'], wave.inputs['Vector'])
        band = _ramp(nodes, links, wave.outputs['Fac'], [(.48, 0), (.52, 1)])
        paint = _mix(nodes, links, band, PALETTE['amber'] + (1,), PALETTE['marking'] + (1,))
    if kind == 'heat':
        # Temper colours: straw → bronze → blue → dark, along object Z (exhaust tips).
        sep = nodes.new('ShaderNodeSeparateXYZ'); links.new(m['object'], sep.inputs[0])
        r = nodes.new('ShaderNodeValToRGB'); els = r.color_ramp.elements
        els[0].position, els[0].color = 0, PALETTE['gunmetal'] + (1,)
        els[1].position, els[1].color = 1, (.03, .03, .05, 1)
        for pos, col in [(.35, (.25, .17, .07, 1)), (.55, (.30, .12, .06, 1)), (.75, (.06, .10, .30, 1))]:
            e = els.new(pos); e.color = col
        attr = nodes.new('ShaderNodeAttribute'); attr.attribute_name = 'k12_heat'
        links.new(attr.outputs['Fac'], r.inputs[0])
        paint = r.outputs[0]
    metal_under = PALETTE['steel'] + (1,) if kind in ('paint', 'hazard') else (.55, .56, .55, 1)
    primer = PALETTE['primer'] + (1,)
    if kind in ('paint', 'hazard'):
        # Chips reveal primer at the rim and bright metal at the core of the chip.
        chipped = _mix(nodes, links, m['wear'], paint, primer)
        core = _math(nodes, links, 'MULTIPLY', m['wear'], m['wear'])
        chipped = _mix(nodes, links, core, chipped, metal_under)
        chipped = _mix(nodes, links, m['scratch'], chipped, (.80, .79, .74, 1))
    elif kind in ('metal', 'heat'):
        chipped = _mix(nodes, links, _math(nodes, links, 'MULTIPLY', m['wear'], .6), paint, (.62, .63, .62, 1))
    elif kind == 'polymer':
        chipped = _mix(nodes, links, _math(nodes, links, 'MULTIPLY', m['wear'], .35), paint, (.10, .11, .12, 1))
    else:  # fabric
        chipped = paint
    grimed = _mix(nodes, links, m['grime'], chipped, (.035, .03, .022, 1), 'MULTIPLY' if False else 'MIX')
    if mode == 'albedo':
        em = _n(nodes, 'ShaderNodeEmission', (700, 0))
        links.new(grimed, em.inputs['Color'])
        links.new(em.outputs[0], out.inputs['Surface'])
        return mat
    p = _n(nodes, 'ShaderNodeBsdfPrincipled', (600, 0))
    links.new(grimed, p.inputs['Base Color'])
    # Roughness: base with micro variation; worn metal is shinier, grime is matte.
    r = _math(nodes, links, 'MULTIPLY_ADD', m['micro'], .12)
    r.node.inputs[2].default_value = rough - .06
    r = _math(nodes, links, 'ADD', r, _math(nodes, links, 'MULTIPLY', m['grime'], .25))
    if kind in ('paint', 'hazard'):
        r = _math(nodes, links, 'SUBTRACT', r, _math(nodes, links, 'MULTIPLY', m['wear'], .2))
        metal_v = _math(nodes, links, 'MULTIPLY', _math(nodes, links, 'MULTIPLY', m['wear'], m['wear']), .9)
        links.new(metal_v, p.inputs['Metallic'])
        p.inputs['Coat Weight'].default_value = .15
        p.inputs['Coat Roughness'].default_value = .25
    else:
        p.inputs['Metallic'].default_value = metal
    links.new(r, p.inputs['Roughness'])
    if kind == 'fabric':
        # Woven undersuit: two crossed band textures as bump, plus sheen.
        bump = nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = .35; bump.inputs['Distance'].default_value = .0006
        w1 = nodes.new('ShaderNodeTexWave'); w1.wave_type = 'BANDS'; w1.bands_direction = 'X'; w1.inputs['Scale'].default_value = 900
        w2 = nodes.new('ShaderNodeTexWave'); w2.wave_type = 'BANDS'; w2.bands_direction = 'Y'; w2.inputs['Scale'].default_value = 900
        links.new(m['object'], w1.inputs['Vector']); links.new(m['object'], w2.inputs['Vector'])
        weave = _math(nodes, links, 'MULTIPLY', w1.outputs['Fac'], w2.outputs['Fac'])
        links.new(weave, bump.inputs['Height'])
        links.new(bump.outputs[0], p.inputs['Normal'])
        p.inputs['Sheen Weight'].default_value = .35
        p.inputs['Sheen Tint'].default_value = (.35, .45, .5, 1)
    else:
        bump = nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = .06; bump.inputs['Distance'].default_value = .0003
        links.new(m['micro'], bump.inputs['Height'])
        links.new(bump.outputs[0], p.inputs['Normal'])
    links.new(p.outputs[0], out.inputs['Surface'])
    return mat
