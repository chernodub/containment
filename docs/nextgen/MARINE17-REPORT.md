# MARINE17 marine integration

The K12 game atlas uses a smoked visor with a narrow emissive strip and graphite across the upper-arm and pectoral surfaces that meet behind the weapon. The large 07 cap and its adjoining lames carry the main rig colour. The crown stripe and upward faces on the largest pack modules carry the accents. Pyro retains its right-side cap. The weapon's neutral top highlight replaces the rig-coloured receiver band. The marine's diffuse and specular response reduces incident light colour, and the authored paint mask supplies the rig hue.

The pale composite edge on the marine is gone. Classified scene depth gates the silhouette against foreground scenery and hostile bodies. The overlay uses the cutaway's projected marine bounds for a cropped opaque-color snapshot. The corresponding pixels in the final scene color reveal actual transparent coverage over the visible suit, including smoke that darkens the suit. Depth and color thresholds feather the edge. The ordinary dark contour and the locator still provide shape and facing cues.

The selector and death card share the same four studio subjects. The studio uses a softer rig-coloured rim and a lower front key. The opaque portion of each 640 px figure spans 90.2% for Breacher, 90.3% for Cryo, 90.2% for Pyro and 91.7% for Arc. The weapon partly hides the large shoulder in the ready poses, especially on Cryo and Arc.

## Asset build

Blender regenerated the K12 atlas. Meshopt, Khronos KTX 4.4.2 and the existing index-only LOD tool packed the main and plain GLBs. All five full-detail meshes and their shadow LODs matched their original triangle counts in both shipped files. The shoulder-mask refinement reused the freshly baked maps after checking that every indexed triangle had identical UV coordinates. Git showed changes only to the two marine GLBs among model assets.

## Limits

The room's cutaway resolves before the silhouette sees depth. The outline uses the resulting depth at each pixel, with the cutaway's projection supplying the crop. The fade follows the depth difference and the blended effect strength. The opaque-color crop runs on High. On Low, classified depth supports solid cover when ink is enabled.

## Desktop review

The native 1920×1080 capture batch wrote 33 verified PNGs on Apple M1 Pro ANGLE/Metal. The review uses the lighter Communal Atrium, the darker Armory, an Armory heavy fight, and the eight-frame Cryo overlap in the Atrium. The reference frames in the pairs come from Final10. The studio pairs use the previous shipped portraits. [Capture gallery](../../artifacts/nextgen/marine17/capture/index.html) · [Native colour and greyscale figure detail](../../artifacts/nextgen/marine17/review/native-figure-detail.png) · [Cryo overlap before and after](../../artifacts/nextgen/marine17/review/cryo-overlap-4-before-after.png)

| Rig | Atrium hue coverage | Armory hue coverage | 480×270 review |
| --- | ---: | ---: | --- |
| Breacher | 3.2% | 3.2% | [Colour](../../artifacts/nextgen/marine17/review/breacher-480-colour.png) · [Grey](../../artifacts/nextgen/marine17/review/breacher-480-grey.png) · [Title to play](../../artifacts/nextgen/marine17/review/breacher-title-selector-play.png) · [Portrait pair](../../artifacts/nextgen/marine17/review/breacher-portrait-before-after.png) |
| Cryo | 3.3% | 20.8% | [Colour](../../artifacts/nextgen/marine17/review/cryo-480-colour.png) · [Grey](../../artifacts/nextgen/marine17/review/cryo-480-grey.png) · [Title to play](../../artifacts/nextgen/marine17/review/cryo-title-selector-play.png) · [Portrait pair](../../artifacts/nextgen/marine17/review/cryo-portrait-before-after.png) |
| Pyro | 5.9% | 5.8% | [Colour](../../artifacts/nextgen/marine17/review/pyro-480-colour.png) · [Grey](../../artifacts/nextgen/marine17/review/pyro-480-grey.png) · [Title to play](../../artifacts/nextgen/marine17/review/pyro-title-selector-play.png) · [Portrait pair](../../artifacts/nextgen/marine17/review/pyro-portrait-before-after.png) |
| Arc | 2.4% | 1.6% | [Colour](../../artifacts/nextgen/marine17/review/arc-480-colour.png) · [Grey](../../artifacts/nextgen/marine17/review/arc-480-grey.png) · [Title to play](../../artifacts/nextgen/marine17/review/arc-title-selector-play.png) · [Portrait pair](../../artifacts/nextgen/marine17/review/arc-portrait-before-after.png) |

The SHADE15 tool estimates hue coverage with a bounding-box floor rejection heuristic. Cryo's Armory count includes blue-lit deck pixels inside the box. The armour and receiver remain separated in the Cryo overlap, with ice-blue accents and near-neutral plate faces. The quiet 480×270 frames preserve the profile visor and gun break. The steep fight angle often hides the visor, and the shoulder can read as a crown or pack accent on rigs with the left cap. Pyro's shoulder reads most consistently. The marine's light plates carry its shape in greyscale, while outlined enemies and blade tips can be brighter in heavy combat. The marine is therefore easiest to follow in calm conditions and can lose first read in the heavy frames. [Raw coverage receipt](../../artifacts/nextgen/marine17/coverage.txt)
