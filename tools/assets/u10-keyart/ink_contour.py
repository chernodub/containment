"""Print the outer silhouette behind the finer interior Blender and studio lines."""
import sys
from PIL import Image, ImageFilter


def contour(actor, radius):
    ink = Image.new('RGBA',actor.size,'#10151b')
    ink.putalpha(actor.getchannel('A').filter(ImageFilter.MaxFilter(2*radius+1)))
    ink.alpha_composite(actor)
    return ink


if __name__ == '__main__':
    for path in sys.argv[1:]:
        with Image.open(path) as image:
            print_image = contour(image.convert('RGBA'),3)
        print_image.save(path,optimize=True)
