"""Hull returns and landing deck in the perspective of the existing 640-wide stage."""
from PIL import Image, ImageDraw

def sheet():
    return Image.new('RGBA',(5120,2880))

def panel(image,points,colour):
    ImageDraw.Draw(image).polygon([(round(x*8),round(y*8)) for x,y in points],fill=colour)

def seam(image,points,colour,width):
    ImageDraw.Draw(image).line([(round(x*8),round(y*8)) for x,y in points],fill=colour,width=round(width*8))

def rivet(image,x,y,r=1.1):
    d=ImageDraw.Draw(image)
    for dy,colour in [(0,'#111d29'),(-.38,'#657982')]:
        d.ellipse(((x-r)*8,(y+dy-r*.45)*8,(x+r)*8,(y+dy+r*.45)*8),fill=colour)

def structure():
    deck=sheet()
    # Outer pressure collar continues under both figures. Its torn inner lip
    # rolls downward at the Warden's weight-bearing wrist.
    panel(deck,[(201,255),(217,266),(238,280),(308,284),(351,270),(420,278),
                (436,264),(513,275),(640,320),(640,360),(278,360),(247,330),(213,310)],'#202e39')
    panel(deck,[(206,270),(228,276),(306,283),(347,273),(410,279),(422,284),
                (368,301),(349,297),(338,302),(323,294),(308,296),(264,288),(222,282)],'#465560')
    seam(deck,[(206,270),(228,276),(306,283),(347,273),(411,280)],'#90a6b0',.8)
    panel(deck,[(222,282),(264,288),(308,296),(323,294),(338,302),(349,297),(368,301),
                (422,284),(414,297),(373,314),(354,310),(341,317),(327,304),(305,307),(259,298),(219,291)],'#19232d')
    seam(deck,[(222,282),(308,296),(323,294),(338,302),(349,297),(368,301)],'#84949b',1.15)
    panel(deck,[(323,294),(338,302),(341,317),(334,307),(326,303)],'#55656b')
    panel(deck,[(214,308),(260,305),(318,318),(306,331),(267,342)],'#2c3b46')
    panel(deck,[(272,350),(322,322),(338,325),(291,360),(277,360)],'#121d29')
    seam(deck,[(267,342),(305,322),(318,318)],'#50616b',1)
    panel(deck,[(341,317),(374,317),(439,291),(505,302),(417,337),(389,335),(348,350),(307,354)],'#34434b')
    seam(deck,[(348,350),(390,334),(417,336),(505,302)],'#50616a',.8)
    for x,y in [(242,282),(257,284),(369,294),(392,287),(290,319),(397,325),(481,307)]:
        rivet(deck,x,y)
    # Folded upper return, rooted in the right jamb beneath the crawler.
    panel(deck,[(288,149),(305,151),(326,149),(344,142),(382,139),(415,127),
                (417,133),(382,146),(346,149),(327,157),(299,157)],'#35434f')
    seam(deck,[(289,149),(306,152),(326,150),(345,143),(382,140),(415,128)],'#8296a2',.8)
    panel(deck,[(299,157),(327,157),(346,149),(382,146),(416,133),(404,145),(350,155),(330,162),(303,161)],'#1b2835')
    return deck.resize((2560,1440),Image.Resampling.LANCZOS)

def left_return():
    jamb=sheet()
    panel(jamb,[(207,195),(213,181),(223,171),(237,174),(234,185),(225,192),(218,207),(210,211)],'#273540')
    panel(jamb,[(214,182),(223,171),(237,174),(232,179),(222,179)],'#596977')
    seam(jamb,[(209,196),(215,181),(223,171),(236,174)],'#8ba2b2',.75)
    return jamb.resize((2560,1440),Image.Resampling.LANCZOS)

def contacts():
    shadow=sheet()
    for points in [[(222,285),(242,284),(269,287),(263,291),(232,291)],
                   [(296,290),(312,288),(337,294),(341,298),(323,297),(308,296)],
                   [(296,152),(305,150),(328,151),(325,154),(306,155)]]:
        panel(shadow,points,'#101b24')
    return shadow.resize((2560,1440),Image.Resampling.LANCZOS)
