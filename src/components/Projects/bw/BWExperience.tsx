"use client";

import { useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform, type MotionStyle } from "framer-motion";
import { Inter_Tight } from "next/font/google";
import type { ExperienceProps } from "../experiences";
import { fillRect, handoffAspect } from "../transitionGeometry";
import { useBox, type Box } from "../useBox";
import { useKeyboardScroll } from "../useKeyboardScroll";
import { ARMOUR_CROP, COVER_SRC, DETAILS, STILLS, WORDS, type Still } from "./bwContent";

/**
 * B&W / THE PUNK-CHIC EDIT is one body moving from armour to release: the
 * leather held shut and the hair braided, then the lace out and the hair
 * loose until the frames blur. It is told in monumental studio plates whose
 * cropping loosens as the model does, with no typography louder than the
 * cover's own label.
 *
 * The cover steps back into a page; the silhouette stands alone with room
 * around it; the armour pair is cut tight, centred and symmetrical, the
 * leather touching the edges, and its fists close the collar in a detail;
 * then the jacket opens on the chains, off to one side; a small, quiet hinge
 * of two hands (the ringed fist of the first look, the studded cuff of the
 * second); the release, asymmetric, with air, lace and hands leaving the
 * frame; the two moving frames, the largest, on black; and the cover's label,
 * small, where the page stops.
 *
 * The page is the studio's seamless paper: its tone follows each
 * photograph's own backdrop, darkening as the poses loosen, until black.
 */

const display = Inter_Tight({ subsets: ["latin"], weight: ["500", "800"], display: "swap", preload: false });

// The transition fills the screen using the desk book's proportions; the cover
// here starts in exactly that box so it lands on the same pixels.
const HANDOFF_ASPECT = handoffAspect("bw");

const INK = "#0b0b0b";
const BLACK = "#0a0a0a";
const grey = (g: number) => `rgb(${g}, ${g}, ${g})`;
/** The seamless paper, from one tone to the next. */
const paper = (from: number, to: number) => `linear-gradient(to bottom, ${grey(from)}, ${grey(to)})`;
/** Scroll spent settling the cover, in screens. */
const SETTLE = 0.42;

type Ctx = { scroller: RefObject<HTMLDivElement | null>; box: Box; portrait: boolean; reduced: boolean; m: number };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** `sizes` for next/image from a rendered width. */
const vw = (px: number, box: Box) => `${Math.max(10, Math.round((px / box.w) * 100))}vw`;
const aspectOf = (s: Still) => s.width / s.height;

type Crop = readonly [number, number, number, number];

/** A photograph as a print at `width`, whole or cut to `crop` (fractions: x0, y0, x1, y1). Hard edges, no frame. */
function Plate({ s, width, box, crop = [0, 0, 1, 1], style, eager = false }: { s: Still; width: number; box: Box; crop?: Crop; style?: CSSProperties; eager?: boolean }) {
  const [x0, y0, x1, y1] = crop;
  const iw = width / (x1 - x0);
  const ih = iw / aspectOf(s);
  return (
    <div className="relative overflow-hidden shrink-0" style={{ width, height: ih * (y1 - y0), ...style }}>
      <div className="absolute" style={{ left: -x0 * iw, top: -y0 * ih, width: iw, height: ih }}>
        <Image src={s.src} alt={s.alt} fill sizes={vw(iw, box)} className="object-cover" loading={eager ? "eager" : "lazy"} draggable={false} />
      </div>
    </div>
  );
}

const cropAspect = (s: Still, [x0, y0, x1, y1]: Crop) => (aspectOf(s) * (x1 - x0)) / (y1 - y0);

