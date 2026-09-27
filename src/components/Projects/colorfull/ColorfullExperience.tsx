"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import Image from "next/image";
import { useReducedMotion, useScroll, useTransform } from "framer-motion";
import { FILL_COVER_SIZES } from "../coverWarmup";
import { fillRect, handoffAspect } from "../transitionGeometry";
import { useBox, type Box } from "../useBox";
import { useKeyboardScroll } from "../useKeyboardScroll";
import { COVER_H, COVER_W, DUO_BLOB, FACE_BLOB, IN_COVER, PAPER, SPRITES } from "./coverGeometry";
import { BACKDROP, COVER_SRC, PHOTOS, WORDS, type Photo } from "./colorfullContent";

/**
 * COLORFULL: the cover comes apart and comes back together.
 *
 * The cover shows its photographs only through soft, amoeba-like windows cut
 * into cream paper, and its two figures are a pair: one in red, one in blue.
 * The whole project stays on that paper. The live page starts as an exact
 * rebuild of the cover (its own windows, typesetting and cut-out figure), so
 * the handoff from the desk is seamless. Then:
 *
 *   step back   the whole cover comes into view
 *   lift        its windows lift off: red takes one side, blue the other
 *               (left/right, or top/bottom on portrait screens), the duo window
 *               closes, the cover's words move to the edges
 *   contrast    each window changes photograph once, with an iris squeeze
 *   meet        red and blue slide together; where they overlap, and only
 *               there, the photographs of the two together show through
 *   together    one window, the two of them back to back
 *   together    everything flies back into the cover, which goes still and
 *   again       stays: the whole cover, a finished print on the paper (the
 *               end, not a rewind to the cropped first frame)
 *
 * The windows are soft bodies: they breathe, bulge toward the pointer or a
 * finger and wobble back ("playful tactility"). Scroll is softened, not
 * scrubbed. Everything is drawn imperatively each frame from one progress
 * value, bound to this component's own scroll container.
 */

const HANDOFF_ASPECT = handoffAspect("colorfull");

/** Scroll length in screens. */
const LENGTH = 8;
/** The timeline, as fractions of the scroll. */
const T = {
  back: [0.02, 0.11] as Span, // step back from the page
  lift: [0.09, 0.26] as Span,
  swapRed: 0.35,
  swapBlue: 0.45,
  meet: [0.53, 0.68] as Span,
  swapDuo: 0.745,
  land: [0.8, 0.92] as Span, // windows fly back into the cover
  print: [0.9, 0.97] as Span, // which settles as a finished print, and stays
};
const SQUEEZE = 0.03; // half-width of an iris squeeze
/** How far a window closes at its photograph change (a blink, not a collapse). */
const SQUEEZE_DEPTH = 0.3;
/** Reduced motion: the timeline's key moments, stacked. */
const STILLS = [0, 0.3, 0.5, 0.62, 0.78, 1];

type Span = readonly [number, number];
type Rect = { x: number; y: number; w: number };
type Spot = { x: number; y: number; k: number };
type TypeId = "title" | "contrast" | "fur" | "tactility";
type LayerId = "redCover" | "redFace" | "redFigure" | "blueLegs" | "blueLying" | "duoCover" | "together" | "backToBack";
type Pointer = { x: number; y: number; infl: number };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const ramp = (v: number, [a, b]: Span) => clamp((v - a) / (b - a), 0, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** 1 at `c`, easing to 0 at `c ± hw`. */
const bump = (v: number, c: number, hw: number) => {
  const d = Math.abs(v - c) / hw;
  return d >= 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * d);
};
/** 1 before `at`, 0 after, with a very short crossfade. */
const before = (v: number, at: number) => 1 - ramp(v, [at - 0.004, at + 0.004]);
const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t) });

/* ─────────────────────────────── blob geometry ─────────────────────────────── */

const N = FACE_BLOB.r.length;
const ANG = Array.from({ length: N }, (_, i) => (i / N) * Math.PI * 2);
const COS = ANG.map(Math.cos);
const SIN = ANG.map(Math.sin);
const FACE_R = FACE_BLOB.r;
const DUO_R = DUO_BLOB.r;
/** The duo window mirrored left–right: blue's own silhouette while apart. */
const DUO_MIRROR_R = DUO_R.map((_, i) => DUO_R[(N / 2 - i + N) % N]);

