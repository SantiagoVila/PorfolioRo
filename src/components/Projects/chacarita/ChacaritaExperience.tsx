"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { animate, interpolate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Anton, Covered_By_Your_Grace, IBM_Plex_Mono } from "next/font/google";
import type { ExperienceProps } from "../experiences";
import { fillRect, handoffAspect, type Rect } from "../transitionGeometry";
import { useBox, type Box } from "../useBox";
import { useKeyboardScroll } from "../useKeyboardScroll";
import { FILL_COVER_SIZES } from "../coverWarmup";
import { COVER, FILM, FRAMES, TEXT, type Frame } from "./chacaritaContent";

/**
 * CHACARITA, an urban design field study, as the ride it was shot on: the
 * barrio seen from the colectivo, and stepped out into.
 *
 * The book lands from the desk and its cover closes down into a window: the
 * colectivo's, at night, where the ride starts (alone, holding the rail).
 * Scrolling is the ride. The frames of the bus pass the window and it stops
 * on the couple on the back seats; then the window opens and the street takes
 * the whole screen (the jacket with coffee cups for pockets), in daylight.
 * The window comes back as two panes for the café, drops to the pavement for
 * the footprints stencilled on it, and stands up as two doors, red and blue.
 * Where the ride ends it becomes a screen: the project's film, played when it
 * is asked for, as a screening. The observations along the way are the only
 * words the project has, the ones on its cover, noted by hand as in the
 * field notebook it is.
 */

const display = Anton({ subsets: ["latin"], weight: "400", display: "swap", preload: false });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap", preload: false });
const hand = Covered_By_Your_Grace({ subsets: ["latin"], weight: "400", display: "swap", preload: false });

// The desk's transition fills the screen using the book's proportions; the
// cover starts in exactly that box so it lands on the same pixels.
const HANDOFF_ASPECT = handoffAspect("chacarita");

const BUS: Frame[] = [FRAMES.busStanding, FRAMES.busDriver, FRAMES.busCouple];
/** The bus frames' mean proportions (they are all upright). */
const BUS_ASPECT = BUS.reduce((s, f) => s + f.aspect, 0) / BUS.length;

const PAPER = "#ede7dc";
const INK = "#15130f";
const CREAM = "#f5efe4";
const DARK = "#131210";
const FILM_ASPECT = FILM.width / FILM.height;
/** Screens of scroll the ride takes. */
const RIDE_SCREENS = 12;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: Rect, b: Rect, t: number): Rect => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), width: lerp(a.width, b.width, t), height: lerp(a.height, b.height, t) });
/** The window moves between views like a camera: out of one, into the next. */
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const insetOf = (r: Rect, box: Box) =>
  `inset(${Math.max(0, r.y).toFixed(1)}px ${Math.max(0, box.w - r.x - r.width).toFixed(1)}px ${Math.max(0, box.h - r.y - r.height).toFixed(1)}px ${Math.max(0, r.x).toFixed(1)}px)`;
/**
 * A scroll-linked mapping as a function: framer-motion hands offset-array
 * mappings to a native scroll timeline, which mistracks a nested scroller.
 */
const ramp = <T extends number | string>(input: number[], output: T[]) => {
  const f = interpolate(input, output);
  return (v: number) => f(v) as T;
};

/* ─────────────────────────────── the route ─────────────────────────────── */

/**
 * The views of the ride, in order: where each holds (share of the ride's
 * scroll) and the window's shape there. `b` is a second pane, when the
 * window is split in two (the café, the doors); elsewhere the second pane
 * rides hidden inside the first.
 */
type View = { id: string; from: number; to: number; a: (g: Geo) => Rect; b?: (g: Geo) => Rect };

type Geo = ReturnType<typeof geometry>;