export default function BWExperience({ onClose }: ExperienceProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const box = useBox(scroller);
  const reduced = !!useReducedMotion();
  const portrait = box.w / box.h < 1 || box.w < 700;
  const m = portrait ? 20 : Math.round(clamp(box.w * 0.03, 24, 56));
  useKeyboardScroll(scroller, box.h, { space: true });

  const ctx: Ctx = { scroller, box, portrait, reduced, m };
  return (
    <div
      ref={scroller}
      tabIndex={0}
      aria-label={`${WORDS.title}: ${WORDS.edit}. Scroll to explore.`}
      className={`${display.className} absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain outline-none`}
      style={{ background: grey(242), color: INK }}
    >
      <Cover ctx={ctx} />
      <Silhouette ctx={ctx} />
      <Armour ctx={ctx} />
      <Opening ctx={ctx} />
      <Hinge ctx={ctx} />
      <Release ctx={ctx} />
      <Motion ctx={ctx} onClose={onClose} />
    </div>
  );
}

/* ─────────────────────────────── cover ─────────────────────────────── */

/**
 * The handoff frame (the cover filling the screen, exactly where the desk
 * transition left it) steps back into the whole page within a short scroll.
 */
function Cover({ ctx }: { ctx: Ctx }) {
  const { box, reduced, portrait, scroller } = ctx;
  const ref = useRef<HTMLElement>(null);
  const F = fillRect(HANDOFF_ASPECT, box.fw, box.h);
  const fitH = portrait ? Math.min(box.h * 0.72, (box.w - 48) / HANDOFF_ASPECT) : box.h * 0.84;
  const fit = { x: (box.w - fitH * HANDOFF_ASPECT) / 2, y: (box.h - fitH) / 2, k: fitH / F.height };
  const { scrollYProgress } = useScroll({ container: scroller, target: ref, offset: ["start start", "end end"] });
  // Function transform: framer's native ViewTimeline path mistracks nested scrollers (see app/page.tsx).
  const transform = useTransform(scrollYProgress, (v) => {
    const t = ease(clamp(v / 0.9, 0, 1));
    const x = F.x + (fit.x - F.x) * t;
    const y = F.y + (fit.y - F.y) * t;
    const k = 1 + (fit.k - 1) * t;
    return `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${k.toFixed(5)})`;
  });
  const cover = (style: MotionStyle) => (
    <motion.div className="absolute left-0 top-0 origin-top-left" style={{ width: F.width, height: F.height, willChange: "transform", ...style }}>
      <Image src={COVER_SRC} alt={`${WORDS.title}: ${WORDS.edit} (cover)`} fill sizes={vw(reduced ? fitH * HANDOFF_ASPECT : F.width, box)} className="object-cover" loading="eager" draggable={false} />
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
      </div>
    </section>
  );
}

/* ─────────────────────────────── silhouette ─────────────────────────────── */

/** The whole look, alone: the black leather volume over the white tiers, with room around it. */
function Silhouette({ ctx }: { ctx: Ctx }) {
  const { box, portrait } = ctx;
  const s = STILLS.walk;
  if (portrait) {
    const pw = box.w * 0.62;
    return (
      <section aria-label="Silhouette" className="relative" style={{ padding: "48px 0 72px", background: paper(242, s.backdrop) }}>
        <Plate s={s} width={pw} box={box} style={{ marginLeft: box.w * 0.1 }} />
      </section>
    );
  }
  const ph = box.h * 0.86;
  return (
    <section aria-label="Silhouette" className="relative" style={{ height: box.h, background: paper(242, s.backdrop) }}>
      <Plate s={s} width={ph * aspectOf(s)} box={box} style={{ position: "absolute", left: box.w * 0.16, top: (box.h - ph) / 2 }} />
    </section>
  );
}

/* ─────────────────────────────── armour ─────────────────────────────── */

/**
 * Front and back of the leather jacket, cut identically and tight, centred
 * and touching: the body contained. Then the two fists holding the collar
 * shut, centred, filling the height.
 */