function extent(r: readonly number[]) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < N; i++) {
    const x = r[i] * COS[i], y = r[i] * SIN[i];
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  return { w: x1 - x0, h: y1 - y0 };
}
const FACE_EXT = extent(FACE_R);
const DUO_EXT = extent(DUO_R);
/** Where the blue window opens on the cover: the cut-out figure's body. */
const BLUE_SEED = { x: 1000, y: 2170 };

type Bounds = { x0: number; y0: number; x1: number; y1: number };
function bounds(cx: number, cy: number, r: ArrayLike<number>): Bounds {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < N; i++) {
    const x = cx + r[i] * COS[i], y = cy + r[i] * SIN[i];
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  return { x0, y0, x1, y1 };
}

/** A photograph covering a window, its focal point as central as the window allows. */
function coverFit(b: Bounds, p: Photo): Rect {
  const bw = b.x1 - b.x0, bh = b.y1 - b.y0;
  const w = Math.max(bw, bh * p.aspect) * 1.04;
  const h = w / p.aspect;
  return {
    x: clamp((b.x0 + b.x1) / 2 - p.focal[0] * w, b.x1 - w, b.x0),
    y: clamp((b.y0 + b.y1) / 2 - p.focal[1] * h, b.y1 - h, b.y0),
    w,
  };
}

/**
 * The window's living edge: a slow breath, and the membrane reaching toward
 * the pointer (or pressed in by it, just inside the edge), by up to about a
 * seventh of the window's radius. It depends only on the window's current
 * geometry, so two windows that coincide deform identically (and the overlap
 * can hand over to one window).
 */
function deform(cx: number, cy: number, r: Float64Array, out: Float64Array, t: number, amp: number, ptr: Pointer | null) {
  let mean = 0;
  for (let i = 0; i < N; i++) mean += r[i];
  mean /= N;
  const breath = amp * mean * 0.015;
  const reach = ptr ? Math.min(0.14 * mean, 90) * amp * ptr.infl : 0;
  let rho = 0, theta = 0, arc = 1;
  if (reach && ptr) {
    rho = Math.hypot(ptr.x - cx, ptr.y - cy);
    theta = Math.atan2(ptr.y - cy, ptr.x - cx);
    arc = Math.max(0.3 * mean, 60);
  }
  for (let i = 0; i < N; i++) {
    let v = r[i];
    if (breath) v += breath * (Math.sin(t * 1.14 + 3 * ANG[i]) + 0.6 * Math.sin(t * 0.72 - 2 * ANG[i] + 1.3));
    if (reach) {
      let d = ANG[i] - theta;
      d -= Math.round(d / (2 * Math.PI)) * 2 * Math.PI;
      const along = Math.exp(-(((d * r[i]) / arc) ** 2));
      const gap = rho - r[i];
      const near = Math.exp(-((gap / (2.5 * Math.abs(reach) + 1)) ** 2));
      v += clamp(gap, -0.6 * Math.abs(reach), Math.abs(reach)) * Math.sign(reach) * near * along;
    }
    out[i] = Math.max(0, v);
  }
  return mean;
}

const PX = new Float64Array(N), PY = new Float64Array(N);
/** Closed Catmull-Rom curve through the window's points, as a CSS path. */
function pathOf(cx: number, cy: number, r: ArrayLike<number>) {
  for (let i = 0; i < N; i++) {
    PX[i] = cx + r[i] * COS[i];
    PY[i] = cy + r[i] * SIN[i];
  }
  const px = (i: number) => PX[(i + N) % N];
  const py = (i: number) => PY[(i + N) % N];
  const f = (v: number) => Math.round(v * 10) / 10;
  let d = `M${f(PX[0])} ${f(PY[0])}`;
  for (let i = 0; i < N; i++) {
    const c1x = px(i) + (px(i + 1) - px(i - 1)) / 6, c1y = py(i) + (py(i + 1) - py(i - 1)) / 6;
    const c2x = px(i + 1) - (px(i + 2) - px(i)) / 6, c2y = py(i + 1) - (py(i + 2) - py(i)) / 6;
    d += `C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(px(i + 1))} ${f(py(i + 1))}`;
  }
  return `path("${d}Z")`;
}

/* ─────────────────────────────── layout ─────────────────────────────── */