function geometry(box: Box) {
  const { w, h } = box;
  const upright = w / h < 0.9 || w < 600;
  const full: Rect = { x: 0, y: 0, width: w, height: h };
  if (upright) {
    // A phone held upright stands close to the window: tall panes, the photographs at the phone's own width.
    const m = 16;
    const W = w - 2 * m;
    const gap = 10;
    const film = { width: W, height: W / FILM_ASPECT };
    return {
      upright,
      full,
      title: { x: m, y: h * 0.22, width: W, height: h * 0.44 },
      ride: { x: m, y: h * 0.11, width: W, height: h * 0.64 },
      pairA: { x: m, y: h * 0.08, width: W, height: h * 0.4 },
      pairB: { x: m, y: h * 0.08 + h * 0.4 + gap, width: W, height: h * 0.4 },
      ground: { x: 0, y: h * 0.5, width: w, height: h * 0.44 },
      doorA: { x: m, y: h * 0.13, width: (W - gap) / 2, height: h * 0.68 },
      doorB: { x: m + (W - gap) / 2 + gap, y: h * 0.13, width: (W - gap) / 2, height: h * 0.68 },
      film: { x: m, y: (h - film.height) / 2 - h * 0.05, ...film },
      cinema: { x: 0, y: (h - w / FILM_ASPECT) / 2, width: w, height: w / FILM_ASPECT },
    };
  }
  const short = h < 560;
  const side = Math.round(w * 0.06);
  const band = (height: number, cy = 0.52): Rect => ({ x: side, y: h * cy - height / 2, width: w - 2 * side, height });
  const gap = 14;
  const ph = h * (short ? 0.8 : 0.74);
  const pw = Math.min(w * 0.34, ph * 0.86);
  const dh = h * (short ? 0.86 : 0.84);
  const dw = Math.min(w * 0.24, dh * 0.56);
  const fw = Math.min(w - 2 * side, FILM.width * 1.3, h * 0.6 * FILM_ASPECT);
  const cw = Math.min(w, FILM.width * 1.45, h * 0.86 * FILM_ASPECT);
  return {
    upright,
    full,
    title: band(Math.min(h * (short ? 0.5 : 0.44), (w - 2 * side) * 0.5)),
    // Riding, the window stands taller and narrower than the frames that pass it (about one and
    // two-thirds of them wide): its edges cut them as they go by.
    ride: (() => {
      const rh = h * (short ? 0.76 : 0.7);
      const rw = Math.min(w - 2 * side, rh * BUS_ASPECT * 1.7);
      return { x: (w - rw) / 2, y: (h - rh) / 2, width: rw, height: rh };
    })(),
    pairA: { x: w / 2 - gap / 2 - pw, y: (h - ph) / 2, width: pw, height: ph },
    pairB: { x: w / 2 + gap / 2, y: (h - ph) / 2, width: pw, height: ph },
    ground: { x: side, y: h * (short ? 0.5 : 0.52), width: w - 2 * side, height: h * (short ? 0.42 : 0.4) },
    doorA: { x: w / 2 - gap / 2 - dw, y: (h - dh) / 2, width: dw, height: dh },
    doorB: { x: w / 2 + gap / 2, y: (h - dh) / 2, width: dw, height: dh },
    film: { x: (w - fw) / 2, y: (h - fw / FILM_ASPECT) / 2 - h * 0.04, width: fw, height: fw / FILM_ASPECT },
    cinema: { x: (w - cw) / 2, y: (h - cw / FILM_ASPECT) / 2, width: cw, height: cw / FILM_ASPECT },
  };
}

const VIEWS: View[] = [
  { id: "board", from: 0, to: 0.05, a: (g) => g.title },
  { id: "bus", from: 0.08, to: 0.24, a: (g) => g.ride },
  { id: "street", from: 0.28, to: 0.36, a: (g) => g.full },
  { id: "cafe", from: 0.41, to: 0.5, a: (g) => g.pairA, b: (g) => g.pairB },
  { id: "ground", from: 0.54, to: 0.63, a: (g) => g.ground },
  { id: "doors", from: 0.67, to: 0.76, a: (g) => g.doorA, b: (g) => g.doorB },
  { id: "film", from: 0.81, to: 1, a: (g) => g.film },
];

