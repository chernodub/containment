"""Reduce supersampled figure plates into the native breach artwork."""
from pathlib import Path
import sys
import math
from PIL import Image,ImageDraw,ImageFilter,ImageChops,ImageOps
from ink_contour import contour
from title34_light import cast_shadow, light_deck
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
        # The distant light unifies the dorsal shell, sail and limbs in shadow.
        # Reserve the bone value for the head only. The plate boundaries retain
        # their source ink on the two warm body values.
        w,h=source.size
        value=source.convert('L')
        alpha=source.getchannel('A')
        paint=Image.new('RGB',source.size,'#302626')
        all_pixels=(0,0,w,h)
        paint.paste('#734939',all_pixels,value.point(lambda v:255 if v>72 else 0))
        paint.paste('#18171c',all_pixels,value.point(lambda v:255 if v<35 else 0))
        # Keep a fine ink break at the root of each sail plate even though
        # the sail and the lit shell now share the same warm pigment.
        sail=Image.new('L',source.size)
        ImageDraw.Draw(sail).rectangle((0,0,.59*w,.44*h),fill=255)
        sail=ImageChops.multiply(sail,value.point(lambda v:255 if v>148 else 0))
        offset=max(1,round(w*.0045))
        root=ImageChops.subtract(sail,sail.crop((0,offset,w,h+offset)))
        paint.paste('#211a1c',all_pixels,root)
        head=Image.new('L',source.size)
        ImageDraw.Draw(head).rectangle((.59*w,.20*h,w,.81*h),fill=255)
        bone=ImageChops.multiply(head,value.point(lambda v:255 if v>153 else 0))
        paint.paste('#cbbb9e',all_pixels,bone)
        # A little reflected brass along the loaded arm, inside the warm step.
        near=Image.new('L',source.size)
        ImageDraw.Draw(near).polygon([(.44*w,.64*h),(.50*w,.72*h),(.66*w,.86*h),
                                     (.61*w,.86*h),(.47*w,.75*h)],fill=84)
        paint.paste('#b27f49',all_pixels,ImageChops.multiply(near,value.point(lambda v:255 if v>60 else 0)))
        source=paint.convert('RGBA')
        source.putalpha(alpha)
        # Set the luminous organ behind the prow and above the lower jaw.
        throat=ImageChops.offset(organ,-round(source.width*.049),round(source.width*.027))
        source.paste('#a65833',(0,0,*source.size),throat)
        inset=ImageChops.multiply(throat,ImageChops.offset(throat,-round(source.width*.011),round(source.width*.006)))
        source.paste('#efa155',(0,0,*source.size),inset)
    if name=='crawler':
        # Only the fine outer rim breaks the dark mass of the upper jamb.
        alpha=source.getchannel('A')
        source=ImageOps.colorize(source.convert('L'),'#090c11','#805836')
        source.putalpha(alpha)
    # A narrow hard highlight on the inner edge matches the side facing the
    # aperture. Retain a separate outer ink stroke after the highlight.
    alpha=source.getchannel('A')
    dx=round(source.width*(.009 if name in ("warden","breacher") else .005))
    inward=alpha.crop((dx,-dx,alpha.width+dx,alpha.height-dx))
    rim=ImageChops.subtract(alpha,inward).point(lambda a:round(a*(.82 if name=="crawler" else .95)))
    source.paste('#c0dce3',(0,0,*source.size),rim)
    source.putalpha(alpha)
    if name=='warden':
        # Curl the contact side of the near digits around the broken lip.
        # Inverse-map a local patch of the supersampled matte, leaving the wrist anchored.
        w,h=source.size
        source=ImageOps.expand(source,border=(0,0,0,round(h*.08)))
        def knuckle(x,y):
            reach=math.exp(-((x/w-.694)/.085)**4)
            contact=max(0,min(1,(y/h-.845)/.14))
            return x,y-h*.053*reach*contact
        grid=[]
        step=max(12,w//48)
        for y0 in range(0,source.height,step):
            for x0 in range(0,w,step):
                x1,y1=min(w,x0+step),min(source.height,y0+step)
                corners=(knuckle(x0,y0),knuckle(x0,y1),knuckle(x1,y1),knuckle(x1,y0))
                grid.append(((x0,y0,x1,y1),tuple(v for pair in corners for v in pair)))
        source=source.transform(source.size,Image.Transform.MESH,grid,Image.Resampling.BICUBIC)
    weight=max(2,round(source.width*.003))
    outlined=contour(source,weight)
    scale=extent/(outlined.height if vertical else outlined.width)
    plate=outlined.resize((round(outlined.width*scale),round(outlined.height*scale)),Image.Resampling.LANCZOS)
    layer.alpha_composite(plate,(x,y))

hero=Image.new('RGBA',size)
place(hero,'breacher',1525,358,1330,vertical=True)
hero.save(raw/'hero.png')
layer=light_deck(structure())
cast_shadow(layer,hero)
layer.alpha_composite(contacts())
place(layer,'crawler',1142,465,222,bank=-22)
place(layer,'stalker',824,650,205,bank=17)
layer.alpha_composite(left_return())
place(layer,'warden',895,814,720)
layer.save(raw/'midground.png')
