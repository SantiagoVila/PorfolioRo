"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform, type MotionStyle } from "framer-motion";
import { Montserrat } from "next/font/google";
import type { ExperienceProps } from "../experiences";
import { fillRect, handoffAspect } from "../transitionGeometry";
import { useBox, type Box } from "../useBox";
import { useKeyboardScroll } from "../useKeyboardScroll";
import { COUPLE_FOCUS, COVER, CROPS, FILM, FRAMES, TEXT, type Frame } from "./chacaritaContent";

/**
 * CHACARITA is a takeover, not a study: two styled bodies occupy the barrio's
 * ordinary frames (two doorways, the street, a café table, the night bus,
 * the pavement), told in large, flash-bright photographs whose pairings,
 * scale and one change of light carry the story, ending at the feet on the
 * pavement.
 *
 * The cover opens it and steps back into a page. Then the two doorways side
 * by side at full height, the loudest colour first; the street, where the
 * project's film (its one moving image) runs beside the cup jacket's
 * photograph; the café, smaller and quieter; night, which the bus
 * photographs bring with them: each figure alone, then the couple, larger
 * than the screen; and the pavement, the last photograph. The only words are
 * the cover's own; the signage in the photographs does the rest.
 */

// The cover's typeface.
const display = Montserrat({ subsets: ["latin"], weight: ["300", "500"], display: "swap", preload: false });

// The transition fills the screen using the desk book's proportions; the cover
// here starts in exactly that box so it lands on the same pixels.
const HANDOFF_ASPECT = handoffAspect("chacarita");

const DAY = "#f6f5f2";
const INK = "#141414";
/** The night inside the bus. */
const NIGHT = "#0f1012";
/** Scroll spent settling the cover, in screens: an opener, not an act. */
const SETTLE = 0.42;