/** Where the window is at scroll share q: holding on a view, or travelling between two (reduced motion: cut halfway). */
function windowAt(q: number, g: Geo, reduced: boolean) {
  for (let i = 0; i < VIEWS.length; i++) {
    const v = VIEWS[i];
    if (q <= v.to || i === VIEWS.length - 1) {
      if (q >= v.from || i === 0) return { a: v.a(g), b: (v.b ?? v.a)(g), split: v.b ? 1 : 0 };
      const p = VIEWS[i - 1];
      const t = clamp((q - p.to) / (v.from - p.to), 0, 1);
      const k = reduced ? (t < 0.5 ? 0 : 1) : inOut(t);
      return {
        a: mix(p.a(g), v.a(g), k),
        b: mix((p.b ?? p.a)(g), (v.b ?? v.a)(g), k),
        split: lerp(p.b ? 1 : 0, v.b ? 1 : 0, k),
      };
    }
  }
  const last = VIEWS[VIEWS.length - 1];
  return { a: last.a(g), b: last.a(g), split: 0 };
}

/** Shown from halfway into its view to halfway out of it, with a short crossing. */
function shownDuring(id: string, cross = 0.014): [number[], number[]] {
  const i = VIEWS.findIndex((v) => v.id === id);
  const v = VIEWS[i];
  const inAt = i === 0 ? 0 : (VIEWS[i - 1].to + v.from) / 2;
  const outAt = i === VIEWS.length - 1 ? 1 : (v.to + VIEWS[i + 1].from) / 2;
  if (i === 0) return [[0, outAt - cross, outAt + cross], [1, 1, 0]];
  if (i === VIEWS.length - 1) return [[inAt - cross, inAt + cross, 1], [0, 1, 1]];
  return [[inAt - cross, inAt + cross, outAt - cross, outAt + cross], [0, 1, 1, 0]];
}

/* ─────────────────────────────── the experience ─────────────────────────────── */

export default function ChacaritaExperience({ onClose }: ExperienceProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const box = useBox(scroller);
  const reduced = !!useReducedMotion();
  useKeyboardScroll(scroller, box.h, { space: true });
  const { scrollYProgress: q } = useScroll({ container: scroller, target: track, offset: ["start start", "end end"] });
  const g = geometry(box);

  // Turning the phone keeps the reader at the same point of the ride (the ride's length changes with the screen).
  const [place] = useState(() => new Place());
  useMotionValueEvent(q, "change", (v) => place.note(v, scroller.current, box));
  useLayoutEffect(() => place.restore(scroller.current, box), [place, box]);

  // The screening (0–1): the window opens to the film's own size, and the page holds still.
  const cinema = useMotionValue(0);
  const [playing, setPlaying] = useState(false);

  const view = useTransform([q, cinema], ([v, c]: number[]) => {
    const at = windowAt(v, g, reduced);
    return c > 0 ? { ...at, a: mix(at.a, g.cinema, c) } : at;
  });
  const a = useTransform(view, (v) => v.a);
  const b = useTransform(view, (v) => v.b);
  const clipA = useTransform(a, (r) => insetOf(r, box));
  const clipB = useTransform(b, (r) => insetOf(r, box));
  const splitShown = useTransform(view, (v) => v.split);
  // The ride is at night in the bus, by day in the street, and in the dark again for the film.
  const room = useTransform(q, ramp([0, 0.36, 0.41, 0.76, 0.81], [DARK, DARK, PAPER, PAPER, DARK]));

  // Only the views near the reader keep their photographs mounted.
  const [near, setNear] = useState(0);
  useMotionValueEvent(q, "change", (v) => {
    const i = VIEWS.findIndex((x) => v <= x.to);
    setNear(i < 0 ? VIEWS.length - 1 : i);
  });
  const mounted = (id: string) => {
    const i = VIEWS.findIndex((v) => v.id === id);
    return i >= near - 1 && i <= near + 2;
  };

  const play = () => {
    setPlaying(true);
    if (reduced) cinema.set(1);
    else animate(cinema, 1, { duration: 0.6, ease: [0.32, 0.72, 0, 1] });
  };
  const stop = useCallback(() => {
    setPlaying(false);
    if (reduced) cinema.set(0);
    else animate(cinema, 0, { duration: 0.42, ease: [0.77, 0, 0.175, 1] });
  }, [cinema, reduced]);
  // During the screening Escape ends the film; the next Escape leaves the project, as ever.
  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopImmediatePropagation();
      stop();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [playing, stop]);

  const ctx = { box, g, q, reduced };

  return (
    <>
      <div
        ref={scroller}
        tabIndex={0}
        aria-label={`${TEXT.title}: ${TEXT.subtitle}. Scroll for the ride.`}
        className={`${mono.className} absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain outline-none`}
        style={{ background: DARK, color: CREAM, overflowY: playing ? "hidden" : undefined }}
      >
        <div ref={track} className="relative" style={{ height: box.h * RIDE_SCREENS }}>
          <motion.div className="sticky top-0 overflow-hidden" style={{ height: box.h, background: room }}>
            {/* The window: one pane, and the second it splits into. */}
            <motion.div aria-hidden className="absolute inset-0" style={{ clipPath: clipA }}>
              <Board ctx={ctx} />
              {mounted("bus") && <Bus ctx={ctx} a={a} />}
              {mounted("street") && <Scene ctx={ctx} id="street" f={FRAMES.cupsJacket} pos="50% 34%" rect={a} fixed shade />}
              {mounted("cafe") && <Scene ctx={ctx} id="cafe" f={FRAMES.cafeStanding} pos="50% 28%" rect={a} drift={-1} />}
              {mounted("ground") && <Scene ctx={ctx} id="ground" f={FRAMES.ground} pos={g.upright ? "50% 78%" : "50% 82%"} rect={a} />}
              {mounted("doors") && <Scene ctx={ctx} id="doors" f={FRAMES.redDoor} pos="50% 32%" rect={a} />}
              {mounted("film") && <Screen ctx={ctx} rect={a} playing={playing} onEnded={stop} />}
            </motion.div>
            <motion.div aria-hidden className="absolute inset-0" style={{ clipPath: clipB, opacity: splitShown }}>
              {mounted("cafe") && <Scene ctx={ctx} id="cafe" f={FRAMES.cafeSeated} pos="50% 46%" rect={b} drift={1} />}
              {mounted("doors") && <Scene ctx={ctx} id="doors" f={FRAMES.blueDoor} pos="50% 26%" rect={b} />}
            </motion.div>

            <Title ctx={ctx} />
            <Observations ctx={ctx} />
            <FilmControl ctx={ctx} playing={playing} onPlay={play} onStop={stop} />
          </motion.div>
        </div>
        <End box={box} onClose={onClose} />
        <Route />
      </div>
      <Boarding box={box} g={g} reduced={reduced} />
    </>
  );
}

