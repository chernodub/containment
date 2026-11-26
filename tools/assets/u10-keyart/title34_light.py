"""Shape the blue-white breach and project the Breacher's matte across its deck."""
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps

def background(hull):
    light=ImageOps.grayscale(hull)
    steel=ImageOps.colorize(light,'#02070c','#c4d7dd','#354754',midpoint=111)
    # Inner silhouette of the torn pressure wall. The folded strips remain
    # opaque in front of the view through the hull.
    aperture=Image.new('L',hull.size)
    shape=[(234,198),(253,174),(267,170),(257,153),(273,147),(287,184),
           (295,184),(281,139),(303,131),(325,143),(344,155),(374,156),
           (384,137),(403,136),(395,181),(417,199),(435,196),(444,217),
           (425,231),(408,248),(419,276),(392,296),(371,284),(350,312),
           (335,325),(328,308),(281,317),(262,299),(251,281),(228,275),(238,248)]
    ImageDraw.Draw(aperture).polygon([(x*4,y*4) for x,y in shape],fill=255)
    distant=Image.new('RGB',hull.size,'#354f60')
    d=ImageDraw.Draw(distant)
    def plane(points,fill):
        d.polygon([(4*x,4*y) for x,y in points],fill=fill)
    plane([(170,192),(430,113),(450,171),(174,255)],'#678596')
    plane([(161,247),(450,159),(451,169),(175,257)],'#89a6b1')
    plane([(218,300),(450,223),(450,285),(231,343)],'#2b4554')
    return Image.composite(distant,steel,aperture.filter(ImageFilter.GaussianBlur(1.1)))

def cast_shadow(deck,hero):
    # Flatten the upright figure into deck perspective, anchored below the shield.
    a,b,c,d,tx,ty=.65,.38,.05,.24,60,925
    det=a*d-b*c
    inverse=(d/det,-b/det,(b*ty-d*tx)/det,-c/det,a/det,(c*tx-a*ty)/det)
    shadow=hero.getchannel('A').transform(deck.size,Image.Transform.AFFINE,inverse,
        Image.Resampling.BICUBIC).filter(ImageFilter.GaussianBlur(2.2))
    shadow=ImageChops.multiply(shadow,deck.getchannel('A')).point(lambda v:round(v*.72))
    ink=Image.new('RGBA',deck.size,'#111b29');ink.putalpha(shadow)
    deck.alpha_composite(ink)