type Ctx = {
  scroller: RefObject<HTMLDivElement | null>;
  box: Box;
  reduced: boolean;
  /** Landscape layouts (pairs side by side); otherwise portrait pages. */
  wide: boolean;
  /** Page margin. */
  m: number;
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** `sizes` for next/image from a rendered width. */
const vw = (px: number, box: Box) => `${Math.max(10, Math.round((px / box.w) * 100))}vw`;
const FILM_ASPECT = FILM.width / FILM.height;

export default function ChacaritaExperience({ onClose }: ExperienceProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const box = useBox(scroller);
  const reduced = !!useReducedMotion();
  const wide = box.w / box.h >= 1 && box.w >= 700;
  const m = wide ? Math.round(clamp(box.w * 0.035, 28, 64)) : 20;
  useKeyboardScroll(scroller, box.h);
  const ctx: Ctx = { scroller, box, reduced, wide, m };

  return (
    <div
      ref={scroller}
      tabIndex={0}
      aria-label={`${TEXT.title}: ${TEXT.subtitle}. Scroll to explore.`}
      className={`${display.className} absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain outline-none`}
      style={{ background: DAY, color: INK }}
    >
      <Cover ctx={ctx} />
      <Doorways ctx={ctx} />
      <Street ctx={ctx} />
      <Cafe ctx={ctx} />
      <Night ctx={ctx} />
      <Pavement ctx={ctx} onClose={onClose} />
    </div>
  );
}

/* ─────────────────────────────── pieces ─────────────────────────────── */

type Crop = readonly [number, number, number, number];

/**
 * A photograph at `width`, whole or cut to `crop` (fractions of the frame:
 * x0, y0, x1, y1). Hard edges, no frame.
 */
function Plate({ f, width, box, crop = [0, 0, 1, 1], eager = false, style }: { f: Frame; width: number; box: Box; crop?: Crop; eager?: boolean; style?: CSSProperties }) {
  const [x0, y0, x1, y1] = crop;
  const iw = width / (x1 - x0);
  const ih = iw / f.aspect;
  return (
    <div className="relative overflow-hidden shrink-0" style={{ width, height: ih * (y1 - y0), ...style }}>
      <div className="absolute" style={{ left: -x0 * iw, top: -y0 * ih, width: iw, height: ih }}>
        <Image src={f.src} alt={f.alt} fill sizes={vw(iw, box)} className="object-cover" loading={eager ? "eager" : "lazy"} draggable={false} />
      </div>
    </div>
  );
}

/** The crop that fills a `w`×`h` page with `f`, keeping the horizontal point `fx` in view. */
function pageCrop(f: Frame, w: number, h: number, fx = 0.5): Crop {
  if (w / h >= f.aspect) {
    const k = (f.aspect * h) / w; // fraction of the height that shows
    return [0, (1 - k) / 2, 1, (1 + k) / 2];
  }
  const k = w / h / f.aspect; // fraction of the width that shows
  const x0 = clamp(fx - k / 2, 0, 1 - k);
  return [x0, 0, x0 + k, 1];
}

/** A caption set the way the cover sets its own: small capitals under the picture. */
function Caption({ children, light = false, style }: { children: ReactNode; light?: boolean; style?: CSSProperties }) {
  return (
    <p className={`font-medium uppercase tracking-[0.14em] text-[10px] sm:text-[11px] ${light ? "text-white/60" : "text-black/60"}`} style={style}>
      {children}
    </p>
  );
}

/* ─────────────────────────────── the cover ─────────────────────────────── */

/**
 * The handoff frame (the cover filling the screen, exactly where the desk
 * transition left it) steps back into the whole printed page within a short
 * scroll, then leaves with the page.
 */
function Cover({ ctx }: { ctx: Ctx }) {
  const { box, reduced, wide, scroller } = ctx;
  const ref = useRef<HTMLElement>(null);
  const F = fillRect(HANDOFF_ASPECT, box.fw, box.h);
  const fitH = wide ? box.h * 0.84 : Math.min(box.h * 0.72, (box.w - 48) / HANDOFF_ASPECT);
  const fit = { x: (box.w - fitH * HANDOFF_ASPECT) / 2, y: (box.h - fitH) / 2, k: fitH / F.height };
  const { scrollYProgress } = useScroll({ container: scroller, target: ref, offset: ["start start", "end end"] });
  // Function transforms: framer's native ViewTimeline path mistracks nested scrollers (see app/page.tsx).
  const transform = useTransform(scrollYProgress, (v) => {
    const t = ease(clamp(v / 0.9, 0, 1));
    const x = F.x + (fit.x - F.x) * t;
    const y = F.y + (fit.y - F.y) * t;
    const k = 1 + (fit.k - 1) * t;
    return `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${k.toFixed(5)})`;
  });
  const hint = useTransform(scrollYProgress, (v) => 1 - clamp(v / 0.15, 0, 1));

  const cover = (style: MotionStyle) => (
    <motion.div
      className="absolute left-0 top-0 origin-top-left"
      style={{ width: F.width, height: F.height, boxShadow: "0 30px 80px -30px rgba(40, 30, 20, 0.4)", willChange: "transform", ...style }}
    >
      <Image src={COVER.src} alt={`${TEXT.title.toUpperCase()}: ${TEXT.subtitle} (cover)`} fill sizes={vw(reduced ? fitH * HANDOFF_ASPECT : F.width, box)} className="object-cover" loading="eager" draggable={false} />
    </motion.div>
  );

  if (reduced) {
    return (
      // The ref stays attached so the scroll hook above has its target (it is simply unused here).
      <section ref={ref} aria-label="Cover" className="relative overflow-hidden" style={{ height: box.h }}>
        {cover({ transform: `translate3d(${fit.x}px, ${fit.y}px, 0) scale(${fit.k})` })}
      </section>
    );
  }
  return (
    <section ref={ref} aria-label="Cover" className="relative" style={{ height: box.h * (1 + SETTLE) }}>
      <div className="sticky top-0 overflow-hidden" style={{ height: box.h }}>
        {cover({ transform })}
        <motion.p
          aria-hidden
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium tracking-[0.2em] uppercase text-white mix-blend-difference"
          style={{ opacity: hint }}
        >
          Scroll
        </motion.p>
      </div>
    </section>
  );
}

/* ─────────────────────────────── the doorways ─────────────────────────────── */

/**
 * The two doorways side by side, same height, touching like two houses on
 * one block: the red door with the cup jacket, the blue door with the lace
 * skirt. On portrait screens each is cut at its door frame so the pair still
 * stands together.
 */
function Doorways({ ctx }: { ctx: Ctx }) {
  const { box, wide, m } = ctx;
  const { redDoor: red, blueDoor: blue } = FRAMES;
  if (!wide) {
    const [r0, r1] = CROPS.redDoor;
    const [b0, b1] = CROPS.blueDoor;
    const aR = red.aspect * (r1 - r0);
    const aB = blue.aspect * (b1 - b0);
    const h = box.w / (aR + aB);
    return (
      <section aria-label="Two doorways" className="relative" style={{ paddingTop: 12, paddingBottom: 28 }}>
        <div className="flex">
          <Plate f={red} width={h * aR} box={box} crop={[r0, 0, r1, 1]} eager />
          <Plate f={blue} width={h * aB} box={box} crop={[b0, 0, b1, 1]} eager />
        </div>
        <Caption style={{ padding: `14px ${m}px 0` }}>{TEXT.wearable}</Caption>
      </section>
    );
  }
  const capH = 48;
  const ph = Math.min(box.h - capH, (box.w - m * 2) / (red.aspect + blue.aspect));
  const left = (box.w - ph * (red.aspect + blue.aspect)) / 2;
  return (
    <section aria-label="Two doorways" className="relative" style={{ height: ph + capH }}>
      <div className="absolute top-0 flex" style={{ left }}>
        <Plate f={red} width={ph * red.aspect} box={box} eager />
        <Plate f={blue} width={ph * blue.aspect} box={box} eager />
      </div>
      <Caption style={{ position: "absolute", left, top: ph + 16 }}>{TEXT.wearable}</Caption>
    </section>
  );
}

/* ─────────────────────────────── the street ─────────────────────────────── */

/**
 * The street: the project's film, its one moving image, beside the cup
 * jacket walking the same kind of street in a still. The film is never shown
 * larger than its own picture.
 */
function Street({ ctx }: { ctx: Ctx }) {
  const { box, wide, m } = ctx;
  const cups = FRAMES.cupsJacket;
  if (!wide) {
    const fw = Math.min(box.w, FILM.width);
    const sw = box.w * 0.8;
    return (
      <section aria-label="The street" className="relative" style={{ paddingTop: 28, paddingBottom: 36 }}>
        <Film ctx={ctx} width={fw} style={{ margin: "0 auto" }} controlStyle={{ padding: `4px ${m}px 0` }} />
        <Plate f={cups} width={sw} box={box} style={{ marginLeft: "auto", marginTop: 28 }} />
      </section>
    );
  }
  const sh = box.h - m * 2;
  const sw = sh * cups.aspect;
  const gap = Math.max(m, box.w * 0.035);
  const sLeft = box.w - m - sw;
  const fw = Math.min(FILM.width, sLeft - gap - m);
  const fh = fw / FILM_ASPECT;
  return (
    <section aria-label="The street" className="relative" style={{ height: box.h }}>
      <Film ctx={ctx} width={fw} style={{ position: "absolute", left: sLeft - gap - fw, top: m + (sh - fh) * 0.72 }} controlStyle={{ paddingTop: 4 }} />
      <Plate f={cups} width={sw} box={box} style={{ position: "absolute", left: sLeft, top: m }} />
    </section>
  );
}

/**
 * The film: muted, inline, no player chrome. Its files (and its poster) are
 * attached only when it comes within a screen of view; it plays while at least half of it is on
 * screen and pauses otherwise (and while the tab is hidden). With reduced
 * motion it rests on its poster until asked. One small control plays or
 * pauses it.
 */
function Film({ ctx, width, style, controlStyle }: { ctx: Ctx; width: number; style?: CSSProperties; controlStyle?: CSSProperties }) {
  const { scroller, reduced } = ctx;
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [seen, setSeen] = useState(false);
  const [choice, setChoice] = useState<"auto" | "play" | "pause">("auto");
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = ref.current;
    const root = scroller.current;
    if (!v || !root) return;
    const approach = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setNear(true);
        approach.disconnect();
      }
    }, { root, rootMargin: "100% 0px" });
    const view = new IntersectionObserver(([e]) => setSeen(e.intersectionRatio >= 0.5), { root, threshold: [0, 0.5, 1] });
    approach.observe(v);
    view.observe(v);
    return () => {
      approach.disconnect();
      view.disconnect();
    };
  }, [scroller]);

  const want = near && seen && (choice === "play" || (choice === "auto" && !reduced));
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const apply = () => {
      if (want && !document.hidden) v.play().catch(() => {});
      else v.pause();
    };
    apply();
    document.addEventListener("visibilitychange", apply);
    return () => document.removeEventListener("visibilitychange", apply);
  }, [want]);

  return (
    <figure className="shrink-0" style={{ width, ...style }}>
      <video
        ref={ref}
        muted
        playsInline
        loop
        preload={near ? "auto" : "none"}
        poster={near ? FILM.poster : undefined}
        aria-label={FILM.alt}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="block bg-[#1b1c1f]"
        style={{ width, height: width / FILM_ASPECT }}
      >
        {near && (
          <>
            <source src={FILM.mp4} type="video/mp4" />
            <source src={FILM.webm} type="video/webm" />
          </>
        )}
      </video>
      <div style={controlStyle}>
        <button
          onClick={() => setChoice(playing ? "pause" : "play")}
          aria-label={playing ? "Pause the film" : "Play the film"}
          className="inline-flex items-center gap-2.5 py-2 pr-3 font-medium uppercase tracking-[0.14em] text-[10px] sm:text-[11px] text-black/60 hover:text-black outline-none focus-visible:ring-2 focus-visible:ring-black/70 focus-visible:ring-offset-4 focus-visible:ring-offset-[#f6f5f2]"
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
          {playing ? "Pause" : "Play"}
        </button>
      </div>
    </figure>
  );
}