type Ctx = { box: Box; g: Geo; q: MotionValue<number>; reduced: boolean };

/** Where the reader is on the ride (0–1), noted while the screen is steady and put back when it changes. */
class Place {
  private at = 0;
  private w = 0;
  private h = 0;
  note(v: number, el: HTMLElement | null, box: Box) {
    // Mid-resize the scroll is clamped to the old length: not a place the reader chose.
    if (!el || el.clientHeight !== box.h || el.clientWidth !== box.w) return;
    if (v > 0 && v < 1) this.at = v;
    else if (el.scrollTop <= 0) this.at = 0;
  }
  restore(el: HTMLElement | null, box: Box) {
    if (!el) return;
    const changed = this.w && (this.w !== box.w || this.h !== box.h);
    this.w = box.w;
    this.h = box.h;
    if (changed && this.at > 0) el.scrollTop = this.at * (box.h * RIDE_SCREENS - box.h);
  }
}

/* ─────────────────────────────── boarding ─────────────────────────────── */

/**
 * The cover, exactly where the desk's transition left it (filling the
 * screen), closes down into the window of the colectivo and gives way to the
 * night inside it. It waits for the project to be fully in view (the shell's
 * fade), then leaves the page. With reduced motion it simply fades.
 */
function Boarding({ box, g, reduced }: { box: Box; g: Geo; reduced: boolean }) {
  const [done, setDone] = useState(false);
  const p = useMotionValue(0);
  const F = fillRect(HANDOFF_ASPECT, box.fw, box.h);
  const clip = useTransform(p, (v) => insetOf(mix({ x: 0, y: 0, width: box.w, height: box.h }, g.title, reduced ? 0 : inOut(Math.min(1, v / 0.8))), box));
  const opacity = useTransform(p, reduced ? ramp([0, 1], [1, 0]) : ramp([0, 0.55, 1], [1, 1, 0]));
  useEffect(() => {
    const c = animate(p, 1, { duration: reduced ? 0.4 : 1.25, delay: reduced ? 0.5 : 0.48, ease: "linear", onComplete: () => setDone(true) });
    return () => c.stop();
  }, [p, reduced]);
  if (done) return null;
  return (
    <motion.div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none" style={{ clipPath: clip, opacity }}>
      <div className="absolute left-0 top-0" style={{ width: F.width, height: F.height, transform: `translate(${F.x}px, ${F.y}px)` }}>
        <Image src={COVER.src} alt="" fill sizes={FILL_COVER_SIZES} className="object-cover" loading="eager" draggable={false} />
      </div>
    </motion.div>
  );
}

