"""Dress the close-up skeleton with the current rig's authored equipment."""
import game_kit
import materials as M


def extend(suit, rig):
    game_kit.extend(suit, rig, portrait=True)
    colour = M.RIG_COLOUR[rig]
    for obj in suit.groups[rig]:
        name = obj.name.split('.')[0]
        if 'pauldron cap' in name or 'pauldron lame' in name:
            obj.data.materials[0] = M.get(colour)
        elif name in ('kit24 paint dewar','kit24 paint fuel bottle','breacher accumulator'):
            obj.data.materials[0] = M.get('graphite')
        elif name in ('dewar jacket strap', 'fuel strap'):
            obj.data.materials[0] = M.get(colour)
