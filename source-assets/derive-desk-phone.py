"""
Derive Rosario's desk telephone (public/studio/phone/*.webp) from the image
supplied for it (source-assets/desk-phone-reference.webp): the studio plate
with a cream and brass rotary telephone standing against the wall.

That image is the plate re-made around the telephone (its wall grain, light
patches and desk texture all differ slightly from that plate: source-assets/
desk-previous-plate.png, the studio before its three lights, see derive-desk-moods.py),
so it does not replace the plate: only the telephone is cut out of it, and
its shadow is carried over as a darkening, to be laid on the original plate.

  1. The telephone: segmented with GrabCut from a loose outline, the parts
     the colour model would lose (the thin brass cradle arms, the cord's wire
     and coils) drawn in as sure foreground, and the wall and desk seen
     between its parts (inside the cradle, around the cord, the photograph
     under its right foot) as sure background.
  2. Its edge: soft by less than a pixel, and each edge pixel takes the
     colour of the telephone just inside it (no wall showing at the rim).
  3. Two layers, so the handset can move: the handset (both bells, their arms
     and the handle), and the rest (body, dial, cradle, cord).
  4. Its grade: the supplied image is a little warmer than the plate; the
     telephone is brought to the plate's colour (measured on the wall and desk
     away from it, in both images).
  5. Its shadow: the supplied image over the plate, blurred (the grain of the
     two walls differs), as a multiplying layer: white where nothing changes,
     darker where the telephone shades the wall and the desk.

usage: python source-assets/derive-desk-phone.py
"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
REF = ROOT / "source-assets" / "desk-phone-reference.webp"
PLATE = ROOT / "source-assets" / "desk-previous-plate.png"
OUT = ROOT / "public" / "studio" / "phone"
OUT.mkdir(parents=True, exist_ok=True)

ref = np.asarray(Image.open(REF).convert("RGB")).astype(np.float64)
plate = np.asarray(Image.open(PLATE).convert("RGB")).astype(np.float64)
assert ref.shape == plate.shape, "the supplied image must be the plate's size"

# The telephone's box on the plate (px), and the shadow's.
X0, Y0, X1, Y1 = 1085, 245, 1425, 500
SX0, SY0, SX1, SY1 = 880, 232, 1430, 506

# 4. The plate's grade over the supplied image's, on wall and desk away from the telephone.
regions = [(100, 400, 200, 800), (550, 750, 300, 1000)]
corr = np.mean([plate[a:b, c:d].mean((0, 1)) / ref[a:b, c:d].mean((0, 1)) for a, b, c, d in regions], axis=0)

crop = ref[Y0:Y1, X0:X1]
H, W = crop.shape[:2]
P = lambda pts: np.array([[x - X0, y - Y0] for x, y in pts], np.int32)

# 1. Segmentation.
mask = np.full((H, W), cv2.GC_BGD, np.uint8)
outline = [(1108,300),(1110,265),(1128,254),(1150,253),(1175,255),(1195,252),(1285,253),(1305,262),(1330,268),(1348,275),(1370,283),(1384,292),(1388,335),(1402,372),(1414,418),(1420,452),(1408,471),(1378,474),(1352,468),(1342,472),(1334,494),(1292,498),(1200,492),(1112,480),(1096,470),(1094,440),(1112,418),(1150,372),(1176,343),(1180,330),(1110,328)]
cv2.fillPoly(mask, [P(outline)], cv2.GC_PR_FGD)
background = [
    [(1112,327),(1176,327),(1178,336),(1150,366),(1112,410),(1096,436),(1094,330)],   # left of the body, under the left bell
    [(1262,296),(1292,292),(1296,330),(1290,336),(1262,338)],                           # between the cradle post and the right bell
    [(1334,350),(1360,352),(1368,392),(1336,396)],                                        # right of the body, left of the cord
    [(1322,446),(1330,452),(1340,470),(1372,474),(1405,478),(1405,500),(1298,500),(1302,490),(1294,480),(1302,465)],  # desk and photo right of the base
    [(1192,313),(1223,313),(1221,334),(1190,336)],                                        # wall left of the cradle post
    [(1247,313),(1275,313),(1277,336),(1250,334)],                                        # wall right of the cradle post
    [(1180,290),(1194,292),(1196,300),(1182,300)],                                        # under the handle, left of the fork
    [(1193,291),(1276,291),(1276,299),(1245,301),(1222,301),(1193,299)],                  # the wall inside the cradle's U
    [(1363,304),(1367,304),(1367,340),(1363,344)],                                        # between the right bell and the cord's wire
    [(1340,348),(1364,348),(1365,398),(1340,402)],                                        # inside the cord's loop
]
for poly in background:
    cv2.fillPoly(mask, [P(poly)], cv2.GC_BGD)
for poly in [
    [(1150,440),(1300,430),(1310,470),(1140,470)],   # body front
    [(1175,360),(1240,350),(1250,410),(1180,415)],   # dial
    [(1200,262),(1272,262),(1272,282),(1200,282)],   # handle
    [(1122,285),(1170,285),(1170,315),(1122,315)],   # left bell
    [(1305,300),(1352,300),(1352,335),(1305,335)],   # right bell
    [(1218,312),(1250,312),(1250,345),(1218,345)],   # cradle post
    [(1374,360),(1392,360),(1396,420),(1380,422)],   # cord coils
]:
    cv2.fillPoly(mask, [P(poly)], cv2.GC_FGD)
thin = [
    ([(1186,266),(1187,284),(1192,296),(1202,304),(1219,309),(1233,310),(1250,309),(1267,307),(1278,300),(1282,287),(1283,270)], 5),  # cradle
    ([(1344,292),(1356,295),(1366,301),(1371,312),(1373,325),(1374,340)], 4),   # the cord's wire
    ([(1374,338),(1375,352),(1377,368),(1379,384),(1382,400)], 9),               # its coils, downwards
    ([(1400,405),(1370,407),(1345,410),(1333,414)], 11),                         # its lower loop, into the side
    ([(1338,446),(1360,452),(1385,455),(1402,448),(1407,430),(1400,410)], 11),
]
for pts, width in thin:
    cv2.polylines(mask, [P(pts)], False, cv2.GC_FGD, width)
bgd = np.zeros((1, 65)); fgd = np.zeros((1, 65))
cv2.grabCut(cv2.cvtColor(crop.astype(np.uint8), cv2.COLOR_RGB2BGR), mask, None, bgd, fgd, 10, cv2.GC_INIT_WITH_MASK)
fg = ((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD)).astype(np.uint8)
# The wall seen inside the cradle's U, under the handle (it shows once the handset is lifted).
cv2.fillPoly(fg, [P([(1193,292),(1277,292),(1277,300),(1262,303),(1206,303),(1193,300)])], 0)
n, lab, stats, _ = cv2.connectedComponentsWithStats(fg)
fg = (lab == 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])).astype(np.uint8)

# 2. A soft edge, less than a pixel wide, its faintest part tightened; edge colours from just inside.
alpha = cv2.GaussianBlur(fg.astype(np.float64), (0, 0), 0.75)
alpha = np.clip((alpha - 0.12) / 0.88, 0, 1)
inside = (alpha > 0.98).astype(np.float64)
num = cv2.GaussianBlur(crop * inside[..., None], (0, 0), 1.6)
den = cv2.GaussianBlur(inside, (0, 0), 1.6)[..., None]
rim = np.where(den > 1e-3, num / np.maximum(den, 1e-3), crop)
colour = np.where((alpha < 0.98)[..., None], rim, crop) * corr
colour = np.clip(colour, 0, 255)

# 3. The handset: both bells, their arms and the handle (the cradle and the cord stay with the body).
handset = np.zeros((H, W), np.uint8)
cv2.fillPoly(handset, [P([(1104,256),(1195,249),(1290,249),(1340,261),(1352,274),(1362,288),(1364,352),(1289,352),(1288,294),(1196,294),(1181,299),(1182,330),(1104,330)])], 1)
cv2.polylines(handset, [P([(1344,292),(1356,295),(1366,301)])], False, 1, 5)   # the wire where it leaves the bell
hs = cv2.GaussianBlur(handset.astype(np.float64), (0, 0), 0.6)

def save(name, a):
    rgba = np.dstack([colour, np.clip(a, 0, 1) * 255]).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(OUT / name, lossless=False, quality=92, method=6)
    print(name, rgba.shape[1], "x", rgba.shape[0], (OUT / name).stat().st_size // 1024, "KB")

save("phone-body.webp", alpha * (1 - hs))
save("phone-handset.webp", alpha * hs)

# 5. The shadow: how much darker the supplied image is than the plate around the telephone.
def lum(img):
    return img @ np.array([0.2126, 0.7152, 0.0722])
refC = np.clip(ref * corr, 0, 255)
ratio = cv2.GaussianBlur(lum(refC), (0, 0), 6) / np.maximum(cv2.GaussianBlur(lum(plate), (0, 0), 6), 1)
ratio = ratio[SY0:SY1, SX0:SX1]
# Under the telephone itself the ratio means nothing: carried in from around it.
under = np.zeros(ratio.shape, np.uint8)
under[Y0 - SY0:Y1 - SY0, X0 - SX0:X1 - SX0] = cv2.dilate(fg, np.ones((7, 7), np.uint8))
ratio = cv2.inpaint(np.clip(ratio * 255, 0, 255).astype(np.uint8), under, 9, cv2.INPAINT_TELEA).astype(np.float64) / 255
# Only real shade: the grain's noise (a few percent either way) is not shadow.
shade = np.clip(1 - ratio - 0.035, 0, 0.6)
shade = cv2.GaussianBlur(shade, (0, 0), 2.5)
# Faded out towards the box's edges (the two images' own light differs further away).
hh, ww = shade.shape
fx = np.minimum(np.arange(ww) / 70, (ww - 1 - np.arange(ww)) / 26).clip(0, 1)
fy = np.minimum(np.arange(hh) / 26, (hh - 1 - np.arange(hh)) / 12).clip(0, 1)
shade = shade * np.outer(fy, fx)
mult = (1 - shade) * 255
# A multiplying layer: the wall's own warm shade rather than grey (the shadow's colour in the supplied image).
tint = np.array([1.0, 0.97, 0.93])
rgb = np.clip(255 - (255 - mult)[..., None] * (2 - tint), 0, 255).astype(np.uint8)
Image.fromarray(rgb, "RGB").save(OUT / "phone-shadow.webp", quality=90, method=6)
print("phone-shadow.webp", ww, "x", hh, (OUT / "phone-shadow.webp").stat().st_size // 1024, "KB", "deepest", round(float(shade.max()), 3))
print("grade", np.round(corr, 4), "crop", (X0, Y0, X1, Y1), "shadow", (SX0, SY0, SX1, SY1))