function Armour({ ctx }: { ctx: Ctx }) {
  const { box, portrait, m } = ctx;
  const { front, back } = STILLS;
  const fists = DETAILS.fists;
  const a = cropAspect(front, ARMOUR_CROP.front);
  if (portrait) {
    return (
      <section aria-label="Armour" className="relative" style={{ paddingBottom: 6, background: paper(241, fists.backdrop) }}>
        <Plate s={front} width={box.w} box={box} crop={ARMOUR_CROP.front} />
        <Plate s={back} width={box.w} box={box} crop={ARMOUR_CROP.back} style={{ marginTop: 6 }} />
        <Plate s={fists} width={box.w} box={box} style={{ marginTop: 6 }} />
      </section>
    );
  }
  const ph = Math.min(box.h, (box.w - m * 2) / (a * 2));
  const left = (box.w - ph * a * 2) / 2;
  const fh = Math.min(box.h, (box.w - m * 2) / aspectOf(fists));
  return (
    <section aria-label="Armour" className="relative" style={{ background: paper(241, fists.backdrop) }}>
      <div className="relative" style={{ height: box.h }}>
        <div className="absolute flex" style={{ left, top: (box.h - ph) / 2 }}>
          <Plate s={front} width={ph * a} box={box} crop={ARMOUR_CROP.front} />
          <Plate s={back} width={ph * a} box={box} crop={ARMOUR_CROP.back} />
        </div>
      </div>
      <div className="relative" style={{ height: box.h }}>
        <Plate s={fists} width={fh * aspectOf(fists)} box={box} style={{ position: "absolute", left: (box.w - fh * aspectOf(fists)) / 2, top: (box.h - fh) / 2 }} />
      </div>
    </section>
  );
}

/* ─────────────────────────────── opening ─────────────────────────────── */

/** The jacket opens on the chains: the first crack, set off to one side. */
function Opening({ ctx }: { ctx: Ctx }) {
  const { box, portrait } = ctx;
  const s = DETAILS.chains;
  if (portrait) {
    return (
      <section aria-label="Opening" className="relative" style={{ paddingTop: 48, paddingBottom: 48, background: grey(s.backdrop) }}>
        <Plate s={s} width={box.w * 0.94} box={box} />
      </section>
    );
  }
  const ph = Math.min(box.h, (box.w * 0.72) / aspectOf(s));
  return (
    <section aria-label="Opening" className="relative" style={{ height: box.h, background: grey(s.backdrop) }}>
      <Plate s={s} width={ph * aspectOf(s)} box={box} style={{ position: "absolute", left: 0, top: (box.h - ph) / 2 }} />
    </section>
  );
}

/* ─────────────────────────────── hinge ─────────────────────────────── */

/**
 * Between the two looks, small and quiet: the ringed fist that opens the
 * jacket and the studded cuff under the cheek. The cover's tagline sits
 * under them at the cover's own size.
 */
function Hinge({ ctx }: { ctx: Ctx }) {
  const { box, portrait } = ctx;
  const { rings, cuff } = DETAILS;
  const gap = portrait ? 12 : box.w * 0.028;
  const sum = aspectOf(rings) + aspectOf(cuff);
  const hh = portrait ? (box.w * 0.8 - gap) / sum : box.h * 0.38;
  return (
    <section
      aria-label="Hinge"
      className="relative flex flex-col items-center justify-center"
      style={{ minHeight: portrait ? undefined : box.h * 0.95, padding: portrait ? "88px 0" : 0, background: paper(rings.backdrop, 220) }}
    >
      <div className="flex items-end" style={{ gap }}>
        <Plate s={rings} width={hh * aspectOf(rings)} box={box} />
        <Plate s={cuff} width={hh * aspectOf(cuff)} box={box} />
      </div>
      <Tagline style={{ marginTop: portrait ? 28 : 36 }}>{WORDS.radical.join(" ")}</Tagline>
    </section>
  );
}

/** Small capitals, the size the cover prints its words at. */
function Tagline({ children, light = false, style }: { children: ReactNode; light?: boolean; style?: CSSProperties }) {
  return (
    <p className={`font-medium uppercase tracking-[0.14em] text-[11px] sm:text-[12px] leading-[1.35] ${light ? "text-white/75" : "text-black/70"}`} style={style}>
      {children}
    </p>
  );
}

/* ─────────────────────────────── release ─────────────────────────────── */

/**
 * The second look, released: the arm up with the lace trailing, large and to
 * one side, reaching past the edge; the seated frame small and low on the
 * other; then the bullet belt under swinging ruffles, running off the page.
 */
