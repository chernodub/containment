"""Reduce supersampled figure plates into the native breach artwork."""
from pathlib import Path
import sys
import math
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
        # Shield brass reflects into the large side plane of the loaded arm.
        # Keep the feet in the hull's shadow so the bone brow leads the caste.
        w,h=source.size
        near=Image.new('L',source.size)
        ImageDraw.Draw(near).ellipse((.36*w,.58*h,.80*w,1.20*h),fill=225)
        near=near.filter(ImageFilter.GaussianBlur(w*.025))
        planes=source.convert('L').point(lambda v:58 if 55<v<140 else 0)
        bounce=ImageChops.multiply(near,planes)
        source.paste('#cb9955',(0,0,*source.size),ImageChops.multiply(bounce,source.getchannel('A')))
        feet=Image.new('L',source.size)
        ImageDraw.Draw(feet).rectangle((0,h*.72,w*.77,h),fill=240)
        horn=ImageChops.multiply(feet,source.convert('L').point(lambda v:255 if v>155 else 0))
        source.paste('#a7987b',(0,0,*source.size),ImageChops.multiply(horn,source.getchannel('A')))
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
layer=structure()
cast_shadow(layer,hero)
layer.alpha_composite(contacts())
place(layer,'crawler',1142,465,222,bank=-22)
place(layer,'stalker',824,650,205,bank=17)
layer.alpha_composite(left_return())
place(layer,'warden',895,814,720)
layer.save(raw/'midground.png')
