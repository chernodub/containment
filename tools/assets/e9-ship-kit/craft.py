"""P11 shared curvature/wear finish for original E9 meshes; no runtime textures."""
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

