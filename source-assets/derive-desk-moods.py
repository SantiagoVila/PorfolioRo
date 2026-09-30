"""
Derive Rosario's studio in its three lights (public/studio/moods/<mood>/*)
from the photographs supplied for it (source-assets/desk-moods/<mood>.png):
the same clean desk, wall and window by day, at sunset and at night, pixel
for pixel (the lamp, tray and Pantone chip stand in the same place in all
three). They carry none of the site's own things (cap, work, telephone,
lettering): those are laid over them in code.

For each light:

  1. desk.webp: the photograph itself (1672×941, the stage), its top rows
     softened a little towards the edge (see soften_top).
  2. wall-above.webp: the wall continued above the photograph, for the
     framings that look up it (the intro, phones held upright). The window's
     light falls on the wall in long bands rising to the right: just above
     the photograph each band is carried on along its own direction, and the
     further up, the more it softens into the wall's own tone (a little
     deeper towards the ceiling). The lamp's rod and the window's frame at
     the two ends are carried straight up. The plaster's grain, taken from the
     photograph's own wall, runs over all of it.
  3. light.webp: the light falling on the wall and the desk, as a multiplier:
     the photograph over the wall's paint and the desk's terrazzo in full
     daylight, softened (no plaster grain, no chips). The work lying on the
     desk takes it (see components/Studio/deskLight), so the window's bands
     and the leaves' shadows fall on the covers as they fall on the desk, and
     at night the lamp's pool.

usage: python source-assets/derive-desk-moods.py
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "source-assets" / "desk-moods"
OUT = ROOT / "public" / "studio" / "moods"

MOODS = ["day", "sunset", "night"]
W, H = 1672, 941
ABOVE = 1000  # height of the wall continued above the photograph (stage px)

# The window's bands of light on the wall rise to the right (measured on the day
# photograph's wall: the pattern's dominant orientation, 26° above horizontal).
BAND = np.array([0.9, -0.44])
BAND /= np.linalg.norm(BAND)
SLOPE = BAND[0] / -BAND[1]  # px to the left per px down, following a band

# Columns carried straight up: the lamp's rod (left) and the window (right).
ROD = (0, 72)
WINDOW = 1538
# The shadow of the window's mullion falls on the wall as a vertical bar (by day and at sunset): carried up too.
MULLION = (1046, 1090)
# Right of here the window's light on the wall is the leaves' shadows (blobs, not bands): mirrored upwards.
LEAVES = 1000

# The wall's paint in full daylight (the day photograph's lit wall, 95th percentile), and the desk's
# terrazzo in full daylight (its lit top, softened past its chips, 95th percentile): what each is when lit.
PAINT = np.array([253.0, 240.0, 226.0])
DESK = np.array([252.0, 231.0, 206.0])

# At night the lamp lights one end of the wall and the window's blue the other: the prints take that
# light evened out a little (a gamma on the multiplier), so the far ones stay legible, not black.
LIGHT_GAMMA = {"day": 1.0, "sunset": 1.0, "night": 0.85}

# Where the plaster's grain is measured: open wall, no chip, no lamp (day photograph).
GRAIN_BOX = (430, 30, 1000, 470)  # x0, y0, x1, y1


def load(mood):
    a = np.asarray(Image.open(SRC / f"{mood}.png").convert("RGB")).astype(np.float64)
    assert a.shape == (H, W, 3), f"{mood}: expected {W}×{H}"
    return a


def grain():
    """
    The plaster's fine grain (zero-mean, relative to the wall's brightness) for the wall above: noise at
    the grain's two scales, as strong as the photograph's own (measured on its open wall). Synthesised
    rather than tiled from the photograph: its grain carries the edges of the light's bands, which repeat
    visibly when tiled.
    """
    day = load("day")
    x0, y0, x1, y1 = GRAIN_BOX
    L = day[y0:y1, x0:x1].mean(2)
    measured = (L - ndimage.gaussian_filter(L, 2.2)).std() / L.mean()
    rng = np.random.default_rng(7)
    n = ndimage.gaussian_filter(rng.standard_normal((ABOVE, W)), 0.7) + 0.6 * ndimage.gaussian_filter(rng.standard_normal((ABOVE, W)), 1.8)
    n -= ndimage.gaussian_filter(n, 2.2)  # the same band as measured
    return n * (measured / n.std())


# The photograph's top rows are softened a little, more towards its edge, so the light's pattern (the
# leaves' shadows most) dissolves on its way up into the wall above instead of stopping at a line.
SOFT_ROWS = 110
SOFT_EDGE = 6.0


def soften_top(plate):
    out = plate.copy()
    levels = [0.0, 1.0, 2.2, 3.8, SOFT_EDGE]
    top = plate[: SOFT_ROWS + 40]
    blurred = [top if s == 0 else np.stack([ndimage.gaussian_filter(top[:, :, c], s) for c in range(3)], -1) for s in levels]
    for y in range(SOFT_ROWS):
        sig = SOFT_EDGE * (1 - y / SOFT_ROWS) ** 1.6
        i = max(0, min(len(levels) - 2, int(np.searchsorted(levels, sig) - 1)))
        t = (sig - levels[i]) / (levels[i + 1] - levels[i])
        out[y] = blurred[i][y] * (1 - t) + blurred[i + 1][y] * t
    # Not the lamp's rod nor the window, which carry on up sharp.
    out[:, : ROD[1] + 10] = plate[:, : ROD[1] + 10]
    out[:, WINDOW - 16 :] = plate[:, WINDOW - 16 :]
    return out


def wall_above(plate, g):
    sharp = plate
    plate = soften_top(plate)
    d = np.arange(ABOVE, 0, -1, dtype=np.float64)[:, None]  # distance above the photograph, px (row 0 = highest)
    xs = np.arange(W, dtype=np.float64)[None, :]

    # a) Each band carried on along its direction, read from the photograph's own top rows (so the
    #    grain and the bands run on without a seam): the point d px above the edge lies on the same band
    #    as the point y' px below it, SLOPE·(d + y') to the left. Softened the further up (a growing
    #    horizontal blur), and fading into (b).
    band_rows = 80
    y_src = np.minimum(d, band_rows).astype(int)[:, 0]
    x_src = xs - SLOPE * (d + y_src[:, None])
    levels = [0, 5, 12, 26, 55, 110, 200]
    rows = plate[:band_rows + 1]
    blurred = [rows if s == 0 else ndimage.gaussian_filter1d(rows, s, axis=1, mode="nearest") for s in levels]
    # (from the softened edge's own blur, and gently at first)
    sig = np.clip(SOFT_EDGE + 0.004 * d**2, 0, levels[-1])
    xi = np.clip(x_src, 0, W - 1)
    x0 = np.floor(xi).astype(int)
    x1 = np.minimum(x0 + 1, W - 1)
    fx = (xi - x0)[..., None]
    def sample(level):
        r = blurred[level][y_src]  # (ABOVE, W, 3), each row its source row
        ii = np.arange(ABOVE)[:, None]
        return r[ii, x0] * (1 - fx) + r[ii, x1] * fx
    carried = np.zeros((ABOVE, W, 3))
    for i in range(len(levels) - 1):
        lo, hi = levels[i], levels[i + 1]
        m = (sig >= lo) & (sig <= hi)
        if not m.any():
            continue
        t = np.where(m, (sig - lo) / (hi - lo), 0)[..., None]
        carried = np.where(m[..., None], sample(i) * (1 - t) + sample(i + 1) * t, carried)

    # b) The wall's own tone, from the top edge's broad colour, a little deeper towards the ceiling.
    top = sharp[:4].mean(0)
    broad = np.stack([ndimage.gaussian_filter1d(top[:, c], 260, mode="nearest") for c in range(3)], 1)[None]
    deepen = 1 - 0.1 * np.clip(d / ABOVE, 0, 1) ** 1.2
    tone = broad * deepen[..., None]

    # Past the photograph's left edge a band has no source: the wall's tone there, softly.
    valid = np.clip((x_src + 160) / 320, 0, 1)[..., None]
    keep = np.exp(-d / 260)[..., None] * valid
    wall = carried * keep + tone * (1 - keep)

    # c) Where the leaves' shadows fall, the photograph's own top rows mirrored upwards instead (their
    #    shapes carry on as themselves, not smeared along the bands), softening and fading out.
    mir_rows = 130
    mir = plate[:mir_rows]
    mlevels = [0.0, 3.0, 7.0, 12.0]
    mb = [mir if s_ == 0 else np.stack([ndimage.gaussian_filter(mir[:, :, c], s_) for c in range(3)], -1) for s_ in mlevels]
    dd = d[:, 0]
    src = np.clip(dd - 1, 0, mir_rows - 1).astype(int)
    sigm = np.clip(dd * 0.1, 0, mlevels[-1])
    mirrored = np.zeros((ABOVE, W, 3))
    for i in range(len(mlevels) - 1):
        lo, hi = mlevels[i], mlevels[i + 1]
        m = (sigm >= lo) & (sigm <= hi)
        if not m.any():
            continue
        tt = ((sigm[m] - lo) / (hi - lo))[:, None, None]
        mirrored[m] = mb[i][src[m]] * (1 - tt) + mb[i + 1][src[m]] * tt
    kmir = (np.clip(1 - dd / 120, 0, 1) ** 1.3)[:, None, None]
    region = np.clip((np.arange(W) - LEAVES) / 60, 0, 1)[None, :, None]
    wmir = kmir * region
    wall = wall * (1 - wmir) + mirrored * wmir

    # The mullion's shadow: its darkness against the wall around it, carried straight up and fading.
    edge_row = plate[:3].mean(0)
    around = np.stack([ndimage.gaussian_filter1d(edge_row[:, c], 40, mode="nearest") for c in range(3)], 1)
    delta = np.minimum(edge_row - around, 0)  # only where it is darker
    x0m, x1m = MULLION
    for x in range(x0m - 14, x1m + 14):
        w = np.clip(min(x - (x0m - 14), (x1m + 14) - x) / 14, 0, 1)
        # (beyond the mirrored rows, which carry it themselves)
        wall[:, x] += delta[x][None, :] * w * np.exp(-d / 230) * (1 - kmir[:, 0])

    # The plaster's grain, in this light, where the carried rows (which bring their own) have softened.
    L = wall.mean(2, keepdims=True)
    wall = wall + g[..., None] * L * 0.9 * (1 - np.exp(-d / 30))[..., None]

    # The lamp's rod: straight up, into the wall's tone towards the ceiling.
    rod = np.repeat(top[None, ROD[0]:ROD[1]], ABOVE, 0) + g[:, ROD[0]:ROD[1], None] * top[None, ROD[0]:ROD[1]].mean(-1, keepdims=True) * 0.9
    rk = np.clip(1 - d / 900, 0, 1)[..., None]
    rod = rod * rk + wall[:, ROD[0]:ROD[1]] * (1 - rk)
    for x in range(ROD[0], ROD[1]):
        t = np.clip((x - (ROD[1] - 12)) / 12, 0, 1)  # its last columns blend into the wall
        wall[:, x] = rod[:, x - ROD[0]] * (1 - t) + wall[:, x] * t

    # The window: its frame and panes carry on up (the photograph's window mirrored, repeating).
    win_rows = sharp[:470, WINDOW - 16:]
    # (to and fro: d px above the edge is the photograph's row d − 1, then back down, and so on)
    period = np.concatenate([win_rows, win_rows[::-1]], 0)
    r = (np.arange(ABOVE)[::-1]) % period.shape[0]
    win = period[r]
    for j in range(win.shape[1]):
        t = np.clip(j / 16, 0, 1)
        wall[:, WINDOW - 16 + j] = win[:, j] * t + wall[:, WINDOW - 16 + j] * (1 - t)
    return np.clip(wall, 0, 255)


def light(plate, gamma=1.0):
    """
    The light falling on the wall and on the desk, as a multiplier of each in full daylight (the wall's paint,
    the desk's terrazzo), at a quarter of the stage's size: what the work takes where it lies.
    """
    soft = np.stack([ndimage.gaussian_filter(plate[:, :, c], 3.5) for c in range(3)], -1)
    wall = np.clip((528 - np.arange(H)) / 16, 0, 1)[:, None, None]  # the wall down to its foot (y 520), then the desk
    m = np.clip(soft / (PAINT * wall + DESK * (1 - wall)), 0, 1) ** gamma
    small = Image.fromarray(np.clip(m * 255, 0, 255).astype(np.uint8)).resize((W // 4, round(H / 4)), Image.LANCZOS)
    return small


def main():
    g = grain()
    for mood in MOODS:
        plate = load(mood)
        out = OUT / mood
        out.mkdir(parents=True, exist_ok=True)
        Image.fromarray(np.clip(soften_top(plate), 0, 255).astype(np.uint8)).save(out / "desk.webp", quality=88, method=6)
        Image.fromarray(wall_above(plate, g).astype(np.uint8)).save(out / "wall-above.webp", quality=82, method=6)
        # (Nowhere is the wall lit beyond its paint in full daylight, so the multiplier fits 0–1.)
        light(plate, LIGHT_GAMMA[mood]).save(out / "light.webp", quality=90, method=6)
        print(mood, "done")


if __name__ == "__main__":
    main()