/* ─────────────────────────────── the café ─────────────────────────────── */

/** The two of them by day at a café: smaller, closer, with room around them. The pace drops. */
function Cafe({ ctx }: { ctx: Ctx }) {
  const { box, wide } = ctx;
  const { cafeStanding: standing, cafeSeated: seated } = FRAMES;
  if (!wide) {
    return (
      <section aria-label="The café" className="relative" style={{ paddingTop: 64, paddingBottom: 72 }}>
        <Plate f={standing} width={box.w * 0.6} box={box} style={{ marginLeft: box.w * 0.1 }} />
        <Plate f={seated} width={box.w * 0.5} box={box} style={{ marginLeft: "auto", marginRight: box.w * 0.1, marginTop: 24 }} />
      </section>
    );
  }
  const pad = box.h * 0.2;
  const drop = box.h * 0.12;
  const sh = box.h * 0.6;
  const kh = sh * 0.84;
  const gap = box.w * 0.045;
  const blockW = sh * standing.aspect + gap + kh * seated.aspect;
  const left = (box.w - blockW) / 2 - box.w * 0.06;
  return (
    <section aria-label="The café" className="relative" style={{ height: pad + sh + drop + pad }}>
      <Plate f={standing} width={sh * standing.aspect} box={box} style={{ position: "absolute", left, top: pad }} />
      <Plate f={seated} width={kh * seated.aspect} box={box} style={{ position: "absolute", left: left + sh * standing.aspect + gap, top: pad + sh - kh + drop }} />
    </section>
  );
}