type Layout = {
  box: Box;
  /** Cover framing at the handoff (exactly the transition's) and with the whole cover in view. */
  fill: { k: number; x: number; y: number };
  whole: { k: number; x: number; y: number };
  red: Spot;
  blue: Spot;
  both: Spot;
  /** Scale and resting places of the cover's words while the windows are apart. */
  typeK: number;
  type: Record<TypeId, { x: number; y: number; k: number }>;
  photoBase: number;
  coverBase: number;
};

function makeLayout(box: Box): Layout {
  const { w, h, fw } = box;
  const portrait = w / h < 1 || w < 700;
  const F = fillRect(HANDOFF_ASPECT, fw, h);
  const kFill = Math.max(F.width / COVER_W, F.height / COVER_H);
  const kWhole = Math.min((w * 0.84) / COVER_W, (h * 0.8) / COVER_H);
  // Red on the left and blue on the right, as in the photographs of the two
  // together; on portrait screens red above and blue below, as on the cover.
  const red: Spot = portrait
    ? { x: w * 0.5, y: h * 0.34, k: Math.min((h * 0.36) / FACE_EXT.h, (w * 0.84) / FACE_EXT.w) }
    : { x: w * 0.29, y: h * 0.53, k: Math.min((h * 0.76) / FACE_EXT.h, (w * 0.43) / FACE_EXT.w) };
  const blue: Spot = portrait
    ? { x: w * 0.5, y: h * 0.72, k: Math.min((h * 0.36) / DUO_EXT.h, (w * 0.94) / DUO_EXT.w) }
    : { x: w * 0.71, y: h * 0.5, k: Math.min((h * 0.72) / DUO_EXT.h, (w * 0.45) / DUO_EXT.w) };
  const both: Spot = portrait
    ? { x: w * 0.5, y: h * 0.52, k: Math.min((h * 0.64) / DUO_EXT.h, (w * 0.98) / DUO_EXT.w) }
    : { x: w * 0.5, y: h * 0.52, k: Math.min((h * 0.86) / DUO_EXT.h, (w * 0.66) / DUO_EXT.w) };
  const typeK = Math.min((h / 1100) * 0.95, (w * 0.62) / SPRITES.contrast.w);
  const m = portrait ? 20 : 40;
  // Below the shell's back button on portrait (top-6 / sm:top-8), which sits top-right.
  const top = portrait ? (w >= 640 ? 88 : 72) : 36;
  return {
    box,
    fill: { k: kFill, x: fw / 2, y: h / 2 },
    whole: { k: kWhole, x: fw / 2, y: h / 2 },
    red,
    blue,
    both,
    typeK,
    type: {
      contrast: { x: m, y: top, k: typeK },
      tactility: { x: w - m - SPRITES.tactility.w * typeK, y: h - m - SPRITES.tactility.h * typeK, k: typeK },
      fur: { x: m, y: h - m - SPRITES.fur.h * typeK, k: typeK },
      // The masthead rises out of view.
      title: { x: (fw - SPRITES.title.w * kWhole) / 2, y: -SPRITES.title.h * kWhole - 60, k: kWhole },
    },
    photoBase: photoBaseFor(red, blue, both, kFill),
    coverBase: Math.round(COVER_W * kFill),
  };
}

/**
 * The widest any photograph is ever shown: printed on the cover at the handoff,
 * or covering its window. Photo layers are made exactly that size (never scaled
 * up), so no more pixels are loaded, decoded and rasterised than are seen.
 */
function photoBaseFor(red: Spot, blue: Spot, both: Spot, kFill: number) {
  const within = (s: Spot, r: readonly number[]) => bounds(s.x, s.y, r.map((v) => v * s.k));
  const widths = [
    IN_COVER.face.w * kFill, IN_COVER.duo.w * kFill, IN_COVER.blue.w * kFill,
    coverFit(within(red, FACE_R), PHOTOS.redFace).w, coverFit(within(red, FACE_R), PHOTOS.redFigure).w,
    coverFit(within(blue, DUO_MIRROR_R), PHOTOS.blueLegs).w, coverFit(within(blue, DUO_MIRROR_R), PHOTOS.blueLying).w,
    coverFit(within(both, DUO_R), PHOTOS.together).w, coverFit(within(both, DUO_R), PHOTOS.backToBack).w,
  ];
  return Math.round(Math.min(3200, Math.max(...widths) * 1.04));
}

