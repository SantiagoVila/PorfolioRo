"""
Derive the cap's display frames (public/frames-clean) from the original,
real frames (source-assets/cap-frames). No generated or invented pixels:
every opaque pixel of the cap is the original photograph's.

The originals were shot on a white studio floor: their cutout keeps the
floor under the cap (a pale disc with the shadow in it) and a thin white
matte around the whole silhouette. public/frames-grounded replaced the floor
with a transparent shadow, but its colour key also removed parts of the cap
(grey tones of the face print, the dark inside seen through the back
opening, the brim's lower edge): holes that let the page show through.

Here, per frame:
  1. The cap: every pixel of the original that is not the floor. The floor
     is found as light, neutral pixels below the cap's lower edge, or seen
     through the head opening (light and neutral, inside the silhouette).
  2. Its edge: the white matte is removed from the colour of the edge pixels
     (each takes the colour of the cap just inside it), and the faintest
     edge alpha is tightened, so no pale or tinted rim shows on any colour.
  3. The shadow: public/frames-grounded's soft contact shadow, where the
     floor was (a transparent, darkening shadow that works on any surface).

usage: python source-assets/derive-clean-frames.py
"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "source-assets" / "cap-frames"
SHADOW = ROOT / "public" / "frames-grounded"
OUT = ROOT / "public" / "frames-clean"
OUT.mkdir(exist_ok=True)

N = 92


def rgba(p: Path) -> np.ndarray:
    return np.array(Image.open(p).convert("RGBA")).astype(np.float32)


def derive(i: int) -> tuple[np.ndarray, dict]:
    o = rgba(SRC / f"frame-{i:02d}.webp")
    g = rgba(SHADOW / f"frame-{i:02d}.webp")
    a = o[..., 3]
    rgb = o[..., :3]
    lum = rgb.mean(-1)
    chroma = rgb.max(-1) - rgb.min(-1)
    h, w = a.shape

    # Light, neutral: the white floor and the pale disc it makes under the cap.
    floorish = (chroma < 16) & (lum > 150)
    # The floor disc's shadow core is the same mid grey as the face print's
    # shadows, so colour cannot tell them apart: geometry does. The cap's lower
    # edge, column by column, from the grounded frames' cap (its holes closed:
    # they are inside the cap, the floor is below it).
    gb = (g[..., 3] >= 200).astype(np.uint8)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    gb = cv2.morphologyEx(gb, cv2.MORPH_CLOSE, k)
    ff = gb.copy()
    mask = np.zeros((h + 2, w + 2), np.uint8)
    cv2.floodFill(ff, mask, (0, 0), 1)
    body = (gb | (1 - ff)).astype(bool)

    lowest = np.full(w, -1)
    ys, xs = np.nonzero(body)
    np.maximum.at(lowest, xs, ys)
    # One pixel of grace for the brim's own edge.
    lowest = np.where(lowest >= 0, lowest + 1, -1)
    below = np.arange(h)[:, None] > lowest[None, :]

    # Floor seen through the head opening: light and neutral inside the silhouette,
    # in a patch too big to be a highlight or a rhinestone.
    inner_floor = floorish & body & (lum > 185)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(inner_floor.astype(np.uint8), 8)
    keep = np.zeros_like(inner_floor)
    for c in range(1, n):
        if stats[c, cv2.CC_STAT_AREA] >= 60:
            keep |= lab == c
    inner_floor = keep

    cap = (a > 0) & ~below & ~inner_floor
    alpha = np.where(cap, a, 0)
    # Where the floor seen through the opening was, a soft edge instead of a cut.
    soft = cv2.GaussianBlur(inner_floor.astype(np.float32), (0, 0), 0.8)
    alpha = alpha * (1 - np.clip(soft, 0, 1))

    # Edge: tighten the faintest alpha (the matte's outermost pixels).
    edge = (alpha > 0) & (alpha < 250)
    alpha = np.where(edge, np.clip((alpha - 28) * 255 / (255 - 28), 0, 255), alpha)

    # Edge colour: from the cap just inside (iteratively grow opaque colour outwards).
    solid = alpha >= 250
    col = np.where(solid[..., None], rgb, 0)
    wsum = solid.astype(np.float32)
    grown_col, grown_w = col.copy(), wsum.copy()
    for _ in range(4):
        grown_col = cv2.blur(grown_col, (3, 3)) * 9
        grown_w = cv2.blur(grown_w, (3, 3)) * 9
        fill = (grown_w > 0) & ~solid
        col[fill] = grown_col[fill] / grown_w[fill][..., None]
        solid = solid | fill
        grown_col = np.where(solid[..., None], col, 0)
        grown_w = solid.astype(np.float32)
    rim = (alpha > 0) & (alpha < 250)
    out_rgb = np.where(rim[..., None], col, rgb)

    # Shadow: the grounded frames' contact shadow, only where the floor was.
    shadow_zone = below | inner_floor
    sa = np.where(shadow_zone & (alpha < 1), g[..., 3], 0)
    s_rgb = g[..., :3]
    # Composite cap over shadow (both straight alpha).
    ca = alpha / 255
    sh = sa / 255
    out_a = ca + sh * (1 - ca)
    out = np.where(out_a[..., None] > 0, (out_rgb * ca[..., None] + s_rgb * sh[..., None] * (1 - ca[..., None])) / np.maximum(out_a, 1e-6)[..., None], 0)

    result = np.dstack([np.clip(out, 0, 255), np.clip(out_a * 255, 0, 255)]).astype(np.uint8)

    # Report: opaque cap pixels of the original, inside the cap, not opaque here (should be ~0).
    lost = (a >= 250) & (g[..., 3] >= 200) & ~((lum > 185) & (chroma < 16)) & (result[..., 3] < 250)
    return result, {"lost": int(lost.sum()), "floor_removed": int(((a > 0) & (below | inner_floor)).sum())}


if __name__ == "__main__":
    total = 0
    for i in range(N):
        img, rep = derive(i)
        total += rep["lost"]
        # q95: indistinguishable from q100 where the cap is shown largest (2.2 device px per frame
        # px), 16% lighter; q90 visibly smooths the skin and the brim's twill. Alpha lossless.
        Image.fromarray(img, "RGBA").save(OUT / f"frame-{i:02d}.webp", quality=95, alpha_quality=100, method=6)
        if i % 23 == 0:
            print(f"frame {i:02d}", rep)
    print("opaque cap pixels lost, all frames:", total)