/** Night, in the bus: the first view through the window, laid over the whole screen behind it. */
function Board({ ctx }: { ctx: Ctx }) {
  const [x, y] = shownDuring("board");
  const opacity = useTransform(ctx.q, ramp(x, y));
  return (
    <motion.div className="absolute inset-0" style={{ opacity }}>
      {/* Her face in the window (the frame lies over the whole screen; the window shows its middle). */}
      <Image src={FRAMES.busStanding.src} alt="" fill sizes="100vw" priority className="object-cover" style={{ objectPosition: ctx.g.upright ? "50% 30%" : "50% 0%" }} draggable={false} />
    </motion.div>
  );
}

/* ─────────────────────────────── the bus ─────────────────────────────── */

/** Upright: which frame of the bus fills the window, over the ride: alone, the driver, then the stop on the couple. */
const BUS_AT = ramp([0.08, 0.1, 0.14, 0.16, 0.19, 1], [0, 0, 1, 1, 2, 2]);
/** Wide: how far the frames have passed the window, from the first frame at its left edge to the couple at its right. */
const BUS_PAN = ramp([0.08, 0.1, 0.19, 1], [0, 0, 1, 1]);
const BUS_POS = ["50% 42%", "42% 55%", "50% 70%"];

/**
 * The frames of the bus passing the window, at the window's height (upright:
 * at its width, one after another), until it stops on the couple.
 */
function Bus({ ctx, a }: { ctx: Ctx; a: MotionValue<Rect> }) {
  const { q, g, reduced } = ctx;
  const [x, y] = shownDuring("bus");
  const opacity = useTransform(q, ramp(x, y));
  const widths = (r: Rect) => BUS.map((f) => (g.upright ? r.width : r.height * f.aspect));
  const GAP = 10;
  const shift = useTransform(() => {
    const v = q.get();
    const r = a.get();
    const ws = widths(r);
    if (!g.upright) {
      const length = ws.reduce((s, w) => s + w, 0) + GAP * (ws.length - 1);
      const k = reduced ? Math.round(BUS_PAN(v)) : inOut(BUS_PAN(v));
      return r.x - Math.max(0, length - r.width) * k;
    }
    const at = reduced ? Math.round(BUS_AT(v)) : BUS_AT(v);
    const i = Math.min(BUS.length - 2, Math.floor(at));
    const k = at - i;
    const centre = (n: number) => ws.slice(0, n).reduce((s, w) => s + w + GAP, 0) + ws[n] / 2;
    const c = lerp(centre(i), centre(i + 1), inOut(k));
    return r.x + r.width / 2 - c;
  });
  const top = useTransform(a, (r) => r.y);
  const height = useTransform(a, (r) => r.height);
  return (
    <motion.div className="absolute inset-0" style={{ opacity }}>
      <motion.div className="absolute left-0 flex" style={{ top, height, x: shift, gap: GAP }}>
        {BUS.map((f, i) => (
          <BusFrame key={f.id} f={f} pos={BUS_POS[i]} a={a} upright={g.upright} />
        ))}
      </motion.div>
    </motion.div>
  );
}