/* ─────────────────────────────── night ─────────────────────────────── */

/**
 * Night comes in with the bus photographs: the ground turns dark from the
 * top edge of the first one, as if the picture brought it; each figure alone
 * in the bus, then the couple on the back seats, the largest picture of the
 * project, taller than the screen.
 */
function Night({ ctx }: { ctx: Ctx }) {
  const { box, wide, m } = ctx;
  const { busStanding: standing, busDriver: driver, busCouple: couple } = FRAMES;
  const ground = (y: number) => `linear-gradient(to bottom, ${DAY} 0px, ${DAY} ${y}px, ${NIGHT} ${y}px, ${NIGHT} 100%)`;
  if (!wide) {
    const [s0, s1] = CROPS.busStanding;
    const [d0, d1] = CROPS.busDriver;
    const aS = standing.aspect * (s1 - s0);
    const aD = driver.aspect * (d1 - d0);
    const gap = 6;
    const bandH = (box.w - gap) / (aS + aD);
    const top = 40;
    const ch = Math.max(box.h, box.w / couple.aspect);
    return (
      <section aria-label="Night, the bus" className="relative" style={{ paddingTop: top, paddingBottom: 56, background: ground(top) }}>
        <div className="flex" style={{ gap }}>
          <Plate f={standing} width={bandH * aS} box={box} crop={[s0, 0, s1, 1]} />
          <Plate f={driver} width={bandH * aD} box={box} crop={[d0, 0, d1, 1]} />
        </div>
        <Plate f={couple} width={box.w} box={box} crop={pageCrop(couple, box.w, ch, COUPLE_FOCUS)} style={{ marginTop: 56 }} />
        <Caption light style={{ padding: `14px ${m}px 0` }}>{TEXT.bus}</Caption>
      </section>
    );
  }
  const pad = box.h * 0.14;
  const ih = box.h * 0.7;
  const sw = ih * standing.aspect;
  const dw = ih * driver.aspect;
  const dDrop = box.h * 0.16;
  const ch = Math.min(box.h * 1.72, (box.w - m * 2) / couple.aspect);
  const cw = ch * couple.aspect;
  const cTop = pad + dDrop + ih + box.h * 0.22;
  return (
    <section aria-label="Night, the bus" className="relative" style={{ height: cTop + ch + 48 + box.h * 0.18, background: ground(pad) }}>
      <Plate f={standing} width={sw} box={box} style={{ position: "absolute", left: box.w * 0.16, top: pad }} />
      <Plate f={driver} width={dw} box={box} style={{ position: "absolute", left: box.w * 0.84 - dw, top: pad + dDrop }} />
      <Plate f={couple} width={cw} box={box} style={{ position: "absolute", left: (box.w - cw) / 2, top: cTop }} />
      <Caption light style={{ position: "absolute", left: (box.w - cw) / 2, top: cTop + ch + 16 }}>{TEXT.bus}</Caption>
    </section>
  );
}