/* ─────────────────────────────── one frame ─────────────────────────────── */

type ElId = "overlay" | "page" | "red" | "blue" | "duoA" | "duoB" | "cutout" | LayerId | TypeId;
/** The scene's elements, written to directly every frame. */
type Els = Partial<Record<ElId, HTMLDivElement | null>>;
type Register = (id: ElId) => (el: HTMLDivElement | null) => void;

/** An element registry owned by the stage; the scene only registers into it. */
function useEls(): [RefObject<Els>, Register] {
  const els = useRef<Els>({});
  const register = useCallback<Register>(
    (id) => (el) => {
      els.current[id] = el;
    },
    [],
  );
  return [els, register];
}

const rRed = new Float64Array(N), rBlue = new Float64Array(N), rDuo = new Float64Array(N);
const dRed = new Float64Array(N), dBlue = new Float64Array(N), dDuo = new Float64Array(N);

/** Writes a style only when it changed (most of the page is still between frames). */
const written = new WeakMap<HTMLElement, Record<string, string>>();
function set(el: HTMLElement, prop: "opacity" | "visibility" | "transform" | "clipPath", value: string) {
  let w = written.get(el);
  if (!w) written.set(el, (w = {}));
  if (w[prop] === value) return;
  w[prop] = value;
  el.style[prop] = value;
}
/** Windows are hidden with opacity: their photo layers set their own visibility, which a hidden parent would not override. */
function show(el: HTMLElement | null | undefined, on: boolean) {
  if (el) set(el, "opacity", on ? "1" : "0");
}
function place(el: HTMLElement | null | undefined, r: Rect, base: number, opacity: number) {
  if (!el) return;
  const on = opacity > 0.002;
  set(el, "visibility", on ? "visible" : "hidden");
  if (!on) return;
  set(el, "opacity", opacity > 0.998 ? "1" : opacity.toFixed(3));
  set(el, "transform", `translate3d(${r.x.toFixed(2)}px, ${r.y.toFixed(2)}px, 0) scale(${(r.w / base).toFixed(5)})`);
}
/** The cover image placed so that it lines up with a photograph shown at `r` (placed at `at` on the cover). */
const coverAround = (r: Rect, at: Rect): Rect => {
  const s = r.w / at.w;
  return { x: r.x - at.x * s, y: r.y - at.y * s, w: COVER_W * s };
};