function BusFrame({ f, pos, a, upright }: { f: Frame; pos: string; a: MotionValue<Rect>; upright: boolean }) {
  const width = useTransform(a, (r) => (upright ? r.width : r.height * f.aspect));
  return (
    <motion.div className="relative shrink-0 h-full" style={{ width }}>
      <Image src={f.src} alt="" fill sizes={upright ? "100vw" : "30vw"} className="object-cover" style={{ objectPosition: pos }} draggable={false} />
    </motion.div>
  );
}

/* ─────────────────────────────── the views ─────────────────────────────── */

/**
 * A view through the window. `fixed`: the photograph lies over the whole
 * screen and the window shows part of it (stepping out, the window opens on
 * the street); otherwise it fills the pane and moves with it, `drift`ing a
 * little sideways while it holds, as things do past a moving window.
 */
function Scene({ ctx, id, f, pos, rect, fixed = false, shade = false, drift = 0 }: { ctx: Ctx; id: string; f: Frame; pos: string; rect: MotionValue<Rect>; fixed?: boolean; shade?: boolean; drift?: number }) {
  const { q, reduced } = ctx;
  const [x, y] = shownDuring(id);
  const opacity = useTransform(q, ramp(x, y));
  const v = VIEWS.find((w) => w.id === id)!;
  const slide = useTransform(q, (p) => (reduced || !drift ? 0 : drift * lerp(-1.6, 1.6, clamp((p - v.from) / (v.to - v.from), 0, 1))));
  const left = useTransform(rect, (r) => (fixed ? 0 : r.x));
  const top = useTransform(rect, (r) => (fixed ? 0 : r.y));
  const width = useTransform(rect, (r) => (fixed ? ctx.box.w : r.width));
  const height = useTransform(rect, (r) => (fixed ? ctx.box.h : r.height));
  const shift = useTransform(slide, (s) => `${s}%`);
  return (
    <motion.div className="absolute overflow-hidden" style={{ left, top, width, height, opacity }}>
      <motion.div className="absolute inset-[-4%]" style={{ x: shift }}>
        <Image src={f.src} alt="" fill sizes={fixed || ctx.g.upright ? "100vw" : "40vw"} className="object-cover" style={{ objectPosition: pos }} draggable={false} />
      </motion.div>
      {/* Low shade for a note written over the photograph. */}
      {shade && <div className="absolute inset-0" style={{ background: "linear-gradient(to top right, rgba(12,10,8,0.55), rgba(12,10,8,0) 50%)" }} />}
    </motion.div>
  );
}

/* ─────────────────────────────── words ─────────────────────────────── */

