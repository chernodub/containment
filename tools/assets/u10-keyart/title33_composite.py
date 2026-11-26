"""Reduce supersampled figure plates into the native breach artwork."""
from pathlib import Path
import sys
from PIL import Image,ImageDraw,ImageFilter,ImageChops,ImageOps
from ink_contour import contour

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
        source.paste('#ffb961',(0,0,*source.size),inset)
    # A narrow hard highlight on the inner edge matches the side facing the
    # aperture. Retain a separate outer ink stroke after the highlight.
    alpha=source.getchannel('A')
    dx=round(source.width*.005)
    inward=alpha.crop((-dx,-dx,alpha.width-dx,alpha.height-dx))
    rim=ImageChops.subtract(alpha,inward).point(lambda a:round(a*.78))
    source.paste('#b4d1df',(0,0,*source.size),rim)
    source.putalpha(alpha)
    if name=='warden':
        # Catch the two near knuckles over the sill. Anchor the keratin tips
        # to the visible lower outline so a change of mesh moves the contact.
        w,h=source.size
        source=ImageOps.expand(source,border=(0,0,0,round(h*.06)))
        pen=ImageDraw.Draw(source)
        for fraction in (.595,.666):
            tip_x=round(w*fraction)
            column=alpha.crop((tip_x,0,tip_x+1,h)).getbbox()
            if column:
                tip_y=column[3]-round(h*.024)
                claw=[(tip_x-w*.017,tip_y-h*.015),(tip_x+w*.009,tip_y-h*.016),
                      (tip_x+w*.029,tip_y+h*.004),(tip_x+w*.035,tip_y+h*.052),(tip_x+w*.012,tip_y+h*.028)]
                pen.polygon(claw,fill='#6e6968',outline='#20232b',width=max(1,w//400))
                pen.line(claw[1:3],fill='#aac0c8',width=max(1,w//380))
    weight=max(2,round(source.width*.003))
    outlined=contour(source,weight)
    scale=extent/(outlined.height if vertical else outlined.width)
    plate=outlined.resize((round(outlined.width*scale),round(outlined.height*scale)),Image.Resampling.LANCZOS)
    layer.alpha_composite(plate,(x,y))

layer=Image.new('RGBA',size)
# The broken sill recedes toward the hind foot. The forward knuckles cross
# its leading edge, with the exposed cut of the plate visible below the hand.
sill=Image.new('RGBA',(1600,440))
d=ImageDraw.Draw(sill)
def facet(coords,fill):
    d.polygon([(2*(x-850),2*(y-1090-max(0,x-1010)*.045)) for x,y in coords],fill=fill)
facet([(902,1140),(1036,1125),(1490,1194),(1580,1227),(1514,1250),(987,1182)],'#293345')
facet([(902,1140),(987,1182),(1514,1250),(1494,1281),(1360,1252),(1316,1258),(974,1203)],'#151d2c')
facet([(902,1140),(987,1176),(1514,1244),(1514,1250),(987,1182)],'#647795')
facet([(1045,1148),(1094,1153),(1382,1208),(1354,1206)],'#435168')
layer.alpha_composite(sill.resize((800,220),Image.Resampling.LANCZOS),(820,1082))
place(layer,'warden',895,814,720)
place(layer,'crawler',1130,487,222,bank=-24)
place(layer,'stalker',898,679,196,bank=20)
layer.save(raw/'midground.png')
layer=Image.new('RGBA',size)
place(layer,'breacher',1525,358,1330,vertical=True)
layer.save(raw/'hero.png')
