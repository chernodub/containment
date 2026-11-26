"""Reduce supersampled figure plates into the native breach artwork."""
from pathlib import Path
import sys
from PIL import Image,ImageDraw,ImageFilter,ImageChops,ImageOps
from ink_contour import contour
from title34_light import cast_shadow
from title34_hull import structure, left_return, contacts

raw=Path(sys.argv[1])
size=(2560,1440)
def fair_bands(source,radius):
    # A majority filter on ink coverage fairs the triangulated atlas boundaries.
    # Decide the winning colour at master resolution, then antialias on reduction.
    rgb=source.convert('RGB')
    palette=rgb.quantize(colors=28,method=Image.Quantize.MEDIANCUT)
    best=Image.new('L',source.size)
    paint=rgb.copy()
    for _,index in sorted(palette.getcolors(),reverse=True):
        mask=palette.point([255 if i==index else 0 for i in range(256)],'L')
        coverage=mask.filter(ImageFilter.GaussianBlur(radius))
        wins=ImageChops.subtract(coverage,best).point(lambda a:255 if a else 0)
        colour=tuple(palette.getpalette()[3*index:3*index+3])
        paint.paste(colour,(0,0,*source.size),wins)
        best=ImageChops.lighter(best,coverage)
    paint.putalpha(source.getchannel('A'))
    return paint

def place(layer,name,x,y,extent,vertical=False,bank=0):
    source=Image.open(raw/(name+'.png')).convert('RGBA')
    if bank:
        source=source.rotate(bank,Image.Resampling.BICUBIC,expand=True)
    source=source.crop(source.getchannel('A').getbbox())
    if name=='warden':
        hot=source.getchannel('R').point(lambda x:255 if x>242 else 0)
        hot=ImageChops.multiply(hot,source.getchannel('B').point(lambda x:255 if x<140 else 0))
        organ=ImageChops.multiply(hot,source.getchannel('A')).filter(
            ImageFilter.GaussianBlur(source.width*.009)).point(lambda v:max(0,min(255,(v-108)*12)))
    if name=='breacher':
        source=source.filter(ImageFilter.MedianFilter(3))
    else:
        source=fair_bands(source,source.width*(.006 if name=='warden' else .004))
    if name=='stalker':
        # A cool carapace frames the glacial mark even on the unlit flank.
        blue=ImageChops.subtract(source.getchannel('B'),source.getchannel('R'))
        mark=blue.point(lambda a:min(255,max(0,(a-20)*10)))
        ice=ImageOps.colorize(source.convert('L'),'#141c26','#849cae').convert('RGBA')
        ice.paste('#9de6f2',(0,0,*source.size),mark)
        ice.putalpha(source.getchannel('A'))
        source=ice
    if name=='warden':
        # Set the luminous organ behind the prow and above the lower jaw.
        throat=ImageChops.offset(organ,-round(source.width*.049),round(source.width*.027))
        source.paste('#a65833',(0,0,*source.size),throat)
        inset=ImageChops.multiply(throat,ImageChops.offset(throat,-round(source.width*.011),round(source.width*.006)))
        source.paste('#efa155',(0,0,*source.size),inset)
    # A narrow hard highlight on the inner edge matches the side facing the
    # aperture. Retain a separate outer ink stroke after the highlight.
    alpha=source.getchannel('A')
    dx=round(source.width*.005)
    inward=alpha.crop((dx,-dx,alpha.width+dx,alpha.height-dx))
    rim=ImageChops.subtract(alpha,inward).point(lambda a:round(a*.78))
    source.paste('#b6dbe6',(0,0,*source.size),rim)
    source.putalpha(alpha)
    weight=max(2,round(source.width*.003))
    outlined=contour(source,weight)
    scale=extent/(outlined.height if vertical else outlined.width)
    plate=outlined.resize((round(outlined.width*scale),round(outlined.height*scale)),Image.Resampling.LANCZOS)
    layer.alpha_composite(plate,(x,y))

hero=Image.new('RGBA',size)
place(hero,'breacher',1525,358,1330,vertical=True)
hero.save(raw/'hero.png')
layer=structure()
cast_shadow(layer,hero)
layer.alpha_composite(contacts())
place(layer,'crawler',1142,465,222,bank=-22)
place(layer,'stalker',824,650,205,bank=17)
layer.alpha_composite(left_return())
place(layer,'warden',895,814,720)
layer.save(raw/'midground.png')