function render(E: Els, L: Layout, P: number, t: number, alive: number, ptr: Pointer | null, overlay: number) {
  // Cover framing: from the handoff framing, step back to the whole cover, which stays in view to the end.
  const z = ease(ramp(P, T.back));
  const k = Math.exp(lerp(Math.log(L.fill.k), Math.log(L.whole.k), z));
  const ox = lerp(L.fill.x, L.whole.x, z) - (COVER_W / 2) * k;
  const oy = lerp(L.fill.y, L.whole.y, z) - (COVER_H / 2) * k;
  const onCover = (x: number, y: number) => ({ x: x * k + ox, y: y * k + oy });
  const inCover = (r: Rect): Rect => ({ x: r.x * k + ox, y: r.y * k + oy, w: r.w * k });

  // 0 = everything in its place on the cover, 1 = windows apart / together.
  const W = P < 0.5 ? ease(ramp(P, T.lift)) : 1 - ease(ramp(P, T.land));
  // 0 = red and blue apart, 1 = one window.
  const c = ease(ramp(P, T.meet));
  const merged = c > 0.999 && P < T.land[0];
  // The cover is alive while open; it goes still again as it closes.
  const amp = alive * (1 - ramp(P, [0.95, 0.99]));
  const L2 = L.both;

  // ── red window: the cover's top window → the red side → the shared window
  const redAct = { x: lerp(L.red.x, L2.x, c), y: lerp(L.red.y, L2.y, c), k: lerp(L.red.k, L2.k, c) };
  const faceAt = onCover(FACE_BLOB.cx, FACE_BLOB.cy);
  const redC = { x: lerp(faceAt.x, redAct.x, W), y: lerp(faceAt.y, redAct.y, W) };
  const qRed = 1 - SQUEEZE_DEPTH * bump(P, T.swapRed, SQUEEZE);
  for (let i = 0; i < N; i++) rRed[i] = lerp(FACE_R[i] * k, lerp(FACE_R[i], DUO_R[i], c) * redAct.k, W);
  const redBox = bounds(redC.x, redC.y, rRed);
  let redPath = "";
  if (!merged) {
    for (let i = 0; i < N; i++) rRed[i] *= qRed;
    deform(redC.x, redC.y, rRed, dRed, t, amp, ptr);
    redPath = pathOf(redC.x, redC.y, dRed);
  }

  // ── blue window: opens around the cut-out figure → the blue side → the shared window
  const blueAct = { x: lerp(L.blue.x, L2.x, c), y: lerp(L.blue.y, L2.y, c), k: lerp(L.blue.k, L2.k, c) };
  const seed = onCover(BLUE_SEED.x, BLUE_SEED.y);
  const blueC = { x: lerp(seed.x, blueAct.x, W), y: lerp(seed.y, blueAct.y, W) };
  const qBlue = 1 - SQUEEZE_DEPTH * bump(P, T.swapBlue, SQUEEZE);
  for (let i = 0; i < N; i++) rBlue[i] = lerp(0, lerp(DUO_MIRROR_R[i], DUO_R[i], c) * blueAct.k, W);
  const blueActBox = bounds(blueAct.x, blueAct.y, Array.from(DUO_MIRROR_R, (v, i) => lerp(v, DUO_R[i], c) * blueAct.k));
  let blueMean = 0;
  for (let i = 0; i < N; i++) blueMean += (rBlue[i] *= qBlue) / N;
  let bluePath = "";
  if (!merged && blueMean > 0.5) {
    deform(blueC.x, blueC.y, rBlue, dBlue, t, amp, ptr);
    bluePath = pathOf(blueC.x, blueC.y, dBlue);
  }

  // ── the shared window: the cover's centre window; the red∩blue overlap; one window
  const duoAt = onCover(DUO_BLOB.cx, DUO_BLOB.cy);
  const bothBox = bounds(L2.x, L2.y, DUO_R.map((v) => v * L2.k));
  const lens = P >= 0.5 && !merged && P < T.land[0];
  let duoPath = "";
  let duoVisible: boolean;
  if (lens) {
    duoVisible = c > 0.001;
  } else if (P < 0.5) {
    // First half: the cover's centre window closes where it stands while red and blue fly apart.
    const open = 1 - ease(ramp(W, [0, 0.5]));
    for (let i = 0; i < N; i++) rDuo[i] = DUO_R[i] * k * open;
    const mean = deform(duoAt.x, duoAt.y, rDuo, dDuo, t, amp, ptr);
    duoVisible = mean > 0.5;
    duoPath = pathOf(duoAt.x, duoAt.y, dDuo);
  } else {
    // After the meeting: one window, which finally flies back into the cover.
    const cx = lerp(duoAt.x, L2.x, W), cy = lerp(duoAt.y, L2.y, W);
    const qDuo = 1 - SQUEEZE_DEPTH * bump(P, T.swapDuo, SQUEEZE);
    for (let i = 0; i < N; i++) rDuo[i] = lerp(DUO_R[i] * k, DUO_R[i] * L2.k, W) * qDuo;
    const mean = deform(cx, cy, rDuo, dDuo, t, amp, ptr);
    duoVisible = mean > 0.5;
    duoPath = pathOf(cx, cy, dDuo);
  }

  // Windows
  const redVisible = !merged;
  const blueVisible = !merged && blueMean > 0.5;
  if (E.red) {
    show(E.red, redVisible);
    if (redVisible) set(E.red, "clipPath", redPath);
  }
  if (E.blue) {
    show(E.blue, blueVisible);
    if (blueVisible) set(E.blue, "clipPath", bluePath);
  }
  if (E.duoA && E.duoB) {
    show(E.duoA, duoVisible);
    if (duoVisible) {
      set(E.duoA, "clipPath", lens ? redPath : duoPath);
      set(E.duoB, "clipPath", lens ? bluePath : duoPath);
    }
  }

  // Photographs. On the cover they sit exactly where the cover prints them;
  // the cover image itself fills each window at first and hands over to the
  // sharp photograph as the windows lift.
  const show0 = ramp(W, [0.02, 0.3]);
  const coverFade = 1 - ramp(W, [0.3, 0.6]);
  const base = L.photoBase;
  const redFirst = P < 0.75 ? before(P, T.swapRed) : 1;
  const faceRect = lerpRect(inCover(IN_COVER.face), coverFit(redBox, PHOTOS.redFace), W);
  place(E.redCover, coverAround(faceRect, IN_COVER.face), L.coverBase, coverFade);
  place(E.redFace, faceRect, base, show0 * redFirst);
  place(E.redFigure, coverFit(redBox, PHOTOS.redFigure), base, W * (1 - redFirst));

  const blueFirst = P < 0.75 ? before(P, T.swapBlue) : 1;
  const legsRect = lerpRect(inCover(IN_COVER.blue), coverFit(blueActBox, PHOTOS.blueLegs), W);
  place(E.blueLegs, legsRect, base, ramp(W, [0, 0.15]) * blueFirst);
  place(E.blueLying, coverFit(blueActBox, PHOTOS.blueLying), base, W * (1 - blueFirst));
  // The printed cut-out figure travels with its photograph until the window has opened around it.
  const s = legsRect.w / IN_COVER.blue.w;
  const cut = SPRITES.cutout;
  place(
    E.cutout,
    { x: legsRect.x + (cut.x - IN_COVER.blue.x) * s, y: legsRect.y + (cut.y - IN_COVER.blue.y) * s, w: cut.w * s },
    cut.w,
    1 - ramp(W, [0.12, 0.4]),
  );

  const duoRect = P < 0.5 ? inCover(IN_COVER.duo) : lerpRect(inCover(IN_COVER.duo), coverFit(bothBox, PHOTOS.backToBack), W);
  place(E.duoCover, coverAround(duoRect, IN_COVER.duo), L.coverBase, coverFade);
  const togetherOn = P >= 0.5 ? before(P, T.swapDuo) : 0;
  place(E.together, coverFit(bothBox, PHOTOS.together), base, togetherOn);
  place(E.backToBack, duoRect, base, show0 * (P < 0.5 ? 1 : 1 - togetherOn));

  // The cover's words: on the cover, then at the edges of the page.
  const actOpacity: Record<TypeId, number> = {
    title: 0,
    contrast: 1 - ramp(c, [0.05, 0.4]),
    fur: ramp(c, [0.4, 0.75]),
    tactility: 1,
  };
  for (const id of ["title", "contrast", "fur", "tactility"] as const) {
    const sp = SPRITES[id];
    const from = onCover(sp.x, sp.y);
    const to = L.type[id];
    const sk = Math.exp(lerp(Math.log(k), Math.log(to.k), W));
    place(E[id], { x: lerp(from.x, to.x, W), y: lerp(from.y, to.y, W), w: sp.w * sk }, sp.w, lerp(1, actOpacity[id], W));
  }

  // The end: the whole cover, back together, lifts off the paper as a print.
  if (E.page) {
    const printed = ease(ramp(P, T.print));
    set(E.page, "visibility", printed > 0.002 ? "visible" : "hidden");
    set(E.page, "opacity", printed.toFixed(3));
    set(E.page, "transform", `translate3d(${ox.toFixed(2)}px, ${oy.toFixed(2)}px, 0) scale(${(k / L.whole.k).toFixed(5)})`);
  }

  if (E.overlay) {
    set(E.overlay, "opacity", overlay.toFixed(3));
    set(E.overlay, "visibility", overlay > 0.002 ? "visible" : "hidden");
  }
}

