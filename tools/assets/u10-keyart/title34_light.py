"""Shape the blue-white breach and project the Breacher's matte across its deck."""
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps

def background(hull):
    # Preserve the photographed folds in the jamb as a single near-black mass.
    walls=ImageOps.colorize(hull.convert('L'),'#020509','#273039')
    # The diagonal torn header cuts off the light below the perched Crawler.
    opening=Image.new('L',hull.size)
    points=[(233,209),(245,199),(243,191),(267,185),(274,193),(284,189),
            (283,184),(334,171),(342,174),(388,160),(393,178),(414,192),
            (423,204),(437,203),(445,217),(423,238),(408,248),(419,276),
            (392,296),(371,284),(350,312),(335,325),(328,308),(281,317),
            (262,299),(251,281),(228,275),(238,248)]
    ImageDraw.Draw(opening).polygon([(4*x,4*y) for x,y in points],fill=255)
    # One silver opening. Keep the underlying rendered atmosphere very shallow
    # in value, so it reads as a luminous volume behind the dark sail.
    # Light falls off inside the jamb. Its broad bright core sits behind the
    # skull, so the opening has depth without a second light on the walls.
    core=Image.new('L',hull.size)
    ImageDraw.Draw(core).ellipse((256*4,193*4,443*4,313*4),fill=255)
    core=core.filter(ImageFilter.GaussianBlur(4*24))
    inner=ImageChops.add(core.point(lambda x:round(x*.65)),hull.convert('L'))
    daylight=ImageOps.colorize(inner,'#596777','#d4e5e5','#99b4bd',midpoint=116)
    return Image.composite(daylight,walls,opening.filter(ImageFilter.GaussianBlur(1.3)))

def light_deck(deck):
    alpha=deck.getchannel('A')
    outside=ImageOps.colorize(deck.convert('L'),'#04080e','#313a40')
    pool=Image.new('L',deck.size)
    # Perspective footprint of the same jagged aperture on the pressure collar.
    points=[(238,271),(332,263),(378,266),(417,253),(414,278),(459,294),
            (485,320),(522,343),(475,336),(445,317),(413,320),(398,314),
            (367,316),(344,303),(320,301),(293,287),(260,284)]
    ImageDraw.Draw(pool).polygon([(4*x,4*y) for x,y in points],fill=255)
    lit=ImageOps.colorize(deck.convert('L'),'#2e3d48','#bbcdd1','#627986',midpoint=76)
    deck=Image.composite(lit,outside,pool.filter(ImageFilter.GaussianBlur(.9)))
    deck.putalpha(alpha)
    return deck

def cast_shadow(deck,hero):
    # Flatten the upright figure into deck perspective, anchored below the shield.
    a,b,c,d,tx,ty=.65,.38,-.075,.23,60,1210
    det=a*d-b*c
    inverse=(d/det,-b/det,(b*ty-d*tx)/det,-c/det,a/det,(c*tx-a*ty)/det)
    shadow=hero.getchannel('A').transform(deck.size,Image.Transform.AFFINE,inverse,
        Image.Resampling.BICUBIC).filter(ImageFilter.GaussianBlur(2.2))
    shadow=ImageChops.multiply(shadow,deck.getchannel('A')).point(lambda v:round(v*.89))
    ink=Image.new('RGBA',deck.size,'#091019');ink.putalpha(shadow)
    deck.alpha_composite(ink)
