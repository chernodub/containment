"""Print the outer silhouette behind the finer interior Blender and studio lines."""
import sys
from PIL import Image, ImageChops


def contour(actor, radius):
    ink = Image.new('RGBA',actor.size,'#10151b')
    alpha=actor.getchannel('A')
    for dx,dy in ((1,0),(0,1)):
        reach=0
        while reach<radius:
            step=min(reach*2+1,radius-reach)
            # Crop supplies zero padding at the canvas edge.
            offset=(dx*step,dy*step)
            a,b=offset
            low=alpha.crop((-a,-b,alpha.width-a,alpha.height-b))
            high=alpha.crop((a,b,alpha.width+a,alpha.height+b))
            alpha=ImageChops.lighter(alpha,ImageChops.lighter(low,high))
            reach+=step
    ink.putalpha(alpha)
    ink.alpha_composite(actor)
    return ink


if __name__ == '__main__':
    for path in sys.argv[1:]:
        with Image.open(path) as image:
            print_image = contour(image.convert('RGBA'),5).resize((640,640), Image.Resampling.LANCZOS)
        print_image.save(path,optimize=True)