function Release({ ctx }: { ctx: Ctx }) {
  const { box, portrait } = ctx;
  const { raised, seated } = STILLS;
  const belt = DETAILS.belt;
  if (portrait) {
    return (
      <section aria-label="Release" className="relative" style={{ paddingTop: 40, paddingBottom: 56, background: paper(220, belt.backdrop) }}>
        <Plate s={raised} width={box.w * 0.9} box={box} style={{ marginLeft: "auto" }} />
        <Plate s={seated} width={box.w * 0.56} box={box} style={{ marginLeft: box.w * 0.08, marginTop: 40 }} />
        <Plate s={belt} width={box.w} box={box} style={{ marginTop: 56 }} />
      </section>
    );
  }
  const rh = box.h;
  const rw = rh * aspectOf(raised);
  const sh = box.h * 0.5;
  const bw = box.w * 0.6;
  const bh = bw / aspectOf(belt);
  return (
    <section aria-label="Release" className="relative" style={{ background: paper(220, belt.backdrop) }}>
      <div className="relative overflow-hidden" style={{ height: box.h }}>
        <Plate s={raised} width={rw} box={box} style={{ position: "absolute", left: Math.min(box.w * 0.55, box.w - rw * 0.92), top: 0 }} />
        <Plate s={seated} width={sh * aspectOf(seated)} box={box} style={{ position: "absolute", left: box.w * 0.12, top: box.h * 0.42 }} />
      </div>
      <div className="relative" style={{ height: bh + box.h * 0.3 }}>
        <Plate s={belt} width={bw} box={box} style={{ position: "absolute", right: 0, top: box.h * 0.15 }} />
      </div>
    </section>
  );
}

/* ─────────────────────────────── motion ─────────────────────────────── */

/**
 * On black, the two frames where the model lets go: the turn, the hair
 * across the face, and the flight, the hair thrown up. The largest pictures
 * of the edit, uncropped. Then the cover's label, small, and the way back.
 */
function Motion({ ctx, onClose }: { ctx: Ctx; onClose: () => void }) {
  const { box, portrait, m } = ctx;
  const { turn, flight } = STILLS;
  const a = aspectOf(turn);
  const signOff = (
    <div className="flex flex-col items-center" style={{ paddingTop: portrait ? 88 : box.h * 0.16, paddingBottom: portrait ? 88 : box.h * 0.16 }}>
      {/* The cover's label: B&W, and the edit's name under it, set flush right. */}
      <div className="inline-flex flex-col items-end text-white">
        <p className="font-extrabold leading-[0.82] tracking-[-0.045em]" style={{ fontSize: portrait ? 56 : clamp(box.w * 0.045, 48, 80) }}>
          {WORDS.title}
        </p>
        <Tagline light style={{ marginTop: 10 }}>{WORDS.edit}</Tagline>
      </div>
      <button
        onClick={onClose}
        className="mt-14 inline-flex items-center gap-4 border-b border-white/50 pb-1.5 uppercase tracking-[0.2em] text-[11px] font-medium text-white/80 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-4 focus-visible:ring-offset-[#0a0a0a]"
      >
        <span aria-hidden className="block h-px w-8 bg-current" />
        Back to the desk
      </button>
    </div>
  );
  if (portrait) {
    return (
      <section aria-label="Motion" className="relative" style={{ paddingTop: 24, background: BLACK }}>
        <Plate s={turn} width={box.w} box={box} />
        <Plate s={flight} width={box.w} box={box} style={{ marginTop: 8 }} />
        {signOff}
      </section>
    );
  }
  const gap = 12;
  const ph = Math.min(box.h, (box.w - m * 2 - gap) / (a * 2));
  const left = (box.w - ph * a * 2 - gap) / 2;
  return (
    <section aria-label="Motion" className="relative" style={{ background: BLACK }}>
      <div className="relative" style={{ height: box.h }}>
        <div className="absolute flex" style={{ left, top: (box.h - ph) / 2, gap }}>
          <Plate s={turn} width={ph * a} box={box} />
          <Plate s={flight} width={ph * a} box={box} />
        </div>
      </div>
      {signOff}
    </section>
  );
}