/* ─────────────────────────────── components ─────────────────────────────── */

export default function ColorfullExperience() {
  const scroller = useRef<HTMLDivElement>(null);
  const box = useBox(scroller);
  const reduced = !!useReducedMotion();
  const layout = useMemo(() => makeLayout(box), [box]);
  useKeyboardScroll(scroller, box.h, { space: true });

  return (
    <div
      ref={scroller}
      tabIndex={0}
      aria-label={`${WORDS.title}: ${WORDS.contrast}. Scroll to explore.`}
      className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain outline-none"
      style={{ background: PAPER }}
    >
      {/* The visible type is the cover's own typesetting (images); this names the project for screen readers. */}
      <h2 className="sr-only">{WORDS.title}</h2>
      {reduced ? (
        STILLS.map((p) => (
          <section key={p} className="relative overflow-hidden" style={{ height: box.h }}>
            <StillStage layout={layout} P={p} />
          </section>
        ))
      ) : (
        <div style={{ height: box.h * LENGTH }}>
          <div className="sticky top-0 overflow-hidden" style={{ height: box.h }}>
            <LiveStage layout={layout} scroller={scroller} />
          </div>
        </div>
      )}
    </div>
  );
}

function LiveStage({ layout, scroller }: { layout: Layout; scroller: RefObject<HTMLDivElement | null> }) {
  const [els, register] = useEls();
  const layoutRef = useRef(layout);
  const { scrollYProgress } = useScroll({ container: scroller });
  // Function transform: keeps framer off its native scroll-timeline path, which mistracks nested scrollers.
  const progress = useTransform(scrollYProgress, (v) => v);
  const pointer = useRef({ tx: 0, ty: 0, on: 0, x: 0, y: 0, infl: 0, v: 0, seen: false });

  useLayoutEffect(() => {
    layoutRef.current = layout;
    render(els.current, layout, progress.get(), 0, 0, null, 1);
  }, [els, layout, progress]);

  // Decode each photograph ahead of its first reveal, so it is ready to paint when its window opens.
  useEffect(() => {
    for (const el of Object.values(els.current)) {
      el?.querySelectorAll("img").forEach((img) => {
        const decode = () => img.decode().catch(() => {});
        if (img.complete) decode();
        else img.addEventListener("load", decode, { once: true });
      });
    }
  }, [els]);

  useEffect(() => {
    const t0 = performance.now();
    let last = t0;
    let Ps = progress.get();
    let raf = 0;
    let frame = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const since = (now - t0) / 1000;
      // Softened scroll: the page settles like fur rather than snapping to the wheel.
      const P = progress.get();
      Ps += (P - Ps) * (1 - Math.exp(-dt / 0.14));
      if (Math.abs(P - Ps) < 1e-5) Ps = P;
      // Pointer: the position eases, its influence is a loose spring, so the edge wobbles when let go.
      const p = pointer.current;
      const a = 1 - Math.exp(-dt / 0.07);
      p.x += (p.tx - p.x) * a;
      p.y += (p.ty - p.y) * a;
      p.v += (90 * (p.on - p.infl) - 6 * p.v) * dt;
      p.infl += p.v * dt;
      // The printed cover hands over to the live one, then starts to breathe.
      const overlay = Math.min(1 - ramp(since, [0.9, 1.6]), 1 - ramp(P, [0.001, 0.02]));
      const alive = ramp(since, [1.3, 2.8]);
      // When only the slow breath is moving, every other frame is enough.
      const busy = P !== Ps || Math.abs(p.v) > 0.01 || Math.abs(p.on - p.infl) > 0.01 || Math.abs(p.tx - p.x) + Math.abs(p.ty - p.y) > 0.5 || since < 3;
      if (busy || (frame++ & 1) === 0) render(els.current, layoutRef.current, Ps, since, alive, { x: p.x, y: p.y, infl: p.infl }, overlay);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [els, progress]);

  const onPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const p = pointer.current;
    p.tx = e.clientX - r.left;
    p.ty = e.clientY - r.top;
    if (!p.seen || p.infl < 0.02) {
      p.x = p.tx;
      p.y = p.ty;
      p.seen = true;
    }
    if (e.type === "pointerdown") {
      p.on = 1;
      p.v += 6; // a poke
    } else if (e.pointerType === "mouse") {
      p.on = 1;
    }
  };
  const onRelease = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.type === "pointerleave" || e.pointerType !== "mouse") pointer.current.on = 0;
  };

  return (
    <div
      className="absolute inset-0"
      style={{ touchAction: "pan-y" }}
      onPointerMove={onPointer}
      onPointerDown={onPointer}
      onPointerUp={onRelease}
      onPointerCancel={onRelease}
      onPointerLeave={onRelease}
    >
      <Scene register={register} layout={layout} overlay />
    </div>
  );
}