/* ─────────────────────────────── the pavement ─────────────────────────────── */

/**
 * Daylight again, on the ground: the cup jacket's own shoes and polka-dot
 * socks stepping over footprints stencilled on the pavement. The story began
 * with a whole body framed by a door and ends at the feet. Then the cover's
 * name, small, and the way back.
 */
function Pavement({ ctx, onClose }: { ctx: Ctx; onClose: () => void }) {
  const { box, wide, m } = ctx;
  const g = FRAMES.ground;
  const pw = wide ? (box.h - m * 2) * g.aspect : box.w;
  const end = (
    <div className="flex flex-col items-center text-center" style={{ paddingTop: wide ? box.h * 0.14 : 64, paddingBottom: wide ? box.h * 0.14 : 72 }}>
      <p className="font-light uppercase leading-none tracking-[0.02em]" style={{ fontSize: wide ? clamp(box.w * 0.032, 30, 52) : 34 }}>
        {TEXT.title}
      </p>
      <p className="mt-3 font-medium uppercase tracking-[0.14em] text-[10px] sm:text-[11px] text-black/60">{TEXT.subtitle}</p>
      <button
        onClick={onClose}
        className="mt-10 inline-flex items-center gap-4 border-b border-black/50 pb-1.5 uppercase tracking-[0.2em] text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-black/70 focus-visible:ring-offset-4 focus-visible:ring-offset-[#f6f5f2]"
      >
        <span aria-hidden className="block h-px w-8 bg-current" />
        Back to the desk
      </button>
    </div>
  );
  return (
    <section aria-label="The pavement" className="relative" style={{ paddingTop: wide ? m : 0 }}>
      <div style={{ width: pw, margin: "0 auto" }}>
        <Plate f={g} width={pw} box={box} />
        <Caption style={{ padding: wide ? "14px 0 0" : `14px ${m}px 0` }}>{TEXT.ground}</Caption>
      </div>
      {end}
    </section>
  );
}