/** The project's name over the first window, its subtitle under it; they leave as the ride starts. */
function Title({ ctx }: { ctx: Ctx }) {
  const { box, g, q, reduced } = ctx;
  const opacity = useTransform(q, ramp([0, 0.03, 0.06], [1, 1, 0]));
  const visibility = useTransform(opacity, (o) => (o > 0.01 ? "visible" : "hidden"));
  const size = Math.round(Math.max(44, Math.min(box.h * (g.upright ? 0.1 : 0.15), (box.w - 32) / (TEXT.title.length * 0.47), 150)));
  const short = !g.upright && box.h < 560;
  const letters = TEXT.title.toUpperCase().split("");
  return (
    <motion.div className="absolute inset-0 pointer-events-none" style={{ opacity, visibility, color: CREAM }}>
      <h1 className={`${display.className} absolute inset-x-0 flex justify-center uppercase leading-[0.84]`} style={{ top: Math.max(12, g.title.y - size - 14), fontSize: size }} aria-label={TEXT.title}>
        {letters.map((c, i) => (
          <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.02em]">
            <motion.span
              className="inline-block"
              initial={reduced ? false : { y: "108%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1.05, delay: 1.35 + i * 0.045, ease: [0.16, 1, 0.3, 1] }}
            >
              {c}
            </motion.span>
          </span>
        ))}
      </h1>
      <motion.p
        className="absolute inset-x-0 text-center text-[11px] sm:text-[12.5px] font-medium uppercase tracking-[0.2em]"
        style={{ top: g.title.y + g.title.height + 18 }}
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 1.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {TEXT.subtitle}
      </motion.p>
      {/* (On a phone held sideways, a shorter cue, low in the corner: clear of the window above it and of the home bar.) */}
      <div
        aria-hidden
        className={`absolute flex flex-col items-center ${short ? "gap-2" : "gap-3"} text-[10px] font-medium uppercase tracking-[0.24em]`}
        style={{ right: g.upright ? 16 : g.title.x, bottom: g.upright ? 24 : short ? "max(14px, env(safe-area-inset-bottom))" : box.h * 0.07 }}
      >
        <span>Scroll</span>
        <span className={`relative block w-px ${short ? "h-7" : "h-10"} overflow-hidden bg-white/40`}>
          {!reduced && <span className="absolute inset-x-0 top-0 h-4 bg-current animate-[chacaritaCue_2.2s_cubic-bezier(0.45,0,0.55,1)_infinite]" />}
        </span>
      </div>
      <style>{`@keyframes chacaritaCue { 0% { transform: translateY(-16px) } 70%, 100% { transform: translateY(40px) } }`}</style>
    </motion.div>
  );
}

/**
 * The observations along the ride, noted by hand: the cover's own words, each
 * where it belongs (under the couple in the bus, over the jacket in the
 * street, above the stencilled pavement). Each writes itself in as its view
 * arrives.
 */
function Observations({ ctx }: { ctx: Ctx }) {
  const { g, box } = ctx;
  const fs = g.upright ? 30 : clamp(box.w * 0.028, 26, 46);
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      <Note ctx={ctx} at={[0.185, 0.2]} out={[0.24, 0.26]} color={CREAM} size={fs} rotate={-5} style={{ left: 0, right: 0, textAlign: "center", top: g.ride.y + g.ride.height + (g.upright ? 16 : 14) }}>
        {TEXT.bus}
      </Note>
      <Note ctx={ctx} at={[0.29, 0.31]} out={[0.36, 0.38]} color={CREAM} size={fs * 1.35} rotate={-7} style={{ left: g.upright ? 20 : box.w * 0.07, bottom: g.upright ? 72 : box.h * 0.1, maxWidth: g.upright ? "80%" : "40%" }}>
        {TEXT.wearable}
      </Note>
      <Note ctx={ctx} at={[0.56, 0.58]} out={[0.63, 0.65]} color={INK} size={fs * 1.1} rotate={-6} style={g.upright ? { left: 20, right: 20, top: g.ground.y - fs * 2.6 } : { left: g.ground.x, top: g.ground.y - fs * 1.35, maxWidth: "60%" }}>
        {TEXT.ground}
      </Note>
    </div>
  );
}

function Note({ ctx, at, out, color, size, rotate, style, children }: { ctx: Ctx; at: [number, number]; out: [number, number]; color: string; size: number; rotate: number; style: CSSProperties; children: ReactNode }) {
  const { q, reduced } = ctx;
  const opacity = useTransform(q, ramp([at[0] - 0.01, at[0], out[0], out[1]], [0, 1, 1, 0]));
  // Written in from the left (scrubbed); with reduced motion, simply there.
  const clip = useTransform(q, (v) => (reduced ? "none" : `inset(-20% ${(100 - clamp((v - at[0]) / (at[1] - at[0]), 0, 1) * 105).toFixed(1)}% -20% -5%)`));
  return (
    <motion.p className={`${hand.className} absolute uppercase leading-[0.98] tracking-[0.02em]`} style={{ ...style, opacity, fontSize: size, color, rotate }}>
      <motion.span className="inline-block" style={{ clipPath: clip }}>
        {children}
      </motion.span>
    </motion.p>
  );
}

/* ─────────────────────────────── the film ─────────────────────────────── */

/**
 * Where the ride ends the window is a screen: the film's first frame, waiting.
 * It plays when asked, as a screening (the window opens to the film's own
 * size, the page holds still); it is silent, as the film is.
 */