function StillStage({ layout, P }: { layout: Layout; P: number }) {
  const [els, register] = useEls();
  useLayoutEffect(() => {
    render(els.current, layout, P, 0, 0, null, P === 0 ? 1 : 0);
  }, [els, layout, P]);
  return <Scene register={register} layout={layout} overlay={P === 0} />;
}

/**
 * The page: cut-out figure, three windows, the cover's words, and the printed
 * cover on top at the start. Every layer that moves or scales is its own
 * compositor layer (will-change), rasterised once at its full size and then
 * only transformed: scaling a plain layer every frame would re-raster and
 * re-decode its photograph each time, which is what made the page hitch.
 * All photographs are mounted from the start (the later ones at low
 * priority), so nothing is added to the page while it is being scrolled.
 */
function Scene({ register, layout, overlay }: { register: Register; layout: Layout; overlay: boolean }) {
  const { box, photoBase, coverBase } = layout;
  const F = fillRect(HANDOFF_ASPECT, box.fw, box.h);
  const photoSizes = `${Math.round((photoBase / box.w) * 100)}vw`;
  const photoLayer = (id: LayerId, p: Photo, first = false) => (
    <div
      ref={register(id)} data-el={id}
      className="absolute left-0 top-0 origin-top-left"
      style={{ width: photoBase, height: photoBase / p.aspect, visibility: "hidden", willChange: "transform" }}
    >
      <Image src={p.src} alt={p.alt} fill sizes={photoSizes} className="object-cover" loading="eager" fetchPriority={first ? "auto" : "low"} draggable={false} />
    </div>
  );
  const coverLayer = (id: LayerId) => (
    <div
      ref={register(id)} data-el={id}
      aria-hidden
      className="absolute left-0 top-0 origin-top-left"
      style={{ width: coverBase, height: (coverBase * COVER_H) / COVER_W, visibility: "hidden", willChange: "transform" }}
    >
      <Image src={COVER_SRC} alt="" fill sizes={FILL_COVER_SIZES} className="object-cover" loading="eager" draggable={false} />
    </div>
  );
  const sprite = (id: TypeId | "cutout", decorative = false) => (
    <div
      key={id}
      ref={register(id)} data-el={id}
      aria-hidden={decorative || undefined}
      className="absolute left-0 top-0 origin-top-left"
      style={{ width: SPRITES[id].w, height: SPRITES[id].h, visibility: "hidden", willChange: "transform" }}
    >
      <Image src={SPRITES[id].src} alt={SPRITES[id].alt} width={SPRITES[id].w} height={SPRITES[id].h} unoptimized loading="eager" draggable={false} />
    </div>
  );

  return (
    <div className="absolute inset-0 overflow-hidden select-none" style={{ background: PAPER }}>
      {/* The cover's page edge, shown only once it is whole again at the end. */}
      <div
        ref={register("page")} data-el="page"
        aria-hidden
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: COVER_W * layout.whole.k, height: COVER_H * layout.whole.k, visibility: "hidden", background: PAPER, boxShadow: "0 1px 2px rgba(60, 40, 20, 0.08), 0 24px 60px -24px rgba(60, 40, 20, 0.35)" }}
      />
      {sprite("cutout", true)}

      <div ref={register("red")} data-el="red" className="absolute inset-0" style={{ background: BACKDROP.red, opacity: 0 }}>
        {coverLayer("redCover")}
        {photoLayer("redFace", PHOTOS.redFace, true)}
        {photoLayer("redFigure", PHOTOS.redFigure)}
      </div>

      <div ref={register("blue")} data-el="blue" className="absolute inset-0" style={{ background: BACKDROP.blue, opacity: 0 }}>
        {photoLayer("blueLegs", PHOTOS.blueLegs, true)}
        {photoLayer("blueLying", PHOTOS.blueLying)}
      </div>

      {/* Two nested clips: while red and blue overlap this shows only their intersection. */}
      <div ref={register("duoA")} data-el="duoA" className="absolute inset-0" style={{ opacity: 0 }}>
        <div ref={register("duoB")} data-el="duoB" className="absolute inset-0" style={{ background: BACKDROP.duo }}>
          {coverLayer("duoCover")}
          {photoLayer("together", PHOTOS.together)}
          {photoLayer("backToBack", PHOTOS.backToBack, true)}
        </div>
      </div>

      {(["title", "contrast", "fur", "tactility"] as const).map((id) => sprite(id))}

      {overlay && (
        <div ref={register("overlay")} data-el="overlay" aria-hidden className="absolute" style={{ left: F.x, top: F.y, width: F.width, height: F.height }}>
          <Image src={COVER_SRC} alt="" fill sizes={FILL_COVER_SIZES} className="object-cover" loading="eager" draggable={false} />
        </div>
      )}
    </div>
  );
}
