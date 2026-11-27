"""Choose the desktop title's full-width 460:215 store crop, retaining menu and paw."""
from pathlib import Path
import sys
from PIL import Image

def capsule(image):
    height=round(image.width*215/460)
    # Remove more unused ceiling than deck while protecting the helmet.
    top=round((image.height-height)*.61)
    return image.crop((0,top,image.width,top+height)).resize((460,215),Image.Resampling.LANCZOS)

if __name__=='__main__':
    capsule(Image.open(sys.argv[1]).convert('RGB')).save(Path(sys.argv[2]))