function Screen({ ctx, rect, playing, onEnded }: { ctx: Ctx; rect: MotionValue<Rect>; playing: boolean; onEnded: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [x, y] = shownDuring("film");
  const opacity = useTransform(ctx.q, ramp(x, y));
  const left = useTransform(rect, (r) => r.x);
  const top = useTransform(rect, (r) => r.y);
  const width = useTransform(rect, (r) => r.width);
  const height = useTransform(rect, (r) => r.height);
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (playing) {
      v.currentTime = 0;
      v.play().catch(() => onEnded());
    } else v.pause();
  }, [playing, onEnded]);
  return (
    <motion.div className="absolute inset-0 bg-black" style={{ opacity }}>
      <motion.video
        ref={video}
        className="absolute object-cover bg-black"
        style={{ left, top, width, height }}
        poster={FILM.poster}
        muted
        playsInline
        preload="none"
        onEnded={onEnded}
        aria-label={FILM.alt}
      >
        <source src={FILM.mp4} type="video/mp4" />
        <source src={FILM.webm} type="video/webm" />
      </motion.video>
    </motion.div>
  );
}

function FilmControl({ ctx, playing, onPlay, onStop }: { ctx: Ctx; playing: boolean; onPlay: () => void; onStop: () => void }) {
  const { q, g } = ctx;
  const [x, y] = shownDuring("film");
  const opacity = useTransform(q, ramp(x, y));
  const visibility = useTransform(opacity, (o) => (o > 0.05 ? "visible" : "hidden"));
  const top = playing ? g.cinema.y + g.cinema.height + 16 : g.film.y + g.film.height + 18;
  return (
    <motion.div className="absolute inset-x-0 flex flex-col items-center gap-3" style={{ opacity, visibility, top: Math.min(top, ctx.box.h - 56), color: CREAM }}>
      {!playing && <p className="text-[10.5px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-white/70">{TEXT.title}, the film</p>}
      <button
        onClick={playing ? onStop : onPlay}
        className="inline-flex items-center gap-2.5 border border-current px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.18em] outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-4 focus-visible:ring-offset-black active:scale-[0.97] transition-transform duration-150"
      >
        <span aria-hidden className="relative block w-2 h-2.5">
          {playing ? (
            <>
              <span className="absolute left-0 top-0 h-full w-[2.5px] bg-current" />
              <span className="absolute right-0 top-0 h-full w-[2.5px] bg-current" />
            </>
          ) : (
            <span className="absolute inset-0 bg-current" style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }} />
          )}
        </span>
        {playing ? "Stop the film" : "Play the film"}
      </button>
    </motion.div>
  );
}

/* ─────────────────────────────── the end ─────────────────────────────── */

function End({ box, onClose }: { box: Box; onClose: () => void }) {
  const wide = box.w >= 760;
  return (
    <section aria-label="End" className="flex flex-col items-center text-center" style={{ background: PAPER, color: INK, padding: wide ? `${box.h * 0.16}px 0` : "88px 0 96px" }}>
      <p className={`${display.className} uppercase leading-[0.82]`} style={{ fontSize: wide ? clamp(box.w * 0.07, 56, 120) : 64 }}>
        {TEXT.title}
      </p>
      <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.2em] text-black/65">{TEXT.subtitle}</p>
      <button
        onClick={onClose}
        className="mt-12 inline-flex items-center gap-4 border-b border-black/50 pb-1.5 uppercase tracking-[0.2em] text-[11px] font-medium outline-none hover:border-black focus-visible:ring-2 focus-visible:ring-black/70 focus-visible:ring-offset-4 focus-visible:ring-offset-[#ede7dc]"
      >
        <span aria-hidden className="block h-px w-8 bg-current" />
        Back to the desk
      </button>
    </section>
  );
}

/** The ride for a screen reader: every photograph, in order, with the observations where they fall. */
function Route() {
  return (
    <ol className="sr-only">
      <li>{FRAMES.busStanding.alt}</li>
      <li>{FRAMES.busDriver.alt}</li>
      <li>
        {TEXT.bus}: {FRAMES.busCouple.alt}
      </li>
      <li>
        {TEXT.wearable}: {FRAMES.cupsJacket.alt}
      </li>
      <li>{FRAMES.cafeStanding.alt}</li>
      <li>{FRAMES.cafeSeated.alt}</li>
      <li>
        {TEXT.ground}: {FRAMES.ground.alt}
      </li>
      <li>{FRAMES.redDoor.alt}</li>
      <li>{FRAMES.blueDoor.alt}</li>
    </ol>
  );
}
